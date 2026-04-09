import { h } from 'preact';
import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { settings } from '../store';
import { getExerciseById } from '../data/exercises';
import { generateQuestions, checkAnswer, checkPositionAnswer, Question } from '../engine/question-generator';
import { createSessionStats, recordAnswer } from '../engine/scoring';
import { recordPositionAnswer, getExerciseStats } from '../engine/stats';
import { playNote, playFeedback, initAudio } from '../engine/audio';
import { noteAt } from '../data/tuning';
import { Fretboard } from '../components/Fretboard';
import { Staff } from '../components/Staff';
import { NoteButtons } from '../components/NoteButtons';
import { ProgressBar } from '../components/ProgressBar';

type Props = {
  exerciseId: string;
  onBack: () => void;
  onComplete: (stats: any, exerciseId: string) => void;
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

  // Generate questions once on mount
  useEffect(() => {
    if (!config) return;
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
    recordPositionAnswer(exerciseId, q.stringIndex, q.fret, true);

    initAudio();
    playFeedback(true);
    setTimeout(() => playNote(q.midi, 500), 150);

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
    recordPositionAnswer(exerciseId, q.stringIndex, q.fret, false);

    initAudio();
    playFeedback(false);
    setTimeout(() => playNote(q.midi, 500), 200);

    setFeedback({
      type: 'wrong',
      userAnswer,
      correctAnswer: q.correctName,
      revealString: q.stringIndex,
      revealFret: q.fret,
    });
    setFlashClass('flash-wrong');
    setTimeout(() => setFlashClass(''), 1200);

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
      const exStats = getExerciseStats(exerciseId);
      onComplete({ sessionStats: newStats, exerciseStats: exStats }, exerciseId);
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
  const isPositionPrompt = prompt === 'name-to-position' || prompt === 'staff-to-position';
  const isNamePrompt = prompt === 'position-to-name' || prompt === 'staff-to-name';
  const isStaffPrompt = prompt === 'staff-to-position' || prompt === 'staff-to-name';

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

        {/* Staff prompt */}
        {isStaffPrompt && (
          <Staff midi={currentQ.midi} useSharps={s.useSharps} />
        )}

        {/* Position-to-name: show fretboard with highlight */}
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

        {/* Name-to-position or staff-to-position: show big note name or staff */}
        {(prompt === 'name-to-position' || prompt === 'staff-to-position') && (
          <>
            {prompt === 'name-to-position' && (
              <div class="prompt-display" aria-live="polite">
                {currentQ.correctName}
              </div>
            )}
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

        {/* Feedback indicator */}
        {isFeedbackVisible && (
          <div
            class={`feedback-indicator ${feedback.type === 'correct' ? 'feedback-correct' : 'feedback-wrong'}`}
            role="status"
            aria-live="assertive"
          >
            {feedback.type === 'correct' ? (
              <>✓ Correct! — {feedback.correctAnswer}</>
            ) : (
              <>✗ Wrong — answer: {feedback.correctAnswer}</>
            )}
          </div>
        )}

        {/* Note name buttons (for position-to-name or staff-to-name) */}
        {isNamePrompt && (
          <NoteButtons
            useSharps={s.useSharps || (!s.useSharps && !s.useFlats)}
            useFlats={s.useFlats}
            onAnswer={handleNoteAnswer}
            correctNote={feedback.type === 'correct' ? feedback.correctAnswer : undefined}
            wrongNote={feedback.type === 'wrong' ? feedback.userAnswer : undefined}
            revealCorrect={feedback.type === 'wrong' ? feedback.correctAnswer : undefined}
            disabled={isFeedbackVisible}
          />
        )}
      </div>
    </div>
  );
}
