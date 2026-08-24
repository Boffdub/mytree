# Authentication & Persistence Design

**Date:** 2026-04-15
**Status:** Approved
**Scope:** Guest mode, Supabase auth (Apple + Google + magic link email), data persistence, account deletion

---

## 1. Overview

MyTree currently stores score as in-memory React state. All progress is lost on app restart. This design adds:

- **Guest mode** with local persistence (AsyncStorage)
- **Supabase authentication** (Sign in with Apple, Google, and magic link email)
- **Server-side persistence** for authenticated users (Supabase Postgres)
- **Auto-merge migration** from guest to authenticated
- **Account deletion** (required for App Store)

## 2. Architecture

```
+---------------------------------------------+
|              React Native App                |
|                                              |
|  +----------+   +-----------------------+   |
|  |  Screens  |-->|  AuthContext           |   |
|  |           |   |  - mode: guest | auth  |   |
|  |           |   |  - user: null | User   |   |
|  |           |   |  - session: null | Ses  |   |
|  +----------+   +-----------+-----------+   |
|                              |               |
|                 +------------v------------+  |
|                 |   GameContext            |  |
|                 |   (replaces AppContext)  |  |
|                 |   - score               |  |
|                 |   - answeredQuestions    |  |
|                 +-----------+-------------+  |
|                              |               |
|              +---------------v------------+  |
|              |   StorageService            |  |
|              |   - guest? -> AsyncStorage  |  |
|              |   - auth?  -> Supabase      |  |
|              +---------------+------------+  |
|                              |               |
+------------------------------+---------------+
                               |
                    +----------v----------+
                    |     Supabase         |
                    |  - Auth (Apple,      |
                    |    Google, Magic Link)|
                    |  - Postgres DB       |
                    |  - RLS policies      |
                    +---------------------+
```

Screens interact only with `AuthContext` and `GameContext`. They do not know whether the user is a guest or authenticated. The `StorageService` layer routes reads/writes to AsyncStorage or Supabase based on auth state.

### Context split

The current `AppContext` is replaced by two contexts:

- **AuthContext** -- manages auth state, login/logout methods, session persistence
- **GameContext** -- manages game state (tree score, question history), exposes the same `incrementScore`/`decrementScore`/`resetScore` API that screens already use. The tree score (0-5) remains a single global value as it is today. Per-session scores in `game_sessions` are for historical tracking and future leaderboards, not displayed in the main UI

## 3. Supabase Schema

### 3.1 `profiles`

Extends Supabase's built-in `auth.users`. Auto-created via a database trigger on user sign-up.

| Column       | Type          | Notes                              |
|-------------|---------------|-------------------------------------|
| id          | UUID (PK)     | References `auth.users.id`          |
| display_name| TEXT          | Nullable. From Apple/Google or email prefix |
| avatar_url  | TEXT          | Nullable                            |
| created_at  | TIMESTAMPTZ   | Default `now()`                     |
| updated_at  | TIMESTAMPTZ   | Default `now()`                     |

### 3.2 `game_sessions`

One row per quiz playthrough (one category run).

| Column       | Type          | Notes                               |
|-------------|---------------|--------------------------------------|
| id          | UUID (PK)     | Generated                            |
| user_id     | UUID (FK)     | References `profiles.id`             |
| category    | TEXT          | `energy`, `transportation`, `foodAgriculture`, `carbonRemoval` |
| score       | INTEGER       | Number of correct answers in this session (0 to number of questions in category) |
| started_at  | TIMESTAMPTZ   | Default `now()`                      |
| completed_at| TIMESTAMPTZ   | Nullable. Null if abandoned          |

### 3.3 `question_attempts`

One row per question answered.

| Column          | Type          | Notes                              |
|----------------|---------------|-------------------------------------|
| id             | UUID (PK)     | Generated                           |
| session_id     | UUID (FK)     | References `game_sessions.id`       |
| user_id        | UUID (FK)     | References `profiles.id` (denormalized for leaderboard queries) |
| category       | TEXT          | Category key                        |
| question_id    | INTEGER       | Matches `question.id` in local data |
| selected_answer| INTEGER       | 0-3                                 |
| is_correct     | BOOLEAN       |                                     |
| answered_at    | TIMESTAMPTZ   | Default `now()`                     |

### 3.4 Row Level Security

All three tables:
- `SELECT` where `auth.uid() = user_id`
- `INSERT` where `auth.uid() = user_id`
- `UPDATE` where `auth.uid() = user_id`
- `DELETE` where `auth.uid() = user_id`

No cross-user reads. When leaderboards are added later, a Postgres view or function will expose only `display_name` + aggregate score without granting access to full question history.

### 3.5 Database trigger

On `auth.users` insert, auto-create a `profiles` row:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 4. Auth Flow

### 4.1 App launch

1. App starts, checks `supabase.auth.getSession()`
2. If valid session exists -> navigate to Home screen (authenticated)
3. If no session -> navigate to Welcome screen

### 4.2 Welcome screen (new)

Displays:
- Sign in with Apple (button)
- Sign in with Google (button)
- Sign in with Email (button)
- Continue as Guest (text link)

### 4.3 Sign in with Apple / Google

1. User taps button
2. `expo-auth-session` opens native OAuth consent screen
3. On success, Supabase creates/retrieves user and returns session
4. App navigates to Home screen

### 4.4 Magic link email

1. User taps "Sign in with Email"
2. Input screen: "Enter your email address"
3. Call `supabase.auth.signInWithOtp({ email })`
4. Navigate to MagicLinkSent screen: "Check your email -- tap the link to sign in"
5. Deep link brings user back into the app with a valid session
6. App navigates to Home screen

### 4.5 Continue as Guest

1. Generate UUID via `expo-crypto`
2. Store `{ guestId, score: 0, sessions: [] }` in AsyncStorage under key `@mytree_guest_data`
3. Navigate to Home screen
4. All gameplay works normally with local storage

### 4.6 Session persistence

Supabase JS client auto-refreshes tokens and persists the session via AsyncStorage (built-in behavior with `@supabase/supabase-js` on React Native). On app relaunch, `getSession()` restores the user without re-authentication.

## 5. Guest Mode

### 5.1 Local data shape

Stored in AsyncStorage under key `@mytree_guest_data`:

```json
{
  "guestId": "uuid-v4",
  "score": 3,
  "sessions": [
    {
      "category": "energy",
      "startedAt": "2026-04-15T10:00:00Z",
      "answers": [
        { "questionId": 1, "selectedAnswer": 2, "isCorrect": false },
        { "questionId": 2, "selectedAnswer": 1, "isCorrect": true }
      ]
    }
  ]
}
```

### 5.2 Guest capabilities

- Full gameplay (all categories, all questions)
- Score persists across app restarts (AsyncStorage)
- Question history tracked locally
- Works fully offline

### 5.3 Guest limitations

- No cross-device sync
- No leaderboard participation (future)
- Data is device-locked

## 6. Guest-to-Authenticated Migration

### 6.1 When to prompt

Soft, dismissible prompts in two places:
- **Tree Screen**: small banner -- "Sign in to save your tree across devices"
- **After completing a category** (all 5 questions): modal -- "Nice work! Sign in to keep your progress"

Never forced. Never blocking gameplay.

### 6.2 Migration process

1. Guest taps sign-in from a prompt
2. Auth flow completes (Apple / Google / magic link)
3. Supabase account created, profile row auto-created via trigger
4. App reads local AsyncStorage guest data
5. For each session in local data:
   a. Insert `game_sessions` row
   b. Insert `question_attempts` rows for each answer
6. Clear AsyncStorage guest data
7. App now reads/writes from Supabase

### 6.3 Edge cases

- Guest plays across multiple sessions before signing up: all accumulated data migrates
- Guest has score 0 with no history: migration inserts profile only, no game data
- Migration fails mid-write: local data is not cleared until all writes succeed

## 7. StorageService

### 7.1 Interface

```javascript
StorageService
  saveAnswer(category, questionId, selectedAnswer, isCorrect)
  getAnsweredQuestions(category?) -> array of attempts
  getScore() -> number
  updateScore(newScore)
  startSession(category) -> sessionId
  completeSession(sessionId)
  clearAllData()
```

### 7.2 Routing

- Receives auth state as a parameter (not imported directly, keeps it testable)
- If `mode === "guest"`: reads/writes JSON blob in AsyncStorage under `@mytree_guest_data`
- If `mode === "auth"`: makes direct Supabase client calls

### 7.3 Error handling

- Guest mode: AsyncStorage errors are caught and logged. Gameplay continues with in-memory state.
- Auth mode: Supabase errors throw. App shows a connectivity error. No offline queue, no retry. Auth users require connectivity.

## 8. Offline Behavior

- **Guest users**: app works fully offline. All data in AsyncStorage.
- **Authenticated users**: connectivity required. If no connection, show an error state rather than silently losing data.
- No caching layer. No retry queue. Keeps implementation simple. Can be added later based on beta feedback.

## 9. Account Deletion

### 9.1 UI

Accessible from a new Settings screen (gear icon on Home screen).

Settings screen contents:
- **Authenticated users**: display name, email (read-only), "Sign Out" button, "Delete Account" button (red, at bottom)
- **Guest users**: "Playing as Guest", "Sign in to save your progress" button, "Reset Progress" option

### 9.2 Deletion flow

1. User taps "Delete Account"
2. Confirmation dialog: "This will permanently delete your account and all your progress. This cannot be undone." [Cancel] [Delete Account]
3. On confirm, call Supabase Edge Function `delete-account`
4. Edge Function (server-side, uses `service_role` key):
   a. Delete from `question_attempts` where `user_id` matches
   b. Delete from `game_sessions` where `user_id` matches
   c. Delete from `profiles` where `id` matches
   d. Delete from `auth.users` via `supabase.auth.admin.deleteUser()`
5. Client-side: clear local session, navigate to Welcome screen

### 9.3 Why an Edge Function

- Deleting from `auth.users` requires the `service_role` key
- The `service_role` key must never be on the client
- Guarantees all related data is cleaned up in one server-side operation

## 10. Navigation Structure

```
Current:                    New:
Stack Navigator             Stack Navigator
  Home                        Welcome (new -- auth options + guest)
  Category                    MagicLinkSent (new -- waiting for email)
  Question                    Home (existing -- now requires guest or auth)
  TreeAnimation               Category
  Answer                      Question
  Tree                        TreeAnimation
                              Answer
                              Tree
                              Settings (new -- account mgmt, deletion)
```

## 11. New Dependencies

| Package                                  | Purpose                              |
|------------------------------------------|--------------------------------------|
| `@supabase/supabase-js`                 | Supabase client                      |
| `@react-native-async-storage/async-storage` | Local persistence for guest mode |
| `react-native-url-polyfill`             | Required by Supabase on React Native |
| `expo-auth-session`                      | OAuth flows (Apple, Google)          |
| `expo-crypto`                            | Secure UUID generation for guest IDs |
| `expo-web-browser`                       | Opens OAuth consent screen           |

## 12. New & Modified Files

### New files

| File                                  | Purpose                                |
|---------------------------------------|----------------------------------------|
| `services/supabase.js`               | Supabase client initialization         |
| `services/storage.js`                | StorageService (routes guest/auth)     |
| `context/AuthContext.js`             | Auth state, login/logout, session      |
| `screens/WelcomeScreen.js`          | Auth options + guest entry             |
| `screens/MagicLinkSentScreen.js`    | Waiting for magic link confirmation    |
| `screens/SettingsScreen.js`         | Account management, sign out, deletion |
| `supabase/functions/delete-account/index.ts` | Edge Function for account deletion |
| `.env.example`                       | Documents required environment vars    |

### Modified files

| File                    | Change                                         |
|------------------------|-------------------------------------------------|
| `context/AppContext.js`| Renamed to `GameContext.js`, expanded to track question history, uses StorageService |
| `App.js`               | Add AuthContext provider, update navigation to include Welcome/MagicLinkSent/Settings screens |
| `screens/HomeScreen.js`| Add gear icon for Settings navigation           |
| `screens/TreeScreen.js`| Add sign-in prompt banner for guests             |
| `screens/AnswerScreen.js` | Call StorageService.saveAnswer after each question; show sign-in prompt after category completion |
| `screens/QuestionScreen.js` | Call StorageService.startSession at category start |
| `package.json`         | Add new dependencies                             |
| `app.json`             | Add deep link scheme for magic link + OAuth callbacks |

### Unchanged files

All other screens (`CategoryScreen.js`, `TreeAnimationScreen.js`), components (`TreeComponent.js`), data (`questions.js`), constants, and styles remain unchanged.

## 13. Supabase Project Setup (Dashboard)

These steps are performed in the Supabase dashboard, not in code:

1. Create a new Supabase project
2. Enable auth providers: Apple, Google, Email (magic link mode)
3. Configure Apple OAuth credentials (from Apple Developer account)
4. Configure Google OAuth credentials (from Google Cloud Console)
5. Run SQL to create tables (`profiles`, `game_sessions`, `question_attempts`)
6. Apply RLS policies to all three tables
7. Create the `handle_new_user` trigger function
8. Deploy the `delete-account` Edge Function
9. Copy `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env`

## 14. Leaderboard Readiness

Not built in this phase. The schema supports it without changes:

```sql
-- Future leaderboard query (no schema changes needed)
SELECT p.display_name, SUM(gs.score) AS total_score
FROM game_sessions gs
JOIN profiles p ON p.id = gs.user_id
WHERE gs.completed_at IS NOT NULL
GROUP BY p.id, p.display_name
ORDER BY total_score DESC
LIMIT 50;
```

When leaderboards are added, a Postgres view or RPC function exposes this query. RLS policy on the view allows read access to all authenticated users for the aggregated data only.
