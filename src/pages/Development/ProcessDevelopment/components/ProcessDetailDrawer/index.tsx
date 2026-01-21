import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
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
  Divider,
  Tooltip,
  DatePicker,
  Select,
  Row,
  Col,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconPlay,
  IconDeleteStroked,
  IconExternalOpenStroked,
  IconMaximize,
  IconMinimize,
  IconClose,
} from '@douyinfe/semi-icons';
import type { LYProcessResponse, LYProcessVersionResponse } from '@/api';
import './index.less';

const { Title } = Typography;

// ============= Mock数据生成 - 基于API类型 =============

// 变更记录数据 (暂无对应API类型，使用本地定义)
interface ChangeRecord {
  key: number;
  changeTime: string;
  changeType: string;
  changer: string;
  changeContent: string;
}

// 运行记录数据 (暂无对应API类型，使用本地定义)
interface RunRecord {
  key: number;
  taskId: string;
  robot: string;
  creator: string;
  createdTime: string;
  status: string;
}

// Mock数据
const allChangeData: ChangeRecord[] = [
  { key: 1, changeTime: '2024-01-15 10:30', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.2.0' },
  { key: 2, changeTime: '2024-01-14 16:00', changeType: '编辑', changer: '李明', changeContent: '修改流程描述' },
  { key: 3, changeTime: '2024-01-10 14:20', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.1.0' },
  { key: 4, changeTime: '2024-01-05 09:00', changeType: '创建', changer: '王芳', changeContent: '创建流程' },
  { key: 5, changeTime: '2023-12-28 14:30', changeType: '编辑', changer: '李明', changeContent: '修改流程配置' },
];

const allRunData: RunRecord[] = [
  { key: 1, taskId: 'TASK-001', robot: 'RPA-机器人-01', creator: '姜鹏志', createdTime: '2024-01-15 10:30:00', status: '成功' },
  { key: 2, taskId: 'TASK-002', robot: 'RPA-机器人-02', creator: '李明', createdTime: '2024-01-14 15:20:00', status: '失败' },
  { key: 3, taskId: 'TASK-003', robot: 'RPA-机器人-01', creator: '王芳', createdTime: '2024-01-13 09:00:00', status: '成功' },
  { key: 4, taskId: 'TASK-004', robot: 'RPA-机器人-03', creator: '姜鹏志', createdTime: '2024-01-12 14:00:00', status: '运行中' },
  { key: 5, taskId: 'TASK-005', robot: 'RPA-机器人-02', creator: '李明', createdTime: '2024-01-11 08:30:00', status: '成功' },
];

// 版本 Mock 数据 - 基于 LYProcessVersionResponse 类型
const mockVersionData: (LYProcessVersionResponse & { key: number })[] = [
  {
    key: 1,
    id: 'VER-PROC-2024-001-1.2.0',
    version: '1.2.0',
    process_id: 'PROC-2024-001',
    status: 'PUBLISHED',
    source_code: '',
    package_file_id: 'pkg-001',
    package_size: 1024000,
    package_checksum: 'abc123',
    version_note: '优化性能，提升处理速度',
    creator_id: 'user-001',
    created_at: '2026-01-08 10:00:00',
  },
  {
    key: 2,
    id: 'VER-PROC-2024-001-1.1.0',
    version: '1.1.0',
    process_id: 'PROC-2024-001',
    status: 'ARCHIVED',
    source_code: '',
    package_file_id: 'pkg-002',
    package_size: 980000,
    package_checksum: 'def456',
    version_note: '修复bug，增加日志',
    creator_id: 'user-002',
    created_at: '2026-01-05 14:30:00',
  },
  {
    key: 3,
    id: 'VER-PROC-2024-001-1.0.0',
    version: '1.0.0',
    process_id: 'PROC-2024-001',
    status: 'ARCHIVED',
    source_code: '',
    package_file_id: 'pkg-003',
    package_size: 900000,
    package_checksum: 'ghi789',
    version_note: '初始版本',
    creator_id: 'user-001',
    created_at: '2026-01-01 09:00:00',
  },
  {
    key: 4,
    id: 'VER-PROC-2024-001-1.3.0',
    version: '1.3.0',
    process_id: 'PROC-2024-001',
    status: 'DEVELOPING',
    source_code: '',
    package_file_id: 'pkg-004',
    package_size: 1100000,
    package_checksum: 'jkl012',
    version_note: '新增审批功能',
    creator_id: 'user-003',
    created_at: '2026-01-15 11:00:00',
  },
  {
    key: 5,
    id: 'VER-PROC-2024-001-1.2.1',
    version: '1.2.1',
    process_id: 'PROC-2024-001',
    status: 'REVIEWING',
    source_code: '',
    package_file_id: 'pkg-005',
    package_size: 1050000,
    package_checksum: 'mno345',
    version_note: '修复紧急问题',
    creator_id: 'user-001',
    created_at: '2026-01-12 16:00:00',
  },
];

const changerOptions = [...new Set(allChangeData.map((item) => item.changer))].map((changer) => ({
  value: changer,
  label: changer,
}));

// 模拟创建者ID到名称的映射
const mockCreatorNameMap: Record<string, string> = {
  'user-001': '张三',
  'user-002': '李四',
  'user-003': '王五',
  'user-004': '赵六',
  'user-005': '钱七',
};

// ============= 组件Props =============

interface ProcessDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  processData: LYProcessResponse | null;
  onOpen?: () => void;
  onEdit?: () => void;
  onRun?: () => void;
  onDelete?: () => void;
}

// ============= 状态配置 =============

const statusConfig: Record<string, { color: 'grey' | 'green' | 'orange'; i18nKey: string }> = {
  DEVELOPING: { color: 'grey', i18nKey: 'development.processDevelopment.status.developing' },
  PUBLISHED: { color: 'green', i18nKey: 'development.processDevelopment.status.published' },
  ARCHIVED: { color: 'orange', i18nKey: 'development.processDevelopment.status.archived' },
};

// 版本状态配置
const versionStatusConfig: Record<string, { color: 'grey' | 'green' | 'orange' | 'blue' | 'cyan' | 'red' | 'yellow'; i18nKey: string }> = {
  DEVELOPING: { color: 'grey', i18nKey: 'development.processDevelopment.detail.versionStatus.developing' },
  TESTING: { color: 'blue', i18nKey: 'development.processDevelopment.detail.versionStatus.testing' },
  REVIEWING: { color: 'cyan', i18nKey: 'development.processDevelopment.detail.versionStatus.reviewing' },
  PUBLISHED: { color: 'green', i18nKey: 'development.processDevelopment.detail.versionStatus.published' },
  RUNNING: { color: 'blue', i18nKey: 'development.processDevelopment.detail.versionStatus.running' },
  RETIRING: { color: 'yellow', i18nKey: 'development.processDevelopment.detail.versionStatus.retiring' },
  ARCHIVED: { color: 'orange', i18nKey: 'development.processDevelopment.detail.versionStatus.archived' },
};

// ============= 组件 =============

const ProcessDetailDrawer = ({
  visible,
  onClose,
  processData,
  onOpen,
  onEdit,
  onRun,
  onDelete,
}: ProcessDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('detail');
  const [changeTimeRange, setChangeTimeRange] = useState<[Date, Date] | null>(null);
  const [selectedChangers, setSelectedChangers] = useState<string[]>([]);
  const [runTimeRange, setRunTimeRange] = useState<[Date, Date] | null>(null);
  const [selectedRunStatuses, setSelectedRunStatuses] = useState<string[]>([]);
  const [selectedVersionStatuses, setSelectedVersionStatuses] = useState<string[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('processDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 576;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  const runStatusOptions = [
    { value: t('development.processDevelopment.detail.runStatus.success'), label: t('development.processDevelopment.detail.runStatus.success') },
    { value: t('development.processDevelopment.detail.runStatus.failed'), label: t('development.processDevelopment.detail.runStatus.failed') },
    { value: t('development.processDevelopment.detail.runStatus.running'), label: t('development.processDevelopment.detail.runStatus.running') },
  ];

  // 版本状态筛选选项
  const versionStatusOptions = [
    { value: 'DEVELOPING', label: t('development.processDevelopment.detail.versionStatus.developing') },
    { value: 'TESTING', label: t('development.processDevelopment.detail.versionStatus.testing') },
    { value: 'REVIEWING', label: t('development.processDevelopment.detail.versionStatus.reviewing') },
    { value: 'PUBLISHED', label: t('development.processDevelopment.detail.versionStatus.published') },
    { value: 'RUNNING', label: t('development.processDevelopment.detail.versionStatus.running') },
    { value: 'RETIRING', label: t('development.processDevelopment.detail.versionStatus.retiring') },
    { value: 'ARCHIVED', label: t('development.processDevelopment.detail.versionStatus.archived') },
  ];

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
    localStorage.setItem('processDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const filteredChangeData = useMemo(() => {
    return allChangeData.filter((item) => {
      if (changeTimeRange && changeTimeRange[0] && changeTimeRange[1]) {
        const itemDate = new Date(item.changeTime.replace(' ', 'T'));
        if (itemDate < changeTimeRange[0] || itemDate > changeTimeRange[1]) return false;
      }
      if (selectedChangers.length > 0 && !selectedChangers.includes(item.changer)) return false;
      return true;
    });
  }, [changeTimeRange, selectedChangers]);

  const filteredRunData = useMemo(() => {
    return allRunData.filter((item) => {
      if (runTimeRange && runTimeRange[0] && runTimeRange[1]) {
        const itemDate = new Date(item.createdTime.replace(' ', 'T'));
        if (itemDate < runTimeRange[0] || itemDate > runTimeRange[1]) return false;
      }
      if (selectedRunStatuses.length > 0 && !selectedRunStatuses.includes(item.status)) return false;
      return true;
    });
  }, [runTimeRange, selectedRunStatuses]);

  // 版本数据筛选（按状态）并按版本号降序排列
  const filteredVersionData = useMemo(() => {
    let data = [...mockVersionData];
    
    // 按状态筛选
    if (selectedVersionStatuses.length > 0) {
      data = data.filter((item) => selectedVersionStatuses.includes(item.status));
    }
    
    // 按版本号降序排列（最新版本在前）
    data.sort((a, b) => {
      const versionA = a.version.split('.').map(Number);
      const versionB = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const numA = versionA[i] || 0;
        const numB = versionB[i] || 0;
        if (numB !== numA) return numB - numA;
      }
      return 0;
    });
    
    return data;
  }, [selectedVersionStatuses]);

  if (!processData) return null;

  // 格式化日期时间
  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return dateStr.replace('T', ' ').substring(0, 19);
  };

  // 获取创建者名称
  const getCreatorName = (creatorId: string): string => {
    return mockCreatorNameMap[creatorId] || creatorId;
  };

  const creatorName = getCreatorName(processData.creator_id);

  const descriptionData = [
    { key: t('development.processDevelopment.fields.processId'), value: processData.id },
    { key: t('development.processDevelopment.fields.processName'), value: processData.name },
    { key: t('common.description'), value: processData.description || '-' },
    { key: t('common.creator'), value: creatorName },
    { key: t('common.createTime'), value: formatDateTime(processData.created_at) },
    { key: t('common.updateTime'), value: formatDateTime(processData.updated_at) },
    {
      key: t('common.status'),
      value: (
        <Tag color={statusConfig[processData.status]?.color || 'grey'} type="light">
          {t(statusConfig[processData.status]?.i18nKey || 'development.processDevelopment.status.developing')}
        </Tag>
      ),
    },
  ];

  // 版本列表列定义 - 根据需求：版本号、状态、创建者、创建时间、变更说明
  const versionColumns = [
    { 
      title: t('development.processDevelopment.detail.versionTable.version'), 
      dataIndex: 'version', 
      key: 'version',
      width: 100,
    },
    { 
      title: t('common.status'), 
      dataIndex: 'status', 
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = versionStatusConfig[status];
        return (
          <Tag color={config?.color || 'grey'} type="light">
            {t(config?.i18nKey || 'development.processDevelopment.detail.versionStatus.developing')}
          </Tag>
        );
      },
    },
    { 
      title: t('common.creator'), 
      dataIndex: 'creator_id', 
      key: 'creator_id',
      width: 100,
      render: (creatorId: string) => getCreatorName(creatorId),
    },
    { 
      title: t('common.createTime'), 
      dataIndex: 'created_at', 
      key: 'created_at',
      width: 160,
      render: (time: string | null) => formatDateTime(time),
    },
    { 
      title: t('development.processDevelopment.detail.versionTable.versionNote'), 
      dataIndex: 'version_note', 
      key: 'version_note',
      render: (note: string | null) => note || '-',
    },
  ];

  const runColumns = [
    { title: t('development.processDevelopment.detail.runTable.taskId'), dataIndex: 'taskId', key: 'taskId' },
    { title: t('development.processDevelopment.detail.runTable.robot'), dataIndex: 'robot', key: 'robot' },
    { title: t('common.creator'), dataIndex: 'creator', key: 'creator' },
    { title: t('common.createTime'), dataIndex: 'createdTime', key: 'createdTime' },
    {
      title: t('development.processDevelopment.detail.runTable.taskStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === t('development.processDevelopment.detail.runStatus.success')
              ? 'green'
              : status === t('development.processDevelopment.detail.runStatus.failed')
                ? 'red'
                : 'blue'
          }
          type="light"
        >
          {status}
        </Tag>
      ),
    },
  ];

  const changeColumns = [
    { title: t('development.processDevelopment.detail.changeTable.changeTime'), dataIndex: 'changeTime', key: 'changeTime' },
    { title: t('development.processDevelopment.detail.changeTable.changeType'), dataIndex: 'changeType', key: 'changeType' },
    { title: t('development.processDevelopment.detail.changeTable.changer'), dataIndex: 'changer', key: 'changer' },
    { title: t('development.processDevelopment.detail.changeTable.changeContent'), dataIndex: 'changeContent', key: 'changeContent' },
  ];

  return (
    <SideSheet
      title={
        <Row type="flex" justify="space-between" align="middle" className="process-detail-drawer-header">
          <Col>
            <Title heading={5} className="process-detail-drawer-header-title">
              {processData.name}
            </Title>
          </Col>
          <Col>
            <Space spacing={4}>
              <Tooltip content={t('development.processDevelopment.actions.openProcess')}>
                <Button icon={<IconExternalOpenStroked />} theme="borderless" size="small" onClick={onOpen} />
              </Tooltip>
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
              </Tooltip>
              <Tooltip content={t('common.run')}>
                <Button icon={<IconPlay />} theme="borderless" size="small" onClick={onRun} />
              </Tooltip>
              <Tooltip content={t('common.delete')}>
                <Button icon={<IconDeleteStroked className="process-detail-drawer-header-delete-icon" />} theme="borderless" size="small" onClick={onDelete} />
              </Tooltip>
              <Divider layout="vertical" className="process-detail-drawer-header-divider" />
              <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
                <Button icon={isFullscreen ? <IconMinimize /> : <IconMaximize />} theme="borderless" size="small" onClick={toggleFullscreen} />
              </Tooltip>
              <Tooltip content={t('common.close')}>
                <Button icon={<IconClose />} theme="borderless" size="small" onClick={onClose} className="process-detail-drawer-header-close-btn" />
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
      className={`card-sidesheet resizable-sidesheet process-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="process-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="process-detail-drawer-tabs">
        <TabPane tab={t('development.processDevelopment.detail.tabs.detail')} itemKey="detail">
          <div className="process-detail-drawer-tab-content">
            <Descriptions data={descriptionData} align="left" />
          </div>
        </TabPane>

        <TabPane tab={t('development.processDevelopment.detail.tabs.versions')} itemKey="versions">
          <div className="process-detail-drawer-tab-content">
            <div className="process-detail-drawer-filters">
              <Select
                placeholder={t('development.processDevelopment.detail.versionFilter.statusPlaceholder')}
                multiple
                maxTagCount={1}
                value={selectedVersionStatuses}
                onChange={(value) => setSelectedVersionStatuses(value as string[])}
                optionList={versionStatusOptions}
                className="process-detail-drawer-filter-select process-detail-drawer-filter-select--wide"
                showClear
              />
            </div>
            <Table 
              columns={versionColumns} 
              dataSource={filteredVersionData} 
              pagination={false} 
              size="small"
              rowKey="id"
            />
          </div>
        </TabPane>

        <TabPane tab={t('development.processDevelopment.detail.tabs.runs')} itemKey="runs">
          <div className="process-detail-drawer-tab-content">
            <div className="process-detail-drawer-filters">
              <Select
                placeholder={t('development.processDevelopment.detail.filter.statusPlaceholder')}
                multiple
                maxTagCount={1}
                value={selectedRunStatuses}
                onChange={(value) => setSelectedRunStatuses(value as string[])}
                optionList={runStatusOptions}
                className="process-detail-drawer-filter-select"
                showClear
              />
              <DatePicker
                type="dateTimeRange"
                value={runTimeRange as [Date, Date] | undefined}
                onChange={(value) => setRunTimeRange(value as [Date, Date] | null)}
                placeholder={[t('common.startTime'), t('common.endTime')]}
                className="process-detail-drawer-filter-date"
                showClear
              />
            </div>
            <Table columns={runColumns} dataSource={filteredRunData} pagination={false} size="small" />
          </div>
        </TabPane>

        <TabPane tab={t('development.processDevelopment.detail.tabs.changes')} itemKey="changes">
          <div className="process-detail-drawer-tab-content">
            <div className="process-detail-drawer-filters">
              <Select
                placeholder={t('development.processDevelopment.detail.filter.changerPlaceholder')}
                multiple
                value={selectedChangers}
                onChange={(value) => setSelectedChangers(value as string[])}
                optionList={changerOptions}
                className="process-detail-drawer-filter-select process-detail-drawer-filter-select--wide"
                showClear
              />
              <DatePicker
                type="dateTimeRange"
                value={changeTimeRange as [Date, Date] | undefined}
                onChange={(value) => setChangeTimeRange(value as [Date, Date] | null)}
                placeholder={[t('common.startTime'), t('common.endTime')]}
                className="process-detail-drawer-filter-date"
                showClear
              />
            </div>
            <Table columns={changeColumns} dataSource={filteredChangeData} pagination={false} size="small" />
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default ProcessDetailDrawer;
