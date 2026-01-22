import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Breadcrumb,
  Button,
  Input,
  Select,
  Table,
  Tag,
  Dropdown,
  Space,
  Toast,
  Modal,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconMore,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import { debounce } from 'lodash';
import AppLayout from '@/components/layout/AppLayout';
import type {
  LYCredentialResponse,
  LYCredentialListResultResponse,
  GetCredentialsParams,
  CredentialType,
} from '@/api/index';
import CreateCredentialModal from '../components/CreateCredentialModal';
import EditCredentialModal from '../components/EditCredentialModal';

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

const CredentialManagementPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // 判断当前入口上下文
  const context: 'development' | 'scheduling' = location.pathname.startsWith('/scheduling')
    ? 'scheduling'
    : 'development';

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
  });

  // 类型筛选
  const [typeFilter, setTypeFilter] = useState<CredentialType | null>(null);

  // 列表数据
  const [listResponse, setListResponse] = useState<LYCredentialListResultResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 选中的凭据（用于编辑）
  const [editingCredential, setEditingCredential] = useState<LYCredentialResponse | null>(null);

  // 模态框状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchCredentialList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        typeFilter,
      });
      setListResponse(response);
    } catch (error) {
      console.error('加载凭据列表失败:', error);
      Toast.error(t('credential.list.loadError'));
    } finally {
      setLoading(false);
    }
  }, [queryParams, typeFilter, context, t]);

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

  // 类型筛选
  const handleTypeFilter = (value: CredentialType | null) => {
    setTypeFilter(value);
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  };

  // 编辑凭据
  const handleEdit = (record: LYCredentialResponse) => {
    setEditingCredential(record);
    setEditModalVisible(true);
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

  // 查看使用记录
  const handleViewUsage = (record: LYCredentialResponse) => {
    const basePath = context === 'development'
      ? '/dev-center/business-assets/credentials'
      : '/scheduling-center/business-assets/credentials';
    navigate(`${basePath}/${record.credential_id}/usage?name=${encodeURIComponent(record.credential_name)}`);
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 获取凭据值显示
  const getCredentialValueDisplay = (record: LYCredentialResponse) => {
    const value = context === 'development' ? record.test_value : record.production_value;
    if (!value) return '-';
    return `${value.username}:${value.password}`;
  };

  // 表格列定义
  const columns = [
    {
      title: t('credential.table.name'),
      dataIndex: 'credential_name',
      key: 'credential_name',
      width: 180,
      render: (text: string) => (
        <span className="credential-management-page-table-name">{text}</span>
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
        <span className="credential-management-page-table-value">
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
        <span className="credential-management-page-table-desc" title={text || ''}>
          {text || '-'}
        </span>
      ),
    },
    {
      title: t('credential.table.linkedPersonalCredential'),
      dataIndex: 'linked_personal_credential_value',
      key: 'linked_personal_credential_value',
      width: 160,
      render: (text: string | null) => (
        <span className="credential-management-page-table-linked">{text || '-'}</span>
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
              <Dropdown.Item onClick={(e) => { e.stopPropagation(); handleViewUsage(record); }}>
                {t('credential.actions.viewUsage')}
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

  // 面包屑配置
  const breadcrumbItems = context === 'development'
    ? [
        { name: t('credential.breadcrumb.developmentCenter'), path: '/development-workbench' },
        { name: t('sidebar.businessAssetConfig') },
        { name: t('sidebar.credentials') },
      ]
    : [
        { name: t('credential.breadcrumb.schedulingCenter'), path: '/scheduling-workbench' },
        { name: t('sidebar.businessAssetConfig') },
        { name: t('sidebar.credentials') },
      ];

  // 类型筛选选项
  const typeOptions = [
    { value: '', label: t('credential.filter.allTypes') },
    { value: 'FIXED_VALUE', label: t('credential.type.fixedValue') },
    { value: 'PERSONAL_REF', label: t('credential.type.personalRef') },
  ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;
  const start = range ? range.offset + 1 : 0;
  const end = range ? range.offset + (listResponse?.data?.length || 0) : 0;

  return (
    <AppLayout>
      <div className="credential-management-page">
        {/* 面包屑 */}
        <div className="credential-management-page-breadcrumb">
          <Breadcrumb>
            {breadcrumbItems.map((item, index) => (
              <Breadcrumb.Item
                key={index}
                onClick={item.path ? () => navigate(item.path!) : undefined}
              >
                {item.name}
              </Breadcrumb.Item>
            ))}
          </Breadcrumb>
        </div>

        {/* 标题工具栏 */}
        <div className="credential-management-page-header">
          <Row type="flex" justify="space-between" align="middle">
            <Col>
              <h1 className="credential-management-page-header-title">
                {t('credential.title')}
              </h1>
            </Col>
            <Col>
              <Button
                theme="solid"
                type="primary"
                icon={<IconPlus />}
                onClick={() => setCreateModalVisible(true)}
              >
                {t('credential.createCredential')}
              </Button>
            </Col>
          </Row>
        </div>

        {/* 筛选工具栏 */}
        <div className="credential-management-page-toolbar">
          <Row type="flex" gutter={12}>
            <Col>
              <Input
                className="credential-management-page-toolbar-search"
                prefix={<IconSearch />}
                placeholder={t('credential.searchPlaceholder')}
                onChange={handleSearch}
                showClear
              />
            </Col>
            <Col>
              <Select
                className="credential-management-page-toolbar-select"
                placeholder={t('credential.filter.type')}
                optionList={typeOptions}
                value={typeFilter || ''}
                onChange={(value) => handleTypeFilter(value as CredentialType | null || null)}
              />
            </Col>
          </Row>
        </div>

        {/* 表格 */}
        <div className="credential-management-page-table">
          <Table
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="credential_id"
            loading={loading}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        </div>

        {/* 分页信息 */}
        {total > 0 && (
          <div className="credential-management-page-pagination-info">
            {t('common.showingRecords', { start, end, total })}
          </div>
        )}

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
      </div>
    </AppLayout>
  );
};

export default CredentialManagementPage;
