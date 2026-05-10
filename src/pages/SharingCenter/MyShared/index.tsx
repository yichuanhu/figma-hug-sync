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

import { type ShareAsset, getMine, subscribe } from './store';
import { useMyPublishedQuery, type TypeFilter, type SourceFilter } from './hooks/useMyPublishedQuery';
import SupplyAssetCard from './components/SupplyAssetCard';
import ReuseSummaryPanel from './components/ReuseSummaryPanel';
import PushNotificationDialog from './components/PushNotificationDialog';
import './index.less';

const { Title } = Typography;
const TabPane = Tabs.TabPane;

const TABS: ShareStatus[] = ['PUBLISHED', 'PENDING_PUBLISH', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED'];
const PAGE_SIZE = 12;

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const useStoreVersion = () => useSyncExternalStore(subscribe, () => getMine().length);

const MySharedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useStoreVersion();
  const all = getMine();

  const {
    tab, type: typeF, source: sourceF, keyword, page, debouncedKeyword: debounced,
    setTab, setType, setSource, setKeyword, setPage, reset,
  } = useMyPublishedQuery();

  const [publishVisible, setPublishVisible] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [pushAsset, setPushAsset] = useState<ShareAsset | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 2500);
    return () => window.clearTimeout(timer);
  }, [highlightId]);

  const handlePublishSuccess = (assetId: string) => {
    setPublishVisible(false);
    setTab('PENDING_APPROVAL');
    setHighlightId(assetId);
  };

  // MVP 范围：仅展示「自动化流程」与「知识」两类资产
  const mvpAssets = useMemo(
    () => all.filter((a) => a.type === 'WORKFLOW' || a.type === 'KNOWLEDGE'),
    [all],
  );

  const counts = useMemo(() => {
    const m: Record<ShareStatus, number> = {
      PUBLISHED: 0, PENDING_PUBLISH: 0, DRAFT: 0, PENDING_APPROVAL: 0, REJECTED: 0, ARCHIVED: 0, UNLISTED: 0,
    };
    mvpAssets.forEach((a) => {
      if (a.shareStatus === 'ARCHIVED') { m.PUBLISHED += 1; return; }
      if (m[a.shareStatus] !== undefined) m[a.shareStatus] += 1;
    });
    return m;
  }, [mvpAssets]);

  const list = useMemo(() => {
    return mvpAssets.filter((a) => {
      if (tab === 'PUBLISHED') {
        if (a.shareStatus !== 'PUBLISHED' && a.shareStatus !== 'ARCHIVED') return false;
      } else if (a.shareStatus !== tab) return false;
      if (typeF !== 'ALL' && a.type !== typeF) return false;
      if (sourceF !== 'ALL' && a.source !== sourceF) return false;
      if (debounced) {
        const k = debounced.toLowerCase();
        const hit = a.name.toLowerCase().includes(k)
          || a.description.toLowerCase().includes(k)
          || a.tags.some((tag) => tag.toLowerCase().includes(k));
        if (!hit) return false;
      }
      return true;
    });
  }, [mvpAssets, tab, typeF, sourceF, debounced]);

  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filtered = typeF !== 'ALL' || sourceF !== 'ALL' || !!debounced;
  const clearFilters = () => reset();

  const goDetail = (a: ShareAsset) => navigate(`/sharing-center/my-published/${typeRoute[a.type]}/${a.id}`);

  // 「已上架」Tab 顶部聚合复用记录
  const aggregatedReuse = useMemo(() => {
    if (tab !== 'PUBLISHED') return [];
    return mvpAssets
      .filter((a) => a.shareStatus === 'PUBLISHED' || a.shareStatus === 'ARCHIVED')
      .flatMap((a) => a.reuseRecords ?? []);
  }, [mvpAssets, tab]);

  return (
    <div className="my-shared-page">
      <div className="my-shared-header">
        <Title heading={3} className="title">{t('sharing.myShared.pageTitle')}</Title>
        <NewAssetDropdown onPublishWorkflow={() => setPublishVisible(true)} />
      </div>

      <Tabs
        activeKey={tab}
        onChange={(k) => setTab(k as ShareStatus)}
        className="my-shared-tabs"
        keepDOM={false}
      >
        {TABS.map((k) => (
          <TabPane key={k} itemKey={k} tab={`${t(`sharing.myShared.tabs.${k.toLowerCase()}`)} (${counts[k]})`} />
        ))}
      </Tabs>

      <div className="my-shared-toolbar">
        <Input
          prefix={<IconSearch />}
          value={keyword}
          onChange={setKeyword}
          placeholder={t('sharing.myShared.filters.searchPlaceholder')}
          showClear
          style={{ width: 320 }}
        />
        <Select
          value={typeF}
          onChange={(v) => setType(v as TypeFilter)}
          style={{ width: 140 }}
          insetLabel={t('sharing.myShared.filters.type')}
          optionList={[
            { value: 'ALL', label: t('sharing.myShared.filters.allType') },
            { value: 'WORKFLOW', label: t('sharing.myShared.newAsset.workflow') },
            { value: 'KNOWLEDGE', label: t('sharing.myShared.newAsset.knowledge') },
          ]}
        />
        <Select
          value={sourceF}
          onChange={(v) => setSource(v as SourceFilter)}
          style={{ width: 160 }}
          insetLabel={t('sharing.myShared.filters.source')}
          optionList={[
            { value: 'ALL', label: t('sharing.myShared.filters.allSource') },
            { value: 'NATIVE', label: t('sharing.common.source.native') },
            { value: 'DEV_CENTER', label: t('sharing.common.source.devCenter') },
          ]}
        />
        {filtered && (
          <Button theme="borderless" type="tertiary" onClick={clearFilters}>
            {t('sharing.myShared.filters.clear')}
          </Button>
        )}
      </div>

      <div className="my-shared-body">
        {tab === 'PUBLISHED' && aggregatedReuse.length > 0 && (
          <div className="my-shared-reuse-summary">
            <ReuseSummaryPanel records={aggregatedReuse} />
          </div>
        )}

        {paged.length === 0 ? (
          <div className="my-shared-empty">
            <img src={emptyImg} alt="empty" />
            <div className="empty-title">
              {filtered
                ? t('sharing.myShared.empty.noResult')
                : t(`sharing.myShared.empty.${tab.toLowerCase()}`)}
            </div>
            {!filtered && (tab === 'PUBLISHED' || tab === 'DRAFT') && (
              <Button
                theme="solid"
                type="primary"
                onClick={() => navigate('/sharing-center/my-shared/create/knowledge')}
                style={{ marginTop: 12 }}
              >
                {t('sharing.myShared.empty.createCta')}
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

      {list.length > PAGE_SIZE && (
        <div className="list-pagination">
          <Pagination
            total={list.length}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
            showTotal
          />
        </div>
      )}

      <PublishWorkflowModal
        visible={publishVisible}
        onCancel={() => setPublishVisible(false)}
        onSuccess={handlePublishSuccess}
      />

      <PushNotificationDialog
        visible={!!pushAsset}
        asset={pushAsset}
        onCancel={() => setPushAsset(null)}
      />
    </div>
  );
};

export default MySharedPage;
