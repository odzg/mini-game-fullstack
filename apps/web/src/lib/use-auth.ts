'use client';

import { useCallback, useEffect, useState } from 'react';

import { fetchCurrentUser, type SessionUser } from './api';

interface UseAuthState {
  error: string | null;
  refresh: () => Promise<void>;
  user: SessionUser | null | undefined;
}

export function useAuth(): UseAuthState {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
    } catch {
      setError('Could not load your session.');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { error, refresh, user };
}
