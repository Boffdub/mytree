import { supabase } from './supabase';

export class StorageService {
  constructor(authState) {
    this.authState = authState;
  }

  async getScore() {
    // score derived from correct question_attempts
    const { data: attempts, error } = await supabase
      .from('question_attempts')
      .select('is_correct')
      .eq('user_id', this.authState.user.id);
    if (error) throw error;
    const net = attempts.reduce((acc, a) => acc + (a.is_correct ? 1 : -1), 0);
    return Math.max(0, Math.min(5, net));
  }

  async updateScore(newScore) {
    // score is derived from question_attempts; no direct update needed
  }

  async startSession(category) {
    const { data, error } = await supabase
      .from('game_sessions')
      .insert({
        user_id: this.authState.user.id,
        category,
        score: 0,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  async completeSession(sessionId) {
    const { data: attempts, error: err1 } = await supabase
      .from('question_attempts')
      .select('is_correct')
      .eq('session_id', sessionId);
    if (err1) throw err1;
    const score = attempts.filter((a) => a.is_correct).length;
    const { error } = await supabase
      .from('game_sessions')
      .update({ completed_at: new Date().toISOString(), score })
      .eq('id', sessionId);
    if (error) throw error;
  }

  async saveAnswer(sessionId, category, questionId, selectedAnswer, isCorrect) {
    const { error } = await supabase.from('question_attempts').insert({
      session_id: sessionId,
      user_id: this.authState.user.id,
      category,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
    });
    if (error) throw error;
  }

  async getAnsweredQuestions(category = null) {
    let query = supabase
      .from('question_attempts')
      .select('question_id, selected_answer, is_correct, category, answered_at')
      .eq('user_id', this.authState.user.id);
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data.map((row) => ({
      questionId: row.question_id,
      selectedAnswer: row.selected_answer,
      isCorrect: row.is_correct,
      category: row.category,
      answeredAt: row.answered_at,
    }));
  }

  async clearAllData() {
    throw new Error('clearAllData for authenticated users must use the delete-account Edge Function');
  }
}
