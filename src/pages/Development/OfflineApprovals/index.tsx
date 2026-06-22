/**
 * 流程停用审批列表页（FEAT-027 STORY-003 - 重构）
 *
 * 对齐需求中心 / 需求审批页。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, Table, Tag, Input, Button, Dropdown, Tabs, TabPane,
  Row, Col, Space, Pagination,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { CheckCircle, XCircle, Eye, RefreshCw, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import FilterPopover from '@/components/FilterPopover';
import {
  fetchOfflineApprovals,
  subscribeOfflineRequestChange,
  type ProcessOfflineRequest,
  type OfflineRequestStatus,
} from '@/mocks/processOfflineApproval';
import { CURRENT_APPROVAL_USER_ID } from '@/pages/Development/PublishApprovals/currentUser';
import OfflineApprovalDetailDrawer from './components/DetailDrawer';
import pendingIcon from '@/assets/review-stats/pending.png';
import reviewedIcon from '@/assets/review-stats/reviewed.png';
import approvedIcon from '@/assets/review-stats/approved.png';
import rejectedIcon from '@/assets/review-stats/rejected.png';
import './index.less';

const { Title, Text } = Typography;

import { OFFLINE_STATUS_TAG as STATUS_TAG_RAW } from '@/mocks/processOfflineApproval';
const STATUS_TAG: Record<OfflineRequestStatus, { color: TagColor; text: string }> = STATUS_TAG_RAW as Record<OfflineRequestStatus, { color: TagColor; text: string }>;

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const isReviewedByMe = (v: ProcessOfflineRequest) =>
  v.records.some((r) => r.approver_id === CURRENT_APPROVAL_USER_ID);

const isMyTurn = (v: ProcessOfflineRequest) =>
  v.status === 'PENDING_APPROVAL' && !isReviewedByMe(v);

type ReviewTab = 'pending' | 'reviewed' | 'all';

const OfflineApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [allList, setAllList] = useState<ProcessOfflineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProcessOfflineRequest | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [activeTab, keyword, statusFilter]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchOfflineApprovals({ keyword: '', status: 'ALL' });
      setAllList(data);
      if (selectedRecord) {
        const fresh = data.find((d) => d.id === selectedRecord.id);
        if (fresh) setSelectedRecord(fresh);
      }
    } finally {
      if (!silent) setLoading(false);
      setIsInitialLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeOfflineRequestChange(() => load(true)), [load]);

  const stats = useMemo(() => {
    let pending = 0, reviewed = 0, approved = 0, rejected = 0;
    allList.forEach((v) => {
      if (isMyTurn(v)) pending += 1;
      if (isReviewedByMe(v)) reviewed += 1;
      v.records.forEach((r) => {
        if (r.approver_id !== CURRENT_APPROVAL_USER_ID) return;
        if (r.action === 'approve') approved += 1;
        if (r.action === 'reject') rejected += 1;
      });
    });
    return { pending, reviewed, approved, rejected };
  }, [allList]);

  const filteredData = useMemo(() => {
    let data: ProcessOfflineRequest[];
    switch (activeTab) {
      case 'pending': data = allList.filter(isMyTurn); break;
      case 'reviewed': data = allList.filter(isReviewedByMe); break;
      case 'all':
      default: data = allList; break;
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      data = data.filter((item) =>
        item.process_name.toLowerCase().includes(kw)
        || item.applicant_name.toLowerCase().includes(kw));
    }
    if (statusFilter.length > 0) {
      data = data.filter((item) => statusFilter.includes(item.status));
    }
    return data;
  }, [activeTab, allList, keyword, statusFilter]);

  const openDetail = (record: ProcessOfflineRequest) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const columns = useMemo(() => [
    {
      title: '流程名称', dataIndex: 'process_name', ellipsis: true,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', width: 130,
      render: (s: OfflineRequestStatus) => (
        <Tag color={STATUS_TAG[s].color} type="light" size="small">{STATUS_TAG[s].text}</Tag>
      ),
    },
    {
      title: '审批进度', dataIndex: 'current_level', width: 130,
      render: (_: unknown, r: ProcessOfflineRequest) =>
        r.status === 'PENDING_APPROVAL' && r.total_levels
          ? <Text size="small" type="tertiary">第 {r.current_level} / {r.total_levels} 级</Text>
          : '-',
    },
    {
      title: '申请人', dataIndex: 'applicant_name', width: 130,
      render: (v: string, r: ProcessOfflineRequest) => <UserNameWithCard name={v} userId={r.applicant_id} />,
    },
    { title: '所属部门', dataIndex: 'department_name', width: 160, ellipsis: true },
    { title: '提交时间', dataIndex: 'submitted_at', width: 170, render: (v: string) => fmtTime(v) },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 60,
      render: (_: unknown, r: ProcessOfflineRequest) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item icon={<Eye size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
                查看详情
              </Dropdown.Item>
              {isMyTurn(r) && (
                <>
                  <Dropdown.Item icon={<CheckCircle size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
                    通过
                  </Dropdown.Item>
                  <Dropdown.Item icon={<XCircle size={16} strokeWidth={2} />} type="danger" onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
                    拒绝
                  </Dropdown.Item>
                </>
              )}
              {r.status === 'EXECUTION_FAILED' && (
                <Dropdown.Item icon={<RefreshCw size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
                  重试执行
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ], []);

  const total = filteredData.length;
  const pagedData = useMemo(
    () => filteredData.slice((page - 1) * pageSize, page * pageSize),
    [filteredData, page, pageSize],
  );
  const pagination = useMemo(() => ({
    currentPage: page, totalPages: Math.max(1, Math.ceil(total / pageSize)), pageSize, total,
  }), [page, pageSize, total]);

  const renderTable = (emptyText: string) => (
    isInitialLoad ? (
      <TableSkeleton rows={6} columns={7} columnWidths={['22%', '13%', '14%', '12%', '12%', '17%', '6%']} />
    ) : (
      <Table
        size="small"
        columns={columns}
        dataSource={pagedData}
        loading={loading}
        rowKey="id"
        empty={<EmptyState variant="noData" description={emptyText} />}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          className: selectedRecord?.id === record?.id && drawerVisible ? 'offline-approvals-row-selected' : undefined,
          onClick: () => record && openDetail(record as ProcessOfflineRequest),
        })}
        pagination={false}
        scroll={{ y: 'calc(100vh - 440px)' }}
      />
    )
  );

  return (
    <div className="offline-approvals">
      <div className="offline-approvals-header">
        <div className="offline-approvals-header-title">
          <Title heading={3} className="title">停用审批</Title>
          <Text type="tertiary">查看和审批流程下线申请。最终审批通过后系统会自动执行停用。</Text>
        </div>
      </div>

      <div className="offline-approvals-stats-card">
        <div className="offline-approvals-stats-grid">
          {[
            { label: '待我审批', value: stats.pending, icon: pendingIcon },
            { label: '我审批过的', value: stats.reviewed, icon: reviewedIcon },
            { label: '我通过的', value: stats.approved, icon: approvedIcon },
            { label: '我拒绝的', value: stats.rejected, icon: rejectedIcon },
          ].map((item, idx, arr) => (
            <div key={idx} className="offline-approvals-metric-card">
              <div className="offline-approvals-metric-icon" aria-hidden="true">
                <img src={item.icon} alt="" />
              </div>
              <div className="offline-approvals-metric-info">
                <div className="offline-approvals-metric-label">{item.label}</div>
                <div className="offline-approvals-metric-value">{item.value}</div>
              </div>
              {idx < arr.length - 1 && <div className="offline-approvals-metric-divider" />}
            </div>
          ))}
        </div>
      </div>

      <div className="offline-approvals-content">
        <Row type="flex" justify="space-between" align="middle" className="offline-approvals-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder="搜索流程名称 / 申请人"
                className="offline-approvals-search-input"
                value={keyword}
                onChange={setKeyword}
                showClear
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={(values) => setStatusFilter((values.status as string[]) || [])}
                sections={[
                  {
                    key: 'status',
                    label: '状态',
                    type: 'checkbox',
                    options: [
                      { label: '待审批', value: 'PENDING_APPROVAL' },
                      { label: '已通过(待执行)', value: 'APPROVED' },
                      { label: '已下线', value: 'EXECUTED' },
                      { label: '已拒绝', value: 'REJECTED' },
                      { label: '执行失败', value: 'EXECUTION_FAILED' },
                    ],
                    value: statusFilter,
                  },
                ]}
              />
            </Space>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as ReviewTab)} keepDOM={false}>
          <TabPane tab="待我审批" itemKey="pending">{renderTable('暂无待审批记录')}</TabPane>
          <TabPane tab="我审批过的" itemKey="reviewed">{renderTable('暂无审批过的记录')}</TabPane>
          <TabPane tab="全部" itemKey="all">{renderTable('暂无停用审批记录')}</TabPane>
        </Tabs>
        {total > 0 && (
          <div className="list-pagination">
            <Text type="tertiary">
              {`显示第 ${(page - 1) * pageSize + 1} 条-第 ${Math.min(page * pageSize, total)} 条,共 ${total} 条`}
            </Text>
            <div className="list-pagination-right">
              <Text type="tertiary">{`总页数:${Math.ceil(total / pageSize)}`}</Text>
              <Pagination
                currentPage={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                pageSizeOpts={[10, 20, 50, 100]}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              />
            </div>
          </div>
        )}
      </div>

      <OfflineApprovalDetailDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        data={selectedRecord}
        dataList={filteredData}
        onNavigate={(item) => setSelectedRecord(item)}
        pagination={pagination}
        onAfterAction={() => load(true)}
      />
    </div>
  );
};

export default OfflineApprovalsPage;
