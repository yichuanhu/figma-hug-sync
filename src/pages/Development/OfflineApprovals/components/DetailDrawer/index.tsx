/**
 * 停用审批详情抽屉（与需求审批/发布审批版式统一）
 *
 * 左侧 Tabs：概览（基本信息 + 依赖检查） / 审批流程（Timeline + 审批操作）
 * 右侧属性面板：状态、所属部门、申请人、提交时间...
 */
import { useState } from 'react';
import { Typography, Tag, Tabs, TabPane, Timeline, Space, Button, Modal, Form, Toast, TextArea, Banner } from '@douyinfe/semi-ui';
import { RefreshCw } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import StatusDot, { type StatusDotColor } from '@/components/StatusDot';
import ExpandableText from '@/components/ExpandableText';
import {
  approveOfflineRequest,
  rejectOfflineRequest,
  retryOfflineExecution,
  type ProcessOfflineRequest,
} from '@/mocks/processOfflineApproval';
import { OFFLINE_STATUS_TAG as STATUS_TAG } from '@/mocks/processOfflineApproval';
import { CURRENT_APPROVAL_USER_ID } from '@/pages/Development/PublishApprovals/currentUser';
import './index.less';

const { Text, Title } = Typography;

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const renderDependency = (r: ProcessOfflineRequest) => {
  const d = r.dependency_snapshot;
  const empty = d.triggers.length + d.task_templates.length + d.running_tasks.length + d.scheduling_refs.length === 0;
  if (empty) return <Tag color="green" type="light" size="small">依赖检查通过</Tag>;
  return (
    <div className="offline-approval-detail-drawer-dependencies">
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

const OfflinePropertyPanel: React.FC<{ data: ProcessOfflineRequest }> = ({ data }) => {
  const tag = STATUS_TAG[data.status];
  const statusColorMap: Record<string, StatusDotColor> = {
    blue: 'blue', green: 'green', red: 'red', orange: 'orange', cyan: 'cyan', grey: 'grey',
  };
  return (
    <div className="requirement-detail-property-panel">
      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">状态</Text>
          <div>
            <StatusDot color={statusColorMap[tag.color] || 'grey'} label={tag.text} />
          </div>
        </div>
        {data.status === 'PENDING_APPROVAL' && data.total_levels ? (
          <div className="requirement-detail-property-item">
            <Text type="tertiary" size="small">审批进度</Text>
            <Text size="small">第 {data.current_level} / {data.total_levels} 级</Text>
          </div>
        ) : null}
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">所属部门</Text>
          <Text>{data.department_name || '-'}</Text>
        </div>
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">申请人</Text>
          <UserNameWithCard name={data.applicant_name} userId={data.applicant_id} />
        </div>
      </div>

      <div className="requirement-detail-property-divider" />

      <div className="requirement-detail-property-group">
        <div className="requirement-detail-property-item">
          <Text type="tertiary" size="small">提交时间</Text>
          <Text size="small">{fmtTime(data.submitted_at)}</Text>
        </div>
        {data.executed_at && (
          <div className="requirement-detail-property-item">
            <Text type="tertiary" size="small">下线时间</Text>
            <Text size="small">{fmtTime(data.executed_at)}</Text>
          </div>
        )}
      </div>
    </div>
  );
};

const OfflineApprovalDetailDrawer = ({
  visible, onClose, data, dataList, onNavigate, pagination, onAfterAction,
}: OfflineApprovalDetailDrawerProps) => {
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [acting, setActing] = useState(false);

  if (!data) return null;

  const isPending = data.status === 'PENDING_APPROVAL';
  const isFailed = data.status === 'EXECUTION_FAILED';
  const reviewedByMe = data.records.some((r) => r.approver_id === CURRENT_APPROVAL_USER_ID);
  const canApprove = isPending && !reviewedByMe;

  const doApprove = () => {
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
          setApproveComment('');
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
      setRejectReason('');
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

  const title = `${data.process_name} 的停用申请`;

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
        defaultWidth={1000}
        minWidth={800}
        storageKey="offlineApprovalDetailDrawerWidth"
        className="offline-approval-detail-drawer requirement-detail-drawer"
      >
        <div className="requirement-detail-layout">
          <div className="requirement-detail-left">
            <Tabs type="line" className="requirement-detail-tabs">
              <TabPane tab="概览" itemKey="overview">
                <div className="offline-approval-detail-drawer-tab-content">
                  {data.execution_error && (
                    <Banner type="danger" fullMode={false} closeIcon={null}
                      description={`执行错误：${data.execution_error}`}
                      style={{ marginBottom: 16 }} />
                  )}

                  <div className="offline-approval-detail-drawer-section">
                    <Title heading={6} className="offline-approval-detail-drawer-section-title">停用原因</Title>
                    <ExpandableText text={data.reason || '-'} maxLines={6} />
                  </div>

                  <div className="offline-approval-detail-drawer-section">
                    <Title heading={6} className="offline-approval-detail-drawer-section-title">依赖检查快照</Title>
                    {renderDependency(data)}
                  </div>
                </div>
              </TabPane>

              <TabPane tab="审批流程" itemKey="approval">
                <div className="offline-approval-detail-drawer-tab-content">
                  {data.approval_template_snapshot && (
                    <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
                      审批流：{data.approval_template_snapshot.name}
                      {isPending && data.total_levels ? `（当前第 ${data.current_level} / ${data.total_levels} 级）` : ''}
                    </Text>
                  )}
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

                  {canApprove && (
                    <div className="offline-approval-detail-drawer-approve-actions">
                      <Text strong size="small" style={{ display: 'block', marginBottom: 8 }}>审批</Text>
                      <TextArea
                        placeholder="请输入审批意见（拒绝时必填）"
                        value={approveComment}
                        onChange={setApproveComment}
                        rows={3}
                        maxLength={500}
                        showClear
                        style={{ marginBottom: 12 }}
                      />
                      <div className="offline-approval-detail-drawer-approve-buttons">
                        <Button theme="solid" type="primary" style={{ flex: 1, height: 32 }} loading={acting} onClick={doApprove}>
                          通过
                        </Button>
                        <Button
                          theme="solid" type="danger" style={{ flex: 1, height: 32 }} loading={acting}
                          onClick={() => {
                            if (!approveComment.trim()) {
                              Toast.warning('请填写拒绝原因');
                              return;
                            }
                            setRejectReason(approveComment.trim());
                            setRejectVisible(true);
                          }}
                        >
                          拒绝
                        </Button>
                      </div>
                    </div>
                  )}

                  {isFailed && (
                    <div className="offline-approval-detail-drawer-approve-actions">
                      <Button theme="solid" type="warning" block icon={<RefreshCw size={14} />} loading={acting} onClick={handleRetry}>
                        重试执行
                      </Button>
                    </div>
                  )}
                </div>
              </TabPane>
            </Tabs>
          </div>
          <div className="requirement-detail-right">
            <OfflinePropertyPanel data={data} />
          </div>
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
