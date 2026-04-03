import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Input,
  Table,
  Tag,
  Dropdown,
  Space,
  Toast,
  Modal,
  Row,
  Col,
  Typography,
  Tooltip,
  Breadcrumb,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import {
  IconSearchStroked,
  IconPlusStroked,
  IconMoreStroked,
  IconDeleteStroked,
  IconEditStroked,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import { UserPlus } from 'lucide-react';
import type {
  LYParameterResponse,
  LYParameterListResultResponse,
  GetParametersParams,
  ParameterType,
} from '@/api/index';
import CreateParameterModal from './components/CreateParameterModal';
import EditParameterModal from './components/EditParameterModal';
import ParameterDetailDrawer from './components/ParameterDetailDrawer';
import CollaboratorAddModal from '@/components/CollaboratorManager/CollaboratorAddModal';
import type { CollaboratorAssetType } from '@/api/index';

import './index.less';

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockParameter = (index: number): LYParameterResponse => {
  const types: ParameterType[] = [1, 2, 3];
  const type = types[index % 3];
  const names = [
    'Heartbeat Interval',
    'Task Timeout',
    'Enable Debug Mode',
    'Max Concurrency',
    'Default Language',
    'Retry Count',
    'Log Level',
    'Cache Duration',
  ];

  const getValueByType = (t: ParameterType, isDevValue: boolean): string => {
    const suffix = isDevValue ? '_dev' : '_prod';
    switch (t) {
      case 1: // 文本
        return `value${suffix}_${index}`;
      case 2: // 布尔
        return index % 2 === 0 ? 'True' : 'False';
      case 3: // 数值
        return String(30 + index * 10);
      default:
        return '';
    }
  };

  return {
    parameter_id: generateUUID(),
    parameter_name: names[index % names.length],
    parameter_type: type,
    dev_value: getValueByType(type, true),
    prod_value: index % 3 === 0 ? null : getValueByType(type, false),
    description: index === 0
      ? 'Core system configuration parameter controlling the heartbeat detection frequency between bots and the server. Directly affects online status detection sensitivity and server resource usage. Tune based on network conditions and bot scale in production.'
      : `Description for ${names[index % names.length]}, used for system configuration.`,
    is_published: index % 3 !== 0,
    created_by: `user-00${(index % 4) + 1}`,
    created_by_name: ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao'][index % 4],
    created_by_department: ['R&D Dept', 'Product Dept', 'QA Dept', 'Ops Dept'][index % 4],
    created_by_role: ['Senior Engineer', 'Product Manager', 'QA Engineer', 'Ops Engineer'][index % 4],
    created_by_email: ['john.smith@example.com', 'jane.doe@example.com', 'mike.wang@example.com', 'david.zhao@example.com'][index % 4],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockParameterList = (): LYParameterResponse[] => {
  return Array.from({ length: 15 }, (_, i) => generateMockParameter(i));
};

// 模拟API调用
const fetchParameterList = async (
  params: GetParametersParams & { typeFilter?: ParameterType | null; publishedFilter?: boolean | null }
): Promise<LYParameterListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockParameterList();

  // 调度中心只显示已发布的参数
  if (params.context === 'scheduling') {
    data = data.filter((item) => item.is_published);
  }

  // 关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.parameter_name.toLowerCase().includes(keyword));
  }

  // 类型筛选
  if (params.typeFilter) {
    data = data.filter((item) => item.parameter_type === params.typeFilter);
  }

  // 发布状态筛选
  if (params.publishedFilter !== null && params.publishedFilter !== undefined) {
    data = data.filter((item) => item.is_published === params.publishedFilter);
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const pagedData = data.slice(offset, offset + size);

  return {
    data: pagedData,
    range: {
      offset,
      size: pagedData.length,
      total,
    },
  };
};

// 参数类型配置
const typeConfig: Record<ParameterType, { color: 'blue' | 'green' | 'orange'; i18nKey: string }> = {
  1: { color: 'blue', i18nKey: 'parameter.type.text' },
  2: { color: 'green', i18nKey: 'parameter.type.boolean' },
  3: { color: 'orange', i18nKey: 'parameter.type.number' },
};

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface ParameterManagementContentProps {
  context: 'development' | 'scheduling';
}

const ParameterManagementContent = ({ context }: ParameterManagementContentProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 搜索框输入值（即时显示）
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
  });

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<ParameterType[]>([]);
  // 发布状态筛选（仅开发中心使用）
  const [publishedFilter, setPublishedFilter] = useState<boolean | null>(null);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  const [addCollaboratorModalVisible, setAddCollaboratorModalVisible] = useState(false);
  const [addCollaboratorAssetId, setAddCollaboratorAssetId] = useState('');

  // 列表数据
  const [listResponse, setListResponse] = useState<LYParameterListResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的参数（用于编辑/详情）
  const [editingParameter, setEditingParameter] = useState<LYParameterResponse | null>(null);
  const [selectedParameter, setSelectedParameter] = useState<LYParameterResponse | null>(null);

  // 模态框/抽屉状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchParameterList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        typeFilter: typeFilter.length > 0 ? typeFilter[0] : null,
        publishedFilter: context === 'development' ? publishedFilter : null,
      });
      setListResponse(response);
      return response.data;
    } catch (error) {
      console.error('加载参数列表失败:', error);
      Toast.error(t('parameter.list.loadError'));
      return [];
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, typeFilter, publishedFilter, context, t]);

  // 翻页并返回新数据（用于抽屉导航时自动翻页）
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYParameterResponse[]> => {
    setQueryParams(prev => ({ ...prev, page }));
    
    try {
      const response = await fetchParameterList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        typeFilter: typeFilter.length > 0 ? typeFilter[0] : null,
        publishedFilter: context === 'development' ? publishedFilter : null,
      });
      setListResponse(response);
      return response.data;
    } catch {
      return [];
    }
  }, [queryParams, typeFilter, publishedFilter, context]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索防抖
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams((prev) => ({ ...prev, page: 1, keyword: value }));
      }, 500),
    []
  );

  const handleSearch = (value: string) => {
    setSearchValue(value);  // 立即更新输入框显示
    debouncedSearch(value); // 防抖更新查询参数
  };

  // 类型筛选选项（用于Popover CheckboxGroup）
  const typeFilterOptions = [
    { value: 1, label: t('parameter.type.text') },
    { value: 2, label: t('parameter.type.boolean') },
    { value: 3, label: t('parameter.type.number') },
  ];

  // 发布状态筛选选项
  const publishedFilterOptions = [
    { value: true, label: t('parameter.detail.published') },
    { value: false, label: t('parameter.detail.unpublished') },
  ];

  // 计算筛选数量
  const filterCount = typeFilter.length + (publishedFilter !== null ? 1 : 0);

  // 点击行查看详情
  const handleRowClick = (record: LYParameterResponse) => {
    setSelectedParameter(record);
    setDetailInitialTab('basic');
    setDetailDrawerVisible(true);
  };

  // 编辑参数
  const handleEdit = (record: LYParameterResponse) => {
    setEditingParameter(record);
    setEditModalVisible(true);
    setDetailDrawerVisible(false);
  };

  // 删除参数
  const handleDelete = (record: LYParameterResponse) => {
    // 检查是否已发布
    if (record.is_published) {
      Toast.error(t('parameter.deleteModal.publishedError'));
      return;
    }

    Modal.confirm({
      title: t('parameter.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('parameter.deleteModal.confirmMessage', { name: record.parameter_name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟删除
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('parameter.deleteModal.success'));
        loadData();
      },
    });
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 获取参数值显示
  const getParameterValueDisplay = (record: LYParameterResponse) => {
    const value = context === 'development' ? record.dev_value : record.prod_value;
    if (value === null || value === undefined) return '-';
    return value;
  };

  // 表格列定义
  const columns = [
    {
      title: t('parameter.table.name'),
      dataIndex: 'parameter_name',
      key: 'parameter_name',
      width: 180,
      ellipsis: true,
    },
    {
      title: t('parameter.table.type'),
      dataIndex: 'parameter_type',
      key: 'parameter_type',
      width: 100,
      sorter: (a: LYParameterResponse, b: LYParameterResponse) => a.parameter_type - b.parameter_type,
      render: (type: ParameterType) => {
        const config = typeConfig[type];
        return <Tag color={config.color}>{t(config.i18nKey)}</Tag>;
      },
    },
    {
      title: context === 'development' 
        ? t('parameter.table.devValue') 
        : t('parameter.table.prodValue'),
      dataIndex: 'parameter_value',
      key: 'parameter_value',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: LYParameterResponse) => getParameterValueDisplay(record),
    },
    // 发布状态列 - 仅开发中心显示
    ...(context === 'development' ? [{
      title: t('parameter.detail.isPublished'),
      dataIndex: 'is_published',
      key: 'is_published',
      width: 100,
      sorter: (a: LYParameterResponse, b: LYParameterResponse) => {
        // 已发布排在前面
        if (a.is_published === b.is_published) return 0;
        return a.is_published ? -1 : 1;
      },
      render: (isPublished: boolean) => (
        isPublished ? (
          <Tag color="green">{t('parameter.detail.published')}</Tag>
        ) : (
          <Tag color="grey">{t('parameter.detail.unpublished')}</Tag>
        )
      ),
    }] : []),
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LYParameterResponse) => {
        // 已发布的参数不允许编辑和删除
        const canEdit = !record.is_published;
        const canDelete = context === 'development' && !record.is_published;

        return (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={
              <Dropdown.Menu>
                {canEdit && (
                  <Dropdown.Item icon={<IconEditStroked />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                    {t('common.edit')}
                  </Dropdown.Item>
                )}
                <Dropdown.Item icon={<UserPlus size={16} strokeWidth={2} style={{ color: "inherit" }} />} onClick={(e) => { e.stopPropagation(); setAddCollaboratorAssetId(record.parameter_id); setAddCollaboratorModalVisible(true); }}>
                  {t('collaborator.actions.addCollaborator')}
                </Dropdown.Item>
                {canDelete && (
                  <Dropdown.Item 
                    icon={<IconDeleteStroked />}
                    type="danger" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
                  >
                    {t('common.delete')}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            }
          >
            <Button icon={<IconMoreStroked />} theme="borderless" type="tertiary" onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        );
      },
    },
  ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;

  const { Title, Text } = Typography;

  return (
    <div className="parameter-management-content">



      {/* 标题区域 */}
      <div className="parameter-management-content-header">
        <div className="parameter-management-content-header-title">
          <Title heading={3} className="title">
            {t('parameter.title')}
          </Title>
          <Text type="tertiary">{t('parameter.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="parameter-management-content-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('parameter.searchPlaceholder')}
                className="parameter-management-content-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <FilterPopover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                onConfirm={(values) => {
                  setTypeFilter((values.type as ParameterType[]) || []);
                  setPublishedFilter(
                    values.published !== null && values.published !== undefined
                      ? (values.published as boolean)
                      : null
                  );
                  setQueryParams((prev) => ({ ...prev, page: 1 }));
                }}
                sections={[
                  {
                    key: 'type',
                    label: t('parameter.filter.type'),
                    type: 'checkbox',
                    options: typeFilterOptions,
                    value: typeFilter,
                  },
                  ...(context === 'development'
                    ? [
                        {
                          key: 'published',
                          label: t('parameter.detail.isPublished'),
                          type: 'radio' as const,
                          options: publishedFilterOptions,
                          value: publishedFilter,
                        },
                      ]
                    : []),
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Button
              icon={<IconPlusStroked />}
              theme="solid"
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              {t('parameter.createParameter')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="parameter-management-content-table">
        {isInitialLoad ? (
          <TableSkeleton columns={5} rows={10} />
        ) : (
          <Table
            size="small"
            dataSource={listResponse?.data || []}
            columns={columns}
            rowKey="parameter_id"
            loading={loading}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
              onPageSizeChange: (newPageSize) => setQueryParams((prev) => ({ ...prev, page: 1, pageSize: newPageSize })),
              showTotal: true,
              showSizeChanger: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
            empty={
              <EmptyState
                variant={queryParams.keyword || filterCount > 0 ? 'noResult' : 'noData'}
                description={queryParams.keyword || filterCount > 0 
                  ? t('parameter.empty.filterDescription') 
                  : t('parameter.empty.defaultDescription')}
              />
            }
            onRow={(record) => ({
              id: `parameter-row-${(record as LYParameterResponse).parameter_id}`,
              onClick: () => handleRowClick(record as LYParameterResponse),
              className: selectedParameter?.parameter_id === record?.parameter_id && detailDrawerVisible 
                ? 'parameter-management-row-selected' 
                : '',
            })}
          />
        )}
      </div>

      {/* 新建参数弹窗 */}
      <CreateParameterModal
        visible={createModalVisible}
        context={context}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadData();
        }}
      />

      {/* 编辑参数弹窗 */}
      <EditParameterModal
        visible={editModalVisible}
        parameter={editingParameter}
        context={context}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingParameter(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setEditingParameter(null);
          loadData();
        }}
      />

      {/* 参数详情抽屉 */}
      <ParameterDetailDrawer
        visible={detailDrawerVisible}
        parameter={selectedParameter}
        context={context}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedParameter(null);
        }}
        onEdit={handleEdit}
        onDelete={context === 'development' ? handleDelete : undefined}
        allParameters={listResponse?.data || []}
        onParameterChange={setSelectedParameter}
        pagination={{
          currentPage: queryParams.page,
          pageSize: queryParams.pageSize,
          total,
          totalPages: Math.ceil(total / queryParams.pageSize),
        }}
        onPageChange={handleDrawerPageChange}
        initialTab={detailInitialTab}
        onScrollToRow={(id) => {
          const row = document.getElementById(`parameter-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      <CollaboratorAddModal
        visible={addCollaboratorModalVisible}
        onClose={() => setAddCollaboratorModalVisible(false)}
        onSuccess={() => setAddCollaboratorModalVisible(false)}
        assetType={'PARAMETER' as CollaboratorAssetType}
        assetId={addCollaboratorAssetId}
        existingCollaborators={[]}
      />
    </div>
  );
};

export default ParameterManagementContent;
