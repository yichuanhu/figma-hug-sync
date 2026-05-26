/**
 * 流程停用审批列表页（FEAT-027 STORY-003）
 *
 * 展示流程停用申请：待审批 / 已通过 / 已拒绝 / 执行失败 / 全部。
 * 详情通过子路由 /dev-center/offline-approvals/:id 跳转。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, Table, Tag, Input, Button, Toast, Modal, Tabs, TabPane,
  Space, Form,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
  fetchOfflineApprovals,
  approveOfflineRequest,
  rejectOfflineRequest,
  retryOfflineExecution,
  subscribeOfflineRequestChange,
  type ProcessOfflineRequest,
  type OfflineRequestStatus,
} from '@/mocks/processOfflineApproval';
import './index.less';

const { Title, Text } = Typography;

type StatusFilterKey = OfflineRequestStatus | 'ALL' | 'APPROVED_OR_EXECUTED';

const STATUS_TAG: Record<OfflineRequestStatus, { color: 'blue' | 'green' | 'red' | 'orange' | 'cyan'; text: string }> = {
  PENDING_APPROVAL: { color: 'blue', text: '待审批' },
  APPROVED: { color: 'cyan', text: '已通过(待执行)' },
  EXECUTED: { color: 'green', text: '已下线' },
  REJECTED: { color: 'red', text: '已拒绝' },
  EXECUTION_FAILED: { color: 'orange', text: '执行失败' },
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const OfflineApprovalsPage = () => {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilterKey>('PENDING_APPROVAL');
  const [list, setList] = useState<ProcessOfflineRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<ProcessOfflineRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setList(await fetchOfflineApprovals({ keyword, status }));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [keyword, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeOfflineRequestChange(() => load(true)), [load]);

  const handleApprove = (r: ProcessOfflineRequest) => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${r.process_name}」的停用申请？最终审批通过后系统将自动执行下线。`,
      okText: '通过',
      onOk: async () => {
        try {
          setActingId(r.id);
          const next = await approveOfflineRequest(r.id);
          if (next.status === 'EXECUTION_FAILED') Toast.warning('审批通过，但执行失败，请稍后重试');
          else if (next.status === 'EXECUTED') Toast.success('已通过并完成下线');
          else Toast.success('已通过，等待下一级审批');
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    try {
      setActingId(rejectTarget.id);
      await rejectOfflineRequest(rejectTarget.id, rejectReason.trim());
      Toast.success('已拒绝');
      setRejectTarget(null);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const handleRetry = async (r: ProcessOfflineRequest) => {
    try {
      setActingId(r.id);
      const next = await retryOfflineExecution(r.id);
      Toast[next.status === 'EXECUTED' ? 'success' : 'warning'](
        next.status === 'EXECUTED' ? '执行成功，流程已下线' : '依旧存在阻塞依赖，请处理后再试',
      );
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const columns = useMemo(() => [
    { title: '流程名称', dataIndex: 'process_name', ellipsis: true,
      render: (v: string) => <Text strong>{v}</Text> },
    { title: '申请人', dataIndex: 'applicant_name', width: 130,
      render: (v: string, r: ProcessOfflineRequest) => <UserNameWithCard name={v} userId={r.applicant_id} /> },
    { title: '所属部门', dataIndex: 'department_name', width: 160 },
    { title: '提交时间', dataIndex: 'submitted_at', width: 180, render: (v: string) => fmtTime(v) },
    { title: '审批进度', dataIndex: 'current_level', width: 120,
      render: (_: unknown, r: ProcessOfflineRequest) =>
        r.status === 'PENDING_APPROVAL' && r.total_levels
          ? <Text size="small" type="tertiary">第 {r.current_level} / {r.total_levels} 级</Text>
          : '-' },
    { title: '状态', dataIndex: 'status', width: 130,
      render: (s: OfflineRequestStatus) => (
        <Tag color={STATUS_TAG[s].color} type="light" size="small">{STATUS_TAG[s].text}</Tag>
      ) },
    { title: '操作', width: 220, fixed: 'right' as const,
      render: (_: unknown, r: ProcessOfflineRequest) => (
        <Space spacing={4}>
          <Button size="small" theme="borderless" type="tertiary" icon={<Eye size={14} />}
            onClick={(e) => { e.stopPropagation(); navigate(`/dev-center/offline-approvals/${r.id}`); }}>详情</Button>
          {r.status === 'PENDING_APPROVAL' && (
            <>
              <Button size="small" theme="borderless" type="primary" icon={<CheckCircle size={14} />}
                loading={actingId === r.id} onClick={(e) => { e.stopPropagation(); handleApprove(r); }}>通过</Button>
              <Button size="small" theme="borderless" type="danger" icon={<XCircle size={14} />}
                onClick={(e) => { e.stopPropagation(); setRejectReason(''); setRejectTarget(r); }}>拒绝</Button>
            </>
          )}
          {r.status === 'EXECUTION_FAILED' && (
            <Button size="small" theme="borderless" type="warning" icon={<RefreshCw size={14} />}
              loading={actingId === r.id} onClick={(e) => { e.stopPropagation(); handleRetry(r); }}>重试</Button>
          )}
        </Space>
      ),
    },
  ], [actingId, navigate]);

  return (
    <div className="offline-approvals-page">
      <div className="offline-approvals-header">
        <Title heading={3} className="title">停用审批</Title>
        <Text type="tertiary">查看和审批流程下线申请。最终审批通过后系统会自动执行停用。</Text>
      </div>

      <div className="offline-approvals-toolbar">
        <Tabs type="line" activeKey={status} onChange={(k) => setStatus(k as StatusFilterKey)}>
          <TabPane tab="待审批" itemKey="PENDING_APPROVAL" />
          <TabPane tab="已通过" itemKey="APPROVED_OR_EXECUTED" />
          <TabPane tab="已拒绝" itemKey="REJECTED" />
          <TabPane tab="执行失败" itemKey="EXECUTION_FAILED" />
          <TabPane tab="全部" itemKey="ALL" />
        </Tabs>
        <Input
          prefix={<IconSearchStroked />}
          placeholder="搜索流程名称 / 申请人"
          value={keyword}
          onChange={setKeyword}
          showClear
          style={{ width: 320 }}
        />
      </div>

      <div className="offline-approvals-content">
        {!loading && list.length === 0 ? (
          <EmptyState variant="noData" description="暂无停用审批记录" />
        ) : (
          <Table
            size="small"
            dataSource={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            onRow={(record) => ({ onClick: () => record && navigate(`/dev-center/offline-approvals/${record.id}`) })}
          />
        )}
      </div>

      <Modal
        title="拒绝停用申请"
        visible={!!rejectTarget}
        onCancel={() => setRejectTarget(null)}
        onOk={submitReject}
        okText="确认拒绝"
        okButtonProps={{ type: 'danger', loading: !!actingId }}
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

export default OfflineApprovalsPage;
