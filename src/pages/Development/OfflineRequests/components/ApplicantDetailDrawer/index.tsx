/**
 * 流程下线 — 申请人视角详情抽屉
 *
 * 与「停用审批」抽屉的差异：不展示审批/拒绝/重试执行等动作，仅只读展示
 * 申请基本信息、依赖快照、审批流程 timeline 与执行结果。
 */
import { Typography, Space, Card, Tag, Timeline } from '@douyinfe/semi-ui';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import type {
  ProcessOfflineRequest,
  OfflineRequestStatus,
} from '@/mocks/processOfflineApproval';
import { OFFLINE_STATUS_TAG } from '@/mocks/processOfflineApproval';
import './index.less';

const { Text, Paragraph } = Typography;

const STATUS_TAG = OFFLINE_STATUS_TAG;

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');

const renderDependency = (r: ProcessOfflineRequest) => {
  const d = r.dependency_snapshot;
  const empty = d.triggers.length + d.task_templates.length + d.running_tasks.length + d.scheduling_refs.length === 0;
  if (empty) return <Tag color="green" type="light" size="small">依赖检查通过</Tag>;
  return (
    <div>
      {d.blocking && <Tag color="red" type="light" size="small" style={{ marginBottom: 8 }}>存在阻塞依赖</Tag>}
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

interface Props {
  visible: boolean;
  onClose: () => void;
  data: ProcessOfflineRequest | null;
  dataList: ProcessOfflineRequest[];
  onNavigate: (item: ProcessOfflineRequest) => void;
  pagination?: PaginationInfo;
}

const ApplicantDetailDrawer = ({ visible, onClose, data, dataList, onNavigate, pagination }: Props) => {
  if (!data) return null;

  const title = '申请详情';



  return (
    <DetailDrawerWrapper<ProcessOfflineRequest>
      visible={visible}
      onClose={onClose}
      title={title}
      dataList={dataList}
      currentId={data.id}
      onNavigate={onNavigate}
      pagination={pagination}
      defaultWidth={900}
      storageKey="offlineRequestApplicantDrawerWidth"
      className="offline-request-applicant-drawer"
    >
      <div className="offline-request-applicant-drawer-body">
        <Card className="detail-section" title="基本信息">
          <div className="info-row">
            <Text type="tertiary">流程名称：</Text>
            <Text>{data.process_name}</Text>
          </div>
          <div className="info-row">
            <Text type="tertiary">状态：</Text>
            <Tag color={STATUS_TAG[data.status].color} type="light" size="small">{STATUS_TAG[data.status].text}</Tag>
          </div>
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
            <Text type="tertiary">下线原因：</Text>
            <Paragraph>{data.reason}</Paragraph>
          </div>
          {data.execution_error && (
            <div className="info-row info-row-block">
              <Text type="tertiary">执行结果：</Text>
              <Text type="danger">{data.execution_error}</Text>
            </div>
          )}
        </Card>

        <Card className="detail-section" title="依赖检查快照">
          {renderDependency(data)}
        </Card>

        {data.approval_template_snapshot ? (
          <Card
            className="detail-section"
            title={`审批流程：${data.approval_template_snapshot.name}`}
            headerExtraContent={data.status === 'PENDING_APPROVAL' && data.total_levels ? (
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
              <Text type="tertiary" size="small">暂无审批记录，等待审批人处理</Text>
            )}
          </Card>
        ) : (
          <Card className="detail-section" title="审批流程">
            <Text type="tertiary" size="small">该部门未配置停用审批模板，提交后直接执行下线</Text>
          </Card>
        )}
      </div>
    </DetailDrawerWrapper>
  );
};

export default ApplicantDetailDrawer;
