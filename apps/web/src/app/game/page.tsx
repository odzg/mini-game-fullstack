'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { logout, rpcClient } from '../../lib/api';
import { useAuth } from '../../lib/use-auth';

const GAME_DURATION_MS = 10_000;

type GameState = 'idle' | 'running' | 'saving';

export default function GamePage() {
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(GAME_DURATION_MS);
  const [state, setState] = useState<GameState>('idle');
  const [error, setError] = useState<string | null>(null);
  const scoreRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace('/');
    }
  }, [router, user]);

  const finishGame = useCallback(
    async (finalScore: number) => {
      setState('saving');
      setError(null);

      try {
        await rpcClient.game.saveResult({
          durationMs: GAME_DURATION_MS,
          score: finalScore,
        });
        router.push(`/results?score=${finalScore}&saved=1`);
      } catch {
        router.push(`/results?score=${finalScore}&saved=0`);
      }
    },
    [router],
  );

  useEffect(() => {
    if (state !== 'running') {
      return;
    }

    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextTimeLeftMs = Math.max(0, GAME_DURATION_MS - elapsedMs);

      setTimeLeftMs(nextTimeLeftMs);

      if (nextTimeLeftMs === 0) {
        clearInterval(timer);
        void finishGame(scoreRef.current);
      }
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, [finishGame, state]);

  if (user === undefined) {
    return (
      <main className="screen">
        <section className="panel">
          <p className="muted">Loading your session...</p>
        </section>
      </main>
    );
  }

  if (user === null) {
    return null;
  }

  const secondsRemaining = (timeLeftMs / 1000).toFixed(1);

  return (
    <main className="screen">
      <section className="hero">
        <span className="pill">Game</span>
        <h1>Tap as fast as you can for 10 seconds.</h1>
      </section>

      <section className="panel stack">
        <div className="row">
          <strong>{user.name ?? user.email ?? 'Player'}</strong>
          <Link className="muted" href="/history">
            History
          </Link>
        </div>

        <div className="row">
          <div className="metric">
            <span className="value">{score}</span>
            <span className="label">Score</span>
          </div>
          <div className="metric">
            <span className="value">{secondsRemaining}s</span>
            <span className="label">Time Left</span>
          </div>
        </div>

        <button
          className="tap-zone"
          data-running={state === 'running'}
          disabled={state !== 'running'}
          onClick={() => {
            if (state !== 'running') {
              return;
            }

            setScore((previous) => {
              const nextScore = previous + 1;
              scoreRef.current = nextScore;
              return nextScore;
            });
          }}
          type="button"
        >
          {state === 'running' ? 'Tap!' : 'Press Start'}
        </button>

        {error === null ? null : <p className="danger">{error}</p>}

        {state === 'idle' ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              scoreRef.current = 0;
              setError(null);
              setScore(0);
              setTimeLeftMs(GAME_DURATION_MS);
              setState('running');
            }}
            type="button"
          >
            Start 10-Second Round
          </button>
        ) : state === 'saving' ? (
          <p className="muted">Saving your result...</p>
        ) : (
          <button
            className="btn btn-ghost"
            onClick={() => {
              void finishGame(scoreRef.current);
            }}
            type="button"
          >
            Finish Now
          </button>
        )}

        <button
          className="btn btn-danger"
          onClick={() => {
            void logout().then(() => {
              router.push('/');
            });
          }}
          type="button"
        >
          Logout
        </button>
      </section>
    </main>
  );
}
