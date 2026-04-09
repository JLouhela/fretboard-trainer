import { h } from 'preact';
import { noteAt } from '../data/tuning';

export type FretboardHighlight = {
  stringIndex: number;
  fret: number;
};

export type FretboardReveal = {
  stringIndex: number;
  fret: number;
  correct: boolean;
};

type Props = {
  strings?: number[];         // which string indices to show (default all 6)
  fretRange?: [number, number];
  highlight?: FretboardHighlight;
  onTap?: (stringIndex: number, fret: number) => void;
  showFretNumbers?: boolean;
  revealAnswer?: FretboardReveal;
  highlightAllMatching?: number; // pitch class to highlight all instances of
  disabled?: boolean;
};

const ALL_STRINGS = [0, 1, 2, 3, 4, 5];

// Dot inlay fret positions
const SINGLE_DOTS = [3, 5, 7, 9];
const DOUBLE_DOT = 12;

// String thickness (index 0 = low E = thickest)
const STRING_THICKNESS = [3.5, 3.0, 2.5, 2.0, 1.5, 1.2];

// String name labels, index 0=low E. Displayed high-to-low (top to bottom).
const STRING_LABELS = ['E', 'A', 'D', 'G', 'B', 'E'];

export function Fretboard({
  strings = ALL_STRINGS,
  fretRange = [0, 12],
  highlight,
  onTap,
  showFretNumbers = false,
  revealAnswer,
  highlightAllMatching,
  disabled = false,
}: Props) {
  const [minFret, maxFret] = fretRange;
  const fretCount = maxFret - minFret + 1; // number of playable cells (inclusive of both endpoints)
  const visibleStrings = strings;

  // Layout constants
  const FRET_NUM_HEIGHT = showFretNumbers ? 22 : 0;
  const STRING_LABEL_W = 40;
  const MARGIN_LEFT = STRING_LABEL_W + 24;
  const MARGIN_RIGHT = 16;
  const MARGIN_TOP = 12;
  const MARGIN_BOTTOM = 10 + FRET_NUM_HEIGHT;
  const STRING_SPACING = 34;
  const FRET_WIDTH = 52;

  const boardHeight = (visibleStrings.length - 1) * STRING_SPACING;
  const boardWidth = fretCount * FRET_WIDTH;
  const svgWidth = MARGIN_LEFT + boardWidth + MARGIN_RIGHT;
  const svgHeight = MARGIN_TOP + boardHeight + MARGIN_BOTTOM + 16;

  // Map visual row index to string index
  // Visually: high E (index 5) at top, low E (index 0) at bottom
  // So row 0 = strings[strings.length-1], row last = strings[0]
  const sortedStrings = [...visibleStrings].sort((a, b) => b - a); // high to low visually

  function stringY(visualRow: number): number {
    return MARGIN_TOP + 8 + visualRow * STRING_SPACING;
  }

  function fretX(fret: number): number {
    // fret 0 = nut position, fret 1 = after first fret bar, etc.
    if (fretCount === 0) {
      return MARGIN_LEFT + boardWidth / 2;
    }
    return MARGIN_LEFT + (fret - minFret + 0.5) * FRET_WIDTH;
  }

  function fretBarX(fret: number): number {
    return MARGIN_LEFT + (fret - minFret) * FRET_WIDTH;
  }

  function isHighlighted(si: number, fret: number): boolean {
    if (highlight && highlight.stringIndex === si && highlight.fret === fret) return true;
    return false;
  }

  function isRevealCorrect(si: number, fret: number): boolean {
    return !!(revealAnswer?.correct && revealAnswer.stringIndex === si && revealAnswer.fret === fret);
  }

  function isRevealWrong(si: number, fret: number): boolean {
    return !!(revealAnswer && !revealAnswer.correct && revealAnswer.stringIndex === si && revealAnswer.fret === fret);
  }

  function isMatchingPC(si: number, fret: number): boolean {
    if (highlightAllMatching === undefined) return false;
    return noteAt(si, fret) === highlightAllMatching;
  }

  function getCellFill(si: number, fret: number): string {
    if (isRevealWrong(si, fret)) return 'var(--color-highlight-wrong)';
    if (isRevealCorrect(si, fret)) return 'var(--color-highlight-correct)';
    if (isHighlighted(si, fret)) return 'var(--color-highlight)';
    if (isMatchingPC(si, fret)) return 'var(--color-primary)';
    return 'transparent';
  }

  function handleTap(si: number, fret: number) {
    if (!disabled && onTap) {
      onTap(si, fret);
      if ('vibrate' in navigator) {
        try { navigator.vibrate(10); } catch { /* ignore */ }
      }
    }
  }

  // Dot inlay fret positions that are within our range
  const dotsInRange = SINGLE_DOTS.filter(f => f >= minFret && f <= maxFret);
  const doubleDotsInRange = DOUBLE_DOT >= minFret && DOUBLE_DOT <= maxFret ? [DOUBLE_DOT] : [];

  // Dot Y center (midpoint between top and bottom strings)
  const dotY = MARGIN_TOP + 8 + ((visibleStrings.length - 1) / 2) * STRING_SPACING;

  return (
    <div class="fretboard-container">
      <svg
        class="fretboard-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label="Guitar fretboard"
        style={{ minWidth: `${Math.min(svgWidth, 340)}px` }}
      >
        {/* Fretboard background */}
        <rect
          x={MARGIN_LEFT}
          y={MARGIN_TOP + 2}
          width={boardWidth}
          height={boardHeight + 12}
          rx="4"
          fill="var(--color-fretboard-bg)"
        />

        {/* String name labels */}
        {sortedStrings.map((si, row) => (
          <text
            key={`label-${si}`}
            x={MARGIN_LEFT - 14}
            y={stringY(row) + 5}
            style={{ textAnchor: 'end' }}
            fontSize="13"
            fontWeight="600"
            fill="var(--color-text-muted)"
          >
            {STRING_LABELS[si]}
          </text>
        ))}

        {/* Fret position marker (only for mid-fretboard ranges) */}
        {minFret > 1 && (
          <text
            x={MARGIN_LEFT + 4}
            y={MARGIN_TOP + 2}
            textAnchor="start"
            fontSize="11"
            fontWeight="600"
            fill="var(--color-text-muted)"
          >
            {minFret}fr
          </text>
        )}

        {/* Inlay dots */}
        {dotsInRange.map(fret => (
          <circle
            key={`dot-${fret}`}
            cx={fretX(fret)}
            cy={dotY}
            r={5}
            fill="var(--color-inlay)"
          />
        ))}
        {doubleDotsInRange.map(fret => (
          <g key={`ddot-${fret}`}>
            <circle
              cx={fretX(fret)}
              cy={dotY - STRING_SPACING * 0.8}
              r={5}
              fill="var(--color-inlay)"
            />
            <circle
              cx={fretX(fret)}
              cy={dotY + STRING_SPACING * 0.8}
              r={5}
              fill="var(--color-inlay)"
            />
          </g>
        ))}

        {/* Fret bars */}
        {Array.from({ length: fretCount + 1 }, (_, i) => {
          const fret = minFret + i;
          const x = fretBarX(fret);
          if (minFret === 0 && fret === 0) return null; // nut already drawn
          return (
            <line
              key={`fret-bar-${fret}`}
              x1={x}
              y1={MARGIN_TOP + 2}
              x2={x}
              y2={MARGIN_TOP + boardHeight + 14}
              stroke="var(--color-fret)"
              strokeWidth={fret === minFret ? 2.5 : 1.8}
            />
          );
        })}

        {/* Strings (horizontal) */}
        {sortedStrings.map((si, row) => (
          <line
            key={`string-${si}`}
            x1={MARGIN_LEFT}
            y1={stringY(row)}
            x2={MARGIN_LEFT + boardWidth}
            y2={stringY(row)}
            stroke="var(--color-string)"
            strokeWidth={STRING_THICKNESS[si]}
            strokeLinecap="round"
          />
        ))}

        {/* Fret numbers */}
        {showFretNumbers && Array.from({ length: fretCount }, (_, i) => {
          const fret = minFret + i + 1;
          return (
            <text
              key={`fret-num-${fret}`}
              x={MARGIN_LEFT + (i + 0.5) * FRET_WIDTH}
              y={MARGIN_TOP + boardHeight + 26}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-text-muted)"
            >
              {fret}
            </text>
          );
        })}

        {/* Interactive cells + highlight circles */}
        {sortedStrings.map((si, row) => {
          const cells = [];
          const frets = Array.from({ length: fretCount }, (_, i) => minFret + i);

          for (const fret of frets) {
            const cx = fretX(fret);
            const cy = stringY(row);
            const fill = getCellFill(si, fret);
            const isActive = fill !== 'transparent';
            const touchW = Math.max(44, FRET_WIDTH);
            const touchH = Math.max(44, STRING_SPACING);

            cells.push(
              <g key={`cell-${si}-${fret}`}>
                {/* Touch target */}
                <rect
                  x={cx - touchW / 2}
                  y={cy - touchH / 2}
                  width={touchW}
                  height={touchH}
                  fill="transparent"
                  style={{ cursor: onTap && !disabled ? 'pointer' : 'default' }}
                  role={onTap ? 'button' : undefined}
                  aria-label={onTap ? `String ${si + 1}, fret ${fret}` : undefined}
                  tabIndex={onTap && !disabled ? 0 : undefined}
                  onClick={() => handleTap(si, fret)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTap(si, fret);
                    }
                  }}
                />
                {/* Highlight dot */}
                {isActive && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={12}
                    fill={fill}
                    style={{ pointerEvents: 'none', transition: 'fill 0.15s ease' }}
                  />
                )}
              </g>
            );
          }

          return cells;
        })}
      </svg>
    </div>
  );
}
