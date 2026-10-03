export function toLocalDayKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateStreak(answeredAtTimestamps, now = new Date()) {
  if (!answeredAtTimestamps || answeredAtTimestamps.length === 0) return 0;

  const activeDays = new Set(answeredAtTimestamps.map((ts) => toLocalDayKey(new Date(ts))));

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let cursor;
  if (activeDays.has(toLocalDayKey(today))) cursor = new Date(today);
  else if (activeDays.has(toLocalDayKey(yesterday))) cursor = new Date(yesterday);
  else return 0;

  let streak = 0;
  while (activeDays.has(toLocalDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
