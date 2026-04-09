import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Tag,
  Descriptions,
  Tabs,
  TabPane,
  Divider,
  Tooltip,
  Space,
  Toast,
  Modal,
  TextArea,
} from '@douyinfe/semi-ui';
import type { LYProcessResponse, LYProcessVersionResponse } from '@/api';
import UploadVersionModal from '../UploadVersionModal';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import './index.less';
import { ExternalLink, HelpCircle, Link, Pencil, PlayCircle, Trash2, Upload } from 'lucide-react';

const { Title, Text } = Typography;

// ============= Mock数据生成 - 基于API类型 =============

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

// 生成UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 版本Mock数据生成
const generateMockVersionData = (): VersionDetailData[] => {
  const versions = [
    { version: '1.0.0', note: '初始版本，实现基础功能', isActive: false },
    { version: '1.1.0', note: '优化性能，修复已知问题', isActive: true },
    { version: '1.2.0', note: '新增批量处理功能', isActive: true },
    { version: '2.0.0', note: '重构核心逻辑，提升稳定性', isActive: true },
    { version: '2.1.0', note: '新增异常处理机制', isActive: false },
  ];

  return versions.map((v, index) => ({
    key: index + 1,
    id: generateUUID(),
    version: v.version,
    process_id: generateUUID(),
    is_active: v.isActive,
    status: v.isActive ? 'PUBLISHED' : 'UNPUBLISHED',
    source_code: `process_v${v.version.replace(/\./g, '_')}`,
    package_file_id: generateUUID(),
    package_size: Math.floor(Math.random() * 5000000) + 500000,
    package_checksum: `sha256:${generateUUID().replace(/-/g, '')}`,
    version_note: v.note,
    usage_note: `使用说明：版本${v.version}的操作指引`,
    creator_id: ['user-001', 'user-002', 'user-003'][index % 3],
    created_at: new Date(Date.now() - (versions.length - index) * 7 * 24 * 60 * 60 * 1000).toISOString(),
    publish_time: v.isActive ? new Date(Date.now() - (versions.length - index) * 2 * 24 * 60 * 60 * 1000).toISOString() : null,
    publisher_id: v.isActive ? 'user-001' : null,
    client_version: '3.2.1',
    os: 'Windows 10',
    architecture: 'x86_64',
    file_name: `process_package_v${v.version}.zip`,
    usage_instructions_url: 'https://docs.example.com/usage',
    development_environment: 'Win10 | X86',
    inputs: [
      { name: 'inputParam1', type: '文本' as const, value: '默认值', description: '输入参数1的描述' },
      { name: 'inputParam2', type: '布尔' as const, value: 'true', description: '是否启用某功能' },
    ],
    outputs: [
      { name: 'outputResult', type: '文本' as const, value: '', description: '输出结果' },
      { name: 'outputStatus', type: '数值' as const, value: '0', description: '执行状态码' },
    ],
  }));
};

const initialMockVersionData: VersionDetailData[] = generateMockVersionData();

// 模拟创建者ID到详细信息的映射
const mockCreatorInfoMap: Record<string, { name: string; department?: string; role?: string; email?: string }> = {
  'user-001': { name: 'John Smith', department: 'R&D Dept', role: 'Senior Engineer', email: 'john.smith@example.com' },
  'user-002': { name: 'Jane Doe', department: 'Product Dept', role: 'Product Manager', email: 'jane.doe@example.com' },
  'user-003': { name: 'Mike Wang', department: 'Ops Dept', role: 'Ops Engineer', email: 'mike.wang@example.com' },
  'user-004': { name: 'David Zhao', department: 'QA Dept', role: 'QA Engineer', email: 'david.zhao@example.com' },
  'user-005': { name: 'Chris Qian', department: 'R&D Dept', role: 'Architect', email: 'chris.qian@example.com' },
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
  dataList?: LYProcessResponse[];
  onNavigate?: (process: LYProcessResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  context?: 'development' | 'scheduling';
  onScrollToRow?: (id: string) => void;
  initialTab?: string;
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
                <Button size="small" theme="solid" type="primary" onClick={handleConfirmEdit}>
                  {t('common.confirm')}
                </Button>
                <Button size="small" theme="borderless" type="tertiary" onClick={handleCancelEdit}>
                  {t('common.cancel')}
                </Button>
              </Space>
            </div>
          ) : (
            <div className="process-detail-drawer-variable-card-desc-row">
              <Tooltip content={variable.description || '-'} position="top" style={{ maxWidth: 400, wordBreak: 'break-word' }}>
                <Text className="process-detail-drawer-variable-card-value" onDoubleClick={handleStartEdit}>
                  {variable.description || '-'}
                </Text>
              </Tooltip>
              <Tooltip content={t('development.processDevelopment.detail.variable.editDescTip')}>
                <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" size="small" type="tertiary" className="process-detail-drawer-variable-card-edit-btn" onClick={handleStartEdit} />
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
        <VariableCard key={index} variable={variable} index={index} onDescriptionChange={onDescriptionChange} />
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
  context = 'development',
  onScrollToRow,
  initialTab = 'detail',
}: ProcessDetailDrawerProps) => {
  const isSchedulingContext = context === 'scheduling';
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [uploadVersionModalVisible, setUploadVersionModalVisible] = useState(false);
  const [versionData, setVersionData] = useState<VersionDetailData[]>(initialMockVersionData);
  const { canManage } = useCollaboratorPermission('PROCESS', processData?.id);

  // 版本数据按版本号降序排列
  const sortedVersionData = useMemo(() => {
    const data = [...versionData];
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

  // 计算最新激活版本（已发布版本中 publish_time 最新的）
  const latestActiveVersionId = useMemo(() => {
    const activeVersions = sortedVersionData.filter(v => v.is_active && v.publish_time);
    if (activeVersions.length === 0) return null;
    activeVersions.sort((a, b) => new Date(b.publish_time!).getTime() - new Date(a.publish_time!).getTime());
    return activeVersions[0].id;
  }, [sortedVersionData]);

  // 处理删除版本
  const handleDeleteVersion = useCallback((version: VersionDetailData) => {
    if (version.is_active) {
      Toast.warning(t('development.processDevelopment.detail.versionList.cannotDeletePublished'));
      return;
    }
    Modal.confirm({
      title: t('development.processDevelopment.detail.versionList.deleteConfirmTitle'),
      content: t('development.processDevelopment.detail.versionList.deleteConfirmContent', { version: version.version }),
      icon: <Trash2 size={16} strokeWidth={2} />,
      okType: 'danger',
      onOk: () => {
        setVersionData(prevData => prevData.filter(v => v.id !== version.id));
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
    return sortedVersionData.length > 0 ? sortedVersionData[0] : null;
  }, [selectedVersionId, sortedVersionData]);

  useEffect(() => {
    if (sortedVersionData.length > 0 && !selectedVersionId) {
      setSelectedVersionId(sortedVersionData[0].id);
    }
  }, [sortedVersionData, selectedVersionId]);

  const prevVisibleRef = useRef(false);
  useEffect(() => {
    if (visible && !prevVisibleRef.current) setActiveTab(initialTab);
    prevVisibleRef.current = visible;
  }, [visible, initialTab]);

  // 关闭时重置
  const handleClose = () => {
    setActiveTab('detail');
    onClose();
  };

  if (!processData) return null;

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return dateStr.replace('T', ' ').substring(0, 19);
  };

  const getCreatorInfo = (creatorId: string) => {
    return mockCreatorInfoMap[creatorId] || null;
  };

  const creatorInfo = getCreatorInfo(processData.creator_id);

  const descriptionData = [
    { key: t('development.processDevelopment.fields.processName'), value: processData.name },
    { key: t('common.description'), value: <ExpandableText text={processData.description} maxLines={3} /> },
    { key: t('common.creator'), value: creatorInfo ? <UserNameWithCard name={creatorInfo.name} userId={processData.creator_id} department={creatorInfo.department} role={creatorInfo.role} email={creatorInfo.email} /> : '-' },
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

  const getVersionDescriptionData = (version: VersionDetailData) => [
    { key: t('development.processDevelopment.detail.versionDetail.processVersion'), value: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>{version.version}{version.id === latestActiveVersionId && <Tag color="green" type="light" size="small">{t('development.processDevelopment.detail.versionList.activeVersion')}</Tag>}</span> },
    { key: t('development.processDevelopment.detail.versionDetail.versionFileName'), value: version.file_name || '-' },
    { key: t('development.processDevelopment.detail.versionDetail.uploader'), value: (() => { const info = getCreatorInfo(version.creator_id); return info ? <UserNameWithCard name={info.name} userId={version.creator_id} department={info.department} role={info.role} email={info.email} /> : '-'; })() },
    { key: t('development.processDevelopment.detail.versionDetail.uploadTime'), value: formatDateTime(version.created_at) },
    { key: t('development.processDevelopment.detail.versionDetail.versionNote'), value: version.version_note || '-' },
    {
      key: t('development.processDevelopment.detail.versionDetail.usageInstructions'),
      value: version.usage_instructions_url ? (
        <a href={version.usage_instructions_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <Link size={16} strokeWidth={2} />
          {t('development.processDevelopment.detail.versionDetail.viewInstructions')}
        </a>
      ) : (
        t('development.processDevelopment.detail.versionDetail.noDescription')
      ),
    },
    { key: t('development.processDevelopment.detail.versionDetail.clientVersion'), value: version.client_version || '-' },
    { key: t('development.processDevelopment.detail.versionDetail.developmentEnvironment'), value: version.development_environment || 'Win10 | X86' },
  ];

  // 额外操作按钮
  const extraActions = (
    <>
      {!isSchedulingContext && onOpen && (
        <Tooltip content={t('development.processDevelopment.actions.openProcess')}>
          <Button icon={<ExternalLink size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onOpen} />
        </Tooltip>
      )}
      {!isSchedulingContext && onEdit && (
        <Tooltip content={t('common.edit')}>
          <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onEdit} />
        </Tooltip>
      )}
      <Tooltip content={t('common.run')}>
        <Button icon={<PlayCircle size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onRun} />
      </Tooltip>
      {!isSchedulingContext && onDelete && (
        <Tooltip content={t('common.delete')}>
          <Button icon={<Trash2 size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onDelete} />
        </Tooltip>
      )}
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={handleClose}
      title={processData.name}
      dataList={dataList}
      currentId={processData.id}
      getId={(item) => item.id}
      onNavigate={(item) => onNavigate?.(item)}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      collaboratorProps={{
        assetType: 'PROCESS',
        assetId: processData.id,
        context,
        canManage,
      }}
      defaultWidth={900}
      minWidth={576}
      storageKey="processDetailDrawerWidth"
      className="process-detail-drawer"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="process-detail-drawer-tabs">
        <TabPane tab={t('development.processDevelopment.detail.tabs.detail')} itemKey="detail">
          <div className="process-detail-drawer-tab-content">
            <Descriptions data={descriptionData} align="left" />
          </div>
        </TabPane>

        <TabPane tab={t('development.processDevelopment.detail.tabs.versions')} itemKey="versions">
          {sortedVersionData.length === 0 ? (
            <div className="process-detail-drawer-version-empty">
              <EmptyState description={t('development.processDevelopment.detail.empty.noVersions')} size={120} />
              <Button icon={<Upload size={16} strokeWidth={2} />} theme="solid" className="process-detail-drawer-version-empty-upload-btn" onClick={() => setUploadVersionModalVisible(true)}>
                {t('development.processDevelopment.detail.versionList.uploadVersion')}
              </Button>
            </div>
          ) : (
            <div className="process-detail-drawer-version-layout">
              <div className="process-detail-drawer-version-sidebar">
                <div className="process-detail-drawer-version-sidebar-header">
                  <Text className="process-detail-drawer-version-sidebar-title">
                    {t('development.processDevelopment.detail.versionList.title')}
                  </Text>
                  <Tooltip content={t('development.processDevelopment.detail.versionList.titleTooltip')}>
                    <HelpCircle size={16} strokeWidth={2} />
                  </Tooltip>
                </div>
                <Button icon={<Upload size={16} strokeWidth={2} />} theme="solid" className="process-detail-drawer-version-sidebar-upload-btn" onClick={() => setUploadVersionModalVisible(true)}>
                  {t('development.processDevelopment.detail.versionList.uploadVersion')}
                </Button>
                <div className="process-detail-drawer-version-sidebar-list">
                  {sortedVersionData.map((version) => {
                    const isLatestActive = version.id === latestActiveVersionId;
                    return (
                    <div
                      key={version.id}
                      className={`process-detail-drawer-version-sidebar-item ${selectedVersion?.id === version.id ? 'process-detail-drawer-version-sidebar-item--selected' : ''}`}
                      onClick={() => setSelectedVersionId(version.id)}
                    >
                      <Space spacing={6} align="center">
                        <Text className="process-detail-drawer-version-sidebar-item-version">{version.version}</Text>
                        {isLatestActive && (
                          <Tooltip content={t('development.processDevelopment.detail.versionList.activeVersion')}>
                            <span className="process-detail-drawer-version-sidebar-item-active-dot" />
                          </Tooltip>
                        )}
                      </Space>
                      <Tag color={version.is_active ? 'green' : 'grey'} type="light" size="small">
                        {version.is_active ? t('development.processDevelopment.detail.versionList.published') : t('development.processDevelopment.detail.versionList.unpublished')}
                      </Tag>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div className="process-detail-drawer-version-detail">
                {selectedVersion ? (
                  <>
                    <div className="process-detail-drawer-version-detail-section">
                      <Text className="process-detail-drawer-version-detail-section-title">
                        {t('development.processDevelopment.detail.versionDetail.basicInfo')}
                      </Text>
                      <Descriptions data={getVersionDescriptionData(selectedVersion)} align="left" />
                      {selectedVersion.is_active ? (
                        <Tooltip content={t('development.processDevelopment.detail.versionList.cannotDeletePublished')}>
                          <Button icon={<Trash2 size={16} strokeWidth={2} />} type="tertiary" className="process-detail-drawer-version-detail-delete-btn" disabled onClick={() => handleDeleteVersion(selectedVersion)}>
                            {t('development.processDevelopment.detail.versionList.deleteVersion')}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button icon={<Trash2 size={16} strokeWidth={2} />} type="tertiary" className="process-detail-drawer-version-detail-delete-btn" onClick={() => handleDeleteVersion(selectedVersion)}>
                          {t('development.processDevelopment.detail.versionList.deleteVersion')}
                        </Button>
                      )}
                    </div>

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
                                  ? { ...v, inputs: v.inputs?.map((input, i) => (i === index ? { ...input, description } : input)) }
                                  : v
                              )
                            );
                          }}
                        />
                      </div>
                    )}

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
                                  ? { ...v, outputs: v.outputs?.map((output, i) => (i === index ? { ...output, description } : output)) }
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
                    <EmptyState description={t('development.processDevelopment.detail.empty.noVersions')} size={100} />
                  </div>
                )}
              </div>
            </div>
          )}
        </TabPane>
      </Tabs>

      <UploadVersionModal
        visible={uploadVersionModalVisible}
        onCancel={() => setUploadVersionModalVisible(false)}
        processData={processData}
        onSuccess={() => {}}
      />
    </DetailDrawerWrapper>
  );
};

export default ProcessDetailDrawer;
