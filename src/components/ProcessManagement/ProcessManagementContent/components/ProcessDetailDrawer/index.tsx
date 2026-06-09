import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { IconDeleteStroked } from '@douyinfe/semi-icons';
import type { LYProcessResponse, LYProcessVersionResponse, LYProcessDependency } from '@/api';
import UploadVersionModal from '../UploadVersionModal';
import EmptyState from '@/components/EmptyState';
import DetailSkeleton from '@/components/DetailSkeleton';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import ExpandableText from '@/components/ExpandableText';
import DepartmentPath from '@/components/DepartmentPath';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';
import './index.less';
import { ExternalLink, HelpCircle, Link, Link2, Pencil, PlayCircle, Trash2, Upload } from 'lucide-react';
import DependencyTab from './components/DependencyTab';
import EffortTab from './components/EffortTab';
import RoiConfigTab from './components/RoiConfigTab';
import DocumentsTab from './components/DocumentsTab';

import {
  getProcessBasicInfo,
  getUserById,
  overrideDevelopersOnVersionUpload,
  subscribeBasicInfo,
} from '@/mocks/processBasicInfo';
import { useProcessBasicInfoPermission } from '@/hooks/useProcessBasicInfoPermission';
import { useProcessLifecyclePermission } from '@/hooks/useProcessLifecyclePermission';
import {
  FIELD_LABEL as LIFECYCLE_FIELD_LABEL,
  getProcessLifecycleLedger,
  subscribeLifecycleLedger,
  type LifecycleField,
} from '@/mocks/processLifecycleLedger';




const { Title, Text } = Typography;

// ============= Mock数据生成 - 基于API类型 =============

// 参数变量类型定义
interface ProcessVariable {
  name: string;
  type: '文本' | '布尔' | '数值';
  value?: string;
  description?: string;
  isBusinessVolume?: boolean;
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
      { name: 'outputStatus', type: '数值' as const, value: '0', description: '执行状态码', isBusinessVolume: true },
      { name: 'processedCount', type: '数值' as const, value: '0', description: '本次处理的业务条数', isBusinessVolume: true },
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
  onDependenciesChange?: (processId: string, deps: LYProcessDependency[]) => void;
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
  showBusinessVolume?: boolean;
  isBusinessVolume?: boolean;
  onBusinessVolumeChange?: (index: number, checked: boolean) => void;
}

const VariableCard = ({
  variable,
  index,
  onDescriptionChange,
  showBusinessVolume,
  isBusinessVolume,
  onBusinessVolumeChange,
}: VariableCardProps) => {
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
        {showBusinessVolume && isBusinessVolume && (
          <Tooltip content="该变量已在客户端开发流程时声明为业务量变量，可在 ROI 配置 PARAM 模式中作为单位业务量来源">
            <Tag color="blue" type="light" size="small">业务量</Tag>
          </Tooltip>
        )}
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
  showBusinessVolume?: boolean;
}

const VariableCardList = ({
  data,
  onDescriptionChange,
  showBusinessVolume,
}: VariableCardListProps) => {
  return (
    <div className="process-detail-drawer-variable-card-list">
      {data.map((variable, index) => (
        <VariableCard
          key={index}
          variable={variable}
          index={index}
          onDescriptionChange={onDescriptionChange}
          showBusinessVolume={showBusinessVolume}
          isBusinessVolume={!!variable.isBusinessVolume}
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
  context = 'development',
  onScrollToRow,
  initialTab = 'detail',
  onDependenciesChange,
}: ProcessDetailDrawerProps) => {
  const isSchedulingContext = context === 'scheduling';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [requirementBrief, setRequirementBrief] = useState<{ id: string; title: string; req_no?: string } | null>(null);
  const [uploadVersionModalVisible, setUploadVersionModalVisible] = useState(false);
  const [versionData, setVersionData] = useState<VersionDetailData[]>(initialMockVersionData);
  const { canManage } = useCollaboratorPermission('PROCESS', processData?.id);
  const [documentCount, setDocumentCount] = useState(0);

  // 基本信息（STORY-002-PG-RESPONSIBILITY）
  const basicInfoPermission = useProcessBasicInfoPermission(processData?.id);
  const [basicInfoTick, setBasicInfoTick] = useState(0);
  useEffect(() => {
    if (!processData?.id) return;
    return subscribeBasicInfo(processData.id, () => setBasicInfoTick((v) => v + 1));
  }, [processData?.id]);
  const basicInfo = useMemo(
    () => (processData?.id ? getProcessBasicInfo(processData.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processData?.id, basicInfoTick],
  );

  // 生命周期台账（STORY-003-PG-LIFECYCLE-LEDGER）
  const lifecyclePermission = useProcessLifecyclePermission(processData?.id);
  const [lifecycleTick, setLifecycleTick] = useState(0);
  useEffect(() => {
    if (!processData?.id) return;
    const unsub = subscribeLifecycleLedger(processData.id, () => setLifecycleTick((v) => v + 1));
    return () => { unsub(); };
  }, [processData?.id]);
  const lifecycleLedger = useMemo(
    () => (processData?.id ? getProcessLifecycleLedger(processData.id) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [processData?.id, lifecycleTick],
  );

  // 异步加载「关联需求」brief（用于在基本信息中显示需求编号/标题）
  useEffect(() => {
    const reqId = processData?.requirement_id;
    if (!reqId) {
      setRequirementBrief(null);
      return;
    }
    let cancelled = false;
    import('@/pages/Requirements/RequirementsProjects/mockData').then(({ fetchRequirementBriefByIds }) =>
      fetchRequirementBriefByIds([reqId]).then((list) => {
        if (cancelled) return;
        setRequirementBrief(list[0] || null);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [processData?.requirement_id]);



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
icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
content: t('development.processDevelopment.detail.versionList.deleteConfirmContent', { version: version.version }),      okType: 'danger',
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


  const selectedVersionIdResolved = selectedVersionId ?? sortedVersionData[0]?.id ?? null;

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

  const basicGroupData = [
    { key: t('development.processDevelopment.fields.processName'), value: processData.name },
    { key: t('common.description'), value: <ExpandableText text={processData.description} maxLines={3} /> },
    {
      key: t('common.status'),
      value: (
        <Tag color={statusConfig[processData.status]?.color || 'grey'} type="light">
          {t(statusConfig[processData.status]?.i18nKey || 'development.processDevelopment.status.developing')}
        </Tag>
      ),
    },
    { key: t('common.creator'), value: creatorInfo ? <UserNameWithCard name={creatorInfo.name} userId={processData.creator_id} department={creatorInfo.department} role={creatorInfo.role} email={creatorInfo.email} /> : '-' },
    { key: t('common.owner'), value: processData.owner_name ? <UserNameWithCard name={processData.owner_name} userId={processData.owner_id || ''} /> : '-' },
    {
      key: t('common.owningDepartment'),
      value: <DepartmentPath departmentId={processData.owning_department_id} />,
    },
    {
      key: t('development.processDevelopment.createModal.fields.osLabel'),
      value: processData.os ? <Text>{processData.os}</Text> : <Text type="tertiary">-</Text>,
    },
    {
      key: t('development.processDevelopment.fields.linkedRequirement'),
      value: (() => {
        const reqId = processData.requirement_id;
        if (!reqId) return <Text type="tertiary">-</Text>;
        const label = requirementBrief
          ? (requirementBrief.req_no ? `[${requirementBrief.req_no}] ${requirementBrief.title}` : requirementBrief.title)
          : reqId;
        return (
          <Tag
            color="blue"
            type="light"
            prefixIcon={<Link2 size={12} strokeWidth={2} />}
            style={{ maxWidth: 240, cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/requirements/list', { state: { openRequirementId: reqId } });
            }}
          >
            <Text
              ellipsis={{ showTooltip: { opts: { content: label } } }}
              size="small"
              style={{ maxWidth: 210, color: 'inherit' }}
            >
              {label}
            </Text>
          </Tag>
        );
      })(),
    },
    { key: t('common.createTime'), value: formatDateTime(processData.created_at) },
    { key: t('common.updateTime'), value: formatDateTime(processData.updated_at) },
  ];

  const renderPeopleValue = (ids: string[]) => {
    if (ids.length === 0) return <Text type="tertiary">-</Text>;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {ids.map((uid, i) => {
          const u = getUserById(uid);
          return (
            <span key={uid} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {u ? (
                <UserNameWithCard name={u.name} userId={u.id} department={u.department} role={u.role} email={u.email} />
              ) : (
                uid
              )}
              {i < ids.length - 1 && <Text type="tertiary">,</Text>}
            </span>
          );
        })}
      </span>
    );
  };

  const labelWithTooltip = (label: string, tooltip: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {label}
      <Tooltip content={<div style={{ maxWidth: 300 }}>{tooltip}</div>}>
        <HelpCircle size={12} strokeWidth={2} style={{ cursor: 'help' }} />
      </Tooltip>
    </span>
  );

  const LIFECYCLE_TOOLTIP: Record<LifecycleField, string> = {
    development_completed_at: '流程级展示值为最近一次发布申请提交成功时间；关联版本为本次申请发布的流程版本。',
    deployed_at: '流程级展示值为最近一次发布成功并激活版本时间；关联版本为本次被激活的流程版本。',
    offline_at: '流程级展示值为停用审批通过并执行成功时间；关联版本为下线时当前激活版本。',
  };

  const lifecycleGroupData = [
    ...(basicInfoPermission.canView && basicInfo
      ? [
          {
            key: '开发工程师',
            value: renderPeopleValue(basicInfo.developer_id ? [basicInfo.developer_id] : []),
          },
          {
            key: labelWithTooltip(
              '代码审核员',
              '代码审核员可手工维护；若为空且发布审批存在"代码审核"节点，将在该节点审批通过后自动写入。',
            ),
            value: renderPeopleValue(basicInfo.code_reviewer_id ? [basicInfo.code_reviewer_id] : []),
          },
        ]
      : []),

    ...(lifecyclePermission.canView && lifecycleLedger
      ? ([
          'development_completed_at',
          'deployed_at',
          'offline_at',
        ] as LifecycleField[]).map((f) => ({
          key: labelWithTooltip(LIFECYCLE_FIELD_LABEL[f], LIFECYCLE_TOOLTIP[f]),
          value: <Text>{formatDateTime(lifecycleLedger[f].effective_at)}</Text>,
        }))
      : []),
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
    </>
  );

  const deleteAction = !isSchedulingContext && onDelete ? (
    <Tooltip content={t('common.delete')}>
      <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} theme="borderless" type="tertiary" size="small" onClick={onDelete} />
    </Tooltip>
  ) : null;

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
      deleteAction={deleteAction}
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
            <Title heading={6} style={{ margin: '0 0 12px' }}>基础信息</Title>
            <Descriptions data={basicGroupData} align="left" />
            {lifecycleGroupData.length > 0 && (
              <>
                <Divider margin="20px" />
                <Title heading={6} style={{ margin: '0 0 12px' }}>交付信息</Title>
                <Descriptions data={lifecycleGroupData} align="left" />
              </>
            )}
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
                          <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} type="tertiary" className="process-detail-drawer-version-detail-delete-btn" disabled onClick={() => handleDeleteVersion(selectedVersion)}>
                            {t('development.processDevelopment.detail.versionList.deleteVersion')}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} type="tertiary" className="process-detail-drawer-version-detail-delete-btn" onClick={() => handleDeleteVersion(selectedVersion)}>
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
                        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 8 }}>
                          标记为「业务量」的输出变量由客户端开发流程时声明，可被 ROI 配置中的 PARAM 模式引用
                        </Text>
                        <VariableCardList
                          data={selectedVersion.outputs}
                          showBusinessVolume
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

        <TabPane
          tab={`${t('processDependency.tabTitle')} (${processData.dependencies?.length || 0})`}
          itemKey="dependencies"
        >
          <DependencyTab
            dependencies={processData.dependencies || []}
            onDependenciesChange={
              !isSchedulingContext && onDependenciesChange
                ? (deps) => onDependenciesChange(processData.id, deps)
                : undefined
            }
            readOnly={isSchedulingContext}
            context={context}
          />
        </TabPane>


        <TabPane tab={`资料${documentCount ? ` (${documentCount})` : ''}`} itemKey="documents">
          <DocumentsTab
            processId={processData.id}
            processName={processData.name}
            versions={sortedVersionData.map((v) => ({ id: v.id, version: v.version }))}
            onCountChange={setDocumentCount}
          />
        </TabPane>

        <TabPane tab={t('development.processDevelopment.detail.tabs.effort')} itemKey="effort">
          <EffortTab processId={processData.id} creatorId={processData.creator_id} readOnly={isSchedulingContext} />
        </TabPane>

        <TabPane tab="ROI 配置" itemKey="roi">
          <RoiConfigTab
            processId={processData.id}
            versionId={selectedVersionIdResolved}
            versionLabel={selectedVersion?.version}
            outputs={(selectedVersion?.outputs ?? []).map((o) => ({ name: o.name, displayName: o.name, type: o.type, isBusinessVolume: o.isBusinessVolume }))}
          />
        </TabPane>
      </Tabs>

      <UploadVersionModal
        visible={uploadVersionModalVisible}
        onCancel={() => setUploadVersionModalVisible(false)}
        processData={processData}
        onSuccess={(newDeps) => {
          if (newDeps && newDeps.length > 0 && onDependenciesChange) {
            const merged = [...(processData.dependencies || []), ...newDeps];
            onDependenciesChange(processData.id, merged);
          }
          // R-03 / R-04：上传新版本成功后覆盖流程级开发工程师为本次上传人
          overrideDevelopersOnVersionUpload(processData.id, 'user-001', 'new');
          Toast.info('已将开发工程师更新为本次上传人');
        }}
        onGoToDependencies={() => setActiveTab('dependencies')}
      />
    </DetailDrawerWrapper>
  );
};

export default ProcessDetailDrawer;
