import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { GUEST_STORAGE_KEY } from './storage';

export { GUEST_STORAGE_KEY };

export async function migrateGuestToAuth(userId) {
  const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
  if (!raw) return;

  const data = JSON.parse(raw);
  if (!data.sessions || data.sessions.length === 0) {
    await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
    return;
  }

  for (const session of data.sessions) {
    const score = session.answers.filter((a) => a.isCorrect).length;
    const { data: inserted, error: insertError } = await supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        category: session.category,
        score,
        started_at: session.startedAt,
        completed_at: session.completedAt,
      })
      .select('id')
      .single();
    if (insertError) {
      throw new Error(`Failed to migrate session: ${insertError.message}`);
    }

    if (session.answers.length > 0) {
      const attemptRows = session.answers.map((a) => ({
        session_id: inserted.id,
        user_id: userId,
        category: session.category,
        question_id: a.questionId,
        selected_answer: a.selectedAnswer,
        is_correct: a.isCorrect,
        answered_at: a.answeredAt,
      }));
      const { error: attemptError } = await supabase
        .from('question_attempts')
        .insert(attemptRows);
      if (attemptError) {
        throw new Error(`Failed to migrate answers: ${attemptError.message}`);
      }
    }
  }

  await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
}
