import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';

export const GUEST_STORAGE_KEY = '@mytree_guest_data';

const emptyGuestData = () => ({
  guestId: null,
  score: 0,
  sessions: [],
});

export class StorageService {
  constructor(authState) {
    this.authState = authState;
  }

  // ---- Guest storage helpers ----

  async _readGuestData() {
    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return emptyGuestData();
    try {
      return JSON.parse(raw);
    } catch {
      return emptyGuestData();
    }
  }

  async _writeGuestData(data) {
    if (!data.guestId) {
      data.guestId = Crypto.randomUUID();
    }
    await AsyncStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(data));
  }

  // ---- Public API ----

  async getScore() {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      return data.score;
    }
    // auth mode: score derived from correct question_attempts
    const { data: attempts, error } = await supabase
      .from('question_attempts')
      .select('is_correct')
      .eq('user_id', this.authState.user.id);
    if (error) throw error;
    const net = attempts.reduce((acc, a) => acc + (a.is_correct ? 1 : -1), 0);
    return Math.max(0, Math.min(5, net));
  }

  async updateScore(newScore) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      data.score = newScore;
      await this._writeGuestData(data);
      return;
    }
    // auth mode: score is derived from question_attempts; no direct update needed
  }

  async startSession(category) {
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const sessionId = Crypto.randomUUID();
      data.sessions.push({
        id: sessionId,
        category,
        startedAt: new Date().toISOString(),
        completedAt: null,
        answers: [],
      });
      await this._writeGuestData(data);
      return sessionId;
    }
    // auth mode
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
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const session = data.sessions.find((s) => s.id === sessionId);
      if (session) {
        session.completedAt = new Date().toISOString();
        session.score = session.answers.filter((a) => a.isCorrect).length;
      }
      await this._writeGuestData(data);
      return;
    }
    // auth mode
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
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const session = data.sessions.find((s) => s.id === sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);
      session.answers.push({
        questionId,
        selectedAnswer,
        isCorrect,
        answeredAt: new Date().toISOString(),
      });
      await this._writeGuestData(data);
      return;
    }
    // auth mode
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
    if (this.authState.mode === 'guest') {
      const data = await this._readGuestData();
      const all = data.sessions.flatMap((s) =>
        s.answers.map((a) => ({ ...a, category: s.category }))
      );
      return category ? all.filter((a) => a.category === category) : all;
    }
    // auth mode
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
    if (this.authState.mode === 'guest') {
      await AsyncStorage.removeItem(GUEST_STORAGE_KEY);
      return;
    }
    // auth mode: handled by delete-account Edge Function
    throw new Error('clearAllData for authenticated users must use the delete-account Edge Function');
  }
}
