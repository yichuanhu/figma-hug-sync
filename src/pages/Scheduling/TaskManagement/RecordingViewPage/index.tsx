import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Breadcrumb,
  Button,
  Toast,
  Row,
  Col,
  Space,
  Spin,
} from '@douyinfe/semi-ui';
import {
  IconDownloadStroked,
  IconRefresh,
  IconArrowLeft,
} from '@douyinfe/semi-icons';
import AppLayout from '@/components/layout/AppLayout';
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

// Mock 数据生成
const generateMockRecording = (executionId: string): LYRecordingInfoResponse => ({
  execution_id: executionId,
  file_id: 'file_' + Math.random().toString(36).substring(7),
  file_name: `task-exec-${executionId}.mp4`,
  duration: 180, // 3 分钟
  file_size: 52428800, // 50 MB
  status: 'READY',
  created_at: new Date().toISOString(),
  // 使用公共测试视频
  file_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
});

const generateMockLogs = (): LYExecutionLogResponse[] => {
  const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
  const sources = ['CLIENT', 'SERVER'] as const;
  const messages = [
    '正在初始化流程引擎...',
    '成功连接到数据库服务器',
    '开始执行步骤 1: 读取输入参数',
    '警告: 输入参数中存在空值，使用默认值替代',
    '错误: 无法连接到目标服务器，请检查网络设置',
    '步骤 2 执行完成，耗时 1.5 秒',
    '正在处理数据转换...',
    '数据验证通过',
    '写入输出结果到文件',
    '流程执行完成',
    '开始执行步骤 3: 数据处理',
    '警告: 发现重复数据，已自动去重',
    '错误: 文件写入失败，磁盘空间不足',
    '正在重试操作...',
    '操作成功完成',
  ];
  
  const startTime = new Date();
  startTime.setMinutes(startTime.getMinutes() - 3);
  
  return Array.from({ length: 50 }, (_, i) => {
    const logTime = new Date(startTime.getTime() + i * 3600); // 每条日志间隔约 3.6 秒
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
  const navigate = useNavigate();
  
  // 状态
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [recording, setRecording] = useState<LYRecordingInfoResponse | null>(null);
  const [logs, setLogs] = useState<LYExecutionLogResponse[]>([]);
  const [errorMarkers, setErrorMarkers] = useState<LYRecordingErrorMarker[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // 播放同步状态
  const [currentTime, setCurrentTime] = useState(0);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  
  // 录屏开始时间
  const recordingStartTime = useMemo(() => {
    return logs.length > 0 ? new Date(logs[0].log_time) : new Date();
  }, [logs]);
  
  // 加载数据
  const loadData = useCallback(async () => {
    if (!executionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Mock API 调用
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
  
  // 视频时间更新
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
    // 清除高亮状态（随播放自动同步）
    setHighlightedLogId(null);
  }, []);
  
  // 点击错误标记
  const handleMarkerClick = useCallback((marker: LYRecordingErrorMarker) => {
    setHighlightedLogId(marker.log_id);
  }, []);
  
  // 点击日志条目
  const handleLogClick = useCallback((log: LYExecutionLogResponse) => {
    // 计算日志相对时间并跳转
    const logTime = new Date(log.log_time).getTime();
    const startTime = recordingStartTime.getTime();
    const position = Math.max(0, (logTime - startTime) / 1000);
    
    setCurrentTime(position);
    setHighlightedLogId(log.log_id);
  }, [recordingStartTime]);
  
  // 导出录屏
  const handleExport = useCallback(async () => {
    if (!recording) return;
    
    setExporting(true);
    try {
      // Mock 导出
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // 模拟下载
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
  
  // 返回
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return (
    <AppLayout>
      <div className="recording-view-page">
        {/* 面包屑 */}
        <div className="recording-view-page-breadcrumb">
          <Breadcrumb>
            <Breadcrumb.Item href="/scheduling-center/task-execution/task-list">
              {t('sidebar.taskList')}
            </Breadcrumb.Item>
            <Breadcrumb.Item>{t('recording.title')}</Breadcrumb.Item>
          </Breadcrumb>
        </div>

        {/* 头部 */}
        <div className="recording-view-page-header">
          <Row type="flex" justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<IconArrowLeft />}
                  theme="borderless"
                  onClick={handleBack}
                />
                <Title heading={4} className="recording-view-page-title">
                  {t('recording.title')}
                </Title>
                {executionId && (
                  <Text type="tertiary">
                    {t('recording.executionId')}: {executionId.substring(0, 8)}...
                  </Text>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<IconRefresh />}
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

        {/* 主内容区 */}
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
              {/* 左侧：视频播放器 */}
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
              
              {/* 右侧：日志面板 */}
              <div className="recording-view-page-logs">
                <LogSyncPanel
                  logs={logs}
                  currentTime={currentTime}
                  highlightedLogId={highlightedLogId}
                  onLogClick={handleLogClick}
                  onRefresh={loadData}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default RecordingViewPage;
