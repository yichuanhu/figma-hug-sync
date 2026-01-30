import { useMemo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Tooltip,
  Typography,
  Descriptions,
  Tag,
  Table,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconStop,
  IconPlayCircle,
  IconMaximize,
  IconMinimize,
} from '@douyinfe/semi-icons';
import type {
  LYTaskResponse,
  LYTaskExecutionResponse,
  TaskStatus,
  ExecutionStatus,
  TaskPriority,
} from '@/api';
import './index.less';

const { Text, Title } = Typography;

interface TaskDetailDrawerProps {
  visible: boolean;
  task: LYTaskResponse | null;
  onClose: () => void;
  onCancel: (task: LYTaskResponse) => void;
  onStop: (task: LYTaskResponse) => void;
  onRetry: (task: LYTaskResponse) => void;
  dataSource: LYTaskResponse[];
  onSelectTask: (task: LYTaskResponse) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => Promise<LYTaskResponse[]>;
}

// 状态配置
const taskStatusConfig: Record<TaskStatus, { color: 'grey' | 'blue' | 'orange' | 'green' | 'red'; i18nKey: string }> = {
  PENDING: { color: 'grey', i18nKey: 'task.status.pending' },
  ASSIGNED: { color: 'blue', i18nKey: 'task.status.assigned' },
  WAITING: { color: 'orange', i18nKey: 'task.status.waiting' },
  COMPLETED: { color: 'green', i18nKey: 'task.status.completed' },
  FAILED: { color: 'red', i18nKey: 'task.status.failed' },
  CANCELLED: { color: 'grey', i18nKey: 'task.status.cancelled' },
};

const executionStatusConfig: Record<ExecutionStatus, { color: 'blue' | 'green' | 'red' | 'grey' | 'orange'; i18nKey: string }> = {
  RUNNING: { color: 'blue', i18nKey: 'task.executionStatus.running' },
  SUCCESS: { color: 'green', i18nKey: 'task.executionStatus.success' },
  FAILED: { color: 'red', i18nKey: 'task.executionStatus.failed' },
  STOPPED: { color: 'grey', i18nKey: 'task.executionStatus.stopped' },
  TIMEOUT: { color: 'orange', i18nKey: 'task.executionStatus.timeout' },
};

const priorityConfig: Record<TaskPriority, { color: 'red' | 'orange' | 'grey' | 'blue'; i18nKey: string }> = {
  HIGH: { color: 'red', i18nKey: 'task.priority.high' },
  MEDIUM: { color: 'orange', i18nKey: 'task.priority.medium' },
  LOW: { color: 'grey', i18nKey: 'task.priority.low' },
  MANUAL_QUEUE_BREAKER: { color: 'blue', i18nKey: 'task.priority.manualQueueBreaker' },
};

const TaskDetailDrawer = ({
  visible,
  task,
  onClose,
  onCancel,
  onStop,
  onRetry,
  dataSource,
  onSelectTask,
  currentPage,
  totalPages,
  onPageChange,
}: TaskDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('basicInfo');

  // 当前任务在列表中的索引
  const currentIndex = useMemo(() => {
    if (!task) return -1;
    return dataSource.findIndex((item) => item.task_id === task.task_id);
  }, [task, dataSource]);

  // 导航到上一个/下一个
  const handlePrevious = useCallback(async () => {
    if (currentIndex > 0) {
      onSelectTask(dataSource[currentIndex - 1]);
    } else if (currentPage > 1) {
      const newData = await onPageChange(currentPage - 1);
      if (newData.length > 0) {
        onSelectTask(newData[newData.length - 1]);
      }
    }
  }, [currentIndex, currentPage, dataSource, onPageChange, onSelectTask]);

  const handleNext = useCallback(async () => {
    if (currentIndex < dataSource.length - 1) {
      onSelectTask(dataSource[currentIndex + 1]);
    } else if (currentPage < totalPages) {
      const newData = await onPageChange(currentPage + 1);
      if (newData.length > 0) {
        onSelectTask(newData[0]);
      }
    }
  }, [currentIndex, currentPage, totalPages, dataSource, onPageChange, onSelectTask]);

  // 重置标签页
  useEffect(() => {
    if (visible) {
      setActiveTab('basicInfo');
    }
  }, [visible, task?.task_id]);

  if (!task) return null;

  const canCancel = task.task_status === 'PENDING';
  const canStop = task.execution_status === 'RUNNING';
  const canRetry = task.task_status === 'FAILED';

  // 基本信息描述数据
  const basicInfoData = [
    { key: t('task.detail.taskId'), value: task.task_id },
    { key: t('task.detail.processName'), value: task.process_name },
    { key: t('task.detail.processVersion'), value: task.process_version },
    { key: t('task.detail.executionTarget'), value: task.execution_target_name },
    { key: t('task.detail.triggerSource'), value: t(`task.triggerSource.${task.trigger_source.toLowerCase()}`) },
    { key: t('task.detail.creator'), value: task.creator_name || '-' },
  ];

  const executionInfoData = [
    {
      key: t('task.detail.taskStatus'),
      value: (
        <Tag color={taskStatusConfig[task.task_status]?.color || 'grey'} type="light">
          {t(taskStatusConfig[task.task_status]?.i18nKey || 'task.status.pending')}
        </Tag>
      ),
    },
    {
      key: t('task.detail.executionStatus'),
      value: task.execution_status ? (
        <Tag color={executionStatusConfig[task.execution_status]?.color || 'grey'} type="light">
          {t(executionStatusConfig[task.execution_status]?.i18nKey || '')}
        </Tag>
      ) : '-',
    },
    {
      key: t('task.detail.priority'),
      value: (
        <Tag color={priorityConfig[task.priority]?.color || 'grey'} type="light">
          {t(priorityConfig[task.priority]?.i18nKey || 'task.priority.medium')}
        </Tag>
      ),
    },
    { key: t('task.detail.createTime'), value: task.create_time?.replace('T', ' ').substring(0, 19) || '-' },
    { key: t('task.detail.expireTime'), value: task.expire_time?.replace('T', ' ').substring(0, 19) || '-' },
    { key: t('task.detail.maxDuration'), value: `${task.max_execution_duration} ${t('task.detail.seconds')}` },
    { key: t('task.detail.enableRecording'), value: task.enable_recording ? t('task.detail.enabled') : t('task.detail.disabled') },
    { key: t('task.detail.totalExecutions'), value: `${task.total_execution_count} ${t('task.detail.times')}` },
  ];

  // 执行历史表格列
  const executionColumns = [
    {
      title: t('task.detail.executionId'),
      dataIndex: 'execution_id',
      key: 'execution_id',
      width: 140,
      render: (id: string) => id.substring(0, 8) + '...',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ExecutionStatus) => (
        <Tag color={executionStatusConfig[status]?.color || 'grey'} type="light">
          {t(executionStatusConfig[status]?.i18nKey || '')}
        </Tag>
      ),
    },
    {
      title: t('task.detail.botName'),
      dataIndex: 'bot_name',
      key: 'bot_name',
      width: 120,
    },
    {
      title: t('task.detail.startTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      width: 160,
      render: (value: string) => value?.replace('T', ' ').substring(0, 19) || '-',
    },
    {
      title: t('task.detail.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (value: number | null) => value ? `${value} ${t('task.detail.seconds')}` : '-',
    },
    {
      title: t('task.detail.errorMessage'),
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      render: (value: string | null) => value ? (
        <Tooltip content={value}>
          <span className="task-detail-drawer-error-message">{value.substring(0, 30)}...</span>
        </Tooltip>
      ) : '-',
    },
  ];

  return (
    <SideSheet
      className="task-detail-drawer"
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : 900}
      mask={false}
      closable={false}
      bodyStyle={{ padding: 24 }}
      headerStyle={{ padding: '16px 24px' }}
      title={
        <div className="task-detail-drawer-header">
          <div className="task-detail-drawer-header-nav">
            <Button
              icon={<IconChevronLeft />}
              theme="borderless"
              type="tertiary"
              onClick={handlePrevious}
              disabled={currentIndex === 0 && currentPage === 1}
            />
            <Button
              icon={<IconChevronRight />}
              theme="borderless"
              type="tertiary"
              onClick={handleNext}
              disabled={currentIndex === dataSource.length - 1 && currentPage === totalPages}
            />
          </div>
          <Title heading={5} style={{ margin: 0 }}>{task.task_id}</Title>
          <div className="task-detail-drawer-header-actions">
            {canCancel && (
              <Tooltip content={t('task.actions.cancel')}>
                <Button
                  icon={<IconClose />}
                  theme="borderless"
                  type="tertiary"
                  onClick={() => onCancel(task)}
                />
              </Tooltip>
            )}
            {canStop && (
              <Tooltip content={t('task.actions.stop')}>
                <Button
                  icon={<IconStop />}
                  theme="borderless"
                  type="tertiary"
                  onClick={() => onStop(task)}
                />
              </Tooltip>
            )}
            {canRetry && (
              <Tooltip content={t('task.actions.retry')}>
                <Button
                  icon={<IconPlayCircle />}
                  theme="borderless"
                  type="tertiary"
                  onClick={() => onRetry(task)}
                />
              </Tooltip>
            )}
            <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
              <Button
                icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
                theme="borderless"
                type="tertiary"
                onClick={() => setIsFullscreen(!isFullscreen)}
              />
            </Tooltip>
            <Tooltip content={t('common.close')}>
              <Button
                icon={<IconClose />}
                theme="borderless"
                type="tertiary"
                onClick={onClose}
              />
            </Tooltip>
          </div>
        </div>
      }
    >
      <div className="task-detail-drawer-body">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={t('task.detail.tabs.basicInfo')} itemKey="basicInfo">
            {/* 基本信息 */}
            <div className="task-detail-drawer-section">
              <Text strong className="task-detail-drawer-section-title">
                {t('task.detail.basicInfo')}
              </Text>
              <Descriptions
                data={basicInfoData}
                align="left"
                className="task-detail-drawer-descriptions"
              />
            </div>

            {/* 执行信息 */}
            <div className="task-detail-drawer-section">
              <Text strong className="task-detail-drawer-section-title">
                {t('task.detail.executionInfo')}
              </Text>
              <Descriptions
                data={executionInfoData}
                align="left"
                className="task-detail-drawer-descriptions"
              />
            </div>

            {/* 输入参数 */}
            <div className="task-detail-drawer-section">
              <Text strong className="task-detail-drawer-section-title">
                {t('task.detail.inputParameters')}
              </Text>
              {task.input_parameters && Object.keys(task.input_parameters).length > 0 ? (
                <div className="task-detail-drawer-json-content">
                  <pre>{JSON.stringify(task.input_parameters, null, 2)}</pre>
                </div>
              ) : (
                <div className="task-detail-drawer-no-data">
                  {t('task.detail.noParameters')}
                </div>
              )}
            </div>

            {/* 输出结果 */}
            <div className="task-detail-drawer-section">
              <Text strong className="task-detail-drawer-section-title">
                {t('task.detail.outputResult')}
              </Text>
              {task.output_result && Object.keys(task.output_result).length > 0 ? (
                <div className="task-detail-drawer-json-content">
                  <pre>{JSON.stringify(task.output_result, null, 2)}</pre>
                </div>
              ) : (
                <div className="task-detail-drawer-no-data">
                  {t('task.detail.noOutput')}
                </div>
              )}
            </div>

            {/* 快捷链接 */}
            {task.current_execution && (
              <div className="task-detail-drawer-links">
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {t('task.detail.viewLogs')}
                </a>
                {task.enable_recording && (
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    {t('task.detail.viewRecording')}
                  </a>
                )}
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {t('task.detail.viewScreenshots')}
                </a>
              </div>
            )}
          </TabPane>

          <TabPane tab={t('task.detail.tabs.executionHistory')} itemKey="executionHistory">
            <div className="task-detail-drawer-section">
              <Text strong className="task-detail-drawer-section-title">
                {t('task.detail.executionHistory')}
              </Text>
              {task.executions && task.executions.length > 0 ? (
                <div className="task-detail-drawer-execution-table">
                  <Table
                    columns={executionColumns}
                    dataSource={task.executions}
                    rowKey="execution_id"
                    pagination={false}
                    size="small"
                  />
                </div>
              ) : (
                <div className="task-detail-drawer-no-data">
                  {t('task.detail.noExecutions')}
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </SideSheet>
  );
};

export default TaskDetailDrawer;
