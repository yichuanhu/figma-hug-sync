import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SideSheet, Typography, Button, Tag, Descriptions, Switch, Tooltip, Divider, Row, Col, Space } from '@douyinfe/semi-ui';
import { IconEditStroked, IconDeleteStroked, IconMaximize, IconMinimize, IconClose, IconKeyStroked, IconChevronDown, IconChevronUp, IconChevronLeft, IconChevronRight, IconUserListStroked, IconMinusCircleStroked } from '@douyinfe/semi-icons';
import type { LYWorkerResponse } from '@/api';
import './index.less';

const { Title, Text } = Typography;

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

interface WorkerDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  workerData: LYWorkerResponse | null;
  onEdit?: () => void;
  onViewKey?: () => void;
  onDelete?: () => void;
  onToggleReceiveTasks?: (worker: LYWorkerResponse, checked: boolean) => void;
  onAddToGroup?: (worker: LYWorkerResponse) => void;
  onRemoveFromGroup?: (worker: LYWorkerResponse) => void;
  // 导航相关
  dataList?: LYWorkerResponse[];
  onNavigate?: (worker: LYWorkerResponse) => void;
  // 分页相关 - 用于自动翻页
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => Promise<LYWorkerResponse[] | void>;
}

// 描述展开收起的阈值（字符数）
const DESCRIPTION_COLLAPSE_THRESHOLD = 100;

const WorkerDetailDrawer = ({ visible, onClose, workerData, onEdit, onViewKey, onDelete, onToggleReceiveTasks, onAddToGroup, onRemoveFromGroup, dataList = [], onNavigate, pagination, onPageChange }: WorkerDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('workerDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 当workerData变化时，重置描述展开状态
  useEffect(() => {
    setIsDescriptionExpanded(false);
  }, [workerData?.id]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  useEffect(() => {
    localStorage.setItem('workerDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 导航逻辑
  const currentIndex = useMemo(() => {
    if (!workerData || dataList.length === 0) return -1;
    return dataList.findIndex(item => item.id === workerData.id);
  }, [workerData, dataList]);

  // 判断是否可以导航（考虑分页）
  const canGoPrev = useMemo(() => {
    if (currentIndex > 0) return true;
    // 当前是第一条，但不是第一页，可以翻到上一页
    if (pagination && pagination.currentPage > 1) return true;
    return false;
  }, [currentIndex, pagination]);

  const canGoNext = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < dataList.length - 1) return true;
    // 当前是最后一条，但还有下一页，可以翻到下一页
    if (pagination && pagination.currentPage < pagination.totalPages) return true;
    return false;
  }, [currentIndex, dataList.length, pagination]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handlePrev = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex > 0 && onNavigate) {
      // 当前页内导航
      onNavigate(dataList[currentIndex - 1]);
    } else if (pagination && pagination.currentPage > 1 && onPageChange) {
      // 需要翻到上一页
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage - 1);
        if (newList && newList.length > 0 && onNavigate) {
          // 导航到上一页的最后一条
          onNavigate(newList[newList.length - 1]);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating]);

  const handleNext = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex >= 0 && currentIndex < dataList.length - 1 && onNavigate) {
      // 当前页内导航
      onNavigate(dataList[currentIndex + 1]);
    } else if (pagination && pagination.currentPage < pagination.totalPages && onPageChange) {
      // 需要翻到下一页
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage + 1);
        if (newList && newList.length > 0 && onNavigate) {
          // 导航到下一页的第一条
          onNavigate(newList[0]);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating]);

  if (!workerData) return null;

  type WorkerStatus = LYWorkerResponse['status'];

  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = {
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  };

  const statusCfg = statusConfig[workerData.status];
  
  // 只有在线且非故障状态才允许操作接收任务开关
  const canOperateReceiveTasks = workerData.status !== 'OFFLINE' && workerData.status !== 'FAULT';

  // 处理描述展示
  const description = workerData.description || '-';
  const isDescriptionLong = description.length > DESCRIPTION_COLLAPSE_THRESHOLD;
  const displayDescription = isDescriptionLong && !isDescriptionExpanded 
    ? description.slice(0, DESCRIPTION_COLLAPSE_THRESHOLD) + '...' 
    : description;

  const renderDescriptionValue = () => {
    if (description === '-') return '-';
    
    return (
      <div className="worker-detail-drawer-description">
        <span className="worker-detail-drawer-description-text">{displayDescription}</span>
        {isDescriptionLong && (
          <Button
            theme="borderless"
            size="small"
            type="tertiary"
            className="worker-detail-drawer-description-toggle"
            icon={isDescriptionExpanded ? <IconChevronUp /> : <IconChevronDown />}
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            {isDescriptionExpanded ? t('common.collapse') : t('common.expand')}
          </Button>
        )}
      </div>
    );
  };

  // 渲染分组信息和操作按钮
  const renderGroupValue = () => {
    if (workerData.group_id && workerData.group_name) {
      return (
        <Space spacing={8}>
          <Tag color="blue" type="light">{workerData.group_name}</Tag>
          <Tooltip content={t('worker.actions.removeFromGroup')}>
            <Button
              icon={<IconMinusCircleStroked />}
              theme="borderless"
              size="small"
              type="tertiary"
              onClick={() => onRemoveFromGroup?.(workerData)}
            />
          </Tooltip>
        </Space>
      );
    }
    return (
      <Space spacing={8}>
        <Text type="tertiary">{t('worker.filter.ungrouped')}</Text>
        <Tooltip content={t('worker.actions.addToGroup')}>
          <Button
            icon={<IconUserListStroked />}
            theme="borderless"
            size="small"
            type="tertiary"
            onClick={() => onAddToGroup?.(workerData)}
          />
        </Tooltip>
      </Space>
    );
  };

  const basicInfoData = [
    { key: t('worker.detail.fields.workerName'), value: workerData.name },
    { key: t('worker.detail.fields.group'), value: renderGroupValue() },
    { key: t('worker.detail.fields.description'), value: renderDescriptionValue() },
    {
      key: t('worker.detail.fields.status'),
      value: (
        <Tag color={statusCfg.color as 'grey' | 'green' | 'blue' | 'red' | 'orange'} type="light">
          {statusCfg.text}
        </Tag>
      ),
    },
    { 
      key: t('worker.detail.fields.receiveTasks'), 
      value: (
        <Switch 
          checked={workerData.receive_tasks} 
          size="small" 
          disabled={!canOperateReceiveTasks}
          onChange={(checked) => onToggleReceiveTasks?.(workerData, checked)}
        />
      ) 
    },
  ];

  const isRemoteDesktop = workerData.desktop_type === 'NotConsole';

  const detailInfoData = [
    {
      key: t('worker.detail.fields.desktopType'),
      value: workerData.desktop_type === 'Console' ? t('worker.detail.desktopTypes.console') : t('worker.detail.desktopTypes.notConsole'),
    },
    { key: t('worker.detail.fields.account'), value: workerData.username },
    {
      key: t('worker.detail.fields.passwordSyncStatus'),
      value: (
        <Tag color={workerData.sync_status === 'SYNCED' ? 'green' : 'orange'} type="light">
          {workerData.sync_status === 'SYNCED' ? t('worker.syncStatus.synced') : t('worker.syncStatus.pending')}
        </Tag>
      ),
    },
    // 远程桌面时显示强制挤占登录
    ...(isRemoteDesktop ? [{ 
      key: t('worker.detail.fields.forceLogin'), 
      value: (
        <Tag color={workerData.force_login ? 'green' : 'grey'} type="light">
          {workerData.force_login ? t('common.yes') : t('common.no')}
        </Tag>
      ) 
    }] : []),
    // 远程桌面时显示分辨率
    ...(isRemoteDesktop ? [{ key: t('worker.detail.fields.resolution'), value: workerData.display_size || '-' }] : []),
    { key: t('worker.detail.fields.clientVersion'), value: workerData.client_version },
    { key: t('worker.detail.fields.lastHeartbeat'), value: workerData.last_heartbeat_time },
  ];

  const hostInfoData = [
    { key: t('worker.detail.fields.machineCode'), value: workerData.machine_code },
    { key: t('worker.detail.fields.hostName'), value: workerData.host_name },
    { key: t('worker.detail.fields.hostIp'), value: workerData.ip_address },
    { key: t('worker.detail.fields.os'), value: workerData.os },
    { key: t('worker.detail.fields.arch'), value: workerData.arch },
    { key: t('worker.detail.fields.cpuModel'), value: workerData.cpu_model },
    { key: t('worker.detail.fields.cpuCores'), value: `${workerData.cpu_cores}核` },
    { key: t('worker.detail.fields.memoryCapacity'), value: workerData.memory_capacity },
    { key: t('worker.detail.fields.robotCount'), value: `${workerData.robot_count}台` },
  ];


  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="worker-detail-drawer-header">
          <Col>
            <Title heading={5} className="worker-detail-drawer-header-title">
              {t('worker.detail.title')}
            </Title>
          </Col>
          <Col>
            <Space spacing={8}>
              {(dataList.length > 1 || (pagination && pagination.totalPages > 1)) && (
                <>
                  <Tooltip content={t('common.previous')}>
                    <Button icon={<IconChevronLeft />} theme="borderless" size="small" disabled={!canGoPrev || isNavigating} onClick={handlePrev} loading={isNavigating} />
                  </Tooltip>
                  <Tooltip content={t('common.next')}>
                    <Button icon={<IconChevronRight />} theme="borderless" size="small" disabled={!canGoNext || isNavigating} onClick={handleNext} loading={isNavigating} />
                  </Tooltip>
                  <Divider layout="vertical" className="worker-detail-drawer-header-divider" />
                </>
              )}
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
              </Tooltip>
              <Tooltip content={t('worker.actions.viewKey')}>
                <Button icon={<IconKeyStroked />} theme="borderless" size="small" onClick={onViewKey} />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button icon={<IconDeleteStroked className="worker-detail-drawer-header-delete-icon" />} theme="borderless" size="small" onClick={onDelete} />
              </Tooltip>
              <Divider layout="vertical" className="worker-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="worker-detail-drawer-header-close-btn" />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet worker-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="worker-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <div className="worker-detail-drawer-tab-content">
        <div className="worker-detail-drawer-info-section">
          <Text strong className="worker-detail-drawer-info-title">
            {t('worker.detail.basicInfo')}
          </Text>
          <Descriptions data={basicInfoData} align="left" />
        </div>

        <div className="worker-detail-drawer-info-section">
          <Text strong className="worker-detail-drawer-info-title">
            {t('worker.detail.detailInfo')}
          </Text>
          <Descriptions data={detailInfoData} align="left" />
        </div>

        <div className="worker-detail-drawer-info-section">
          <Text strong className="worker-detail-drawer-info-title">
            {t('worker.detail.hostInfo')}
          </Text>
          <Descriptions data={hostInfoData} align="left" />
        </div>

        <div>
          <Descriptions
            align="left"
            data={[
              { key: t('worker.detail.fields.createdAt'), value: workerData.created_at },
              { key: t('worker.detail.fields.creator'), value: workerData.creator_id },
            ]}
          />
        </div>
      </div>
    </SideSheet>
  );
};

export default WorkerDetailDrawer;
