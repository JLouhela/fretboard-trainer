import { h } from 'preact';
import { midiToStaffPosition, getAccidental } from '../data/notes';
import { NATURAL_PCS } from '../data/notes';

type Props = {
  midi: number;
  useSharps?: boolean;
  scale?: number; // 1 = full size, 0.65 = compact inline
};

// Staff layout constants
const STAFF_LINE_SPACING = 10; // px between lines
const STAFF_LINES = 5;
const STAFF_HEIGHT = (STAFF_LINES - 1) * STAFF_LINE_SPACING; // 40px
const NOTE_RADIUS = 6;
const CLEF_WIDTH = 42;
const ACCIDENTAL_WIDTH = 14;
const NOTE_X_BASE = CLEF_WIDTH + 30;
const SVG_WIDTH = NOTE_X_BASE + ACCIDENTAL_WIDTH + NOTE_RADIUS * 3 + 20;
const SVG_HEIGHT = 120; // generous height for ledger lines

// Staff Y: line 0 (bottom line) maps to this Y coordinate
// Middle of SVG = middle line of staff = B4 (staff position 7 from middle C)
// We'll compute dynamically

/**
 * Convert staff position (diatonic steps from middle C = C4 = MIDI 60) to SVG Y.
 *
 * Treble clef:
 *   - Bottom line = E4 (step 2 from C4)   => staffPos = 2
 *   - 2nd line    = G4 (step 4)            => staffPos = 4
 *   - Middle line = B4 (step 6)            => staffPos = 6
 *   - 4th line    = D5 (step 8)            => staffPos = 8
 *   - Top line    = F5 (step 10)           => staffPos = 10
 *
 * stepFromMidC = 0 => C4 (middle C, first ledger line below)
 * stepFromMidC = 2 => E4 (bottom line)
 */
function staffPosToY(staffPos: number, staffBaseY: number): number {
  // staffPos = diatonic steps from middle C (C4 = 0)
  // E4 (staffPos=2) = bottom staff line
  // Each line/space = STAFF_LINE_SPACING/2 (half step)
  // Bottom line Y = staffBaseY + (STAFF_LINES - 1) * STAFF_LINE_SPACING
  const bottomLineY = staffBaseY + (STAFF_LINES - 1) * STAFF_LINE_SPACING;
  // E4 staffPos = 2, bottom line
  const stepsAboveBottomLine = staffPos - 2;
  return bottomLineY - stepsAboveBottomLine * (STAFF_LINE_SPACING / 2);
}

export function Staff({ midi, useSharps = true, scale = 1 }: Props) {
  const pc = midi % 12;
  const staffPos = midiToStaffPosition(midi);
  const accidental = getAccidental(pc, useSharps);

  const staffBaseY = 18; // top of staff area with room for ledger lines above
  const bottomLineY = staffBaseY + (STAFF_LINES - 1) * STAFF_LINE_SPACING;
  const topLineY = staffBaseY;

  const noteY = staffPosToY(staffPos, staffBaseY);
  const noteX = NOTE_X_BASE + (accidental ? ACCIDENTAL_WIDTH : 0);

  // Ledger lines needed
  // Below staff: bottom line at staffPos=2, so ledger if staffPos <= 0 (C4 at 0, then B3 at -1, etc.)
  // Above staff: top line at staffPos=10, ledger if staffPos >= 12
  // Ledger lines at even staffPos values (on-line positions)
  const ledgerLinesBelow: number[] = [];
  const ledgerLinesAbove: number[] = [];

  // Below: from staffPos=0 down to staffPos
  for (let sp = 0; sp >= staffPos; sp -= 2) {
    ledgerLinesBelow.push(sp);
  }

  // Above: from staffPos=12 up to staffPos
  for (let sp = 12; sp <= staffPos; sp += 2) {
    ledgerLinesAbove.push(sp);
  }

  // Total SVG height: we need room for notes above/below staff
  const minY = Math.min(noteY - NOTE_RADIUS - 8, topLineY - 20);
  const maxY = Math.max(noteY + NOTE_RADIUS + 8, bottomLineY + 20);
  const totalHeight = maxY - minY + 10;
  const viewBoxY = minY - 5;

  // Clef as Unicode text (𝄞 U+1D11E)
  // Positioned to span from below staff to above
  const clefY = bottomLineY + 4;

  return (
    <div class="staff-container">
      <svg
        class="staff-svg"
        viewBox={`0 ${viewBoxY} ${SVG_WIDTH} ${totalHeight}`}
        width={Math.round(SVG_WIDTH * scale)}
        height={Math.round(totalHeight * scale)}
        aria-label={`Musical staff showing note`}
        role="img"
      >
        {/* Staff lines */}
        {Array.from({ length: STAFF_LINES }, (_, i) => {
          const y = staffBaseY + i * STAFF_LINE_SPACING;
          return (
            <line
              key={`staff-line-${i}`}
              x1={8}
              y1={y}
              x2={SVG_WIDTH - 8}
              y2={y}
              stroke="var(--color-staff-line)"
              strokeWidth={1.2}
            />
          );
        })}

        {/* Treble clef */}
        <text
          x={12}
          y={clefY}
          fontSize={STAFF_LINE_SPACING * 4.8}
          fill="var(--color-clef)"
          fontFamily="'Times New Roman', serif"
          style={{ userSelect: 'none' }}
        >
          𝄞
        </text>

        {/* Ledger lines below staff */}
        {ledgerLinesBelow.map(sp => {
          const y = staffPosToY(sp, staffBaseY);
          return (
            <line
              key={`ledger-below-${sp}`}
              x1={noteX - NOTE_RADIUS - 4}
              y1={y}
              x2={noteX + NOTE_RADIUS + 4}
              y2={y}
              stroke="var(--color-staff-line)"
              strokeWidth={1.2}
            />
          );
        })}

        {/* Ledger lines above staff */}
        {ledgerLinesAbove.map(sp => {
          const y = staffPosToY(sp, staffBaseY);
          return (
            <line
              key={`ledger-above-${sp}`}
              x1={noteX - NOTE_RADIUS - 4}
              y1={y}
              x2={noteX + NOTE_RADIUS + 4}
              y2={y}
              stroke="var(--color-staff-line)"
              strokeWidth={1.2}
            />
          );
        })}

        {/* Accidental */}
        {accidental === 'sharp' && (
          <text
            x={NOTE_X_BASE - 2}
            y={noteY + 5}
            fontSize={14}
            fontFamily="'Times New Roman', serif"
            fill="var(--color-note-fill)"
            textAnchor="middle"
            style={{ userSelect: 'none' }}
          >
            ♯
          </text>
        )}
        {accidental === 'flat' && (
          <text
            x={NOTE_X_BASE - 2}
            y={noteY + 6}
            fontSize={16}
            fontFamily="'Times New Roman', serif"
            fill="var(--color-note-fill)"
            textAnchor="middle"
            style={{ userSelect: 'none' }}
          >
            ♭
          </text>
        )}

        {/* Note head (whole note = hollow ellipse) */}
        <ellipse
          cx={noteX}
          cy={noteY}
          rx={NOTE_RADIUS}
          ry={NOTE_RADIUS * 0.72}
          fill="var(--color-note-fill)"
          stroke="none"
        />
        {/* Whole note hole */}
        <ellipse
          cx={noteX + 1}
          cy={noteY}
          rx={NOTE_RADIUS * 0.45}
          ry={NOTE_RADIUS * 0.3}
          fill="var(--color-surface)"
          stroke="none"
          transform={`rotate(-20, ${noteX}, ${noteY})`}
        />
      </svg>
    </div>
  );
}
