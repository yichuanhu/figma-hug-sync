import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { LYProcessDependency } from '@/api';
import {
  Typography,
  Input,
  Tag,
  Space,
  Select,
  Spin,
  Checkbox,
  Empty,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { LYPublishableProcessResponse, LYListResponseLYPublishableProcessResponse } from '@/api';
import type { SelectedProcess } from '../../index';

import './index.less';
import { Inbox, Lock, X } from 'lucide-react';
import { Tooltip } from '@douyinfe/semi-ui';
import StatusDot from '@/components/StatusDot';

const { Text } = Typography;

interface ProcessVersion {
  id: string;
  version: string;
  is_published: boolean;
}

interface ProcessWithVersions extends LYPublishableProcessResponse {
  versions: ProcessVersion[];
  owner_department_id: string;
  owner_department_name: string;
  publish_approval_template_id?: string;
  publish_approval_template_name?: string;
  publish_approval_template_visible?: boolean;
  publish_approval_required: boolean;
  publish_selection_scope_key: string;
}

const DEPARTMENTS = [
  { id: 'dept-finance', name: '财务部' },
  { id: 'dept-hr', name: '人事部' },
  { id: 'dept-rd', name: '研发部' },
  { id: 'dept-ops', name: '运营部' },
];

const TEMPLATES: Record<string, { id: string; name: string; enabled: boolean }> = {
  finance: { id: 'tpl-finance', name: '财务发布审批', enabled: true },
  cross: { id: 'tpl-cross', name: '跨部门发布审批', enabled: true },
  disabled: { id: 'tpl-disabled', name: '运营发布登记', enabled: false },
};

const getScopeKey = (p: ProcessWithVersions) => p.publish_selection_scope_key;

interface ProcessSelectionStepProps {
  selectedProcesses: SelectedProcess[];
  onSelectionChange: (processes: SelectedProcess[]) => void;
}

// Mock VersionDatageneration器
const generateMockVersions = (processIndex: number, isProcessPublished: boolean): ProcessVersion[] => {
  const versionCount = Math.floor(Math.random() * 3) + 2;
  
  // forfor AlreadyPublished process, 随机决定is否has新Version可Release
  const hasNewVersionAvailable = isProcessPublished && Math.random() > 0.5;
  
  return Array.from({ length: versionCount }, (_, i) => ({
    id: `ver-${processIndex + 1}-${i + 1}`,
    version: `v${versionCount - i}.${Math.floor(Math.random() * 10)}.0`,
    // ifhas新Version可Release, 只has最后MonVersionisAlreadyRelease's (notis最新's )
    // 否则, 第MonVersion(最新)isAlreadyRelease's 
    is_published: hasNewVersionAvailable ? i === versionCount - 1 : i === 0,
  }));
};

// CheckProcessis否has新Version可Release
const hasNewVersionToPublish = (process: ProcessWithVersions): boolean => {
  if (!process.is_published) return false;
  
  // 找to最新Version(第Mon)
  const latestVersion = process.versions[0];
  if (!latestVersion) return false;
  
  // if最新Version未Release, 说明has新Version可Release
  return !latestVersion.is_published;
};

// Mock Datageneration器
const generateMockProcess = (index: number): ProcessWithVersions => {
  const names = [
    'Auto Order Processing',
    'Expense Reimbursement Approval',
    'Employee Onboarding Flow',
    'Purchase Request Flow',
    'Contract Approval Flow',
    'Invoice Recognition Processing',
    'Customer Info Sync',
    'Inventory Check Flow',
    'Sales Data Summary',
    'Auto Report Generation',
    'This is a super long automation process name to test UI truncation when the process name is extremely long and may break the layout',
    'Enterprise Cross-Department Multi-System Data Sync and Cleansing Process with Exception Handling and Retry Mechanism',
    'Global Multi-Language Order Processing and Logistics Scheduling Automation Process',
  ];

  const descriptions = [
    'A comprehensive automation process for order processing including data collection and analysis',
    'Automated expense reimbursement approval including invoice recognition and amount verification',
    'Automated employee onboarding process including account creation and permission assignment',
    'Automated purchase request processing including supplier comparison and approval flow',
    'Automated contract approval including template matching and clause review',
    'Auto-recognize and process various invoices including OCR recognition and info extraction',
    'Auto-sync customer info across business systems to maintain data consistency',
    'Automated inventory check with variance reporting and replenishment triggering',
    'Auto-aggregate sales data from all channels and generate analysis reports',
    'Scheduled auto-generation of business reports with multi-format export',
    'This is a very long process description text to test UI truncation and line-wrapping logic when description exceeds normal length. This process covers data collection, cleansing, format conversion, target system writing, exception logging, retry mechanism, and email notification.',
    'Enterprise cross-department multi-system data sync and cleansing process description, covering design philosophy, technical architecture, performance metrics, security strategy, compliance requirements, and operations specifications.',
    'Global multi-language order processing and logistics scheduling automation process full description.',
  ];

  const isPublished = index % 3 !== 0;
  const versions = generateMockVersions(index, isPublished);

  // Mock dependencies - some processes have MISSING dependencies
  const mockDeps: LYProcessDependency[] = [];
  // ACTIVE dependencies - reference real resource page IDs
  const paramNames = ['Heartbeat Interval', 'Task Timeout', 'Enable Debug Mode', 'Max Concurrency', 'Default Language', 'Retry Count', 'Log Level', 'Cache Duration'];
  const credNames = ['Enterprise Email Credential', 'Database Connection Credential', 'Third-party API Credential', 'SSH Server Credential', 'Git Repository Credential', 'ERP System Credential', 'CRM System Credential', 'OA System Credential'];
  const queueNames = ['Order Processing Queue', 'Email Sending Queue', 'Data Sync Queue', 'Report Generation Queue', 'Notification Push Queue', 'File Processing Queue', 'Task Scheduling Queue', 'Log Collection Queue'];
  const fileNames = ['System Configuration', 'Data Template', 'Input Mapping Config', 'Process Asset Package', 'Report Template', 'Script Helper Tool', 'Encrypted Credentials', 'Workflow Configuration'];

  mockDeps.push(
    { resource_id: `param-${(index % 8) + 1}`, resource_name: paramNames[index % 8], resource_type: 'PARAMETER', source: 'AUTO_DETECTED', param_type: 'TEXT', resource_value: 'https://erp.example.com/api/v2', status: 'ACTIVE' },
    { resource_id: `cred-${(index % 8) + 1}`, resource_name: credNames[index % 8], resource_type: 'CREDENTIAL', source: 'AUTO_DETECTED', resource_value: '••••••••', status: 'ACTIVE', credential_type: ([2, 6].includes(index % 8) ? 'ASSIGNED_VALUE' : (index % 8 === 4 ? 'PERSONAL_REF' : 'FIXED_VALUE')) },
    { resource_id: `queue-${(index % 8) + 1}`, resource_name: queueNames[index % 8], resource_type: 'QUEUE', source: 'AUTO_DETECTED', status: 'ACTIVE' },
    { resource_id: `file-${(index % 8) + 1}`, resource_name: fileNames[index % 8], resource_type: 'FILE', source: 'AUTO_DETECTED', original_name: 'config.json', status: 'ACTIVE' },
  );

  // Some processes have MISSING deps
  if (index % 3 === 0) {
    mockDeps.push(
      { resource_id: `param-missing-${index}`, resource_name: 'Payment_Gateway_Config', resource_type: 'PARAMETER', source: 'AUTO_DETECTED', param_type: 'TEXT', status: 'MISSING' },
    );
  }
  if (index % 4 === 0) {
    mockDeps.push(
      { resource_id: `cred-missing-${index}`, resource_name: 'AWS_S3_Access_Key', resource_type: 'CREDENTIAL', source: 'AUTO_DETECTED', status: 'MISSING' },
    );
  }

  const dept = DEPARTMENTS[index % DEPARTMENTS.length];
  // Distribute: 0,1=finance(enabled), 2=cross(enabled), 3=disabled(enabled=false), 4,5=no template
  const mod = index % 6;
  let tpl: { id: string; name: string; enabled: boolean } | undefined;
  if (mod === 0 || mod === 1) tpl = TEMPLATES.finance;
  else if (mod === 2) tpl = TEMPLATES.cross;
  else if (mod === 3) tpl = TEMPLATES.disabled;

  const scopeKey = tpl
    ? `template:${tpl.id}`
    : `department:${dept.id}:no-template`;

  return {
    id: `process-${index + 1}`,
    name: names[index % names.length],
    description: descriptions[index % descriptions.length],
    status: index % 3 === 0 ? 'developing' : 'published',
    latest_version_id: versions[0].id,
    latest_version: versions[0].version,
    is_published: isPublished,
    updated_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
    versions,
    dependencies: mockDeps,
    owner_department_id: dept.id,
    owner_department_name: dept.name,
    publish_approval_template_id: tpl?.id,
    publish_approval_template_name: tpl?.name,
    publish_approval_template_visible: true,
    publish_approval_required: !!(tpl && tpl.enabled),
    publish_selection_scope_key: scopeKey,
  };
};

const generateMockListResponse = (
  keyword?: string,
  status?: string
): LYListResponseLYPublishableProcessResponse & { list: ProcessWithVersions[] } => {
  let allData = Array.from({ length: 15 }, (_, i) => generateMockProcess(i));

  if (keyword) {
    const kw = keyword.toLowerCase();
    allData = allData.filter(
      (item) =>
        item.name.toLowerCase().includes(kw) ||
        (item.description && item.description.toLowerCase().includes(kw))
    );
  }

  if (status) {
    allData = allData.filter((item) => {
      if (status === 'published' && item.is_published) return true;
      if (status === 'unpublished' && !item.is_published) return true;
      return false;
    });
  }

  // SortRule: 
  // 1. 完全未Release's Process放in 最前面
  // 2. AlreadyRelease但has新Version可Release's Process排in 第Tue
  // 3. AlreadyRelease且no新Version's Process排in 最后面
  allData.sort((a, b) => {
    const aIsUnpublished = !a.is_published;
    const bIsUnpublished = !b.is_published;
    const aHasNewVersion = hasNewVersionToPublish(a);
    const bHasNewVersion = hasNewVersionToPublish(b);
    
    // 未Release's 排最前
    if (aIsUnpublished && !bIsUnpublished) return -1;
    if (!aIsUnpublished && bIsUnpublished) return 1;
    
    // 都isAlreadyRelease's 情况下, has新Version's 排前面
    if (!aIsUnpublished && !bIsUnpublished) {
      if (aHasNewVersion && !bHasNewVersion) return -1;
      if (!aHasNewVersion && bHasNewVersion) return 1;
    }
    
    return 0;
  });

  return {
    range: { offset: 0, size: allData.length, total: allData.length },
    list: allData,
  };
};

const ProcessSelectionStep: React.FC<ProcessSelectionStepProps> = ({
  selectedProcesses,
  onSelectionChange,
}) => {
  const { t } = useTranslation();

  const [processList, setProcessList] = useState<ProcessWithVersions[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // LoadingData
  const loadData = async (searchKeyword = keyword) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const response = generateMockListResponse(searchKeyword, statusFilter);
      setProcessList(response.list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Searchdebounced
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value);
        loadData(value);
      }, 500),
    [statusFilter]
  );

  // Already选ProcessID集合(usefor Leftdisplay勾选Status)
  const selectedIds = useMemo(() => {
    return new Set(selectedProcesses.map((sp) => sp.process.id));
  }, [selectedProcesses]);

  // 范围锁定：根据已选第一项派生 scopeKey
  const lockedScopeKey = useMemo<string | null>(() => {
    if (selectedProcesses.length === 0) return null;
    return (selectedProcesses[0].process as ProcessWithVersions).publish_selection_scope_key ?? null;
  }, [selectedProcesses]);

  const lockedSample = selectedProcesses[0]?.process as ProcessWithVersions | undefined;

  const isCompatible = (p: ProcessWithVersions) =>
    !lockedScopeKey || p.publish_selection_scope_key === lockedScopeKey;

  // 锁定提示条文案
  const lockedBannerText = useMemo(() => {
    if (!lockedSample) return '';
    if (lockedSample.publish_approval_template_id) {
      const name =
        lockedSample.publish_approval_template_visible && lockedSample.publish_approval_template_name
          ? lockedSample.publish_approval_template_name
          : t('release.create.scope.templateTagNoPerm');
      return lockedSample.publish_approval_required
        ? t('release.create.scope.lockedBannerTemplate', { name })
        : t('release.create.scope.lockedBannerTemplateDisabled', { name });
    }
    return t('release.create.scope.lockedBannerNoTemplate', { dept: lockedSample.owner_department_name });
  }, [lockedSample, t]);

  // Left勾选processing - 同步toRight
  const handleLeftCheck = (process: ProcessWithVersions, checked: boolean) => {
    if (checked) {
      if (!isCompatible(process)) return;
      const newSelection: SelectedProcess = {
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      };
      onSelectionChange([...selectedProcesses, newSelection]);
    } else {
      onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== process.id));
    }
  };

  // 全选Left：只作用于当前锁定范围内的兼容流程
  const handleLeftCheckAll = (checked: boolean) => {
    if (checked) {
      const toAdd = processList
        .filter((p) => !selectedIds.has(p.id) && isCompatible(p))
        .map<SelectedProcess>((process) => ({
          process,
          version_id: process.latest_version_id,
          version_number: process.latest_version,
        }));
      onSelectionChange([...selectedProcesses, ...toAdd]);
    } else {
      const currentListIds = new Set(processList.map((p) => p.id));
      onSelectionChange(selectedProcesses.filter((sp) => !currentListIds.has(sp.process.id)));
    }
  };

  // fromRightremove
  const handleRemoveFromRight = (processId: string) => {
    onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== processId));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  // ModifyVersion
  const handleVersionChange = (processId: string, versionId: string) => {
    const process = processList.find((p) => p.id === processId);
    if (!process) return;

    const version = process.versions.find((v) => v.id === versionId);
    if (!version) return;

    onSelectionChange(
      selectedProcesses.map((sp) =>
        sp.process.id === processId
          ? { ...sp, version_id: versionId, version_number: version.version }
          : sp
      )
    );
  };

  const statusOptions = [
    { value: 'published', label: t('release.create.processStatus.published') },
    { value: 'unpublished', label: t('release.create.processStatus.unpublished') },
  ];

  // 当前List中兼容、可选的 Process（用于全选 checkbox 状态计算）
  const compatibleInList = processList.filter((p) => isCompatible(p));
  const currentListSelectedCount = compatibleInList.filter((p) => selectedIds.has(p.id)).length;
  const isLeftAllChecked =
    compatibleInList.length > 0 && currentListSelectedCount === compatibleInList.length;
  const isLeftIndeterminate =
    currentListSelectedCount > 0 && currentListSelectedCount < compatibleInList.length;

  const renderRowMeta = (process: ProcessWithVersions) => {
    const hasNewVersion = hasNewVersionToPublish(process);
    let statusColor: 'cyan' | 'orange' | 'green' = 'cyan';
    let statusText = t('release.create.processStatus.unpublished');
    if (!process.is_published) {
      statusColor = 'cyan';
      statusText = t('release.create.processStatus.unpublished');
    } else if (hasNewVersion) {
      statusColor = 'orange';
      statusText = t('release.create.processStatus.hasNewVersion');
    } else {
      statusColor = 'green';
      statusText = t('release.create.processStatus.published');
    }

    const approvalNode = process.publish_approval_template_id ? (
      <span className="row-meta__approval row-meta__approval--required">
        <span className="row-meta__approval-prefix">
          {t('release.create.scope.approvalRequired', { defaultValue: '需审批' })}
        </span>
        <span className="row-meta__dot-sep">·</span>
        <span className="row-meta__approval-name">
          {process.publish_approval_template_visible && process.publish_approval_template_name
            ? process.publish_approval_template_name
            : t('release.create.scope.templateTagNoPerm')}
        </span>
      </span>
    ) : (
      <span className="row-meta__approval row-meta__approval--none">
        <span>{t('release.create.scope.approvalNone', { defaultValue: '无需审批' })}</span>
        <span className="row-meta__dot-sep">·</span>
        <span>{process.owner_department_name}</span>
      </span>
    );

    return (
      <div className="row-meta">
        <StatusDot color={statusColor} label={statusText} />
        <span className="row-meta__sep">|</span>
        {approvalNode}
        <span className="row-meta__sep">|</span>
        <span className="row-meta__version">{process.latest_version}</span>
      </div>
    );
  };

  return (
    <div className="process-selection-step">
      <div className="transfer-container">
        {/* Left: OptionalProcess */}
        <div className="transfer-panel transfer-panel-left">
          <div className="transfer-panel-header">
            <Text strong>{t('release.create.availableProcesses')}</Text>
            <Text type="tertiary" size="small">
              {processList.length} {t('release.create.items')}
            </Text>
          </div>

          <div className="transfer-panel-toolbar">
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('release.create.searchProcessPlaceholder')}
                onChange={(value) => handleSearch(value)}
                showClear
                size="small"
                style={{ width: 160 }}
              />
              <Select
                placeholder={t('release.create.processTable.status')}
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as string | undefined)}
                optionList={statusOptions}
                showClear
                size="small"
                style={{ width: 100 }}
              />
            </Space>
          </div>

          {lockedScopeKey && (
            <div className="scope-lock-banner">
              <div className="scope-lock-banner-text">
                <Lock size={14} strokeWidth={2} />
                <span>{lockedBannerText}</span>
              </div>
              <a className="scope-lock-banner-action" onClick={handleClearAll}>
                {t('release.create.scope.clearLock')}
              </a>
            </div>
          )}

          <div className="transfer-panel-select-all">
            <Checkbox
              checked={isLeftAllChecked}
              indeterminate={isLeftIndeterminate}
              onChange={(e) => handleLeftCheckAll(e.target.checked)}
            >
              <Text size="small">{t('common.selectAll')}</Text>
            </Checkbox>
            <Text type="tertiary" size="small">
              {currentListSelectedCount}/{compatibleInList.length}
            </Text>
          </div>

          <div className="transfer-panel-body">
            <Spin spinning={loading}>
              {processList.length > 0 ? (
                <div className="process-list">
                {processList.map((process) => {
                    const isSelected = selectedIds.has(process.id);
                    const compatible = isCompatible(process);
                    const disabled = !compatible;

                    const row = (
                      <div
                        key={process.id}
                        className={`process-item${disabled ? ' is-disabled' : ''}`}
                        onClick={() => {
                          if (disabled) return;
                          handleLeftCheck(process, !isSelected);
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={disabled}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (disabled) return;
                            handleLeftCheck(process, e.target.checked);
                          }}
                        />
                        <div className="process-item-content process-item-content--column">
                          <Text className="process-name" ellipsis={{ showTooltip: true }}>{process.name}</Text>
                          {renderRowMeta(process)}
                        </div>
                      </div>
                    );

                    return disabled ? (
                      <Tooltip
                        key={process.id}
                        content={t('release.create.scope.incompatibleTooltip')}
                        position="top"
                      >
                        {row}
                      </Tooltip>
                    ) : (
                      row
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={<Inbox size={16} strokeWidth={2} />}
                  description={
                    keyword || statusFilter
                      ? t('common.noResult')
                      : t('release.create.noProcessData')
                  }
                />
              )}
            </Spin>
          </div>
        </div>

        {/* Right: AlreadyProcess */}
        <div className="transfer-panel transfer-panel-right">
          <div className="transfer-panel-header">
            <Text strong>{t('release.create.selectedProcesses')}</Text>
            <Text type="tertiary" size="small">
              {selectedProcesses.length} {t('release.create.items')}
            </Text>
          </div>

          {lockedScopeKey && (
            <div className="scope-summary">
              <Text type="tertiary" size="small">
                {t('release.create.scope.summarySelected')}：{lockedBannerText.replace(/^本次发布范围：|^Release scope: /, '')}
              </Text>
            </div>
          )}


          <div className="transfer-panel-body">
            {selectedProcesses.length > 0 ? (
              <div className="selected-list">
                {selectedProcesses.map((sp) => {
                  const process = sp.process as ProcessWithVersions;
                  const isProcessPublished = process.is_published;
                  
                  return (
                    <div key={process.id} className="selected-item">
                      <div className="selected-item-info">
                        <Text className="process-name" ellipsis={{ showTooltip: true }}>{process.name}</Text>
                      </div>
                      <div className="selected-item-actions">
                        <Select
                          size="small"
                          value={sp.version_id}
                          onChange={(value) => handleVersionChange(process.id, value as string)}
                          style={{ width: 140 }}
                          optionList={process.versions.map((v) => ({
                            value: v.id,
                            label: (
                              <Space>
                                <span>{v.version}</span>
                                {isProcessPublished && v.is_published && (
                                  <Tag size="small" color="green">
                                    {t('release.create.processStatus.published')}
                                  </Tag>
                                )}
                              </Space>
                            ),
                          }))}
                        />
                        <span
                          className="delete-icon"
                          onClick={() => handleRemoveFromRight(process.id)}
                        >
                          <X size={16} strokeWidth={2} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                image={<Inbox size={16} strokeWidth={2} />}
                description={t('release.create.noSelectedProcess')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessSelectionStep;
