import { useState, useEffect, useMemo } from 'react';
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
  IconInbox,
  IconChevronDown,
  IconChevronUp,
} from '@douyinfe/semi-icons';
import { Collapsible } from '@douyinfe/semi-ui';
import type { LYTimeTriggerResponse, LYTriggerExecutionLogResponse } from '@/api';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import './index.less';

const { Text } = Typography;

interface TimeTriggerDetailDrawerProps {
  visible: boolean;
  trigger: LYTimeTriggerResponse | null;
  triggerList: LYTimeTriggerResponse[];
  onClose: () => void;
  onNavigate: (trigger: LYTimeTriggerResponse) => void;
  onEdit: (trigger: LYTimeTriggerResponse) => void;
  onDelete: (trigger: LYTimeTriggerResponse) => void;
  onToggleStatus: (trigger: LYTimeTriggerResponse, checked: boolean) => void;
  onRefresh?: () => void;
  onScrollToRow?: (id: string) => void;
}

// Mock 执行记录
const generateMockExecutionLogs = (triggerId: string): LYTriggerExecutionLogResponse[] => {
  return Array.from({ length: 5 }, (_, i) => ({
    log_id: `log-${i}`,
    trigger_id: triggerId,
    trigger_time: new Date(2026, 1, 3 - i, 9, 0).toISOString(),
    status: i === 2 ? 'FAILED' : 'SUCCESS' as const,
    created_task_count: i === 2 ? 0 : 1,
    error_message: i === 2 ? '流程机器人不可用' : null,
    created_at: new Date(2026, 1, 3 - i, 9, 0).toISOString(),
  }));
};

const TimeTriggerDetailDrawer = ({
  visible,
  trigger,
  triggerList,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onToggleStatus,
  onScrollToRow,
}: TimeTriggerDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');
  const [executionLogs, setExecutionLogs] = useState<LYTriggerExecutionLogResponse[]>([]);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  // 预览触发时间
  const previewTimes = useMemo(() => {
    if (!trigger) return [];
    const times: string[] = [];
    const baseTime = trigger.start_date_time ? new Date(trigger.start_date_time) : new Date();
    
    for (let i = 0; i < 10; i++) {
      const triggerTime = new Date(baseTime);
      switch (trigger.basic_frequency_type) {
        case 'MINUTELY':
          triggerTime.setMinutes(triggerTime.getMinutes() + i * (trigger.basic_frequency_value || 5));
          break;
        case 'HOURLY':
          triggerTime.setHours(triggerTime.getHours() + i * (trigger.basic_frequency_value || 2));
          break;
        case 'DAILY':
          triggerTime.setDate(triggerTime.getDate() + i);
          break;
        case 'WEEKLY':
          triggerTime.setDate(triggerTime.getDate() + i * 7);
          break;
        case 'MONTHLY':
          triggerTime.setMonth(triggerTime.getMonth() + i);
          break;
        default:
          triggerTime.setDate(triggerTime.getDate() + i);
      }
      times.push(triggerTime.toLocaleString('zh-CN'));
    }
    return times;
  }, [trigger]);

  // 加载执行记录
  useEffect(() => {
    if (visible && trigger) {
      setExecutionLogs(generateMockExecutionLogs(trigger.trigger_id));
    }
  }, [visible, trigger]);

  // 抽屉关闭时重置状态
  const handleClose = () => {
    setActiveTab('basic');
    onClose();
  };

  // 格式化时间
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // 格式化触发规则显示
  const formatTriggerRule = (): string => {
    if (!trigger) return '-';
    if (trigger.rule_type === 'CRON') {
      return trigger.cron_expression || '-';
    }
    
    const freq = trigger.basic_frequency_type;
    const value = trigger.basic_frequency_value;
    
    switch (freq) {
      case 'MINUTELY':
        return t('timeTrigger.frequencyDisplay.everyMinute', { value });
      case 'HOURLY':
        return t('timeTrigger.frequencyDisplay.everyHour', { value });
      case 'DAILY':
        return t('timeTrigger.frequencyDisplay.everyDayAt', { time: '09:00' });
      case 'WEEKLY':
        return t('timeTrigger.frequencyDisplay.everyWeekAt', { day: t('timeTrigger.weekdays.monday'), time: '09:00' });
      case 'MONTHLY':
        return t('timeTrigger.frequencyDisplay.everyMonthAt', { day: 1, time: '09:00' });
      default:
        return '-';
    }
  };

  if (!trigger) return null;

  // 执行记录表格列
  const logColumns = [
    {
      title: t('timeTrigger.executionLog.table.triggerTime'),
      dataIndex: 'trigger_time',
      width: 180,
      render: (time: string) => formatTime(time),
    },
    {
      title: t('timeTrigger.executionLog.table.status'),
      dataIndex: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'SUCCESS' ? 'green' : status === 'FAILED' ? 'red' : 'grey'}>
          {t(`timeTrigger.executionLog.status.${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('timeTrigger.executionLog.table.taskCount'),
      dataIndex: 'created_task_count',
      width: 120,
    },
    {
      title: t('timeTrigger.executionLog.table.errorMessage'),
      dataIndex: 'error_message',
      render: (text: string | null) => text || '-',
    },
  ];

  // 额外操作按钮
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
      storageKey="time-trigger-detail-drawer-width"
      className="time-trigger-detail-drawer"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="time-trigger-detail-drawer-tabs"
      >
        <TabPane tab={t('timeTrigger.detail.tabs.basicInfo')} itemKey="basic">
          <div className="time-trigger-detail-drawer-tab-content">
            {/* 基本信息 */}
            <div className="time-trigger-detail-drawer-section">
              <Text className="time-trigger-detail-drawer-section-title">
                {t('timeTrigger.detail.basicInfo')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.name')}>
                  {trigger.name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.description')}>
                  {trigger.description || '-'}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.status')}>
                  <Space spacing={8}>
                    <Switch
                      checked={trigger.status === 'ENABLED'}
                      onChange={(checked) => onToggleStatus(trigger, checked)}
                      size="small"
                    />
                    <Text type={trigger.status === 'ENABLED' ? 'success' : 'tertiary'}>
                      {t(`timeTrigger.status.${trigger.status.toLowerCase()}`)}
                    </Text>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.creator')}>
                  {trigger.created_by_name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.createTime')}>
                  {formatTime(trigger.created_at)}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.lastTriggerTime')}>
                  {trigger.last_trigger_time ? formatTime(trigger.last_trigger_time) : t('timeTrigger.detail.notTriggeredYet')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* 触发规则 */}
            <div className="time-trigger-detail-drawer-section">
              <Text className="time-trigger-detail-drawer-section-title">
                {t('timeTrigger.detail.triggerRule')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.ruleType')}>
                  <Tag color="blue">
                    {t(`timeTrigger.ruleType.${trigger.rule_type.toLowerCase()}`)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.triggerRule')}>
                  {formatTriggerRule()}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.timeZone')}>
                  {trigger.time_zone}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.startDateTime')}>
                  {formatTime(trigger.start_date_time)}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.endDateTime')}>
                  {trigger.end_date_time ? formatTime(trigger.end_date_time) : t('timeTrigger.detail.neverEnd')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.workCalendar')}>
                  {trigger.enable_work_calendar
                    ? `${trigger.work_calendar_name} (${t(`timeTrigger.fields.executionType${trigger.work_calendar_execution_type === 'WORKDAY' ? 'Workday' : 'NonWorkday'}`)})`
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* 触发预览（可折叠） */}
            <div className="time-trigger-detail-drawer-section">
              <Space spacing={4} align="center" className="time-trigger-detail-drawer-section-title">
                <Text style={{ fontWeight: 500 }}>
                  {t('timeTrigger.detail.triggerPreview')}
                </Text>
                <Button
                  theme="borderless"
                  size="small"
                  icon={previewExpanded ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
                  onClick={() => setPreviewExpanded(!previewExpanded)}
                />
              </Space>
              <Collapsible isOpen={previewExpanded}>
                <div className="time-trigger-detail-drawer-preview">
                  {previewTimes.length > 0 ? (
                    <ul className="time-trigger-detail-drawer-preview-list">
                      {previewTimes.map((time, index) => (
                        <li key={index}>
                          <span className="preview-index">{index + 1}.</span>
                          {time}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="time-trigger-detail-drawer-preview-empty">
                      {t('timeTrigger.createModal.noPreview')}
                    </div>
                  )}
                </div>
              </Collapsible>
            </div>

            {/* 任务配置 */}
            <div className="time-trigger-detail-drawer-section">
              <Text className="time-trigger-detail-drawer-section-title">
                {t('timeTrigger.detail.taskConfig')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.process')}>
                  {trigger.process_name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.executionTarget')}>
                  {trigger.execution_target_name} ({t(`timeTrigger.targetType.${trigger.execution_target_type === 'BOT_GROUP' ? 'botGroup' : trigger.execution_target_type === 'BOT_IN_GROUP' ? 'botInGroup' : 'ungroupedBot'}`)})
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.priority')}>
                  <Tag color={trigger.priority === 'HIGH' ? 'red' : trigger.priority === 'MEDIUM' ? 'orange' : 'grey'}>
                    {t(`task.priority.${trigger.priority.toLowerCase()}`)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.maxDuration')}>
                  {trigger.max_execution_duration} {t('timeTrigger.fields.maxDurationUnit')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.validityDays')}>
                  {trigger.validity_days} {t('timeTrigger.fields.validityDaysUnit')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.enableRecording')}>
                  {trigger.enable_recording ? t('common.yes') : t('common.no')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.taskCountPerTrigger')}>
                  {trigger.task_count_per_trigger}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.allowDuplicateTasks')}>
                  {trigger.allow_duplicate_tasks ? t('common.yes') : t('common.no')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.nextTriggerTime')}>
                  {trigger.next_trigger_time ? formatTime(trigger.next_trigger_time) : t('timeTrigger.detail.notScheduled')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* 输入参数 */}
            <div className="time-trigger-detail-drawer-section">
              <Text className="time-trigger-detail-drawer-section-title">
                {t('timeTrigger.detail.inputParameters')}
              </Text>
              {trigger.input_parameters && Object.keys(trigger.input_parameters).length > 0 ? (
                <div className="time-trigger-detail-drawer-json-content">
                  <pre>{JSON.stringify(trigger.input_parameters, null, 2)}</pre>
                </div>
              ) : (
                <div className="time-trigger-detail-drawer-no-data">
                  <IconInbox style={{ marginRight: 6 }} />
                  {t('timeTrigger.detail.noInputParameters')}
                </div>
              )}
            </div>
          </div>
        </TabPane>

        <TabPane tab={t('timeTrigger.detail.tabs.executionLogs')} itemKey="logs">
          <div className="time-trigger-detail-drawer-tab-content">
            <Table
              dataSource={executionLogs}
              rowKey="log_id"
              columns={logColumns}
              pagination={false}
              empty={t('timeTrigger.executionLog.noLogs')}
            />
          </div>
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default TimeTriggerDetailDrawer;
