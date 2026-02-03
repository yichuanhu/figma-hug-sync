import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Input,
  Tag,
  Row,
  Col,
  Space,
  Tree,
  Spin,
} from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
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
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

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
      
      // 搜索时自动展开匹配的流程
      if (searchKeyword) {
        setExpandedKeys(response.list.map((p) => p.id));
      }
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

  // 获取已选中的版本key列表
  const selectedVersionKeys = useMemo(() => {
    return selectedProcesses.map((sp) => sp.version_id);
  }, [selectedProcesses]);

  // 处理选择变化
  const handleSelect = (
    selectedKey: string,
    selected: boolean,
    selectedNode: TreeNodeData
  ) => {
    const nodeKey = selectedNode.key as string;
    
    // 判断是流程节点还是版本节点
    const isVersionNode = nodeKey.startsWith('ver-');
    
    if (isVersionNode) {
      // 版本节点处理
      const processId = (selectedNode as TreeNodeData & { processId?: string }).processId;
      const process = processList.find((p) => p.id === processId);
      if (!process) return;

      const version = process.versions.find((v) => v.id === nodeKey);
      if (!version) return;

      if (selected) {
        // 选中版本：移除该流程的其他版本，添加新版本
        const filtered = selectedProcesses.filter((sp) => sp.process.id !== processId);
        onSelectionChange([
          ...filtered,
          {
            process,
            version_id: version.id,
            version_number: version.version,
          },
        ]);
      } else {
        // 取消选中：移除该流程
        onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== processId));
      }
    } else {
      // 流程节点处理
      const process = processList.find((p) => p.id === nodeKey);
      if (!process) return;

      const isCurrentlySelected = selectedProcesses.some((sp) => sp.process.id === nodeKey);

      if (!isCurrentlySelected) {
        // 选中流程：默认选中最新版本并展开
        onSelectionChange([
          ...selectedProcesses,
          {
            process,
            version_id: process.latest_version_id,
            version_number: process.latest_version,
          },
        ]);
        if (!expandedKeys.includes(nodeKey)) {
          setExpandedKeys([...expandedKeys, nodeKey]);
        }
      } else {
        // 取消选中流程
        onSelectionChange(selectedProcesses.filter((sp) => sp.process.id !== nodeKey));
      }
    }
  };

  // 构建树形数据
  const treeData: TreeNodeData[] = useMemo(() => {
    return processList.map((process) => {
      const selectedProcess = selectedProcesses.find((sp) => sp.process.id === process.id);
      
      return {
        key: process.id,
        label: (
          <div className="process-tree-node">
            <Text strong className="process-tree-node-name">{process.name}</Text>
            <Tag size="small" color={process.is_published ? 'green' : 'grey'}>
              {process.is_published
                ? t('release.create.processStatus.published')
                : t('release.create.processStatus.unpublished')}
            </Tag>
          </div>
        ),
        children: process.versions.map((version) => ({
          key: version.id,
          processId: process.id,
          label: (
            <div className="version-tree-node">
              <Text className="version-tree-node-text">{version.version}</Text>
              {version.is_published && (
                <Tag size="small" color="green">
                  {t('release.create.processStatus.published')}
                </Tag>
              )}
              {selectedProcess?.version_id === version.id && (
                <Tag size="small" color="blue">
                  {t('release.create.selected')}
                </Tag>
              )}
            </div>
          ),
        })),
      };
    });
  }, [processList, selectedProcesses, t]);

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

      {/* 树形选择区域 */}
      <div className="process-selection-step-tree">
        <Spin spinning={loading}>
          {processList.length > 0 ? (
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              onExpand={(keys) => setExpandedKeys(keys as string[])}
              onSelect={handleSelect}
              className="process-tree"
            />
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
  );
};

export default ProcessSelectionStep;
