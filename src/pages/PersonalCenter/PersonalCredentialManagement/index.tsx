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
  Empty,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import CreatePersonalCredentialModal from './components/CreatePersonalCredentialModal';
import EditPersonalCredentialModal from './components/EditPersonalCredentialModal';
import LinkCredentialModal from './components/LinkCredentialModal';
import PersonalCredentialDetailDrawer from './components/PersonalCredentialDetailDrawer';

import './index.less';

// 个人凭据类型定义
export interface PersonalCredential {
  credential_id: string;
  credential_name: string;
  username: string;
  password: string; // 显示为 ******
  description: string | null;
  linked_credentials_count: number; // 关联凭据数量
  created_at: string;
  updated_at: string;
}

export interface PersonalCredentialListResponse {
  data: PersonalCredential[];
  range: {
    offset: number;
    size: number;
    total: number;
  };
}

// Mock数据生成
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const generateMockPersonalCredential = (index: number): PersonalCredential => {
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

  return {
    credential_id: generateUUID(),
    credential_name: names[index % names.length],
    username: `user_${index}@example.com`,
    password: '******',
    description: `这是${names[index % names.length]}的描述信息`,
    linked_credentials_count: (index % 6), // 0-5个关联凭据
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockPersonalCredentialList = (): PersonalCredential[] => {
  return Array.from({ length: 25 }, (_, i) => generateMockPersonalCredential(i));
};

// 模拟API调用
const fetchPersonalCredentialList = async (params: {
  keyword?: string;
  offset?: number;
  size?: number;
}): Promise<PersonalCredentialListResponse> => {
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

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 10,
    keyword: '',
  });

  // 列表数据
  const [listResponse, setListResponse] = useState<PersonalCredentialListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的凭据
  const [editingCredential, setEditingCredential] = useState<PersonalCredential | null>(null);
  const [selectedCredential, setSelectedCredential] = useState<PersonalCredential | null>(null);

  // 模态框/抽屉状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [linkModalVisible, setLinkModalVisible] = useState(false);
  const [linkingCredential, setLinkingCredential] = useState<PersonalCredential | null>(null);
  const [initialDetailTab, setInitialDetailTab] = useState<'basic' | 'usage'>('basic');

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
    debouncedSearch(value);
  };

  // 编辑凭据
  const handleEdit = (record: PersonalCredential) => {
    setEditingCredential(record);
    setEditModalVisible(true);
  };

  // 删除凭据
  const handleDelete = (record: PersonalCredential) => {
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
  const handleRowClick = (record: PersonalCredential) => {
    setSelectedCredential(record);
    setInitialDetailTab('basic');
    setDetailDrawerVisible(true);
  };

  // 关联凭据
  const handleLinkCredential = (record: PersonalCredential) => {
    setLinkingCredential(record);
    setLinkModalVisible(true);
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
      width: 180,
      render: (text: string) => (
        <span className="personal-credential-table-name">{text}</span>
      ),
    },
    {
      title: t('personalCredential.table.username'),
      dataIndex: 'username',
      key: 'username',
      width: 200,
    },
    {
      title: t('common.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('common.createTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: PersonalCredential) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                {t('common.edit')}
              </Dropdown.Item>
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleLinkCredential(record); }}>
                {t('personalCredential.actions.linkCredential')}
              </Dropdown.Item>
              <Dropdown.Item type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>
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
                value={queryParams.keyword || ''}
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
          <TableSkeleton rows={10} columns={5} columnWidths={['20%', '25%', '25%', '20%', '10%']} />
        ) : (
          <Table
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="credential_id"
            loading={loading}
            empty={<EmptyState description={t('personalCredential.noData')} />}
            onRow={(record) => ({
              onClick: () => handleRowClick(record as PersonalCredential),
              style: {
                cursor: 'pointer',
                backgroundColor: selectedCredential?.credential_id === (record as PersonalCredential).credential_id && detailDrawerVisible
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
      />
    </div>
  );
};

export default PersonalCredentialManagement;
