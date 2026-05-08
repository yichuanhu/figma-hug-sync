import { Asset, AssetType, SortKey, SourceFilter } from './types';

export const filterAndSort = (
  list: Asset[],
  opts: {
    type?: AssetType | 'ALL';
    keyword?: string;
    source?: SourceFilter;
    sortBy: SortKey;
  }
): Asset[] => {
  const { type = 'ALL', keyword = '', source = 'ALL', sortBy } = opts;
  const kw = keyword.trim().toLowerCase();
  const filtered = list.filter((a) => {
    if (type !== 'ALL' && a.type !== type) return false;
    if (source !== 'ALL' && a.source !== source) return false;
    if (kw.length >= 2) {
      const match =
        a.name.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw) ||
        a.tags.some((tag) => tag.toLowerCase().includes(kw));
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
