/**
 * 发布审批列表页（FEAT-025 STORY-002 - 重构）
 *
 * 对齐需求中心 / 需求审批页：
 *   - 顶部 4 项统计卡（待我审批 / 我审批过的 / 已通过 / 已拒绝）
 *   - 工具栏（搜索 + 状态筛选）
 *   - Tabs：待我审批 / 我审批过的 / 全部
 *   - 详情改为右侧抽屉
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, Table, Tag, Input, Button, Dropdown, Tabs, TabPane,
  Row, Col, Space,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag/interface';
import { CheckCircle, XCircle, Eye, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import {
  fetchPublishApprovals,
  subscribeProcessVersionChange,
  type ProcessVersion,
  type VersionStatus,
} from '@/mocks/processVersionApproval';
import { CURRENT_APPROVAL_USER_ID } from './currentUser';
import PublishApprovalDetailDrawer from './components/DetailDrawer';
import pendingIcon from '@/assets/review-stats/pending.png';
import reviewedIcon from '@/assets/review-stats/reviewed.png';
import approvedIcon from '@/assets/review-stats/approved.png';
import rejectedIcon from '@/assets/review-stats/rejected.png';
import './index.less';

const { Title, Text } = Typography;

const STATUS_TAG: Record<VersionStatus, { color: TagColor; text: string }> = {
  UPLOADED: { color: 'grey', text: '待发布' },
  PENDING_APPROVAL: { color: 'blue', text: '待审批' },
  PUBLISHED: { color: 'green', text: '已通过' },
  REJECTED: { color: 'red', text: '已拒绝' },
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const isReviewedByMe = (v: ProcessVersion) =>
  (v.records ?? []).some((r) => r.approver_id === CURRENT_APPROVAL_USER_ID);

const isMyTurn = (v: ProcessVersion) =>
  v.status === 'PENDING_APPROVAL' && !isReviewedByMe(v);

type ReviewTab = 'pending' | 'reviewed' | 'all';

const PublishApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [allList, setAllList] = useState<ProcessVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProcessVersion | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await fetchPublishApprovals({ keyword: '', status: 'ALL' });
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
  useEffect(() => subscribeProcessVersionChange(() => load(true)), [load]);

  const stats = useMemo(() => {
    let pending = 0, reviewed = 0, approved = 0, rejected = 0;
    allList.forEach((v) => {
      if (isMyTurn(v)) pending += 1;
      if (isReviewedByMe(v)) reviewed += 1;
      (v.records ?? []).forEach((r) => {
        if (r.approver_id !== CURRENT_APPROVAL_USER_ID) return;
        if (r.action === 'approve') approved += 1;
        if (r.action === 'reject') rejected += 1;
      });
    });
    return { pending, reviewed, approved, rejected };
  }, [allList]);

  const filteredData = useMemo(() => {
    let data: ProcessVersion[];
    switch (activeTab) {
      case 'pending': data = allList.filter(isMyTurn); break;
      case 'reviewed': data = allList.filter(isReviewedByMe); break;
      case 'all':
      default:
        data = allList.filter((v) => v.status !== 'UPLOADED');
        break;
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      data = data.filter((item) =>
        item.process_name.toLowerCase().includes(kw)
        || item.developer_name.toLowerCase().includes(kw)
        || item.version.toLowerCase().includes(kw));
    }
    if (statusFilter.length > 0) {
      data = data.filter((item) => statusFilter.includes(item.status));
    }
    return data;
  }, [activeTab, allList, keyword, statusFilter]);

  const openDetail = (record: ProcessVersion) => {
    setSelectedRecord(record);
    setDrawerVisible(true);
  };

  const columns = useMemo(() => [
    {
      title: '流程名称', dataIndex: 'process_name', ellipsis: true,
      render: (v: string, r: ProcessVersion) => (
        <Space spacing={8}>
          <Text strong>{v}</Text>
          <Tag size="small" color="grey" type="light">v{r.version}</Tag>
        </Space>
      ),
    },
    { title: '开发者', dataIndex: 'developer_name', width: 120, ellipsis: true },
    { title: '所属部门', dataIndex: 'department_name', width: 160, ellipsis: true },
    {
      title: '审批进度', dataIndex: 'current_level', width: 130,
      render: (_: unknown, r: ProcessVersion) =>
        r.status === 'PENDING_APPROVAL' && r.total_levels ? (
          <Text size="small" type="tertiary">第 {r.current_level} / {r.total_levels} 级</Text>
        ) : '-',
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (s: VersionStatus) => (
        <Tag color={STATUS_TAG[s].color} type="light" size="small">{STATUS_TAG[s].text}</Tag>
      ),
    },
    { title: '提交时间', dataIndex: 'submitted_at', width: 170, render: (v?: string) => fmtTime(v) },
    {
      title: '操作', dataIndex: 'action', key: 'action', fixed: 'right' as const, width: 60,
      render: (_: unknown, r: ProcessVersion) => (
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
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ], []);

  const pagination = useMemo(() => ({
    currentPage: 1, totalPages: 1, pageSize: filteredData.length, total: filteredData.length,
  }), [filteredData]);

  const renderTable = (emptyText: string) => (
    isInitialLoad ? (
      <TableSkeleton rows={6} columns={7} columnWidths={['22%', '12%', '14%', '12%', '10%', '16%', '6%']} />
    ) : (
      <Table
        size="small"
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        empty={<EmptyState variant="noData" description={emptyText} />}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          className: selectedRecord?.id === record?.id && drawerVisible ? 'publish-approvals-row-selected' : undefined,
          onClick: () => record && openDetail(record as ProcessVersion),
        })}
        pagination={false}
        scroll={{ y: 'calc(100vh - 440px)', x: 1100 }}
      />
    )
  );

  return (
    <div className="publish-approvals">
      <div className="publish-approvals-header">
        <div className="publish-approvals-header-title">
          <Title heading={3} className="title">发布审批</Title>
          <Text type="tertiary">查看和审批流程版本的发布申请。</Text>
        </div>
      </div>

      <div className="publish-approvals-stats-card">
        <div className="publish-approvals-stats-grid">
          {[
            { label: '待我审批', value: stats.pending, icon: pendingIcon },
            { label: '我审批过的', value: stats.reviewed, icon: reviewedIcon },
            { label: '我通过的', value: stats.approved, icon: approvedIcon },
            { label: '我拒绝的', value: stats.rejected, icon: rejectedIcon },
          ].map((item, idx, arr) => (
            <div key={idx} className="publish-approvals-metric-card">
              <div className="publish-approvals-metric-icon" aria-hidden="true">
                <img src={item.icon} alt="" />
              </div>
              <div className="publish-approvals-metric-info">
                <div className="publish-approvals-metric-label">{item.label}</div>
                <div className="publish-approvals-metric-value">{item.value}</div>
              </div>
              {idx < arr.length - 1 && <div className="publish-approvals-metric-divider" />}
            </div>
          ))}
        </div>
      </div>

      <div className="publish-approvals-content">
        <Row type="flex" justify="space-between" align="middle" className="publish-approvals-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder="搜索流程名称 / 开发者 / 版本号"
                className="publish-approvals-search-input"
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
                      { label: '已通过', value: 'PUBLISHED' },
                      { label: '已拒绝', value: 'REJECTED' },
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
          <TabPane tab="全部" itemKey="all">{renderTable('暂无审批记录')}</TabPane>
        </Tabs>
      </div>

      <PublishApprovalDetailDrawer
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

export default PublishApprovalsPage;
