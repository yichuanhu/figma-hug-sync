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
  Collapsible,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import ExecutionLogTab from '../ExecutionLogTab';
import ScreenshotViewModal from '../../ScreenshotViewModal';
import type {
  LYTaskExecutionResponse,
  LYListResponseLYTaskExecutionResponse,
  ExecutionStatus,
  GetExecutionHistoryParams,
} from '@/api';
import './index.less';
import { ChevronDown, ChevronUp, ImageIcon, Video } from 'lucide-react';

const { Text } = Typography;

interface ExecutionHistoryTabProps {
  taskId: string;
  taskName?: string;
  enableRecording: boolean;
}

// ExecuteStatusConfig
const executionStatusConfig: Record<ExecutionStatus, { color: 'blue' | 'green' | 'red' | 'grey' | 'orange'; i18nKey: string }> = {
  RUNNING: { color: 'blue', i18nKey: 'task.executionStatus.running' },
  SUCCESS: { color: 'green', i18nKey: 'task.executionStatus.success' },
  FAILED: { color: 'red', i18nKey: 'task.executionStatus.failed' },
  STOPPED: { color: 'grey', i18nKey: 'task.executionStatus.stopped' },
  TIMEOUT: { color: 'orange', i18nKey: 'task.executionStatus.timeout' },
};

// generationUUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// MockDatageneration
const generateMockExecution = (taskId: string, index: number): LYTaskExecutionResponse => {
  // 第Mon recordsuse SUCCESS Status, this样use户can看toView录屏by钮
  const statuses: ExecutionStatus[] = ['SUCCESS', 'RUNNING', 'FAILED', 'SUCCESS', 'TIMEOUT', 'STOPPED'];
  const botNames = ['RPA-BOT-001', 'RPA-BOT-002', 'RPA-BOT-003', 'RPA-BOT-004', 'RPA-BOT-005', 'RPA-BOT-006'];
  // 最新's Timein 前面, index越小Time越新
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
    error_message: status === 'FAILED' ? 'Execution failed: Target element not found' : status === 'TIMEOUT' ? 'ExecuteTimeout' : null,
    log_count: 50 + (index % 50),
    screenshot_count: index % 2 === 0 ? 5 + (index % 10) : 0,
  };
};

// Mock API调use
const fetchExecutionHistory = async (
  taskId: string,
  params: GetExecutionHistoryParams
): Promise<LYListResponseLYTaskExecutionResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  
  // generation6mockData, byTime倒序排列(最新's in 前面)
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

// Format化Time戳astab标签
const formatExecutionTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

const ExecutionHistoryTab = ({ taskId, taskName, enableRecording }: ExecutionHistoryTabProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<LYTaskExecutionResponse[]>([]);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [screenshotModalVisible, setScreenshotModalVisible] = useState(false);
  
  // LoadingData
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
  
  // 当前Selected's ExecuteRecord
  const selectedExecution = useMemo(() => {
    return executions.find((e) => e.execution_id === selectedExecutionId) || null;
  }, [executions, selectedExecutionId]);
  
  // View录屏
  const handleViewRecording = useCallback(() => {
    if (selectedExecution) {
      // 传递 taskId  and  activeTab 以便Back时重新openDrawer并定-bittoExecuteHistorytab
      navigate(`/scheduling-center/task-execution/task-list/${selectedExecution.execution_id}/recording?taskId=${taskId}&activeTab=executionHistory`);
    }
  }, [navigate, selectedExecution, taskId]);
  
  // Viewscreenshot
  const handleViewScreenshots = useCallback(() => {
    setScreenshotModalVisible(true);
  }, []);
  
  // ClosescreenshotModal
  const handleCloseScreenshotModal = useCallback(() => {
    setScreenshotModalVisible(false);
  }, []);
  
  // ExecuteInfoDescriptionData
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
  
  // is否displayView录屏by钮
  const showRecordingButton = enableRecording && selectedExecution?.status !== 'RUNNING';
  
  // is否displayViewscreenshotby钮
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
      {/* Top execution timestamp tabs - Using Semi native scroll arrows */}
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

      {/* Execution details content */}
      <div className="execution-history-tab-content">
        {selectedExecution && (
          <>
            {/* ExecuteInfo - collapsible */}
            <div className="execution-history-tab-info-section">
              <div 
                className="execution-history-tab-info-header execution-history-tab-info-header--clickable"
                onClick={() => setInfoCollapsed(!infoCollapsed)}
              >
                <Space>
                  {infoCollapsed ? <ChevronDown size={16} strokeWidth={2} /> : <ChevronUp size={16} strokeWidth={2} />}
                  <Text strong className="execution-history-tab-section-title">
                    {t('executionHistory.executionInfo')}
                  </Text>
                </Space>
                <div onClick={(e) => e.stopPropagation()}>
                  <Space>
                    {showRecordingButton && (
                      <Button
                         icon={<Video size={16} strokeWidth={2} />}
                        size="small"
                        theme="borderless"
                        onClick={handleViewRecording}
                      >
                        {t('task.detail.viewRecording')}
                      </Button>
                    )}
                    {showScreenshotButton && (
                      <Button
                         icon={<ImageIcon size={16} strokeWidth={2} />}
                        size="small"
                        theme="borderless"
                        onClick={handleViewScreenshots}
                      >
                        {t('task.detail.viewScreenshots')}
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
              <Collapsible isOpen={!infoCollapsed}>
                <div className="execution-history-tab-info-content">
                  <Descriptions data={executionInfoData} align="left" />
                  
                  {/* ErrorInfo */}
                  {selectedExecution.error_message && (
                    <div className="execution-history-tab-error">
                      <Text type="danger" size="small">
                        {t('executionHistory.fields.errorMessage')}: {selectedExecution.error_message}
                      </Text>
                    </div>
                  )}
                </div>
              </Collapsible>
            </div>

            {/* ExecuteLog */}
            <div className="execution-history-tab-logs-section">
              <div className="execution-history-tab-logs-content">
                <ExecutionLogTab
                  executionId={selectedExecution.execution_id}
                  executionStatus={selectedExecution.status}
                  title={t('executionHistory.executionLogs')}
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* screenshotViewModal */}
      {selectedExecution && (
        <ScreenshotViewModal
          visible={screenshotModalVisible}
          executionId={selectedExecution.execution_id}
          taskName={taskName}
          onClose={handleCloseScreenshotModal}
        />
      )}
    </div>
  );
};

export default ExecutionHistoryTab;
