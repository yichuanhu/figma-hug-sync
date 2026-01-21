import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SideSheet, Typography, Button, Tag, Descriptions, Tabs, TabPane, Table, Divider, Tooltip, DatePicker, Select, Row, Col, Space } from '@douyinfe/semi-ui';
import { IconEditStroked, IconPlay, IconDeleteStroked, IconExternalOpenStroked, IconMaximize, IconMinimize, IconClose } from '@douyinfe/semi-icons';
import './index.less';

const { Title, Text } = Typography;

const allChangeData = [
  { key: 1, changeTime: '2024-01-15 10:30', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.2.0' },
  { key: 2, changeTime: '2024-01-14 16:00', changeType: '编辑', changer: '李明', changeContent: '修改流程描述' },
  { key: 3, changeTime: '2024-01-10 14:20', changeType: '发布', changer: '姜鹏志', changeContent: '发布版本 1.1.0' },
  { key: 4, changeTime: '2024-01-05 09:00', changeType: '创建', changer: '王芳', changeContent: '创建流程' },
  { key: 5, changeTime: '2023-12-28 14:30', changeType: '编辑', changer: '李明', changeContent: '修改流程配置' },
];

const changerOptions = [...new Set(allChangeData.map((item) => item.changer))].map((changer) => ({
  value: changer,
  label: changer,
}));

const allRunData = [
  { key: 1, taskId: 'TASK-001', robot: 'RPA-机器人-01', creator: '姜鹏志', createdTime: '2024-01-15 10:30:00', status: '成功' },
  { key: 2, taskId: 'TASK-002', robot: 'RPA-机器人-02', creator: '李明', createdTime: '2024-01-14 15:20:00', status: '失败' },
  { key: 3, taskId: 'TASK-003', robot: 'RPA-机器人-01', creator: '王芳', createdTime: '2024-01-13 09:00:00', status: '成功' },
  { key: 4, taskId: 'TASK-004', robot: 'RPA-机器人-03', creator: '姜鹏志', createdTime: '2024-01-12 14:00:00', status: '运行中' },
  { key: 5, taskId: 'TASK-005', robot: 'RPA-机器人-02', creator: '李明', createdTime: '2024-01-11 08:30:00', status: '成功' },
];

// 流程状态枚举 - 与API LYProcessResponse.status对应
type ProcessStatus = 'DEVELOPING' | 'PUBLISHED' | 'ARCHIVED';

// 流程数据接口 - 与ProcessItem保持一致
interface ProcessData {
  id: string;
  name: string;
  description: string;
  status: ProcessStatus;
  creatorName: string;
  createTime: string;
  updateTime: string;
  // 扩展字段（可选）
  language?: string;
  processType?: string;
  timeout?: number;
  currentVersionId?: string | null;
  creatorId?: string;
  requirementId?: string | null;
}

interface ProcessDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  processData: ProcessData | null;
  onOpen?: () => void;
  onEdit?: () => void;
  onRun?: () => void;
  onDelete?: () => void;
}

const ProcessDetailDrawer = ({ visible, onClose, processData, onOpen, onEdit, onRun, onDelete }: ProcessDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('detail');
  const [changeTimeRange, setChangeTimeRange] = useState<[Date, Date] | null>(null);
  const [selectedChangers, setSelectedChangers] = useState<string[]>([]);
  const [runTimeRange, setRunTimeRange] = useState<[Date, Date] | null>(null);
  const [selectedRunStatuses, setSelectedRunStatuses] = useState<string[]>([]);
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

  if (!processData) return null;

  // 状态颜色配置
  const getStatusColor = (status: ProcessStatus): 'grey' | 'green' | 'orange' => {
    switch (status) {
      case 'PUBLISHED':
        return 'green';
      case 'ARCHIVED':
        return 'orange';
      case 'DEVELOPING':
      default:
        return 'grey';
    }
  };

  // 状态 i18n key 配置
  const getStatusI18nKey = (status: ProcessStatus): string => {
    switch (status) {
      case 'PUBLISHED':
        return 'development.processDevelopment.status.published';
      case 'ARCHIVED':
        return 'development.processDevelopment.status.archived';
      case 'DEVELOPING':
      default:
        return 'development.processDevelopment.status.developing';
    }
  };

  const descriptionData = [
    { key: t('development.processDevelopment.fields.processId'), value: processData.id },
    { key: t('development.processDevelopment.fields.processName'), value: processData.name },
    { key: t('common.description'), value: processData.description || '-' },
    { key: t('common.creator'), value: processData.creatorName },
    { key: t('common.createTime'), value: processData.createTime },
    { key: t('common.updateTime'), value: processData.updateTime },
    {
      key: t('common.status'),
      value: (
        <Tag color={getStatusColor(processData.status)} type="light">
          {t(getStatusI18nKey(processData.status))}
        </Tag>
      ),
    },
  ];

  const versionColumns = [
    { title: t('development.processDevelopment.detail.versionTable.version'), dataIndex: 'version', key: 'version' },
    { title: t('development.processDevelopment.detail.versionTable.publishedAt'), dataIndex: 'publishedAt', key: 'publishedAt' },
    { title: t('development.processDevelopment.detail.versionTable.publisher'), dataIndex: 'publisher', key: 'publisher' },
    { title: t('development.processDevelopment.detail.versionTable.remark'), dataIndex: 'remark', key: 'remark' },
  ];

  const versionData = [
    { key: 1, version: '1.2.0', publishedAt: '2024-01-15 10:30', publisher: '姜鹏志', remark: '修复审批逻辑' },
    { key: 2, version: '1.1.0', publishedAt: '2024-01-10 14:20', publisher: '姜鹏志', remark: '新增通知功能' },
    { key: 3, version: '1.0.0', publishedAt: '2024-01-05 09:00', publisher: '姜鹏志', remark: '初始版本' },
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
          color={status === t('development.processDevelopment.detail.runStatus.success') ? 'green' : status === t('development.processDevelopment.detail.runStatus.failed') ? 'red' : 'blue'}
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
            <Space>
              <Title heading={5} className="process-detail-drawer-header-title">
                {processData.name}
              </Title>
              <Text type="tertiary" size="small">
                {processData.id}
              </Text>
            </Space>
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
            <Descriptions data={descriptionData} />
          </div>
        </TabPane>

        <TabPane tab={t('development.processDevelopment.detail.tabs.versions')} itemKey="versions">
          <div className="process-detail-drawer-tab-content">
            <Table columns={versionColumns} dataSource={versionData} pagination={false} size="small" />
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
