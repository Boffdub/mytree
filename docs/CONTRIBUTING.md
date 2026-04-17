# Contributing

## Running Tests

```bash
npm test
```

The test suite covers guest-to-auth data migration (`__tests__/migration.test.js`). These are unit tests with mocked Supabase — no live database or running server needed.

## Adding Questions

Questions are stored in `data/questions.js`. Each question has:

- `question` — the question text
- `options` — array of answer strings
- `correctAnswer` — index of the correct option
- `difficulty` — difficulty level
- `explanation` — shown after answering
- `source` — citation for the fact
- `category` — one of: `energy`, `transportation`, `food`, `carbon`

You can edit `data/questions.js` directly or use the helper script:

```bash
node scripts/addQuestion.js
```

## Project Structure

```
MyTree/
├── App.js                        # App entry — navigation setup
├── app.json                      # Expo config (name, scheme, plugins)
├── index.js                      # Entry point
│
├── screens/                      # One file per screen
├── components/                   # Reusable UI components
├── context/                      # React context providers (Auth, Game)
├── services/                     # Supabase client, storage, migration
├── data/                         # Quiz questions
├── constants/                    # Colors and other constants
├── styles/                       # Shared style definitions
│
├── supabase/
│   ├── schema.sql                # Database schema and RLS policies
│   └── functions/
│       └── delete-account/       # Edge Function for account deletion
│
└── __tests__/                    # Test files
```

## Design Files

`Figma_Files/` contains screen mockups for reference. These are not used by the app at runtime — do not delete them.
