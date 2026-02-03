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
import { IconSearch, IconDelete, IconBox } from '@douyinfe/semi-icons';
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

// Mock 版本数据生成器
const generateMockVersions = (processIndex: number): ProcessVersion[] => {
  const versionCount = Math.floor(Math.random() * 3) + 2;
  return Array.from({ length: versionCount }, (_, i) => ({
    id: `ver-${processIndex + 1}-${i + 1}`,
    version: `v${versionCount - i}.${Math.floor(Math.random() * 10)}.0`,
    is_published: i === 0,
  }));
};

// Mock 数据生成器
const generateMockProcess = (index: number): ProcessWithVersions => {
  const names = [
    '客户信息同步',
    '订单处理',
    '库存检查',
    '报表生成器',
    '数据导入',
    '邮件发送',
    '文件处理',
    '数据清洗',
    '任务调度',
    '日志分析',
  ];

  const versions = generateMockVersions(index);

  return {
    id: `process-${index + 1}`,
    name: names[index % names.length],
    description: `${names[index % names.length]}流程的详细描述`,
    status: index % 3 === 0 ? 'developing' : 'published',
    latest_version_id: versions[0].id,
    latest_version: versions[0].version,
    is_published: index % 3 !== 0,
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

  // 加载数据
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

  // 搜索防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value);
        loadData(value);
      }, 500),
    [statusFilter]
  );

  // 已选流程ID集合（用于左侧显示勾选状态）
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
      // 添加所有未选的流程
      const unselectedProcesses = processList.filter((p) => !selectedIds.has(p.id));
      const newSelections: SelectedProcess[] = unselectedProcesses.map((process) => ({
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      }));
      onSelectionChange([...selectedProcesses, ...newSelections]);
    } else {
      // 移除当前列表中所有已选的流程
      const currentListIds = new Set(processList.map((p) => p.id));
      onSelectionChange(selectedProcesses.filter((sp) => !currentListIds.has(sp.process.id)));
    }
  };

  // 从右侧移除
  const handleRemoveFromRight = (processId: string) => {
    onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== processId));
  };

  // 修改版本
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
        {/* 左侧：可选流程 */}
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
                prefix={<IconSearch />}
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
                    return (
                      <div
                        key={process.id}
                        className={`process-item ${isSelected ? 'checked' : ''}`}
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
                          <Text className="process-name">{process.name}</Text>
                          <Tag size="small" color={process.is_published ? 'green' : 'grey'}>
                            {process.is_published
                              ? t('release.create.processStatus.published')
                              : t('release.create.processStatus.unpublished')}
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
                  image={<IconBox size="extra-large" style={{ color: 'var(--semi-color-text-2)' }} />}
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

        {/* 右侧：已选流程 */}
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
                        <Text className="process-name">{process.name}</Text>
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
                          <IconDelete style={{ color: 'var(--semi-color-text-2)' }} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Empty
                image={<IconBox size="extra-large" style={{ color: 'var(--semi-color-text-2)' }} />}
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
