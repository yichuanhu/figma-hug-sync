import { useState, useRef, useCallback } from 'react';
import { 
  SideSheet, 
  Typography, 
  Button, 
  Tag,
  Descriptions,
  Tabs,
  TabPane,
  Table,
  Empty,
  Switch,
  Tooltip,
  Divider
} from '@douyinfe/semi-ui';
import { IconEditStroked, IconDeleteStroked, IconMaximize, IconMinimize } from '@douyinfe/semi-icons';

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

// 状态配置
const statusConfig: Record<WorkerStatus, { color: string; text: string; dot: string }> = {
  OFFLINE: { color: 'grey', text: '离线', dot: '⚪' },
  IDLE: { color: 'green', text: '空闲', dot: '🟢' },
  BUSY: { color: 'blue', text: '忙碌', dot: '🔵' },
  FAULT: { color: 'red', text: '故障', dot: '🔴' },
  MAINTENANCE: { color: 'orange', text: '维护中', dot: '🟡' },
};

// 优先级配置
const priorityConfig: Record<Priority, { icon: string; text: string; color: string }> = {
  HIGH: { icon: '🔥', text: '高', color: 'red' },
  MEDIUM: { icon: '●', text: '中', color: 'blue' },
  LOW: { icon: '○', text: '低', color: 'grey' },
};

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
  const [activeTab, setActiveTab] = useState('info');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(656);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(656);

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
      const newWidth = Math.min(Math.max(startWidth.current + diff, 400), window.innerWidth - 100);
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

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  if (!workerData) return null;

  const statusCfg = statusConfig[workerData.status];
  const priorityCfg = priorityConfig[workerData.priority];

  // 基本信息
  const basicInfoData = [
    { key: '流程机器人名称', value: workerData.name },
    { key: '所属分组', value: '-' },
    { key: '描述', value: workerData.description || '-' },
    { 
      key: '状态', 
      value: (
        <Tag color={statusCfg.color as 'grey' | 'green' | 'blue' | 'red' | 'orange'} type="light">
          {statusCfg.dot} {statusCfg.text}
        </Tag>
      ) 
    },
    { 
      key: '任务调度优先级', 
      value: (
        <span style={{ color: `var(--semi-color-${priorityCfg.color})` }}>
          {priorityCfg.icon} {priorityCfg.text}
        </span>
      ) 
    },
    { 
      key: '是否接收任务', 
      value: <Switch checked={workerData.receiveTasks} size="small" disabled /> 
    },
  ];

  // 详细信息
  const detailInfoData = [
    { key: '桌面类型', value: workerData.desktopType === 'Console' ? '本地桌面型' : '远程桌面型' },
    { key: '帐户', value: workerData.username },
    { 
      key: '密码同步状态', 
      value: workerData.syncStatus === 'SYNCED' ? '✓ 已同步' : '⚠️ 待同步' 
    },
    { key: '强制挤占登录', value: workerData.forceLogin ? '☑ 是' : '☐ 否' },
    { key: '分辨率', value: workerData.displaySize || '-' },
    { key: '客户端版本', value: workerData.clientVersion },
    { key: '最近连接时间', value: workerData.lastHeartbeatTime },
  ];

  // 主机信息
  const hostInfoData = [
    { key: '机器码', value: workerData.machineCode },
    { key: '主机名称', value: workerData.hostName },
    { key: '主机IP', value: workerData.ipAddress },
    { key: '操作系统', value: workerData.os },
    { key: '系统架构', value: workerData.arch },
    { key: 'CPU型号', value: workerData.cpuModel },
    { key: 'CPU核心数', value: `${workerData.cpuCores}核` },
    { key: '内存容量', value: workerData.memoryCapacity },
    { key: '流程机器人数量', value: `${workerData.robotCount}台` },
  ];

  // 变更历史表格列
  const changeColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 160 },
    { title: '操作类型', dataIndex: 'type', key: 'type', width: 120 },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 80 },
    { title: '详细信息', dataIndex: 'detail', key: 'detail' },
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
          <Title heading={5} style={{ margin: 0 }}>流程机器人详情</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Tooltip content="编辑">
              <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
            </Tooltip>
            <Tooltip content="删除">
              <Button 
                icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} 
                theme="borderless"
                size="small"
                onClick={onDelete}
              />
            </Tooltip>
            <Divider layout="vertical" style={{ height: 16, margin: '0 8px 0 8px' }} />
            <Tooltip content={isFullscreen ? "退出全屏" : "全屏"}>
              <Button 
                icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} 
                theme="borderless"
                size="small"
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </div>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      footer={null}
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
        <TabPane tab="流程机器人信息" itemKey="info">
          <div style={{ padding: '16px 24px' }}>
            {/* 基本信息 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                基本信息
              </Text>
              <Descriptions data={basicInfoData} />
            </div>

            {/* 详细信息 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                详细信息
              </Text>
              <Descriptions data={detailInfoData} />
            </div>

            {/* 主机信息 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 14 }}>
                主机信息
              </Text>
              <Descriptions data={hostInfoData} />
            </div>

            {/* 创建信息 */}
            <div>
              <Descriptions data={[
                { key: '创建时间', value: workerData.createdAt },
                { key: '创建者', value: workerData.creator },
              ]} />
            </div>
          </div>
        </TabPane>
        
        <TabPane tab="变更历史" itemKey="history">
          <div style={{ padding: '16px 24px' }}>
            {mockChangeHistory.length > 0 ? (
              <Table 
                columns={changeColumns} 
                dataSource={mockChangeHistory} 
                pagination={{
                  pageSize: 10,
                  showTotal: true,
                }}
                size="small"
              />
            ) : (
              <Empty description="暂无变更历史" />
            )}
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default WorkerDetailDrawer;
