import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconFilter,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type {
  LYCredentialResponse,
  LYCredentialListResultResponse,
  GetCredentialsParams,
  CredentialType,
} from '@/api/index';
import CreateCredentialModal from './components/CreateCredentialModal';
import EditCredentialModal from './components/EditCredentialModal';
import CredentialDetailDrawer from './components/CredentialDetailDrawer';
import LinkPersonalCredentialModal from './components/LinkPersonalCredentialModal';

import './index.less';

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockCredential = (index: number): LYCredentialResponse => {
  const types: CredentialType[] = ['FIXED_VALUE', 'PERSONAL_REF'];
  const type = types[index % 2];
  const names = [
    '企业邮箱凭据',
    '数据库连接凭据',
    '第三方API凭据',
    'SSH服务器凭据',
    'Git仓库凭据',
    'ERP系统凭据',
    'CRM系统凭据',
    'OA系统凭据',
  ];

  return {
    credential_id: generateUUID(),
    credential_name: names[index % names.length],
    credential_type: type,
    test_value: {
      username: `test_user_${index}`,
      password: '******',
    },
    production_value: {
      username: `prod_user_${index}`,
      password: '******',
    },
    description: `这是${names[index % names.length]}的描述信息，用于第三方系统的访问认证。`,
    linked_personal_credential_value: type === 'PERSONAL_REF' && index % 3 === 0 ? 'user/******' : '-',
    created_by: generateUUID(),
    created_by_name: ['张三', '李四', '王五', '赵六'][index % 4],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockCredentialList = (): LYCredentialResponse[] => {
  return Array.from({ length: 15 }, (_, i) => generateMockCredential(i));
};

// 模拟API调用
const fetchCredentialList = async (
  params: GetCredentialsParams & { typeFilter?: CredentialType | null }
): Promise<LYCredentialListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockCredentialList();

  // 关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.credential_name.toLowerCase().includes(keyword));
  }

  // 类型筛选
  if (params.typeFilter) {
    data = data.filter((item) => item.credential_type === params.typeFilter);
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

// 凭据类型配置
const typeConfig: Record<CredentialType, { color: 'blue' | 'green'; i18nKey: string }> = {
  FIXED_VALUE: { color: 'blue', i18nKey: 'credential.type.fixedValue' },
  PERSONAL_REF: { color: 'green', i18nKey: 'credential.type.personalRef' },
};

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface CredentialManagementContentProps {
  context: 'development' | 'scheduling';
}

const CredentialManagementContent = ({ context }: CredentialManagementContentProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  // 搜索框输入值（即时显示）
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
  });

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<CredentialType[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);

  // 列表数据
  const [listResponse, setListResponse] = useState<LYCredentialListResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的凭据（用于编辑/详情）
  const [editingCredential, setEditingCredential] = useState<LYCredentialResponse | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<LYCredentialResponse | null>(null);

  // 模态框/抽屉状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [linkPersonalModalVisible, setLinkPersonalModalVisible] = useState(false);
  const [linkingCredential, setLinkingCredential] = useState<LYCredentialResponse | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<'basic' | 'usage'>('basic');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchCredentialList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        typeFilter: typeFilter.length > 0 ? typeFilter[0] : null,
      });
      setListResponse(response);
      return response.data;
    } catch (error) {
      console.error('加载凭据列表失败:', error);
      Toast.error(t('credential.list.loadError'));
      return [];
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, typeFilter, context, t]);

  // 翻页并返回新数据（用于抽屉导航时自动翻页）
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYCredentialResponse[]> => {
    setQueryParams(prev => ({ ...prev, page }));
    
    try {
      const response = await fetchCredentialList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        typeFilter: typeFilter.length > 0 ? typeFilter[0] : null,
      });
      setListResponse(response);
      return response.data;
    } catch {
      return [];
    }
  }, [queryParams, typeFilter, context]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理URL参数 - 从个人凭据跳转过来时自动打开详情抽屉
  useEffect(() => {
    const credentialId = searchParams.get('credentialId');
    if (credentialId && listResponse?.data && !isInitialLoad) {
      // 先在当前列表中查找
      const targetCredential = listResponse.data.find(
        (item) => item.credential_id === credentialId
      );
      if (targetCredential) {
        setSelectedCredential(targetCredential);
        setInitialDetailTab('basic');
        setDetailDrawerVisible(true);
        // 清除URL参数
        setSearchParams({}, { replace: true });
      } else {
        // 如果当前列表中找不到，模拟通过ID获取凭据详情
        const fetchCredentialById = async () => {
          try {
            // 模拟API调用获取单个凭据
            await new Promise((resolve) => setTimeout(resolve, 300));
            const mockCredential = generateMockCredential(0);
            mockCredential.credential_id = credentialId;
            setSelectedCredential(mockCredential);
            setInitialDetailTab('basic');
            setDetailDrawerVisible(true);
            setSearchParams({}, { replace: true });
          } catch (error) {
            console.error('获取凭据详情失败:', error);
            Toast.error(t('credential.detail.loadError'));
            setSearchParams({}, { replace: true });
          }
        };
        fetchCredentialById();
      }
    }
  }, [searchParams, listResponse?.data, isInitialLoad, setSearchParams, t]);

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
    { value: 'FIXED_VALUE', label: t('credential.type.fixedValue') },
    { value: 'PERSONAL_REF', label: t('credential.type.personalRef') },
  ];

  // 点击行查看详情
  const handleRowClick = (record: LYCredentialResponse) => {
    setSelectedCredential(record);
    setInitialDetailTab('basic');
    setDetailDrawerVisible(true);
  };

  // 编辑凭据
  const handleEdit = (record: LYCredentialResponse) => {
    setEditingCredential(record);
    setEditModalVisible(true);
    setDetailDrawerVisible(false);
  };

  // 删除凭据
  const handleDelete = (record: LYCredentialResponse) => {
    Modal.confirm({
      title: t('credential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('credential.deleteModal.confirmMessage', { name: record.credential_name }),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟删除
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('credential.deleteModal.success'));
        loadData();
      },
    });
  };

  // 查看使用记录 - 打开详情抽屉并切换到使用记录tab
  const handleViewUsage = (record: LYCredentialResponse) => {
    setSelectedCredential(record);
    setDetailDrawerVisible(true);
    // 通过 initialTab 属性让详情抽屉直接打开使用记录tab
    setInitialDetailTab('usage');
  };

  // 关联个人凭据
  const handleLinkPersonal = (record: LYCredentialResponse) => {
    setLinkingCredential(record);
    setLinkPersonalModalVisible(true);
  };

  // 解除关联个人凭据
  const handleUnlinkPersonal = (record: LYCredentialResponse) => {
    Modal.confirm({
      title: t('credential.linkPersonal.unlinkConfirmTitle'),
      content: t('credential.linkPersonal.unlinkConfirmContent'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        // 模拟解除关联
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('credential.linkPersonal.unlinkSuccess'));
        loadData();
      },
    });
  };

  // 判断是否已关联个人凭据
  const hasLinkedPersonalCredential = (record: LYCredentialResponse) => {
    return record.linked_personal_credential_value && record.linked_personal_credential_value !== '-';
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 获取凭据值显示（只显示用户名，不显示密码）
  const getCredentialValueDisplay = (record: LYCredentialResponse) => {
    const value = context === 'development' ? record.test_value : record.production_value;
    if (!value) return '-';
    return value.username;
  };

  // 表格列定义
  const columns = [
    {
      title: t('credential.table.name'),
      dataIndex: 'credential_name',
      key: 'credential_name',
      width: 180,
      render: (text: string) => (
        <span className="credential-management-content-table-name">{text}</span>
      ),
    },
    {
      title: context === 'development' 
        ? t('credential.table.testValue') 
        : t('credential.table.productionValue'),
      dataIndex: 'credential_value',
      key: 'credential_value',
      width: 180,
      render: (_: unknown, record: LYCredentialResponse) => (
        <span className="credential-management-content-table-value">
          {getCredentialValueDisplay(record)}
        </span>
      ),
    },
    {
      title: t('credential.table.type'),
      dataIndex: 'credential_type',
      key: 'credential_type',
      width: 120,
      render: (type: CredentialType) => {
        const config = typeConfig[type];
        return <Tag color={config.color}>{t(config.i18nKey)}</Tag>;
      },
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string | null) => (
        text ? (
          <Tooltip content={text} position="top">
            <span className="credential-management-content-table-desc">
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
      render: (_: unknown, record: LYCredentialResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                {t('common.edit')}
              </Dropdown.Item>
              {record.credential_type === 'PERSONAL_REF' && (
                hasLinkedPersonalCredential(record) ? (
                  <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleUnlinkPersonal(record); }}>
                    {t('personalCredential.actions.unlinkCredential')}
                  </Dropdown.Item>
                ) : (
                  <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleLinkPersonal(record); }}>
                    {t('credential.actions.linkPersonal')}
                  </Dropdown.Item>
                )
              )}
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleViewUsage(record); }}>
                {t('credential.actions.viewUsage')}
              </Dropdown.Item>
              {context === 'development' && (
                <Dropdown.Item type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>
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
    <div className="credential-management-content">
      {/* 标题区域 */}
      <div className="credential-management-content-header">
        <div className="credential-management-content-header-title">
          <Title heading={3} className="title">
            {t('credential.title')}
          </Title>
          <Text type="tertiary">{t('credential.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="credential-management-content-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearch />}
                placeholder={t('credential.searchPlaceholder')}
                className="credential-management-content-search-input"
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
                  <div className="credential-filter-popover">
                    <div className="credential-filter-popover-section">
                      <Text strong className="credential-filter-popover-label">
                        {t('credential.filter.type')}
                      </Text>
                      <CheckboxGroup
                        value={typeFilter}
                        onChange={(values) => {
                          setTypeFilter(values as CredentialType[]);
                          setQueryParams((prev) => ({ ...prev, page: 1 }));
                        }}
                        options={typeFilterOptions}
                        direction="horizontal"
                      />
                    </div>
                    <div className="credential-filter-popover-footer">
                      <Button theme="borderless" onClick={() => {
                        setTypeFilter([]);
                        setQueryParams((prev) => ({ ...prev, page: 1 }));
                      }} disabled={typeFilter.length === 0}>
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
                  type={typeFilter.length > 0 ? 'primary' : 'tertiary'}
                  theme={typeFilter.length > 0 ? 'solid' : 'light'}
                >
                  {t('common.filter')}{typeFilter.length > 0 ? ` (${typeFilter.length})` : ''}
                </Button>
              </Popover>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                theme="light" 
                type="tertiary" 
                onClick={() => navigate('/personal-center/personal-credentials')}
              >
                {t('credential.personalCredentialManagement')}
              </Button>
              {context === 'development' && (
                <Button icon={<IconPlus />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
                  {t('credential.createCredential')}
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div className="credential-management-content-table">
        {isInitialLoad ? (
          <TableSkeleton rows={10} columns={5} columnWidths={['20%', '20%', '15%', '30%', '15%']} />
        ) : (
          <Table
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="credential_id"
            loading={loading}
            empty={
              <EmptyState 
                variant={queryParams.keyword ? 'noResult' : 'noData'}
                description={queryParams.keyword ? t('common.noResult') : t('credential.noData')} 
              />
            }
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
            onRow={(record) => ({
              id: `credential-row-${(record as LYCredentialResponse).credential_id}`,
              onClick: () => handleRowClick(record as LYCredentialResponse),
              style: {
                cursor: 'pointer',
                backgroundColor: selectedCredential?.credential_id === (record as LYCredentialResponse).credential_id && detailDrawerVisible
                  ? 'var(--semi-color-primary-light-default)'
                  : undefined,
              },
            })}
          />
        )}
      </div>


      {/* 新建凭据模态框 */}
      <CreateCredentialModal
        visible={createModalVisible}
        context={context}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadData();
        }}
      />

      {/* 编辑凭据模态框 */}
      <EditCredentialModal
        visible={editModalVisible}
        context={context}
        credential={editingCredential}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCredential(null);
        }}
        onSuccess={() => {
          setEditModalVisible(false);
          setEditingCredential(null);
          loadData();
        }}
      />

      {/* 凭据详情抽屉 */}
      <CredentialDetailDrawer
        visible={detailDrawerVisible}
        credential={selectedCredential}
        context={context}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedCredential(null);
          setInitialDetailTab('basic');
        }}
        onEdit={handleEdit}
        onDelete={() => {
          setDetailDrawerVisible(false);
          setSelectedCredential(null);
          setInitialDetailTab('basic');
          loadData();
        }}
        onRefresh={loadData}
        dataList={listResponse?.data || []}
        onNavigate={(credential) => setSelectedCredential(credential)}
        pagination={{
          currentPage: queryParams.page,
          totalPages: Math.ceil((listResponse?.range?.total || 0) / queryParams.pageSize),
          pageSize: queryParams.pageSize,
          total: listResponse?.range?.total || 0,
        }}
        onPageChange={handleDrawerPageChange}
        initialTab={initialDetailTab}
        onScrollToRow={(id) => {
          const row = document.getElementById(`credential-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      {/* 关联个人凭据模态框 */}
      <LinkPersonalCredentialModal
        visible={linkPersonalModalVisible}
        credential={linkingCredential}
        onCancel={() => {
          setLinkPersonalModalVisible(false);
          setLinkingCredential(null);
        }}
        onSuccess={() => {
          setLinkPersonalModalVisible(false);
          setLinkingCredential(null);
          loadData();
        }}
      />
    </div>
  );
};

export default CredentialManagementContent;
