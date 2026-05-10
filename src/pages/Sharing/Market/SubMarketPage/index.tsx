import { useMemo, useState, useSyncExternalStore } from 'react';
import { Typography, Tooltip, Button } from '@douyinfe/semi-ui';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMarketAssets, subscribe } from '@/pages/SharingCenter/MyShared/store';
import type { Asset } from '../types';
import { AssetType, SortKey } from '../types';
import { filterAndSort, paginate, PAGE_SIZE } from '../utils';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import MarketToolbar from '../components/MarketToolbar';
import AssetListGrid from '../components/AssetListGrid';
import '../index.less';

const { Title } = Typography;

interface Props {
  type: AssetType;
  titleKey: string;
  toolbarExtra?: React.ReactNode;
  extraFilter?: (assets: Asset[]) => Asset[];
  emptyKey?: string;
}

const SubMarketPage = ({ type, titleKey, toolbarExtra, extraFilter, emptyKey }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('reuseCount');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  const allAssets = useSyncExternalStore(subscribe, getMarketAssets, getMarketAssets);

  const list = useMemo(() => {
    let base = allAssets.filter((a) => a.type === type);
    if (extraFilter) base = extraFilter(base);
    return filterAndSort(base, {
      type: 'ALL',
      keyword: debouncedSearch,
      source: 'ALL',
      sortBy,
    });
  }, [allAssets, type, debouncedSearch, sortBy, extraFilter]);

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
              onClick={() => navigate('/sharing-center/market')}
            />
          </Tooltip>
          <Title heading={3} className="title">{t(titleKey)}</Title>
        </div>
      </div>

      {toolbarExtra}

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
          emptyDescription={emptyKey ? t(emptyKey) : t('sharing.market.empty.default')}
        />
      </div>
    </div>
  );
};

export default SubMarketPage;
