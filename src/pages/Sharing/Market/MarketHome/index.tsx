import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Typography, Tabs, Button } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMarketAssets, getMyReusedAssets, subscribe } from '@/pages/SharingCenter/MyShared/store';
import { SortKey, TabFilter } from '../types';
import { filterAndSort, paginate, PAGE_SIZE } from '../utils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import MarketToolbar from '../components/MarketToolbar';
import AssetListGrid from '../components/AssetListGrid';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const TAB_TYPES: TabFilter[] = ['ALL', 'WORKFLOW', 'KNOWLEDGE', 'MY_REUSED'];

const MarketHome = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('reuseCount');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const allAssets = useSyncExternalStore(subscribe, getMarketAssets, getMarketAssets);
  // 触发我已复用列表订阅
  useSyncExternalStore(subscribe, () => getMyReusedAssets().length, () => 0);

  // 通过 location.state.tab 切换（来自复用 Toast 链接）
  useEffect(() => {
    const stateTab = (location.state as { tab?: TabFilter } | null)?.tab;
    if (stateTab && TAB_TYPES.includes(stateTab)) {
      setTab(stateTab);
      setPage(1);
      // 清掉 state 防止重复
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // ALL Tab 仅聚合 WORKFLOW + KNOWLEDGE
  const mvpAssets = useMemo(
    () => allAssets.filter((a) => a.type === 'WORKFLOW' || a.type === 'KNOWLEDGE'),
    [allAssets],
  );

  const myReused = useMemo(() => getMyReusedAssets(), [allAssets]);
  const reusedAtMap = useMemo(() => {
    const m: Record<string, string> = {};
    myReused.forEach((a) => { m[a.id] = a.myReusedAt; });
    return m;
  }, [myReused]);

  const tabCounts = useMemo(() => {
    const counts: Record<TabFilter, number> = { ALL: 0, WORKFLOW: 0, KNOWLEDGE: 0, MY_REUSED: 0 };
    mvpAssets.forEach((a) => {
      counts.ALL += 1;
      if (a.type === 'WORKFLOW') counts.WORKFLOW += 1;
      else if (a.type === 'KNOWLEDGE') counts.KNOWLEDGE += 1;
    });
    counts.MY_REUSED = myReused.length;
    return counts;
  }, [mvpAssets, myReused]);

  const list = useMemo(() => {
    const base = tab === 'MY_REUSED'
      ? myReused
      : tab === 'ALL'
        ? mvpAssets
        : mvpAssets.filter((a) => a.type === tab);
    return filterAndSort(base, {
      type: 'ALL',
      keyword: debouncedSearch,
      source: 'ALL',
      sortBy: tab === 'MY_REUSED' ? 'createdAt' : sortBy,
    });
  }, [tab, mvpAssets, myReused, debouncedSearch, sortBy]);

  const paged = paginate(list, page, PAGE_SIZE);

  const handleTabChange = (key: string) => {
    setTab(key as TabFilter);
    setPage(1);
  };

  const tabLabel = (key: TabFilter) => `${t(`sharing.market.tabs.${key}`)} (${tabCounts[key]})`;

  const myReusedEmpty = (
    <Button
      theme="solid"
      type="primary"
      onClick={() => { setTab('ALL'); setPage(1); }}
    >
      {t('sharing.market.empty.myReusedAction')}
    </Button>
  );

  return (
    <div className="market-page">
      <div className="market-page-header">
        <Title heading={3} className="title">{t('sharing.market.pageTitle')}</Title>
      </div>

      <Tabs activeKey={tab} onChange={handleTabChange} className="market-tabs" keepDOM={false}>
        {TAB_TYPES.map((key) => (
          <TabPane key={key} itemKey={key} tab={tabLabel(key)} />
        ))}
      </Tabs>

      <MarketToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sortBy={sortBy}
        onSortChange={(v) => { setSortBy(v); setPage(1); }}
      />

      <div className="market-page-body">
        <AssetListGrid
          assets={paged}
          total={list.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          forceReused={tab === 'MY_REUSED'}
          reusedAtMap={reusedAtMap}
          emptyDescription={
            tab === 'MY_REUSED'
              ? t('sharing.market.empty.myReused')
              : t('sharing.market.empty.default')
          }
          emptyExtra={tab === 'MY_REUSED' ? myReusedEmpty : undefined}
        />
      </div>
    </div>
  );
};

export default MarketHome;
