// Scoring, streaks, and timing utilities

export type AnswerResult = {
  correct: boolean;
  timeTakenMs: number;
};

export type SessionStats = {
  total: number;
  correct: number;
  bestStreak: number;
  currentStreak: number;
  responseTimes: number[];
};

export function createSessionStats(): SessionStats {
  return {
    total: 0,
    correct: 0,
    bestStreak: 0,
    currentStreak: 0,
    responseTimes: [],
  };
}

export function recordAnswer(
  stats: SessionStats,
  correct: boolean,
  timeTakenMs: number
): SessionStats {
  const newStreak = correct ? stats.currentStreak + 1 : 0;
  return {
    total: stats.total + 1,
    correct: stats.correct + (correct ? 1 : 0),
    currentStreak: newStreak,
    bestStreak: Math.max(stats.bestStreak, newStreak),
    responseTimes: [...stats.responseTimes, timeTakenMs],
  };
}

export function getAccuracyPercent(stats: SessionStats): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.correct / stats.total) * 100);
}

export function getAverageTime(stats: SessionStats): number {
  if (stats.responseTimes.length === 0) return 0;
  const sum = stats.responseTimes.reduce((a, b) => a + b, 0);
  return Math.round(sum / stats.responseTimes.length);
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function getScoreLabel(correct: number, total: number): string {
  const pct = total > 0 ? correct / total : 0;
  if (pct >= 0.9) return 'Excellent!';
  if (pct >= 0.7) return 'Good job!';
  if (pct >= 0.5) return 'Keep practicing';
  return 'Keep at it!';
}
