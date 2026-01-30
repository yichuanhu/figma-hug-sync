import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tag,
  Typography,
  Descriptions,
  Tabs,
  TabPane,
  Space,
  Spin,
} from '@douyinfe/semi-ui';
import {
  IconRefresh,
  IconVideo,
  IconImage,
} from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import ExecutionLogTab from '../ExecutionLogTab';
import type {
  LYTaskExecutionResponse,
  LYListResponseLYTaskExecutionResponse,
  ExecutionStatus,
  GetExecutionHistoryParams,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface ExecutionHistoryTabProps {
  taskId: string;
  enableRecording: boolean;
}

// 执行状态配置
const executionStatusConfig: Record<ExecutionStatus, { color: 'blue' | 'green' | 'red' | 'grey' | 'orange'; i18nKey: string }> = {
  RUNNING: { color: 'blue', i18nKey: 'task.executionStatus.running' },
  SUCCESS: { color: 'green', i18nKey: 'task.executionStatus.success' },
  FAILED: { color: 'red', i18nKey: 'task.executionStatus.failed' },
  STOPPED: { color: 'grey', i18nKey: 'task.executionStatus.stopped' },
  TIMEOUT: { color: 'orange', i18nKey: 'task.executionStatus.timeout' },
};

// 生成UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock数据生成
const generateMockExecution = (taskId: string, index: number): LYTaskExecutionResponse => {
  // 第一条记录用 SUCCESS 状态，这样用户可以看到查看录屏按钮
  const statuses: ExecutionStatus[] = ['SUCCESS', 'RUNNING', 'FAILED', 'SUCCESS', 'TIMEOUT', 'STOPPED'];
  const botNames = ['RPA-BOT-001', 'RPA-BOT-002', 'RPA-BOT-003', 'RPA-BOT-004', 'RPA-BOT-005', 'RPA-BOT-006'];
  // 最新的时间在前面，index越小时间越新
  const createDate = new Date(2026, 0, 30, 14 - index, 30 - (index * 5));
  const status = statuses[index % statuses.length];
  
  return {
    execution_id: generateUUID(),
    task_id: taskId,
    status,
    start_time: createDate.toISOString(),
    end_time: status !== 'RUNNING' ? new Date(createDate.getTime() + 300000).toISOString() : null,
    duration: status !== 'RUNNING' ? 300 + (index * 10) : null,
    bot_id: generateUUID(),
    bot_name: botNames[index % botNames.length],
    error_message: status === 'FAILED' ? '执行失败：目标元素未找到' : status === 'TIMEOUT' ? '执行超时' : null,
    log_count: 50 + (index % 50),
    screenshot_count: index % 2 === 0 ? 5 + (index % 10) : 0,
  };
};

// Mock API调用
const fetchExecutionHistory = async (
  taskId: string,
  params: GetExecutionHistoryParams
): Promise<LYListResponseLYTaskExecutionResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // 生成6条mock数据，按时间倒序排列（最新的在前面）
  const mockData = Array(6).fill(null).map((_, index) => generateMockExecution(taskId, index));
  
  const total = mockData.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = mockData.slice(offset, offset + size);
  
  return {
    range: { offset, size, total },
    list: paginatedData,
  };
};

// 格式化时间戳为tab标签
const formatExecutionTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

const ExecutionHistoryTab = ({ taskId, enableRecording }: ExecutionHistoryTabProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<LYTaskExecutionResponse[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  
  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchExecutionHistory(taskId, { offset: 0, size: 50 });
      setExecutions(response.list);
      if (response.list.length > 0) {
        setSelectedExecutionId(response.list[0].execution_id);
      }
    } finally {
      setLoading(false);
    }
  }, [taskId]);
  
  useEffect(() => {
    loadData();
  }, [taskId]);
  
  const handleRefresh = () => {
    loadData();
  };
  
  // 当前选中的执行记录
  const selectedExecution = useMemo(() => {
    return executions.find((e) => e.execution_id === selectedExecutionId) || null;
  }, [executions, selectedExecutionId]);
  
  // 查看录屏
  const handleViewRecording = useCallback(() => {
    if (selectedExecution) {
      navigate(`/scheduling-center/task-execution/task-list/${selectedExecution.execution_id}/recording`);
    }
  }, [navigate, selectedExecution]);
  
  // 查看截图
  const handleViewScreenshots = useCallback(() => {
    console.log('View screenshots for execution:', selectedExecution?.execution_id);
  }, [selectedExecution]);
  
  // 执行信息描述数据
  const executionInfoData = useMemo(() => {
    if (!selectedExecution) return [];
    return [
      { key: t('executionHistory.fields.executionId'), value: selectedExecution.execution_id },
      {
        key: t('executionHistory.fields.status'),
        value: (
          <Tag color={executionStatusConfig[selectedExecution.status]?.color || 'grey'} type="light">
            {t(executionStatusConfig[selectedExecution.status]?.i18nKey || '')}
          </Tag>
        ),
      },
      { key: t('executionHistory.fields.botName'), value: selectedExecution.bot_name || '-' },
      { key: t('executionHistory.fields.startTime'), value: selectedExecution.start_time?.replace('T', ' ').substring(0, 19) || '-' },
      { key: t('executionHistory.fields.endTime'), value: selectedExecution.end_time?.replace('T', ' ').substring(0, 19) || '-' },
      { key: t('executionHistory.fields.duration'), value: selectedExecution.duration ? `${selectedExecution.duration}s` : '-' },
      { key: t('executionHistory.fields.logCount'), value: String(selectedExecution.log_count || 0) },
    ];
  }, [selectedExecution, t]);
  
  // 是否显示查看录屏按钮
  const showRecordingButton = enableRecording && selectedExecution?.status !== 'RUNNING';
  
  // 是否显示查看截图按钮
  const showScreenshotButton = (selectedExecution?.screenshot_count || 0) > 0;
  
  if (loading && executions.length === 0) {
    return (
      <div className="execution-history-tab-loading">
        <Spin size="large" />
      </div>
    );
  }
  
  if (executions.length === 0) {
    return (
      <div className="execution-history-tab-empty">
        <EmptyState
          variant="noData"
          description={t('executionHistory.noData')}
        />
      </div>
    );
  }
  
  return (
    <div className="execution-history-tab">
      {/* 顶部执行时间戳Tabs - 使用Semi原生滚动箭头 */}
      <div className="execution-history-tab-header">
        <Tabs
          type="button"
          activeKey={selectedExecutionId || ''}
          onChange={(key) => setSelectedExecutionId(key)}
          className="execution-history-tab-tabs"
          collapsible
        >
          {executions.map((execution) => {
            const statusConfig = executionStatusConfig[execution.status];
            return (
              <TabPane
                key={execution.execution_id}
                itemKey={execution.execution_id}
                tab={
                  <span className="execution-history-tab-label">
                    {formatExecutionTime(execution.start_time)}
                    <Tag
                      color={statusConfig?.color || 'grey'}
                      type="light"
                      size="small"
                      className="execution-history-tab-label-status"
                    >
                      {t(statusConfig?.i18nKey || '')}
                    </Tag>
                  </span>
                }
              />
            );
          })}
        </Tabs>
      </div>

      {/* 执行详情内容 */}
      <div className="execution-history-tab-content">
        {selectedExecution && (
          <>
            {/* 执行信息 */}
            <div className="execution-history-tab-info-section">
              <div className="execution-history-tab-info-header">
                <Text strong className="execution-history-tab-section-title">
                  {t('executionHistory.executionInfo')}
                </Text>
                <Space>
                  {showRecordingButton && (
                    <Button
                      icon={<IconVideo />}
                      size="small"
                      theme="borderless"
                      onClick={handleViewRecording}
                    >
                      {t('task.detail.viewRecording')}
                    </Button>
                  )}
                  {showScreenshotButton && (
                    <Button
                      icon={<IconImage />}
                      size="small"
                      theme="borderless"
                      onClick={handleViewScreenshots}
                    >
                      {t('task.detail.viewScreenshots')}
                    </Button>
                  )}
                </Space>
              </div>
              <Descriptions data={executionInfoData} align="left" />
              
              {/* 错误信息 */}
              {selectedExecution.error_message && (
                <div className="execution-history-tab-error">
                  <Text type="danger" size="small">
                    {t('executionHistory.fields.errorMessage')}: {selectedExecution.error_message}
                  </Text>
                </div>
              )}
            </div>

            {/* 执行日志 */}
            <div className="execution-history-tab-logs-section">
              <Text strong className="execution-history-tab-section-title">
                {t('executionHistory.executionLogs')}
              </Text>
              <div className="execution-history-tab-logs-content">
                <ExecutionLogTab
                  executionId={selectedExecution.execution_id}
                  executionStatus={selectedExecution.status}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ExecutionHistoryTab;
