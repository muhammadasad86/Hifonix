import { useEffect, useState } from 'react';

/** Minimal async resource hook: loading / error / data, re-runs when `key` changes. */
export function useResource<T>(key: string, load: () => Promise<T>) {
  const [state, setState] = useState<{ key: string; data: T | null; error: string | null; loading: boolean }>({
    key,
    data: null,
    error: null,
    loading: true,
  });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ key, data: s.key === key ? s.data : null, error: null, loading: true }));
    load().then(
      (data) => alive && setState({ key, data, error: null, loading: false }),
      (e: unknown) => alive && setState({ key, data: null, error: e instanceof Error ? e.message : 'Could not load.', loading: false }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
