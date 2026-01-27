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
  
  Toast,
  Modal,
  Input,
  TextArea,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconPlayCircle,
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
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
import type { LYProcessResponse, LYProcessVersionResponse } from '@/api';
import UploadVersionModal from '../UploadVersionModal';
import EmptyState from '@/components/EmptyState';
import './index.less';

const { Title, Text } = Typography;

// ============= Mock数据生成 - 基于API类型 =============


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
  inputs?: ProcessVariable[];
  outputs?: ProcessVariable[];
}

// 临时清空以展示空状态效果
const initialMockVersionData: VersionDetailData[] = [];


// 模拟创建者ID到名称的映射
const mockCreatorNameMap: Record<string, string> = {
  'user-001': '张三',
  'user-002': '李四',
  'user-003': '王五',
  'user-004': '赵六',
  'user-005': '钱七',
};

// ============= 组件Props =============

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
}

interface ProcessDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  processData: LYProcessResponse | null;
  onOpen?: () => void;
  onEdit?: () => void;
  onRun?: () => void;
  onDelete?: () => void;
  // 导航相关
  dataList?: LYProcessResponse[];
  onNavigate?: (process: LYProcessResponse) => void;
  // 分页相关 - 用于自动翻页
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => Promise<LYProcessResponse[] | void>;
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
                maxLength={2000}
                showClear
                maxCount={2000}
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
  dataList = [],
  onNavigate,
  pagination,
  onPageChange,
}: ProcessDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('detail');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadVersionModalVisible, setUploadVersionModalVisible] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('processDetailDrawerWidth');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const [versionData, setVersionData] = useState<VersionDetailData[]>(initialMockVersionData);
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
    localStorage.setItem('processDetailDrawerWidth', String(drawerWidth));
  }, [drawerWidth]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 导航逻辑
  const currentIndex = useMemo(() => {
    if (!processData || dataList.length === 0) return -1;
    return dataList.findIndex(item => item.id === processData.id);
  }, [processData, dataList]);

  // 判断是否可以导航（考虑分页）
  const canGoPrev = useMemo(() => {
    if (currentIndex > 0) return true;
    if (pagination && pagination.currentPage > 1) return true;
    return false;
  }, [currentIndex, pagination]);

  const canGoNext = useMemo(() => {
    if (currentIndex >= 0 && currentIndex < dataList.length - 1) return true;
    if (pagination && pagination.currentPage < pagination.totalPages) return true;
    return false;
  }, [currentIndex, dataList.length, pagination]);

  const [isNavigating, setIsNavigating] = useState(false);

  const handlePrev = useCallback(async () => {
    if (isNavigating) return;
    
    if (currentIndex > 0 && onNavigate) {
      onNavigate(dataList[currentIndex - 1]);
    } else if (pagination && pagination.currentPage > 1 && onPageChange) {
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage - 1);
        if (newList && newList.length > 0 && onNavigate) {
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
      onNavigate(dataList[currentIndex + 1]);
    } else if (pagination && pagination.currentPage < pagination.totalPages && onPageChange) {
      setIsNavigating(true);
      try {
        const newList = await onPageChange(pagination.currentPage + 1);
        if (newList && newList.length > 0 && onNavigate) {
          onNavigate(newList[0]);
        }
      } finally {
        setIsNavigating(false);
      }
    }
  }, [currentIndex, dataList, onNavigate, pagination, onPageChange, isNavigating]);


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


  // 处理删除版本
  const handleDeleteVersion = useCallback((version: VersionDetailData) => {
    // 已发布的版本不允许删除
    if (version.is_active) {
      Toast.warning(t('development.processDevelopment.detail.versionList.cannotDeletePublished'));
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
        <a href={version.usage_instructions_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center' }}>
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
            <Space spacing={8}>
              {(dataList.length > 1 || (pagination && pagination.totalPages > 1)) && (
                <>
                  <Tooltip content={t('common.previous')}>
                    <Button icon={<IconChevronLeft />} theme="borderless" size="small" disabled={!canGoPrev || isNavigating} onClick={handlePrev} loading={isNavigating} />
                  </Tooltip>
                  <Tooltip content={t('common.next')}>
                    <Button icon={<IconChevronRight />} theme="borderless" size="small" disabled={!canGoNext || isNavigating} onClick={handleNext} loading={isNavigating} />
                  </Tooltip>
                  <Divider layout="vertical" className="process-detail-drawer-header-divider" />
                </>
              )}
              <Tooltip content={t('development.processDevelopment.actions.openProcess')}>
                <Button icon={<IconExternalOpenStroked />} theme="borderless" size="small" onClick={onOpen} />
              </Tooltip>
              <Tooltip content={t('common.edit')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
              </Tooltip>
              <Tooltip content={t('common.run')}>
                <Button icon={<IconPlayCircle />} theme="borderless" size="small" onClick={onRun} />
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
          {sortedVersionData.length === 0 ? (
            // 版本列表空状态
            <div className="process-detail-drawer-version-empty">
              <EmptyState 
                description={t('development.processDevelopment.detail.empty.noVersions')} 
                size={120}
              />
              <Button
                icon={<IconUpload />}
                theme="solid"
                className="process-detail-drawer-version-empty-upload-btn"
                onClick={() => setUploadVersionModalVisible(true)}
              >
                {t('development.processDevelopment.detail.versionList.uploadVersion')}
              </Button>
            </div>
          ) : (
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
                      <Tag 
                        color={version.is_active ? 'green' : 'grey'} 
                        type="light"
                        size="small"
                      >
                        {version.is_active 
                          ? t('development.processDevelopment.detail.versionList.published') 
                          : t('development.processDevelopment.detail.versionList.unpublished')
                        }
                      </Tag>
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
                      {selectedVersion.is_active ? (
                        <Tooltip content={t('development.processDevelopment.detail.versionList.cannotDeletePublished')}>
                          <Button
                            icon={<IconDeleteStroked />}
                            type="tertiary"
                            className="process-detail-drawer-version-detail-delete-btn"
                            disabled
                            onClick={() => handleDeleteVersion(selectedVersion)}
                          >
                            {t('development.processDevelopment.detail.versionList.deleteVersion')}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button
                          icon={<IconDeleteStroked />}
                          type="tertiary"
                          className="process-detail-drawer-version-detail-delete-btn"
                          onClick={() => handleDeleteVersion(selectedVersion)}
                        >
                          {t('development.processDevelopment.detail.versionList.deleteVersion')}
                        </Button>
                      )}
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
                    <EmptyState 
                      description={t('development.processDevelopment.detail.empty.noVersions')} 
                      size={100}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
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
