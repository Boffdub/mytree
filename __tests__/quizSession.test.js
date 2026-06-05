jest.mock('../services/supabase', () => ({
  supabase: {},
  isSupabaseConfigured: () => false,
}));

import {
  buildQuizSession,
  createEmptyQuizSession,
  applyUseLifeline,
  calcShouldShrink,
  shouldClearSelection,
  shieldBannerState,
  LIFELINE_GATING,
} from '../data/quiz';

// ─── startQuiz / buildQuizSession ─────────────────────────────────────────────

describe('startQuiz (buildQuizSession)', () => {
  test('produces 5 questions from the requested category and difficulty', () => {
    const session = buildQuizSession('Energy', 'Easy');
    expect(session.questions).toHaveLength(5);
    session.questions.forEach((q) => expect(q.difficulty).toBe('Easy'));
    session.questions.forEach((q) => expect(q.category).toBe('energy'));
  });

  test('assigns a non-null quizId string', () => {
    const session = buildQuizSession('Transportation', 'Medium');
    expect(typeof session.quizId).toBe('string');
    expect(session.quizId.length).toBeGreaterThan(0);
  });

  test('sets lifelinesAvailable from LIFELINE_GATING', () => {
    const easy = buildQuizSession('Energy', 'Easy');
    expect(easy.lifelinesAvailable).toEqual(LIFELINE_GATING.Easy);

    const hard = buildQuizSession('Energy', 'Hard');
    expect(hard.lifelinesAvailable).toEqual(LIFELINE_GATING.Hard);
  });

  test('REGRESSION – new quiz clears prior lifelinesUsed and shield from previous session', () => {
    // Simulate a previous session that used lifelines
    const prev = buildQuizSession('Energy', 'Easy');
    const withUsed = applyUseLifeline(prev, 'shield', 0);
    const withBoth = applyUseLifeline(withUsed, '5050', 0);
    expect(withBoth.lifelinesUsed.shield).toBe(true);
    expect(withBoth.lifelinesUsed['5050']).toBe(true);
    expect(withBoth.shieldArmedForIndex).toBe(0);

    // New session should reset everything
    const next = buildQuizSession('Energy', 'Easy');
    expect(next.lifelinesUsed).toEqual({});
    expect(next.eliminatedByIndex).toEqual({});
    expect(next.shieldArmedForIndex).toBeNull();
  });

  test('two consecutive sessions get different quizIds', () => {
    const a = buildQuizSession('Energy', 'Easy');
    const b = buildQuizSession('Energy', 'Easy');
    expect(a.quizId).not.toBe(b.quizId);
  });

  test('works for all five categories and all three difficulties', () => {
    const categories = ['Energy', 'Transportation', 'Food & Agriculture', 'Carbon Removal', 'Solutions & Action'];
    const diffs = ['Easy', 'Medium', 'Hard'];
    categories.forEach((cat) => {
      diffs.forEach((diff) => {
        const s = buildQuizSession(cat, diff);
        expect(s.questions.length).toBeGreaterThan(0);
      });
    });
  });
});

// ─── useLifeline / applyUseLifeline ───────────────────────────────────────────

describe('useLifeline (applyUseLifeline)', () => {
  test('50/50 stores 2 eliminated wrong indices for the question', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const updated = applyUseLifeline(session, '5050', 0);
    expect(updated.eliminatedByIndex[0]).toHaveLength(2);
    updated.eliminatedByIndex[0].forEach((idx) => {
      expect(idx).not.toBe(session.questions[0].correct);
    });
  });

  test('shield sets shieldArmedForIndex to the question index', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const updated = applyUseLifeline(session, 'shield', 2);
    expect(updated.shieldArmedForIndex).toBe(2);
  });

  test('second use of same lifeline is a no-op', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const once = applyUseLifeline(session, '5050', 0);
    const twice = applyUseLifeline(once, '5050', 1);
    // Should not overwrite existing elimination at index 0 or create new one at 1
    expect(twice.eliminatedByIndex[1]).toBeUndefined();
    expect(twice.lifelinesUsed['5050']).toBe(true);
  });

  test('using a lifeline not in lifelinesAvailable is a no-op', () => {
    const session = buildQuizSession('Energy', 'Hard'); // Hard has no shield
    const updated = applyUseLifeline(session, 'shield', 0);
    expect(updated.shieldArmedForIndex).toBeNull();
    expect(updated.lifelinesUsed.shield).toBeUndefined();
  });

  test('marks lifeline as used', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const updated = applyUseLifeline(session, '5050', 0);
    expect(updated.lifelinesUsed['5050']).toBe(true);
  });

  test('does not mutate the original session', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const originalUsed = { ...session.lifelinesUsed };
    applyUseLifeline(session, '5050', 0);
    expect(session.lifelinesUsed).toEqual(originalUsed);
  });
});

// ─── shouldShrink / calcShouldShrink ─────────────────────────────────────────

describe('shouldShrink (calcShouldShrink)', () => {
  test('REGRESSION – wrong answer without shield returns shouldShrink: true', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const { shouldShrink } = calcShouldShrink(session, 0, false);
    expect(shouldShrink).toBe(true);
  });

  test('correct answer always returns shouldShrink: false', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const { shouldShrink } = calcShouldShrink(session, 0, true);
    expect(shouldShrink).toBe(false);
  });

  test('shielded wrong answer returns shouldShrink: false', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const shielded = applyUseLifeline(session, 'shield', 1);
    const { shouldShrink } = calcShouldShrink(shielded, 1, false);
    expect(shouldShrink).toBe(false);
  });

  test('shield armed for a DIFFERENT index does not block shrink', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const shielded = applyUseLifeline(session, 'shield', 2);
    const { shouldShrink } = calcShouldShrink(shielded, 3, false); // different index
    expect(shouldShrink).toBe(true);
  });

  test('shield is consumed after a wrong answer (shielded)', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const shielded = applyUseLifeline(session, 'shield', 0);
    const { newSession } = calcShouldShrink(shielded, 0, false);
    expect(newSession.shieldArmedForIndex).toBeNull();
  });

  test('shield is consumed after a correct answer (shield still armed)', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const shielded = applyUseLifeline(session, 'shield', 0);
    const { shouldShrink, newSession } = calcShouldShrink(shielded, 0, true);
    expect(shouldShrink).toBe(false);
    expect(newSession.shieldArmedForIndex).toBeNull();
  });

  test('no shield consumed when shield is armed for a different index', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const shielded = applyUseLifeline(session, 'shield', 2);
    const { newSession } = calcShouldShrink(shielded, 3, false);
    expect(newSession.shieldArmedForIndex).toBe(2); // still armed
  });

  test('truth table: all combinations', () => {
    const noShield = buildQuizSession('Energy', 'Hard'); // Hard has no shield lifeline
    expect(calcShouldShrink(noShield, 0, true).shouldShrink).toBe(false);  // correct → no shrink
    expect(calcShouldShrink(noShield, 0, false).shouldShrink).toBe(true);  // wrong → shrink

    const withShield = applyUseLifeline(buildQuizSession('Energy', 'Easy'), 'shield', 1);
    expect(calcShouldShrink(withShield, 1, false).shouldShrink).toBe(false); // wrong + shield → no shrink
    expect(calcShouldShrink(withShield, 1, true).shouldShrink).toBe(false);  // correct + shield → no shrink
  });
});

// ─── REGRESSION: base scoring path ───────────────────────────────────────────

describe('REGRESSION: base scoring path', () => {
  test('correct answer leads to increment (shouldShrink false)', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const { shouldShrink } = calcShouldShrink(session, 0, true);
    // TreeAnimationScreen: isCorrect → incrementScore; shouldShrink false confirms no decrement
    expect(shouldShrink).toBe(false);
  });

  test('wrong answer without shield leads to decrement (shouldShrink true)', () => {
    const session = buildQuizSession('Energy', 'Easy');
    const { shouldShrink } = calcShouldShrink(session, 0, false);
    // TreeAnimationScreen: !isCorrect && shouldShrink → decrementScore
    expect(shouldShrink).toBe(true);
  });

  test('quiz has exactly 5 questions — last question is at index 4', () => {
    const session = buildQuizSession('Carbon Removal', 'Medium');
    expect(session.questions).toHaveLength(5);
    // AnswerScreen hasNextQuestion logic: questionIndex + 1 < questions.length
    expect(4 + 1 < session.questions.length).toBe(false); // index 4 is last → completeSession
    expect(3 + 1 < session.questions.length).toBe(true);  // index 3 is not last
  });
});

// ─── shouldClearSelection ─────────────────────────────────────────────────────

describe('shouldClearSelection', () => {
  test('returns true when selected answer is in the eliminated list', () => {
    expect(shouldClearSelection(2, [1, 2])).toBe(true);
  });

  test('returns false when selectedAnswer is null', () => {
    expect(shouldClearSelection(null, [1, 2])).toBe(false);
  });

  test('returns false when eliminated is empty', () => {
    expect(shouldClearSelection(0, [])).toBe(false);
  });

  test('returns false when selected answer is not in the eliminated list', () => {
    expect(shouldClearSelection(0, [1, 2])).toBe(false);
  });
});

// ─── shieldBannerState ────────────────────────────────────────────────────────

describe('shieldBannerState', () => {
  test('returns show: false when shieldConsumed is false', () => {
    expect(shieldBannerState(false, true)).toEqual({ show: false, message: '' });
    expect(shieldBannerState(false, false)).toEqual({ show: false, message: '' });
  });

  test('returns protected message on wrong answer with shield consumed', () => {
    const result = shieldBannerState(true, false);
    expect(result.show).toBe(true);
    expect(result.message).toContain('protected');
  });

  test("returns 'Shield used' (no protected) on correct answer with shield consumed", () => {
    const result = shieldBannerState(true, true);
    expect(result.show).toBe(true);
    expect(result.message).toBe('🛡 Shield used');
  });
});

// ─── createEmptyQuizSession ───────────────────────────────────────────────────

describe('createEmptyQuizSession', () => {
  test('returns the expected empty shape', () => {
    const s = createEmptyQuizSession();
    expect(s.quizId).toBeNull();
    expect(s.questions).toEqual([]);
    expect(s.lifelinesAvailable).toEqual([]);
    expect(s.lifelinesUsed).toEqual({});
    expect(s.eliminatedByIndex).toEqual({});
    expect(s.shieldArmedForIndex).toBeNull();
  });
});
