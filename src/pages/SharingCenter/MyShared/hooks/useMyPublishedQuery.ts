import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// MVP 范围：仅支持「自动化流程」与「知识」上架
export type TypeFilter = 'ALL' | 'WORKFLOW' | 'KNOWLEDGE';

// 列表 UI 维度的状态（MVP：去除 待审批 / 已拒绝）
export type DisplayStatus = 'DRAFT' | 'PUBLISHED' | 'UNLISTED';

export interface MyPublishedQueryState {
  statuses: DisplayStatus[];
  type: TypeFilter;
  keyword: string;
  page: number;
}

const VALID_STATUSES: DisplayStatus[] = ['DRAFT', 'PUBLISHED', 'UNLISTED'];
const VALID_TYPES: TypeFilter[] = ['ALL', 'WORKFLOW', 'KNOWLEDGE'];

const pick = <T extends string>(value: string | null, valid: T[], fallback: T): T =>
  valid.includes(value as T) ? (value as T) : fallback;

const parseStatuses = (raw: string | null): DisplayStatus[] => {
  if (!raw) return [];
  return raw.split(',')
    .map((s) => s.trim().toUpperCase())
    .filter((s): s is DisplayStatus => VALID_STATUSES.includes(s as DisplayStatus));
};

/**
 * URL ↔ State 双向同步：?status=&type=&search=&page=
 * 默认值不写入 URL，保持地址简洁。
 */
export function useMyPublishedQuery() {
  const [params, setParams] = useSearchParams();

  const initial = useMemo<MyPublishedQueryState>(() => ({
    statuses: parseStatuses(params.get('status')),
    type: pick(params.get('type'), VALID_TYPES, 'ALL'),
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
    if (state.statuses.length > 0) next.set('status', state.statuses.join(','));
    if (state.type !== 'ALL') next.set('type', state.type);
    const k = state.keyword.trim();
    if (k) next.set('search', k);
    if (state.page > 1) next.set('page', String(state.page));
    setParams(next, { replace: true });
  }, [state, setParams]);

  const setStatuses = useCallback((statuses: DisplayStatus[]) =>
    setState((s) => ({ ...s, statuses, page: 1 })), []);
  const setType = useCallback((type: TypeFilter) =>
    setState((s) => ({ ...s, type, page: 1 })), []);
  const setKeyword = useCallback((keyword: string) =>
    setState((s) => ({ ...s, keyword, page: 1 })), []);
  const setPage = useCallback((page: number) =>
    setState((s) => ({ ...s, page })), []);
  const reset = useCallback(() =>
    setState((s) => ({ ...s, statuses: [], type: 'ALL', keyword: '', page: 1 })), []);

  return {
    ...state,
    debouncedKeyword: debounced,
    setStatuses, setType, setKeyword, setPage, reset,
  };
}
