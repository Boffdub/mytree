# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working with Brett

Brett is learning to code on this project — act as a tutor, not just a code generator. When making changes, explain the reasoning (what the bug/gap was, why the fix works, what would've broken otherwise), not just the diff. Don't assume he'll catch a subtly-broken change by reading it.

## What this is

MyTree — a React Native (Expo SDK 54) climate trivia quiz app. Users answer climate questions across four categories (Energy, Transportation, Food & Agriculture, Carbon Removal) to grow an animated virtual tree. Backend is Supabase (Postgres + Auth); there is no guest/offline mode — all progress requires a signed-in user.

## Commands

```bash
npm install              # install deps
cp .env.example .env     # then fill in EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY

npx expo start --web     # run in browser at localhost:8081 — easiest way to test auth flows
npx expo run:ios         # native iOS dev build (required for magic link / Google OAuth deep links;
                          # Expo Go does NOT support the mytree:// custom scheme)
npx expo start -c        # clear Metro cache when the bundle looks stale

npm test                 # run Jest suite (jest-expo preset, Supabase/AsyncStorage mocked — no live DB needed)
npm run test:watch
npx jest __tests__/storage.test.js   # run a single test file
```

Android is not configured (no `android/` directory) — use web or iOS.

`npx expo run:ios` destination errors: `xcrun simctl list devices available`, then `npx expo run:ios --device "iPhone 16 Plus"`.

## Architecture

**Navigation / mode gate.** [App.js](App.js) wraps everything in `AuthProvider` → `GameProvider` → a single React Navigation stack (no nested navigators, no guards on individual screens). `AuthContext`'s `mode` (`'loading' | 'welcome' | 'auth'`) decides the stack's `initialRouteName`: `welcome` → `Onboarding`, otherwise straight to `Home`. There is no `'guest'` mode — signing out always returns to `welcome`.

**Auth flow** ([context/AuthContext.js](context/AuthContext.js)). Supports Apple, Google, and email magic-link sign-in via Supabase, plus a `signInWithDevAccount()` shortcut gated on `__DEV__` (needs `EXPO_PUBLIC_DEV_EMAIL`/`EXPO_PUBLIC_DEV_PASSWORD` in `.env`, and only reachable from `WelcomeScreen` in dev builds). OAuth and magic-link redirects both terminate at `REDIRECT_URI` (`mytree://auth-callback` natively, the page origin on web); `parseSessionFromUrl` manually parses the `#access_token`/`#refresh_token` fragment and calls `supabase.auth.setSession()` — this runs both on cold start (`Linking.getInitialURL`) and on a live deep link event, so changes to the redirect/session logic need to be checked in both paths.

**Game state and persistence** ([context/GameContext.js](context/GameContext.js), [services/storage.js](services/storage.js)). `GameProvider` reads `auth.mode`/`auth.user` from `AuthContext` and constructs a `StorageService` per render. There is no local/offline persistence path — `StorageService` talks directly to three Supabase tables (`profiles`, `game_sessions`, `question_attempts`, defined in [supabase/schema.sql](supabase/schema.sql)). Note `getScore()`/score display is *derived* from the net count of correct vs. incorrect attempts (clamped 0–5), not stored as a column — `updateScore()` is a no-op for this reason. A `useAppContext` alias is kept in GameContext.js as a backwards-compat export; prefer `useGameContext` in new code.

**Quiz loop.** Screens flow `Category → Question → TreeAnimation → Answer → (Question | Tree)`. `TreeComponent` ([components/TreeComponent.js](components/TreeComponent.js)) renders the 5-layer tree from either a static `score` prop or an `Animated.Value` (`animatedValue`) for the grow/shrink transition shown on `TreeAnimationScreen`; the two render paths must stay in sync (`getLayerOpacity` vs. `layerOpacityInterpolation` use the same fill-from-bottom math).

**Questions** ([data/questions.js](data/questions.js)). Plain JS object keyed by category, each question has `id`, `question`, `options`, `correct` (index), `difficulty`, `explanation`, `source`, `sourceUrl`, `infographic`, `category`. Add questions by editing this file directly or via `node scripts/addQuestion.js`; `scripts/importQuestionsFromCsv.js` bulk-imports from `Climate Questions MASTER SHEET.csv`.

**Styling.** No theming library — `constants/colors.js` is the single source of color values (import `colors`, don't hardcode hex), and `styles/defaultStyles.js` exports shared font tokens (`fonts.regular/semiBold/bold`, mapped to the Montserrat family loaded in App.js).

**Supabase client** ([services/supabase.js](services/supabase.js)) reads `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_ANON_KEY` from env, but deliberately never throws if they're missing — it falls back to placeholder values so the app still boots to the welcome screen, and `isSupabaseConfigured()` is checked before auth calls. Auth session persistence uses AsyncStorage.

**Account deletion.** A `delete-account` Supabase Edge Function exists ([supabase/functions/delete-account/](supabase/functions/delete-account/)) but is currently unused — a platform incompatibility between Edge Functions and ES256 JWTs means account deletion is done via direct database deletion instead ([docs/SETUP.md](docs/SETUP.md)).

## In-flight state to know about

- `screens/RegisterScreen.js` exists but is **not wired into `App.js`'s navigator** and navigates to `'Register'`/`'Login'` routes that don't exist yet — treat it as work-in-progress, not a reachable screen.
- Guest-mode local storage and the `guest → auth` data migration path (`services/migration.js`, `__tests__/migration.test.js`) were removed; the app now requires sign-in before any progress is recorded. If you find references to a migration/guest flow elsewhere, check whether they're stale.
- `Figma_Files/` contains design mockups for reference only — not used at runtime, don't delete.
