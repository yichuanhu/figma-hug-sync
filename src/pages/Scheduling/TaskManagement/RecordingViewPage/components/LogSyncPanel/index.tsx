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
import { RefreshCw, Search } from 'lucide-react';
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

// Log level颜色Config
const logLevelConfig: Record<LogLevel, { color: 'grey' | 'blue' | 'orange' | 'red' }> = {
  DEBUG: { color: 'grey' },
  INFO: { color: 'blue' },
  WARN: { color: 'orange' },
  ERROR: { color: 'red' },
};

// Format化Time戳
const formatTimestamp = (isoString: string): string => {
  return isoString.replace('T', ' ').substring(11, 19);
};

// 解析LogTimeass数(相forfor 录屏StartTime)
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
  
  // 录屏StartTime(取第MonLog's Time)
  const startTime = useMemo(() => {
    return logs.length > 0 ? logs[0].log_time : new Date().toISOString();
  }, [logs]);
  
  // Search过滤
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
  
  // 根据当前PlayTime找to最近's Log
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
  
  // auto-滚动to当前Log
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
  
  // 滚动to高亮's Log
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
      {/* Toolbar */}
      <div className="log-sync-panel-toolbar">
        <Input
          prefix={<Search size={16} strokeWidth={2} />}
          placeholder={t('recording.logPanel.searchPlaceholder')}
          value={searchKeyword}
          onChange={setSearchKeyword}
          showClear
          className="log-sync-panel-search"
        />
        {onRefresh && (
          <Button
            icon={<RefreshCw size={14} strokeWidth={2} />}
            theme="borderless"
            size="small"
            onClick={onRefresh}
            loading={loading}
          />
        )}
      </div>
      
      {/* Log list */}
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
            const isActive = isCurrent || isHighlighted;
            const activeLevelClass = isActive ? `active-${log.log_level.toLowerCase()}` : '';
            
            return (
              <div
                key={log.log_id}
                data-log-id={log.log_id}
                className={`log-sync-panel-item ${activeLevelClass} ${isPast ? 'past' : 'future'}`}
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
      
      {/* Statistics */}
      <div className="log-sync-panel-footer">
        <Text size="small" type="tertiary">
          {t('recording.logPanel.total', { count: filteredLogs.length })}
        </Text>
      </div>
    </div>
  );
};

export default LogSyncPanel;
