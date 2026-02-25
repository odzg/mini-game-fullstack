import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';

export interface SessionUser {
  email: string | null;
  id: string;
  name: string | null;
  picture: string | null;
}

export interface GameResult {
  createdAt: Date | string;
  durationMs: number;
  id: string;
  score: number;
}

export interface LeaderboardEntry {
  createdAt: Date | string;
  playerId: string;
  playerName: string;
  resultId: string;
  score: number;
}

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const rpcLink = new RPCLink({
  fetch: async (request, init) =>
    fetch(request, { ...init, credentials: 'include' }),
  url: `${apiBaseUrl}/rpc`,
});

const rpcClientUntyped = createORPCClient(rpcLink);

export const rpcClient = rpcClientUntyped as {
  game: {
    myHistory: (input?: { limit?: number }) => Promise<Array<GameResult>>;
    saveResult: (input: {
      durationMs: number;
      score: number;
    }) => Promise<GameResult>;
  };
  leaderboard: {
    list: (input?: { limit?: number }) => Promise<Array<LeaderboardEntry>>;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseUser(value: unknown): SessionUser | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  const email = value.email;
  const name = value.name;
  const picture = value.picture;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  if (email !== null && email !== undefined && typeof email !== 'string') {
    return null;
  }

  if (name !== null && name !== undefined && typeof name !== 'string') {
    return null;
  }

  if (picture !== null && picture !== undefined && typeof picture !== 'string') {
    return null;
  }

  return {
    email: email ?? null,
    id,
    name: name ?? null,
    picture: picture ?? null,
  };
}

export function getGoogleLoginUrl(): string {
  return `${apiBaseUrl}/auth/google/start`;
}

export async function fetchCurrentUser(): Promise<SessionUser | null> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to load auth session');
  }

  const payload = (await response.json()) as { user?: unknown };

  return parseUser(payload.user);
}

export async function logout(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/auth/logout`, {
    credentials: 'include',
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to logout');
  }
}
