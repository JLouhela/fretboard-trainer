import { h } from 'preact';

type Props = {
  useSharps: boolean;
  useFlats: boolean;
  onAnswer: (note: string) => void;
  correctNote?: string;
  wrongNote?: string;
  revealCorrect?: string;
  disabled?: boolean;
};

// Piano layout: 14 equal columns (each natural = 2 cols, each accidental = 2 cols offset by 1)
// Naturals: C(1/3) D(3/5) E(5/7) F(7/9) G(9/11) A(11/13) B(13/15)
// Accidentals: C#(2/4) D#(4/6) [gap E-F] F#(8/10) G#(10/12) A#(12/14)

const NATURALS: { note: string; col: string }[] = [
  { note: 'C', col: '1/3' },
  { note: 'D', col: '3/5' },
  { note: 'E', col: '5/7' },
  { note: 'F', col: '7/9' },
  { note: 'G', col: '9/11' },
  { note: 'A', col: '11/13' },
  { note: 'B', col: '13/15' },
];

const SHARPS: { note: string; col: string }[] = [
  { note: 'C#', col: '2/4' },
  { note: 'D#', col: '4/6' },
  { note: 'F#', col: '8/10' },
  { note: 'G#', col: '10/12' },
  { note: 'A#', col: '12/14' },
];

const FLATS: { note: string; col: string }[] = [
  { note: 'Db', col: '2/4' },
  { note: 'Eb', col: '4/6' },
  { note: 'Gb', col: '8/10' },
  { note: 'Ab', col: '10/12' },
  { note: 'Bb', col: '12/14' },
];

const NOTE_ARIA: Record<string, string> = {
  'C': 'C natural', 'D': 'D natural', 'E': 'E natural',
  'F': 'F natural', 'G': 'G natural', 'A': 'A natural', 'B': 'B natural',
  'C#': 'C sharp', 'D#': 'D sharp', 'F#': 'F sharp', 'G#': 'G sharp', 'A#': 'A sharp',
  'Db': 'D flat', 'Eb': 'E flat', 'Gb': 'G flat', 'Ab': 'A flat', 'Bb': 'B flat',
};

function btnClass(
  note: string,
  isAccidental: boolean,
  correctNote?: string,
  wrongNote?: string,
  revealCorrect?: string
): string {
  const base = isAccidental ? 'note-btn note-btn-accidental' : 'note-btn';
  if (revealCorrect && note === revealCorrect) return `${base} reveal-correct`;
  if (correctNote && note === correctNote) return `${base} correct`;
  if (wrongNote && note === wrongNote) return `${base} wrong`;
  return base;
}

export function NoteButtons({
  useSharps,
  useFlats,
  onAnswer,
  correctNote,
  wrongNote,
  revealCorrect,
  disabled = false,
}: Props) {
  function handleTap(note: string) {
    if (disabled) return;
    if ('vibrate' in navigator) {
      try { navigator.vibrate(10); } catch { /* ignore */ }
    }
    onAnswer(note);
  }

  const showAccidentals = useSharps || useFlats;
  const accidentals = useFlats && !useSharps ? FLATS : SHARPS;
  const naturalRow = showAccidentals ? 2 : 1;

  return (
    <div class="note-buttons-piano">
      {/* Accidentals row — piano black keys, offset between naturals */}
      {showAccidentals && accidentals.map(({ note, col }) => (
        <button
          key={note}
          class={btnClass(note, true, correctNote, wrongNote, revealCorrect)}
          style={{ gridColumn: col, gridRow: '1' }}
          onClick={() => handleTap(note)}
          disabled={disabled}
          aria-label={NOTE_ARIA[note] || note}
        >
          {note}
        </button>
      ))}

      {/* Naturals row */}
      {NATURALS.map(({ note, col }) => (
        <button
          key={note}
          class={btnClass(note, false, correctNote, wrongNote, revealCorrect)}
          style={{ gridColumn: col, gridRow: String(naturalRow) }}
          onClick={() => handleTap(note)}
          disabled={disabled}
          aria-label={NOTE_ARIA[note] || note}
          aria-pressed={correctNote === note || wrongNote === note ? 'true' : 'false'}
        >
          {note}
        </button>
      ))}
    </div>
  );
}
