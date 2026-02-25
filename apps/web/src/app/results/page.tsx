'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const score = Number.parseInt(searchParams.get('score') ?? '0', 10);
  const saved = searchParams.get('saved') === '1';

  return (
    <main className="screen">
      <section className="hero">
        <span className="pill">Results</span>
        <h1>Round complete.</h1>
        <p>Your score is ready for review.</p>
      </section>

      <section className="panel stack">
        <div className="metric">
          <span className="value">{Number.isNaN(score) ? 0 : score}</span>
          <span className="label">Final Score</span>
        </div>
        <p className={saved ? 'ok' : 'danger'}>
          {saved ? 'Saved to PostgreSQL successfully.' : 'Could not save this round.'}
        </p>
        <Link className="btn btn-primary" href="/game">
          Play Again
        </Link>
        <Link className="btn btn-ghost" href="/history">
          View History & Leaderboard
        </Link>
        <Link className="btn btn-ghost" href="/">
          Back to Login
        </Link>
      </section>
    </main>
  );
}
