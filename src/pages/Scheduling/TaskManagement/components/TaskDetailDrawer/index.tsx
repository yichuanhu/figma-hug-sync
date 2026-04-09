import { useMemo, useState, useEffect, useRef } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tooltip,
  Typography,
  Descriptions,
  Tag,
  Tabs,
  TabPane,
} from '@douyinfe/semi-ui';
import type { CollaboratorProps } from '@/components/DetailDrawerWrapper';
import { Inbox, MinusCircle, PlayCircle, XCircle } from 'lucide-react';
import type {
  LYTaskResponse,
  TaskStatus,
  ExecutionStatus,
  TaskPriority,
} from '@/api';
import ExecutionHistoryTab from './ExecutionHistoryTab';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import './index.less';

const { Text } = Typography;

interface TaskDetailDrawerProps {
  visible: boolean;
  task: LYTaskResponse | null;
  onClose: () => void;
  onCancel: (task: LYTaskResponse) => void;
  onStop: (task: LYTaskResponse) => void;
  onRetry: (task: LYTaskResponse) => void;
  dataSource: LYTaskResponse[];
  onSelectTask: (task: LYTaskResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (taskId: string) => void;
  initialTab?: 'basicInfo' | 'executionHistory';
}

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
  pagination,
  onPageChange,
  onScrollToRow,
  initialTab = 'basicInfo',
}: TaskDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basicInfo');

  // 只in Drawer首open时重置标签页
  const prevVisible = useRef(visible);
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setActiveTab(initialTab);
    }
    prevVisible.current = visible;
  }, [visible, initialTab]);

  const handleClose = () => {
    setActiveTab('basicInfo');
    onClose();
  };

  if (!task) return null;

  const canCancel = task.task_status === 'PENDING';
  const canStop = task.execution_status === 'RUNNING';
  const canRetry = task.task_status === 'FAILED';

  const basicInfoData = [
    { key: t('task.detail.taskId'), value: task.task_id },
    { key: t('task.detail.processName'), value: task.process_name },
    { key: t('task.detail.processVersion'), value: task.process_version },
    { key: t('task.detail.executionTarget'), value: task.execution_target_name },
    { key: t('task.detail.triggerSource'), value: t(`task.triggerSource.${task.trigger_source.toLowerCase()}`) },
    { key: t('task.detail.creator'), value: task.creator_name ? <UserNameWithCard name={task.creator_name} userId={task.creator_id} /> : '-' },
  ];

  const executionInfoData = [
    { key: t('task.detail.taskStatus'), value: <Tag color={taskStatusConfig[task.task_status]?.color || 'grey'} type="light">{t(taskStatusConfig[task.task_status]?.i18nKey || 'task.status.pending')}</Tag> },
    { key: t('task.detail.executionStatus'), value: task.execution_status ? <Tag color={executionStatusConfig[task.execution_status]?.color || 'grey'} type="light">{t(executionStatusConfig[task.execution_status]?.i18nKey || '')}</Tag> : '-' },
    { key: t('task.detail.priority'), value: <Tag color={priorityConfig[task.priority]?.color || 'grey'} type="light">{t(priorityConfig[task.priority]?.i18nKey || 'task.priority.medium')}</Tag> },
    { key: t('task.detail.createTime'), value: task.create_time?.replace('T', ' ').substring(0, 19) || '-' },
    { key: t('task.detail.expireTime'), value: task.expire_time?.replace('T', ' ').substring(0, 19) || '-' },
    { key: t('task.detail.maxDuration'), value: `${task.max_execution_duration} ${t('task.detail.seconds')}` },
    { key: t('task.detail.enableRecording'), value: task.enable_recording ? t('task.detail.enabled') : t('task.detail.disabled') },
    { key: t('task.detail.totalExecutions'), value: `${task.total_execution_count} ${t('task.detail.times')}` },
  ];

  const extraActions = (
    <>
      {canCancel && (
        <Tooltip content={t('task.actions.cancel')}>
          <Button icon={<XCircle size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={() => onCancel(task)} />
        </Tooltip>
      )}
      {canStop && (
        <Tooltip content={t('task.actions.stop')}>
          <Button icon={<MinusCircle size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={() => onStop(task)} />
        </Tooltip>
      )}
      {canRetry && (
        <Tooltip content={t('task.actions.retry')}>
          <Button icon={<PlayCircle size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={() => onRetry(task)} />
        </Tooltip>
      )}
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={handleClose}
      title={task.task_id}
      dataList={dataSource}
      currentId={task.task_id}
      getId={(item) => item.task_id}
      onNavigate={onSelectTask}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      defaultWidth={900}
      minWidth={576}
      storageKey="taskDetailDrawerWidth"
      className="task-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="task-detail-drawer-tabs">
        <TabPane tab={t('task.detail.tabs.basicInfo')} itemKey="basicInfo">
          <div className="task-detail-drawer-tab-content">
            <div className="task-detail-drawer-info-section">
              <Text strong className="task-detail-drawer-info-title">{t('task.detail.basicInfo')}</Text>
              <Descriptions data={basicInfoData} align="left" />
            </div>
            <div className="task-detail-drawer-info-section">
              <Text strong className="task-detail-drawer-info-title">{t('task.detail.executionInfo')}</Text>
              <Descriptions data={executionInfoData} align="left" />
            </div>
            <div className="task-detail-drawer-info-section">
              <Text strong className="task-detail-drawer-info-title">{t('task.detail.inputParameters')}</Text>
              {task.input_parameters && Object.keys(task.input_parameters).length > 0 ? (
                <div className="task-detail-drawer-json-content">
                  <pre>{JSON.stringify(task.input_parameters, null, 2)}</pre>
                </div>
              ) : (
                <div className="task-detail-drawer-no-data">
                  <Inbox size={16} strokeWidth={2} style={{ marginRight: 6 }} />
                  {t('task.detail.noParameters')}
                </div>
              )}
            </div>
            <div className="task-detail-drawer-info-section">
              <Text strong className="task-detail-drawer-info-title">{t('task.detail.outputResult')}</Text>
              {task.output_result && Object.keys(task.output_result).length > 0 ? (
                <div className="task-detail-drawer-json-content">
                  <pre>{JSON.stringify(task.output_result, null, 2)}</pre>
                </div>
              ) : (
                <div className="task-detail-drawer-no-data">
                  <Inbox size={16} strokeWidth={2} style={{ marginRight: 6 }} />
                  {t('task.detail.noOutput')}
                </div>
              )}
            </div>
          </div>
        </TabPane>
        <TabPane tab={t('task.detail.tabs.executionHistory')} itemKey="executionHistory">
          <div className="task-detail-drawer-tab-content task-detail-drawer-tab-content--full-height">
            <ExecutionHistoryTab taskId={task.task_id} taskName={task.process_name} enableRecording={task.enable_recording} />
          </div>
        </TabPane>
      </Tabs>
    </DetailDrawerWrapper>
  );
};

export default TaskDetailDrawer;
