import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageService, GUEST_STORAGE_KEY } from '../services/storage';

describe('StorageService (guest mode)', () => {
  const guestAuth = { mode: 'guest', user: null };

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  test('getScore returns 0 when no data exists', async () => {
    const svc = new StorageService(guestAuth);
    const score = await svc.getScore();
    expect(score).toBe(0);
  });

  test('updateScore persists to AsyncStorage', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(3);

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    const data = JSON.parse(raw);
    expect(data.score).toBe(3);
  });

  test('getScore returns persisted value', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(4);

    const svc2 = new StorageService(guestAuth);
    const score = await svc2.getScore();
    expect(score).toBe(4);
  });

  test('startSession creates a new session with generated id', async () => {
    const svc = new StorageService(guestAuth);
    const sessionId = await svc.startSession('energy');

    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe('string');
  });

  test('saveAnswer appends to current session', async () => {
    const svc = new StorageService(guestAuth);
    const sessionId = await svc.startSession('energy');
    await svc.saveAnswer(sessionId, 'energy', 1, 2, false);

    const attempts = await svc.getAnsweredQuestions('energy');
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      questionId: 1,
      selectedAnswer: 2,
      isCorrect: false,
    });
  });

  test('getAnsweredQuestions returns all when no category filter', async () => {
    const svc = new StorageService(guestAuth);
    const s1 = await svc.startSession('energy');
    await svc.saveAnswer(s1, 'energy', 1, 2, false);
    const s2 = await svc.startSession('transportation');
    await svc.saveAnswer(s2, 'transportation', 1, 0, true);

    const all = await svc.getAnsweredQuestions();
    expect(all).toHaveLength(2);
  });

  test('clearAllData removes guest data', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(5);
    await svc.clearAllData();

    const score = await svc.getScore();
    expect(score).toBe(0);
  });

  test('guestId is generated on first use and persists', async () => {
    const svc = new StorageService(guestAuth);
    await svc.updateScore(1);

    const raw = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    const data = JSON.parse(raw);
    expect(data.guestId).toBeTruthy();

    const firstId = data.guestId;

    const svc2 = new StorageService(guestAuth);
    await svc2.updateScore(2);

    const raw2 = await AsyncStorage.getItem(GUEST_STORAGE_KEY);
    const data2 = JSON.parse(raw2);
    expect(data2.guestId).toBe(firstId);
  });
});
