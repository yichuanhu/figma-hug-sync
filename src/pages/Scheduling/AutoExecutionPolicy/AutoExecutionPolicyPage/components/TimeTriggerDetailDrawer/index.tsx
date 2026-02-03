import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
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
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMaximize,
  IconMinimize,
  IconEditStroked,
  IconDeleteStroked,
  IconPlayCircle,
  IconStop,
} from '@douyinfe/semi-icons';
import type { LYTimeTriggerResponse, LYTriggerExecutionLogResponse } from '@/api';
import './index.less';

const { Title, Text } = Typography;

interface TimeTriggerDetailDrawerProps {
  visible: boolean;
  trigger: LYTimeTriggerResponse | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onEdit: (trigger: LYTimeTriggerResponse) => void;
  onDelete: (trigger: LYTimeTriggerResponse) => void;
  onToggleStatus: (trigger: LYTimeTriggerResponse) => void;
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
  currentIndex,
  totalCount,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onToggleStatus,
}: TimeTriggerDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('time-trigger-detail-drawer-width');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const [executionLogs, setExecutionLogs] = useState<LYTriggerExecutionLogResponse[]>([]);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 加载执行记录
  useEffect(() => {
    if (visible && trigger) {
      setExecutionLogs(generateMockExecutionLogs(trigger.trigger_id));
    }
  }, [visible, trigger]);

  // 保存宽度到 localStorage
  useEffect(() => {
    if (!isFullscreen) {
      localStorage.setItem('time-trigger-detail-drawer-width', drawerWidth.toString());
    }
  }, [drawerWidth, isFullscreen]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

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

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 抽屉关闭时重置状态
  const handleClose = useCallback(() => {
    setActiveTab('basic');
    onClose();
  }, [onClose]);

  // 导航
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalCount - 1;

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

  return (
    <SideSheet
      title={
        <div className="time-trigger-detail-drawer-header">
          <div className="time-trigger-detail-drawer-header-title">
            <Title heading={5}>{trigger.name}</Title>
            <Tag color={trigger.status === 'ENABLED' ? 'green' : 'grey'}>
              {t(`timeTrigger.status.${trigger.status.toLowerCase()}`)}
            </Tag>
          </div>
          <Space spacing={8}>
            <Tooltip content={t('common.previous')}>
              <Button
                icon={<IconChevronLeft />}
                theme="borderless"
                size="small"
                disabled={!canGoPrev}
                onClick={() => onNavigate('prev')}
              />
            </Tooltip>
            <Tooltip content={t('common.next')}>
              <Button
                icon={<IconChevronRight />}
                theme="borderless"
                size="small"
                disabled={!canGoNext}
                onClick={() => onNavigate('next')}
              />
            </Tooltip>
            <Divider layout="vertical" className="time-trigger-detail-drawer-header-divider" />
            <Tooltip content={t('common.edit')}>
              <Button
                icon={<IconEditStroked />}
                theme="borderless"
                size="small"
                onClick={() => onEdit(trigger)}
              />
            </Tooltip>
            <Tooltip content={trigger.status === 'ENABLED' ? t('timeTrigger.actions.disable') : t('timeTrigger.actions.enable')}>
              <Button
                icon={trigger.status === 'ENABLED' ? <IconStop /> : <IconPlayCircle />}
                theme="borderless"
                size="small"
                onClick={() => onToggleStatus(trigger)}
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
            <Divider layout="vertical" className="time-trigger-detail-drawer-header-divider" />
            <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
              <Button
                icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
                theme="borderless"
                size="small"
                onClick={toggleFullscreen}
              />
            </Tooltip>
            <Tooltip content={t('common.close')}>
              <Button
                icon={<IconClose />}
                theme="borderless"
                size="small"
                onClick={handleClose}
                className="time-trigger-detail-drawer-header-close-btn"
              />
            </Tooltip>
          </Space>
        </div>
      }
      visible={visible}
      onCancel={handleClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet time-trigger-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="time-trigger-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
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
                  <Tag color={trigger.status === 'ENABLED' ? 'green' : 'grey'}>
                    {t(`timeTrigger.status.${trigger.status.toLowerCase()}`)}
                  </Tag>
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
                {trigger.enable_work_calendar && (
                  <Descriptions.Item itemKey={t('timeTrigger.detail.fields.workCalendar')}>
                    {trigger.work_calendar_name} ({t(`timeTrigger.fields.executionType${trigger.work_calendar_execution_type === 'WORKDAY' ? 'Workday' : 'NonWorkday'}`)})
                  </Descriptions.Item>
                )}
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.nextTriggerTime')}>
                  {trigger.next_trigger_time ? formatTime(trigger.next_trigger_time) : t('timeTrigger.detail.notScheduled')}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.lastTriggerTime')}>
                  {trigger.last_trigger_time ? formatTime(trigger.last_trigger_time) : t('timeTrigger.detail.notTriggeredYet')}
                </Descriptions.Item>
              </Descriptions>
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
              </Descriptions>
            </div>

            {/* 输入参数 */}
            {trigger.input_parameters && Object.keys(trigger.input_parameters).length > 0 && (
              <div className="time-trigger-detail-drawer-section">
                <Text className="time-trigger-detail-drawer-section-title">
                  {t('timeTrigger.detail.inputParameters')}
                </Text>
                <div className="time-trigger-detail-drawer-params">
                  {Object.entries(trigger.input_parameters).map(([key, value]) => (
                    <div key={key} className="time-trigger-detail-drawer-param-item">
                      <span className="param-name">{key}</span>
                      <span className="param-value">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 系统信息 */}
            <div className="time-trigger-detail-drawer-section">
              <Text className="time-trigger-detail-drawer-section-title">
                {t('timeTrigger.detail.systemInfo')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.creator')}>
                  {trigger.created_by_name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.createTime')}>
                  {formatTime(trigger.created_at)}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('timeTrigger.detail.fields.updateTime')}>
                  {formatTime(trigger.updated_at)}
                </Descriptions.Item>
              </Descriptions>
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
    </SideSheet>
  );
};

export default TimeTriggerDetailDrawer;
