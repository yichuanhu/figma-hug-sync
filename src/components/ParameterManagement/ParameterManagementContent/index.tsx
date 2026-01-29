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
  Popover,
  CheckboxGroup,
  Tooltip,
  Breadcrumb,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconFilter,
  IconEditStroked,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type {
  LYParameterResponse,
  LYParameterListResultResponse,
  GetParametersParams,
  ParameterType,
} from '@/api/index';
import CreateParameterModal from './components/CreateParameterModal';
import EditParameterModal from './components/EditParameterModal';
import ParameterDetailDrawer from './components/ParameterDetailDrawer';

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
    '心跳间隔',
    '任务超时时间',
    '启用调试模式',
    '最大并发数',
    '默认语言',
    '重试次数',
    '日志级别',
    '缓存时间',
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
    description: `这是${names[index % names.length]}的描述信息，用于系统配置。`,
    is_published: index % 3 !== 0,
    created_by: generateUUID(),
    created_by_name: ['张三', '李四', '王五', '赵六'][index % 4],
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
      render: (text: string) => (
        <span className="parameter-management-content-table-name">{text}</span>
      ),
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
      render: (_: unknown, record: LYParameterResponse) => (
        <Tooltip content={getParameterValueDisplay(record)} position="top">
          <span className="parameter-management-content-table-value">
            {getParameterValueDisplay(record)}
          </span>
        </Tooltip>
      ),
    },
    {
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
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string | null) => (
        text ? (
          <Tooltip content={text} position="top">
            <span className="parameter-management-content-table-desc">
              {text}
            </span>
          </Tooltip>
        ) : (
          <span>-</span>
        )
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LYParameterResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item icon={<IconEditStroked />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                {t('common.edit')}
              </Dropdown.Item>
              {context === 'development' && (
                <Dropdown.Item 
                  icon={<IconDeleteStroked />}
                  type="danger" 
                  disabled={record.is_published}
                  onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
                >
                  {t('common.delete')}
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMore />} theme="borderless" type="tertiary" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;

  const { Title, Text } = Typography;

  return (
    <div className="parameter-management-content">
      {/* 面包屑 */}
      <div className="parameter-management-content-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')}>
            {t('common.home')}
          </Breadcrumb.Item>
          <Breadcrumb.Item onClick={() => navigate(context === 'development' ? '/development-workbench' : '/scheduling-workbench')}>
            {context === 'development' ? t('development.processDevelopment.breadcrumb.developmentCenter') : t('scheduling.processDevelopment.breadcrumb.schedulingCenter')}
          </Breadcrumb.Item>
          <Breadcrumb.Item>{t('parameter.breadcrumb.businessAssets')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('parameter.title')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

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
                prefix={<IconSearch />}
                placeholder={t('parameter.searchPlaceholder')}
                className="parameter-management-content-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <Popover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                trigger="click"
                position="bottomLeft"
                content={
                  <div className="parameter-filter-popover">
                    <div className="parameter-filter-popover-section">
                      <Text strong className="parameter-filter-popover-label">
                        {t('parameter.filter.type')}
                      </Text>
                      <CheckboxGroup
                        value={typeFilter}
                        onChange={(values) => {
                          setTypeFilter(values as ParameterType[]);
                          setQueryParams((prev) => ({ ...prev, page: 1 }));
                        }}
                        options={typeFilterOptions}
                        direction="horizontal"
                      />
                    </div>
                    {context === 'development' && (
                      <div className="parameter-filter-popover-section">
                        <Text strong className="parameter-filter-popover-label">
                          {t('parameter.detail.isPublished')}
                        </Text>
                        <CheckboxGroup
                          value={publishedFilter !== null ? [publishedFilter] : []}
                          onChange={(values) => {
                            // 只允许单选
                            const newValue = values.length > 0 ? values[values.length - 1] as boolean : null;
                            setPublishedFilter(newValue);
                            setQueryParams((prev) => ({ ...prev, page: 1 }));
                          }}
                          options={publishedFilterOptions}
                          direction="horizontal"
                        />
                      </div>
                    )}
                    <div className="parameter-filter-popover-footer">
                      <Button theme="borderless" onClick={() => {
                        setTypeFilter([]);
                        setPublishedFilter(null);
                        setQueryParams((prev) => ({ ...prev, page: 1 }));
                      }} disabled={typeFilter.length === 0 && publishedFilter === null}>
                        {t('common.reset')}
                      </Button>
                      <Button theme="solid" type="primary" onClick={() => setFilterPopoverVisible(false)}>
                        {t('common.confirm')}
                      </Button>
                    </div>
                  </div>
                }
              >
                <Button
                  icon={<IconFilter />}
                  type={filterCount > 0 ? 'primary' : 'tertiary'}
                  theme={filterCount > 0 ? 'solid' : 'light'}
                >
                  {t('common.filter')}{filterCount > 0 ? ` (${filterCount})` : ''}
                </Button>
              </Popover>
            </Space>
          </Col>
          <Col>
            <Button
              icon={<IconPlus />}
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
            dataSource={listResponse?.data || []}
            columns={columns}
            rowKey="parameter_id"
            loading={loading}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
              showTotal: true,
              showSizeChanger: false,
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
        currentPage={queryParams.page}
        pageSize={queryParams.pageSize}
        total={total}
        onPageChange={handleDrawerPageChange}
        onParameterChange={setSelectedParameter}
        onScrollToRow={(id) => {
          const row = document.getElementById(`parameter-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />
    </div>
  );
};

export default ParameterManagementContent;
