import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Typography, 
  Input, 
  Button, 
  Table, 
  Dropdown,
  Row,
  Col,
  Space,
  Modal,
  Toast,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
  IconSearchStroked, 
  IconPlusStroked, 
  IconMoreStroked, 
  IconEyeOpenedStroked, 
  IconEditStroked, 
  IconDeleteStroked,
  IconUserAdd,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { debounce } from 'lodash';
import WorkerGroupDetailDrawer from './components/WorkerGroupDetailDrawer';
import CreateWorkerGroupModal from './components/CreateWorkerGroupModal';
import EditWorkerGroupModal from './components/EditWorkerGroupModal';
import AddMembersModal from './components/AddMembersModal';
import type { LYWorkerGroupResponse, LYListResponseLYWorkerGroupResponse, GetWorkerGroupsParams } from '@/api';
import './index.less';

const { Title, Text } = Typography;

// MockData
const mockWorkerGroups: LYWorkerGroupResponse[] = [
  {
    id: 'group-001',
    name: 'Finance Bot Group',
    description: 'This is the core enterprise finance automation bot group, Contains multiple high-performance bots, Specifically for executing财务相 automation flow任务. 该组负责handling invoice recognition and entry, Expense Reimbursement Approval, Auto Financial Report and 分发, 银企对账, 税务Data准备 etc.关键业务Process. 支持任务负载均衡 and 故障自动转移, 确保业务连续性. ',
    member_count: 5,
    creator_id: 'admin',
    creator_name: 'Admin',
    created_at: '2025-01-05 14:30:00',
    updated_at: '2025-01-08 10:00:00',
  },
  {
    id: 'group-002',
    name: 'HR Bot Group',
    description: 'For HR审批, onboarding离职Processautomation',
    member_count: 3,
    creator_id: 'hr_admin',
    creator_name: 'HRAdmin',
    created_at: '2025-01-06 09:15:00',
    updated_at: '2025-01-07 16:30:00',
  },
  {
    id: 'group-003',
    name: 'Ops Inspection Bot Group',
    description: '用于Serverinspection, Loganalysis etc.运维任务',
    member_count: 2,
    creator_id: 'ops_admin',
    creator_name: '运维Admin',
    created_at: '2025-01-04 11:20:00',
    updated_at: '2025-01-06 18:45:00',
  },
  {
    id: 'group-004',
    name: '测试automationbot组',
    description: '用于automation测试任务's Execute',
    member_count: 0,
    creator_id: 'qa_admin',
    creator_name: 'QAAdmin',
    created_at: '2025-01-03 15:45:00',
    updated_at: '2025-01-03 15:45:00',
  },
];

// Data获取
const fetchWorkerGroupList = async (params: GetWorkerGroupsParams): Promise<LYListResponseLYWorkerGroupResponse> => {
  // 模拟Network延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let data = [...mockWorkerGroups];

  // 关键词Search
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      (item.description?.toLowerCase().includes(keyword) ?? false)
    );
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = data.slice(offset, offset + size);

  return {
    range: {
      offset,
      size,
      total,
    },
    list: paginatedData,
  };
};

interface WorkerGroupManagementProps {
  isActive?: boolean;
  onNavigateToWorkerDetail?: (workerId: string) => void;
}

const WorkerGroupManagement = ({ isActive = true, onNavigateToWorkerDetail }: WorkerGroupManagementProps) => {
  const { t } = useTranslation();
  
  // 查询Parameter
  const [queryParams, setQueryParams] = useState<GetWorkerGroupsParams>({
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // List响应Data
  const [listResponse, setListResponse] = useState<LYListResponseLYWorkerGroupResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  
  // Drawer and ModalStatus
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LYWorkerGroupResponse | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LYWorkerGroupResponse | null>(null);
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [addMembersTargetGroup, setAddMembersTargetGroup] = useState<LYWorkerGroupResponse | null>(null);

  // LoadingData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWorkerGroupList(queryParams);
      setListResponse(response);
      return response.list;
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams]);

  // 翻页并Back新Data(用于Drawer导航时自动翻页)
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYWorkerGroupResponse[]> => {
    const currentPageSize = listResponse.range?.size || 20;
    const newOffset = (page - 1) * currentPageSize;
    setQueryParams(prev => ({ ...prev, offset: newOffset }));
    
    const response = await fetchWorkerGroupList({
      ...queryParams,
      offset: newOffset,
    });
    setListResponse(response);
    return response.list;
  }, [queryParams, listResponse.range?.size]);

  // 当Tab switch到非激活Status时, CloseDrawer
  useEffect(() => {
    if (!isActive) {
      setDetailDrawerVisible(false);
    }
  }, [isActive]);

  // 初始化Loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search - 防抖processing
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
      }, 500),
    []
  );

  // 打开Details drawer
  const openDetail = (group: LYWorkerGroupResponse) => {
    setSelectedGroup(group);
    setDetailDrawerVisible(true);
  };

  // Editbot组
  const handleEdit = (group: LYWorkerGroupResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingGroup(group);
    setEditModalVisible(true);
  };

  // 添加成员
  const handleAddMembers = (group: LYWorkerGroupResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAddMembersTargetGroup(group);
    setAddMembersModalVisible(true);
  };

  // 从Details drawer跳转到Edit
  const handleEditFromDrawer = () => {
    if (selectedGroup) {
      setEditingGroup(selectedGroup);
      setEditModalVisible(true);
    }
  };

  // DeleteConfirm
  const handleDeleteClick = (group: LYWorkerGroupResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();

    Modal.confirm({
      title: t('workerGroup.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('workerGroup.deleteModal.confirmMessage', { name: group.name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('workerGroup.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('workerGroup.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          // 模拟Delete API 调用
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // CloseDrawer
          setDetailDrawerVisible(false);
          setSelectedGroup(null);
          
          // 重新LoadingData
          loadData();
          
          Toast.success(t('workerGroup.deleteModal.success'));
        } catch (error) {
          Toast.error(t('workerGroup.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // 从Details drawerDelete
  const handleDeleteFromDrawer = () => {
    if (selectedGroup) {
      handleDeleteClick(selectedGroup);
    }
  };

  // CreateSuccess回调
  const handleCreateSuccess = () => {
    loadData();
  };

  // EditSuccess回调
  const handleEditSuccess = (updatedGroup: LYWorkerGroupResponse) => {
    // UpdateListData
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedGroup.id ? updatedGroup : item
      ),
    }));
    // 同步UpdateSelected's group(如果Drawer打开中)
    if (selectedGroup?.id === updatedGroup.id) {
      setSelectedGroup(updatedGroup);
    }
  };

  // 从响应中获取分页Info
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  const columns = [
    {
      title: t('workerGroup.table.groupName'),
      dataIndex: 'name',
      key: 'name',
      width: 300,
      ellipsis: true,
      render: (name: string, record: LYWorkerGroupResponse) => (
        <div>
          <div>{name}</div>
          {record.description && (
            <div>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: t('workerGroup.table.memberCount'),
      dataIndex: 'member_count',
      key: 'member_count',
      width: 120,
      render: (count: number) => `${count} ${t('workerGroup.table.memberUnit')}`,
    },
    {
      title: t('common.creator'),
      dataIndex: 'creator_name',
      key: 'creator_name',
      width: 120,
      render: (name: string | null | undefined, record: any) => name ? <UserNameWithCard name={name} userId={record.creator_id} /> : '-',
    },
    {
      title: t('common.createTime'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: t('common.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (_: unknown, record: LYWorkerGroupResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          stopPropagation={true}
          clickToHide={true}
          render={
            <Dropdown.Menu>
              <Dropdown.Item 
                icon={<IconEyeOpenedStroked />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  openDetail(record);
                }}
              >
                {t('workerGroup.actions.viewDetail')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconUserAdd />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleAddMembers(record);
                }}
              >
                {t('workerGroup.detail.addMember')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconEditStroked />} 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleEdit(record);
                }}
              >
                {t('workerGroup.actions.edit')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<IconDeleteStroked />}
                type="danger" 
                onClick={(e) => {
                  e?.stopPropagation?.();
                  handleDeleteClick(record);
                }}
              >
                {t('workerGroup.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button 
            icon={<IconMoreStroked />} 
            theme="borderless" 
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="worker-group-management">
      {/* Operation栏 */}
      <div className="worker-group-management-header">
        {/* Operation栏 */}
        <Row type="flex" justify="space-between" align="middle" className="worker-group-management-header-toolbar">
          <Col>
            <Space>
              <Input 
                prefix={<IconSearchStroked />}
                placeholder={t('workerGroup.searchPlaceholder')}
                className="worker-group-management-search-input"
                onChange={handleSearch}
                showClear
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
              {t('workerGroup.createGroup')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* Table area */}
      <div className="worker-group-management-table">
        {isInitialLoad ? (
          <TableSkeleton rows={10} columns={4} columnWidths={['35%', '15%', '15%', '25%']} />
        ) : (
          <Table 
            size="small"
            columns={columns} 
            dataSource={list}
            loading={loading}
            rowKey="id"
            empty={
              <EmptyState 
                variant={queryParams.keyword ? 'noResult' : 'noData'}
                description={queryParams.keyword ? t('common.noResult') : t('workerGroup.noData')} 
              />
            }
            onRow={(record) => {
              const isSelected = selectedGroup?.id === record?.id && detailDrawerVisible;
              return {
                id: `worker-group-row-${record?.id}`,
                onClick: () => openDetail(record as LYWorkerGroupResponse),
                className: isSelected ? 'worker-group-management-row-selected' : undefined,
                style: { cursor: 'pointer' },
              };
            }}
            pagination={{
              total,
              pageSize,
              currentPage,
              onPageChange: (page) => {
                setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize }));
              },
              onPageSizeChange: (newPageSize) => setQueryParams(prev => ({ ...prev, offset: 0, size: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        )}
      </div>

      {/* Details drawer */}
      <WorkerGroupDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        groupData={selectedGroup}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
        onRefresh={loadData}
        dataList={list}
        onNavigate={(group) => setSelectedGroup(group)}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onPageChange={handleDrawerPageChange}
        onNavigateToWorkerDetail={onNavigateToWorkerDetail}
        onScrollToRow={(id) => {
          const row = document.getElementById(`worker-group-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
      />

      {/* Create modal */}
      <CreateWorkerGroupModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit modal */}
      <EditWorkerGroupModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        groupData={editingGroup}
        onSuccess={handleEditSuccess}
      />

      {/* 添加成员Modal */}
      <AddMembersModal
        visible={addMembersModalVisible}
        onCancel={() => {
          setAddMembersModalVisible(false);
          setAddMembersTargetGroup(null);
        }}
        groupId={addMembersTargetGroup?.id || ''}
        groupName={addMembersTargetGroup?.name || ''}
        onSuccess={loadData}
      />
    </div>
  );
};

export default WorkerGroupManagement;
