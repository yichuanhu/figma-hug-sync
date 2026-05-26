/**
 * 停用审批详情抽屉
 */
import { useState } from 'react';
import { Typography, Space, Card, Tag, Timeline, Button, Modal, Form, Toast } from '@douyinfe/semi-ui';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
  approveOfflineRequest,
  rejectOfflineRequest,
  retryOfflineExecution,
  type ProcessOfflineRequest,
  type OfflineRequestStatus,
} from '@/mocks/processOfflineApproval';
import { CURRENT_APPROVAL_USER_ID } from '@/pages/Development/PublishApprovals/currentUser';
import './index.less';

const { Text, Paragraph } = Typography;

const STATUS_TAG: Record<OfflineRequestStatus, { color: 'blue' | 'green' | 'red' | 'orange' | 'cyan'; text: string }> = {
  PENDING_APPROVAL: { color: 'blue', text: '待审批' },
  APPROVED: { color: 'cyan', text: '已通过(待执行)' },
  EXECUTED: { color: 'green', text: '已下线' },
  REJECTED: { color: 'red', text: '已拒绝' },
  EXECUTION_FAILED: { color: 'orange', text: '执行失败' },
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const renderDependency = (r: ProcessOfflineRequest) => {
  const d = r.dependency_snapshot;
  const empty = d.triggers.length + d.task_templates.length + d.running_tasks.length + d.scheduling_refs.length === 0;
  if (empty) return <Tag color="green" type="light" size="small">依赖检查通过</Tag>;
  return (
    <div>
      {d.triggers.length > 0 && (
        <div className="dependency-group">
          <Text strong size="small">启用中的触发器</Text>
          <ul>{d.triggers.map((t) => <li key={t.id}><Text size="small">{t.name}（{t.type}）</Text></li>)}</ul>
        </div>
      )}
      {d.task_templates.length > 0 && (
        <div className="dependency-group">
          <Text strong size="small">引用此流程的任务模板</Text>
          <ul>{d.task_templates.map((t) => <li key={t.id}><Text size="small">{t.name}</Text></li>)}</ul>
        </div>
      )}
      {d.running_tasks.length > 0 && (
        <div className="dependency-group">
          <Text strong size="small">运行中/排队中任务</Text>
          <ul>{d.running_tasks.map((t) => <li key={t.id}><Text size="small">{t.name}（{t.status}）</Text></li>)}</ul>
        </div>
      )}
      {d.scheduling_refs.length > 0 && (
        <div className="dependency-group">
          <Text strong size="small">调度中心其他引用</Text>
          <ul>{d.scheduling_refs.map((t) => <li key={t.id}><Text size="small">{t.name}</Text></li>)}</ul>
        </div>
      )}
    </div>
  );
};

interface OfflineApprovalDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  data: ProcessOfflineRequest | null;
  dataList: ProcessOfflineRequest[];
  onNavigate: (item: ProcessOfflineRequest) => void;
  pagination?: PaginationInfo;
  onAfterAction?: () => void;
}

const OfflineApprovalDetailDrawer = ({
  visible, onClose, data, dataList, onNavigate, pagination, onAfterAction,
}: OfflineApprovalDetailDrawerProps) => {
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  if (!data) return null;

  const isPending = data.status === 'PENDING_APPROVAL';
  const isFailed = data.status === 'EXECUTION_FAILED';
  const reviewedByMe = data.records.some((r) => r.approver_id === CURRENT_APPROVAL_USER_ID);

  const handleApprove = () => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${data.process_name}」的停用申请？最终审批通过后系统将自动执行下线。`,
      okText: '通过',
      onOk: async () => {
        try {
          setActing(true);
          const next = await approveOfflineRequest(data.id);
          if (next.status === 'EXECUTION_FAILED') Toast.warning('审批通过，但执行失败，请稍后重试');
          else if (next.status === 'EXECUTED') Toast.success('已通过并完成下线');
          else Toast.success('已通过，等待下一级审批');
          onAfterAction?.();
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setActing(false);
        }
      },
    });
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActing(true);
      await rejectOfflineRequest(data.id, rejectReason.trim());
      Toast.success('已拒绝');
      setRejectVisible(false);
      onAfterAction?.();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const handleRetry = async () => {
    try {
      setActing(true);
      const next = await retryOfflineExecution(data.id);
      Toast[next.status === 'EXECUTED' ? 'success' : 'warning'](
        next.status === 'EXECUTED' ? '执行成功，流程已下线' : '依旧存在阻塞依赖，请处理后再试',
      );
      onAfterAction?.();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const title = (
    <Space spacing={8}>
      <span>{data.process_name} 的停用申请</span>
      <Tag color={STATUS_TAG[data.status].color} type="light">{STATUS_TAG[data.status].text}</Tag>
    </Space>
  );

  const extraActions = (
    <Space spacing={8}>
      {isPending && !reviewedByMe && (
        <>
          <Button type="danger" icon={<XCircle size={14} />} onClick={() => { setRejectReason(''); setRejectVisible(true); }}>
            拒绝
          </Button>
          <Button theme="solid" type="primary" icon={<CheckCircle size={14} />} loading={acting} onClick={handleApprove}>
            通过
          </Button>
        </>
      )}
      {isFailed && (
        <Button theme="solid" type="warning" icon={<RefreshCw size={14} />} loading={acting} onClick={handleRetry}>
          重试执行
        </Button>
      )}
    </Space>
  );

  return (
    <>
      <DetailDrawerWrapper<ProcessOfflineRequest>
        visible={visible}
        onClose={onClose}
        title={title}
        dataList={dataList}
        currentId={data.id}
        onNavigate={onNavigate}
        pagination={pagination}
        extraActions={extraActions}
        defaultWidth={900}
        storageKey="offlineApprovalDetailDrawerWidth"
        className="offline-approval-detail-drawer"
      >
        <div className="offline-approval-detail-drawer-body">
          <Card className="detail-section" title="基本信息">
            <div className="info-row">
              <Text type="tertiary">申请人：</Text>
              <UserNameWithCard name={data.applicant_name} userId={data.applicant_id} />
            </div>
            <div className="info-row"><Text type="tertiary">所属部门：</Text><Text>{data.department_name}</Text></div>
            <div className="info-row"><Text type="tertiary">提交时间：</Text><Text>{fmtTime(data.submitted_at)}</Text></div>
            {data.executed_at && (
              <div className="info-row"><Text type="tertiary">下线时间：</Text><Text>{fmtTime(data.executed_at)}</Text></div>
            )}
            <div className="info-row info-row-block">
              <Text type="tertiary">停用原因：</Text>
              <Paragraph>{data.reason}</Paragraph>
            </div>
            {data.execution_error && (
              <div className="info-row info-row-block">
                <Text type="tertiary">执行错误：</Text>
                <Text type="danger">{data.execution_error}</Text>
              </div>
            )}
          </Card>

          <Card className="detail-section" title="依赖检查快照">
            {renderDependency(data)}
          </Card>

          {data.approval_template_snapshot && (
            <Card
              className="detail-section"
              title={`审批流：${data.approval_template_snapshot.name}`}
              headerExtraContent={isPending && data.total_levels ? (
                <Text type="tertiary" size="small">当前第 {data.current_level} / {data.total_levels} 级</Text>
              ) : undefined}
            >
              {data.records.length > 0 ? (
                <Timeline>
                  {data.records.map((r, idx) => (
                    <Timeline.Item key={idx} type={r.action === 'approve' ? 'success' : 'error'} time={fmtTime(r.acted_at)}>
                      <Space>
                        <Text strong>{r.approver_name}</Text>
                        <Tag color={r.action === 'approve' ? 'green' : 'red'} type="light" size="small">
                          {r.action === 'approve' ? '通过' : '拒绝'}（第 {r.level} 级）
                        </Tag>
                      </Space>
                      {r.comment && <div><Text type="tertiary" size="small">{r.comment}</Text></div>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Text type="tertiary" size="small">暂无审批记录</Text>
              )}
            </Card>
          )}
        </div>
      </DetailDrawerWrapper>

      <Modal
        title="拒绝停用申请"
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
    </>
  );
};

export default OfflineApprovalDetailDrawer;
