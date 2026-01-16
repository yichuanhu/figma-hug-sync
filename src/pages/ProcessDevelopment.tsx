import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Avatar,
  Dropdown,
  Popover,
  Checkbox,
  Pagination,
  Tooltip
} from '@douyinfe/semi-ui';
import { IconSearch, IconFilter, IconPlus, IconDownload, IconMore, IconExternalOpenStroked, IconEditStroked, IconPlay, IconDeleteStroked } from '@douyinfe/semi-icons';
import CreateProcessModal from '@/components/CreateProcessModal';
import EditProcessModal from '@/components/EditProcessModal';
import ProcessDetailDrawer from '@/components/ProcessDetailDrawer';
import { useOpenProcess } from '@/hooks/useOpenProcess';

const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

interface FilterState {
  status: string[];
  language: string[];
  organization: string[];
  creator: string[];
}

const ProcessDevelopment = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    language: [],
    organization: [],
    creator: [],
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
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

  // 模拟加载数据
  useEffect(() => {
    localStorage.removeItem('skipOpenProcessConfirm');
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 打开流程详情抽屉
  const openProcessDetail = (record: typeof processListData[0]) => {
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
    setDetailDrawerVisible(true);
  };

  // 操作处理函数
  const handleEdit = (record?: typeof processListData[0]) => {
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

  // 筛选选项
  const filterOptions = {
    status: ['已发布', '草稿'],
    language: ['python', 'BotScript'],
    organization: ['财务部', '人事部', '技术部', '运营部'],
    creator: ['姜鹏志', '李明', '王芳', '张伟'],
  };

  const handleFilterChange = (key: keyof FilterState, values: string[]) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      language: [],
      organization: [],
      creator: [],
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  const columns = [
    {
      title: '流程名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: (description: string) => (
        <Tooltip content={description} position="top">
          <div style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 260
          }}>
            {description}
          </div>
        </Tooltip>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === '已发布' ? 'green' : 'grey'} type="light">
          {status}
        </Tag>
      ),
    },
    {
      title: '语言',
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
      title: '版本',
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
      title: '归属组织',
      dataIndex: 'organization',
      key: 'organization',
      width: 100,
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: (creator: { name: string }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar 
            size="small" 
            style={{ 
              backgroundColor: '#FFE600',
              color: 'var(--semi-color-text-0)',
              flexShrink: 0
            }}
          >
            {creator.name.charAt(0)}
          </Avatar>
          <span>{creator.name}</span>
        </div>
      ),
    },
    {
      title: '最后修改',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: typeof processListData[0]) => (
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
                打开流程
              </Dropdown.Item>
              <Dropdown.Item icon={<IconEditStroked />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>编辑</Dropdown.Item>
              <Dropdown.Item icon={<IconPlay />} onClick={handleRun}>运行</Dropdown.Item>
              <Dropdown.Item icon={<IconDeleteStroked />} type="danger" onClick={handleDelete}>删除</Dropdown.Item>
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

  const initialData = Array(10).fill(null).map((_, index) => ({
    key: index + 1,
    name: index % 2 === 0 ? '财务报销流程' : '人事审批流程',
    description: '自动处理财务报销审批流程，包括发票识别、金额核对、审批通知',
    status: index < 5 ? '已发布' : '草稿',
    language: index % 3 === 1 ? 'BotScript' : 'python',
    version: '1.2.0',
    organization: '财务部',
    creator: {
      name: '姜鹏志',
      avatar: '',
    },
    updatedAt: '2022-10-31',
  }));

  const [processListData, setProcessListData] = useState(initialData);

  const filteredData = useMemo(() => {
    let data = processListData;

    // 关键词搜索
    if (searchValue.trim()) {
      data = data.filter(item => 
        item.name.toLowerCase().includes(searchValue.toLowerCase().trim())
      );
    }

    // 状态筛选
    if (filters.status.length > 0) {
      data = data.filter(item => filters.status.includes(item.status));
    }

    // 语言筛选
    if (filters.language.length > 0) {
      data = data.filter(item => filters.language.includes(item.language));
    }

    // 归属组织筛选
    if (filters.organization.length > 0) {
      data = data.filter(item => filters.organization.includes(item.organization));
    }

    // 创建者筛选
    if (filters.creator.length > 0) {
      data = data.filter(item => filters.creator.includes(item.creator.name));
    }

    return data;
  }, [searchValue, filters, processListData]);

  const filterContent = (
    <div style={{ padding: 16, width: 280 }}>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>流程状态</Text>
        <CheckboxGroup
          value={filters.status}
          onChange={(values) => handleFilterChange('status', values as string[])}
          options={filterOptions.status}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>语言</Text>
        <CheckboxGroup
          value={filters.language}
          onChange={(values) => handleFilterChange('language', values as string[])}
          options={filterOptions.language}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>归属组织</Text>
        <CheckboxGroup
          value={filters.organization}
          onChange={(values) => handleFilterChange('organization', values as string[])}
          options={filterOptions.organization}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>创建者</Text>
        <CheckboxGroup
          value={filters.creator}
          onChange={(values) => handleFilterChange('creator', values as string[])}
          options={filterOptions.creator}
          direction="horizontal"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--semi-color-border)', paddingTop: 12 }}>
        <Button theme="borderless" onClick={clearFilters} disabled={!hasActiveFilters}>
          重置
        </Button>
        <Button theme="solid" type="primary" onClick={() => setFilterVisible(false)}>
          确定
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* 固定面包屑 */}
      <div style={{ 
        padding: '12px 24px',
        flexShrink: 0,
      }}>
        <Breadcrumb>
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>首页</Breadcrumb.Item>
          <Breadcrumb.Item>开发中心</Breadcrumb.Item>
          <Breadcrumb.Item>自动化流程</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ marginBottom: 8 }}>自动化流程</Title>
          <Text type="tertiary">创建和管理自动化流程，配置流程资源和版本</Text>
        </div>

        {/* 操作栏 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 16 
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Input 
              prefix={<IconSearch />}
              placeholder="搜索流程名称"
              style={{ width: 240 }}
              value={searchValue}
              onChange={(value) => setSearchValue(value)}
            />
            <Popover
              visible={filterVisible}
              onVisibleChange={setFilterVisible}
              trigger="click"
              position="bottomLeft"
              content={filterContent}
            >
              <Button 
                icon={<IconFilter />} 
                theme={hasActiveFilters ? 'solid' : 'light'}
                type={hasActiveFilters ? 'primary' : 'tertiary'}
              >
                筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
            </Popover>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Button icon={<IconDownload />} theme="light">
              导入流程
            </Button>
            <Button 
              icon={<IconPlus />} 
              theme="solid" 
              type="primary"
              onClick={() => setCreateModalVisible(true)}
            >
              新建流程
            </Button>
          </div>
        </div>
      </div>

      {/* 表格区域 */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        padding: '0 24px',
        minHeight: 0,
      }}>
        <Table 
          columns={columns} 
          dataSource={filteredData}
          loading={loading}
          onRow={(record) => ({
            onClick: () => openProcessDetail(record as typeof processListData[0]),
            style: { cursor: 'pointer' }
          })}
          pagination={false}
          scroll={{ y: 'calc(100vh - 320px)' }}
          style={{ 
            borderRadius: 8, 
            overflow: 'hidden',
          }}
        />
      </div>

      {/* 分页区域 */}
      <div style={{ 
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <Text type="tertiary" style={{ fontSize: 14 }}>
          显示第 1 条-第 10 条，共 46 条
        </Text>
        <Pagination 
          total={46} 
          pageSize={10} 
          currentPage={1}
          showSizeChanger
        />
      </div>

      {/* 新建流程弹窗 */}
      <CreateProcessModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={(processData) => {
          // 将新创建的流程添加到列表第一行
          const newProcess = {
            key: Date.now(),
            name: processData.name,
            description: processData.description,
            status: processData.status,
            language: 'python' as const,
            version: '1.0.0',
            organization: processData.organization,
            creator: {
              name: processData.creator,
              avatar: '',
            },
            updatedAt: new Date().toLocaleDateString('zh-CN').replace(/\//g, '-'),
          };
          setProcessListData(prev => [newProcess, ...prev]);
          
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
          // 这里可以更新本地数据或刷新列表
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
