import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { StorageService } from '../services/storage';
import { useAuthContext } from './AuthContext';
import {
  buildQuizSession,
  createEmptyQuizSession,
  applyUseLifeline,
  calcShouldShrink,
} from '../data/quiz';

const GameContext = createContext();

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within GameProvider');
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const auth = useAuthContext();
  const [score, setScore] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quizSession, setQuizSession] = useState(createEmptyQuizSession());

  const storage = new StorageService(auth);

  const MAX_SCORE = 5;

  useEffect(() => {
    if (auth.mode === 'loading' || auth.mode === 'welcome') {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    storage
      .getScore()
      .then((s) => {
        if (!cancelled) {
          setScore(s);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('[GameContext] Failed to load score:', err);
        if (!cancelled) {
          setScore(0);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.mode, auth.user?.id]);

  const incrementScore = useCallback(async () => {
    const next = Math.min(score + 1, MAX_SCORE);
    setScore(next);
    try {
      await storage.updateScore(next);
    } catch (err) {
      console.error('[GameContext] Failed to persist score:', err);
    }
  }, [score, storage]);

  const decrementScore = useCallback(async () => {
    const next = Math.max(score - 1, 0);
    setScore(next);
    try {
      await storage.updateScore(next);
    } catch (err) {
      console.error('[GameContext] Failed to persist score:', err);
    }
  }, [score, storage]);

  const resetScore = useCallback(async () => {
    setScore(0);
    try {
      await storage.updateScore(0);
    } catch (err) {
      console.error('[GameContext] Failed to reset score:', err);
    }
  }, [storage]);

  const startSession = useCallback(
    async (category) => {
      try {
        const id = await storage.startSession(category);
        setCurrentSessionId(id);
        return id;
      } catch (err) {
        console.error('[GameContext] Failed to start session:', err);
        return null;
      }
    },
    [storage]
  );

  const startQuiz = useCallback(
    async (category, difficulty) => {
      const session = buildQuizSession(category, difficulty);
      setQuizSession(session);
      setCurrentSessionId(null);
      try {
        const id = await storage.startSession(category);
        setCurrentSessionId(id);
        return id;
      } catch (err) {
        console.error('[GameContext] Failed to start quiz session:', err);
        return null;
      }
    },
    [storage]
  );

  const useLifeline = useCallback(
    (type, questionIndex) => {
      setQuizSession((prev) => applyUseLifeline(prev, type, questionIndex));
    },
    []
  );

  const shouldShrink = useCallback(
    (questionIndex, isCorrect) => {
      let result = false;
      setQuizSession((prev) => {
        const { shouldShrink: shrink, newSession } = calcShouldShrink(prev, questionIndex, isCorrect);
        result = shrink;
        return newSession;
      });
      return result;
    },
    []
  );

  const saveAnswer = useCallback(
    async (category, questionId, selectedAnswer, isCorrect) => {
      if (!currentSessionId) {
        console.warn('[GameContext] saveAnswer called without active session');
        return;
      }
      try {
        await storage.saveAnswer(currentSessionId, category, questionId, selectedAnswer, isCorrect);
      } catch (err) {
        console.error('[GameContext] Failed to save answer:', err);
      }
    },
    [currentSessionId, storage]
  );

  const completeSession = useCallback(async () => {
    if (!currentSessionId) return;
    try {
      await storage.completeSession(currentSessionId);
    } catch (err) {
      console.error('[GameContext] Failed to complete session:', err);
    }
    setCurrentSessionId(null);
  }, [currentSessionId, storage]);

  const value = {
    score,
    isLoading,
    quizSession,
    incrementScore,
    decrementScore,
    resetScore,
    startSession,
    startQuiz,
    useLifeline,
    shouldShrink,
    saveAnswer,
    completeSession,
    currentSessionId,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

// Backwards-compatibility alias so existing screens using useAppContext still work during migration
export const useAppContext = useGameContext;
