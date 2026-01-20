import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Avatar,
  Dropdown,
  Pagination,
  Tooltip,
  Empty,
  Skeleton
} from '@douyinfe/semi-ui';
import { IconSearch, IconPlus, IconDownload, IconMore, IconExternalOpenStroked, IconEditStroked, IconPlay, IconDeleteStroked } from '@douyinfe/semi-icons';
import CreateProcessModal from './components/CreateProcessModal';
import EditProcessModal from './components/EditProcessModal';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import { useOpenProcess } from './hooks/useOpenProcess';
import './index.less';

const { Title, Text } = Typography;

interface ProcessItem {
  key: number;
  name: string;
  description: string;
  status: string;
  language: string;
  version: string;
  organization: string;
  creator: {
    name: string;
    avatar: string;
  };
  updatedAt: string;
}

interface PaginationState {
  current: number;
  pageSize: number;
  total: number;
}

// 模拟API请求 - 获取流程列表
const fetchProcessList = async (params: {
  page: number;
  pageSize: number;
  keyword?: string;
}): Promise<{ data: ProcessItem[]; total: number }> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 生成模拟数据
  const allData: ProcessItem[] = Array(46).fill(null).map((_, index) => ({
    key: index + 1,
    name: index % 3 === 0 ? '财务报销流程' : index % 3 === 1 ? '人事审批流程' : '采购申请流程',
    description: '自动处理财务报销审批流程，包括发票识别、金额核对、审批通知',
    status: index % 2 === 0 ? 'published' : 'draft',
    language: index % 3 === 1 ? 'BotScript' : 'python',
    version: `1.${index % 5}.0`,
    organization: index % 4 === 0 ? '财务部' : index % 4 === 1 ? '人事部' : index % 4 === 2 ? '技术部' : '运营部',
    creator: {
      name: index % 3 === 0 ? '姜鹏志' : index % 3 === 1 ? '李明' : '王芳',
      avatar: '',
    },
    updatedAt: `2024-0${(index % 9) + 1}-${String((index % 28) + 1).padStart(2, '0')}`,
  }));

  // 模拟关键词搜索
  let filteredData = allData;
  if (params.keyword?.trim()) {
    filteredData = allData.filter(item => 
      item.name.toLowerCase().includes(params.keyword!.toLowerCase().trim())
    );
  }

  // 模拟分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedData = filteredData.slice(start, end);

  return {
    data: paginatedData,
    total: filteredData.length,
  };
};

const ProcessDevelopment = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [processListData, setProcessListData] = useState<ProcessItem[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [selectedProcess, setSelectedProcess] = useState<{
    id: string;
    name: string;
    description: string;
    status: string;
    organization: string;
    creator: string;
    createdAt: string;
    language?: string;
    version?: string;
  } | null>(null);
  const [editingProcess, setEditingProcess] = useState<{
    id: string;
    name: string;
    description: string;
    organization: string;
    type?: string;
    relatedRequirement?: string;
  } | null>(null);

  const { openProcess, OpenProcessModal } = useOpenProcess();

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProcessList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchValue,
      });
      setProcessListData(result.data);
      setPagination(prev => ({ ...prev, total: result.total }));
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchValue]);

  // 初始化加载
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 分页变化
  const handlePageChange = (currentPage: number) => {
    setPagination(prev => ({ ...prev, current: currentPage }));
  };

  // 每页条数变化
  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, current: 1, pageSize }));
  };

  // 搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 打开流程详情抽屉或切换内容
  const openProcessDetail = (record: ProcessItem) => {
    const processId = `PROC-2024-${String(record.key).padStart(3, '0')}`;
    setSelectedProcess({
      id: processId,
      name: record.name,
      description: record.description,
      status: record.status,
      organization: record.organization,
      creator: record.creator.name,
      createdAt: record.updatedAt,
      language: record.language,
      version: record.version,
    });
    if (!detailDrawerVisible) {
      setDetailDrawerVisible(true);
    }
  };

  // 操作处理函数
  const handleEdit = (record?: ProcessItem) => {
    const processRecord = record || (selectedProcess ? processListData.find(d => 
      `PROC-2024-${String(d.key).padStart(3, '0')}` === selectedProcess.id
    ) : null);
    
    if (processRecord) {
      const processId = `PROC-2024-${String(processRecord.key).padStart(3, '0')}`;
      setEditingProcess({
        id: processId,
        name: processRecord.name,
        description: processRecord.description,
        organization: processRecord.organization,
        type: '原生流程',
      });
      setEditModalVisible(true);
    }
  };

  const handleRun = () => {
    console.log('运行流程:', selectedProcess?.id);
  };

  const handleDelete = () => {
    console.log('删除流程:', selectedProcess?.id);
    setDetailDrawerVisible(false);
  };

  // 骨架屏数据
  const skeletonData = Array(8).fill(null).map((_, index) => ({ key: `skeleton-${index}` }));

  // 骨架屏列配置
  const skeletonColumns = [
    {
      title: t('development.table.processName'),
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-name" />} loading active />,
    },
    {
      title: t('development.table.processDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-description" />} loading active />,
    },
    {
      title: t('development.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-status" />} loading active />,
    },
    {
      title: t('development.table.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-language" />} loading active />,
    },
    {
      title: t('development.table.version'),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-version" />} loading active />,
    },
    {
      title: t('development.table.organization'),
      dataIndex: 'organization',
      key: 'organization',
      width: 100,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-organization" />} loading active />,
    },
    {
      title: t('development.table.creator'),
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: () => (
        <div className="skeleton-creator">
          <Skeleton placeholder={<Skeleton.Avatar size="small" />} loading active />
          <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-creator-name" />} loading active />
        </div>
      ),
    },
    {
      title: t('development.table.lastModified'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-date" />} loading active />,
    },
    {
      title: t('development.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} className="skeleton-action" />} loading active />,
    },
  ];

  const columns = [
    {
      title: t('development.table.processName'),
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: t('development.table.processDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (description: string) => (
        <Tooltip content={description} position="top">
          <div className="process-development-cell-ellipsis">
            {description}
          </div>
        </Tooltip>
      ),
    },
    {
      title: t('development.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === 'published' ? 'green' : 'grey'} type="light">
          {status === 'published' ? t('development.status.published') : t('development.status.draft')}
        </Tag>
      ),
    },
    {
      title: t('development.table.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: (language: string) => (
        <Tag color={language === 'python' ? 'blue' : 'cyan'} type="light">
          {language}
        </Tag>
      ),
    },
    {
      title: t('development.table.version'),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: (version: string) => (
        <Tag color="grey" type="ghost">
          {version}
        </Tag>
      ),
    },
    {
      title: t('development.table.organization'),
      dataIndex: 'organization',
      key: 'organization',
      width: 100,
    },
    {
      title: t('development.table.creator'),
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: { name: string } | undefined) => {
        if (!creator) return null;
        return (
          <div className="process-development-cell-creator">
            <Avatar 
              size="small" 
              className="avatar-creator"
            >
              {creator.name.charAt(0)}
            </Avatar>
            <span>{creator.name}</span>
          </div>
        );
      },
    },
    {
      title: t('development.table.lastModified'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      sorter: true,
    },
    {
      title: t('development.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: ProcessItem) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item 
                icon={<IconExternalOpenStroked />} 
                onClick={(e) => {
                  e.stopPropagation();
                  const processId = `PROC-2024-${String(record.key).padStart(3, '0')}`;
                  openProcess({ id: processId, name: record.name });
                }}
              >
                {t('development.actions.openProcess')}
              </Dropdown.Item>
              <Dropdown.Item icon={<IconEditStroked />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>{t('development.actions.edit')}</Dropdown.Item>
              <Dropdown.Item icon={<IconPlay />} onClick={handleRun}>{t('development.actions.run')}</Dropdown.Item>
              <Dropdown.Item icon={<IconDeleteStroked />} type="danger" onClick={handleDelete}>{t('development.actions.delete')}</Dropdown.Item>
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

  // 计算显示范围
  const start = (pagination.current - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.current * pagination.pageSize, pagination.total);

  return (
    <div className="process-development">
      {/* 固定面包屑 */}
      <div className="process-development-breadcrumb">
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')}>{t('common.home')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('development.breadcrumb.developmentCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('development.breadcrumb.automationProcess')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div className="process-development-header">
        <div className="process-development-header-title">
          <Title heading={3} className="title">{t('development.title')}</Title>
          <Text type="tertiary">{t('development.description')}</Text>
        </div>

        {/* 操作栏 */}
        <div className="process-development-header-toolbar">
          <div className="process-development-header-search">
            <Input 
              prefix={<IconSearch />}
              placeholder={t('development.searchPlaceholder')}
              style={{ width: 240 }}
              value={searchValue}
              onChange={handleSearch}
            />
          </div>
          <div className="process-development-header-actions">
            <Button icon={<IconDownload />} theme="light">
              {t('development.importProcess')}
            </Button>
            <Button 
              icon={<IconPlus />} 
              theme="solid" 
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              {t('development.createProcess')}
            </Button>
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="process-development-table">
        {loading ? (
          <Table 
            columns={skeletonColumns} 
            dataSource={skeletonData}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={processListData}
            onRow={(record) => {
              const processId = `PROC-2024-${String(record.key).padStart(3, '0')}`;
              const isSelected = selectedProcess?.id === processId && detailDrawerVisible;
              return {
                onClick: () => openProcessDetail(record as ProcessItem),
                className: isSelected ? 'process-development-row-selected' : undefined,
                style: { cursor: 'pointer' }
              };
            }}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
          />
        )}
      </div>

      {/* 分页区域 */}
      <div className="process-development-pagination">
        <Text type="tertiary" className="pagination-info">
          {pagination.total > 0 
            ? t('common.showingRecords', { start, end, total: pagination.total })
            : t('common.noRecords')
          }
        </Text>
        <Pagination
          total={pagination.total} 
          pageSize={pagination.pageSize} 
          currentPage={pagination.current}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          showSizeChanger
        />
      </div>

      {/* 新建流程弹窗 */}
      <CreateProcessModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={(processData) => {
          // 重新加载数据
          loadData();
          
          // 打开详情抽屉
          setSelectedProcess({
            id: processData.id,
            name: processData.name,
            description: processData.description,
            status: processData.status,
            organization: processData.organization,
            creator: processData.creator,
            createdAt: processData.createdAt,
          });
          setDetailDrawerVisible(true);
        }}
      />

      {/* 编辑流程弹窗 */}
      <EditProcessModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        processData={editingProcess}
        onSuccess={(updatedData) => {
          console.log('流程已更新:', updatedData);
          // 重新加载数据
          loadData();
        }}
      />

      {/* 流程详情抽屉 */}
      <ProcessDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        processData={selectedProcess}
        onEdit={() => handleEdit()}
        onRun={handleRun}
        onDelete={handleDelete}
        onOpen={() => selectedProcess && openProcess(selectedProcess)}
      />

      {/* 打开流程确认弹窗 */}
      <OpenProcessModal />
    </div>
  );
};

export default ProcessDevelopment;
