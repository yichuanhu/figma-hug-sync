import { useMemo, useState } from 'react';
import { Typography, Tabs } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { allAssets } from '../mockData';
import { AssetType, SortKey, SourceFilter, TabFilter } from '../types';
import { filterAndSort, paginate, PAGE_SIZE } from '../utils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import MarketToolbar from '../components/MarketToolbar';
import CreateAssetDropdown from '../components/CreateAssetDropdown';
import AssetListGrid from '../components/AssetListGrid';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const TAB_TYPES: TabFilter[] = ['ALL', 'WORKFLOW', 'KNOWLEDGE', 'SKILL', 'SNIPPET'];

const MarketHome = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('reuseCount');
  const [page, setPage] = useState(1);
  const [, setRerender] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 300);

  const tabCounts = useMemo(() => {
    const counts: Record<TabFilter, number> = { ALL: 0, SNIPPET: 0, WORKFLOW: 0, KNOWLEDGE: 0, SKILL: 0 };
    allAssets.forEach((a) => {
      counts.ALL += 1;
      counts[a.type] += 1;
    });
    return counts;
  }, []);

  const list = useMemo(() => filterAndSort(allAssets, {
    type: tab,
    keyword: debouncedSearch,
    source: sourceFilter,
    sortBy,
  }), [tab, debouncedSearch, sourceFilter, sortBy]);

  const paged = paginate(list, page, PAGE_SIZE);

  const handleTabChange = (key: string) => {
    setTab(key as TabFilter);
    setPage(1);
  };

  const tabLabel = (key: TabFilter) => `${t(`sharing.market.tabs.${key}`)} (${tabCounts[key]})`;

  return (
    <div className="market-page">
      <div className="market-page-header">
        <Title heading={3} className="title">{t('sharing.market.pageTitle')}</Title>
        <CreateAssetDropdown />
      </div>

      <Tabs activeKey={tab} onChange={handleTabChange} className="market-tabs" keepDOM={false}>
        {TAB_TYPES.map((key) => (
          <TabPane key={key} itemKey={key} tab={tabLabel(key)} />
        ))}
      </Tabs>

      <MarketToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sourceFilter={sourceFilter}
        onSourceChange={(v) => { setSourceFilter(v); setPage(1); }}
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
          onReused={() => setRerender((x) => x + 1)}
          emptyDescription={t('sharing.market.empty.default')}
        />
      </div>
    </div>
  );
};

export default MarketHome;
