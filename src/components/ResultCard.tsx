import { h } from 'preact';
import { SessionStats, getAccuracyPercent, getAverageTime, formatTime, getScoreLabel } from '../engine/scoring';
import { ExerciseStats } from '../engine/stats';

type Props = {
  stats: SessionStats;
  exerciseStats?: ExerciseStats;
  mastered?: boolean;
};

function getScoreColor(pct: number): string {
  if (pct >= 90) return 'var(--color-success)';
  if (pct >= 60) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function ResultCard({ stats, exerciseStats, mastered }: Props) {
  const accuracy = getAccuracyPercent(stats);
  const avgTime = getAverageTime(stats);
  const label = getScoreLabel(stats.correct, stats.total);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
      {mastered && (
        <div class="mastered-badge" role="status" aria-label="Exercise mastered">
          ⭐ Mastered!
        </div>
      )}

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

      {exerciseStats && Object.keys(exerciseStats).length > 0 && (
        <PositionHeatmap exerciseStats={exerciseStats} />
      )}
    </div>
  );
}

function PositionHeatmap({ exerciseStats }: { exerciseStats: ExerciseStats }) {
  const entries = Object.entries(exerciseStats);
  if (entries.length === 0) return null;

  return (
    <div class="heatmap">
      <div class="heatmap-title">Position Accuracy</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {entries.map(([key, pos]) => {
          const accuracy = pos.seen > 0 ? pos.correct / pos.seen : 0;
          const [si, fret] = key.split(':').map(Number);
          const bg = accuracy >= 0.9
            ? 'var(--color-success)'
            : accuracy >= 0.6
            ? 'var(--color-warning)'
            : 'var(--color-error)';

          return (
            <div
              key={key}
              title={`String ${si + 1}, Fret ${fret}: ${Math.round(accuracy * 100)}% (${pos.correct}/${pos.seen})`}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: bg,
                opacity: 0.85,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '700',
                color: 'white',
                flexShrink: 0,
              }}
            >
              {Math.round(accuracy * 100)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
