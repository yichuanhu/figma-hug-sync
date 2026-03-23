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

// Mock Version数据生成器
const generateMockVersions = (processIndex: number, isProcessPublished: boolean): ProcessVersion[] => {
  const versionCount = Math.floor(Math.random() * 3) + 2;
  
  // 对于已Published process，随机决定是否有新Version可Release
  const hasNewVersionAvailable = isProcessPublished && Math.random() > 0.5;
  
  return Array.from({ length: versionCount }, (_, i) => ({
    id: `ver-${processIndex + 1}-${i + 1}`,
    version: `v${versionCount - i}.${Math.floor(Math.random() * 10)}.0`,
    // 如果有新Version可Release，只有最后Mon个Version是已Release的（不是最新的）
    // 否则，第Mon个Version（最新）是已Release的
    is_published: hasNewVersionAvailable ? i === versionCount - 1 : i === 0,
  }));
};

// 检查Process是否有新Version可Release
const hasNewVersionToPublish = (process: ProcessWithVersions): boolean => {
  if (!process.is_published) return false;
  
  // 找到最新Version（第Mon个）
  const latestVersion = process.versions[0];
  if (!latestVersion) return false;
  
  // 如果最新Version未Release，说明有新Version可Release
  return !latestVersion.is_published;
};

// Mock 数据生成器
const generateMockProcess = (index: number): ProcessWithVersions => {
  const names = [
    'Customer Info Sync',
    'Order Processing',
    'Inventory Check',
    '报表生成器',
    '数据导入',
    '邮件发送',
    '文件处理',
    '数据清洗',
    '任务调度',
    'Sun志分析',
    '这是Mon个超级超级长的自动化ProcessName用来测试当ProcessName特别长的时候UI是否能正确截断显示不会撑破布局导致样式错乱的边界情况',
    '企业级跨部门多系统Data Sync与清洗Process_包含异常处理与重试机制_支持并发执行与优先级调度_Version迭代持续优化中',
    '全球化多语言Order Processing与物流调度自动化Process',
  ];

  const descriptions = [
    'Customer Info SyncProcess的详细Description',
    'Order ProcessingProcess的详细Description',
    'Inventory CheckProcess的详细Description',
    '报表生成器Process的详细Description',
    '数据导入Process的详细Description',
    '邮件发送Process的详细Description',
    '文件处理Process的详细Description',
    '数据清洗Process的详细Description',
    '任务调度Process的详细Description',
    'Sun志分析Process的详细Description',
    '这是Mon段非常非常长的ProcessDescriptionText，用来测试当Description信息超出正常长度时，UI展示是否正确处理了Text截断或换行逻辑。该Process涵盖了客户数据采集、数据清洗、格式转换、目标系统写入、异常Sun志记录、重试机制触发、邮件通知发送等多个Step，每Mon步都包含详细的Parameter配置和校验规则，确保数据Mon致性和完整性。',
    '企业级跨部门多系统Data Sync与清洗Process的Description，这个Description也非常长，包含了Process设计理念、技术架构、性能指标、安全策略、合规要求、运维规范等多方面内容。',
    '全球化多语言Order Processing与物流调度自动化Process的完整Description信息',
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

  // Sort规则：
  // 1. 完全未Release的Process放在最前面
  // 2. 已Release但有新Version可Release的Process排在第Tue
  // 3. 已Release且没有新Version的Process排在最后面
  allData.sort((a, b) => {
    const aIsUnpublished = !a.is_published;
    const bIsUnpublished = !b.is_published;
    const aHasNewVersion = hasNewVersionToPublish(a);
    const bHasNewVersion = hasNewVersionToPublish(b);
    
    // 未Release的排最前
    if (aIsUnpublished && !bIsUnpublished) return -1;
    if (!aIsUnpublished && bIsUnpublished) return 1;
    
    // 都是已Release的情况下，有新Version的排前面
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

  // Loading数据
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

  // Search防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value);
        loadData(value);
      }, 500),
    [statusFilter]
  );

  // 已选ProcessID集合（用于左侧显示勾选Status）
  const selectedIds = useMemo(() => {
    return new Set(selectedProcesses.map((sp) => sp.process.id));
  }, [selectedProcesses]);

  // 左侧勾选处理 - 同步到右侧
  const handleLeftCheck = (process: ProcessWithVersions, checked: boolean) => {
    if (checked) {
      // 添加到已选列表
      const newSelection: SelectedProcess = {
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      };
      onSelectionChange([...selectedProcesses, newSelection]);
    } else {
      // 从已选列表移除
      onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== process.id));
    }
  };

  // 全选左侧
  const handleLeftCheckAll = (checked: boolean) => {
    if (checked) {
      // 添加所有未选的Process
      const unselectedProcesses = processList.filter((p) => !selectedIds.has(p.id));
      const newSelections: SelectedProcess[] = unselectedProcesses.map((process) => ({
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      }));
      onSelectionChange([...selectedProcesses, ...newSelections]);
    } else {
      // 移除当前列表中所有已选的Process
      const currentListIds = new Set(processList.map((p) => p.id));
      onSelectionChange(selectedProcesses.filter((sp) => !currentListIds.has(sp.process.id)));
    }
  };

  // 从右侧移除
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

  // 当前列表中被选中的数量
  const currentListSelectedCount = processList.filter((p) => selectedIds.has(p.id)).length;
  const isLeftAllChecked = processList.length > 0 && currentListSelectedCount === processList.length;
  const isLeftIndeterminate = currentListSelectedCount > 0 && currentListSelectedCount < processList.length;

  return (
    <div className="process-selection-step">
      <div className="transfer-container">
        {/* 左侧：可选Process */}
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
                    
                    // 确定标签Type和文字
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

        {/* 右侧：已选Process */}
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
