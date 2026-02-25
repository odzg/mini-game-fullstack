'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { getGoogleLoginUrl, logout } from '../lib/api';
import { useAuth } from '../lib/use-auth';

function getLoginErrorMessage(error: string | null): string | null {
  if (error === null) {
    return null;
  }

  if (error === 'oauth_state') {
    return 'Google login could not be verified. Please try again.';
  }

  return 'Login failed. Please retry.';
}

export default function LoginPage() {
  const { error, refresh, user } = useAuth();
  const searchParams = useSearchParams();
  const loginErrorMessage = getLoginErrorMessage(searchParams.get('error'));

  return (
    <main className="screen">
      <section className="hero">
        <span className="pill">Tap Sprint</span>
        <h1>Quick game. Real backend. Interview-ready setup.</h1>
        <p>Sign in with Google, play a 10-second tap challenge, save scores, and check history.</p>
      </section>

      <section className="panel stack">
        {loginErrorMessage === null ? null : (
          <p className="danger">{loginErrorMessage}</p>
        )}
        {error === null ? null : <p className="danger">{error}</p>}

        {user === undefined ? (
          <p className="muted">Checking your session...</p>
        ) : user === null ? (
          <>
            <a className="btn btn-primary" href={getGoogleLoginUrl()}>
              Continue with Google
            </a>
            <p className="muted">
              OAuth callback for local dev: <code>http://localhost:4000/auth/google/callback</code>
            </p>
          </>
        ) : (
          <>
            <p>
              Signed in as <strong>{user.name ?? user.email ?? 'Player'}</strong>
            </p>
            <Link className="btn btn-primary" href="/game">
              Start Game
            </Link>
            <Link className="btn btn-ghost" href="/history">
              View History & Leaderboard
            </Link>
            <button
              className="btn btn-danger"
              onClick={() => {
                void logout().then(refresh);
              }}
              type="button"
            >
              Logout
            </button>
          </>
        )}
      </section>
    </main>
  );
}
