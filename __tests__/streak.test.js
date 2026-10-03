import { calculateStreak } from '../utils/streak';

describe('calculateStreak', () => {
  test('empty history returns 0', () => {
    expect(calculateStreak([])).toBe(0);
    expect(calculateStreak(null)).toBe(0);
  });

  test('active today counts today and prior consecutive days', () => {
    const now = new Date('2026-09-28T18:00:00');
    const timestamps = [
      '2026-09-28T09:00:00',
      '2026-09-27T09:00:00',
      '2026-09-26T09:00:00',
    ];
    expect(calculateStreak(timestamps, now)).toBe(3);
  });

  test('active yesterday but not yet today still counts as current streak', () => {
    const now = new Date('2026-09-28T08:00:00');
    const timestamps = [
      '2026-09-27T20:00:00',
      '2026-09-26T09:00:00',
    ];
    expect(calculateStreak(timestamps, now)).toBe(2);
  });

  test('gap of 2+ days breaks the streak to 0', () => {
    const now = new Date('2026-09-28T12:00:00');
    const timestamps = [
      '2026-09-25T09:00:00',
      '2026-09-24T09:00:00',
    ];
    expect(calculateStreak(timestamps, now)).toBe(0);
  });

  test('multiple timestamps on the same day count as a single day', () => {
    const now = new Date('2026-09-28T12:00:00');
    const timestamps = [
      '2026-09-28T09:00:00',
      '2026-09-28T09:05:00',
      '2026-09-28T14:00:00',
      '2026-09-27T09:00:00',
    ];
    expect(calculateStreak(timestamps, now)).toBe(2);
  });
});
