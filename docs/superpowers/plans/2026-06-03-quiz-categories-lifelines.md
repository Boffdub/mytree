# Plan: Category Quizzes, Random Order & Lifelines

Branch: feat/generated-questions
Status: APPROVED FOR IMPLEMENTATION (eng review + outside-voice review complete)
Self-contained: this doc has everything needed to implement without external context.

## Goal

Integrate the 150-question base (30 per category × 5 categories: energy, transportation,
foodAgriculture, carbonRemoval, solutions; each tagged Easy/Medium/Hard) into real quizzes:
divided by category, randomized per play, with difficulty selection and a lifeline system.

## Locked decisions

1. **Quiz unit:** one quiz = 5 questions drawn at random from the (category × difficulty) pool.
   The existing 5-stage tree growth loop (`MAX_SCORE = 5` in `context/GameContext.js`) is kept AS-IS.
   Tree-progression redesign is DEFERRED (see TODOS.md) — do not touch it.
2. **Difficulty does two things:** (a) filters the question pool by tag, (b) gates which lifelines
   are available. It does NOT affect tree-shrink.
3. **Difficulty picker:** new screen. Flow becomes `Home → Category → Difficulty (NEW) → Question`.
4. **Lifelines this build: 50/50 + Shield only** (Hint is DEFERRED — explanations leak the answer;
   needs a `hint` data field first, see TODOS.md). Each lifeline usable once per quiz.
   - 50/50 = hide 2 of the 3 wrong option indices. View state, computed once, stored per question index. Never mutate the question object.
   - Shield = protects the CURRENT question only; consumed on the next answer regardless of correctness; blocks the shrink only if that answer was wrong.
5. **Lifeline gating matrix:**
   | difficulty | lifelines |
   |---|---|
   | Easy | 50/50, Shield |
   | Medium | 50/50 |
   | Hard | 50/50 |
   Medium and Hard share a lifeline set; they differ only by question pool. Shield is Easy-only.
6. **Tree-shrink:** every wrong answer −1, all difficulties (UNCHANGED current behavior). Shield is the only block.
7. **State:** lives in an extended GameContext ("QuizSession"). Screens read from context, NOT nav params.

## Critical implementation gotchas (found in outside-voice review — do not skip)

- **Scoring fires in `TreeAnimationScreen`, NOT `AnswerScreen`.** TreeAnimation calls
  `incrementScore`/`decrementScore` and passes `scoreAlreadyUpdated: true`. So Shield MUST be consulted
  in TreeAnimation. Its `fromScore === toScore` fast-path currently still calls `decrementScore()` —
  a shielded wrong answer walks into it and shrinks anyway. Guard that path.
- **`questionIndex` changes meaning:** today it indexes the full category array; it becomes an index
  into the 5-element shuffled quiz array in context. Re-point everything keyed on it: `hasNextQuestion`,
  the progress bar `totalQuestions`, and the `scoredQuestionsRef` dedup key.
- **Question `id` is NOT globally unique** — ids 1-30 repeat in every category. Key everything on
  `(category, id)`, never `id` alone.
- **Dedup key collision → silent dropped saves.** `AnswerScreen` uses `${category}-${id}-${questionIndex}`.
  With ids repeating per category and quiz index resetting to 0-4 each quiz, replays can collide.
  Add a quiz id to the key: `${quizId}-${category}-${id}-${questionIndex}`.
- **Latent bug to fix:** `AnswerScreen.js` (~lines 38-42) has an inline category→key ternary that OMITS
  `solutions` ("Solutions & Action" falls through to an invalid dataKey). Consolidating the mapping fixes this.
- **Navigate-then-read race:** quiz is set in context by the Difficulty screen; QuestionScreen's effect
  may read stale context on first mount. Mirror the existing `currentSessionId` Submit-guard pattern.
- **Teardown:** `startQuiz` is the single reset point (resetQuiz == startQuiz). End-of-quiz buttons
  (`navigate('Category')`/`navigate('Home')`) clear nothing today, so reset on START, not end.

## Phase 1 — Pure logic (build + unit-test FIRST, no UI)

New files: `data/quiz.js`, `data/categoryMap.js` (or `constants/categories.js`).

- `mapCategoryToKey(displayName)` — canonical, single source of truth, includes ALL 5 incl.
  "Solutions & Action" → "solutions". Replace the copies in `QuestionScreen.js` and `AnswerScreen.js`.
- `getQuestions(category, difficulty)` — filter category pool by difficulty tag. Unknown category → [].
- `pickQuiz(pool, n = 5)` — Fisher-Yates shuffle + slice n. If pool < n, return whole pool (no crash).
- `LIFELINE_GATING = { Easy: ['5050','shield'], Medium: ['5050'], Hard: ['5050'] }`.
- `applyFiftyFifty(question)` — return 2 hidden WRONG option indices (never the correct one). No mutation.

Tests `__tests__/quiz.test.js`: each function + happy/empty/short-pool paths + the invariant that every
(category × difficulty) pool has ≥ 5 questions + every display name maps to a valid dataKey (solutions regression).

## Phase 2 — GameContext QuizSession

File: `context/GameContext.js`.

- State: `quizSession = { quizId, category, difficulty, questions: [], lifelinesAvailable: [],
  lifelinesUsed: {}, eliminatedByIndex: {}, shieldArmedForIndex: null }`.
- `startQuiz(category, difficulty)` — build pool, `pickQuiz`, set lifelines from gating, reset all
  per-quiz state, generate a fresh `quizId`, AND call `storage.startSession(category)`.
- `useLifeline(type, questionIndex)` — guard available + not used. 50/50 → store eliminated indices for
  that index. Shield → set `shieldArmedForIndex = questionIndex`. Mark used.
- `shouldShrink(questionIndex, isCorrect)` selector — wrong AND not (shield armed for this index).
  Consume shield after the answer regardless of correctness.

Tests `__tests__/quizSession.test.js` (include the 3 REGRESSION tests, flagged CRITICAL):
- startQuiz sets+resets everything — REGRESSION: new quiz clears prior lifelines/shield.
- useLifeline once-per-quiz; 2nd use no-op; reject unavailable (e.g. shield on Hard).
- shield arm/consume matrix (wrong+shield → no shrink+consume; correct+shield → consume, no save).
- shouldShrink truth table — REGRESSION: wrong + no shield still shrinks.
- base scoring path intact — REGRESSION: correct→+1, wrong→−1, last Q→completeSession.

## Phase 3 — Screens

Files: new `screens/DifficultyScreen.js`; edit `App.js`, `screens/CategoryScreen.js`,
`screens/QuestionScreen.js`, `screens/TreeAnimationScreen.js`, `screens/AnswerScreen.js`.

- `App.js` — register `Difficulty` route.
- `CategoryScreen` — navigate to `Difficulty` (carry category), not `Question`.
- `DifficultyScreen` — 3 buttons; on pick call `startQuiz` then navigate to `Question`; guard the race.
- `QuestionScreen` — read quiz from context; `questionIndex` indexes the 5-item quiz array; render only
  gated lifeline buttons; apply 50/50 (hide eliminated indices, stable across re-render); show spent lifelines.
- `TreeAnimationScreen` — consult `shouldShrink` before decrementing; fix the `fromScore===toScore`
  fast-path so a shielded wrong answer does NOT decrement; consume shield here.
- `AnswerScreen` — use the shared `mapCategoryToKey` (kills the broken ternary); dedup key includes `quizId`;
  progress/`hasNextQuestion` from `quizSession.questions.length`.

Screen-level RENDERING tests: SKIPPED by decision (no RNTL infra). Covered by manual QA.

## Phase 4 — Manual QA + ship

Verify in BOTH guest and auth modes:
- Category → difficulty → 5 random questions; order differs across plays.
- Lifelines gated correctly; 50/50 stable; spent state shows; Shield blocks shrink on Easy.
- The 3 regressions hold (base scoring, wrong-without-shield shrinks, new quiz resets state).
Then ship.

## Do NOT touch
- The tree growth / `MAX_SCORE` mechanic (deferred epic).
- The `scoredQuestionsRef` scoring guard structure (works; high blast radius) — only re-point its key.
- The `docs/` deployed build artifacts.
