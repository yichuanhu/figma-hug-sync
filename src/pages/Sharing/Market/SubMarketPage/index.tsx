import { useMemo, useState } from 'react';
import { Typography, Tooltip, Button } from '@douyinfe/semi-ui';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { allAssets } from '../mockData';
import { AssetType, SortKey, SourceFilter } from '../types';
import { filterAndSort, paginate, PAGE_SIZE } from '../utils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import MarketToolbar from '../components/MarketToolbar';
import AssetListGrid from '../components/AssetListGrid';
import '../index.less';

const { Title } = Typography;

interface Props {
  type: AssetType;
  titleKey: string;
  /** 是否锁定来源（流程/流程块固定 DEV_CENTER；知识固定 NATIVE） */
  lockedSource?: 'NATIVE' | 'DEV_CENTER';
  /** 自定义工具栏左侧扩展（如技能类型筛选） */
  toolbarExtra?: React.ReactNode;
  /** 数据进一步过滤（如技能类型） */
  extraFilter?: (assets: typeof allAssets) => typeof allAssets;
  emptyKey?: string;
}

const SubMarketPage = ({ type, titleKey, lockedSource, toolbarExtra, extraFilter, emptyKey }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>(lockedSource ?? 'ALL');
  const [sortBy, setSortBy] = useState<SortKey>('reuseCount');
  const [page, setPage] = useState(1);
  const [, setRerender] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 300);

  const list = useMemo(() => {
    let base = allAssets.filter((a) => a.type === type);
    if (extraFilter) base = extraFilter(base);
    return filterAndSort(base, {
      type: 'ALL',
      keyword: debouncedSearch,
      source: lockedSource ?? sourceFilter,
      sortBy,
    });
  }, [type, debouncedSearch, sourceFilter, sortBy, lockedSource, extraFilter]);

  const paged = paginate(list, page, PAGE_SIZE);

  return (
    <div className="market-page">
      <div className="market-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip content={t('common.back')}>
            <Button
              type="tertiary"
              theme="borderless"
              icon={<ChevronLeft size={18} strokeWidth={2} />}
              onClick={() => navigate('/sharing/market')}
            />
          </Tooltip>
          <Title heading={3} className="title">{t(titleKey)}</Title>
        </div>
      </div>

      {toolbarExtra}

      <MarketToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        sourceFilter={sourceFilter}
        onSourceChange={(v) => { setSourceFilter(v); setPage(1); }}
        sortBy={sortBy}
        onSortChange={(v) => { setSortBy(v); setPage(1); }}
        showSourceFilter={!lockedSource}
      />

      <div className="market-page-body">
        <AssetListGrid
          assets={paged}
          total={list.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onReused={() => setRerender((x) => x + 1)}
          emptyDescription={emptyKey ? t(emptyKey) : t('sharing.market.empty.default')}
        />
      </div>
    </div>
  );
};

export default SubMarketPage;
