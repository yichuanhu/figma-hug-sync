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
  Switch,
  Toast,
  Modal,
  Input,
  TextArea,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconPlay,
  IconDeleteStroked,
  IconExternalOpenStroked,
  IconMaximize,
  IconMinimize,
  IconClose,
  IconUpload,
  IconHelpCircle,
  IconTick,
  IconClear,
  IconLink,
  IconSetting,
} from '@douyinfe/semi-icons';
import type { LYProcessResponse, LYProcessVersionResponse } from '@/api';
import UploadVersionModal from '../UploadVersionModal';
import './index.less';

const { Title, Text } = Typography;

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

// 版本 Mock 数据 - 基于 LYProcessVersionResponse 类型，扩展详情字段
// 参数变量类型定义
interface ProcessVariable {
  name: string;
  type: '文本' | '布尔' | '数值';
  value?: string;
  description?: string;
}

interface VersionDetailData extends LYProcessVersionResponse {
  key: number;
  file_name?: string;
  usage_instructions_url?: string;
  client_version?: string;
  development_environment?: string;
  is_active?: boolean;
  inputs?: ProcessVariable[];
  outputs?: ProcessVariable[];
}

const initialMockVersionData: VersionDetailData[] = [
  {
    key: 1,
    id: 'VER-PROC-2024-001-1.0.4',
    version: '1.0.4',
    process_id: 'PROC-2024-001',
    status: 'PUBLISHED',
    source_code: '',
    package_file_id: 'pkg-001',
    package_size: 1024000,
    package_checksum: 'abc123',
    version_note: '测试ADP服务调用3',
    creator_id: 'user-001',
    created_at: '2026-01-21 14:22:42',
    file_name: 'ADP调用演示',
    usage_instructions_url: 'https://docs.example.com/process/1.0.4',
    client_version: '7.0.0',
    development_environment: 'Win10 | X86',
    is_active: true,
    inputs: [
      { name: 'APP_KEY', type: '文本', value: 'sk-xxxxx', description: '应用密钥' },
      { name: 'APP_VALUE', type: '文本', value: 'default_value', description: '应用配置值' },
      { name: 'RETRY_COUNT', type: '数值', value: '3', description: '重试次数' },
      { name: 'IS_DEBUG', type: '布尔', value: 'true', description: '是否开启调试模式' },
    ],
    outputs: [
      { name: 'result', type: '文本', value: '', description: '处理结果' },
      { name: 'success', type: '布尔', value: '', description: '是否成功' },
    ],
  },
  {
    key: 2,
    id: 'VER-PROC-2024-001-1.0.3',
    version: '1.0.3',
    process_id: 'PROC-2024-001',
    status: 'ARCHIVED',
    source_code: '',
    package_file_id: 'pkg-002',
    package_size: 980000,
    package_checksum: 'def456',
    version_note: '修复bug，增加日志',
    creator_id: 'user-002',
    created_at: '2026-01-18 10:30:00',
    file_name: 'ADP调用演示',
    client_version: '7.0.0',
    development_environment: 'Win11 | X64',
    is_active: false,
    inputs: [
      { name: 'APP_KEY', type: '文本', value: 'sk-xxxxx', description: '应用密钥' },
    ],
    outputs: [
      { name: 'result', type: '文本', value: '', description: '处理结果' },
    ],
  },
  {
    key: 3,
    id: 'VER-PROC-2024-001-1.0.2',
    version: '1.0.2',
    process_id: 'PROC-2024-001',
    status: 'ARCHIVED',
    source_code: '',
    package_file_id: 'pkg-003',
    package_size: 900000,
    package_checksum: 'ghi789',
    version_note: '性能优化',
    creator_id: 'user-001',
    created_at: '2026-01-15 09:00:00',
    file_name: 'ADP调用演示',
    client_version: '6.5.0',
    development_environment: 'Win10 | X86',
    is_active: false,
    inputs: [],
    outputs: [],
  },
  {
    key: 4,
    id: 'VER-PROC-2024-001-1.0.1',
    version: '1.0.1',
    process_id: 'PROC-2024-001',
    status: 'ARCHIVED',
    source_code: '',
    package_file_id: 'pkg-004',
    package_size: 850000,
    package_checksum: 'jkl012',
    version_note: '修复初始问题',
    creator_id: 'user-003',
    created_at: '2026-01-10 11:00:00',
    file_name: 'ADP调用演示',
    client_version: '6.5.0',
    development_environment: 'Win10 | X64',
    is_active: false,
    inputs: [],
    outputs: [],
  },
  {
    key: 5,
    id: 'VER-PROC-2024-001-1.0.0',
    version: '1.0.0',
    process_id: 'PROC-2024-001',
    status: 'ARCHIVED',
    source_code: '',
    package_file_id: 'pkg-005',
    package_size: 800000,
    package_checksum: 'mno345',
    version_note: '初始版本',
    creator_id: 'user-001',
    created_at: '2026-01-05 09:00:00',
    file_name: 'ADP调用演示',
    client_version: '6.0.0',
    development_environment: 'Win7 | X86',
    is_active: false,
    inputs: [],
    outputs: [],
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

// ============= 变量卡片组件 =============

interface VariableCardProps {
  variable: ProcessVariable;
  index: number;
  onDescriptionChange: (index: number, description: string) => void;
}

const VariableCard = ({ variable, index, onDescriptionChange }: VariableCardProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditValue(variable.description || '');
  }, [variable.description]);

  const handleConfirmEdit = useCallback(() => {
    onDescriptionChange(index, editValue);
    setIsEditing(false);
    setEditValue('');
    Toast.success(t('development.processDevelopment.detail.variable.editSuccess'));
  }, [editValue, index, onDescriptionChange, t]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirmEdit();
    }
  }, [handleCancelEdit, handleConfirmEdit]);

  return (
    <div className="process-detail-drawer-variable-card">
      <div className="process-detail-drawer-variable-card-header">
        <div className="process-detail-drawer-variable-card-header-left">
          <Tag color="blue" type="light" size="small">
            {variable.type}
          </Tag>
          <Text strong className="process-detail-drawer-variable-card-name">
            {variable.name}
          </Text>
        </div>
      </div>
      <div className="process-detail-drawer-variable-card-body">
        <div className="process-detail-drawer-variable-card-row">
          <Text type="tertiary" className="process-detail-drawer-variable-card-label">
            {t('development.processDevelopment.detail.variable.value')}
          </Text>
          <Text className="process-detail-drawer-variable-card-value" ellipsis={{ showTooltip: true }}>
            {variable.value || '-'}
          </Text>
        </div>
        <div className="process-detail-drawer-variable-card-row">
          <Text type="tertiary" className="process-detail-drawer-variable-card-label">
            {t('common.description')}
          </Text>
          {isEditing ? (
            <div className="process-detail-drawer-variable-card-edit">
              <TextArea
                value={editValue}
                onChange={(value) => setEditValue(value)}
                autoFocus
                placeholder={t('development.processDevelopment.detail.variable.editPlaceholder')}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    handleCancelEdit();
                  }
                }}
                maxLength={500}
                showClear
                maxCount={500}
                autosize={{ minRows: 2, maxRows: 6 }}
              />
              <Space spacing={8} className="process-detail-drawer-variable-card-edit-actions">
                <Button
                  size="small"
                  theme="solid"
                  type="primary"
                  onClick={handleConfirmEdit}
                >
                  {t('common.confirm')}
                </Button>
                <Button
                  size="small"
                  theme="borderless"
                  type="tertiary"
                  onClick={handleCancelEdit}
                >
                  {t('common.cancel')}
                </Button>
              </Space>
            </div>
          ) : (
            <div className="process-detail-drawer-variable-card-desc-row">
              <Tooltip 
                content={variable.description || '-'}
                position="top"
                style={{ maxWidth: 400, wordBreak: 'break-word' }}
              >
                <Text 
                  className="process-detail-drawer-variable-card-value" 
                  onDoubleClick={handleStartEdit}
                >
                  {variable.description || '-'}
                </Text>
              </Tooltip>
              <Tooltip content={t('development.processDevelopment.detail.variable.editDescTip')}>
                <Button
                  icon={<IconEditStroked />}
                  theme="borderless"
                  size="small"
                  type="tertiary"
                  className="process-detail-drawer-variable-card-edit-btn"
                  onClick={handleStartEdit}
                />
              </Tooltip>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface VariableCardListProps {
  data: ProcessVariable[];
  onDescriptionChange: (index: number, description: string) => void;
}

const VariableCardList = ({ data, onDescriptionChange }: VariableCardListProps) => {
  return (
    <div className="process-detail-drawer-variable-card-list">
      {data.map((variable, index) => (
        <VariableCard
          key={index}
          variable={variable}
          index={index}
          onDescriptionChange={onDescriptionChange}
        />
      ))}
    </div>
  );
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
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadVersionModalVisible, setUploadVersionModalVisible] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('processDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 576;
  });
  const [versionData, setVersionData] = useState<VersionDetailData[]>(initialMockVersionData);
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

  // 版本数据按版本号降序排列（最新版本在前）
  const sortedVersionData = useMemo(() => {
    const data = [...versionData];
    
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
  }, [versionData]);

  // 处理版本激活/停用 - 只允许开启一个版本
  const handleVersionActiveChange = useCallback((versionId: string, checked: boolean) => {
    const version = versionData.find(v => v.id === versionId);
    
    if (checked) {
      // 开启新版本时，显示确认弹窗
      Modal.confirm({
        title: t('development.processDevelopment.detail.versionList.activateConfirmTitle'),
        content: t('development.processDevelopment.detail.versionList.activateConfirmContent'),
        onOk: () => {
          // 开启新版本，关闭其他所有版本
          setVersionData(prevData => 
            prevData.map(v => ({
              ...v,
              is_active: v.id === versionId ? true : false
            }))
          );
          if (version) {
            Toast.success(t('development.processDevelopment.detail.versionList.activateSuccess', { version: version.version }));
          }
        },
      });
    } else {
      // 关闭版本
      setVersionData(prevData => 
        prevData.map(v => 
          v.id === versionId ? { ...v, is_active: false } : v
        )
      );
      if (version) {
        Toast.success(t('development.processDevelopment.detail.versionList.deactivateSuccess', { version: version.version }));
      }
    }
  }, [versionData, t]);

  // 处理删除版本
  const handleDeleteVersion = useCallback((version: VersionDetailData) => {
    // 开启的版本不允许删除
    if (version.is_active) {
      Toast.warning(t('development.processDevelopment.detail.versionList.cannotDeleteActive'));
      return;
    }

    Modal.confirm({
      title: t('development.processDevelopment.detail.versionList.deleteConfirmTitle'),
      content: t('development.processDevelopment.detail.versionList.deleteConfirmContent', { version: version.version }),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      okType: 'danger',
      onOk: () => {
        setVersionData(prevData => prevData.filter(v => v.id !== version.id));
        // 如果删除的是当前选中的版本，清除选中状态
        if (selectedVersionId === version.id) {
          setSelectedVersionId(null);
        }
        Toast.success(t('development.processDevelopment.detail.versionList.deleteSuccess', { version: version.version }));
      },
    });
  }, [t, selectedVersionId]);

  // 当前选中的版本详情
  const selectedVersion = useMemo(() => {
    if (selectedVersionId) {
      return sortedVersionData.find((v) => v.id === selectedVersionId) || null;
    }
    // 默认选中第一个版本
    return sortedVersionData.length > 0 ? sortedVersionData[0] : null;
  }, [selectedVersionId, sortedVersionData]);

  // 初始化选中第一个版本
  useEffect(() => {
    if (sortedVersionData.length > 0 && !selectedVersionId) {
      setSelectedVersionId(sortedVersionData[0].id);
    }
  }, [sortedVersionData, selectedVersionId]);

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

  // 版本详情描述数据
  const getVersionDescriptionData = (version: VersionDetailData) => [
    { key: t('development.processDevelopment.detail.versionDetail.processVersion'), value: version.version },
    { key: t('development.processDevelopment.detail.versionDetail.versionFileName'), value: version.file_name || '-' },
    { key: t('development.processDevelopment.detail.versionDetail.uploader'), value: getCreatorName(version.creator_id) },
    { key: t('development.processDevelopment.detail.versionDetail.uploadTime'), value: formatDateTime(version.created_at) },
    { key: t('development.processDevelopment.detail.versionDetail.versionNote'), value: version.version_note || '-' },
    {
      key: t('development.processDevelopment.detail.versionDetail.usageInstructions'),
      value: version.usage_instructions_url ? (
        <a href={version.usage_instructions_url} target="_blank" rel="noopener noreferrer">
          <IconLink style={{ marginRight: 4 }} />
          {t('development.processDevelopment.detail.versionDetail.viewInstructions')}
        </a>
      ) : (
        t('development.processDevelopment.detail.versionDetail.noDescription')
      ),
    },
    {
      key: t('development.processDevelopment.detail.versionDetail.clientVersion'),
      value: version.client_version || '-',
    },
    {
      key: t('development.processDevelopment.detail.versionDetail.developmentEnvironment'),
      value: version.development_environment || 'Win10 | X86',
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
          <div className="process-detail-drawer-version-layout">
            {/* 左侧版本列表 */}
            <div className="process-detail-drawer-version-sidebar">
              <div className="process-detail-drawer-version-sidebar-header">
                <Text className="process-detail-drawer-version-sidebar-title">
                  {t('development.processDevelopment.detail.versionList.title')}
                </Text>
                <Tooltip content={t('development.processDevelopment.detail.versionList.titleTooltip')}>
                  <IconHelpCircle style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }} />
                </Tooltip>
              </div>
              <Button
                icon={<IconUpload />}
                theme="solid"
                className="process-detail-drawer-version-sidebar-upload-btn"
                onClick={() => setUploadVersionModalVisible(true)}
              >
                {t('development.processDevelopment.detail.versionList.uploadVersion')}
              </Button>
              <div className="process-detail-drawer-version-sidebar-list">
                {sortedVersionData.map((version) => (
                  <div
                    key={version.id}
                    className={`process-detail-drawer-version-sidebar-item ${
                      selectedVersion?.id === version.id ? 'process-detail-drawer-version-sidebar-item--selected' : ''
                    }`}
                    onClick={() => setSelectedVersionId(version.id)}
                  >
                    <Text className="process-detail-drawer-version-sidebar-item-version">{version.version}</Text>
                    <Switch
                      checked={version.is_active}
                      size="small"
                      onChange={(checked, e) => {
                        e.stopPropagation();
                        handleVersionActiveChange(version.id, checked);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧版本详情 */}
            <div className="process-detail-drawer-version-detail">
              {selectedVersion ? (
                <>
                  {/* 基本信息 */}
                  <div className="process-detail-drawer-version-detail-section">
                    <Text className="process-detail-drawer-version-detail-section-title">
                      {t('development.processDevelopment.detail.versionDetail.basicInfo')}
                    </Text>
                    <Descriptions data={getVersionDescriptionData(selectedVersion)} align="left" />
                    <Tooltip 
                      content={selectedVersion.is_active ? t('development.processDevelopment.detail.versionList.cannotDeleteActive') : undefined}
                    >
                      <Button
                        icon={<IconDeleteStroked />}
                        type="tertiary"
                        className="process-detail-drawer-version-detail-delete-btn"
                        disabled={selectedVersion.is_active}
                        onClick={() => handleDeleteVersion(selectedVersion)}
                      >
                        {t('development.processDevelopment.detail.versionList.deleteVersion')}
                      </Button>
                    </Tooltip>
                  </div>

                  {/* 流程输入 */}
                  {selectedVersion.inputs && selectedVersion.inputs.length > 0 && (
                    <div className="process-detail-drawer-version-detail-section">
                      <Text className="process-detail-drawer-version-detail-section-title">
                        {t('development.processDevelopment.detail.versionDetail.processInput')}
                      </Text>
                      <VariableCardList
                        data={selectedVersion.inputs}
                        onDescriptionChange={(index, description) => {
                          setVersionData((prevData) =>
                            prevData.map((v) =>
                              v.id === selectedVersion.id
                                ? {
                                    ...v,
                                    inputs: v.inputs?.map((input, i) =>
                                      i === index ? { ...input, description } : input
                                    ),
                                  }
                                : v
                            )
                          );
                        }}
                      />
                    </div>
                  )}

                  {/* 流程输出 */}
                  {selectedVersion.outputs && selectedVersion.outputs.length > 0 && (
                    <div className="process-detail-drawer-version-detail-section">
                      <Text className="process-detail-drawer-version-detail-section-title">
                        {t('development.processDevelopment.detail.versionDetail.processOutput')}
                      </Text>
                      <VariableCardList
                        data={selectedVersion.outputs}
                        onDescriptionChange={(index, description) => {
                          setVersionData((prevData) =>
                            prevData.map((v) =>
                              v.id === selectedVersion.id
                                ? {
                                    ...v,
                                    outputs: v.outputs?.map((output, i) =>
                                      i === index ? { ...output, description } : output
                                    ),
                                  }
                                : v
                            )
                          );
                        }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="process-detail-drawer-version-detail-empty">
                  <Text type="tertiary">{t('development.processDevelopment.detail.empty.noVersions')}</Text>
                </div>
              )}
            </div>
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

      {/* 上传版本弹窗 */}
      <UploadVersionModal
        visible={uploadVersionModalVisible}
        onCancel={() => setUploadVersionModalVisible(false)}
        processData={processData}
        onSuccess={() => {
          // TODO: 刷新版本列表
        }}
      />
    </SideSheet>
  );
};

export default ProcessDetailDrawer;
