import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Input,
  Button,
  Table,
  Tag,
  Tooltip,
  Modal,
  Toast,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconSearchStroked,
  IconDownloadStroked,
  IconChevronDown,
  IconChevronUp,
} from '@douyinfe/semi-icons';
import { RefreshCw } from 'lucide-react';
import { debounce } from 'lodash';
// AppLayout removed
import FilterPopover from '@/components/FilterPopover';
import EmptyState from '@/components/EmptyState';
import type {
  LYExecutionLogResponse,
  LYLogSummaryResponse,
  LYListResponseLYExecutionLogResponse,
  GetExecutionLogsParams,
  LogLevel,
  ExecutionStatus,
} from '@/api';
import './index.less';

const { Title, Text } = Typography;

// Log level颜色Config
const logLevelConfig: Record<LogLevel, { color: 'grey' | 'blue' | 'orange' | 'red'; text: string }> = {
  DEBUG: { color: 'grey', text: 'DEBUG' },
  INFO: { color: 'blue', text: 'INFO' },
  WARN: { color: 'orange', text: 'WARN' },
  ERROR: { color: 'red', text: 'ERROR' },
};

// Sun志Message截断阈值
const MESSAGE_TRUNCATE_LENGTH = 200;

// 自动Refresh间隔（毫s）
const AUTO_REFRESH_INTERVAL = 10000;

// Mock Datageneration
const generateMockLog = (index: number): LYExecutionLogResponse => {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const sources = ['CLIENT', 'SERVER'] as const;
  const messages = [
    'Initializing process engine...',
    'Successfully connected to database server',
    'Starting step 1: Reading input parameters',
    'Warning: Input parameters contains null values, using defaults',
    'Error: Unable to connect to target server, check network settings。Error code: CONN_TIMEOUT，Details: Connection timeout，Target address: 192.168.1.100:8080，Retry count: 3，Last attempt time: 2026-01-30 10:30:00',
    'Step 2 Execution completed, duration 1.5 s',
    'Processing data transformation...',
    'Data validation passed',
    '写入输出Result到File',
    'Process execution completed',
  ];
  const levelIndex = index % 10 < 1 ? 3 : index % 10 < 3 ? 2 : index % 10 < 5 ? 0 : 1;
  const now = new Date();
  now.setSeconds(now.getSeconds() - index * 2);
  
  return {
    log_id: `log-${Date.now()}-${index}`,
    log_time: now.toISOString(),
    log_level: levels[levelIndex],
    log_message: messages[index % messages.length],
    source: sources[index % 2],
  };
};

const generateMockSummary = (): LYLogSummaryResponse => ({
  total: 1234,
  debug_count: 800,
  info_count: 300,
  warn_count: 100,
  error_count: 34,
});

const TaskLogPage = () => {
  const { t } = useTranslation();
  const { executionId } = useParams<{ executionId: string }>();
  const navigate = useNavigate();
  
  // Status
  const [loading, setLoading] = useState(false);
  const [listResponse, setListResponse] = useState<LYListResponseLYExecutionLogResponse>({
    range: { offset: 0, size: 50, total: 0 },
    list: [],
  });
  const [summary, setSummary] = useState<LYLogSummaryResponse | null>(null);
  const [queryParams, setQueryParams] = useState<GetExecutionLogsParams>({
    page: 1,
    page_size: 50,
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LogLevel[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // 模拟ExecuteStatus（实际应从 API 获取）
  const [executionStatus] = useState<ExecutionStatus>('RUNNING');
  
  // 自动RefreshScheduled器
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // LoadingSun志Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockLogs = Array.from({ length: 50 }, (_, i) => 
        generateMockLog(((queryParams.page || 1) - 1) * 50 + i)
      );
      
      // 应用关键字Filter
      let filteredLogs = mockLogs;
      if (queryParams.keyword) {
        filteredLogs = mockLogs.filter((log) =>
          log.log_message.toLowerCase().includes(queryParams.keyword!.toLowerCase())
        );
      }
      
      // 应用级别Filter
      if (queryParams.log_level) {
        filteredLogs = filteredLogs.filter((log) => log.log_level === queryParams.log_level);
      }
      
      setListResponse({
        range: {
          offset: ((queryParams.page || 1) - 1) * (queryParams.page_size || 50),
          size: queryParams.page_size || 50,
          total: 1234,
        },
        list: filteredLogs,
      });
      
      // 首次Loading时获取Statistics
      if (!summary) {
        setSummary(generateMockSummary());
      }
    } catch (error) {
      Toast.error(t('taskLog.loadError'));
    } finally {
      setLoading(false);
    }
  }, [queryParams, summary, t]);
  
  // 初始Loading
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // 自动Refresh逻辑
  useEffect(() => {
    if (executionStatus === 'RUNNING') {
      refreshTimerRef.current = setInterval(() => {
        loadData();
      }, AUTO_REFRESH_INTERVAL);
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [executionStatus, loadData]);
  
  // Search防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, page: 1, keyword: value || undefined }));
      }, 500),
    []
  );
  
  // 分页Info
  const { range, list } = listResponse;
  const currentPage = queryParams.page || 1;
  const pageSize = queryParams.page_size || 50;
  const total = range?.total || 0;
  
  // ConfirmFilter
  const handleConfirmFilter = useCallback((values: Record<string, unknown>) => {
    const newLevelFilter = (values.logLevel as LogLevel[]) || [];
    setLevelFilter(newLevelFilter);
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      log_level: newLevelFilter.length === 1 ? newLevelFilter[0] : undefined,
    }));
  }, []);
  
  // ExportSun志
  const handleExport = useCallback(async () => {
    if (total === 0) {
      Toast.warning(t('taskLog.noLogsToExport'));
      return;
    }
    
    setExporting(true);
    try {
      // Mock Export
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // generation CSV Content
      const csvHeader = 'log_time,log_level,log_message,source\n';
      const csvContent = list.map((log) =>
        `"${log.log_time}","${log.log_level}","${log.log_message.replace(/"/g, '""')}","${log.source}"`
      ).join('\n');
      
      // TriggerDownload
      const blob = new Blob(['\ufeff' + csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${executionId || 'logs'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      Toast.success(t('taskLog.exportSuccess'));
    } catch (error) {
      Toast.error(t('taskLog.exportError'));
    } finally {
      setExporting(false);
    }
  }, [executionId, list, total, t]);
  
  // 展开/收起Message
  const toggleExpand = useCallback((logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  }, []);
  
  // View完整Message
  const showFullMessage = useCallback((log: LYExecutionLogResponse) => {
    Modal.info({
      title: t('taskLog.fullMessage'),
      content: (
        <div className="task-log-page-full-message">
          <div className="task-log-page-full-message-meta">
            <Tag color={logLevelConfig[log.log_level].color} type="light">
              {log.log_level}
            </Tag>
            <Text type="tertiary">{log.log_time.replace('T', ' ').substring(0, 19)}</Text>
          </div>
          <pre className="task-log-page-full-message-content">{log.log_message}</pre>
        </div>
      ),
      okText: t('common.close'),
      width: 640,
    });
  }, [t]);
  
  // Filter按钮Status
  const hasActiveFilter = !!queryParams.log_level;
  const filterCount = queryParams.log_level ? 1 : 0;
  
  // 表格列定义
  const columns = [
    {
      title: t('taskLog.fields.logTime'),
      dataIndex: 'log_time',
      key: 'log_time',
      width: 180,
      render: (value: string) => value.replace('T', ' ').substring(0, 19),
    },
    {
      title: t('taskLog.fields.logLevel'),
      dataIndex: 'log_level',
      key: 'log_level',
      width: 100,
      render: (level: LogLevel) => (
        <Tag color={logLevelConfig[level].color} type="light">
          {level}
        </Tag>
      ),
    },
    {
      title: t('taskLog.fields.logMessage'),
      dataIndex: 'log_message',
      key: 'log_message',
      render: (message: string, record: LYExecutionLogResponse) => {
        const isLong = message.length > MESSAGE_TRUNCATE_LENGTH;
        const isExpanded = expandedLogId === record.log_id;
        const displayMessage = isLong && !isExpanded
          ? message.substring(0, MESSAGE_TRUNCATE_LENGTH) + '...'
          : message;
        
        return (
          <div className="task-log-page-message-cell">
            <span className="task-log-page-message-text">{displayMessage}</span>
            {isLong && (
              <Button
                theme="borderless"
                size="small"
                type="tertiary"
                className="task-log-page-message-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  showFullMessage(record);
                }}
              >
                {t('taskLog.viewFull')}
              </Button>
            )}
          </div>
        );
      },
    },
    {
      title: t('taskLog.fields.source'),
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => (
        <Tag type="ghost">{source}</Tag>
      ),
    },
  ];
  
  // filterContent removed - using FilterPopover directly

  return (
      <div className="task-log-page">

        {/* Header */}
        <div className="task-log-page-header">
          <div className="task-log-page-header-title">
            <Title heading={4}>{t('taskLog.title')}</Title>
            {executionStatus === 'RUNNING' && (
              <Tag color="blue" type="light" className="task-log-page-header-status">
                {t('taskLog.autoRefresh')}
              </Tag>
            )}
          </div>

          {/* Statistics */}
          {summary && (
            <div className="task-log-page-stats">
              <Space spacing={16}>
                <Text>{t('taskLog.stats.total')}: <Text strong>{summary.total.toLocaleString()}</Text></Text>
                <Text type="tertiary">|</Text>
                <Text>
                  <Tag color="grey" type="ghost" size="small">DEBUG</Tag>
                  <Text style={{ marginLeft: 4 }}>{summary.debug_count.toLocaleString()}</Text>
                </Text>
                <Text>
                  <Tag color="blue" type="ghost" size="small">INFO</Tag>
                  <Text style={{ marginLeft: 4 }}>{summary.info_count.toLocaleString()}</Text>
                </Text>
                <Text>
                  <Tag color="orange" type="ghost" size="small">WARN</Tag>
                  <Text style={{ marginLeft: 4 }}>{summary.warn_count.toLocaleString()}</Text>
                </Text>
                <Text>
                  <Tag color="red" type="ghost" size="small">ERROR</Tag>
                  <Text style={{ marginLeft: 4 }}>{summary.error_count.toLocaleString()}</Text>
                </Text>
              </Space>
            </div>
          )}

          {/* Toolbar */}
          <Row type="flex" justify="space-between" align="middle" className="task-log-page-header-toolbar">
            <Col>
              <Space>
                <Input
                  prefix={<IconSearchStroked />}
                  placeholder={t('taskLog.searchPlaceholder')}
                  onChange={handleSearch}
                  showClear
                  className="task-log-page-search-input"
                />
                <FilterPopover
                  visible={filterVisible}
                  onVisibleChange={setFilterVisible}
                  onConfirm={handleConfirmFilter}
                  sections={[
                    {
                      key: 'logLevel',
                      label: t('taskLog.filter.logLevel'),
                      type: 'checkbox',
                      options: [
                        { label: 'DEBUG', value: 'DEBUG' },
                        { label: 'INFO', value: 'INFO' },
                        { label: 'WARN', value: 'WARN' },
                        { label: 'ERROR', value: 'ERROR' },
                      ],
                      value: levelFilter,
                    },
                  ]}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<RefreshCw size={16} strokeWidth={2} />}
                  onClick={loadData}
                  loading={loading}
                >
                  {t('taskLog.refresh')}
                </Button>
                <Button
                   icon={<IconDownloadStroked />}
                  onClick={handleExport}
                  loading={exporting}
                  disabled={total === 0}
                >
                  {t('taskLog.export')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <div className="task-log-page-table">
          <Table
            size="small"
            dataSource={list}
            rowKey="log_id"
            loading={loading}
            columns={columns}
            scroll={{ y: 'calc(100vh - 380px)' }}
            empty={
              <EmptyState
                variant={queryParams.keyword ? 'noResult' : 'noData'}
                description={
                  queryParams.keyword
                    ? t('taskLog.noLogsMatch', { keyword: queryParams.keyword })
                    : t('taskLog.noLogs')
                }
              />
            }
            pagination={{
              total,
              pageSize,
              currentPage,
              showSizeChanger: true,
              showTotal: true,
              pageSizeOpts: [20, 50, 100, 200],
              onPageChange: (page) => {
                setQueryParams((prev) => ({ ...prev, page }));
              },
              onPageSizeChange: (size) => {
                setQueryParams((prev) => ({ ...prev, page: 1, page_size: size }));
              },
            }}
          />
        </div>
      </div>
  );
};

export default TaskLogPage;
