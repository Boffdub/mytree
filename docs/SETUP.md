# Local Setup

## Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org/)
- **Xcode** (Mac only) — required for iOS dev build
- **Supabase account** — [supabase.com](https://supabase.com)
- **Supabase CLI** — `npm install -g supabase`

> **Expo Go will not work.** Auth uses a custom URL scheme (`mytree://`) for OAuth and magic link callbacks, which Expo Go does not support. See [RUNNING.md](RUNNING.md) for how to run a dev build.

## 1. Install Dependencies

```bash
npm install
```

## 2. Environment Variables

```bash
cp .env.example .env
```

Fill in your Supabase credentials — find these in your Supabase dashboard under **Project Settings → API**:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Database Schema

Run the contents of `supabase/schema.sql` in the Supabase **SQL Editor** (dashboard → SQL Editor → New query). This creates the `profiles`, `game_sessions`, and `question_attempts` tables with RLS policies.

## 4. Auth Providers

In your Supabase dashboard under **Authentication → Providers**:

- **Email**: enable, keep "Confirm email" on (this enables magic link / OTP flow)
- **Google**: enable, then:
  1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com) (OAuth 2.0 Client ID, type: Web)
  2. Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI in Google
  3. Paste the Client ID and Secret into Supabase

## 5. Redirect URLs

In Supabase under **Authentication → URL Configuration → Redirect URLs**, add:

- `mytree://auth-callback` (native deep link)
- `http://localhost:8081` (web dev server)

## 6. Deploy the Delete-Account Edge Function

```bash
supabase login
supabase link         # select your project when prompted
supabase functions deploy delete-account
```

Then add your **Service Role Key** as a secret — in the Supabase dashboard go to **Edge Functions → Manage secrets** and add:

```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service role key is found in **Project Settings → API → Service role key** (keep this secret — never put it in `.env` or commit it).
