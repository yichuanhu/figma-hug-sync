import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Typography,
  Button,
  Toast,
  Row,
  Col,
  Space,
  Spin,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconDownloadStroked,
  IconChevronLeft,
} from '@douyinfe/semi-icons';
import { RefreshCw } from 'lucide-react';
// AppLayout removed
import SyncRecordingPlayer from './components/SyncRecordingPlayer';
import LogSyncPanel from './components/LogSyncPanel';
import type {
  LYRecordingInfoResponse,
  LYRecordingErrorMarker,
  LYExecutionLogResponse,
  LogLevel,
} from '@/api';
import './index.less';

const { Title, Text } = Typography;

// Mock Datageneration
const generateMockRecording = (executionId: string): LYRecordingInfoResponse => ({
  execution_id: executionId,
  file_id: 'file_' + Math.random().toString(36).substring(7),
  file_name: `task-exec-${executionId}.mp4`,
  duration: 180, // 3 min
  file_size: 52428800, // 50 MB
  status: 'READY',
  created_at: new Date().toISOString(),
  // using公共测试Video
  file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
});

const generateMockLogs = (): LYExecutionLogResponse[] => {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const sources = ['CLIENT', 'SERVER'] as const;
  const messages = [
    'Initializing process engine...',
    'Successfully connected to database server',
    'Starting step 1: Reading input parameters',
    'Warning: Input parameters contains null values, using defaults',
    'Error: Unable to connect to target server, check network settings',
    'Step 2 Execution completed, duration 1.5 s',
    'Processing data transformation...',
    'Data validation passed',
    'Writing output result to file',
    'Process execution completed',
    'StartExecuteStep 3: Dataprocessing',
    'Warning: Found duplicate data, auto-deduplicated',
    'Error: File write failed, insufficient disk space',
    'Retrying operation...',
    'OperationSuccessDone',
  ];
  
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - 3);
  
  return Array.from({ length: 50 }, (_, i) => {
    const logTime = new Date(startTime.getTime() + i * 3600); // Log interval approx 3.6 s
    const levelIndex = i % 10 < 1 ? 3 : i % 10 < 3 ? 2 : i % 10 < 5 ? 0 : 1;
    
    return {
      log_id: `log-${i}`,
      log_time: logTime.toISOString(),
      log_level: levels[levelIndex],
      log_message: messages[i % messages.length] + ` (${i + 1})`,
      source: sources[i % 2],
    };
  });
};

const generateMockErrorMarkers = (logs: LYExecutionLogResponse[], startTime: Date): LYRecordingErrorMarker[] => {
  return logs
    .filter((log) => log.log_level === 'ERROR')
    .map((log) => ({
      log_id: log.log_id,
      timestamp: log.log_time,
      position: Math.max(0, (new Date(log.log_time).getTime() - startTime.getTime()) / 1000),
      message: log.log_message,
    }));
};

const RecordingViewPage = () => {
  const { t } = useTranslation();
  const { executionId } = useParams<{ executionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // 获取源task ID  and  activeTab
  const taskIdFromUrl = searchParams.get('taskId');
  const activeTabFromUrl = searchParams.get('activeTab');
  
  // Status
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recording, setRecording] = useState<LYRecordingInfoResponse | null>(null);
  const [logs, setLogs] = useState<LYExecutionLogResponse[]>([]);
  const [errorMarkers, setErrorMarkers] = useState<LYRecordingErrorMarker[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Play同步Status
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  
  // 录屏StartTime
  const recordingStartTime = useMemo(() => {
    return logs.length > 0 ? new Date(logs[0].log_time) : new Date();
  }, [logs]);
  
  // LoadingData
  const loadData = useCallback(async () => {
    if (!executionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock API 调use
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      const mockRecording = generateMockRecording(executionId);
      const mockLogs = generateMockLogs();
      const startTime = new Date(mockLogs[0].log_time);
      const mockMarkers = generateMockErrorMarkers(mockLogs, startTime);
      
      setRecording(mockRecording);
      setLogs(mockLogs);
      setErrorMarkers(mockMarkers);
    } catch (err) {
      setError(t('recording.loadError'));
    } finally {
      setLoading(false);
    }
  }, [executionId, t]);
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 仅RefreshLogData
  const loadLogsOnly = useCallback(async () => {
    if (!executionId) return;
    
    setLogsLoading(true);
    try {
      // Mock API 调use - 仅LoadingLog
      await new Promise((resolve) => setTimeout(resolve, 400));
      const mockLogs = generateMockLogs();
      const startTime = new Date(mockLogs[0].log_time);
      const mockMarkers = generateMockErrorMarkers(mockLogs, startTime);
      
      setLogs(mockLogs);
      setErrorMarkers(mockMarkers);
    } finally {
      setLogsLoading(false);
    }
  }, [executionId]);
  
  // VideoTimeUpdate
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    // 清除高亮Status(随Playauto-同步)
    setHighlightedLogId(null);
  }, []);
  
  // 点击Error markers
  const handleMarkerClick = useCallback((marker: LYRecordingErrorMarker) => {
    setHighlightedLogId(marker.log_id);
  }, []);
  
  // 点击Log目
  const handleLogClick = useCallback((log: LYExecutionLogResponse) => {
    // calculationLog相forTime并跳转
    const logTime = new Date(log.log_time).getTime();
    const startTime = recordingStartTime.getTime();
    const position = Math.max(0, (logTime - startTime) / 1000);
    
    setCurrentTime(position);
    setHighlightedLogId(log.log_id);
  }, [recordingStartTime]);
  
  // Export录屏
  const handleExport = useCallback(async () => {
    if (!recording) return;
    
    setExporting(true);
    try {
      // Mock Export
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // 模拟Download
      const link = document.createElement('a');
      link.href = recording.file_url || '';
      link.download = recording.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      Toast.success(t('recording.exportSuccess'));
    } catch (err) {
      Toast.error(t('recording.exportError'));
    } finally {
      setExporting(false);
    }
  }, [recording, t]);
  
  // Back
  const handleBack = useCallback(() => {
    if (taskIdFromUrl) {
      // BacktotaskList并openfor应task's Details drawer, also传递 activeTab Parameter
      const params = new URLSearchParams();
      params.set('taskId', taskIdFromUrl);
      if (activeTabFromUrl) {
        params.set('activeTab', activeTabFromUrl);
      }
      navigate(`/scheduling-center/task-execution/task-list?${params.toString()}`);
    } else {
      navigate(-1);
    }
  }, [navigate, taskIdFromUrl, activeTabFromUrl]);
  
  return (
      <div className="recording-view-page">

        {/* Header */}
        <div className="recording-view-page-header">
          <Row type="flex" justify="space-between" align="middle">
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tooltip content={t('common.back')} position="bottom">
                  <Button
                    icon={<IconChevronLeft />}
                    theme="borderless"
                    onClick={handleBack}
                  />
                </Tooltip>
                <Title heading={3} className="recording-view-page-title">
                  {t('recording.title')}
                </Title>
                {executionId && (
                  <Text type="tertiary">
                    {t('recording.executionId')}: {executionId.substring(0, 8)}...
                  </Text>
                )}
              </div>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<RefreshCw size={16} strokeWidth={2} />}
                  onClick={loadData}
                  loading={loading}
                >
                  {t('common.refresh')}
                </Button>
                <Button
                  icon={<IconDownloadStroked />}
                  type="primary"
                  onClick={handleExport}
                  loading={exporting}
                  disabled={!recording || recording.status !== 'READY'}
                >
                  {t('recording.export')}
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Main content area */}
        <div className="recording-view-page-content">
          {loading ? (
            <div className="recording-view-page-loading">
              <Spin size="large" />
              <Text type="tertiary">{t('recording.loading')}</Text>
            </div>
          ) : error ? (
            <div className="recording-view-page-error">
              <Text type="danger">{error}</Text>
              <Button onClick={loadData} style={{ marginTop: 16 }}>
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <div className="recording-view-page-sync-container">
              {/* Left: Video player */}
              <div className="recording-view-page-player">
                <SyncRecordingPlayer
                  recording={recording}
                  errorMarkers={errorMarkers}
                  currentTime={currentTime}
                  onTimeUpdate={handleTimeUpdate}
                  onMarkerClick={handleMarkerClick}
                  onRefresh={loadData}
                />
              </div>
              
              {/* Right: Log panel */}
              <div className="recording-view-page-logs">
                <LogSyncPanel
                  logs={logs}
                  currentTime={currentTime}
                  highlightedLogId={highlightedLogId}
                  onLogClick={handleLogClick}
                  onRefresh={loadLogsOnly}
                  loading={logsLoading}
                />
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default RecordingViewPage;
