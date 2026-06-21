/**
 * 流程下线 — 申请人入口（FEAT-027 issue-002 / issue-006）
 *
 * 承载：发起下线申请、申请列表、申请详情。
 * 不承载审批人工作台（那是「停用审批」页面）。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Table, Tag, Input, Button, Space, Row, Col, Popover, Pagination,
} from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { Plus } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import FilterPopover from '@/components/FilterPopover';
import {
  fetchOfflineApprovals,
  subscribeOfflineRequestChange,
  OFFLINE_STATUS_TAG,
  OFFLINE_STATUS_FILTER_OPTIONS,
  type ProcessOfflineRequest,
  type OfflineRequestStatus,
} from '@/mocks/processOfflineApproval';
import ApplicantDetailDrawer from './components/ApplicantDetailDrawer';
import CreateOfflineRequestModal from './components/CreateOfflineRequestModal';
import './index.less';

const { Title, Text } = Typography;

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const OfflineRequestsPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { id: routeId } = useParams<{ id?: string }>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<[Date, Date] | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [allList, setAllList] = useState<ProcessOfflineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProcessOfflineRequest | null>(null);
  const [createVisible, setCreateVisible] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchOfflineApprovals({ status: 'ALL' });
      setAllList(data);
      setSelectedRecord((prev) => {
        if (!prev) return prev;
        return data.find((d) => d.id === prev.id) ?? prev;
      });
    } finally {
      if (!silent) setLoading(false);
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeOfflineRequestChange(() => load(true)), [load]);

  // 深链：/dev-center/offline-requests/:id 打开对应申请详情
  useEffect(() => {
    if (!routeId || allList.length === 0) return;
    const target = allList.find((r) => r.id === routeId);
    if (target) {
      setSelectedRecord(target);
      setDrawerVisible(true);
    }
  }, [routeId, allList]);

  const filteredData = useMemo(() => {
    let data = [...allList];
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      data = data.filter((r) =>
        r.process_name.toLowerCase().includes(kw)
        || r.applicant_name.toLowerCase().includes(kw));
    }
    if (statusFilter.length > 0) {
      data = data.filter((r) => statusFilter.includes(r.status));
    }
    if (dateFilter && dateFilter.length === 2) {
      const [start, end] = dateFilter;
      const startT = start.getTime();
      const endT = end.getTime();
      data = data.filter((r) => {
        const t = new Date(r.submitted_at).getTime();
        return t >= startT && t <= endT;
      });
    }
    return data;
  }, [allList, keyword, statusFilter, dateFilter]);

  const openDetail = (record: ProcessOfflineRequest) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const closeDetail = () => {
    setDrawerVisible(false);
    if (routeId) navigate('/dev-center/offline-requests', { replace: true });
  };

  const columns = useMemo(() => [
    {
      title: '流程名称', dataIndex: 'process_name', width: 260, ellipsis: { showTitle: true },
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: OfflineRequestStatus) => (
        <Tag color={OFFLINE_STATUS_TAG[s].color as TagColor} type="light" size="small">{OFFLINE_STATUS_TAG[s].text}</Tag>
      ),
    },
    {
      title: '审批进度', dataIndex: 'current_level', width: 110, align: 'center' as const,
      render: (_: unknown, r: ProcessOfflineRequest) => {
        if (r.status === 'PENDING_APPROVAL' || r.status === 'APPROVING') {
          if (r.total_levels) return <Text>第 {r.current_level} / {r.total_levels} 级</Text>;
          if (r.current_approver_label) return <Text>{r.current_approver_label}</Text>;
        }
        return '-';
      },
    },
    {
      title: '申请人', dataIndex: 'applicant_name', width: 130,
      render: (v: string, r: ProcessOfflineRequest) => <UserNameWithCard name={v} userId={r.applicant_id} />,
    },
    { title: '所属部门', dataIndex: 'department_name', width: 180, ellipsis: { showTitle: true } },
    {
      title: '申请原因', dataIndex: 'reason', width: 120, ellipsis: { showTitle: false },
      render: (v: string) => (
        <Popover
          position="top"
          showArrow
          content={<div style={{ maxWidth: 320, maxHeight: 200, overflowY: 'auto', padding: '4px 8px', lineHeight: 1.6 }}>{v}</div>}
        >
          <Text ellipsis={{ showTooltip: false }} style={{ width: '100%' }}>{v}</Text>
        </Popover>
      ),
    },
    { title: '提交时间', dataIndex: 'submitted_at', width: 180, render: (v: string) => fmtTime(v) },
  ], []);

  // 搜索/筛选变化时重置到第 1 页
  useEffect(() => { setCurrentPage(1); }, [keyword, statusFilter, dateFilter]);

  const total = filteredData.length;
  const pagedData = useMemo(
    () => filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredData, currentPage, pageSize],
  );

  const pagination = useMemo(() => ({
    currentPage, totalPages: Math.max(1, Math.ceil(total / pageSize)), pageSize, total,
  }), [currentPage, pageSize, total]);

  return (
    <div className="offline-requests">
      <div className="offline-requests-header">
        <div className="offline-requests-header-title">
          <Title heading={3} className="title">流程下线</Title>
          <Text type="tertiary">查看你发起的下线申请，或为单个已发布流程发起下线申请。</Text>
        </div>
        <Button
          theme="solid"
          type="primary"
          icon={<Plus size={16} strokeWidth={2} />}
          onClick={() => setCreateVisible(true)}
        >
          发起下线申请
        </Button>
      </div>

      <div className="offline-requests-content">
        <Row type="flex" justify="space-between" align="middle" className="offline-requests-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder="搜索流程名称 / 申请人"
                className="offline-requests-search-input"
                value={keyword}
                onChange={setKeyword}
                showClear
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={(values) => {
                  setStatusFilter((values.status as string[]) || []);
                  const dv = values.submitted_at as [Date, Date] | undefined;
                  setDateFilter(dv && dv.length === 2 ? dv : null);
                }}
                sections={[
                  {
                    key: 'status',
                    label: '状态',
                    type: 'checkbox',
                    options: OFFLINE_STATUS_FILTER_OPTIONS,
                    value: statusFilter,
                  },
                  {
                    key: 'submitted_at',
                    label: '提交时间',
                    type: 'dateRange',
                    value: dateFilter,
                  },
                ]}
              />
            </Space>
          </Col>
        </Row>

        {isInitialLoad ? (
          <TableSkeleton rows={6} columns={7} columnWidths={['24%', '9%', '10%', '12%', '16%', '10%', '19%']} />
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={pagedData}
            loading={loading}
            rowKey="id"
            empty={<EmptyState variant="noData" description="暂无下线申请，点击右上角发起申请" />}
            onRow={(record) => ({
              style: { cursor: 'pointer' },
              className: selectedRecord?.id === record?.id && drawerVisible ? 'offline-requests-row-selected' : undefined,
              onClick: () => record && openDetail(record as ProcessOfflineRequest),
            })}
            pagination={false}
            scroll={{ y: 'calc(100vh - 360px)' }}
          />
        )}

        {total > 0 && (
          <div className="list-pagination">
            <Text type="tertiary">
              {t('common.showingRecords', {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, total),
                total,
              })}
            </Text>
            <div className="list-pagination-right">
              <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(total / pageSize) })}</Text>
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOpts={[10, 20, 50, 100]}
                onPageChange={setCurrentPage}
                onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); }}
              />
            </div>
          </div>
        )}
      </div>

      <ApplicantDetailDrawer
        visible={drawerVisible}
        onClose={closeDetail}
        data={selectedRecord}
        dataList={filteredData}
        onNavigate={(item) => setSelectedRecord(item)}
        pagination={pagination}
      />

      <CreateOfflineRequestModal
        visible={createVisible}
        onCancel={() => setCreateVisible(false)}
        onSuccess={(req) => {
          load(true).then(() => {
            setSelectedRecord(req);
            setDrawerVisible(true);
          });
        }}
        onJumpExisting={(existing) => {
          setSelectedRecord(existing);
          setDrawerVisible(true);
        }}
      />
    </div>
  );
};

export default OfflineRequestsPage;
