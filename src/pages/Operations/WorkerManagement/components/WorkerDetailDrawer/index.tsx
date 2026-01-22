import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SideSheet, Typography, Button, Tag, Descriptions, Tabs, TabPane, Table, Switch, Tooltip, Divider, Row, Col, Space } from '@douyinfe/semi-ui';
import { IconEditStroked, IconDeleteStroked, IconMaximize, IconMinimize, IconClose } from '@douyinfe/semi-icons';
import type { LYWorkerResponse } from '@/api';
import './index.less';

const { Title, Text } = Typography;

interface WorkerDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  workerData: LYWorkerResponse | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const mockChangeHistory = [
  { key: 1, time: '2025-01-08 10:20:15', type: '修改配置', operator: 'admin', detail: '修改优先级: 高→中' },
  { key: 2, time: '2025-01-07 16:30:22', type: '修改密码', operator: 'admin', detail: '密码已更新,同步状态: 已同步' },
  { key: 3, time: '2025-01-07 09:15:00', type: '状态变更', operator: 'SYSTEM', detail: '状态: 离线→空闲,客户端首次连接' },
  { key: 4, time: '2025-01-05 14:30:00', type: '创建流程机器人', operator: 'admin', detail: '创建流程机器人,运行环境: 桌面型-本地桌面型,初始状态: 离线' },
];

const WorkerDetailDrawer = ({ visible, onClose, workerData, onEdit, onDelete }: WorkerDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('info');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('workerDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 656;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

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

  if (!workerData) return null;

  type WorkerStatus = LYWorkerResponse['status'];
  type Priority = LYWorkerResponse['priority'];

  const statusConfig: Record<WorkerStatus, { color: string; text: string; dot: string }> = {
    OFFLINE: { color: 'grey', text: t('worker.status.offline'), dot: '⚪' },
    IDLE: { color: 'green', text: t('worker.status.idle'), dot: '🟢' },
    BUSY: { color: 'blue', text: t('worker.status.busy'), dot: '🔵' },
    FAULT: { color: 'red', text: t('worker.status.fault'), dot: '🔴' },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance'), dot: '🟡' },
  };

  const priorityConfig: Record<Priority, { icon: string; text: string; color: string }> = {
    HIGH: { icon: '🔥', text: t('worker.priority.high'), color: 'red' },
    MEDIUM: { icon: '●', text: t('worker.priority.medium'), color: 'blue' },
    LOW: { icon: '○', text: t('worker.priority.low'), color: 'grey' },
  };

  const statusCfg = statusConfig[workerData.status];
  const priorityCfg = priorityConfig[workerData.priority];

  const basicInfoData = [
    { key: t('worker.detail.fields.workerName'), value: workerData.name },
    { key: t('worker.detail.fields.group'), value: '-' },
    { key: t('worker.detail.fields.description'), value: workerData.description || '-' },
    {
      key: t('worker.detail.fields.status'),
      value: (
        <Tag color={statusCfg.color as 'grey' | 'green' | 'blue' | 'red' | 'orange'} type="light">
          {statusCfg.dot} {statusCfg.text}
        </Tag>
      ),
    },
    {
      key: t('worker.detail.fields.priority'),
      value: (
        <span className={`worker-detail-drawer-priority worker-detail-drawer-priority--${priorityCfg.color}`}>
          {priorityCfg.icon} {priorityCfg.text}
        </span>
      ),
    },
    { key: t('worker.detail.fields.receiveTasks'), value: <Switch checked={workerData.receive_tasks} size="small" disabled /> },
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
      value: workerData.sync_status === 'SYNCED' ? t('worker.detail.syncStatusText.synced') : t('worker.detail.syncStatusText.pending'),
    },
    // 远程桌面时显示强制挤占登录
    ...(isRemoteDesktop ? [{ key: t('worker.detail.fields.forceLogin'), value: workerData.force_login ? `☑ ${t('common.yes')}` : `☐ ${t('common.no')}` }] : []),
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

  const changeColumns = [
    { title: t('worker.detail.changeHistory.time'), dataIndex: 'time', key: 'time', width: 160 },
    { title: t('worker.detail.changeHistory.type'), dataIndex: 'type', key: 'type', width: 120 },
    { title: t('worker.detail.changeHistory.operator'), dataIndex: 'operator', key: 'operator', width: 80 },
    { title: t('worker.detail.changeHistory.detail'), dataIndex: 'detail', key: 'detail' },
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
            <Space spacing={4}>
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
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
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="worker-detail-drawer-tabs">
        <TabPane tab={t('worker.detail.tabs.info')} itemKey="info">
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
        </TabPane>

        <TabPane tab={t('worker.detail.tabs.history')} itemKey="history">
          <div className="worker-detail-drawer-tab-content">
            <Table columns={changeColumns} dataSource={mockChangeHistory} pagination={{ pageSize: 10, showTotal: true }} size="small" />
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default WorkerDetailDrawer;
