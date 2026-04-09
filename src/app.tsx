import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Landing } from './routes/landing';
import { Exercise } from './routes/exercise';
import { Result } from './routes/result';
import { SessionStats } from './engine/scoring';
import { ExerciseStats } from './engine/stats';

type Route =
  | { name: 'landing' }
  | { name: 'exercise'; id: string }
  | { name: 'result'; sessionStats: SessionStats; exerciseStats?: ExerciseStats; exerciseId: string };

function getRouteFromHash(hash: string): Route {
  const h = hash.replace('#', '').replace(/^\//, '');
  if (!h || h === '/') return { name: 'landing' };
  if (h.startsWith('exercise/')) {
    const id = h.replace('exercise/', '');
    return { name: 'exercise', id };
  }
  return { name: 'landing' };
}

function setHash(path: string) {
  window.location.hash = '/' + path;
}

export function App() {
  const [route, setRoute] = useState<Route>(() =>
    getRouteFromHash(window.location.hash)
  );

  useEffect(() => {
    function handleHashChange() {
      const r = getRouteFromHash(window.location.hash);
      if (r.name !== 'result') {
        setRoute(r);
      }
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function navigateTo(r: Route) {
    setRoute(r);
    if (r.name === 'landing') {
      setHash('');
    } else if (r.name === 'exercise') {
      setHash(`exercise/${r.id}`);
    } else if (r.name === 'result') {
      setHash('result');
    }
  }

  if (route.name === 'landing') {
    return (
      <Landing
        onSelectExercise={(id) => navigateTo({ name: 'exercise', id })}
      />
    );
  }

  if (route.name === 'exercise') {
    return (
      <Exercise
        exerciseId={route.id}
        onBack={() => navigateTo({ name: 'landing' })}
        onComplete={(data: { sessionStats: SessionStats; exerciseStats: ExerciseStats }, exerciseId: string) => {
          navigateTo({
            name: 'result',
            sessionStats: data.sessionStats,
            exerciseStats: data.exerciseStats,
            exerciseId,
          });
        }}
      />
    );
  }

  if (route.name === 'result') {
    return (
      <Result
        sessionStats={route.sessionStats}
        exerciseStats={route.exerciseStats}
        exerciseId={route.exerciseId}
        onRetry={() => navigateTo({ name: 'exercise', id: route.exerciseId })}
        onBack={() => navigateTo({ name: 'landing' })}
      />
    );
  }

  return null;
}
