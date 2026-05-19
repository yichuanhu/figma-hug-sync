import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Table,
  Input,
  Tag,
  Switch,
  Tooltip,
  Toast,
  Modal,
  Pagination,
} from '@douyinfe/semi-ui';
import FilterPopover from '@/components/FilterPopover';
import { Plus, RefreshCw, Pencil, History as HistoryIcon, Trash2, Search } from 'lucide-react';
import {
  listMetrics,
  deleteMetric,
  updateMetric,
  subscribeMetricsMockMode,
} from '@/mocks/operationsMetrics/service';
import type {
  CustomMetricWithSnapshot,
  MetricType,
} from '@/mocks/operationsMetrics/types';
import { MetricServiceError } from '@/mocks/operationsMetrics/types';
import MetricFormModal from './components/MetricFormModal';
import MetricRecordsDrawer from './components/MetricRecordsDrawer';
import MetricsMockSwitcher from '@/components/MetricsMockSwitcher';
import MetricsEmptyState from './components/MetricsEmptyState';
import MetricsSkeleton from './components/MetricsSkeleton';
import './index.less';

const { Title, Text } = Typography;

type VisibleFilter = 'all' | 'visible' | 'hidden';

const TYPE_COLOR: Record<MetricType, 'blue' | 'violet' | 'teal'> = {
  COUNTER: 'blue',
  ACCUMULATOR: 'violet',
  LATEST: 'teal',
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const MetricsConfig = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<VisibleFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [debouncedKw, setDebouncedKw] = useState('');
  const [data, setData] = useState<CustomMetricWithSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<CustomMetricWithSnapshot | null>(null);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerMetric, setDrawerMetric] = useState<CustomMetricWithSnapshot | null>(null);

  const debounceRef = useRef<number | null>(null);

  // 防抖搜索
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedKw(keyword.trim()), 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [keyword]);

  const fetchData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const visible = tab === 'all' ? undefined : tab === 'visible';
      const list = await listMetrics({ visible, keyword: debouncedKw || undefined });
      setData(list);
    } catch (e) {
      setLoadError(true);
      setData([]);
      Toast.error(t('metricsConfig.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedKw]);

  // 订阅 Mock 模式切换，自动重拉
  useEffect(() => {
    return subscribeMetricsMockMode(() => {
      fetchData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, debouncedKw]);

  const pagedData = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize],
  );

  const handleToggleVisible = async (row: CustomMetricWithSnapshot, next: boolean) => {
    // 乐观更新
    setData((prev) => prev.map((m) => (m.id === row.id ? { ...m, visible: next } : m)));
    try {
      await updateMetric(row.id, { visible: next });
      Toast.success(t('metricsConfig.toggleVisibleSuccess'));
    } catch (e) {
      // 回滚
      setData((prev) => prev.map((m) => (m.id === row.id ? { ...m, visible: !next } : m)));
      Toast.error(t('metricsConfig.toggleVisibleFailed'));
    }
  };

  const handleDelete = (row: CustomMetricWithSnapshot) => {
    Modal.confirm({
      title: t('metricsConfig.deleteConfirmTitle'),
      content: t('metricsConfig.deleteConfirmContent', { name: row.displayName }),
      okText: t('common.delete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      centered: true,
      onOk: async () => {
        try {
          await deleteMetric(row.id);
          Toast.success(t('metricsConfig.deleteSuccess'));
          fetchData();
        } catch (e) {
          const code = e instanceof MetricServiceError ? e.code : 'NETWORK';
          Toast.error(
            code === 'HAS_RECORDS'
              ? t('metricsConfig.cannotDeleteHasRecords')
              : t('metricsConfig.deleteFailed'),
          );
        }
      },
    });
  };

  const columns = [
    {
      title: t('metricsConfig.col.code'),
      dataIndex: 'code',
      width: 180,
      render: (v: string) => <Text code>{v}</Text>,
    },
    {
      title: t('metricsConfig.col.displayName'),
      dataIndex: 'displayName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: t('metricsConfig.col.type'),
      dataIndex: 'metricType',
      width: 130,
      render: (v: MetricType) => (
        <Tag color={TYPE_COLOR[v]} type="light">
          {t(`metricsConfig.type.${v}`)}
        </Tag>
      ),
    },
    {
      title: t('metricsConfig.col.unit'),
      dataIndex: 'unit',
      width: 80,
      render: (v?: string) => v || '-',
    },
    {
      title: t('metricsConfig.col.currentValue'),
      dataIndex: 'currentValue',
      width: 140,
      render: (v: number | string | null, row: CustomMetricWithSnapshot) => {
        if (v === null || v === '') return <Text type="tertiary">-</Text>;
        return (
          <Text strong>
            {typeof v === 'number' ? v.toLocaleString() : v}
            {row.unit ? <Text type="tertiary" size="small">{` ${row.unit}`}</Text> : null}
          </Text>
        );
      },
    },
    {
      title: t('metricsConfig.col.lastUpdated'),
      dataIndex: 'lastUpdatedAt',
      width: 160,
      render: (v: string | null) => <Text type="tertiary">{formatDateTime(v)}</Text>,
    },
    {
      title: t('metricsConfig.col.visible'),
      dataIndex: 'visible',
      width: 80,
      render: (v: boolean, row: CustomMetricWithSnapshot) => (
        <Switch checked={v} size="small" onChange={(next) => handleToggleVisible(row, next)} />
      ),
    },
    {
      title: t('common.actions'),
      width: 180,
      fixed: 'right' as const,
      render: (_: unknown, row: CustomMetricWithSnapshot) => (
        <div className="metrics-config-actions">
          <Tooltip content={t('common.edit')}>
            <Button
              icon={<Pencil size={14} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              size="small"
              onClick={() => {
                setEditing(row);
                setFormVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip content={t('metricsConfig.viewRecords')}>
            <Button
              icon={<HistoryIcon size={14} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              size="small"
              onClick={() => {
                setDrawerMetric(row);
                setDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip
            content={
              row.hasRecords
                ? t('metricsConfig.cannotDeleteHasRecords')
                : t('common.delete')
            }
          >
            <span>
              <Button
                icon={<Trash2 size={14} strokeWidth={2} />}
                theme="borderless"
                type="danger"
                size="small"
                disabled={row.hasRecords}
                onClick={() => handleDelete(row)}
              />
            </span>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="metrics-config-page">
      <Title heading={3} style={{ marginBottom: 16 }}>
        {t('metricsConfig.title')}
      </Title>
      <Text type="tertiary" style={{ marginBottom: 16, display: 'block' }}>
        {t('metricsConfig.description')}
      </Text>

      <div className="metrics-config-toolbar">
        <div className="metrics-config-toolbar-left">
          <Input
            prefix={<Search size={14} strokeWidth={2} />}
            placeholder={t('metricsConfig.searchPlaceholder')}
            value={keyword}
            onChange={setKeyword}
            showClear
            style={{ width: 320 }}
          />
          <FilterPopover
            visible={filterPopoverVisible}
            onVisibleChange={setFilterPopoverVisible}
            sections={[
              {
                key: 'visible',
                label: t('common.status'),
                type: 'radio',
                value: tab === 'all' ? null : tab,
                options: [
                  { value: 'visible', label: t('metricsConfig.tabVisible') },
                  { value: 'hidden', label: t('metricsConfig.tabHidden') },
                ],
              },
            ]}
            onConfirm={(values) => {
              const v = values.visible as VisibleFilter | null;
              setTab(v ?? 'all');
            }}
          />
        </div>
        <div className="metrics-config-toolbar-right">
          <Button
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={() => {
              fetchData();
              Toast.success(t('common.refreshed'));
            }}
          />
          <Button
            theme="solid"
            type="primary"
            icon={<Plus size={14} strokeWidth={2} />}
            onClick={() => {
              setEditing(null);
              setFormVisible(true);
            }}
          >
            {t('metricsConfig.createMetric')}
          </Button>
        </div>
      </div>

      {loading ? (
        <MetricsSkeleton variant="list" />
      ) : loadError ? (
        <MetricsEmptyState
          variant="error"
          title={t('metricsConfig.loadFailedTitle')}
          description={t('metricsConfig.loadFailedDesc')}
        >
          <Button
            theme="solid"
            type="primary"
            icon={<RefreshCw size={14} strokeWidth={2} />}
            onClick={fetchData}
          >
            {t('common.retry')}
          </Button>
        </MetricsEmptyState>
      ) : data.length === 0 ? (
        tab !== 'all' || debouncedKw ? (
          <MetricsEmptyState
            variant="filter"
            title={t('metricsConfig.emptyFilterTitle')}
            description={t('metricsConfig.emptyFilterDesc')}
          >
            <Button
              onClick={() => {
                setKeyword('');
                setTab('all');
              }}
            >
              {t('metricsConfig.clearFilter')}
            </Button>
          </MetricsEmptyState>
        ) : (
          <MetricsEmptyState
            variant="empty"
            title={t('metricsConfig.emptyTitle')}
            description={t('metricsConfig.emptyDesc')}
          >
            <Button
              theme="solid"
              type="primary"
              icon={<Plus size={14} strokeWidth={2} />}
              onClick={() => {
                setEditing(null);
                setFormVisible(true);
              }}
            >
              {t('metricsConfig.createMetric')}
            </Button>
          </MetricsEmptyState>
        )
      ) : (
        <Table
          rowKey="id"
          dataSource={pagedData}
          columns={columns}
          size="small"
          pagination={false}
        />
      )}

      {data.length > 0 && (
        <div className="list-pagination">
          <Text type="tertiary">
            {t('common.showingRecords', {
              start: (page - 1) * pageSize + 1,
              end: Math.min(page * pageSize, data.length),
              total: data.length,
            })}
          </Text>
          <div className="list-pagination-right">
            <Text type="tertiary">
              {t('common.totalPages', { total: Math.ceil(data.length / pageSize) })}
            </Text>
            <Pagination
              total={data.length}
              currentPage={page}
              pageSize={pageSize}
              showSizeChanger
              onPageChange={setPage}
              onPageSizeChange={(s: number) => {
                setPageSize(s);
                setPage(1);
              }}
            />
          </div>
        </div>
      )}

      <MetricFormModal
        visible={formVisible}
        editing={editing}
        onClose={() => setFormVisible(false)}
        onSuccess={() => {
          setFormVisible(false);
          fetchData();
        }}
      />

      <MetricRecordsDrawer
        visible={drawerVisible}
        metric={drawerMetric}
        onClose={() => setDrawerVisible(false)}
      />

      <MetricsMockSwitcher />
    </div>
  );
};

export default MetricsConfig;
