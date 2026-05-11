import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Typography, Tabs, Button, Input, Select, Pagination,
} from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import emptyImg from '@/assets/empty-state/no-data.png';
import type { ShareStatus } from '@/components/sharing/StatusTag';

import { type ShareAsset, queryMyPublished, getAll, getMine, subscribe } from './store';
import { useMyPublishedQuery, type TypeFilter } from './hooks/useMyPublishedQuery';
import SupplyAssetCard from './components/SupplyAssetCard';
import ReuseStatsPanel from './components/ReuseStatsPanel';
import PushNotificationDialog from './components/PushNotificationDialog';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const TABS: ShareStatus[] = ['PUBLISHED', 'PENDING_PUBLISH', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED'];
const PAGE_SIZE = 12;

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const useStoreVersion = () => useSyncExternalStore(subscribe, () => getAll().length);

const MySharedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useStoreVersion();
  // 通过 store.queryMyPublished 统一查询（Story 011）

  const {
    tab, type: typeF, source: sourceF, keyword, page, debouncedKeyword: debounced,
    setTab, setType, setKeyword, setPage, reset,
  } = useMyPublishedQuery();

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pushAsset, setPushAsset] = useState<ShareAsset | null>(null);
  const [aggregatedStatsVisible, setAggregatedStatsVisible] = useState(false);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  const { list: paged, total, tabCounts: counts } = useMemo(
    () => queryMyPublished({ tab, type: typeF, source: sourceF, search: debounced, page, pageSize: PAGE_SIZE }),
    [tab, typeF, sourceF, debounced, page],
  );

  const filtered = typeF !== 'ALL' || sourceF !== 'ALL' || !!debounced;
  const clearFilters = () => reset();

  const goDetail = (a: ShareAsset) => navigate(`/sharing-center/my-published/${typeRoute[a.type]}/${a.id}`);

  // 「已上架」Tab 顶部聚合复用记录
  const aggregatedReuse = useMemo(() => {
    if (tab !== 'PUBLISHED') return [];
    return getMine()
      .filter((a) => (a.type === 'WORKFLOW' || a.type === 'KNOWLEDGE')
        && (a.shareStatus === 'PUBLISHED' || a.shareStatus === 'ARCHIVED'))
      .flatMap((a) => a.reuseRecords ?? []);
  }, [tab]);

  return (
    <div className="my-shared-page">
      <div className="my-shared-header">
        <Title heading={3} className="title">{t('sharing.assetSupply.pageTitle')}</Title>
        <Button
          theme="solid"
          type="primary"
          icon={<Plus size={14} strokeWidth={2.5} />}
          onClick={() => navigate('/sharing-center/my-shared/create/knowledge')}
        >
          {t('sharing.assetSupply.newAsset.knowledge')}
        </Button>
      </div>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as ShareStatus)}
        className="my-shared-tabs"
        keepDOM={false}
      >
        {TABS.map((k) => (
          <TabPane key={k} itemKey={k} tab={`${t(`sharing.assetSupply.tabs.${k.toLowerCase()}`)} (${counts[k]})`} />
        ))}
      </Tabs>

      <div className="my-shared-toolbar">
        <Input
          prefix={<IconSearch />}
          value={keyword}
          onChange={setKeyword}
          placeholder={t('sharing.assetSupply.filters.searchPlaceholder')}
          showClear
          style={{ width: 320 }}
        />
        <Select
          value={typeF}
          onChange={(v) => setType(v as TypeFilter)}
          style={{ width: 140 }}
          insetLabel={t('sharing.assetSupply.filters.type')}
          optionList={[
            { value: 'ALL', label: t('sharing.assetSupply.filters.allType') },
            { value: 'WORKFLOW', label: t('sharing.assetSupply.newAsset.workflow') },
            { value: 'KNOWLEDGE', label: t('sharing.assetSupply.newAsset.knowledge') },
          ]}
        />
        {filtered && (
          <Button theme="borderless" type="tertiary" onClick={clearFilters}>
            {t('sharing.assetSupply.filters.clear')}
          </Button>
        )}
      </div>

      <div className="my-shared-body">
        {tab === 'PUBLISHED' && aggregatedReuse.length > 0 && (
          <div className="my-shared-reuse-summary">
            <Button
              theme="borderless"
              type="primary"
              onClick={() => setAggregatedStatsVisible(true)}
            >
              {t('sharing.assetSupply.card.viewAggregatedReuse', { count: aggregatedReuse.length })}
            </Button>
          </div>
        )}

        {paged.length === 0 ? (
          <div className="my-shared-empty">
            <img src={emptyImg} alt="empty" />
            <div className="empty-title">
              {filtered
                ? t('sharing.assetSupply.empty.noResult')
                : t(`sharing.assetSupply.empty.${tab.toLowerCase()}`)}
            </div>
            {!filtered && (tab === 'PUBLISHED' || tab === 'DRAFT') && (
              <Button
                theme="solid"
                type="primary"
                onClick={() => navigate('/sharing-center/my-shared/create/knowledge')}
                style={{ marginTop: 12 }}
              >
                {t('sharing.assetSupply.empty.createCta')}
              </Button>
            )}
          </div>
        ) : (
          <div className="my-shared-grid">
            {paged.map((a) => (
              <SupplyAssetCard
                key={a.id}
                asset={a}
                highlighted={a.id === highlightId}
                onView={() => goDetail(a)}
                onPush={(asset) => setPushAsset(asset)}
              />
            ))}
          </div>
        )}
      </div>

      {total > PAGE_SIZE && (
        <div className="list-pagination">
          <Pagination
            total={total}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
            showTotal
          />
        </div>
      )}

      <PushNotificationDialog
        visible={!!pushAsset}
        asset={pushAsset}
        onCancel={() => setPushAsset(null)}
      />

      <ReuseStatsPanel
        visible={aggregatedStatsVisible}
        onCancel={() => setAggregatedStatsVisible(false)}
        records={aggregatedReuse}
      />
    </div>
  );
};

export default MySharedPage;
