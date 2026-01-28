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
  Tooltip,
} from '@douyinfe/semi-ui';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import {
  IconSearch, 
  IconPlus, 
  IconMore, 
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

// Mock数据
const mockWorkerGroups: LYWorkerGroupResponse[] = [
  {
    id: 'group-001',
    name: '财务流程机器人组',
    description: '用于执行财务相关流程的机器人组，包括发票处理、报表生成等任务',
    member_count: 5,
    creator_id: 'admin',
    creator_name: '管理员',
    created_at: '2025-01-05 14:30:00',
    updated_at: '2025-01-08 10:00:00',
  },
  {
    id: 'group-002',
    name: '人事流程机器人组',
    description: '用于人事审批、入职离职流程自动化',
    member_count: 3,
    creator_id: 'hr_admin',
    creator_name: 'HR管理员',
    created_at: '2025-01-06 09:15:00',
    updated_at: '2025-01-07 16:30:00',
  },
  {
    id: 'group-003',
    name: '运维巡检机器人组',
    description: '用于服务器巡检、日志分析等运维任务',
    member_count: 2,
    creator_id: 'ops_admin',
    creator_name: '运维管理员',
    created_at: '2025-01-04 11:20:00',
    updated_at: '2025-01-06 18:45:00',
  },
  {
    id: 'group-004',
    name: '测试自动化机器人组',
    description: '用于自动化测试任务的执行',
    member_count: 0,
    creator_id: 'qa_admin',
    creator_name: 'QA管理员',
    created_at: '2025-01-03 15:45:00',
    updated_at: '2025-01-03 15:45:00',
  },
];

// 数据获取
const fetchWorkerGroupList = async (params: GetWorkerGroupsParams): Promise<LYListResponseLYWorkerGroupResponse> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let data = [...mockWorkerGroups];

  // 关键词搜索
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
  
  // 查询参数
  const [queryParams, setQueryParams] = useState<GetWorkerGroupsParams>({
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // 列表响应数据
  const [listResponse, setListResponse] = useState<LYListResponseLYWorkerGroupResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  
  // 抽屉和弹窗状态
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LYWorkerGroupResponse | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LYWorkerGroupResponse | null>(null);
  const [addMembersModalVisible, setAddMembersModalVisible] = useState(false);
  const [addMembersTargetGroup, setAddMembersTargetGroup] = useState<LYWorkerGroupResponse | null>(null);

  // 加载数据
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

  // 翻页并返回新数据（用于抽屉导航时自动翻页）
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

  // 当Tab切换到非激活状态时，关闭抽屉
  useEffect(() => {
    if (!isActive) {
      setDetailDrawerVisible(false);
    }
  }, [isActive]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 搜索 - 防抖处理
  const handleSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
      }, 500),
    []
  );

  // 打开详情抽屉
  const openDetail = (group: LYWorkerGroupResponse) => {
    setSelectedGroup(group);
    setDetailDrawerVisible(true);
  };

  // 编辑机器人组
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

  // 从详情抽屉跳转到编辑
  const handleEditFromDrawer = () => {
    if (selectedGroup) {
      setEditingGroup(selectedGroup);
      setEditModalVisible(true);
    }
  };

  // 删除确认
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
          // 模拟删除 API 调用
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 关闭抽屉
          setDetailDrawerVisible(false);
          setSelectedGroup(null);
          
          // 重新加载数据
          loadData();
          
          Toast.success(t('workerGroup.deleteModal.success'));
        } catch (error) {
          Toast.error(t('workerGroup.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // 从详情抽屉删除
  const handleDeleteFromDrawer = () => {
    if (selectedGroup) {
      handleDeleteClick(selectedGroup);
    }
  };

  // 创建成功回调
  const handleCreateSuccess = () => {
    loadData();
  };

  // 编辑成功回调
  const handleEditSuccess = (updatedGroup: LYWorkerGroupResponse) => {
    // 更新列表数据
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedGroup.id ? updatedGroup : item
      ),
    }));
    // 同步更新选中的group（如果抽屉打开中）
    if (selectedGroup?.id === updatedGroup.id) {
      setSelectedGroup(updatedGroup);
    }
  };

  // 从响应中获取分页信息
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
      render: (name: string, record: LYWorkerGroupResponse) => (
        <div className="worker-group-name-cell">
          <div className="worker-group-name-cell-name">{name}</div>
          {record.description && (
            <Tooltip content={record.description}>
              <div className="worker-group-name-cell-desc">{record.description}</div>
            </Tooltip>
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
      render: (name: string | null | undefined) => name || '-',
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
            icon={<IconMore />} 
            theme="borderless" 
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="worker-group-management">
      {/* 操作栏 */}
      <div className="worker-group-management-header">
        {/* 操作栏 */}
        <Row type="flex" justify="space-between" align="middle" className="worker-group-management-header-toolbar">
          <Col>
            <Space>
              <Input 
                prefix={<IconSearch />}
                placeholder={t('workerGroup.searchPlaceholder')}
                className="worker-group-management-search-input"
                onChange={handleSearch}
                showClear
              />
            </Space>
          </Col>
          <Col>
            <Button 
              icon={<IconPlus />} 
              theme="solid" 
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              {t('workerGroup.createGroup')}
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="worker-group-management-table">
        {isInitialLoad ? (
          <TableSkeleton rows={10} columns={4} columnWidths={['35%', '15%', '15%', '25%']} />
        ) : (
          <Table 
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

      {/* 详情抽屉 */}
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
      />

      {/* 创建弹窗 */}
      <CreateWorkerGroupModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 编辑弹窗 */}
      <EditWorkerGroupModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        groupData={editingGroup}
        onSuccess={handleEditSuccess}
      />

      {/* 添加成员弹窗 */}
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
