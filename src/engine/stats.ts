// Per-position accuracy stats with localStorage persistence
// Supports spaced-repetition weighting

const STORAGE_KEY = 'fretboard-stats-v1';
const MASTERY_KEY = 'fretboard-mastery-v1';

export type PositionStats = {
  seen: number;
  correct: number;
  lastSeen: number; // timestamp ms
};

export type ExerciseStats = Record<string, PositionStats>;
export type AllStats = Record<string, ExerciseStats>;

export type MasteryRecord = Record<string, number[]>; // exerciseId -> array of recent scores (0-10)

function posKey(stringIndex: number, fret: number): string {
  return `${stringIndex}:${fret}`;
}

function loadStats(): AllStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AllStats;
  } catch {
    // ignore
  }
  return {};
}

function saveStats(stats: AllStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore storage errors
  }
}

function loadMastery(): MasteryRecord {
  try {
    const raw = localStorage.getItem(MASTERY_KEY);
    if (raw) return JSON.parse(raw) as MasteryRecord;
  } catch {
    // ignore
  }
  return {};
}

function saveMastery(mastery: MasteryRecord): void {
  try {
    localStorage.setItem(MASTERY_KEY, JSON.stringify(mastery));
  } catch {
    // ignore
  }
}

/**
 * Record a single answer for an exercise position
 */
export function recordPositionAnswer(
  exerciseId: string,
  stringIndex: number,
  fret: number,
  correct: boolean
): void {
  const stats = loadStats();
  if (!stats[exerciseId]) stats[exerciseId] = {};
  const key = posKey(stringIndex, fret);
  const existing = stats[exerciseId][key] || { seen: 0, correct: 0, lastSeen: 0 };
  stats[exerciseId][key] = {
    seen: existing.seen + 1,
    correct: existing.correct + (correct ? 1 : 0),
    lastSeen: Date.now(),
  };
  saveStats(stats);
}

/**
 * Get stats for a specific exercise
 */
export function getExerciseStats(exerciseId: string): ExerciseStats {
  const stats = loadStats();
  return stats[exerciseId] || {};
}

/**
 * Get accuracy for a specific position (0–1), or 0.5 if never seen
 */
export function getPositionAccuracy(
  exerciseId: string,
  stringIndex: number,
  fret: number
): number {
  const stats = getExerciseStats(exerciseId);
  const key = posKey(stringIndex, fret);
  const pos = stats[key];
  if (!pos || pos.seen === 0) return 0.5; // unknown = medium
  return pos.correct / pos.seen;
}

/**
 * Compute SR weight for a position (higher = needs more practice)
 */
export function computeWeight(
  exerciseId: string,
  stringIndex: number,
  fret: number
): number {
  const stats = getExerciseStats(exerciseId);
  const key = posKey(stringIndex, fret);
  const pos = stats[key];

  const accuracy = pos && pos.seen > 0 ? pos.correct / pos.seen : 0.5;

  // Recency decay: notes not seen recently get higher weight
  const recencyDecay = pos
    ? Math.min(2.0, 1 + (Date.now() - pos.lastSeen) / (1000 * 60 * 60 * 24)) // up to 2x after 24h
    : 1.5;

  return (1 / (accuracy + 0.1)) * recencyDecay;
}

/**
 * Get overall accuracy for an exercise (0–100), or null if no data
 */
export function getExerciseAccuracy(exerciseId: string): number | null {
  const stats = getExerciseStats(exerciseId);
  const positions = Object.values(stats);
  if (positions.length === 0) return null;

  const totalSeen = positions.reduce((a, p) => a + p.seen, 0);
  const totalCorrect = positions.reduce((a, p) => a + p.correct, 0);
  if (totalSeen === 0) return null;
  return Math.round((totalCorrect / totalSeen) * 100);
}

/**
 * Reset all stats
 */
export function resetAllStats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(MASTERY_KEY);
  } catch {
    // ignore
  }
}

/**
 * Record exercise session score (for mastery tracking)
 */
export function recordExerciseScore(exerciseId: string, correct: number, total: number): void {
  const mastery = loadMastery();
  const score = total > 0 ? Math.round((correct / total) * 10) : 0;
  const recent = mastery[exerciseId] || [];
  recent.push(score);
  // Keep last 5 scores
  mastery[exerciseId] = recent.slice(-5);
  saveMastery(mastery);
}

/**
 * Check if an exercise is mastered (≥ 9/10 three times in a row)
 */
export function isExerciseMastered(exerciseId: string): boolean {
  const mastery = loadMastery();
  const recent = mastery[exerciseId] || [];
  if (recent.length < 3) return false;
  const last3 = recent.slice(-3);
  return last3.every(s => s >= 9);
}
