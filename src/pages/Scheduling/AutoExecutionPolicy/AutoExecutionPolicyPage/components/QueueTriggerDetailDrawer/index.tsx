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
  Switch,
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconChevronRight,
  IconEditStroked,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { X, Maximize2, Minimize2, Inbox } from 'lucide-react';
import type { LYQueueTriggerResponse, LYQueueTriggerExecutionLogResponse } from '@/api';
import './index.less';

const { Title, Text } = Typography;

interface QueueTriggerDetailDrawerProps {
  visible: boolean;
  trigger: LYQueueTriggerResponse | null;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onEdit: (trigger: LYQueueTriggerResponse) => void;
  onDelete: (trigger: LYQueueTriggerResponse) => void;
  onToggleStatus: (trigger: LYQueueTriggerResponse, checked: boolean) => void;
  onRefresh?: () => void;
}

// Mock 执行记录
const generateMockExecutionLogs = (triggerId: string): LYQueueTriggerExecutionLogResponse[] => {
  return Array.from({ length: 5 }, (_, i) => ({
    log_id: `log-${i}`,
    trigger_id: triggerId,
    trigger_time: new Date(2026, 1, 3 - i, 9, 0).toISOString(),
    status: i === 2 ? 'FAILED' : 'SUCCESS' as const,
    created_task_count: i === 2 ? 0 : 1 + (i % 3),
    message_count_at_trigger: 10 + i * 5,
    error_message: i === 2 ? '执行目标不可用' : null,
    trigger_type: i % 2 === 0 ? 'CONDITION' : 'PERIODIC' as const,
    created_at: new Date(2026, 1, 3 - i, 9, 0).toISOString(),
  }));
};

const QueueTriggerDetailDrawer = ({
  visible,
  trigger,
  currentIndex,
  totalCount,
  onClose,
  onNavigate,
  onEdit,
  onDelete,
  onToggleStatus,
}: QueueTriggerDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('queue-trigger-detail-drawer-width');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const [executionLogs, setExecutionLogs] = useState<LYQueueTriggerExecutionLogResponse[]>([]);
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
      localStorage.setItem('queue-trigger-detail-drawer-width', drawerWidth.toString());
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
      render: (text: string | null) => text || '-',
    },
  ];

  return (
    <SideSheet
      title={
        <div className="queue-trigger-detail-drawer-header">
          <div className="queue-trigger-detail-drawer-header-title">
            <Title heading={5}>{trigger.name}</Title>
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
            <Divider layout="vertical" className="queue-trigger-detail-drawer-header-divider" />
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
            <Divider layout="vertical" className="queue-trigger-detail-drawer-header-divider" />
            <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
              <Button
                icon={isFullscreen ? <Minimize2 size={16} strokeWidth={2} /> : <Maximize2 size={16} strokeWidth={2} />}
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
                className="queue-trigger-detail-drawer-header-close-btn"
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
      className={`card-sidesheet resizable-sidesheet queue-trigger-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="queue-trigger-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="queue-trigger-detail-drawer-tabs"
      >
        <TabPane tab={t('queueTrigger.detail.tabs.basicInfo')} itemKey="basic">
          <div className="queue-trigger-detail-drawer-tab-content">
            {/* 基本信息 */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.basicInfo')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.name')}>
                  {trigger.name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.description')}>
                  {trigger.description || '-'}
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
                  {trigger.created_by_name}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.createTime')}>
                  {formatTime(trigger.created_at)}
                </Descriptions.Item>
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.lastTriggerTime')}>
                  {trigger.last_trigger_time ? formatTime(trigger.last_trigger_time) : t('queueTrigger.detail.notTriggeredYet')}
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* 队列触发配置 */}
            <div className="queue-trigger-detail-drawer-section">
              <Text className="queue-trigger-detail-drawer-section-title">
                {t('queueTrigger.detail.queueConfig')}
              </Text>
              <Descriptions align="left">
                <Descriptions.Item itemKey={t('queueTrigger.detail.fields.timeZone')}>
                  {trigger.time_zone}
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

            {/* 任务配置 */}
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

            {/* 状态监控 */}
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

            {/* 输入参数 */}
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
                  <IconInbox style={{ marginRight: 6 }} />
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
      </Tabs>
    </SideSheet>
  );
};

export default QueueTriggerDetailDrawer;
