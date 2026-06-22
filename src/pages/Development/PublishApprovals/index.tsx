/**
 * 发布审批列表（审批人视角）
 *
 * 数据以"发布单"为核心（复用 ReleaseListPage 的 mock 生成器），
 * 展示审批状态 + 发布结果两个维度，操作复用 ReleaseDetailDrawer。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, Table, Tag, Input, Button, Dropdown, Tabs, TabPane,
  Row, Col, Space, Modal, Form, Toast, Pagination,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { CheckCircle, XCircle, Eye, Ellipsis } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type {
  LYReleaseResponse, ReleaseType, ReleaseStatus, LYReleaseApprovalRecord,
} from '@/api';
import { generateMockReleaseResponse } from '../ReleaseManagement/ReleaseListPage';
import ReleaseDetailDrawer from '../ReleaseManagement/components/ReleaseDetailDrawer';
import { getReleaseStatusDisplay, getAuditStatusDisplay } from '../ReleaseManagement/shared/releaseStatus';
import pendingIcon from '@/assets/review-stats/pending.png';
import reviewedIcon from '@/assets/review-stats/reviewed.png';
import approvedIcon from '@/assets/review-stats/approved.png';
import rejectedIcon from '@/assets/review-stats/rejected.png';
import './index.less';

const { Title, Text } = Typography;

const CURRENT_USER_NAME = '林经理';

const isCurrentApprover = (r: LYReleaseApprovalRecord) => r.approver_name === CURRENT_USER_NAME;

const isMyTurn = (release: LYReleaseResponse) =>
  release.publish_status === 'PENDING_APPROVAL'
  && (release.approval_records ?? []).some((r) => r.action === 'PENDING' && isCurrentApprover(r));

const isReviewedByMe = (release: LYReleaseResponse) =>
  (release.approval_records ?? []).some((r) => r.action !== 'PENDING' && isCurrentApprover(r));

type ReviewTab = 'pending' | 'reviewed' | 'all';

const releaseTypeConfig: Record<ReleaseType, { color: 'blue' | 'cyan' | 'orange' | 'purple' | 'grey' | 'green'; text: string }> = {
  FIRST_RELEASE: { color: 'blue', text: '首次发布' },
  REQUIREMENT_CHANGE: { color: 'cyan', text: '需求变更' },
  BUG_FIX: { color: 'orange', text: '问题修复' },
  CONFIG_UPDATE: { color: 'purple', text: '配置更新' },
  VERSION_ROLLBACK: { color: 'grey', text: '版本回退' },
  OPTIMIZATION: { color: 'green', text: '效果优化' },
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const PublishApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('pending');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReleaseStatus[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [allList, setAllList] = useState<LYReleaseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selected, setSelected] = useState<LYReleaseResponse | null>(null);

  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  useEffect(() => { setPage(1); }, [activeTab, keyword, statusFilter]);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 200));
      // 模拟"我"参与多个发布单审批：把第 0 / 1 / 3 / 4 个发布单的审批人替换为当前用户
      const list = Array.from({ length: 30 }, (_, i) => {
        const release = generateMockReleaseResponse(i);
        const records = (release.approval_records ?? []).map((r) => ({ ...r }));
        if (records.length > 0) {
          // 把第一条审批记录关联到当前用户，覆盖原有 approver_name
          records[0].approver_name = CURRENT_USER_NAME;
          if (release.current_approver_label && release.publish_status === 'PENDING_APPROVAL') {
            release.current_approver_label = `L1 · ${CURRENT_USER_NAME}`;
          }
        }
        return { ...release, approval_records: records };
      });
      setAllList(list);
      if (selected) {
        const fresh = list.find((d) => d.release_id === selected.release_id);
        if (fresh) setSelected(fresh);
      }
    } finally {
      if (!silent) setLoading(false);
      setIsInitialLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    let pending = 0, reviewed = 0, approved = 0, rejected = 0;
    allList.forEach((v) => {
      if (isMyTurn(v)) pending += 1;
      if (isReviewedByMe(v)) reviewed += 1;
      (v.approval_records ?? []).forEach((r) => {
        if (!isCurrentApprover(r)) return;
        if (r.action === 'APPROVE') approved += 1;
        if (r.action === 'REJECT') rejected += 1;
      });
    });
    return { pending, reviewed, approved, rejected };
  }, [allList]);

  const filteredData = useMemo(() => {
    let data: LYReleaseResponse[];
    switch (activeTab) {
      case 'pending': data = allList.filter(isMyTurn); break;
      case 'reviewed': data = allList.filter(isReviewedByMe); break;
      case 'all':
      default: data = allList; break;
    }
    if (keyword.trim()) {
      const kw = keyword.toLowerCase().trim();
      data = data.filter((item) =>
        item.release_id.toLowerCase().includes(kw)
        || item.publisher_name.toLowerCase().includes(kw)
        || item.contents.some((c) => c.process_name.toLowerCase().includes(kw)));
    }
    if (statusFilter.length > 0) {
      data = data.filter((item) => statusFilter.includes(item.publish_status));
    }
    return data;
  }, [activeTab, allList, keyword, statusFilter]);

  const openDetail = (record: LYReleaseResponse) => {
    setSelected(record);
    setDrawerVisible(true);
  };

  const mutateRelease = (releaseId: string, patch: Partial<LYReleaseResponse>) => {
    setAllList((prev) => prev.map((r) => (r.release_id === releaseId ? { ...r, ...patch } : r)));
    setSelected((prev) => (prev && prev.release_id === releaseId ? { ...prev, ...patch } : prev));
  };

  const handleApprove = (release: LYReleaseResponse) => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${release.release_id}」的发布申请？`,
      okText: '通过',
      onOk: async () => {
        try {
          setActing(true);
          await new Promise((r) => setTimeout(r, 400));
          const records = [...(release.approval_records ?? [])];
          const idx = records.findIndex((r) => r.action === 'PENDING' && isCurrentApprover(r));
          if (idx >= 0) {
            records[idx] = { ...records[idx], action: 'APPROVE', acted_at: new Date().toISOString(), comment: '同意。' };
          }
          const isFinal = (release.current_approval_level ?? 1) >= (release.total_approval_levels ?? 1);
          mutateRelease(release.release_id, {
            approval_records: records,
            current_approval_level: isFinal ? release.current_approval_level : (release.current_approval_level ?? 1) + 1,
            audit_status: isFinal ? 'APPROVED' : 'PENDING',
            publish_status: isFinal ? 'SUCCESS' : 'PENDING_APPROVAL',
            current_approver_label: isFinal ? undefined : '下一级审批人',
          });
          Toast.success('已通过');
        } finally {
          setActing(false);
        }
      },
    });
  };

  const submitReject = async () => {
    if (!selected || !rejectReason.trim()) return;
    try {
      setActing(true);
      await new Promise((r) => setTimeout(r, 400));
      const records = [...(selected.approval_records ?? [])];
      const idx = records.findIndex((r) => r.action === 'PENDING' && isCurrentApprover(r));
      if (idx >= 0) {
        records[idx] = { ...records[idx], action: 'REJECT', acted_at: new Date().toISOString(), comment: rejectReason.trim() };
      }
      mutateRelease(selected.release_id, {
        approval_records: records,
        audit_status: 'REJECTED',
        publish_status: 'REJECTED',
        reject_reason: rejectReason.trim(),
      });
      Toast.success('已拒绝');
      setRejectVisible(false);
      setRejectReason('');
    } finally {
      setActing(false);
    }
  };

  const columns = useMemo(() => [
    {
      title: '发布编号', dataIndex: 'release_id', width: 170, ellipsis: true,
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: '发布类型', dataIndex: 'release_type', width: 110,
      render: (t: ReleaseType) => {
        const cfg = releaseTypeConfig[t];
        return cfg ? <Tag color={cfg.color} type="light" size="small">{cfg.text}</Tag> : '-';
      },
    },
    {
      title: '状态', dataIndex: 'audit_status', width: 120,
      render: (_: unknown, r: LYReleaseResponse) => {
        let color: 'blue' | 'green' | 'red' = 'blue';
        let text = '待审批';
        if (r.audit_status === 'APPROVED') { color = 'green'; text = '已通过'; }
        else if (r.audit_status === 'REJECTED') { color = 'red'; text = '已拒绝'; }
        return <Tag color={color} type="light" size="small">{text}</Tag>;
      },
    },
    {
      title: '审批进度', dataIndex: 'current_approval_level', width: 110,
      render: (_: unknown, r: LYReleaseResponse) =>
        r.publish_status === 'PENDING_APPROVAL' && r.total_approval_levels ? (
          <Text size="small" type="tertiary">第 {r.current_approval_level} / {r.total_approval_levels} 级</Text>
        ) : '-',
    },
    {
      title: '流程数', dataIndex: 'process_count', width: 70, align: 'center' as const,
      render: (_: unknown, r: LYReleaseResponse) => r.contents?.length ?? 0,
    },
    {
      title: '流程', dataIndex: 'contents', ellipsis: true,
      render: (contents: LYReleaseResponse['contents']) => {
        if (!contents?.length) return '-';
        return contents.length > 1
          ? <Text ellipsis={{ showTooltip: true }}>{contents[0].process_name} 等 {contents.length} 个</Text>
          : <Text ellipsis={{ showTooltip: true }}>{contents[0].process_name}</Text>;
      },
    },
    {
      title: '发布人', dataIndex: 'publisher_name', width: 120, ellipsis: true,
      render: (_: unknown, r: LYReleaseResponse) => r.publisher_name ? (
        <UserNameWithCard name={r.publisher_name} userId={r.publisher_id}
          department={r.publisher_department || undefined}
          role={r.publisher_role || undefined}
          email={r.publisher_email || undefined} />
      ) : '-',
    },
    { title: '提交时间', dataIndex: 'publish_time', width: 160, render: (v?: string) => fmtTime(v) },
    {
      title: '操作', dataIndex: 'action', key: 'action', width: 60,
      render: (_: unknown, r: LYReleaseResponse) => (
        <Dropdown
          trigger="click" position="bottomRight" clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item icon={<Eye size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); openDetail(r); }}>
                查看详情
              </Dropdown.Item>
              {isMyTurn(r) && (
                <>
                  <Dropdown.Item icon={<CheckCircle size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleApprove(r); }}>
                    通过
                  </Dropdown.Item>
                  <Dropdown.Item icon={<XCircle size={16} strokeWidth={2} />} type="danger" onClick={(e) => { e.stopPropagation(); openDetail(r); setRejectReason(''); setRejectVisible(true); }}>
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const approvalContext = selected && isMyTurn(selected) ? {
    canAct: true,
    acting,
    onApprove: () => selected && handleApprove(selected),
    onReject: (reason: string) => {
      setRejectReason(reason);
      // 直接提交（已有 reason），不再需要二次确认弹窗
      void (async () => {
        if (!selected || !reason.trim()) return;
        try {
          setActing(true);
          await new Promise((r) => setTimeout(r, 400));
          const records = [...(selected.approval_records ?? [])];
          const idx = records.findIndex((r) => r.action === 'PENDING' && isCurrentApprover(r));
          if (idx >= 0) {
            records[idx] = { ...records[idx], action: 'REJECT', acted_at: new Date().toISOString(), comment: reason.trim() };
          }
          mutateRelease(selected.release_id, {
            approval_records: records,
            audit_status: 'REJECTED',
            publish_status: 'REJECTED',
            reject_reason: reason.trim(),
          });
          Toast.success('已拒绝');
        } finally {
          setActing(false);
        }
      })();
    },
  } : undefined;

  const pagedData = useMemo(
    () => filteredData.slice((page - 1) * pageSize, page * pageSize),
    [filteredData, page, pageSize],
  );
  const total = filteredData.length;

  const renderTable = (emptyText: string) => (
    isInitialLoad ? (
      <TableSkeleton rows={6} columns={10} />
    ) : (
      <Table
        size="small"
        columns={columns}
        dataSource={pagedData}
        loading={loading}
        rowKey="release_id"
        empty={<EmptyState variant="noData" description={emptyText} />}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          className: selected?.release_id === record?.release_id && drawerVisible ? 'publish-approvals-row-selected' : undefined,
          onClick: () => record && openDetail(record),
        })}
        pagination={false}
        scroll={{ y: 'calc(100vh - 440px)' }}
      />
    )
  );

  return (
    <div className="publish-approvals">
      <div className="publish-approvals-header">
        <div className="publish-approvals-header-title">
          <Title heading={3} className="title">发布审批</Title>
          <Text type="tertiary">查看和审批发布单的申请，按发布单维度组织审批与结果。</Text>
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
                placeholder="搜索发布编号 / 发布人 / 流程名"
                className="publish-approvals-search-input"
                value={keyword}
                onChange={setKeyword}
                showClear
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={(values) => setStatusFilter((values.status as ReleaseStatus[]) || [])}
                sections={[
                  {
                    key: 'status', label: '状态', type: 'checkbox',
                    options: [
                      { label: '待审批', value: 'PENDING_APPROVAL' },
                      { label: '已发布', value: 'SUCCESS' },
                      { label: '已拒绝', value: 'REJECTED' },
                      { label: '发布失败 / 已失效', value: 'FAILED' },
                    ],
                    value: statusFilter,
                  },
                ]}
              />
            </Space>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={(k) => setActiveTab(k as ReviewTab)} keepDOM={false}>
          <TabPane tab="待我审批" itemKey="pending">{renderTable('暂无待审批发布单')}</TabPane>
          <TabPane tab="我审批过的" itemKey="reviewed">{renderTable('暂无审批过的发布单')}</TabPane>
          <TabPane tab="全部" itemKey="all">{renderTable('暂无发布单')}</TabPane>
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

      <ReleaseDetailDrawer
        visible={drawerVisible}
        release={selected}
        releaseList={filteredData}
        onClose={() => setDrawerVisible(false)}
        onNavigate={(item) => setSelected(item)}
        approvalContext={approvalContext}
      />

      <Modal
        title="拒绝发布申请"
        visible={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        onOk={submitReject}
        okText="确认拒绝"
        okButtonProps={{ type: 'danger', loading: acting }}
        width={520}
      >
        <Form layout="vertical">
          <Form.TextArea
            field="reason"
            label="拒绝原因"
            placeholder="请填写拒绝原因（最多 500 字）"
            initValue={rejectReason}
            onChange={(v) => setRejectReason(v as string)}
            maxCount={500}
            autosize={{ minRows: 4, maxRows: 8 }}
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default PublishApprovalsPage;
