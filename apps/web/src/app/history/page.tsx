'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  logout,
  rpcClient,
  type GameResult,
  type LeaderboardEntry,
} from '../../lib/api';
import { useAuth } from '../../lib/use-auth';

function formatDateTime(value: Date | string): string {
  return new Date(value).toLocaleString();
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<Array<GameResult>>([]);
  const [leaderboard, setLeaderboard] = useState<Array<LeaderboardEntry>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace('/');
      return;
    }

    if (user === undefined) {
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [historyData, leaderboardData] = await Promise.all([
          rpcClient.game.myHistory({ limit: 10 }),
          rpcClient.leaderboard.list({ limit: 10 }),
        ]);

        if (cancelled) {
          return;
        }

        setHistory(historyData);
        setLeaderboard(leaderboardData);
      } catch {
        if (!cancelled) {
          setError('Could not load scoreboard data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [router, user]);

  if (user === undefined || isLoading) {
    return (
      <main className="screen">
        <section className="panel">
          <p className="muted">Loading scoreboard...</p>
        </section>
      </main>
    );
  }

  if (user === null) {
    return null;
  }

  return (
    <main className="screen">
      <section className="hero">
        <span className="pill">Stats</span>
        <h1>History & Leaderboard</h1>
      </section>

      <section className="panel stack">
        <div className="row">
          <strong>{user.name ?? user.email ?? 'Player'}</strong>
          <Link className="muted" href="/game">
            Back to Game
          </Link>
        </div>
        {error === null ? null : <p className="danger">{error}</p>}

        <h2>Your last 10 rounds</h2>
        {history.length === 0 ? (
          <p className="muted">No rounds yet. Play one game first.</p>
        ) : (
          <ol className="list">
            {history.map((item) => (
              <li className="list-item" key={item.id}>
                <strong>Score: {item.score}</strong>
                <br />
                <span className="muted">{formatDateTime(item.createdAt)}</span>
              </li>
            ))}
          </ol>
        )}

        <h2>Top 10 leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="muted">Leaderboard is empty.</p>
        ) : (
          <ol className="list">
            {leaderboard.map((item) => (
              <li className="list-item" key={item.resultId}>
                <strong>
                  {item.playerName}: {item.score}
                </strong>
                <br />
                <span className="muted">{formatDateTime(item.createdAt)}</span>
              </li>
            ))}
          </ol>
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
