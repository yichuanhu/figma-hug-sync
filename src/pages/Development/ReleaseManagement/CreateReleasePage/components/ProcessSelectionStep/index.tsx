import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Table,
  Input,
  Tag,
  Checkbox,
  Row,
  Col,
  Space,
  Select,
} from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
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
  const versionCount = Math.floor(Math.random() * 3) + 2; // 2-4 个版本
  return Array.from({ length: versionCount }, (_, i) => ({
    id: `ver-${processIndex + 1}-${i + 1}`,
    version: `v${versionCount - i}.${Math.floor(Math.random() * 10)}.0`,
    is_published: i === 0, // 第一个版本为已发布
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
  status?: string[],
  offset = 0,
  size = 20
): LYListResponseLYPublishableProcessResponse & { list: ProcessWithVersions[] } => {
  let allData = Array.from({ length: 25 }, (_, i) => generateMockProcess(i));

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
    range: { offset, size, total: allData.length },
    list: allData.slice(offset, offset + size),
  };
};

const ProcessSelectionStep: React.FC<ProcessSelectionStepProps> = ({
  selectedProcesses,
  onSelectionChange,
}) => {
  const { t } = useTranslation();

  const [listResponse, setListResponse] =
    useState<LYListResponseLYPublishableProcessResponse & { list: ProcessWithVersions[] }>({
      range: { offset: 0, size: 20, total: 0 },
      list: [],
    });
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');

  // 筛选状态
  const [filterVisible, setFilterVisible] = useState(false);
  const [tempFilters, setTempFilters] = useState<{ status: string[] }>({ status: [] });
  const [activeFilters, setActiveFilters] = useState<{ status: string[] }>({ status: [] });

  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 加载数据
  const loadData = async (searchKeyword = keyword, offset = 0) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const response = generateMockListResponse(
        searchKeyword,
        activeFilters.status,
        offset,
        pageSize
      );
      setListResponse(response);
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
        loadData(value, 0);
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

  // 选择操作
  const getSelectedProcess = (processId: string) =>
    selectedProcesses.find((sp) => sp.process.id === processId);

  const isSelected = (processId: string) => !!getSelectedProcess(processId);

  const handleSelectProcess = (process: ProcessWithVersions, checked: boolean) => {
    if (checked) {
      const newSelected: SelectedProcess = {
        process,
        version_id: process.latest_version_id,
        version_number: process.latest_version,
      };
      onSelectionChange([...selectedProcesses, newSelected]);
    } else {
      onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== process.id));
    }
  };

  const handleVersionChange = (process: ProcessWithVersions, versionId: string) => {
    const version = process.versions.find((v) => v.id === versionId);
    if (!version) return;

    const existingIndex = selectedProcesses.findIndex((sp) => sp.process.id === process.id);
    if (existingIndex >= 0) {
      // 更新已选择的流程版本
      const updated = [...selectedProcesses];
      updated[existingIndex] = {
        ...updated[existingIndex],
        version_id: version.id,
        version_number: version.version,
      };
      onSelectionChange(updated);
    } else {
      // 选择版本时自动选中流程
      const newSelected: SelectedProcess = {
        process,
        version_id: version.id,
        version_number: version.version,
      };
      onSelectionChange([...selectedProcesses, newSelected]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelections = list
        .filter((p) => !isSelected(p.id))
        .map((p) => ({
          process: p,
          version_id: p.latest_version_id,
          version_number: p.latest_version,
        }));
      onSelectionChange([...selectedProcesses, ...newSelections]);
    } else {
      const currentPageIds = new Set(list.map((p) => p.id));
      onSelectionChange(selectedProcesses.filter((sp) => !currentPageIds.has(sp.process.id)));
    }
  };

  const allCurrentPageSelected = list.length > 0 && list.every((p) => isSelected(p.id));
  const someCurrentPageSelected = list.some((p) => isSelected(p.id));

  const columns: ColumnProps<ProcessWithVersions>[] = [
    {
      title: (
        <Checkbox
          checked={allCurrentPageSelected}
          indeterminate={someCurrentPageSelected && !allCurrentPageSelected}
          onChange={(e) => handleSelectAll(e.target.checked as boolean)}
        />
      ),
      dataIndex: 'selection',
      width: 50,
      render: (_: unknown, record: ProcessWithVersions) => (
        <Checkbox
          checked={isSelected(record.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectProcess(record, e.target.checked as boolean);
          }}
        />
      ),
    },
    {
      title: t('release.create.processTable.name'),
      dataIndex: 'name',
      width: 240,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t('release.create.processTable.version'),
      dataIndex: 'versions',
      width: 180,
      render: (_: unknown, record: ProcessWithVersions) => {
        const selected = getSelectedProcess(record.id);
        const currentVersionId = selected?.version_id || record.latest_version_id;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={currentVersionId}
              onChange={(value) => {
                handleVersionChange(record, value as string);
              }}
              style={{ width: 140 }}
              optionList={record.versions.map((v) => ({
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
          </div>
        );
      },
    },
    {
      title: t('release.create.processTable.status'),
      dataIndex: 'is_published',
      width: 100,
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'grey'}>
          {isPublished
            ? t('release.create.processStatus.published')
            : t('release.create.processStatus.unpublished')}
        </Tag>
      ),
    },
  ];

  const statusOptions = [
    { value: 'published', label: t('release.create.processStatus.published') },
    { value: 'unpublished', label: t('release.create.processStatus.unpublished') },
  ];

  return (
    <div className="process-selection-step">
      {/* 工具栏 */}
      <Row
        type="flex"
        justify="space-between"
        align="middle"
        className="process-selection-step-toolbar"
      >
        <Col>
          <Space>
            <Input
              prefix={<IconSearch />}
              placeholder={t('release.create.searchProcessPlaceholder')}
              onChange={(value) => handleSearch(value)}
              showClear
              style={{ width: 280 }}
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
        </Col>
        {selectedProcesses.length > 0 && (
          <Col>
            <Text type="tertiary">
              {t('release.create.selectedCount', { count: selectedProcesses.length })}
            </Text>
          </Col>
        )}
      </Row>

      {/* 表格 */}
      <div className="process-selection-step-table">
        <Table
          dataSource={list}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ y: 'calc(100vh - 480px)' }}
          empty={
            <EmptyState
              variant={keyword || activeFilters.status.length > 0 ? 'noResult' : 'noData'}
              description={
                keyword || activeFilters.status.length > 0
                  ? t('common.noResult')
                  : t('release.create.noProcessData')
              }
            />
          }
          pagination={{
            total,
            pageSize,
            currentPage,
            showSizeChanger: true,
            pageSizeOpts: [10, 20, 50],
            onPageChange: (page) => {
              loadData(keyword, (page - 1) * pageSize);
            },
            onPageSizeChange: (size) => {
              setListResponse((prev) => ({
                ...prev,
                range: { ...prev.range!, size },
              }));
              loadData(keyword, 0);
            },
          }}
          onRow={(record) => ({
            onClick: () =>
              handleSelectProcess(record, !isSelected(record.id)),
            className: isSelected(record?.id)
              ? 'process-selection-step-row-selected'
              : '',
          })}
        />
      </div>
    </div>
  );
};

export default ProcessSelectionStep;
