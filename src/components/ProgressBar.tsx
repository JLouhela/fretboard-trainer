import { h } from 'preact';

type Props = {
  current: number;
  total: number;
  label?: string;
};

export function ProgressBar({ current, total, label }: Props) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
          {label}
        </div>
      )}
      <div
        class="progress-bar-wrapper"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Progress: ${current} of ${total}`}
      >
        <div
          class="progress-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
