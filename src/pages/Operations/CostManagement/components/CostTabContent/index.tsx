import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table, Button, Input, Tag, Dropdown, Modal, Toast, Pagination, Typography,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import dayjs from 'dayjs';
import { Plus, Ellipsis, Pencil, Trash2, RefreshCw } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  deleteCostRecord,
  getCostList,
  getCostOverview,
  useCostStore,
  type CostRecord,
  type CostType,
} from '../../mockData';
import CostFormModal from '../CostFormModal';
import './index.less';

const { Text } = Typography;

const PAGE_SIZE_DEFAULT = 20;

const formatCurrency = (val: number) =>
  `¥${(val ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  costType: CostType;
}

const CostTabContent = ({ costType }: Props) => {
  const { t } = useTranslation();
  useCostStore();

  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<CostRecord | null>(null);

  const isProject = costType === 'PROJECT';

  // refreshKey 仅用于触发重新读取（getCostList 已是同步快照）
  const list = useMemo(() => {
    void refreshKey;
    return getCostList(costType);
  }, [costType, refreshKey]);

  const overview = useMemo(() => {
    void refreshKey;
    return getCostOverview(costType);
  }, [costType, refreshKey]);

  const filtered = useMemo(
    () =>
      list.filter(
        (r) =>
          !keyword ||
          r.costName.toLowerCase().includes(keyword.toLowerCase()) ||
          (r.projectName ?? '').toLowerCase().includes(keyword.toLowerCase()),
      ),
    [list, keyword],
  );

  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = (item: CostRecord) => {
    Modal.confirm({
      title: t('operations.costManagement.confirm.deleteTitle'),
      content: t('operations.costManagement.confirm.deleteContent'),
      centered: true,
      onOk: () => {
        deleteCostRecord(item.id);
        Toast.success(t('operations.costManagement.toast.deleted'));
      },
    });
  };

  const handleRefresh = () => {
    setRefreshKey((n) => n + 1);
    Toast.success(t('operations.costManagement.toast.refreshed'));
  };

  const overviewCards = [
    {
      key: 'cumulativeCost', tone: 'success',
      label: t('operations.costManagement.overview.cumulativeCost'),
      value: formatCurrency(overview.cumulativeCost),
    },
    {
      key: 'itemCount', tone: 'purple',
      label: t('operations.costManagement.overview.itemCount'),
      value: `${overview.costItemCount}`,
    },
    {
      key: 'monthlyAvg', tone: 'warning',
      label: t('operations.costManagement.overview.monthlyAvg'),
      value: formatCurrency(overview.monthlyAvgCost),
    },
  ];

  const columns = [
    {
      title: t('operations.costManagement.columns.costName'),
      dataIndex: 'costName',
      ellipsis: { showTitle: true },
    },
    ...(isProject
      ? [
          {
            title: t('operations.costManagement.columns.project'),
            dataIndex: 'projectName',
            width: 200,
            ellipsis: { showTitle: true },
            render: (v?: string) => v || '—',
          },
        ]
      : []),
    {
      title: t('operations.costManagement.columns.amount'),
      dataIndex: 'amount',
      width: 150,
      align: 'right' as const,
      render: (v: number) => <span className="cost-amount">{formatCurrency(v)}</span>,
    },
    {
      title: t('operations.costManagement.columns.occurrenceDate'),
      dataIndex: 'occurrenceDate',
      width: 130,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD') : '—'),
    },
    {
      title: t('operations.costManagement.columns.createdBy'),
      dataIndex: 'createdBy',
      width: 110,
    },
    {
      title: t('operations.costManagement.columns.createdAt'),
      dataIndex: 'createdAt',
      width: 160,
      render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: t('operations.costManagement.columns.actions'),
      width: 60,
      render: (_: unknown, item: CostRecord) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          stopPropagation
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                icon={<Pencil size={16} strokeWidth={2} />}
                onClick={() => { setEditing(item); setModalVisible(true); }}
              >
                {t('operations.costManagement.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<Trash2 size={16} strokeWidth={2} />}
                type="danger"
                onClick={() => handleDelete(item)}
              >
                {t('operations.costManagement.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<Ellipsis size={16} strokeWidth={2} />}
            theme="borderless"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="cost-tab-content">
      <div className="cost-overview-cards">
        {overviewCards.map((c) => (
          <div key={c.key} className={`cost-overview-card ${c.tone}`}>
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="tab-toolbar">
        <Input
          placeholder={t('operations.costManagement.searchPlaceholder')}
          value={keyword}
          onChange={(v) => { setKeyword(v); setPage(1); }}
          prefix={<IconSearchStroked />}
          showClear
          style={{ width: 320 }}
        />
        <div className="tab-toolbar-actions">
          <Button
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={handleRefresh}
          >
            {t('common.refresh')}
          </Button>
          <Button
            theme="solid"
            type="primary"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => { setEditing(null); setModalVisible(true); }}
          >
            {t('operations.costManagement.actions.create')}
          </Button>
        </div>
      </div>

      <div className="tab-table">
        <Table
          size="small"
          columns={columns}
          dataSource={pageData}
          rowKey="id"
          pagination={false}
          empty={
            <EmptyState
              variant={keyword ? 'noResult' : 'noData'}
              description={
                keyword
                  ? t('common.noResult')
                  : t('operations.costManagement.empty.noRecords')
              }
            />
          }
        />
      </div>

      {filtered.length > 0 && (
        <div className="list-pagination">
          <Text type="tertiary">
            {t('common.showingRecords', {
              start: (page - 1) * pageSize + 1,
              end: Math.min(page * pageSize, filtered.length),
              total: filtered.length,
            })}
          </Text>
          <div className="list-pagination-right">
            <Text type="tertiary">
              {t('common.totalPages', { total: Math.ceil(filtered.length / pageSize) })}
            </Text>
            <Pagination
              total={filtered.length}
              currentPage={page}
              pageSize={pageSize}
              showSizeChanger
              onPageChange={setPage}
              onPageSizeChange={(s: number) => { setPageSize(s); setPage(1); }}
            />
          </div>
        </div>
      )}

      <CostFormModal
        visible={modalVisible}
        costType={costType}
        editing={editing}
        onClose={() => setModalVisible(false)}
      />
    </div>
  );
};

export default CostTabContent;
