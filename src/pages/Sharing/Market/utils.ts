import { Asset, AssetType, AssetHistoryKind, SortKey, SourceFilter } from './types';

/**
 * 根据资产类型推导其历史类型：
 * - KNOWLEDGE => CHANGE（变更历史）
 * - 其他      => RELEASE（上架历史）
 */
export const getHistoryKindByAssetType = (type: AssetType): AssetHistoryKind =>
  type === 'KNOWLEDGE' ? 'CHANGE' : 'RELEASE';

/** 解析单条版本记录的历史类型，缺省时按资产类型推导 */
export const resolveHistoryKind = (
  assetType: AssetType,
  version?: { historyKind?: AssetHistoryKind },
): AssetHistoryKind => version?.historyKind ?? getHistoryKindByAssetType(assetType);


export const filterAndSort = (
  list: Asset[],
  opts: {
    type?: AssetType | 'ALL';
    keyword?: string;
    source?: SourceFilter;
    sortBy: SortKey;
    categories?: string[];
  }
): Asset[] => {
  const { type = 'ALL', keyword = '', source = 'ALL', sortBy, categories = [] } = opts;
  const kw = keyword.trim().toLowerCase();
  const filtered = list.filter((a) => {
    if (type !== 'ALL' && a.type !== type) return false;
    if (source !== 'ALL' && a.source !== source) return false;
    if (categories.length > 0) {
      const assetCats = (a.categoryTags && a.categoryTags.length > 0) ? a.categoryTags : a.tags;
      if (!assetCats.some((tag) => categories.includes(tag))) return false;
    }
    if (kw.length >= 2) {
      const name = (a.displayName || a.name).toLowerCase();
      const desc = (a.displayDesc || a.description).toLowerCase();
      const match = name.includes(kw) || desc.includes(kw);
      if (!match) return false;
    }
    return true;
  });

  if (sortBy === 'reuseCount') {
    filtered.sort((a, b) => b.reuseCount - a.reuseCount);
  } else {
    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return filtered;
};

export const paginate = <T,>(list: T[], page: number, pageSize: number): T[] => {
  const start = (page - 1) * pageSize;
  return list.slice(start, start + pageSize);
};

export const PAGE_SIZE = 12;
