import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Typography, Tabs, Table, Button, Input, Select, Pagination, Tag, Space, Tooltip,
} from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal } from 'lucide-react';
import StatusTag, { type ShareStatus } from '@/components/sharing/StatusTag';

import AssetTypeIcon from '@/pages/Sharing/Market/components/AssetTypeIcon';
import emptyImg from '@/assets/empty-state/no-data.png';
import { type ShareAsset, getMine, subscribe } from './store';
import NewAssetDropdown from './components/NewAssetDropdown';
import AssetActionsMenu from './components/AssetActionsMenu';
import BatchActionBar from './components/BatchActionBar';
import PublishWorkflowModal from './components/PublishWorkflowModal';
import './index.less';

const { Title, Text } = Typography;
const TabPane = Tabs.TabPane;

const TABS: ShareStatus[] = ['PUBLISHED', 'PENDING_PUBLISH', 'DRAFT', 'PENDING_APPROVAL', 'REJECTED'];
const PAGE_SIZE = 10;

type TypeFilter = 'ALL' | 'SNIPPET' | 'WORKFLOW' | 'KNOWLEDGE' | 'SKILL';
type SourceFilter = 'ALL' | 'NATIVE' | 'DEV_CENTER';

const typeRoute: Record<string, string> = { SNIPPET: 'snippet', WORKFLOW: 'workflow', KNOWLEDGE: 'knowledge', SKILL: 'skill' };

const useStoreVersion = () => useSyncExternalStore(subscribe, () => getMine().length);

const MySharedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useStoreVersion();
  const all = getMine();

  const [tab, setTab] = useState<ShareStatus>('PUBLISHED');
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [typeF, setTypeF] = useState<TypeFilter>('ALL');
  const [sourceF, setSourceF] = useState<SourceFilter>('ALL');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [publishVisible, setPublishVisible] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    if (!highlightId) return;
    const timer = window.setTimeout(() => setHighlightId(null), 2500);
    const raf = window.requestAnimationFrame(() => {
      const el = document.querySelector(`tr[data-row-key="${highlightId}"]`);
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
    return () => { window.clearTimeout(timer); window.cancelAnimationFrame(raf); };
  }, [highlightId]);

  const handlePublishSuccess = (assetId: string) => {
    setPublishVisible(false);
    setTab('PENDING_APPROVAL');
    setPage(1);
    setSelectedKeys([]);
    setHighlightId(assetId);
  };

  useEffect(() => {
    const k = keyword.trim();
    const timer = setTimeout(() => setDebounced(k), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const counts = useMemo(() => {
    const m: Record<ShareStatus, number> = {
      PUBLISHED: 0, PENDING_PUBLISH: 0, DRAFT: 0, PENDING_APPROVAL: 0, REJECTED: 0, ARCHIVED: 0, UNLISTED: 0,
    };
    all.forEach((a) => {
      // 「已上架」Tab 包含 PUBLISHED 与 ARCHIVED
      if (a.shareStatus === 'ARCHIVED') { m.PUBLISHED += 1; return; }
      if (m[a.shareStatus] !== undefined) m[a.shareStatus] += 1;
    });
    return m;
  }, [all]);

  const list = useMemo(() => {
    return all.filter((a) => {
      // Tab 匹配：「已上架」包含 PUBLISHED + ARCHIVED
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
  }, [all, tab, typeF, sourceF, debounced]);

  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const filtered = typeF !== 'ALL' || sourceF !== 'ALL' || !!debounced;
  const clearFilters = () => { setKeyword(''); setTypeF('ALL'); setSourceF('ALL'); };

  const goDetail = (a: ShareAsset) => navigate(`/sharing-center/market/${typeRoute[a.type]}/${a.id}`);

  const selectedAssets = list.filter((a) => selectedKeys.includes(a.id));

  const columns = [
    {
      title: t('sharing.myShared.col.name'),
      dataIndex: 'name',
      width: 280,
      ellipsis: { showTitle: false },
      render: (_: string, row: ShareAsset) => (
        <div className="cell-name">
          <AssetTypeIcon type={row.type} />
          <Button
            theme="borderless"
            type="primary"
            onClick={() => goDetail(row)}
            style={{ padding: 0, height: 'auto', minWidth: 0, flex: 1 }}
          >
            <Text ellipsis={{ showTooltip: true }} style={{ width: '100%' }}>{row.name}</Text>
          </Button>
        </div>
      ),
    },
    {
      title: t('sharing.myShared.col.type'),
      dataIndex: 'type',
      width: 100,
      render: (v: string) => t(`sharing.market.tabs.${v}`),
    },
    {
      title: t('sharing.myShared.col.status'),
      dataIndex: 'shareStatus',
      width: 100,
      render: (v: ShareStatus) => <StatusTag status={v} />,
    },
    {
      title: t('sharing.myShared.col.version'),
      dataIndex: 'currentVersion',
      width: 100,
    },
    {
      title: t('sharing.myShared.col.updatedAt'),
      dataIndex: 'updatedAt',
      width: 120,
    },
    {
      title: t('sharing.myShared.col.action'),
      width: 130,
      fixed: 'right' as const,
      render: (_: unknown, row: ShareAsset) => (
        <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
          <Button size="small" theme="borderless" type="primary" onClick={() => goDetail(row)}>
            {t('sharing.myShared.actions.view')}
          </Button>
          <AssetActionsMenu
            asset={row}
            trigger={
              <Button size="small" theme="borderless" type="tertiary" icon={<MoreHorizontal size={14} strokeWidth={2} />} />
            }
          />
        </div>
      ),
    },
  ];

  return (
    <div className="my-shared-page">
      <div className="my-shared-header">
        <Title heading={3} className="title">{t('sharing.myShared.pageTitle')}</Title>
        <NewAssetDropdown onPublishWorkflow={() => setPublishVisible(true)} />
      </div>

      <Tabs
        activeKey={tab}
        onChange={(k) => { setTab(k as ShareStatus); setPage(1); setSelectedKeys([]); }}
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
          onChange={(v) => { setKeyword(v); setPage(1); }}
          placeholder={t('sharing.myShared.filters.searchPlaceholder')}
          showClear
          style={{ width: 320 }}
        />
        <Select
          value={typeF}
          onChange={(v) => { setTypeF(v as TypeFilter); setPage(1); }}
          style={{ width: 140 }}
          insetLabel={t('sharing.myShared.filters.type')}
          optionList={[
            { value: 'ALL', label: t('sharing.myShared.filters.allType') },
            { value: 'SNIPPET', label: t('sharing.myShared.newAsset.snippet') },
            { value: 'WORKFLOW', label: t('sharing.myShared.newAsset.workflow') },
            { value: 'KNOWLEDGE', label: t('sharing.myShared.newAsset.knowledge') },
            { value: 'SKILL', label: t('sharing.myShared.newAsset.skill') },
          ]}
        />
        <Select
          value={sourceF}
          onChange={(v) => { setSourceF(v as SourceFilter); setPage(1); }}
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

      <BatchActionBar selected={selectedAssets} onClear={() => setSelectedKeys([])} />

      <div className="my-shared-body">
        <Table
          size="small"
          columns={columns}
          dataSource={paged}
          pagination={false}
          scroll={{ x: 900 }}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedKeys,
            onChange: (keys) => setSelectedKeys((keys ?? []) as string[]),
          }}
          onRow={(row) => ({
            'data-row-key': row?.id,
            className: row?.id === highlightId ? 'row-highlighted' : '',
          })}
          empty={
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
          }
        />
      </div>

      {list.length > 0 && (
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
    </div>
  );
};

export default MySharedPage;
