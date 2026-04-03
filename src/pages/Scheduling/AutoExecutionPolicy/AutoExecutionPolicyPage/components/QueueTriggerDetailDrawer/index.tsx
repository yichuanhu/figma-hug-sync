import { useState, useEffect } from 'react';
import { TIMEZONE_OPTIONS } from '@/constants/timezones';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
  Tabs,
  TabPane,
  Space,
  Divider,
  Table,
  Switch,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { Inbox } from 'lucide-react';
import type { LYQueueTriggerResponse, LYQueueTriggerExecutionLogResponse } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import CollaboratorTab from '@/components/CollaboratorManager/CollaboratorTab';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import './index.less';

const { Text } = Typography;

interface QueueTriggerDetailDrawerProps {
  visible: boolean;
  trigger: LYQueueTriggerResponse | null;
  triggerList: LYQueueTriggerResponse[];
  onClose: () => void;
  onNavigate: (trigger: LYQueueTriggerResponse) => void;
  onEdit: (trigger: LYQueueTriggerResponse) => void;
  onDelete: (trigger: LYQueueTriggerResponse) => void;
  onToggleStatus: (trigger: LYQueueTriggerResponse, checked: boolean) => void;
  onRefresh?: () => void;
  onScrollToRow?: (id: string) => void;
  initialTab?: string;
}

// Mock ExecuteRecord
const generateMockExecutionLogs = (triggerId: string): LYQueueTriggerExecutionLogResponse[] => {
  return Array.from({ length: 5 }, (_, i) => ({
    log_id: `log-${i}`,
    trigger_id: triggerId,
    trigger_time: new Date(2026, 1, 3 - i, 9, 0).toISOString(),
    status: i === 2 ? 'FAILED' : 'SUCCESS' as const,
    created_task_count: i === 2 ? 0 : 1 + (i % 3),
    message_count_at_trigger: 10 + i * 5,
    error_message: i === 2 ? 'Execution target unavailable' : null,
    trigger_type: i % 2 === 0 ? 'CONDITION' : 'PERIODIC' as const,
    created_at: new Date(2026, 1, 3 - i, 9, 0).toISOString(),
  }));
};

const QueueTriggerDetailDrawer = ({
  visible,
  trigger,
  triggerList,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onToggleStatus,
  onScrollToRow,
  initialTab = 'basic',
}: QueueTriggerDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [executionLogs, setExecutionLogs] = useState<LYQueueTriggerExecutionLogResponse[]>([]);
  const { canManage } = useCollaboratorPermission('TRIGGER', trigger?.trigger_id);

  // LoadingExecuteRecord
  useEffect(() => {
    if (visible && trigger) {
      setExecutionLogs(generateMockExecutionLogs(trigger.trigger_id));
    }
  }, [visible, trigger]);

  // Format化Time
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // DrawerClose时重置Status
  const handleClose = () => {
    setActiveTab(initialTab);
    onClose();
  };

  if (!trigger) return null;

  // ExecuteRecordTable列
  const logColumns = [
    {
      title: t('queueTrigger.executionLog.table.triggerTime'),
      dataIndex: 'trigger_time',
      width: 180,
      render: (time: string) => formatTime(time),
    },
    {
      title: t('queueTrigger.executionLog.table.triggerType'),
      dataIndex: 'trigger_type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'CONDITION' ? 'blue' : 'cyan'}>
          {t(`queueTrigger.executionLog.triggerType.${type === 'PERIODIC' ? 'periodic' : 'condition'}`)}
        </Tag>
      ),
    },
    {
      title: t('queueTrigger.executionLog.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'SUCCESS' ? 'green' : status === 'FAILED' ? 'red' : 'grey'}>
          {t(`queueTrigger.executionLog.status.${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('queueTrigger.executionLog.table.taskCount'),
      dataIndex: 'created_task_count',
      width: 120,
    },
    {
      title: t('queueTrigger.executionLog.table.messageCount'),
      dataIndex: 'message_count_at_trigger',
      width: 120,
    },
    {
      title: t('queueTrigger.executionLog.table.errorMessage'),
      dataIndex: 'error_message',
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
  ];

  // 额外Operationby钮
  const extraActions = (
    <>
      <Tooltip content={t('common.edit')}>
        <Button
          icon={<IconEditStroked />}
          theme="borderless"
          size="small"
          onClick={() => onEdit(trigger)}
        />
      </Tooltip>
      <Tooltip content={t('common.delete')}>
        <Button
          icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />}
          theme="borderless"
          size="small"
          onClick={() => onDelete(trigger)}
        />
      </Tooltip>
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={handleClose}
      title={trigger.name}
      dataList={triggerList}
      currentId={trigger.trigger_id}
      getId={(item) => item.trigger_id}
      onNavigate={onNavigate}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      defaultWidth={900}
      minWidth={576}
      storageKey="queue-trigger-detail-drawer-width"
      className="queue-trigger-detail-drawer"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="queue-trigger-detail-drawer-tabs"
      >
        <TabPane tab={t('queueTrigger.detail.tabs.basicInfo')} itemKey="basic">
          <div className="queue-trigger-detail-drawer-tab-content">
            {/* Basic Info */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.basicInfo')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.name')}>
                  {trigger.name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.description')}>
                  <ExpandableText text={trigger.description} maxLines={3} />
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.status')}>
                  <Space spacing={8}>
                    <Switch
                      checked={trigger.status === 'ENABLED'}
                      onChange={(checked) => onToggleStatus(trigger, checked)}
                      size="small"
                    />
                    <Text type={trigger.status === 'ENABLED' ? 'success' : 'tertiary'}>
                      {t(`queueTrigger.status.${trigger.status.toLowerCase()}`)}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.creator')}>
                  {trigger.created_by_name ? <UserNameWithCard name={trigger.created_by_name} userId={trigger.created_by_id} /> : '-'}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.createTime')}>
                  {formatTime(trigger.created_at)}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.lastTriggerTime')}>
                  {trigger.last_trigger_time ? formatTime(trigger.last_trigger_time) : t('queueTrigger.detail.notTriggeredYet')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Queue Trigger Config */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.queueConfig')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.timeZone')}>
                  {TIMEZONE_OPTIONS.find(tz => tz.value === trigger.time_zone)?.label || trigger.time_zone}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.workCalendar')}>
                  {trigger.enable_work_calendar
                    ? `${trigger.work_calendar_name} (${t(`timeTrigger.fields.executionType${trigger.work_calendar_execution_type === 'WORKDAY' ? 'Workday' : 'NonWorkday'}`)})`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.monitoredQueue')}>
                  {trigger.queue_name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.minEffectiveMessages')}>
                  {trigger.min_effective_messages}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.messagesPerTrigger')}>
                  {trigger.messages_per_trigger}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.enablePeriodicCheck')}>
                  {trigger.enable_periodic_check 
                    ? t('queueTrigger.detail.periodicCheckEnabled', { interval: trigger.periodic_check_interval })
                    : t('queueTrigger.detail.periodicCheckDisabled')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Task config */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.taskConfig')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.process')}>
                  {trigger.process_name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.executionTarget')}>
                  {trigger.execution_target_name} ({t(`queueTrigger.targetType.${trigger.execution_target_type === 'BOT_GROUP' ? 'botGroup' : trigger.execution_target_type === 'BOT_IN_GROUP' ? 'botInGroup' : 'ungroupedBot'}`)})
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.priority')}>
                  <Tag color={trigger.priority === 'HIGH' ? 'red' : trigger.priority === 'MEDIUM' ? 'orange' : 'grey'}>
                    {t(`task.priority.${trigger.priority.toLowerCase()}`)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.maxDuration')}>
                  {trigger.max_execution_duration} {t('queueTrigger.fields.maxDurationUnit')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.validityDays')}>
                  {trigger.validity_days} {t('queueTrigger.fields.validityDaysUnit')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.enableRecording')}>
                  {trigger.enable_recording ? t('common.yes') : t('common.no')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Status monitoring */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.statusMonitor')}
              </Text>
              <div className="queue-trigger-detail-drawer-status-cards">
                <div className="queue-trigger-detail-drawer-status-card">
                  <div className="queue-trigger-detail-drawer-status-card-value">
                    {trigger.current_message_count ?? 0}
                  </div>
                  <div className="queue-trigger-detail-drawer-status-card-label">
                    {t('queueTrigger.detail.fields.currentMessageCount')}
                  </div>
                </div>
                <div className="queue-trigger-detail-drawer-status-card">
                  <div className="queue-trigger-detail-drawer-status-card-value">
                    {trigger.pending_task_count ?? 0}
                  </div>
                  <div className="queue-trigger-detail-drawer-status-card-label">
                    {t('queueTrigger.detail.fields.pendingTaskCount')}
                  </div>
                </div>
                <div className="queue-trigger-detail-drawer-status-card">
                  <div className="queue-trigger-detail-drawer-status-card-value">
                    {trigger.running_task_count ?? 0}
                  </div>
                  <div className="queue-trigger-detail-drawer-status-card-label">
                    {t('queueTrigger.detail.fields.runningTaskCount')}
                  </div>
                </div>
              </div>
            </div>

            {/* Input parameters */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.inputParameters')}
              </Text>
              {trigger.input_parameters && Object.keys(trigger.input_parameters).length > 0 ? (
                <div className="queue-trigger-detail-drawer-json-content">
                  <pre>{JSON.stringify(trigger.input_parameters, null, 2)}</pre>
                </div>
              ) : (
                <div className="queue-trigger-detail-drawer-no-data">
                  <Inbox size={16} strokeWidth={2} style={{ marginRight: 6 }} />
                  {t('queueTrigger.detail.noParameters')}
                </div>
              )}
            </div>
          </div>
        </TabPane>

        <TabPane tab={t('queueTrigger.detail.tabs.executionLogs')} itemKey="logs">
          <div className="queue-trigger-detail-drawer-tab-content">
            <Table
              dataSource={executionLogs}
              rowKey="log_id"
              columns={logColumns}
              pagination={false}
              empty={t('queueTrigger.executionLog.noLogs')}
            />
          </div>
        </TabPane>
        <TabPane tab={t('collaborator.tabTitle')} itemKey="collaborators">
          <CollaboratorTab
            assetType="TRIGGER"
            assetId={trigger.trigger_id}
            context="scheduling"
            canManage={canManage}
          />
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default QueueTriggerDetailDrawer;
