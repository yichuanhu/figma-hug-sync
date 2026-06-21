/**
 * 流程下线 — 申请人视角详情抽屉
 *
 * 结构对齐流程发布详情（基本信息 / 审批流程 / 下线影响 三 Tab），
 * 同时保留下线特有的依赖检查快照与单流程信息。
 */
import { useNavigate } from 'react-router-dom';
import { Typography, Space, Tag, Tabs, TabPane, Timeline, Descriptions } from '@douyinfe/semi-ui';
import { ExternalLink } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import ExpandableText from '@/components/ExpandableText';
import {
  type ProcessOfflineRequest,
  OFFLINE_STATUS_TAG,
} from '@/mocks/processOfflineApproval';
import './index.less';

const { Text, Title } = Typography;

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
  const navigate = useNavigate();
  if (!data) return null;

  const statusCfg = STATUS_TAG[data.status];
  const showLevels = (data.status === 'PENDING_APPROVAL' || data.status === 'APPROVING') && !!data.total_levels;

  const descData = [
    { key: '流程名称', value: <Text>{data.process_name}</Text> },
    { key: '版本', value: <Text>{data.process_version || '-'}</Text> },
    { key: '状态', value: <Tag color={statusCfg.color} type="light" size="small">{statusCfg.text}</Tag> },
    { key: '申请人', value: <UserNameWithCard name={data.applicant_name} userId={data.applicant_id} /> },
    { key: '所属部门', value: <Text>{data.department_name}</Text> },
    { key: '提交时间', value: <Text>{fmtTime(data.submitted_at)}</Text> },
    ...(data.executed_at ? [{ key: '下线时间', value: <Text>{fmtTime(data.executed_at)}</Text> }] : []),
    { key: '下线原因', value: <ExpandableText text={data.reason} maxLines={3} /> },
    ...(data.execution_error ? [{ key: '执行错误', value: <Text type="danger">{data.execution_error}</Text> }] : []),
  ];

  const handleProcessClick = () => {
    navigate(`/dev-center/automation-process?processId=${data.process_id}`);
  };

  const renderBasicInfoTab = () => (
    <div className="offline-request-applicant-drawer-tab-content">
      <Descriptions data={descData} align="left" />
    </div>
  );

  const renderApprovalTab = () => {
    if (!data.approval_template_snapshot) {
      return (
        <div className="offline-request-applicant-drawer-tab-content">
          <Text type="tertiary" size="small">该部门未配置停用审批模板，提交后直接执行下线</Text>
        </div>
      );
    }
    return (
      <div className="offline-request-applicant-drawer-tab-content">
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
          审批模板：{data.approval_template_snapshot.name}
          {showLevels && `　·　当前第 ${data.current_level} / ${data.total_levels} 级`}
        </Text>
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
      </div>
    );
  };

  const renderImpactTab = () => (
    <div className="offline-request-applicant-drawer-tab-content">
      <Title heading={6} className="section-title">下线目标流程</Title>
      <div className="process-card" onClick={handleProcessClick}>
        <div className="process-card-header">
          <span className="process-name">
            <Text strong ellipsis={{ showTooltip: true }}>{data.process_name}</Text>
            <ExternalLink size={16} strokeWidth={2} className="link-icon" />
          </span>
          {data.process_version && <Tag size="small" color="blue">{data.process_version}</Tag>}
        </div>
      </div>

      <Title heading={6} className="section-title">依赖检查快照</Title>
      {renderDependency(data)}
    </div>
  );

  return (
    <DetailDrawerWrapper<ProcessOfflineRequest>
      visible={visible}
      onClose={onClose}
      title="申请详情"
      dataList={dataList}
      currentId={data.id}
      onNavigate={onNavigate}
      pagination={pagination}
      defaultWidth={1000}
      storageKey="offlineRequestApplicantDrawerWidth.v2"
      className="offline-request-applicant-drawer"
    >
      <Tabs type="line" className="offline-request-applicant-drawer-tabs">
        <TabPane tab="基本信息" itemKey="basic">{renderBasicInfoTab()}</TabPane>
        <TabPane tab="审批流程" itemKey="approval">{renderApprovalTab()}</TabPane>
        <TabPane tab="下线影响" itemKey="impact">{renderImpactTab()}</TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default ApplicantDetailDrawer;
