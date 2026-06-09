import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Typography, Button, Input, Select, Pagination, Table, Dropdown, Space, Tooltip,
} from '@douyinfe/semi-ui';
import AssetIdentity from '@/pages/Sharing/Market/components/AssetIdentity';
import { IconSearch } from '@douyinfe/semi-icons';
import { ChevronDown, Plus, Workflow as WorkflowIcon, BookOpen, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import emptyImg from '@/assets/empty-state/no-data.png';

import { type ShareAsset, type DisplayStatus as StoreDisplayStatus, queryMyPublished, toDisplayStatus, getAll, subscribe } from './store';
import { useMyPublishedQuery, type TypeFilter, type DisplayStatus } from './hooks/useMyPublishedQuery';
import StatusTag, { type ShareStatus } from '@/components/sharing/StatusTag';
import AssetActionsMenu from './components/AssetActionsMenu';
import MySharedDetailDrawer from './components/MySharedDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

const PAGE_SIZE = 12;

const useStoreVersion = () => useSyncExternalStore(subscribe, () => getAll().length);

// 将 DisplayStatus 映射为底层 ShareStatus，便于 StatusTag 复用现有图标/颜色
const displayToShareStatus: Record<StoreDisplayStatus, ShareStatus> = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  UNLISTED: 'UNLISTED',
};

const MySharedPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useStoreVersion();

  const {
    statuses, type: typeF, keyword, page, debouncedKeyword: debounced,
    setStatuses, setType, setKeyword, setPage, reset,
  } = useMyPublishedQuery();

  const [activeId, setActiveId] = useState<string | null>(null);

  const { list, total } = useMemo(
    () => queryMyPublished({ statuses, type: typeF, search: debounced, page, pageSize: PAGE_SIZE }),
    [statuses, typeF, debounced, page],
  );

  const filtered = typeF !== 'ALL' || !!debounced || statuses.length > 0;
  const activeAsset = useMemo(() => (activeId ? list.find((a) => a.id === activeId) ?? null : null), [activeId, list]);

  // 当列表更新且当前选中项已不在视图中时关闭抽屉
  useEffect(() => {
    if (activeId && !list.some((a) => a.id === activeId)) setActiveId(null);
  }, [list, activeId]);

  const handleCreate = (kind: 'workflow' | 'knowledge') => {
    if (kind === 'workflow') navigate('/sharing-center/my-published/workflow/create');
    else navigate('/sharing-center/my-published/knowledge/create');
  };

  const columns = [
    {
      title: t('sharing.assetSupply.col.name'),
      dataIndex: 'name',
      render: (_: unknown, a: ShareAsset) => {
        const isWorkflow = a.type === 'WORKFLOW';
        const typeLabel = t(isWorkflow
          ? 'sharing.assetSupply.filters.typeWorkflow'
          : 'sharing.assetSupply.filters.typeKnowledge');
        const Icon = isWorkflow ? WorkflowIcon : BookOpen;
        const color = isWorkflow ? 'rgba(var(--semi-blue-6), 1)' : 'rgba(var(--semi-green-6), 1)';
        return (
          <div className="cell-name">
            <Tooltip content={typeLabel}>
              <span className="cell-name-icon">
                <Icon size={16} strokeWidth={2} color={color} />
              </span>
            </Tooltip>
            <div className="cell-name-text">
              <AssetIdentity asset={a} size="sm" ellipsis />
              {a.description && (
                <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} className="cell-name-desc">
                  {a.description}
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('sharing.assetSupply.col.status'),
      dataIndex: 'shareStatus',
      width: 110,
      render: (_: unknown, a: ShareAsset) => {
        const ds = toDisplayStatus(a.shareStatus);
        return <StatusTag status={displayToShareStatus[ds]} />;
      },
    },
    {
      title: t('sharing.assetSupply.col.reuseCount'),
      dataIndex: 'reuseRecords',
      width: 100,
      render: (_: unknown, a: ShareAsset) => {
        const n = a.reuseRecords?.length ?? 0;
        return <Text size="small">{n > 0 ? n : '-'}</Text>;
      },
    },
    {
      title: t('sharing.assetSupply.col.updatedAt'),
      dataIndex: 'updatedAt',
      width: 130,
      render: (v: string) => <Text type="tertiary" size="small">{v}</Text>,
    },
    {
      title: t('sharing.assetSupply.col.action'),
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, a: ShareAsset) => (
        a.shareStatus === 'UNLISTED' ? null : (
          <span onClick={(e) => e.stopPropagation()}>
            <AssetActionsMenu
              asset={a}
              trigger={<Button theme="borderless" type="tertiary" size="small" icon={<MoreHorizontal size={16} strokeWidth={2} />} />}
            />
          </span>
        )
      ),
    },
  ];

  return (
    <div className="my-shared-page app-layout-content-card">
      <div className="my-shared-header">
        <Title heading={3} className="title">{t('sharing.assetSupply.pageTitle')}</Title>
        <Dropdown
          trigger="click"
          position="bottomRight"
          render={(
            <Dropdown.Menu>
              <Dropdown.Item icon={<WorkflowIcon size={14} strokeWidth={2} />} onClick={() => handleCreate('workflow')}>
                {t('sharing.assetSupply.newAsset.workflowShort')}
              </Dropdown.Item>
              <Dropdown.Item icon={<BookOpen size={14} strokeWidth={2} />} onClick={() => handleCreate('knowledge')}>
                {t('sharing.assetSupply.newAsset.knowledgeShort')}
              </Dropdown.Item>
            </Dropdown.Menu>
          )}
        >
          <Button
            theme="solid"
            type="primary"
            icon={<Plus size={14} strokeWidth={2.5} />}
          >
            <Space spacing={2}>
              {t('sharing.assetSupply.newAsset.entry')}
              <ChevronDown size={14} strokeWidth={2} />
            </Space>
          </Button>
        </Dropdown>
      </div>

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
          style={{ minWidth: 140 }}
          insetLabel={t('sharing.assetSupply.filters.type')}
          optionList={[
            { value: 'ALL', label: t('sharing.assetSupply.filters.allType') },
            { value: 'WORKFLOW', label: t('sharing.assetSupply.filters.typeWorkflow') },
            { value: 'KNOWLEDGE', label: t('sharing.assetSupply.filters.typeKnowledge') },
          ]}
        />
        <Select
          value={statuses}
          onChange={(v) => setStatuses((v as DisplayStatus[]) ?? [])}
          style={{ minWidth: 180 }}
          insetLabel={t('sharing.assetSupply.filters.status')}
          multiple
          maxTagCount={1}
          placeholder={t('sharing.assetSupply.filters.allStatus')}
          optionList={[
            { value: 'DRAFT', label: t('sharing.assetSupply.statusOptions.draft') },
            { value: 'PUBLISHED', label: t('sharing.assetSupply.statusOptions.published') },
            { value: 'UNLISTED', label: t('sharing.assetSupply.statusOptions.unlisted') },
          ]}
        />
        {filtered && (
          <Button theme="borderless" type="tertiary" onClick={reset}>
            {t('sharing.assetSupply.filters.clear')}
          </Button>
        )}
      </div>

      <div className="my-shared-body">
        {list.length === 0 ? (
          <div className="my-shared-empty">
            <img src={emptyImg} alt="empty" />
            <div className="empty-title">
              {filtered
                ? t('sharing.assetSupply.empty.noResult')
                : t('sharing.assetSupply.empty.title')}
            </div>
            {!filtered && (
              <Button
                theme="solid"
                type="primary"
                onClick={() => handleCreate('knowledge')}
                style={{ marginTop: 12 }}
              >
                {t('sharing.assetSupply.empty.createCta')}
              </Button>
            )}
          </div>
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={list}
            rowKey="id"
            pagination={false}
            onRow={(record) => ({
              onClick: () => setActiveId(record!.id),
              className: record!.id === activeId ? 'selected' : '',
              style: { cursor: 'pointer' },
            })}
          />
        )}
      </div>

      {list.length > 0 && (
        <div className="list-pagination">
          <Pagination
            size="small"
            total={total}
            pageSize={PAGE_SIZE}
            currentPage={page}
            onPageChange={setPage}
            showTotal
          />
        </div>
      )}

      <MySharedDetailDrawer
        visible={!!activeAsset}
        onClose={() => setActiveId(null)}
        asset={activeAsset}
        dataList={list}
        onNavigate={(a) => setActiveId(a.id)}
      />
    </div>
  );
};

export default MySharedPage;
