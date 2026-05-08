import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'sharing.collections';

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

const write = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
};

const listeners = new Set<(ids: string[]) => void>();
const notify = (ids: string[]) => listeners.forEach((fn) => fn(ids));

export const useCollections = () => {
  const [ids, setIds] = useState<string[]>(read);

  useEffect(() => {
    const handler = (next: string[]) => setIds(next);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    write(next);
    notify(next);
  }, []);

  const isCollected = useCallback((id: string) => ids.includes(id), [ids]);

  return { collectionIds: ids, toggle, isCollected };
};
