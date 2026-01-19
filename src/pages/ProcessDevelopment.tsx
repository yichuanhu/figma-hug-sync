import { useState, useMemo, useEffect } from 'react';
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
  Popover,
  Checkbox,
  Pagination,
  Tooltip,
  Empty,
  Skeleton
} from '@douyinfe/semi-ui';
import { IllustrationNoResult, IllustrationNoResultDark } from '@douyinfe/semi-illustrations';
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
  const { t } = useTranslation();
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

  // 打开流程详情抽屉或切换内容
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
    // 如果抽屉未打开则打开，已打开则内容自动切换
    if (!detailDrawerVisible) {
      setDetailDrawerVisible(true);
    }
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
    status: [t('development.status.published'), t('development.status.draft')],
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

  // 骨架屏数据
  const skeletonData = Array(8).fill(null).map((_, index) => ({ key: `skeleton-${index}` }));

  // 骨架屏列配置
  const skeletonColumns = [
    {
      title: t('development.table.processName'),
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 80 }} />} loading active />,
    },
    {
      title: t('development.table.processDescription'),
      dataIndex: 'description',
      key: 'description',
      width: 280,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 200 }} />} loading active />,
    },
    {
      title: t('development.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 50 }} />} loading active />,
    },
    {
      title: t('development.table.language'),
      dataIndex: 'language',
      key: 'language',
      width: 100,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 60 }} />} loading active />,
    },
    {
      title: t('development.table.version'),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 40 }} />} loading active />,
    },
    {
      title: t('development.table.organization'),
      dataIndex: 'organization',
      key: 'organization',
      width: 100,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 60 }} />} loading active />,
    },
    {
      title: t('development.table.creator'),
      dataIndex: 'creator',
      key: 'creator',
      width: 120,
      render: () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Skeleton placeholder={<Skeleton.Avatar size="small" />} loading active />
          <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 50 }} />} loading active />
        </div>
      ),
    },
    {
      title: t('development.table.lastModified'),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 70 }} />} loading active />,
    },
    {
      title: t('development.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: () => <Skeleton placeholder={<Skeleton.Paragraph rows={1} style={{ width: 24 }} />} loading active />,
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
      title: t('development.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        <Tag color={status === t('development.status.published') ? 'green' : 'grey'} type="light">
          {status}
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

  const initialData = Array(10).fill(null).map((_, index) => ({
    key: index + 1,
    name: index % 2 === 0 ? '财务报销流程' : '人事审批流程',
    description: '自动处理财务报销审批流程，包括发票识别、金额核对、审批通知',
    status: index < 5 ? t('development.status.published') : t('development.status.draft'),
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
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('development.filter.processStatus')}</Text>
        <CheckboxGroup
          value={filters.status}
          onChange={(values) => handleFilterChange('status', values as string[])}
          options={filterOptions.status}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('development.filter.language')}</Text>
        <CheckboxGroup
          value={filters.language}
          onChange={(values) => handleFilterChange('language', values as string[])}
          options={filterOptions.language}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('development.filter.organization')}</Text>
        <CheckboxGroup
          value={filters.organization}
          onChange={(values) => handleFilterChange('organization', values as string[])}
          options={filterOptions.organization}
          direction="horizontal"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('development.filter.creator')}</Text>
        <CheckboxGroup
          value={filters.creator}
          onChange={(values) => handleFilterChange('creator', values as string[])}
          options={filterOptions.creator}
          direction="horizontal"
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--semi-color-border)', paddingTop: 12 }}>
        <Button theme="borderless" onClick={clearFilters} disabled={!hasActiveFilters}>
          {t('common.reset')}
        </Button>
        <Button theme="solid" type="primary" onClick={() => setFilterVisible(false)}>
          {t('common.confirm')}
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
          <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>{t('common.home')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('development.breadcrumb.developmentCenter')}</Breadcrumb.Item>
          <Breadcrumb.Item>{t('development.breadcrumb.automationProcess')}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* 标题区域 */}
      <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <Title heading={3} style={{ marginBottom: 8 }}>{t('development.title')}</Title>
          <Text type="tertiary">{t('development.description')}</Text>
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
              placeholder={t('development.searchPlaceholder')}
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
                {t('common.filter')}{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>
            </Popover>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
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
      <div style={{ 
        flex: 1, 
        overflow: 'hidden', 
        padding: '0 24px',
        minHeight: 0,
      }}>
        {loading ? (
          <Table 
            columns={skeletonColumns} 
            dataSource={skeletonData}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
            style={{ 
              borderRadius: 8, 
              overflow: 'hidden',
            }}
          />
        ) : (
          <Table 
            columns={columns} 
            dataSource={filteredData}
            empty={
              <Empty
                image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
                darkModeImage={<IllustrationNoResultDark style={{ width: 150, height: 150 }} />}
                title={t('development.empty.title')}
                description={hasActiveFilters || searchValue ? t('development.empty.filterDescription') : t('development.empty.defaultDescription')}
              />
            }
            onRow={(record) => {
              const processId = `PROC-2024-${String(record.key).padStart(3, '0')}`;
              const isSelected = selectedProcess?.id === processId && detailDrawerVisible;
              return {
                onClick: () => openProcessDetail(record as typeof processListData[0]),
                style: { 
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : undefined,
                }
              };
            }}
            pagination={false}
            scroll={{ y: 'calc(100vh - 320px)' }}
            style={{ 
              borderRadius: 8, 
              overflow: 'hidden',
            }}
          />
        )}
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
          {t('common.showingRecords', { start: 1, end: 10, total: 46 })}
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
