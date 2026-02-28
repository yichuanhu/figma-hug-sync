import { useState, useMemo, useCallback, useEffect } from 'react';
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
import {
  IconEditStroked,
  IconPlayCircle,
  IconDeleteStroked,
  IconExternalOpenStroked,
  IconUpload,
  IconHelpCircleStroked,
  IconLink,
} from '@douyinfe/semi-icons';
import type { LYProcessResponse, LYProcessVersionResponse } from '@/api';
import UploadVersionModal from '../UploadVersionModal';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import './index.less';

const { Title, Text } = Typography;

// ============= Mock数据生成 =============

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

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockVersionData = (): VersionDetailData[] => {
  const versions = [
    { version: '1.0.0', note: '初始版本，实现基础功能', isActive: false },
    { version: '1.1.0', note: '优化性能，修复已知问题', isActive: false },
    { version: '1.2.0', note: '新增批量处理功能', isActive: false },
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
    publish_time: v.isActive ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : null,
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
  dataList?: LYProcessResponse[];
  onNavigate?: (process: LYProcessResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
}

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
          <Tag color="blue" type="light" size="small">{variable.type}</Tag>
          <Text strong className="process-detail-drawer-variable-card-name">{variable.name}</Text>
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
          <Text type="tertiary" className="process-detail-drawer-variable-card-label">{t('common.description')}</Text>
          {isEditing ? (
            <div className="process-detail-drawer-variable-card-edit">
              <TextArea
                value={editValue}
                onChange={(value) => setEditValue(value)}
                autoFocus
                placeholder={t('development.processDevelopment.detail.variable.editPlaceholder')}
                onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); handleCancelEdit(); } }}
                maxLength={2000}
                showClear
                maxCount={2000}
                autosize={{ minRows: 2, maxRows: 6 }}
              />
              <Space spacing={8} className="process-detail-drawer-variable-card-edit-actions">
                <Button size="small" theme="solid" type="primary" onClick={handleConfirmEdit}>{t('common.confirm')}</Button>
                <Button size="small" theme="borderless" type="tertiary" onClick={handleCancelEdit}>{t('common.cancel')}</Button>
              </Space>
            </div>
          ) : (
            <div className="process-detail-drawer-variable-card-desc-row">
              <Tooltip content={variable.description || '-'} position="top" style={{ maxWidth: 400, wordBreak: 'break-word' }}>
                <Text className="process-detail-drawer-variable-card-value" onDoubleClick={handleStartEdit}>{variable.description || '-'}</Text>
              </Tooltip>
              <Tooltip content={t('development.processDevelopment.detail.variable.editDescTip')}>
                <Button icon={<IconEditStroked />} theme="borderless" size="small" type="tertiary" className="process-detail-drawer-variable-card-edit-btn" onClick={handleStartEdit} />
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

const VariableCardList = ({ data, onDescriptionChange }: VariableCardListProps) => (
  <div className="process-detail-drawer-variable-card-list">
    {data.map((variable, index) => (
      <VariableCard key={index} variable={variable} index={index} onDescriptionChange={onDescriptionChange} />
    ))}
  </div>
);

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
  onScrollToRow,
}: ProcessDetailDrawerProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('detail');
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [uploadVersionModalVisible, setUploadVersionModalVisible] = useState(false);
  const [versionData, setVersionData] = useState<VersionDetailData[]>(initialMockVersionData);

  const sortedVersionData = useMemo(() => {
    const data = [...versionData];
    data.sort((a, b) => {
      const vA = a.version.split('.').map(Number);
      const vB = b.version.split('.').map(Number);
      for (let i = 0; i < Math.max(vA.length, vB.length); i++) {
        if ((vB[i] || 0) !== (vA[i] || 0)) return (vB[i] || 0) - (vA[i] || 0);
      }
      return 0;
    });
    return data;
  }, [versionData]);

  const handleDeleteVersion = useCallback((version: VersionDetailData) => {
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
        setVersionData(prev => prev.filter(v => v.id !== version.id));
        if (selectedVersionId === version.id) setSelectedVersionId(null);
        Toast.success(t('development.processDevelopment.detail.versionList.deleteSuccess', { version: version.version }));
      },
    });
  }, [t, selectedVersionId]);

  const selectedVersion = useMemo(() => {
    if (selectedVersionId) return sortedVersionData.find((v) => v.id === selectedVersionId) || null;
    return sortedVersionData.length > 0 ? sortedVersionData[0] : null;
  }, [selectedVersionId, sortedVersionData]);

  useEffect(() => {
    if (sortedVersionData.length > 0 && !selectedVersionId) {
      setSelectedVersionId(sortedVersionData[0].id);
    }
  }, [sortedVersionData, selectedVersionId]);

  const handleClose = () => {
    setActiveTab('detail');
    onClose();
  };

  if (!processData) return null;

  const formatDateTime = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    return dateStr.replace('T', ' ').substring(0, 19);
  };

  const getCreatorName = (creatorId: string) => mockCreatorNameMap[creatorId] || creatorId;
  const creatorName = getCreatorName(processData.creator_id);

  const descriptionData = [
    { key: t('development.processDevelopment.fields.processName'), value: processData.name },
    { key: t('common.description'), value: processData.description || '-' },
    { key: t('common.creator'), value: creatorName },
    { key: t('common.createTime'), value: formatDateTime(processData.created_at) },
    { key: t('common.updateTime'), value: formatDateTime(processData.updated_at) },
    { key: t('common.status'), value: <Tag color={statusConfig[processData.status]?.color || 'grey'} type="light">{t(statusConfig[processData.status]?.i18nKey || 'development.processDevelopment.status.developing')}</Tag> },
  ];

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
      ) : t('development.processDevelopment.detail.versionDetail.noDescription'),
    },
    { key: t('development.processDevelopment.detail.versionDetail.clientVersion'), value: version.client_version || '-' },
    { key: t('development.processDevelopment.detail.versionDetail.developmentEnvironment'), value: version.development_environment || 'Win10 | X86' },
  ];

  const extraActions = (
    <>
      {onOpen && (
        <Tooltip content={t('development.processDevelopment.actions.openProcess')}>
          <Button icon={<IconExternalOpenStroked />} theme="borderless" size="small" onClick={onOpen} />
        </Tooltip>
      )}
      {onEdit && (
        <Tooltip content={t('common.edit')}>
          <Button icon={<IconEditStroked />} theme="borderless" size="small" onClick={onEdit} />
        </Tooltip>
      )}
      <Tooltip content={t('common.run')}>
        <Button icon={<IconPlayCircle />} theme="borderless" size="small" onClick={onRun} />
      </Tooltip>
      {onDelete && (
        <Tooltip content={t('common.delete')}>
          <Button icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} theme="borderless" size="small" onClick={onDelete} />
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
      defaultWidth={900}
      minWidth={576}
      storageKey="devProcessDetailDrawerWidth"
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
              <Button icon={<IconUpload />} theme="solid" className="process-detail-drawer-version-empty-upload-btn" onClick={() => setUploadVersionModalVisible(true)}>
                {t('development.processDevelopment.detail.versionList.uploadVersion')}
              </Button>
            </div>
          ) : (
            <div className="process-detail-drawer-version-layout">
              <div className="process-detail-drawer-version-sidebar">
                <div className="process-detail-drawer-version-sidebar-header">
                  <Text className="process-detail-drawer-version-sidebar-title">{t('development.processDevelopment.detail.versionList.title')}</Text>
                  <Tooltip content={t('development.processDevelopment.detail.versionList.titleTooltip')}>
                    <IconHelpCircleStroked style={{ color: 'var(--semi-color-text-2)', fontSize: 14 }} />
                  </Tooltip>
                </div>
                <Button icon={<IconUpload />} theme="solid" className="process-detail-drawer-version-sidebar-upload-btn" onClick={() => setUploadVersionModalVisible(true)}>
                  {t('development.processDevelopment.detail.versionList.uploadVersion')}
                </Button>
                <div className="process-detail-drawer-version-sidebar-list">
                  {sortedVersionData.map((version) => (
                    <div key={version.id} className={`process-detail-drawer-version-sidebar-item ${selectedVersion?.id === version.id ? 'process-detail-drawer-version-sidebar-item--selected' : ''}`} onClick={() => setSelectedVersionId(version.id)}>
                      <Text className="process-detail-drawer-version-sidebar-item-version">{version.version}</Text>
                      <Tag color={version.is_active ? 'green' : 'grey'} type="light" size="small">
                        {version.is_active ? t('development.processDevelopment.detail.versionList.published') : t('development.processDevelopment.detail.versionList.unpublished')}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
              <div className="process-detail-drawer-version-detail">
                {selectedVersion ? (
                  <>
                    <div className="process-detail-drawer-version-detail-section">
                      <Text className="process-detail-drawer-version-detail-section-title">{t('development.processDevelopment.detail.versionDetail.basicInfo')}</Text>
                      <Descriptions data={getVersionDescriptionData(selectedVersion)} align="left" />
                      {selectedVersion.is_active ? (
                        <Tooltip content={t('development.processDevelopment.detail.versionList.cannotDeletePublished')}>
                          <Button icon={<IconDeleteStroked />} type="tertiary" className="process-detail-drawer-version-detail-delete-btn" disabled>{t('development.processDevelopment.detail.versionList.deleteVersion')}</Button>
                        </Tooltip>
                      ) : (
                        <Button icon={<IconDeleteStroked />} type="tertiary" className="process-detail-drawer-version-detail-delete-btn" onClick={() => handleDeleteVersion(selectedVersion)}>{t('development.processDevelopment.detail.versionList.deleteVersion')}</Button>
                      )}
                    </div>
                    {selectedVersion.inputs && selectedVersion.inputs.length > 0 && (
                      <div className="process-detail-drawer-version-detail-section">
                        <Text className="process-detail-drawer-version-detail-section-title">{t('development.processDevelopment.detail.versionDetail.processInput')}</Text>
                        <VariableCardList data={selectedVersion.inputs} onDescriptionChange={(index, description) => { setVersionData(prev => prev.map(v => v.id === selectedVersion.id ? { ...v, inputs: v.inputs?.map((input, i) => i === index ? { ...input, description } : input) } : v)); }} />
                      </div>
                    )}
                    {selectedVersion.outputs && selectedVersion.outputs.length > 0 && (
                      <div className="process-detail-drawer-version-detail-section">
                        <Text className="process-detail-drawer-version-detail-section-title">{t('development.processDevelopment.detail.versionDetail.processOutput')}</Text>
                        <VariableCardList data={selectedVersion.outputs} onDescriptionChange={(index, description) => { setVersionData(prev => prev.map(v => v.id === selectedVersion.id ? { ...v, outputs: v.outputs?.map((output, i) => i === index ? { ...output, description } : output) } : v)); }} />
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

      <UploadVersionModal visible={uploadVersionModalVisible} onCancel={() => setUploadVersionModalVisible(false)} processData={processData} onSuccess={() => {}} />
    </DetailDrawerWrapper>
  );
};

export default ProcessDetailDrawer;
