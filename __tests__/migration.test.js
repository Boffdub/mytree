import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateGuestToAuth, GUEST_STORAGE_KEY } from '../services/migration';

jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../services/supabase';

describe('migrateGuestToAuth', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    supabase.from.mockReset();
  });

  test('inserts session rows and answer rows, then clears guest data', async () => {
    await AsyncStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({
        guestId: 'guest-123',
        score: 3,
        sessions: [
          {
            id: 'local-session-1',
            category: 'energy',
            startedAt: '2026-04-15T10:00:00Z',
            completedAt: '2026-04-15T10:05:00Z',
            answers: [
              { questionId: 1, selectedAnswer: 0, isCorrect: true, answeredAt: '2026-04-15T10:01:00Z' },
              { questionId: 2, selectedAnswer: 2, isCorrect: false, answeredAt: '2026-04-15T10:02:00Z' },
            ],
          },
        ],
      })
    );

    const sessionInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'remote-session-1' }, error: null }),
      }),
    });
    const attemptInsert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockImplementation((table) => {
      if (table === 'game_sessions') return { insert: sessionInsert };
      if (table === 'question_attempts') return { insert: attemptInsert };
      throw new Error(`Unexpected table: ${table}`);
    });

    await migrateGuestToAuth('user-abc');

    expect(sessionInsert).toHaveBeenCalledWith({
      user_id: 'user-abc',
      category: 'energy',
      score: 1,
      started_at: '2026-04-15T10:00:00Z',
      completed_at: '2026-04-15T10:05:00Z',
    });
    expect(attemptInsert).toHaveBeenCalledWith([
      {
        session_id: 'remote-session-1',
        user_id: 'user-abc',
        category: 'energy',
        question_id: 1,
        selected_answer: 0,
        is_correct: true,
        answered_at: '2026-04-15T10:01:00Z',
      },
      {
        session_id: 'remote-session-1',
        user_id: 'user-abc',
        category: 'energy',
        question_id: 2,
        selected_answer: 2,
        is_correct: false,
        answered_at: '2026-04-15T10:02:00Z',
      },
    ]);

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    expect(raw).toBeNull();
  });

  test('is a no-op when no guest data exists', async () => {
    supabase.from.mockImplementation(() => {
      throw new Error('Should not call Supabase when no guest data');
    });
    await expect(migrateGuestToAuth('user-abc')).resolves.not.toThrow();
  });

  test('does not clear guest data if session insert fails', async () => {
    await AsyncStorage.setItem(
      GUEST_STORAGE_KEY,
      JSON.stringify({
        guestId: 'guest-123',
        score: 1,
        sessions: [
          {
            id: 'local-1',
            category: 'energy',
            startedAt: '2026-04-15T10:00:00Z',
            completedAt: null,
            answers: [],
          },
        ],
      })
    );

    const sessionInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'insert failed' } }),
      }),
    });
    supabase.from.mockImplementation(() => ({ insert: sessionInsert }));

    await expect(migrateGuestToAuth('user-abc')).rejects.toThrow();

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    expect(raw).not.toBeNull();
  });
});
