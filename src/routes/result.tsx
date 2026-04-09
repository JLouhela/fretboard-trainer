import { h } from 'preact';
import { SessionStats } from '../engine/scoring';
import { getExerciseById } from '../data/exercises';
import { ResultCard } from '../components/ResultCard';

type Props = {
  sessionStats: SessionStats;
  exerciseId: string;
  onRetry: () => void;
  onBack: () => void;
};

export function Result({ sessionStats, exerciseId, onRetry, onBack }: Props) {
  const config = getExerciseById(exerciseId);

  return (
    <div class="exercise-page">
      {/* Header */}
      <header class="exercise-header">
        <button
          class="btn-icon btn-ghost"
          onClick={onBack}
          aria-label="Back to exercises"
        >
          ←
        </button>
        <div class="exercise-header-info">
          <div class="exercise-header-title">{config?.title || 'Result'}</div>
          <div class="exercise-counter">Finished!</div>
        </div>
        <div style={{ minWidth: '44px' }} />
      </header>

      <div class="result-page">
        <ResultCard stats={sessionStats} />

        <div class="result-actions">
          <button class="btn btn-primary" onClick={onRetry}>
            🔄 Retry
          </button>
          <button class="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
