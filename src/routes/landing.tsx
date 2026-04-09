import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useSignal } from '@preact/signals';
import { settings, updateSettings, resetSettings } from '../store';
import { EXERCISES } from '../data/exercises';
import { getExerciseAccuracy, resetAllStats } from '../engine/stats';

type Props = {
  onSelectExercise: (id: string) => void;
};

function AccuracyBadge({ accuracy }: { accuracy: number | null }) {
  if (accuracy === null) return null;
  const cls =
    accuracy >= 80 ? 'exercise-card-accuracy accuracy-high' :
    accuracy >= 50 ? 'exercise-card-accuracy accuracy-mid' :
    'exercise-card-accuracy accuracy-low';
  return <span class={cls}>{accuracy}%</span>;
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const s = settings.value;

  function handleReset() {
    if (confirm('Reset all stats? This cannot be undone.')) {
      resetAllStats();
      onClose();
    }
  }

  return (
    <div class="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="modal" role="dialog" aria-modal="true" aria-label="Settings">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--text-xl)' }}>Settings</h2>
          <button
            class="btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Sharps toggle */}
        <div class="settings-row">
          <div>
            <div class="settings-label">Use Sharps (♯)</div>
            <div class="settings-desc">Show accidentals as sharps (C#, F#...)</div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              checked={s.useSharps}
              onChange={e => updateSettings({ useSharps: (e.target as HTMLInputElement).checked })}
              aria-label="Use sharps"
            />
            <span class="toggle-track" />
            <span class="toggle-thumb" />
          </label>
        </div>

        {/* Flats toggle */}
        <div class="settings-row">
          <div>
            <div class="settings-label">Use Flats (♭)</div>
            <div class="settings-desc">Show accidentals as flats (Db, Bb...)</div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              checked={s.useFlats}
              onChange={e => updateSettings({ useFlats: (e.target as HTMLInputElement).checked })}
              aria-label="Use flats"
            />
            <span class="toggle-track" />
            <span class="toggle-thumb" />
          </label>
        </div>

        {/* Fret numbers */}
        <div class="settings-row">
          <div>
            <div class="settings-label">Show Fret Numbers</div>
            <div class="settings-desc">Display numbers below fret bars</div>
          </div>
          <label class="toggle">
            <input
              type="checkbox"
              checked={s.showFretNumbers}
              onChange={e => updateSettings({ showFretNumbers: (e.target as HTMLInputElement).checked })}
              aria-label="Show fret numbers"
            />
            <span class="toggle-track" />
            <span class="toggle-thumb" />
          </label>
        </div>

        {/* Theme */}
        <div class="settings-row">
          <div class="settings-label">Theme</div>
          <select
            value={s.theme}
            onChange={e => updateSettings({ theme: (e.target as HTMLSelectElement).value as any })}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              minHeight: '44px',
            }}
            aria-label="Select theme"
          >
            <option value="auto">Auto</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        {/* Reset stats */}
        <div class="settings-row">
          <div>
            <div class="settings-label">Reset Stats</div>
            <div class="settings-desc">Clear all accuracy data</div>
          </div>
          <button
            class="btn btn-secondary"
            onClick={handleReset}
            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function Landing({ onSelectExercise }: Props) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div class="landing-page">
      <div class="landing-hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
          <div style={{ flex: 1 }}>
            <h1>🎸 Fretboard Trainer</h1>
            <p>Master every note on the guitar fretboard</p>
          </div>
          <button
            class="btn-icon btn-ghost"
            onClick={() => setShowSettings(true)}
            aria-label="Open settings"
            style={{ color: 'white', fontSize: '1.5rem', background: 'rgba(255,255,255,0.15)', borderRadius: 'var(--radius-md)' }}
          >
            ⚙️
          </button>
        </div>
      </div>

      <div class="landing-content">
        <div class="section-header">Choose an Exercise</div>

        <div class="exercises-grid">
          {/* Random card pinned at top */}
          <button
            class="exercise-card random-card"
            onClick={() => onSelectExercise('random-mix')}
            aria-label="Start random exercise"
          >
            <div class="exercise-card-icon" style={{ fontSize: '2rem' }}>🎲</div>
            <div>
              <div class="exercise-card-title">Random Mix</div>
              <div class="exercise-card-desc">Mix of all exercise types</div>
            </div>
          </button>

          {/* Filtered list — skip random-mix (already shown above) */}
          {EXERCISES.filter(ex => ex.id !== 'random-mix').map(ex => {
            const accuracy = getExerciseAccuracy(ex.id);
            return (
              <button
                key={ex.id}
                class="exercise-card"
                onClick={() => onSelectExercise(ex.id)}
                aria-label={`${ex.title}: ${ex.description}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div class="exercise-card-icon">{ex.icon || '🎵'}</div>
                  <AccuracyBadge accuracy={accuracy} />
                </div>
                <div class="exercise-card-title">{ex.title}</div>
                <div class="exercise-card-desc">{ex.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <footer class="landing-footer">
        <p>
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
          {' · '}
          <span>v1.0.0</span>
        </p>
      </footer>

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
