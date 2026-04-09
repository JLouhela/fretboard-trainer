import { h } from 'preact';
import { SessionStats, getAccuracyPercent, getAverageTime, formatTime, getScoreLabel } from '../engine/scoring';

type Props = {
  stats: SessionStats;
};

function getScoreColor(pct: number): string {
  if (pct >= 90) return 'var(--color-success)';
  if (pct >= 60) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function ResultCard({ stats }: Props) {
  const accuracy = getAccuracyPercent(stats);
  const avgTime = getAverageTime(stats);
  const label = getScoreLabel(stats.correct, stats.total);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
      <div class="result-score">
        <div
          class="result-score-big"
          style={{ color: getScoreColor(accuracy) }}
          aria-label={`Score: ${stats.correct} out of ${stats.total}`}
        >
          {stats.correct} / {stats.total}
        </div>
        <div class="result-score-label">{label}</div>
      </div>

      <div class="result-stats-grid">
        <div class="result-stat">
          <div class="result-stat-value" style={{ color: getScoreColor(accuracy) }}>
            {accuracy}%
          </div>
          <div class="result-stat-label">Accuracy</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value">{formatTime(avgTime)}</div>
          <div class="result-stat-label">Avg. Time</div>
        </div>
        <div class="result-stat">
          <div class="result-stat-value" style={{ color: 'var(--color-warning)' }}>
            🔥 {stats.bestStreak}
          </div>
          <div class="result-stat-label">Best Streak</div>
        </div>
      </div>
    </div>
  );
}
