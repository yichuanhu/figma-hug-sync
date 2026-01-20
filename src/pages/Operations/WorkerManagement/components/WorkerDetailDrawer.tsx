import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SideSheet, 
  Typography, 
  Button, 
  Tag,
  Descriptions,
  Tabs,
  TabPane,
  Table,
  Switch,
  Tooltip,
  Divider
} from '@douyinfe/semi-ui';
import { IconEditStroked, IconDeleteStroked, IconMaximize, IconMinimize, IconClose } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

// 机器人状态类型
type WorkerStatus = 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';
type SyncStatus = 'SYNCED' | 'PENDING';
type Priority = 'HIGH' | 'MEDIUM' | 'LOW';

interface WorkerData {
  id: string;
  name: string;
  description: string;
  status: WorkerStatus;
  syncStatus: SyncStatus;
  ipAddress: string;
  priority: Priority;
  clientVersion: string;
  lastHeartbeatTime: string;
  receiveTasks: boolean;
  username: string;
  desktopType: 'Console' | 'NotConsole';
  displaySize?: string;
  enableAutoUnlock?: boolean;
  forceLogin: boolean;
  deviceToken: string;
  machineCode: string;
  hostName: string;
  os: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  memoryCapacity: string;
  robotCount: number;
  createdAt: string;
  creator: string;
}

interface WorkerDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  workerData: WorkerData | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Mock变更历史数据
const mockChangeHistory = [
  { 
    key: 1, 
    time: '2025-01-08 10:20:15', 
    type: '修改配置', 
    operator: 'admin', 
    detail: '修改优先级: 高→中' 
  },
  { 
    key: 2, 
    time: '2025-01-07 16:30:22', 
    type: '修改密码', 
    operator: 'admin', 
    detail: '密码已更新,同步状态: 已同步' 
  },
  { 
    key: 3, 
    time: '2025-01-07 09:15:00', 
    type: '状态变更', 
    operator: 'SYSTEM', 
    detail: '状态: 离线→空闲,客户端首次连接' 
  },
  { 
    key: 4, 
    time: '2025-01-05 14:30:00', 
    type: '创建流程机器人', 
    operator: 'admin', 
    detail: '创建流程机器人,运行环境: 桌面型-本地桌面型,初始状态: 离线' 
  },
];

const WorkerDetailDrawer = ({ 
  visible, 
  onClose, 
  workerData,
  onEdit,
  onDelete 
}: WorkerDetailDrawerProps) => {
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
      const newWidth = Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100);
      setDrawerWidth(newWidth);
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
  }, [drawerWidth]);

  // 保存抽屉宽度到 localStorage
  useEffect(() => {
    localStorage.setItem('workerDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  if (!workerData) return null;

  // 状态配置
  const statusConfig: Record<WorkerStatus, { color: string; text: string; dot: string }> = {
    OFFLINE: { color: 'grey', text: t('worker.status.offline'), dot: '⚪' },
    IDLE: { color: 'green', text: t('worker.status.idle'), dot: '🟢' },
    BUSY: { color: 'blue', text: t('worker.status.busy'), dot: '🔵' },
    FAULT: { color: 'red', text: t('worker.status.fault'), dot: '🔴' },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance'), dot: '🟡' },
  };

  // 优先级配置
  const priorityConfig: Record<Priority, { icon: string; text: string; color: string }> = {
    HIGH: { icon: '🔥', text: t('worker.priority.high'), color: 'red' },
    MEDIUM: { icon: '●', text: t('worker.priority.medium'), color: 'blue' },
    LOW: { icon: '○', text: t('worker.priority.low'), color: 'grey' },
  };

  const statusCfg = statusConfig[workerData.status];
  const priorityCfg = priorityConfig[workerData.priority];

  // 基本信息
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
      ) 
    },
    { 
      key: t('worker.detail.fields.priority'), 
      value: (
        <span style={{ color: `var(--semi-color-${priorityCfg.color})` }}>
          {priorityCfg.icon} {priorityCfg.text}
        </span>
      ) 
    },
    { 
      key: t('worker.detail.fields.receiveTasks'), 
      value: <Switch checked={workerData.receiveTasks} size="small" disabled /> 
    },
  ];

  // 详细信息
  const detailInfoData = [
    { key: t('worker.detail.fields.desktopType'), value: workerData.desktopType === 'Console' ? t('worker.detail.desktopTypes.console') : t('worker.detail.desktopTypes.notConsole') },
    { key: t('worker.detail.fields.account'), value: workerData.username },
    { 
      key: t('worker.detail.fields.passwordSyncStatus'), 
      value: workerData.syncStatus === 'SYNCED' ? t('worker.detail.syncStatusText.synced') : t('worker.detail.syncStatusText.pending')
    },
    { key: t('worker.detail.fields.forceLogin'), value: workerData.forceLogin ? `☑ ${t('common.yes')}` : `☐ ${t('common.no')}` },
    { key: t('worker.detail.fields.resolution'), value: workerData.displaySize || '-' },
    { key: t('worker.detail.fields.clientVersion'), value: workerData.clientVersion },
    { key: t('worker.detail.fields.lastHeartbeat'), value: workerData.lastHeartbeatTime },
  ];

  // 主机信息
  const hostInfoData = [
    { key: t('worker.detail.fields.machineCode'), value: workerData.machineCode },
    { key: t('worker.detail.fields.hostName'), value: workerData.hostName },
    { key: t('worker.detail.fields.hostIp'), value: workerData.ipAddress },
    { key: t('worker.detail.fields.os'), value: workerData.os },
    { key: t('worker.detail.fields.arch'), value: workerData.arch },
    { key: t('worker.detail.fields.cpuModel'), value: workerData.cpuModel },
    { key: t('worker.detail.fields.cpuCores'), value: `${workerData.cpuCores}核` },
    { key: t('worker.detail.fields.memoryCapacity'), value: workerData.memoryCapacity },
    { key: t('worker.detail.fields.robotCount'), value: `${workerData.robotCount}台` },
  ];

  // 变更历史表格列
  const changeColumns = [
    { title: t('worker.detail.changeHistory.time'), dataIndex: 'time', key: 'time', width: 160 },
    { title: t('worker.detail.changeHistory.type'), dataIndex: 'type', key: 'type', width: 120 },
    { title: t('worker.detail.changeHistory.operator'), dataIndex: 'operator', key: 'operator', width: 80 },
    { title: t('worker.detail.changeHistory.detail'), dataIndex: 'detail', key: 'detail' },
  ];

  return (
    <SideSheet
      title={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          paddingRight: 0
        }}>
          <Title heading={5} style={{ margin: 0 }}>{t('worker.detail.title')}</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip content={t('common.edit')}>
              <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
            </Tooltip>
            <Tooltip content={t('common.delete')}>
              <Button 
                icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} 
                theme="borderless"
                size="small"
                onClick={onDelete}
              />
            </Tooltip>
            <Divider layout="vertical" style={{ height: 16, margin: '0 8px 0 4px' }} />
            <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
              <Button 
                icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} 
                theme="borderless"
                size="small"
                onClick={toggleFullscreen}
              />
            </Tooltip>
            <Tooltip content={t('common.close')}>
              <Button 
                icon={<IconClose />} 
                theme="borderless"
                size="small"
                onClick={onClose}
                style={{ marginLeft: 4 }}
              />
            </Tooltip>
          </div>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      headerStyle={{ borderBottom: '1px solid var(--semi-color-border)' }}
      bodyStyle={{ padding: 0, position: 'relative' }}
      className={`card-sidesheet resizable-sidesheet ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {/* 拖拽调整宽度的把手 */}
      {!isFullscreen && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'ew-resize',
            zIndex: 100,
          }}
          onMouseDown={handleMouseDown}
        />
      )}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        style={{ height: '100%' }}
        tabBarStyle={{ padding: '0 24px' }}
      >
        <TabPane tab={t('worker.detail.tabs.info')} itemKey="info">
          <div style={{ padding: '16px 24px' }}>
            {/* 基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                {t('worker.detail.basicInfo')}
              </Text>
              <Descriptions data={basicInfoData} />
            </div>

            {/* 详细信息 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                {t('worker.detail.detailInfo')}
              </Text>
              <Descriptions data={detailInfoData} />
            </div>

            {/* 主机信息 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                {t('worker.detail.hostInfo')}
              </Text>
              <Descriptions data={hostInfoData} />
            </div>

            {/* 创建信息 */}
            <div>
              <Descriptions data={[
                { key: t('worker.detail.fields.createdAt'), value: workerData.createdAt },
                { key: t('worker.detail.fields.creator'), value: workerData.creator },
              ]} />
            </div>
          </div>
        </TabPane>
        
        <TabPane tab={t('worker.detail.tabs.history')} itemKey="history">
          <div style={{ padding: '16px 24px' }}>
            <Table 
              columns={changeColumns} 
              dataSource={mockChangeHistory} 
              pagination={{
                pageSize: 10,
                showTotal: true,
              }}
              size="small"
            />
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default WorkerDetailDrawer;
