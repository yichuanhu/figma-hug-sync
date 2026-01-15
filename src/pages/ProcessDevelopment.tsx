import { useState, useMemo } from 'react';
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
  Checkbox
} from '@douyinfe/semi-ui';
import { IconSearch, IconFilter, IconPlus, IconDownload, IconMore } from '@douyinfe/semi-icons';
import CreateProcessModal from '@/components/CreateProcessModal';

const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

interface FilterState {
  status: string[];
  language: string[];
  organization: string[];
  creator: string[];
}

const ProcessDevelopment = () => {
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    language: [],
    organization: [],
    creator: [],
  });
  const [filterVisible, setFilterVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

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
      render: () => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item>编辑</Dropdown.Item>
              <Dropdown.Item>运行</Dropdown.Item>
              <Dropdown.Item type="danger">删除</Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMore />} theme="borderless" />
        </Dropdown>
      ),
    },
  ];

  const allData = Array(10).fill(null).map((_, index) => ({
    key: index,
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

  const filteredData = useMemo(() => {
    let data = allData;

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
  }, [searchValue, filters]);

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
    <div style={{ padding: '20px 24px', minHeight: '100%' }}>
      {/* 面包屑 */}
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item>首页</Breadcrumb.Item>
        <Breadcrumb.Item>开发中心</Breadcrumb.Item>
        <Breadcrumb.Item>流程开发</Breadcrumb.Item>
      </Breadcrumb>

      {/* 标题区域 */}
      <div style={{ marginBottom: 24 }}>
        <Title heading={3} style={{ marginBottom: 8 }}>流程开发</Title>
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

      {/* 表格 */}
      <Table 
        columns={columns} 
        dataSource={filteredData}
        pagination={{
          currentPage: 1,
          pageSize: 10,
          total: 46,
          showTotal: true,
          showSizeChanger: true,
          formatPageText: (page) => `显示第 ${page?.currentStart} 条-第 ${page?.currentEnd} 条，共 ${page?.total} 条`,
        }}
        style={{ backgroundColor: '#fff' }}
      />

      {/* 新建流程弹窗 */}
      <CreateProcessModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
      />
    </div>
  );
};

export default ProcessDevelopment;
