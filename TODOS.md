# TODOS

Deferred work captured during planning. Each item has enough context to pick up cold.

## Tree progression epic (P2)

**What:** Redesign the tree growth system beyond the current 5-stage cap (`MAX_SCORE = 5` in `context/GameContext.js`).

**Why:** The 5-question tree is too short, and the tree is the core engagement loop. This is where the long-term game feel lives.

**Ideas raised:**
- Make the tree grow taller than 5 stages.
- Add incentives even after the tree is fully grown.
- Once one tree is fully grown, start a second tree.
- Different types / species of trees.

**Context:** The quiz/lifeline work (category quizzes, random order, difficulty, 50/50 + Shield) deliberately keeps the 5-stage loop so it stays decoupled from this redesign. Note the latent coupling the outside-voice review flagged: score persists across quizzes (it's the tree, loaded from storage), so "5 questions = 5 stages" is a coincidence, not a mechanism. This epic should define the real relationship between quiz results and tree growth.

**Depends on / blocked by:** Nothing. Independent of the current quiz/lifeline PR.

**Effort:** L (own design + eng cycle). Run `/office-hours` first.

---

## Hint lifeline revival (P3)

**What:** Add a `hint` field to all 150 questions in `data/questions.js` and re-enable the Hint lifeline.

**Why:** Hint was deferred from the quiz/lifeline build because the `explanation` field states the answer outright (e.g. explanation says "roughly 35%", correct option is "About 35%"), so a hint derived from it leaks the answer. A dedicated short, non-spoiler hint field fixes that.

**Context:** Reuse `scripts/generateQuestions.js` + `scripts/approveQuestions.js` to AI-draft hints, then approve them. Then restore Hint to the lifeline gating matrix: Easy = 3 (50/50 + Hint + Shield), Medium = 2 (50/50 + Hint), Hard = 1 (50/50). The gating logic and matrix already exist from the quiz/lifeline build — Hint just gets added back to the available-set per difficulty.

**Depends on / blocked by:** Question schema gaining a `hint` field. The lifeline framework (50/50, Shield) ships first in the quiz/lifeline PR.

**Effort:** M (150 AI-drafted hints + review + schema + re-wire gating).
