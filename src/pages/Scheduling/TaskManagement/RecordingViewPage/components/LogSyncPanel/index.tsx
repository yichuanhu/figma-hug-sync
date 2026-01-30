import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Tag,
  Input,
  Button,
  Empty,
  Spin,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { LYExecutionLogResponse, LogLevel } from '@/api';
import './index.less';

const { Text } = Typography;

interface LogSyncPanelProps {
  logs: LYExecutionLogResponse[];
  currentTime: number;
  highlightedLogId: string | null;
  onLogClick: (log: LYExecutionLogResponse) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

// 日志级别颜色配置
const logLevelConfig: Record<LogLevel, { color: 'grey' | 'blue' | 'orange' | 'red' }> = {
  DEBUG: { color: 'grey' },
  INFO: { color: 'blue' },
  WARN: { color: 'orange' },
  ERROR: { color: 'red' },
};

// 格式化时间戳
const formatTimestamp = (isoString: string): string => {
  return isoString.replace('T', ' ').substring(11, 19);
};

// 解析日志时间为秒数（相对于录屏开始时间）
const parseLogTimeToSeconds = (logTime: string, startTime: string): number => {
  const logDate = new Date(logTime).getTime();
  const startDate = new Date(startTime).getTime();
  return Math.max(0, (logDate - startDate) / 1000);
};

const LogSyncPanel = ({
  logs,
  currentTime,
  highlightedLogId,
  onLogClick,
  loading = false,
  onRefresh,
}: LogSyncPanelProps) => {
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<LYExecutionLogResponse[]>(logs);
  
  // 录屏开始时间（取第一条日志的时间）
  const startTime = useMemo(() => {
    return logs.length > 0 ? logs[0].log_time : new Date().toISOString();
  }, [logs]);
  
  // 搜索过滤
  const handleSearch = useMemo(
    () =>
      debounce((keyword: string) => {
        if (!keyword.trim()) {
          setFilteredLogs(logs);
        } else {
          const lowerKeyword = keyword.toLowerCase();
          setFilteredLogs(
            logs.filter((log) =>
              log.log_message.toLowerCase().includes(lowerKeyword) ||
              log.log_level.toLowerCase().includes(lowerKeyword)
            )
          );
        }
      }, 300),
    [logs]
  );
  
  useEffect(() => {
    handleSearch(searchKeyword);
  }, [logs, searchKeyword, handleSearch]);
  
  // 根据当前播放时间找到最近的日志
  const currentLogIndex = useMemo(() => {
    if (filteredLogs.length === 0) return -1;
    
    for (let i = filteredLogs.length - 1; i >= 0; i--) {
      const logSeconds = parseLogTimeToSeconds(filteredLogs[i].log_time, startTime);
      if (logSeconds <= currentTime) {
        return i;
      }
    }
    return 0;
  }, [filteredLogs, currentTime, startTime]);
  
  // 自动滚动到当前日志
  useEffect(() => {
    if (listRef.current && currentLogIndex >= 0 && !highlightedLogId) {
      const logItems = listRef.current.querySelectorAll('.log-sync-panel-item');
      const targetItem = logItems[currentLogIndex] as HTMLElement;
      
      if (targetItem) {
        targetItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentLogIndex, highlightedLogId]);
  
  // 滚动到高亮的日志
  useEffect(() => {
    if (listRef.current && highlightedLogId) {
      const targetItem = listRef.current.querySelector(
        `[data-log-id="${highlightedLogId}"]`
      ) as HTMLElement;
      
      if (targetItem) {
        targetItem.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [highlightedLogId]);
  
  const handleLogItemClick = useCallback((log: LYExecutionLogResponse) => {
    onLogClick(log);
  }, [onLogClick]);
  
  return (
    <div className="log-sync-panel">
      {/* 工具栏 */}
      <div className="log-sync-panel-toolbar">
        <Input
          prefix={<IconSearch />}
          placeholder={t('recording.logPanel.searchPlaceholder')}
          value={searchKeyword}
          onChange={setSearchKeyword}
          showClear
          className="log-sync-panel-search"
        />
        {onRefresh && (
          <Button
            icon={<IconRefresh />}
            theme="borderless"
            size="small"
            onClick={onRefresh}
            loading={loading}
          />
        )}
      </div>
      
      {/* 日志列表 */}
      <div ref={listRef} className="log-sync-panel-list">
        {loading ? (
          <div className="log-sync-panel-loading">
            <Spin />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="log-sync-panel-empty">
            <Empty
              description={
                searchKeyword
                  ? t('recording.logPanel.noMatch')
                  : t('recording.logPanel.noLogs')
              }
            />
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isHighlighted = log.log_id === highlightedLogId;
            const isCurrent = index === currentLogIndex && !highlightedLogId;
            const logSeconds = parseLogTimeToSeconds(log.log_time, startTime);
            const isPast = logSeconds <= currentTime;
            
            return (
              <div
                key={log.log_id}
                data-log-id={log.log_id}
                className={`log-sync-panel-item ${isHighlighted ? 'highlighted' : ''} ${isCurrent ? 'current' : ''} ${isPast ? 'past' : 'future'}`}
                onClick={() => handleLogItemClick(log)}
              >
                <div className="log-sync-panel-item-header">
                  <Text size="small" type="tertiary" className="log-sync-panel-item-time">
                    {formatTimestamp(log.log_time)}
                  </Text>
                  <Tag
                    color={logLevelConfig[log.log_level]?.color || 'grey'}
                    type="light"
                    size="small"
                  >
                    {log.log_level}
                  </Tag>
                </div>
                <div className="log-sync-panel-item-message">
                  <Text
                    size="small"
                    type={log.log_level === 'ERROR' ? 'danger' : undefined}
                  >
                    {log.log_message}
                  </Text>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* 统计信息 */}
      <div className="log-sync-panel-footer">
        <Text size="small" type="tertiary">
          {t('recording.logPanel.total', { count: filteredLogs.length })}
        </Text>
      </div>
    </div>
  );
};

export default LogSyncPanel;
