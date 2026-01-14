import { 
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Avatar,
  Dropdown
} from '@douyinfe/semi-ui';
import { IconSearch, IconFilter, IconPlus, IconDownload, IconMore } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

const ProcessDevelopment = () => {
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
      render: (creator: { name: string; avatar: string }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small" src={creator.avatar} />
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
              <Dropdown.Item>复制</Dropdown.Item>
              <Dropdown.Item type="danger">删除</Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMore />} theme="borderless" />
        </Dropdown>
      ),
    },
  ];

  const data = Array(10).fill(null).map((_, index) => ({
    key: index,
    name: '财务报销流程',
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
          />
          <Button icon={<IconFilter />} theme="light">
            筛选
          </Button>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Button icon={<IconDownload />} theme="light">
            导入流程
          </Button>
          <Button icon={<IconPlus />} theme="solid" type="primary">
            新建流程
          </Button>
        </div>
      </div>

      {/* 表格 */}
      <Table 
        columns={columns} 
        dataSource={data}
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
    </div>
  );
};

export default ProcessDevelopment;
