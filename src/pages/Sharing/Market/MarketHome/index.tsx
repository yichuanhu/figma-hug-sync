import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Typography, Select } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMarketAssets, subscribe } from '@/pages/SharingCenter/MyShared/store';
import type { Asset } from '../types';
import { SortKey } from '../types';
import { filterAndSort, paginate, PAGE_SIZE } from '../utils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import MarketToolbar from '../components/MarketToolbar';
import AssetListGrid from '../components/AssetListGrid';
import AssetDetailDrawer from '../components/AssetDetailDrawer';
import MyReusedDrawer from '../components/MyReusedDrawer';
import './index.less';

const { Title } = Typography;

type TypeFilter = 'ALL' | 'WORKFLOW' | 'KNOWLEDGE';

const MarketHome = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('reuseCount');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  // 详情抽屉 & 我已复用抽屉
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [reusedDrawerOpen, setReusedDrawerOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);

  const allAssets = useSyncExternalStore(subscribe, getMarketAssets, getMarketAssets);

  // 通过 query 参数或 location.state 触发"我已复用"抽屉
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const stateOpen = (location.state as { openReusedDrawer?: boolean } | null)?.openReusedDrawer;
    if (params.get('reused') === 'open' || stateOpen) {
      setReusedDrawerOpen(true);
      // 清除 query/state 防止刷新或返回时重复触发
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // MVP 仅 WORKFLOW + KNOWLEDGE
  const mvpAssets = useMemo(
    () => allAssets.filter((a) => a.type === 'WORKFLOW' || a.type === 'KNOWLEDGE'),
    [allAssets],
  );

  const list = useMemo(() => {
    const base = typeFilter === 'ALL'
      ? mvpAssets
      : mvpAssets.filter((a) => a.type === typeFilter);
    return filterAndSort(base, {
      type: 'ALL',
      keyword: debouncedSearch,
      source: 'ALL',
      sortBy,
      categories: categoryFilter,
    });
  }, [typeFilter, mvpAssets, debouncedSearch, sortBy, categoryFilter]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    mvpAssets.forEach((a) => {
      const cats = (a.categoryTags && a.categoryTags.length > 0) ? a.categoryTags : a.tags;
      cats.forEach((c) => { if (c) set.add(c); });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b)).map((v) => ({ value: v, label: v }));
  }, [mvpAssets]);

  const paged = paginate(list, page, PAGE_SIZE);

  const typeFilterNode = (
    <Select
      value={typeFilter}
      onChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1); }}
      style={{ width: 180 }}
      optionList={[
        { value: 'ALL', label: t('sharing.market.tabs.ALL') },
        { value: 'WORKFLOW', label: t('sharing.market.tabs.WORKFLOW') },
        { value: 'KNOWLEDGE', label: t('sharing.market.tabs.KNOWLEDGE') },
      ]}
      prefix={<span className="market-toolbar-prefix">{t('sharing.market.filter.type')}</span>}
    />
  );

  const handleSelectFromReusedDrawer = (asset: Asset) => {
    setReusedDrawerOpen(false);
    setDetailAsset(asset);
  };

  return (
    <div className="market-page">
      <div className="market-page-header">
        <Title heading={3} className="title">{t('sharing.market.pageTitle')}</Title>
      </div>

      <MarketToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sortBy={sortBy}
        onSortChange={(v) => { setSortBy(v); setPage(1); }}
        extra={typeFilterNode}
        onOpenReused={() => setReusedDrawerOpen(true)}
        categoryFilter={categoryFilter}
        onCategoryChange={(v) => { setCategoryFilter(v); setPage(1); }}
        categoryOptions={categoryOptions}
      />

      <div className="market-page-body">
        <AssetListGrid
          assets={paged}
          total={list.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          emptyDescription={t('sharing.market.empty.default')}
          onAssetSelect={(a) => setDetailAsset(a)}
        />
      </div>

      <AssetDetailDrawer
        visible={!!detailAsset}
        onClose={() => setDetailAsset(null)}
        asset={detailAsset}
        dataList={list}
        onNavigate={(a) => setDetailAsset(a)}
      />

      <MyReusedDrawer
        visible={reusedDrawerOpen}
        onClose={() => setReusedDrawerOpen(false)}
        onSelectAsset={handleSelectFromReusedDrawer}
      />
    </div>
  );
};

export default MarketHome;
