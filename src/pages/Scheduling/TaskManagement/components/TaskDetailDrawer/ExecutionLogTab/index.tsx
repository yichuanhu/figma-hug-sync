import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Input,
  Button,
  Table,
  Tag,
  Modal,
  Toast,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconDownloadStroked,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
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

const { Text } = Typography;

interface ExecutionLogTabProps {
  executionId: string;
  executionStatus?: ExecutionStatus;
}

// 日志级别颜色配置
const logLevelConfig: Record<LogLevel, { color: 'grey' | 'blue' | 'orange' | 'red'; text: string }> = {
  DEBUG: { color: 'grey', text: 'DEBUG' },
  INFO: { color: 'blue', text: 'INFO' },
  WARN: { color: 'orange', text: 'WARN' },
  ERROR: { color: 'red', text: 'ERROR' },
};

// 日志消息截断阈值
const MESSAGE_TRUNCATE_LENGTH = 200;

// 自动刷新间隔（毫秒）
const AUTO_REFRESH_INTERVAL = 10000;

// Mock 数据生成
const generateMockLog = (index: number): LYExecutionLogResponse => {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const sources = ['CLIENT', 'SERVER'] as const;
  const messages = [
    '正在初始化流程引擎...',
    '成功连接到数据库服务器',
    '开始执行步骤 1: 读取输入参数',
    '警告: 输入参数中存在空值，使用默认值替代',
    '错误: 无法连接到目标服务器，请检查网络设置。错误代码: CONN_TIMEOUT，详细信息: 连接超时，目标地址: 192.168.1.100:8080，重试次数: 3，最后尝试时间: 2026-01-30 10:30:00',
    '步骤 2 执行完成，耗时 1.5 秒',
    '正在处理数据转换...',
    '数据验证通过',
    '写入输出结果到文件',
    '流程执行完成',
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

const ExecutionLogTab = ({ executionId, executionStatus = 'RUNNING' }: ExecutionLogTabProps) => {
  const { t } = useTranslation();
  
  // 状态
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
  const [tempLevelFilter, setTempLevelFilter] = useState<LogLevel[]>([]);
  const [tempDateRange, setTempDateRange] = useState<[Date, Date] | null>(null);
  const [exporting, setExporting] = useState(false);
  
  // 自动刷新定时器
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 加载日志数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock API 调用
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const mockLogs = Array.from({ length: 50 }, (_, i) => 
        generateMockLog(((queryParams.page || 1) - 1) * 50 + i)
      );
      
      // 应用关键字筛选
      let filteredLogs = mockLogs;
      if (queryParams.keyword) {
        filteredLogs = mockLogs.filter((log) =>
          log.log_message.toLowerCase().includes(queryParams.keyword!.toLowerCase())
        );
      }
      
      // 应用级别筛选
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
      
      // 首次加载时获取统计
      if (!summary) {
        setSummary(generateMockSummary());
      }
    } catch (error) {
      Toast.error(t('taskLog.loadError'));
    } finally {
      setLoading(false);
    }
  }, [queryParams, summary, t]);
  
  // 初始加载
  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // 自动刷新逻辑
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
  
  // 搜索防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, page: 1, keyword: value || undefined }));
      }, 500),
    []
  );
  
  // 分页信息
  const { range, list } = listResponse;
  const currentPage = queryParams.page || 1;
  const pageSize = queryParams.page_size || 50;
  const total = range?.total || 0;
  
  // 确认筛选
  const handleConfirmFilter = useCallback(() => {
    setQueryParams((prev) => ({
      ...prev,
      page: 1,
      log_level: tempLevelFilter.length === 1 ? tempLevelFilter[0] : undefined,
      start_time: tempDateRange?.[0]?.toISOString(),
      end_time: tempDateRange?.[1]?.toISOString(),
    }));
    setFilterVisible(false);
  }, [tempLevelFilter, tempDateRange]);
  
  // 重置筛选
  const handleResetFilter = useCallback(() => {
    setTempLevelFilter([]);
    setTempDateRange(null);
  }, []);
  
  // 导出日志
  const handleExport = useCallback(async () => {
    if (total === 0) {
      Toast.warning(t('taskLog.noLogsToExport'));
      return;
    }
    
    setExporting(true);
    try {
      // Mock 导出
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // 生成 CSV 内容
      const csvHeader = 'log_time,log_level,log_message,source\n';
      const csvContent = list.map((log) =>
        `"${log.log_time}","${log.log_level}","${log.log_message.replace(/"/g, '""')}","${log.source}"`
      ).join('\n');
      
      // 触发下载
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
  
  // 查看完整消息
  const showFullMessage = useCallback((log: LYExecutionLogResponse) => {
    Modal.info({
      title: t('taskLog.fullMessage'),
      content: (
        <div className="execution-log-tab-full-message">
          <div className="execution-log-tab-full-message-meta">
            <Tag color={logLevelConfig[log.log_level].color} type="light">
              {log.log_level}
            </Tag>
            <Text type="tertiary">{log.log_time.replace('T', ' ').substring(0, 19)}</Text>
          </div>
          <pre className="execution-log-tab-full-message-content">{log.log_message}</pre>
        </div>
      ),
      okText: t('common.close'),
      width: 640,
    });
  }, [t]);
  
  // 筛选按钮状态
  const hasActiveFilter = !!queryParams.log_level;
  const filterCount = queryParams.log_level ? 1 : 0;
  
  // 表格列定义
  const columns = [
    {
      title: t('taskLog.fields.logTime'),
      dataIndex: 'log_time',
      key: 'log_time',
      width: 120,
      render: (value: string) => {
        const dateTime = value.replace('T', ' ').substring(0, 19);
        const [date, time] = dateTime.split(' ');
        return (
          <div className="execution-log-tab-time-cell">
            <Text type="secondary" size="small">{date}</Text>
            <Text>{time}</Text>
          </div>
        );
      },
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
        const displayMessage = isLong
          ? message.substring(0, MESSAGE_TRUNCATE_LENGTH) + '...'
          : message;
        
        return (
          <div className="execution-log-tab-message-cell">
            <span className="execution-log-tab-message-text">{displayMessage}</span>
            {isLong && (
              <Button
                theme="borderless"
                size="small"
                type="tertiary"
                className="execution-log-tab-message-toggle"
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
  ];
  
  // 日期快捷选项
  const datePresets = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return [
      {
        text: t('taskLog.filter.datePresets.today'),
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      },
      {
        text: t('taskLog.filter.datePresets.lastHour'),
        start: new Date(now.getTime() - 60 * 60 * 1000),
        end: now,
      },
      {
        text: t('taskLog.filter.datePresets.last24Hours'),
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now,
      },
    ];
  }, [t]);

  // 筛选配置
  const filterSections = useMemo(() => [
    {
      key: 'dateRange',
      label: t('taskLog.filter.dateRange'),
      type: 'dateRange' as const,
      value: tempDateRange,
      onChange: (value: unknown) => setTempDateRange(value as [Date, Date] | null),
      datePresets,
    },
    {
      key: 'logLevel',
      label: t('taskLog.filter.logLevel'),
      type: 'checkbox' as const,
      options: [
        { label: 'DEBUG', value: 'DEBUG' },
        { label: 'INFO', value: 'INFO' },
        { label: 'WARN', value: 'WARN' },
        { label: 'ERROR', value: 'ERROR' },
      ],
      value: tempLevelFilter,
      onChange: (values: unknown) => setTempLevelFilter(values as LogLevel[]),
    },
  ], [t, tempLevelFilter, tempDateRange, datePresets]);

  return (
    <div className="execution-log-tab">
      {/* 统计信息 */}
      {summary && (
        <div className="execution-log-tab-stats">
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

      {/* 工具栏 */}
      <Row type="flex" justify="space-between" align="middle" className="execution-log-tab-toolbar">
        <Col>
          <Space>
            <Input
              prefix={<IconSearch />}
              placeholder={t('taskLog.searchPlaceholder')}
              onChange={handleSearch}
              showClear
              className="execution-log-tab-search-input"
            />
            <FilterPopover
              visible={filterVisible}
              onVisibleChange={setFilterVisible}
              sections={filterSections}
              onReset={handleResetFilter}
              onConfirm={handleConfirmFilter}
            />
          </Space>
        </Col>
        <Col>
          <Space>
            <Button
              icon={<IconRefresh />}
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

      {/* 表格 */}
      <div className="execution-log-tab-table">
        <Table
          size="middle"
          dataSource={list}
          rowKey="log_id"
          loading={loading}
          columns={columns}
          scroll={{ y: 'calc(100vh - 400px)' }}
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

export default ExecutionLogTab;
