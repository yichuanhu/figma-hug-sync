import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Tooltip,
  Slider,
  Typography,
  Spin,
} from '@douyinfe/semi-ui';
import {
  IconVolume1Stroked,
  IconVolume2Stroked,
} from '@douyinfe/semi-icons';
import { Play, Pause, Maximize2, Minimize2, RefreshCw } from 'lucide-react';
import type { LYRecordingInfoResponse, LYRecordingErrorMarker } from '@/api';
import './index.less';

const { Text } = Typography;

interface SyncRecordingPlayerProps {
  recording: LYRecordingInfoResponse | null;
  errorMarkers: LYRecordingErrorMarker[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onMarkerClick: (marker: LYRecordingErrorMarker) => void;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

// 格式化时间为 mm:ss 或 hh:mm:ss
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const SyncRecordingPlayer = ({
  recording,
  errorMarkers,
  currentTime,
  onTimeUpdate,
  onMarkerClick,
  loading = false,
  error = null,
  onRefresh,
}: SyncRecordingPlayerProps) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  
  const duration = recording?.duration || 0;
  
  // 视频事件处理
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  }, [onTimeUpdate]);
  
  const handleLoadedMetadata = useCallback(() => {
    setVideoReady(true);
    setVideoError(null);
  }, []);
  
  const handleError = useCallback(() => {
    setVideoError(t('recording.player.loadError'));
    setVideoReady(false);
  }, [t]);
  
  const handleProgress = useCallback(() => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / duration) * 100);
    }
  }, [duration]);
  
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  // 播放控制
  const togglePlay = useCallback(() => {
    if (!videoRef.current || !videoReady) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, videoReady]);
  
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);
  
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);
  
  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // 跳转到指定时间
  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  }, [onTimeUpdate]);
  
  // 进度条点击
  const handleSliderChange = useCallback((value: number | number[]) => {
    const time = Array.isArray(value) ? value[0] : value;
    seekTo(time);
  }, [seekTo]);
  
  // 错误标记点击
  const handleMarkerClick = useCallback((marker: LYRecordingErrorMarker) => {
    seekTo(marker.position);
    onMarkerClick(marker);
  }, [seekTo, onMarkerClick]);
  
  // 计算错误标记位置
  const markerPositions = useMemo(() => {
    if (duration <= 0) return [];
    return errorMarkers.map((marker) => ({
      ...marker,
      percent: (marker.position / duration) * 100,
    }));
  }, [errorMarkers, duration]);
  
  // 渲染加载状态
  if (loading) {
    return (
      <div className="sync-recording-player">
        <div className="sync-recording-player-loading">
          <Spin size="large" />
          <Text type="tertiary">{t('recording.player.loading')}</Text>
        </div>
      </div>
    );
  }
  
  // 渲染错误状态
  if (error || !recording) {
    return (
      <div className="sync-recording-player">
        <div className="sync-recording-player-error">
          <Text type="danger">{error || t('recording.player.noRecording')}</Text>
          {onRefresh && (
            <Button
              icon={<RefreshCw size={16} strokeWidth={2} />}
              onClick={onRefresh}
              style={{ marginTop: 16 }}
            >
              {t('common.retry')}
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref={containerRef} 
      className={`sync-recording-player ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* 视频区域 */}
      <div className="sync-recording-player-video-container">
        <video
          ref={videoRef}
          src={recording.file_url || undefined}
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onError={handleError}
          onProgress={handleProgress}
          onEnded={handleEnded}
          className="sync-recording-player-video"
        />
        
        {/* 视频加载错误 */}
        {videoError && (
          <div className="sync-recording-player-video-error">
            <Text type="danger">{videoError}</Text>
            {onRefresh && (
              <Button
                icon={<RefreshCw size={14} strokeWidth={2} />}
                size="small"
                onClick={onRefresh}
                style={{ marginTop: 8 }}
              >
                {t('recording.player.refresh')}
              </Button>
            )}
          </div>
        )}
        
        {/* 播放按钮覆盖层 */}
        {!isPlaying && videoReady && (
          <div 
            className="sync-recording-player-play-overlay"
            onClick={togglePlay}
          >
            <div className="sync-recording-player-play-button">
              <Play size={36} strokeWidth={2} />
            </div>
          </div>
        )}
      </div>
      
      {/* 控制栏 */}
      <div className="sync-recording-player-controls">
        {/* 播放/暂停按钮 */}
        <Button
          icon={isPlaying ? <IconPause /> : <IconPlay />}
          theme="borderless"
          size="small"
          disabled={!videoReady}
          onClick={togglePlay}
        />
        
        {/* 当前时间 */}
        <Text className="sync-recording-player-time">
          {formatTime(currentTime)}
        </Text>
        
        {/* 进度条区域 */}
        <div className="sync-recording-player-progress">
          <div className="sync-recording-player-progress-bar">
            {/* 缓冲进度 */}
            <div 
              className="sync-recording-player-progress-buffered"
              style={{ width: `${buffered}%` }}
            />
            
            {/* 滑块 */}
            <Slider
              value={currentTime}
              min={0}
              max={duration || 100}
              step={0.1}
              onChange={handleSliderChange}
              disabled={!videoReady}
              className="sync-recording-player-slider"
            />
            
            {/* 错误标记 */}
            {markerPositions.map((marker) => (
              <Tooltip
                key={marker.log_id}
                content={
                  <div className="sync-recording-player-marker-tooltip">
                    <Text size="small">{formatTime(marker.position)}</Text>
                    <Text size="small" type="danger" ellipsis={{ showTooltip: false }}>
                      {marker.message.substring(0, 50)}
                      {marker.message.length > 50 ? '...' : ''}
                    </Text>
                  </div>
                }
                position="top"
              >
                <div
                  className="sync-recording-player-error-marker"
                  style={{ left: `${marker.percent}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkerClick(marker);
                  }}
                />
              </Tooltip>
            ))}
          </div>
        </div>
        
        {/* 总时长 */}
        <Text className="sync-recording-player-time">
          {formatTime(duration)}
        </Text>
        
        {/* 静音按钮 */}
        <Button
          icon={isMuted ? <IconVolume1Stroked /> : <IconVolume2Stroked />}
          theme="borderless"
          size="small"
          onClick={toggleMute}
        />
        
        {/* 全屏按钮 */}
        <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
          <Button
            icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
            theme="borderless"
            size="small"
            onClick={toggleFullscreen}
          />
        </Tooltip>
      </div>
      
      {/* 录屏信息 */}
      <div className="sync-recording-player-info">
        <Text size="small" type="tertiary">
          {t('recording.player.fileInfo', { 
            size: (recording.file_size / (1024 * 1024)).toFixed(2),
            duration: formatTime(recording.duration),
          })}
        </Text>
      </div>
    </div>
  );
};

export default SyncRecordingPlayer;
