import { questions as allQuestions } from './questions';
import { mapCategoryToKey } from './categoryMap';
import * as Crypto from 'expo-crypto';

export const LIFELINE_GATING = {
  Easy: ['5050', 'shield'],
  Medium: ['5050'],
  Hard: ['5050'],
};

export function getQuestions(category, difficulty) {
  const pool = allQuestions[category];
  if (!pool) return [];
  return pool.filter((q) => q.difficulty === difficulty);
}

export function pickQuiz(pool, n = 5) {
  const arr = pool.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

export function applyFiftyFifty(question) {
  const wrongIndices = question.options
    .map((_, i) => i)
    .filter((i) => i !== question.correct);
  for (let i = wrongIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
  }
  return wrongIndices.slice(0, 2);
}

export function createEmptyQuizSession() {
  return {
    quizId: null,
    category: null,
    difficulty: null,
    questions: [],
    lifelinesAvailable: [],
    lifelinesUsed: {},
    eliminatedByIndex: {},
    shieldArmedForIndex: null,
  };
}

export function buildQuizSession(category, difficulty) {
  const key = mapCategoryToKey(category);
  const pool = getQuestions(key, difficulty);
  const quizQuestions = pickQuiz(pool);
  return {
    quizId: Crypto.randomUUID(),
    category,
    difficulty,
    questions: quizQuestions,
    lifelinesAvailable: [...(LIFELINE_GATING[difficulty] || [])],
    lifelinesUsed: {},
    eliminatedByIndex: {},
    shieldArmedForIndex: null,
  };
}

export function applyUseLifeline(session, type, questionIndex) {
  if (!session.lifelinesAvailable.includes(type)) return session;
  if (session.lifelinesUsed[type]) return session;

  const update = {
    ...session,
    lifelinesUsed: { ...session.lifelinesUsed, [type]: true },
  };

  if (type === '5050') {
    update.eliminatedByIndex = {
      ...session.eliminatedByIndex,
      [questionIndex]: applyFiftyFifty(session.questions[questionIndex]),
    };
  } else if (type === 'shield') {
    update.shieldArmedForIndex = questionIndex;
  }

  return update;
}

export function calcShouldShrink(session, questionIndex, isCorrect) {
  const shielded = session.shieldArmedForIndex === questionIndex;
  const shouldShrink = !isCorrect && !shielded;
  const newSession = shielded
    ? { ...session, shieldArmedForIndex: null }
    : session;
  return { shouldShrink, newSession };
}
