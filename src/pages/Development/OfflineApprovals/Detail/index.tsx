/**
 * 停用审批详情页（FEAT-027 STORY-003 - 详情页化）
 *
 * 参考共享中心审批详情页（src/pages/SharingCenter/Approvals/Detail）实现。
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Button, Space, Card, Toast, Tag, Modal, Form, Timeline, Empty,
} from '@douyinfe/semi-ui';
import { ChevronLeft, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
  approveOfflineRequest,
  rejectOfflineRequest,
  retryOfflineExecution,
  getOfflineRequestById,
  subscribeOfflineRequestChange,
  type ProcessOfflineRequest,
  type OfflineRequestStatus,
} from '@/mocks/processOfflineApproval';
import './index.less';

const { Title, Text, Paragraph } = Typography;

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

const OfflineApprovalDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ProcessOfflineRequest | undefined>(() => (id ? getOfflineRequestById(id) : undefined));
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => subscribeOfflineRequestChange(() => setDetail(id ? getOfflineRequestById(id) : undefined)), [id]);

  if (!detail) {
    return (
      <div className="offline-approval-detail-page">
        <div className="detail-header">
          <Button theme="borderless" type="tertiary" icon={<ChevronLeft size={16} />} onClick={() => navigate(-1)}>返回</Button>
        </div>
        <Empty title="未找到该审批记录" />
      </div>
    );
  }

  const handleApprove = () => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${detail.process_name}」的停用申请？最终审批通过后系统将自动执行下线。`,
      okText: '通过',
      onOk: async () => {
        try {
          setActing(true);
          const next = await approveOfflineRequest(detail.id);
          if (next.status === 'EXECUTION_FAILED') Toast.warning('审批通过，但执行失败，请稍后重试');
          else if (next.status === 'EXECUTED') Toast.success('已通过并完成下线');
          else Toast.success('已通过，等待下一级审批');
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setActing(false);
        }
      },
    });
  };

  const submitReject = async () => {
    try {
      setActing(true);
      await rejectOfflineRequest(detail.id, rejectReason.trim());
      Toast.success('已拒绝');
      setRejectVisible(false);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const handleRetry = async () => {
    try {
      setActing(true);
      const next = await retryOfflineExecution(detail.id);
      Toast[next.status === 'EXECUTED' ? 'success' : 'warning'](
        next.status === 'EXECUTED' ? '执行成功，流程已下线' : '依旧存在阻塞依赖，请处理后再试',
      );
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const isPending = detail.status === 'PENDING_APPROVAL';
  const isFailed = detail.status === 'EXECUTION_FAILED';

  return (
    <div className="offline-approval-detail-page">
      <div className="detail-header">
        <Button theme="borderless" type="tertiary" icon={<ChevronLeft size={16} />} onClick={() => navigate(-1)}>返回</Button>
        <Title heading={3} className="title">{detail.process_name} 的停用申请</Title>
        <Tag color={STATUS_TAG[detail.status].color} type="light">{STATUS_TAG[detail.status].text}</Tag>
      </div>

      <div className="detail-body">
        <Card className="detail-section" title="基本信息">
          <div className="info-row">
            <Text type="tertiary">申请人：</Text>
            <UserNameWithCard name={detail.applicant_name} userId={detail.applicant_id} />
          </div>
          <div className="info-row"><Text type="tertiary">所属部门：</Text><Text>{detail.department_name}</Text></div>
          <div className="info-row"><Text type="tertiary">提交时间：</Text><Text>{fmtTime(detail.submitted_at)}</Text></div>
          {detail.executed_at && (
            <div className="info-row"><Text type="tertiary">下线时间：</Text><Text>{fmtTime(detail.executed_at)}</Text></div>
          )}
          <div className="info-row info-row-block">
            <Text type="tertiary">停用原因：</Text>
            <Paragraph>{detail.reason}</Paragraph>
          </div>
          {detail.execution_error && (
            <div className="info-row info-row-block">
              <Text type="tertiary">执行错误：</Text>
              <Text type="danger">{detail.execution_error}</Text>
            </div>
          )}
        </Card>

        <Card className="detail-section" title="依赖检查快照">
          {renderDependency(detail)}
        </Card>

        {detail.approval_template_snapshot && (
          <Card
            className="detail-section"
            title={`审批流：${detail.approval_template_snapshot.name}`}
            headerExtraContent={isPending && detail.total_levels ? (
              <Text type="tertiary" size="small">当前第 {detail.current_level} / {detail.total_levels} 级</Text>
            ) : undefined}
          >
            {detail.records.length > 0 ? (
              <Timeline>
                {detail.records.map((r, idx) => (
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

      {(isPending || isFailed) && (
        <div className="detail-footer">
          <Space spacing={8}>
            {isPending && (
              <>
                <Button type="danger" icon={<XCircle size={14} />} onClick={() => { setRejectReason(''); setRejectVisible(true); }}>拒绝</Button>
                <Button theme="solid" type="primary" icon={<CheckCircle size={14} />} loading={acting} onClick={handleApprove}>通过</Button>
              </>
            )}
            {isFailed && (
              <Button theme="solid" type="warning" icon={<RefreshCw size={14} />} loading={acting} onClick={handleRetry}>重试执行</Button>
            )}
          </Space>
        </div>
      )}

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
    </div>
  );
};

export default OfflineApprovalDetailPage;
