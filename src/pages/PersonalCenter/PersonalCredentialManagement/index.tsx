import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Input,
  Table,
  Dropdown,
  Space,
  Toast,
  Modal,
  Row,
  Col,
  Tag,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconEditStroked,
  IconEyeOpenedStroked,
  IconHistory,
  IconLink,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import type {
  LYPersonalCredentialResponse,
  LYPersonalCredentialListResultResponse,
  GetPersonalCredentialsParams,
} from '@/api/index';
import CreatePersonalCredentialModal from './components/CreatePersonalCredentialModal';
import EditPersonalCredentialModal from './components/EditPersonalCredentialModal';
import LinkCredentialModal from './components/LinkCredentialModal';
import PersonalCredentialDetailDrawer from './components/PersonalCredentialDetailDrawer';

import './index.less';

// 导出类型别名以保持组件兼容性
export type PersonalCredential = LYPersonalCredentialResponse;

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockPersonalCredential = (index: number): LYPersonalCredentialResponse => {
  const names = [
    '个人邮箱',
    'SSH登录',
    '数据库账户',
    'Git仓库',
    'VPN账户',
    'ERP系统',
    'CRM系统',
    'OA系统',
  ];
  const ownerNames = ['张三', '李四', '王五', '赵六'];

  return {
    credential_id: generateUUID(),
    credential_name: names[index % names.length],
    credential_value: {
      username: `user_${index}@example.com`,
      password: '******',
    },
    description: index % 3 === 0 ? `这是${names[index % names.length]}的描述信息，用于管理个人账户凭据，确保安全访问各类系统。` : null,
    linked_credentials_count: index % 6, // 0-5个关联凭据
    owner_id: generateUUID(),
    owner_name: ownerNames[index % ownerNames.length],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockPersonalCredentialList = (): LYPersonalCredentialResponse[] => {
  return Array.from({ length: 25 }, (_, i) => generateMockPersonalCredential(i));
};

// 模拟API调用
const fetchPersonalCredentialList = async (
  params: GetPersonalCredentialsParams
): Promise<LYPersonalCredentialListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockPersonalCredentialList();

  // 关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.credential_name.toLowerCase().includes(keyword));
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 10;
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

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}

const PersonalCredentialManagement = () => {
  const { t } = useTranslation();

  // 搜索框输入值（即时显示）
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 10,
    keyword: '',
  });

  // 列表数据
  const [listResponse, setListResponse] = useState<LYPersonalCredentialListResultResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的凭据
  const [editingCredential, setEditingCredential] = useState<LYPersonalCredentialResponse | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<LYPersonalCredentialResponse | null>(null);

  // 模态框/抽屉状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkingCredential, setLinkingCredential] = useState<LYPersonalCredentialResponse | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<'basic' | 'linked' | 'usage'>('basic');

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchPersonalCredentialList({
        keyword: queryParams.keyword || undefined,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
      });
      setListResponse(response);
    } catch (error) {
      console.error('加载个人凭据列表失败:', error);
      Toast.error(t('personalCredential.list.loadError'));
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, t]);

  // 翻页并返回新数据（用于抽屉导航时自动翻页）
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYPersonalCredentialResponse[]> => {
    setQueryParams(prev => ({ ...prev, page }));
    
    try {
      const response = await fetchPersonalCredentialList({
        keyword: queryParams.keyword || undefined,
        offset: (page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
      });
      setListResponse(response);
      return response.data;
    } catch {
      return [];
    }
  }, [queryParams]);

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

  // 编辑凭据
  const handleEdit = (record: LYPersonalCredentialResponse) => {
    setEditingCredential(record);
    setEditModalVisible(true);
  };

  // 删除凭据
  const handleDelete = (record: LYPersonalCredentialResponse) => {
    Modal.confirm({
      title: t('personalCredential.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: t('personalCredential.deleteModal.confirmMessage'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        // 模拟删除
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('personalCredential.deleteModal.success'));
        loadData();
      },
    });
  };

  // 查看详情（点击行）
  const handleRowClick = (record: LYPersonalCredentialResponse) => {
    setSelectedCredential(record);
    setInitialDetailTab('basic');
    setDetailDrawerVisible(true);
  };

  // 关联凭据
  const handleLinkCredential = (record: LYPersonalCredentialResponse) => {
    setLinkingCredential(record);
    setLinkModalVisible(true);
  };

  // 查看使用记录
  const handleViewUsage = (record: LYPersonalCredentialResponse) => {
    setSelectedCredential(record);
    setInitialDetailTab('usage');
    setDetailDrawerVisible(true);
  };

  // 查看关联的凭据
  const handleViewLinkedCredentials = (record: LYPersonalCredentialResponse) => {
    setSelectedCredential(record);
    setInitialDetailTab('linked');
    setDetailDrawerVisible(true);
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 表格列定义
  const columns = [
    {
      title: t('personalCredential.table.name'),
      dataIndex: 'credential_name',
      key: 'credential_name',
      width: 150,
      render: (text: string) => (
        <span className="personal-credential-table-name">{text}</span>
      ),
    },
    {
      title: t('personalCredential.table.username'),
      dataIndex: 'credential_value',
      key: 'username',
      width: 180,
      render: (_: unknown, record: LYPersonalCredentialResponse) => record.credential_value?.username || '-',
    },
    {
      title: t('personalCredential.table.linkedCredentials'),
      dataIndex: 'linked_credentials_count',
      key: 'linked_credentials_count',
      width: 120,
      render: (count: number) => (
        count > 0 ? (
          <Tag color="blue" size="small">{count} {t('personalCredential.linkedCredentials.countUnit')}</Tag>
        ) : (
          <span>-</span>
        )
      ),
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 180,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('common.createTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LYPersonalCredentialResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item icon={<IconEditStroked />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                {t('common.edit')}
              </Dropdown.Item>
              <Dropdown.Item icon={<IconEyeOpenedStroked />} onClick={(e) => { e.stopPropagation(); handleViewLinkedCredentials(record); }}>
                {t('personalCredential.actions.viewLinkedCredentials')}
              </Dropdown.Item>
              <Dropdown.Item icon={<IconHistory />} onClick={(e) => { e.stopPropagation(); handleViewUsage(record); }}>
                {t('personalCredential.actions.viewUsage')}
              </Dropdown.Item>
              <Dropdown.Item icon={<IconLink />} onClick={(e) => { e.stopPropagation(); handleLinkCredential(record); }}>
                {t('personalCredential.actions.linkCredential')}
              </Dropdown.Item>
              <Dropdown.Item icon={<IconDeleteStroked />} type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>
                {t('common.delete')}
              </Dropdown.Item>
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

  

  return (
    <div className="personal-credential-management">
      {/* 操作栏 */}
      <div className="personal-credential-management-header">
        <Row type="flex" justify="space-between" align="middle" className="personal-credential-management-header-toolbar">
          <Col>
            <Space>
              <Input
                prefix={<IconSearch />}
                placeholder={t('personalCredential.searchPlaceholder')}
                className="personal-credential-management-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
            </Space>
          </Col>
          <Col>
            <Button icon={<IconPlus />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
              {t('personalCredential.createCredential')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div className="personal-credential-management-table">
        {isInitialLoad && loading ? (
          <TableSkeleton rows={10} columns={6} columnWidths={['17%', '20%', '13%', '20%', '18%', '12%']} />
        ) : (
          <Table
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="credential_id"
            loading={loading}
            empty={
              <EmptyState 
                variant={queryParams.keyword ? 'noResult' : 'noData'}
                description={queryParams.keyword ? t('common.noResult') : t('personalCredential.noData')} 
              />
            }
            onRow={(record) => ({
              onClick: () => handleRowClick(record as LYPersonalCredentialResponse),
              style: {
                cursor: 'pointer',
                backgroundColor: selectedCredential?.credential_id === (record as LYPersonalCredentialResponse).credential_id && detailDrawerVisible
                  ? 'var(--semi-color-fill-1)'
                  : undefined,
              },
            })}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
            }}
            scroll={{ y: 'calc(100vh - 380px)' }}
          />
        )}
      </div>

      {/* 新建凭据模态框 */}
      <CreatePersonalCredentialModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadData();
        }}
      />

      {/* 编辑凭据模态框 */}
      <EditPersonalCredentialModal
        visible={editModalVisible}
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

      {/* 关联凭据模态框 */}
      <LinkCredentialModal
        visible={linkModalVisible}
        credential={linkingCredential}
        onCancel={() => {
          setLinkModalVisible(false);
          setLinkingCredential(null);
        }}
        onSuccess={() => {
          setLinkModalVisible(false);
          setLinkingCredential(null);
          loadData();
        }}
      />

      {/* 个人凭据详情抽屉 */}
      <PersonalCredentialDetailDrawer
        visible={detailDrawerVisible}
        credential={selectedCredential}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedCredential(null);
          setInitialDetailTab('basic');
        }}
        onEdit={(credential) => {
          setEditingCredential(credential);
          setEditModalVisible(true);
        }}
        onDelete={() => {
          setDetailDrawerVisible(false);
          setSelectedCredential(null);
          setInitialDetailTab('basic');
          loadData();
        }}
        onLinkCredential={(credential) => {
          setLinkingCredential(credential);
          setLinkModalVisible(true);
        }}
        onRefresh={loadData}
        initialTab={initialDetailTab}
        dataList={listResponse?.data || []}
        onNavigate={(credential) => {
          setSelectedCredential(credential);
        }}
        pagination={{
          currentPage: queryParams.page,
          totalPages: Math.ceil(total / queryParams.pageSize),
          pageSize: queryParams.pageSize,
          total,
        }}
        onPageChange={handleDrawerPageChange}
      />
    </div>
  );
};

export default PersonalCredentialManagement;
