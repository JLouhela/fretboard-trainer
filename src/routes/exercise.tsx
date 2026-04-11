import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { settings } from '../store';
import { getExerciseById } from '../data/exercises';
import { generateQuestions, checkAnswer, checkPositionAnswer, Question } from '../engine/question-generator';
import { SessionStats, createSessionStats, recordAnswer } from '../engine/scoring';
import { playFeedback, initAudio } from '../engine/audio';
import { noteAt } from '../data/tuning';
import { SHARP_NAMES, FLAT_NAMES } from '../data/notes';
import { Fretboard } from '../components/Fretboard';
import { Staff } from '../components/Staff';
import { NoteButtons } from '../components/NoteButtons';
import { ProgressBar } from '../components/ProgressBar';

export type Mistake = {
  prompt: 'position-to-name' | 'name-to-position' | 'staff-to-position';
  correctName: string;
  stringIndex: number;
  fret: number;
  userAnswer?: string;
};

type Props = {
  exerciseId: string;
  onBack: () => void;
  onComplete: (stats: SessionStats, exerciseId: string, mistakes: Mistake[]) => void;
};

type FeedbackState = {
  type: 'correct' | 'wrong' | null;
  userAnswer?: string;
  correctAnswer?: string;
  revealString?: number;
  revealFret?: number;
};

export function Exercise({ exerciseId, onBack, onComplete }: Props) {
  const config = getExerciseById(exerciseId);

  const s = settings.value;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState(createSessionStats());
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null });
  const [flashClass, setFlashClass] = useState('');
  const questionStartTime = useRef(Date.now());
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mistakesRef = useRef<Mistake[]>([]);

  // Generate questions once on mount
  useEffect(() => {
    if (!config) return;
    mistakesRef.current = [];
    setQuestions(generateQuestions(config, config.questionCount, s.useSharps));
    questionStartTime.current = Date.now();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  if (!config) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <p>Exercise not found.</p>
        <button class="btn btn-primary" onClick={onBack}>Back</button>
      </div>
    );
  }

  const currentQ = questions[qIndex];
  const isLastQuestion = qIndex >= config.questionCount - 1;
  const streak = sessionStats.currentStreak;

  function handleCorrect(q: Question) {
    const timeTaken = Date.now() - questionStartTime.current;
    const newStats = recordAnswer(sessionStats, true, timeTaken);
    setSessionStats(newStats);
    initAudio();
    playFeedback(true, q.midi);

    setFeedback({ type: 'correct', correctAnswer: q.correctName });
    setFlashClass('flash-correct');
    setTimeout(() => setFlashClass(''), 400);

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advance(newStats);
    }, 400);
  }

  function handleWrong(q: Question, userAnswer?: string, si?: number, fret?: number) {
    const timeTaken = Date.now() - questionStartTime.current;
    const newStats = recordAnswer(sessionStats, false, timeTaken);
    setSessionStats(newStats);
    initAudio();
    playFeedback(false, q.midi);

    setFeedback({
      type: 'wrong',
      userAnswer,
      correctAnswer: q.correctName,
      revealString: q.stringIndex,
      revealFret: q.fret,
    });
    setFlashClass('flash-wrong');
    setTimeout(() => setFlashClass(''), 1200);

    // Track mistake — resolve tapped note name for position-based answers
    let tappedNote: string | undefined = userAnswer;
    if (si !== undefined && fret !== undefined) {
      const pc = noteAt(si, fret);
      tappedNote = (s.useSharps ? SHARP_NAMES : FLAT_NAMES)[pc];
    }
    mistakesRef.current = [...mistakesRef.current, {
      prompt: q.prompt,
      correctName: q.correctName,
      stringIndex: q.stringIndex,
      fret: q.fret,
      userAnswer: tappedNote,
    }];

    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      advance(newStats);
    }, 1200);
  }

  function advance(newStats: typeof sessionStats) {
    setFeedback({ type: null });
    setFlashClass('');

    if (qIndex >= config!.questionCount - 1) {
      // Done
      onComplete(newStats, exerciseId, mistakesRef.current);
      return;
    }

    setQIndex(prev => prev + 1);
    questionStartTime.current = Date.now();
  }

  function handleNoteAnswer(note: string) {
    if (feedback.type !== null || !currentQ) return;
    const correct = checkAnswer(currentQ, note);
    if (correct) {
      handleCorrect(currentQ);
    } else {
      handleWrong(currentQ, note);
    }
  }

  function handlePositionTap(si: number, fret: number) {
    if (feedback.type !== null || !currentQ) return;
    const correct = checkPositionAnswer(currentQ, si, fret);
    if (correct) {
      handleCorrect(currentQ);
    } else {
      handleWrong(currentQ, undefined, si, fret);
    }
  }

  if (!currentQ) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  const prompt = currentQ.prompt;
  const isFeedbackVisible = feedback.type !== null;
  const isNamePrompt = prompt === 'position-to-name';

  // For name-to-position and staff-to-position: show all matching positions in green
  const correctPC = noteAt(currentQ.stringIndex, currentQ.fret);

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
          <div class="exercise-header-title">{config.title}</div>
          <div class="exercise-counter">
            {qIndex + 1} / {config.questionCount}
          </div>
        </div>
        <div class="streak-badge" aria-label={`Streak: ${streak}`}>
          {streak > 0 ? `🔥 ${streak}` : <span style={{ opacity: 0 }}>0</span>}
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ padding: '0 var(--space-4)' }}>
        <ProgressBar current={qIndex} total={config.questionCount} />
      </div>

      {/* Body */}
      <div class={`exercise-body ${flashClass}`}>

        {/* Staff-to-position: staff is the primary prompt */}
        {prompt === 'staff-to-position' && (
          <Staff midi={currentQ.midi} useSharps={s.useSharps} />
        )}

        {/* Position-to-name: fretboard with highlighted position, answer via note buttons */}
        {prompt === 'position-to-name' && (
          <Fretboard
            strings={config.displayStrings ?? config.strings}
            fretRange={config.fretRange}
            highlight={{ stringIndex: currentQ.stringIndex, fret: currentQ.fret }}
            showFretNumbers={s.showFretNumbers}
            revealAnswer={
              feedback.type === 'wrong'
                ? { stringIndex: currentQ.stringIndex, fret: currentQ.fret, correct: true }
                : undefined
            }
            disabled
          />
        )}

        {/* Name-to-position: note name + staff side by side, answer by tapping fretboard */}
        {prompt === 'name-to-position' && (
          <>
            <div class="name-prompt-row" aria-live="polite">
              <span class="prompt-note-name">{currentQ.correctName}</span>
              <Staff midi={currentQ.midi} useSharps={s.useSharps} scale={0.7} />
            </div>
            <Fretboard
              strings={config.displayStrings ?? config.strings}
              fretRange={config.fretRange}
              onTap={isFeedbackVisible ? undefined : handlePositionTap}
              showFretNumbers={s.showFretNumbers}
              revealAnswer={
                feedback.type === 'wrong'
                  ? { stringIndex: currentQ.stringIndex, fret: currentQ.fret, correct: true }
                  : feedback.type === 'correct'
                  ? { stringIndex: currentQ.stringIndex, fret: currentQ.fret, correct: true }
                  : undefined
              }
              highlightAllMatching={
                isFeedbackVisible && feedback.type === 'correct'
                  ? correctPC
                  : undefined
              }
              disabled={isFeedbackVisible}
            />
          </>
        )}

        {/* Staff-to-position fretboard (tappable) */}
        {prompt === 'staff-to-position' && (
          <Fretboard
            strings={config.displayStrings ?? config.strings}
            fretRange={config.fretRange}
            onTap={isFeedbackVisible ? undefined : handlePositionTap}
            showFretNumbers={s.showFretNumbers}
            revealAnswer={
              feedback.type === 'wrong'
                ? { stringIndex: currentQ.stringIndex, fret: currentQ.fret, correct: true }
                : feedback.type === 'correct'
                ? { stringIndex: currentQ.stringIndex, fret: currentQ.fret, correct: true }
                : undefined
            }
            highlightAllMatching={
              isFeedbackVisible && feedback.type === 'correct'
                ? correctPC
                : undefined
            }
            disabled={isFeedbackVisible}
          />
        )}

        {/* Note name buttons (for position-to-name) */}
        {isNamePrompt && (
          <NoteButtons
            useSharps={config.includeAccidentals && (s.useSharps || (!s.useSharps && !s.useFlats))}
            useFlats={config.includeAccidentals && s.useFlats}
            onAnswer={handleNoteAnswer}
            correctNote={feedback.type === 'correct' ? feedback.correctAnswer : undefined}
            wrongNote={feedback.type === 'wrong' ? feedback.userAnswer : undefined}
            revealCorrect={feedback.type === 'wrong' ? feedback.correctAnswer : undefined}
            disabled={isFeedbackVisible}
          />
        )}

        {/* Feedback indicator — always rendered to reserve space, no layout shift */}
        <div
          class={`feedback-indicator ${feedback.type === 'correct' ? 'feedback-correct' : feedback.type === 'wrong' ? 'feedback-wrong' : ''}`}
          role="status"
          aria-live="assertive"
          style={{ visibility: isFeedbackVisible ? 'visible' : 'hidden' }}
        >
          {feedback.type === 'correct' && <>✓ Correct! — {feedback.correctAnswer}</>}
          {feedback.type === 'wrong' && <>✗ Wrong — answer: {feedback.correctAnswer}</>}
        </div>
      </div>
    </div>
  );
}
