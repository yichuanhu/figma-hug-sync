import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { IconSearchStroked, IconClose, IconInbox } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { LYPublishableProcessResponse, LYListResponseLYPublishableProcessResponse } from '@/api';
import type { SelectedProcess } from '../../index';

import './index.less';

const { Text } = Typography;

interface ProcessVersion {
  id: string;
  version: string;
  is_published: boolean;
}

interface ProcessWithVersions extends LYPublishableProcessResponse {
  versions: ProcessVersion[];
}

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
    'Customer Info Sync',
    'Order Processing',
    'Inventory Check',
    'reportgeneration器',
    'DataImport',
    '邮件send',
    'Fileprocessing',
    'Data清洗',
    'task调度',
    'Loganalysis',
    'This is a super long automation process name to test UI truncation when the process name is extremely long and may break the layout',
    'Enterprise Cross-Department Multi-System Data Sync and Cleansing Process with Exception Handling and Retry Mechanism',
    'Global Multi-Language Order Processing and Logistics Scheduling Automation Process',
  ];

  const descriptions = [
    'Customer Info SyncProcess's 详细Description',
    'Order ProcessingProcess's 详细Description',
    'Inventory CheckProcess's 详细Description',
    'reportgeneration器Process's 详细Description',
    'DataImportProcess's 详细Description',
    '邮件sendProcess's 详细Description',
    'FileprocessingProcess's 详细Description',
    'Data清洗Process's 详细Description',
    'task调度Process's 详细Description',
    'LoganalysisProcess's 详细Description',
    'This is Mon段非常非常长's ProcessDescriptionText, use测试当DescriptionInfo超出Normal长度时, UI展示is否正确processing Text截断或换行logic. thisProcess涵盖 客户Data采集, Data清洗, FormatConversion, Target系统写入, AbnormalLogRecord, Retry机制Trigger, 邮件Notificationsend etc.多Step, 每Mon步都包含详细's ParameterConfig and 校验Rule, 确保DataMon致性 and 完整性. ',
    '企业级跨部门多系统Data Sync and 清洗Process's Description, thisDescriptionalso非常长, 包含 Process设计理念, 技术架构, 性can指标, 安全策略, 合规to求, 运维规范 etc.多方面Content. ',
    '全球化多语言Order Processing and 物流调度automationProcess's 完整DescriptionInfo',
  ];

  const isPublished = index % 3 !== 0;
  const versions = generateMockVersions(index, isPublished);

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

  // Left勾选processing - 同步toRight
  const handleLeftCheck = (process: ProcessWithVersions, checked: boolean) => {
    if (checked) {
      // addtoAlready选List
      const newSelection: SelectedProcess = {
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      };
      onSelectionChange([...selectedProcesses, newSelection]);
    } else {
      // fromAlready选Listremove
      onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== process.id));
    }
  };

  // 全选Left
  const handleLeftCheckAll = (checked: boolean) => {
    if (checked) {
      // add所has未选's Process
      const unselectedProcesses = processList.filter((p) => !selectedIds.has(p.id));
      const newSelections: SelectedProcess[] = unselectedProcesses.map((process) => ({
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      }));
      onSelectionChange([...selectedProcesses, ...newSelections]);
    } else {
      // remove当前List所hasAlready选's Process
      const currentListIds = new Set(processList.map((p) => p.id));
      onSelectionChange(selectedProcesses.filter((sp) => !currentListIds.has(sp.process.id)));
    }
  };

  // fromRightremove
  const handleRemoveFromRight = (processId: string) => {
    onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== processId));
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

  // 当前ListSelected's Count
  const currentListSelectedCount = processList.filter((p) => selectedIds.has(p.id)).length;
  const isLeftAllChecked = processList.length > 0 && currentListSelectedCount === processList.length;
  const isLeftIndeterminate = currentListSelectedCount > 0 && currentListSelectedCount < processList.length;

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

          <div className="transfer-panel-select-all">
            <Checkbox
              checked={isLeftAllChecked}
              indeterminate={isLeftIndeterminate}
              onChange={(e) => handleLeftCheckAll(e.target.checked)}
            >
              <Text size="small">{t('common.selectAll')}</Text>
            </Checkbox>
            <Text type="tertiary" size="small">
              {currentListSelectedCount}/{processList.length}
            </Text>
          </div>

          <div className="transfer-panel-body">
            <Spin spinning={loading}>
              {processList.length > 0 ? (
                <div className="process-list">
                {processList.map((process) => {
                    const isSelected = selectedIds.has(process.id);
                    const hasNewVersion = hasNewVersionToPublish(process);
                    
                    // 确定标签Type and 文字
                    let tagColor: 'green' | 'blue' | 'grey' = 'grey';
                    let tagText = t('release.create.processStatus.unpublished');
                    
                    if (!process.is_published) {
                      tagColor = 'grey';
                      tagText = t('release.create.processStatus.unpublished');
                    } else if (hasNewVersion) {
                      tagColor = 'blue';
                      tagText = t('release.create.processStatus.hasNewVersion');
                    } else {
                      tagColor = 'green';
                      tagText = t('release.create.processStatus.published');
                    }
                    
                    return (
                      <div
                        key={process.id}
                        className="process-item"
                        onClick={() => handleLeftCheck(process, !isSelected)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleLeftCheck(process, e.target.checked);
                          }}
                        />
                        <div className="process-item-content">
                          <Text className="process-name" ellipsis={{ showTooltip: true }}>{process.name}</Text>
                          <Tag size="small" color={tagColor}>
                            {tagText}
                          </Tag>
                        </div>
                        <Text type="tertiary" size="small">
                          {process.latest_version}
                        </Text>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Empty
                  image={<IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)' }} />}
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
                          <IconClose style={{ color: 'var(--semi-color-text-2)' }} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                image={<IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)' }} />}
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
