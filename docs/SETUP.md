# Local Setup

## Prerequisites

Install these before anything else:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org/)
- **Xcode** (Mac only, required for iOS simulator) — install from the Mac App Store, then open it once to accept the license agreement
- **Expo CLI** — `npm install -g expo-cli` (or just use `npx expo` without installing globally)

## Getting the app running

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your `.env` file**
   ```bash
   cp .env.example .env
   ```

3. **Fill in the credentials** — get these from the project owner:
   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_ANON_KEY=...
   ```

That's it. The database, auth configuration, and backend are already set up on the shared Supabase project. See [RUNNING.md](RUNNING.md) to start the app.

---

## One-time project setup (already done — for reference only)

This section documents what was done to configure the Supabase project. You do not need to do any of this as a new developer joining the team.

### Database schema

The contents of `supabase/schema.sql` were applied in the Supabase SQL Editor. This created the `profiles`, `game_sessions`, and `question_attempts` tables with RLS policies.

### Auth providers

Configured in Supabase under **Authentication → Providers**:

- **Email**: enabled, magic link (OTP) flow
- **Google**: enabled with OAuth credentials from Google Cloud Console

### Redirect URLs

Added in Supabase under **Authentication → URL Configuration → Redirect URLs**:

- `mytree://auth-callback` (native deep link)
- `http://localhost:8081` (web dev server)

### Edge Function

A `delete-account` Edge Function exists in `supabase/functions/` but is not currently in use due to a platform-level incompatibility between Supabase Edge Functions and ES256 JWT tokens. Account deletion is handled via direct database deletion instead.
