# MyTree

A climate trivia quiz app built with React Native and Expo. Answer questions about climate topics to grow your virtual tree!

## What is MyTree?

MyTree helps users learn about climate change through interactive quizzes. As you answer questions correctly, you grow a virtual tree representing your learning journey. Sign in with Apple, Google, or email to track your progress and customize your profile with a name and photo.

**Categories:** Energy · Transportation · Food & Agriculture · Carbon Removal

## Technology Stack

- **React Native** + **Expo** (SDK 54) — mobile app framework
- **Supabase** — auth (Apple, Google, and email magic-link sign-in), Postgres database, Storage (profile photos), Edge Functions
- **AsyncStorage** — persists the signed-in auth session between app launches
- **React Navigation** — screen routing
- **Expo Linear Gradient** — UI components
- **Expo Image Picker** / **Expo File System** — profile photo selection and upload
- **React Native WebView** — in-app Privacy Policy / Terms of Service pages (native builds only — not supported on web)
- **Resend** — sends an email notification (via a Supabase Database Webhook → Edge Function) whenever feedback is submitted through the app

## Documentation

- [Setting up locally](docs/SETUP.md) — prerequisites, environment variables, Supabase config
- [Running the app](docs/RUNNING.md) — web, iOS dev build, available scripts, troubleshooting
- [Contributing](docs/CONTRIBUTING.md) — adding questions, running tests, project structure

## License

This project is private.
