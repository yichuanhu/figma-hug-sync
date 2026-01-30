import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Tooltip,
  Typography,
  Descriptions,
  Tag,
  Tabs,
  TabPane,
  Divider,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMinusCircleStroked,
  IconPlayCircle,
  IconMaximize,
  IconMinimize,
  IconInbox,
} from '@douyinfe/semi-icons';
import type {
  LYTaskResponse,
  TaskStatus,
  ExecutionStatus,
  TaskPriority,
} from '@/api';
import DetailSkeleton from '@/components/DetailSkeleton';
import ExecutionHistoryTab from './ExecutionHistoryTab';
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
  onScrollToRow?: (taskId: string) => void;
  initialTab?: 'basicInfo';
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
  onScrollToRow,
  initialTab = 'basicInfo',
}: TaskDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('basicInfo');
  const [isNavigating, setIsNavigating] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('taskDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

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

  useEffect(() => {
    localStorage.setItem('taskDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  // 当前任务在列表中的索引
  const currentIndex = useMemo(() => {
    if (!task) return -1;
    return dataSource.findIndex((item) => item.task_id === task.task_id);
  }, [task, dataSource]);

  // 判断是否可以导航（考虑分页）
  const canGoPrev = useMemo(() => {
    if (currentIndex > 0) return true;
    if (currentPage > 1) return true;
    return false;
  }, [currentIndex, currentPage]);

  const canGoNext = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < dataSource.length - 1) return true;
    if (currentPage < totalPages) return true;
    return false;
  }, [currentIndex, dataSource.length, currentPage, totalPages]);

  // 导航到上一个
  const handlePrev = useCallback(async () => {
    if (isNavigating) return;

    if (currentIndex > 0) {
      const target = dataSource[currentIndex - 1];
      onSelectTask(target);
      onScrollToRow?.(target.task_id);
    } else if (currentPage > 1) {
      setIsNavigating(true);
      try {
        const newData = await onPageChange(currentPage - 1);
        if (newData.length > 0) {
          const target = newData[newData.length - 1];
          onSelectTask(target);
          onScrollToRow?.(target.task_id);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, currentPage, dataSource, onPageChange, onSelectTask, isNavigating, onScrollToRow]);

  // 导航到下一个
  const handleNext = useCallback(async () => {
    if (isNavigating) return;

    if (currentIndex >= 0 && currentIndex < dataSource.length - 1) {
      const target = dataSource[currentIndex + 1];
      onSelectTask(target);
      onScrollToRow?.(target.task_id);
    } else if (currentPage < totalPages) {
      setIsNavigating(true);
      try {
        const newData = await onPageChange(currentPage + 1);
        if (newData.length > 0) {
          const target = newData[0];
          onSelectTask(target);
          onScrollToRow?.(target.task_id);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, currentPage, totalPages, dataSource, onPageChange, onSelectTask, isNavigating, onScrollToRow]);

  // 重置标签页
  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, task?.task_id, initialTab]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

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


  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="task-detail-drawer-header">
          <Col>
            <Title heading={5} className="task-detail-drawer-header-title">
              {task.task_id}
            </Title>
          </Col>
          <Col>
            <Space spacing={8}>
              <Tooltip content={t('common.previous')}>
                <Button
                  icon={<IconChevronLeft />}
                  theme="borderless"
                  size="small"
                  disabled={!canGoPrev || isNavigating}
                  onClick={handlePrev}
                  loading={isNavigating}
                  className="navigate"
                />
              </Tooltip>
              <Tooltip content={t('common.next')}>
                <Button
                  icon={<IconChevronRight />}
                  theme="borderless"
                  size="small"
                  disabled={!canGoNext || isNavigating}
                  onClick={handleNext}
                  loading={isNavigating}
                  className="navigate"
                />
              </Tooltip>
              <Divider layout="vertical" className="task-detail-drawer-header-divider" />
              {canCancel && (
                <Tooltip content={t('task.actions.cancel')}>
                  <Button
                    icon={<IconClose />}
                    theme="borderless"
                    size="small"
                    onClick={() => onCancel(task)}
                  />
                </Tooltip>
              )}
              {canStop && (
                <Tooltip content={t('task.actions.stop')}>
                  <Button
                    icon={<IconMinusCircleStroked />}
                    theme="borderless"
                    size="small"
                    onClick={() => onStop(task)}
                  />
                </Tooltip>
              )}
              {canRetry && (
                <Tooltip content={t('task.actions.retry')}>
                  <Button
                    icon={<IconPlayCircle />}
                    theme="borderless"
                    size="small"
                    onClick={() => onRetry(task)}
                  />
                </Tooltip>
              )}
              <Divider layout="vertical" className="task-detail-drawer-header-divider" />
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
                  onClick={onClose}
                  className="task-detail-drawer-header-close-btn"
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet task-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="task-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      {isNavigating ? (
        <DetailSkeleton rows={5} showTabs={true} sections={2} />
      ) : (
        <Tabs activeKey={activeTab} onChange={setActiveTab} className="task-detail-drawer-tabs">
          <TabPane tab={t('task.detail.tabs.basicInfo')} itemKey="basicInfo">
            <div className="task-detail-drawer-tab-content">
              {/* 基本信息 */}
              <div className="task-detail-drawer-info-section">
                <Text strong className="task-detail-drawer-info-title">
                  {t('task.detail.basicInfo')}
                </Text>
                <Descriptions data={basicInfoData} align="left" />
              </div>

              {/* 执行信息 */}
              <div className="task-detail-drawer-info-section">
                <Text strong className="task-detail-drawer-info-title">
                  {t('task.detail.executionInfo')}
                </Text>
                <Descriptions data={executionInfoData} align="left" />
              </div>

              {/* 输入参数 */}
              <div className="task-detail-drawer-info-section">
                <Text strong className="task-detail-drawer-info-title">
                  {t('task.detail.inputParameters')}
                </Text>
                {task.input_parameters && Object.keys(task.input_parameters).length > 0 ? (
                  <div className="task-detail-drawer-json-content">
                    <pre>{JSON.stringify(task.input_parameters, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="task-detail-drawer-no-data">
                    <IconInbox style={{ marginRight: 6 }} />
                    {t('task.detail.noParameters')}
                  </div>
                )}
              </div>

              {/* 输出结果 */}
              <div className="task-detail-drawer-info-section">
                <Text strong className="task-detail-drawer-info-title">
                  {t('task.detail.outputResult')}
                </Text>
                {task.output_result && Object.keys(task.output_result).length > 0 ? (
                  <div className="task-detail-drawer-json-content">
                    <pre>{JSON.stringify(task.output_result, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="task-detail-drawer-no-data">
                    <IconInbox style={{ marginRight: 6 }} />
                    {t('task.detail.noOutput')}
                  </div>
                )}
              </div>

              {/* 快捷链接 */}
              {task.current_execution && (
                <div className="task-detail-drawer-links">
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    {t('task.detail.viewScreenshots')}
                  </a>
                </div>
              )}
            </div>
          </TabPane>
          <TabPane tab={t('task.detail.tabs.executionHistory')} itemKey="executionHistory">
            <div className="task-detail-drawer-tab-content task-detail-drawer-tab-content--full-height">
              <ExecutionHistoryTab 
                taskId={task.task_id} 
                enableRecording={task.enable_recording} 
              />
            </div>
          </TabPane>
        </Tabs>
      )}
    </SideSheet>
  );
};

export default TaskDetailDrawer;
