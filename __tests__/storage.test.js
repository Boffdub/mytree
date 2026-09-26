import { StorageService } from '../services/storage';

jest.mock('../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

import { supabase } from '../services/supabase';

describe('StorageService (auth mode)', () => {
  const authState = { mode: 'auth', user: { id: 'user-abc' } };

  beforeEach(() => {
    supabase.from.mockReset();
  });

  test('getScore sums is_correct attempts, clamped to 0-5', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ is_correct: true }, { is_correct: true }, { is_correct: false }],
          error: null,
        }),
      }),
    });

    const svc = new StorageService(authState);
    const score = await svc.getScore();

    expect(score).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('question_attempts');
  });

  test('startSession inserts a game_sessions row and returns its id', async () => {
    const insert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: { id: 'session-1' }, error: null }),
      }),
    });
    supabase.from.mockReturnValue({ insert });

    const svc = new StorageService(authState);
    const sessionId = await svc.startSession('energy');

    expect(sessionId).toBe('session-1');
    expect(insert).toHaveBeenCalledWith({ user_id: 'user-abc', category: 'energy', score: 0 });
  });

  test('saveAnswer inserts a question_attempts row', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null });
    supabase.from.mockReturnValue({ insert });

    const svc = new StorageService(authState);
    await svc.saveAnswer('session-1', 'energy', 1, 2, false);

    expect(insert).toHaveBeenCalledWith({
      session_id: 'session-1',
      user_id: 'user-abc',
      category: 'energy',
      question_id: 1,
      selected_answer: 2,
      is_correct: false,
    });
  });

  test('completeSession scores from attempts and updates the session', async () => {
    const update = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });
    supabase.from.mockImplementation((table) => {
      if (table === 'question_attempts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ is_correct: true }, { is_correct: false }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'game_sessions') return { update };
      throw new Error(`Unexpected table: ${table}`);
    });

    const svc = new StorageService(authState);
    await svc.completeSession('session-1');

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ score: 1 }));
  });

  test('getAnsweredQuestions maps rows and applies an optional category filter', async () => {
    const eq2 = jest.fn().mockResolvedValue({
      data: [
        {
          question_id: 1,
          selected_answer: 0,
          is_correct: true,
          category: 'energy',
          answered_at: '2026-04-15T10:01:00Z',
        },
      ],
      error: null,
    });
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({ eq: eq1 }),
    });

    const svc = new StorageService(authState);
    const results = await svc.getAnsweredQuestions('energy');

    expect(eq2).toHaveBeenCalledWith('category', 'energy');
    expect(results).toEqual([
      {
        questionId: 1,
        selectedAnswer: 0,
        isCorrect: true,
        category: 'energy',
        answeredAt: '2026-04-15T10:01:00Z',
      },
    ]);
  });

  test('clearAllData throws, directing callers to the delete-account Edge Function', async () => {
    const svc = new StorageService(authState);
    await expect(svc.clearAllData()).rejects.toThrow('delete-account Edge Function');
  });
});
