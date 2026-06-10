import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Typography, Button, Input, Pagination, Table, Dropdown, Space, Tag, Select,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { ChevronDown, Plus, Workflow as WorkflowIcon, BookOpen, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import emptyImg from '@/assets/empty-state/no-data.png';
import FilterPopover from '@/components/FilterPopover';

import { type ShareAsset, type DisplayStatus as StoreDisplayStatus, queryMyPublished, toDisplayStatus, getAll, subscribe } from './store';
import { useMyPublishedQuery, type TypeFilter, type DisplayStatus } from './hooks/useMyPublishedQuery';
import AssetActionsMenu from './components/AssetActionsMenu';
import MySharedDetailDrawer from './components/MySharedDetailDrawer';
import './index.less';

const { Title, Text } = Typography;

const PAGE_SIZE = 12;

const useStoreVersion = () => useSyncExternalStore(subscribe, () => getAll().length);

// 状态标签颜色映射（简洁色块，无图标）
const STATUS_TAG_COLOR: Record<StoreDisplayStatus, 'green' | 'grey' | 'orange' | 'red' | 'blue'> = {
  DRAFT: 'grey',
  PENDING_APPROVAL: 'orange',
  PUBLISHED: 'green',
  REJECTED: 'red',
  UNLISTED: 'grey',
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
  const [filterVisible, setFilterVisible] = useState(false);

  const { list, total } = useMemo(
    () => queryMyPublished({ statuses, type: typeF, search: debounced, page, pageSize: PAGE_SIZE }),
    [statuses, typeF, debounced, page],
  );

  const filtered = typeF !== 'ALL' || !!debounced || statuses.length > 0;
  const activeAsset = useMemo(() => (activeId ? list.find((a) => a.id === activeId) ?? null : null), [activeId, list]);

  useEffect(() => {
    if (activeId && !list.some((a) => a.id === activeId)) setActiveId(null);
  }, [list, activeId]);

  const handleCreate = (kind: 'workflow' | 'knowledge') => {
    if (kind === 'workflow') navigate('/sharing-center/my-published/workflow/create');
    else navigate('/sharing-center/my-published/knowledge/create');
  };

  const statusLabel = (ds: StoreDisplayStatus) => {
    switch (ds) {
      case 'PUBLISHED': return t('sharing.assetSupply.statusOptions.published');
      case 'DRAFT': return t('sharing.assetSupply.statusOptions.draft');
      case 'UNLISTED': return t('sharing.assetSupply.statusOptions.unlisted');
      case 'PENDING_APPROVAL': return t('sharing.assetSupply.tabs.pending_approval');
      case 'REJECTED': return t('sharing.assetSupply.tabs.rejected');
      default: return ds;
    }
  };

  const columns = [
    {
      title: t('sharing.assetSupply.col.name'),
      dataIndex: 'name',
      width: 240,
      render: (_: unknown, a: ShareAsset) => {
        const name = a.displayName || a.name;
        return (
          <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>
            {name}
          </Text>
        );
      },
    },
    {
      title: t('sharing.assetSupply.col.type'),
      dataIndex: 'type',
      width: 140,
      render: (_: unknown, a: ShareAsset) => {
        const isWorkflow = a.type === 'WORKFLOW';
        return (
          <Tag size="small" type="light" color={isWorkflow ? 'blue' : 'green'}>
            {isWorkflow
              ? t('sharing.assetSupply.filters.typeWorkflow')
              : t('sharing.assetSupply.filters.typeKnowledge')}
          </Tag>
        );
      },
    },
    {
      title: t('sharing.assetSupply.col.version'),
      dataIndex: 'currentVersion',
      width: 100,
      render: (_: unknown, a: ShareAsset) => {
        if (a.type !== 'WORKFLOW' || !a.currentVersion) {
          return <Text type="tertiary" size="small">-</Text>;
        }
        return <Tag size="small" type="light" color="blue">{a.currentVersion}</Tag>;
      },
    },
    {
      title: t('sharing.assetSupply.col.description'),
      dataIndex: 'description',
      render: (v: string) => (
        <Text type="tertiary" size="small" ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>
          {v || '-'}
        </Text>
      ),
    },
    {
      title: t('sharing.assetSupply.col.status'),
      dataIndex: 'shareStatus',
      width: 100,
      render: (_: unknown, a: ShareAsset) => {
        const ds = toDisplayStatus(a.shareStatus);
        return <Tag color={STATUS_TAG_COLOR[ds]} size="small" type="light">{statusLabel(ds)}</Tag>;
      },
    },
    {
      title: t('sharing.assetSupply.col.reuseCount'),
      dataIndex: 'reuseRecords',
      width: 110,
      render: (_: unknown, a: ShareAsset) => {
        const n = a.reuseRecords?.length ?? 0;
        return <Text size="small">{n > 0 ? n : '-'}</Text>;
      },
    },
    {
      title: t('sharing.assetSupply.col.updatedAt'),
      dataIndex: 'updatedAt',
      width: 140,
      render: (v: string) => <Text type="tertiary" size="small">{v}</Text>,
    },

    {
      title: t('sharing.assetSupply.col.action'),
      width: 72,
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
    <div className="my-shared-page">
      {/* 标题区域 */}
      <div className="my-shared-header">
        <div className="my-shared-header-title">
          <Title heading={3} className="title">{t('sharing.assetSupply.pageTitle')}</Title>
          <Text type="tertiary">{t('sharing.assetSupply.pageSubtitle')}</Text>
        </div>

        {/* Toolbar */}
        <div className="my-shared-header-toolbar">
          <div className="my-shared-header-toolbar-filters">
            <Input
              prefix={<IconSearchStroked />}
              value={keyword}
              onChange={setKeyword}
              placeholder={t('sharing.assetSupply.filters.searchPlaceholder')}
              showClear
              className="my-shared-search-input"
            />
            <Select
              value={typeF}
              onChange={(v) => setType(v as TypeFilter)}
              style={{ width: 200 }}
              prefix={<span style={{ color: 'var(--semi-color-text-2)', paddingLeft: 8 }}>{t('sharing.assetSupply.filters.type')}：</span>}
              optionList={[
                { value: 'ALL', label: t('sharing.assetSupply.filters.allType') },
                { value: 'WORKFLOW', label: t('sharing.assetSupply.filters.typeWorkflow') },
                { value: 'KNOWLEDGE', label: t('sharing.assetSupply.filters.typeKnowledge') },
              ]}
            />

            <span className="my-shared-header-toolbar-divider" />
            <FilterPopover
              visible={filterVisible}
              onVisibleChange={setFilterVisible}
              onConfirm={(values) => {
                setStatuses(((values.status as DisplayStatus[]) || []));
              }}
              sections={[
                {
                  key: 'status',
                  label: t('sharing.assetSupply.filters.status'),
                  type: 'checkbox',
                  value: statuses,
                  options: [
                    { value: 'DRAFT', label: t('sharing.assetSupply.statusOptions.draft') },
                    { value: 'PUBLISHED', label: t('sharing.assetSupply.statusOptions.published') },
                    { value: 'UNLISTED', label: t('sharing.assetSupply.statusOptions.unlisted') },
                  ],
                },
              ]}
            />
            {filtered && (
              <Button theme="borderless" type="tertiary" onClick={reset}>
                {t('sharing.assetSupply.filters.clear')}
              </Button>
            )}
          </div>

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
            <Button theme="solid" type="primary" icon={<Plus size={14} strokeWidth={2.5} />}>
              <Space spacing={2}>
                {t('sharing.assetSupply.newAsset.entry')}
                <ChevronDown size={14} strokeWidth={2} />
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="my-shared-table">
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
              className: record!.id === activeId ? 'my-shared-row-selected' : '',
              style: { cursor: 'pointer' },
            })}
          />
        )}
        {total > 0 && (
          <div className="list-pagination">
            <Text type="tertiary">
              {t('common.showingRecords', {
                start: (page - 1) * PAGE_SIZE + 1,
                end: Math.min(page * PAGE_SIZE, total),
                total,
              })}
            </Text>
            <div className="list-pagination-right">
              <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(total / PAGE_SIZE) })}</Text>
              <Pagination
                currentPage={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </div>

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
