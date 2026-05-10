import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ShareStatus } from '@/components/sharing/StatusTag';

export type TypeFilter = 'ALL' | 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
export type SourceFilter = 'ALL' | 'NATIVE' | 'DEV_CENTER';

export interface MyPublishedQueryState {
  tab: ShareStatus;
  type: TypeFilter;
  source: SourceFilter;
  keyword: string;
  page: number;
}

const VALID_TABS: ShareStatus[] = ['PUBLISHED', 'PENDING_PUBLISH', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED'];
const VALID_TYPES: TypeFilter[] = ['ALL', 'SNIPPET', 'WORKFLOW', 'KNOWLEDGE', 'SKILL'];
const VALID_SOURCES: SourceFilter[] = ['ALL', 'NATIVE', 'DEV_CENTER'];

const pick = <T extends string>(value: string | null, valid: T[], fallback: T): T =>
  valid.includes(value as T) ? (value as T) : fallback;

/**
 * URL ↔ State 双向同步：?tab=&type=&source=&search=&page=
 * 默认值不写入 URL，保持地址简洁。
 */
export function useMyPublishedQuery() {
  const [params, setParams] = useSearchParams();

  const initial = useMemo<MyPublishedQueryState>(() => ({
    tab: pick(params.get('tab'), VALID_TABS, 'PUBLISHED'),
    type: pick(params.get('type'), VALID_TYPES, 'ALL'),
    source: pick(params.get('source'), VALID_SOURCES, 'ALL'),
    keyword: params.get('search') ?? '',
    page: Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const [state, setState] = useState<MyPublishedQueryState>(initial);
  const [debounced, setDebounced] = useState(initial.keyword);

  // keyword 防抖
  useEffect(() => {
    const k = state.keyword.trim();
    const timer = setTimeout(() => setDebounced(k), 300);
    return () => clearTimeout(timer);
  }, [state.keyword]);

  // state -> URL
  useEffect(() => {
    const next = new URLSearchParams();
    if (state.tab !== 'PUBLISHED') next.set('tab', state.tab);
    if (state.type !== 'ALL') next.set('type', state.type);
    if (state.source !== 'ALL') next.set('source', state.source);
    const k = state.keyword.trim();
    if (k) next.set('search', k);
    if (state.page > 1) next.set('page', String(state.page));
    setParams(next, { replace: true });
  }, [state, setParams]);

  const setTab = useCallback((tab: ShareStatus) =>
    setState((s) => ({ ...s, tab, page: 1 })), []);
  const setType = useCallback((type: TypeFilter) =>
    setState((s) => ({ ...s, type, page: 1 })), []);
  const setSource = useCallback((source: SourceFilter) =>
    setState((s) => ({ ...s, source, page: 1 })), []);
  const setKeyword = useCallback((keyword: string) =>
    setState((s) => ({ ...s, keyword, page: 1 })), []);
  const setPage = useCallback((page: number) =>
    setState((s) => ({ ...s, page })), []);
  const reset = useCallback(() =>
    setState((s) => ({ ...s, type: 'ALL', source: 'ALL', keyword: '', page: 1 })), []);

  return {
    ...state,
    debouncedKeyword: debounced,
    setTab, setType, setSource, setKeyword, setPage, reset,
  };
}
