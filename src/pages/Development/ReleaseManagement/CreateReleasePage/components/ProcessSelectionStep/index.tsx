import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Input,
  Tag,
  Space,
  Select,
  Button,
  Spin,
  Checkbox,
} from '@douyinfe/semi-ui';
import { IconSearch, IconChevronRight, IconDelete } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import EmptyState from '@/components/EmptyState';
import FilterPopover from '@/components/FilterPopover';
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
  status?: string[]
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

  if (status && status.length > 0) {
    allData = allData.filter((item) => {
      if (status.includes('published') && item.is_published) return true;
      if (status.includes('unpublished') && !item.is_published) return true;
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
  const [leftCheckedKeys, setLeftCheckedKeys] = useState<string[]>([]);

  // 筛选状态
  const [filterVisible, setFilterVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<{ status: string[] }>({ status: [] });
  const [activeFilters, setActiveFilters] = useState<{ status: string[] }>({ status: [] });

  // 加载数据
  const loadData = async (searchKeyword = keyword) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const response = generateMockListResponse(searchKeyword, activeFilters.status);
      setProcessList(response.list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFilters]);

  // 搜索防抖
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setKeyword(value);
        loadData(value);
      }, 500),
    [activeFilters]
  );

  // 筛选操作
  const handleFilterConfirm = () => {
    setActiveFilters(tempFilters);
    setFilterVisible(false);
  };

  const handleFilterReset = () => {
    setTempFilters({ status: [] });
  };

  // 左侧可选流程（排除已选的）
  const availableProcesses = useMemo(() => {
    const selectedIds = selectedProcesses.map((sp) => sp.process.id);
    return processList.filter((p) => !selectedIds.includes(p.id));
  }, [processList, selectedProcesses]);

  // 左侧勾选处理
  const handleLeftCheck = (processId: string, checked: boolean) => {
    if (checked) {
      setLeftCheckedKeys([...leftCheckedKeys, processId]);
    } else {
      setLeftCheckedKeys(leftCheckedKeys.filter((k) => k !== processId));
    }
  };

  // 全选左侧
  const handleLeftCheckAll = (checked: boolean) => {
    if (checked) {
      setLeftCheckedKeys(availableProcesses.map((p) => p.id));
    } else {
      setLeftCheckedKeys([]);
    }
  };

  // 穿梭到右侧
  const handleTransferToRight = () => {
    const processesToAdd = processList.filter((p) => leftCheckedKeys.includes(p.id));
    const newSelections: SelectedProcess[] = processesToAdd.map((process) => ({
      process,
      version_id: process.latest_version_id,
      version_number: process.latest_version,
    }));
    onSelectionChange([...selectedProcesses, ...newSelections]);
    setLeftCheckedKeys([]);
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

  const isLeftAllChecked =
    availableProcesses.length > 0 && leftCheckedKeys.length === availableProcesses.length;
  const isLeftIndeterminate =
    leftCheckedKeys.length > 0 && leftCheckedKeys.length < availableProcesses.length;

  return (
    <div className="process-selection-step">
      <div className="transfer-container">
        {/* 左侧：可选流程 */}
        <div className="transfer-panel transfer-panel-left">
          <div className="transfer-panel-header">
            <Checkbox
              checked={isLeftAllChecked}
              indeterminate={isLeftIndeterminate}
              onChange={(e) => handleLeftCheckAll(e.target.checked)}
            >
              <Text strong>{t('release.create.availableProcesses')}</Text>
            </Checkbox>
            <Text type="tertiary" size="small">
              {availableProcesses.length} {t('release.create.items')}
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
                style={{ width: 180 }}
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={handleFilterConfirm}
                onReset={handleFilterReset}
                sections={[
                  {
                    key: 'status',
                    label: t('release.create.processTable.status'),
                    type: 'checkbox',
                    value: tempFilters.status,
                    onChange: (value) =>
                      setTempFilters((prev) => ({ ...prev, status: value as string[] })),
                    options: statusOptions,
                  },
                ]}
              />
            </Space>
          </div>

          <div className="transfer-panel-body">
            <Spin spinning={loading}>
              {availableProcesses.length > 0 ? (
                <div className="process-list">
                  {availableProcesses.map((process) => (
                    <div
                      key={process.id}
                      className={`process-item ${leftCheckedKeys.includes(process.id) ? 'checked' : ''}`}
                    >
                      <Checkbox
                        checked={leftCheckedKeys.includes(process.id)}
                        onChange={(e) => handleLeftCheck(process.id, e.target.checked)}
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
                  ))}
                </div>
              ) : (
                <EmptyState
                  variant={keyword || activeFilters.status.length > 0 ? 'noResult' : 'noData'}
                  description={
                    keyword || activeFilters.status.length > 0
                      ? t('common.noResult')
                      : t('release.create.noProcessData')
                  }
                />
              )}
            </Spin>
          </div>
        </div>

        {/* 中间：穿梭按钮 */}
        <div className="transfer-actions">
          <Button
            icon={<IconChevronRight />}
            disabled={leftCheckedKeys.length === 0}
            onClick={handleTransferToRight}
          />
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
                  return (
                    <div key={process.id} className="selected-item">
                      <div className="selected-item-info">
                        <Text className="process-name">{process.name}</Text>
                        <Tag size="small" color={process.is_published ? 'green' : 'grey'}>
                          {process.is_published
                            ? t('release.create.processStatus.published')
                            : t('release.create.processStatus.unpublished')}
                        </Tag>
                      </div>
                      <div className="selected-item-actions">
                        <Select
                          size="small"
                          value={sp.version_id}
                          onChange={(value) => handleVersionChange(process.id, value as string)}
                          style={{ width: 120 }}
                          optionList={process.versions.map((v) => ({
                            value: v.id,
                            label: (
                              <Space>
                                <span>{v.version}</span>
                                {v.is_published && (
                                  <Tag size="small" color="green">
                                    {t('release.create.processStatus.published')}
                                  </Tag>
                                )}
                              </Space>
                            ),
                          }))}
                        />
                        <Button
                          icon={<IconDelete />}
                          type="tertiary"
                          size="small"
                          onClick={() => handleRemoveFromRight(process.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                variant="noData"
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
