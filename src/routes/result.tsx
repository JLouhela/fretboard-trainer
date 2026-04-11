import { h } from 'preact';
import { SessionStats } from '../engine/scoring';
import { getExerciseById } from '../data/exercises';
import { ResultCard } from '../components/ResultCard';
import { Mistake } from './exercise';
import { STRING_NAMES } from '../data/tuning';

type Props = {
  sessionStats: SessionStats;
  exerciseId: string;
  mistakes: Mistake[];
  onRetry: () => void;
  onBack: () => void;
};

function mistakeLabel(m: Mistake): { question: string; wrong: string; correct: string } {
  if (m.prompt === 'position-to-name') {
    return {
      question: `${STRING_NAMES[m.stringIndex]}, fret ${m.fret}`,
      wrong: m.userAnswer ?? '?',
      correct: m.correctName,
    };
  }
  // name-to-position or staff-to-position
  return {
    question: `Find ${m.correctName}`,
    wrong: m.userAnswer ?? '?',
    correct: m.correctName,
  };
}

export function Result({ sessionStats, exerciseId, mistakes, onRetry, onBack }: Props) {
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

        {mistakes.length > 0 && (
          <div class="result-mistakes">
            <div class="result-mistakes-title">Mistakes ({mistakes.length})</div>
            {mistakes.map((m, i) => {
              const { question, wrong, correct } = mistakeLabel(m);
              return (
                <div key={i} class="mistake-item">
                  <span class="mistake-question">{question}</span>
                  <span class="mistake-wrong">{wrong}</span>
                  <span class="mistake-arrow">→</span>
                  <span class="mistake-correct">{correct}</span>
                </div>
              );
            })}
          </div>
        )}

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
