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
  Tooltip,
  Breadcrumb,
  Pagination,
} from '@douyinfe/semi-ui';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import DepartmentSelect from '@/components/DepartmentSelect';
import { Ellipsis, History, Link, Pencil, Plus, Trash2, Unlink, UserPlus } from 'lucide-react';
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
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';

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
    'Enterprise Email Credential',
    'Database Connection Credential',
    'Third-party API Credential',
    'SSH Server Credential',
    'Git Repository Credential',
    'ERP System Credential',
    'CRM System Credential',
    'OA System Credential',
  ];

  // 部分凭据已发布
  const isPublished = index % 3 === 0;

  const deptNames = ['Finance Department', 'R&D Center', 'Enterprise Business Center', 'Human Resources Department'];
  const deptIds = ['dept-finance', 'dept-rd', 'dept-enterprise', 'dept-hr'];

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
    description: index === 0
      ? 'Unified authentication credential for core enterprise systems, used by automation processes to access multiple linked systems. Supports SSO, OAuth 2.0, and LDAP integration. Ensure secure network environment and update passwords regularly for compliance. Full audit trail of credential usage.'
      : `Description for ${names[index % names.length]}, used for third-party system authentication.`,
    linked_personal_credential_value: type === 'PERSONAL_REF' && index % 3 === 0 ? 'user/******' : '-',
    is_published: isPublished,
    owning_department_id: deptIds[index % deptIds.length],
    owning_department_name: deptNames[index % deptNames.length],
    created_by: `user-00${(index % 4) + 1}`,
    created_by_name: ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao'][index % 4],
    created_by_department: ['R&D Dept', 'Product Dept', 'QA Dept', 'Ops Dept'][index % 4],
    created_by_role: ['Senior Engineer', 'Product Manager', 'QA Engineer', 'Ops Engineer'][index % 4],
    created_by_email: ['john.smith@example.com', 'jane.doe@example.com', 'mike.wang@example.com', 'david.zhao@example.com'][index % 4],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockCredentialList = (): LYCredentialResponse[] => {
  return Array.from({ length: 15 }, (_, i) => generateMockCredential(i));
};

// 模拟API调用
const fetchCredentialList = async (
  params: GetCredentialsParams & { typeFilter?: CredentialType | null; departmentFilter?: string[] }
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

  // 部门筛选
  if (params.departmentFilter && params.departmentFilter.length > 0) {
    data = data.filter((item) => params.departmentFilter!.includes((item as any).owning_department_name));
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
  // 部门筛选
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

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
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

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
        departmentFilter,
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
  }, [queryParams, typeFilter, departmentFilter, context, t]);

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
        departmentFilter,
      });
      setListResponse(response);
      return response.data;
    } catch {
      return [];
    }
  }, [queryParams, typeFilter, departmentFilter, context]);

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
      content: (
        <div>
          <div>{t('credential.deleteModal.confirmMessage', { name: record.credential_name })}</div>
          {record.is_published && (
            <div style={{ color: 'var(--semi-color-warning)', marginTop: 8 }}>{t('credential.deleteModal.publishedWarning')}</div>
          )}
        </div>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
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
      ellipsis: true,
    },
    {
      title: context === 'development' 
        ? t('credential.table.testValue') 
        : t('credential.table.productionValue'),
      dataIndex: 'credential_value',
      key: 'credential_value',
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: LYCredentialResponse) => getCredentialValueDisplay(record),
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
    // 发布状态列 - 仅开发中心显示
    ...(context === 'development' ? [{
      title: t('credential.detail.publishStatus'),
      dataIndex: 'is_published',
      key: 'is_published',
      width: 100,
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'grey'}>
          {isPublished ? t('credential.detail.published') : t('credential.detail.unpublished')}
        </Tag>
      ),
    }] : []),
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
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
      render: (_: unknown, record: LYCredentialResponse) => {
        const canDelete = context === 'development';

        return (
          <Dropdown
            trigger="click"
            position="bottomRight"
            clickToHide
            render={
              <Dropdown.Menu>
                <Dropdown.Item icon={<Pencil size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                  {t('common.edit')}
                </Dropdown.Item>
                {record.credential_type === 'PERSONAL_REF' && (
                  hasLinkedPersonalCredential(record) ? (
                    <Dropdown.Item icon={<Unlink size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleUnlinkPersonal(record); }}>
                      {t('personalCredential.actions.unlinkCredential')}
                    </Dropdown.Item>
                  ) : (
                    <Dropdown.Item icon={<Link size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleLinkPersonal(record); }}>
                      {t('credential.actions.linkPersonal')}
                    </Dropdown.Item>
                  )
                )}
                <Dropdown.Item icon={<History size={16} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); handleViewUsage(record); }}>
                  {t('credential.actions.viewUsage')}
                </Dropdown.Item>
                <Dropdown.Item icon={<UserPlus size={14} strokeWidth={2} />} onClick={(e) => { e.stopPropagation(); openCollaborator(record.credential_id); }}>
                  {t('collaborator.actions.addCollaborator')}
                </Dropdown.Item>
                {canDelete && (
                  <Dropdown.Item icon={<Trash2 size={16} strokeWidth={2} />} type="danger" onClick={(e) => { e.stopPropagation(); handleDelete(record); }}>
                    {t('common.delete')}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            }
          >
            <Button icon={<Ellipsis size={16} strokeWidth={2} />} theme="borderless" type="tertiary" onClick={(e) => e.stopPropagation()} />
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
                prefix={<IconSearchStroked />}
                placeholder={t('credential.searchPlaceholder')}
                className="credential-management-content-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <DepartmentSelect
                placeholder={t('common.filterDepartment')}
                value={departmentFilter}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams((prev) => ({ ...prev, page: 1 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
              />
              <FilterPopover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                onConfirm={(values) => {
                  setTypeFilter((values.type as CredentialType[]) || []);
                  setQueryParams((prev) => ({ ...prev, page: 1 }));
                }}
                sections={[
                  {
                    key: 'type',
                    label: t('credential.filter.type'),
                    type: 'checkbox',
                    options: typeFilterOptions,
                    value: typeFilter,
                  },
                ]}
              />
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
                <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>
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
            size="small"
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="credential_id"
            loading={loading}
            empty={
              <EmptyState 
                variant={(queryParams.keyword || departmentFilter.length > 0 || typeFilter.length > 0) ? 'noResult' : 'noData'}
                description={(queryParams.keyword || departmentFilter.length > 0 || typeFilter.length > 0) ? t('common.noResult') : t('credential.noData')} 
              />
            }
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
              onPageSizeChange: (newPageSize) => setQueryParams((prev) => ({ ...prev, page: 1, pageSize: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
            onRow={(record) => ({
              id: `credential-row-${(record as LYCredentialResponse).credential_id}`,
              onClick: () => handleRowClick(record as LYCredentialResponse),
              className: selectedCredential?.credential_id === (record as LYCredentialResponse).credential_id && detailDrawerVisible
                ? 'credential-management-row-selected'
                : undefined,
              style: { cursor: 'pointer' },
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

      {renderCollaboratorPanel('CREDENTIAL', context)}
    </div>
  );
};

export default CredentialManagementContent;
