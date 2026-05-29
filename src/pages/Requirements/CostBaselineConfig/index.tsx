/**
 * 成本基线配置页（STORY-020-RC-COST-BASELINE-CONFIG）
 *
 * 维护租户级通用成本项：列表 + 新建 + 编辑。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Typography, Button, Input, Tag, Table, Tooltip, Pagination, Dropdown, Modal, Toast } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Plus, Pencil, Trash2, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
import {
  listCostBaselineItems,
  subscribeCostBaselineChange,
  deleteCostBaselineItem,
  type CostBaselineItem,
  type CostItemType,
  COST_TYPE_LABEL,
  COST_TYPE_TAG_COLOR,
} from '@/mocks/requirementCostBaseline';
import CostItemFormModal from './components/CostItemFormModal';
import './index.less';

const { Title, Text } = Typography;

const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const CostBaselineConfigPage = () => {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [costTypes, setCostTypes] = useState<CostItemType[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);

  const [items, setItems] = useState<CostBaselineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CostBaselineItem | null>(null);

  // 关键字防抖 500ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword), 500);
    return () => clearTimeout(t);
  }, [keyword]);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const list = await listCostBaselineItems({ keyword: debouncedKeyword, costTypes });
        setItems(list);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [debouncedKeyword, costTypes],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => subscribeCostBaselineChange(() => load(true)), [load]);

  // 过滤条件变化时回到第一页
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, costTypes]);

  const total = items.length;
  const pagedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  const isFiltered = debouncedKeyword.trim().length > 0 || costTypes.length > 0;

  const handleCreate = () => {
    setEditing(null);
    setModalVisible(true);
  };

  const handleEdit = (item: CostBaselineItem) => {
    setEditing(item);
    setModalVisible(true);
  };

  const handleDelete = (item: CostBaselineItem) => {
    Modal.confirm({
      title: '删除成本项',
      content: (
        <div>
          确定删除成本项「{item.name}」吗？已引用该成本项的需求快照不受影响。
        </div>
      ),
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { type: 'danger' },
      centered: true,
      onOk: async () => {
        try {
          await deleteCostBaselineItem(item.id);
          Toast.success('删除成功');
        } catch {
          Toast.error('删除失败');
        }
      },
    });
  };

  const columns = [
    {
      title: '成本类型',
      dataIndex: 'cost_type',
      width: 120,
      render: (v: CostItemType) => (
        <Tag color={COST_TYPE_TAG_COLOR[v]} type="light" size="small">
          {COST_TYPE_LABEL[v]}
        </Tag>
      ),
    },
    {
      title: '成本项名称',
      dataIndex: 'name',
      width: 220,
      render: (v: string) => (
        <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: '100%' }}>
          {v}
        </Text>
      ),
    },
    {
      title: '人天成本',
      dataIndex: 'daily_cost',
      width: 200,
      render: (v: number, record: CostBaselineItem) => (
        <Text>
          {record.currency} {v.toLocaleString()} <Text type="tertiary">/ 人天</Text>
        </Text>
      ),
    },
    {
      title: '说明',
      dataIndex: 'description',
      render: (v?: string) =>
        v ? (
          <Tooltip content={v} position="topLeft">
            <Text type="secondary" ellipsis={{ showTooltip: false }} style={{ maxWidth: 360, display: 'inline-block' }}>
              {v}
            </Text>
          </Tooltip>
        ) : (
          <Text type="tertiary">--</Text>
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 170,
      render: (v: string) => <Text type="tertiary">{formatDateTime(v)}</Text>,
    },
    {
      title: '操作',
      width: 100,
      render: (_: unknown, record: CostBaselineItem) => (
        <Button
          theme="borderless"
          type="primary"
          size="small"
          icon={<Pencil size={14} strokeWidth={2} />}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(record);
          }}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="cost-baseline-page">
      <div className="cost-baseline-page-header">
        <div className="cost-baseline-page-header-title">
          <Title heading={3} className="title">成本基线配置</Title>
          <Text type="tertiary">
            维护租户级通用成本项（岗位 / 活动），用于新建/编辑需求时自动带出人天成本，保证节省成本分析口径统一。
          </Text>
        </div>
        <div className="cost-baseline-page-header-toolbar">
          <div className="cost-baseline-page-header-toolbar-left">
            <Input
              prefix={<IconSearchStroked />}
              placeholder="搜索成本项名称"
              className="cost-baseline-page-search-input"
              value={keyword}
              onChange={setKeyword}
              showClear
              maxLength={100}
            />
            <FilterPopover
              visible={filterVisible}
              onVisibleChange={setFilterVisible}
              sections={[
                {
                  key: 'costTypes',
                  label: '成本类型',
                  type: 'checkbox',
                  options: [
                    { value: 'role', label: COST_TYPE_LABEL.role },
                    { value: 'activity', label: COST_TYPE_LABEL.activity },
                  ],
                  value: costTypes,
                },
              ]}
              onConfirm={(values) => {
                setCostTypes((values.costTypes as CostItemType[]) ?? []);
              }}
            />
          </div>
          <div className="cost-baseline-page-header-toolbar-right">
            <Button
              icon={<Plus size={16} strokeWidth={2} />}
              theme="solid"
              type="primary"
              onClick={handleCreate}
            >
              新建成本项
            </Button>
          </div>
        </div>
      </div>

      <div className="cost-baseline-page-content">
        {!loading && items.length === 0 ? (
          <EmptyState
            variant={isFiltered ? 'noResult' : 'noData'}
            description={isFiltered ? '没有匹配的成本项' : '暂无成本项，点击右上角「新建成本项」'}
          />
        ) : (
          <>
            <Table
              size="small"
              loading={loading}
              dataSource={pagedItems}
              columns={columns}
              rowKey="id"
              pagination={false}
            />
            {total > 0 && (
              <div className="list-pagination">
                <Text type="tertiary">
                  共 {total} 条，第 {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, total)} 条
                </Text>
                <div className="list-pagination-right">
                  <Pagination
                    currentPage={page}
                    pageSize={pageSize}
                    total={total}
                    pageSizeOpts={PAGE_SIZE_OPTIONS}
                    showSizeChanger
                    onPageChange={setPage}
                    onPageSizeChange={(s) => {
                      setPage(1);
                      setPageSize(s);
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CostItemFormModal
        visible={modalVisible}
        editing={editing}
        onCancel={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          load(true);
        }}
      />
    </div>
  );
};

export default CostBaselineConfigPage;
