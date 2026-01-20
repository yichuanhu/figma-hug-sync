import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Avatar,
  Dropdown,
  Tooltip,
  Space,
  Row,
  Col
} from '@douyinfe/semi-ui';
import { IconSearch, IconPlus, IconDownload, IconMore, IconExternalOpenStroked, IconEditStroked, IconPlay, IconDeleteStroked } from '@douyinfe/semi-icons';
import type { LYProcessResponse, GetProcessesParams, LYRangeResponse } from '@/api';
import CreateProcessModal from './components/CreateProcessModal';
import EditProcessModal from './components/EditProcessModal';
import ProcessDetailDrawer from './components/ProcessDetailDrawer';
import { useOpenProcess } from './hooks/useOpenProcess';
import './index.less';

const { Title, Text } = Typography;

// 扩展 API 类型，添加前端需要的字段
interface ProcessItem extends Omit<LYProcessResponse, 'creator_id' | 'current_version_id' | 'requirement_id' | 'process_type'> {
  key: number;
  version: string;
  organization: string;
  creator: {
    name: string;
    avatar: string;
  };
}

interface QueryParams extends Pick<GetProcessesParams, 'keyword'> {
  page: number;
  pageSize: number;
}

interface PaginationInfo extends Pick<LYRangeResponse, 'total'> {}

// 模拟API请求 - 获取流程列表
// 参考 API: GET /processes (GetProcessesParams -> LYListResponseLYProcessResponse)
const fetchProcessList = async (params: QueryParams): Promise<{ data: ProcessItem[]; total: number }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock 数据基于 LYProcessResponse 类型生成
  const allData: ProcessItem[] = Array(46).fill(null).map((_, index) => ({
    // LYProcessResponse 标准字段
    id: `PROC-2024-${String(index + 1).padStart(3, '0')}`,
    name: index % 3 === 0 ? '财务报销流程' : index % 3 === 1 ? '人事审批流程' : '采购申请流程',
    description: '自动处理财务报销审批流程，包括发票识别、金额核对、审批通知',
    language: index % 3 === 1 ? 'BotScript' : 'Python',
    status: index % 2 === 0 ? 'published' : 'draft',
    timeout: 60,
    created_at: `2024-0${(index % 9) + 1}-${String((index % 28) + 1).padStart(2, '0')}`,
    updated_at: `2024-0${(index % 9) + 1}-${String((index % 28) + 1).padStart(2, '0')}`,
    // 前端扩展字段
    key: index + 1,
    version: `1.${index % 5}.0`,
    organization: index % 4 === 0 ? '财务部' : index % 4 === 1 ? '人事部' : index % 4 === 2 ? '技术部' : '运营部',
    creator: {
      name: index % 3 === 0 ? '姜鹏志' : index % 3 === 1 ? '李明' : '王芳',
      avatar: '',
    },
  }));

  let filteredData = allData;
  if (params.keyword?.trim()) {
    filteredData = allData.filter(item => item.name.toLowerCase().includes(params.keyword!.toLowerCase().trim()));
  }

  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const paginatedData = filteredData.slice(start, end);

  return { data: paginatedData, total: filteredData.length };
};

const ProcessDevelopment = () => {
  const { t } = useTranslation();
  const [queryParams, setQueryParams] = useState<QueryParams>({ page: 1, pageSize: 10, keyword: '' });
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [processListData, setProcessListData] = useState<ProcessItem[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProcessItem | null>(null);
  const [editingProcess, setEditingProcess] = useState<{ id: string; name: string; description: string; organization: string; type?: string; relatedRequirement?: string; } | null>(null);

  const { openProcess, OpenProcessModal } = useOpenProcess();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchProcessList(queryParams);
      setProcessListData(result.data);
      setPaginationInfo({ total: result.total });
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (keyword: string) => { setQueryParams(prev => ({ ...prev, page: 1, keyword })); };

  const openProcessDetail = (record: ProcessItem) => {
    setSelectedProcess(record);
    if (!detailDrawerVisible) setDetailDrawerVisible(true);
  };

  const handleEdit = (record?: ProcessItem) => {
    const processRecord = record || selectedProcess;
    if (processRecord) {
      setEditingProcess({ id: processRecord.id, name: processRecord.name, description: processRecord.description, organization: processRecord.organization, type: '原生流程' });
      setEditModalVisible(true);
    }
  };

  const handleRun = () => { console.log('运行流程:', selectedProcess?.id); };
  const handleDelete = () => { console.log('删除流程:', selectedProcess?.id); setDetailDrawerVisible(false); };

  const columns = [
    { title: t('development.table.processName'), dataIndex: 'name', key: 'name', width: 120 },
    { title: t('development.table.processDescription'), dataIndex: 'description', key: 'description', width: 280,
      render: (description: string) => (
        <Tooltip content={description} position="top">
          <div className="process-development-cell-ellipsis">{description}</div>
        </Tooltip>
      ),
    },
    { title: t('development.table.status'), dataIndex: 'status', key: 'status', width: 80,
      render: (status: string) => <Tag color={status === 'published' ? 'green' : 'grey'} type="light">{status === 'published' ? t('development.status.published') : t('development.status.draft')}</Tag>,
    },
    { title: t('development.table.language'), dataIndex: 'language', key: 'language', width: 100,
      render: (language: string) => <Tag color={language === 'python' ? 'blue' : 'cyan'} type="light">{language}</Tag>,
    },
    { title: t('development.table.version'), dataIndex: 'version', key: 'version', width: 80,
      render: (version: string) => <Tag color="grey" type="ghost">{version}</Tag>,
    },
    { title: t('development.table.organization'), dataIndex: 'organization', key: 'organization', width: 100 },
    { title: t('development.table.creator'), dataIndex: 'creator', key: 'creator', width: 120,
      render: (creator: { name: string } | undefined) => {
        if (!creator) return null;
        return (
          <Space spacing={8}>
            <Avatar size="small" className="avatar-creator">{creator.name.charAt(0)}</Avatar>
            <span>{creator.name}</span>
          </Space>
        );
      },
    },
    { title: t('development.table.lastModified'), dataIndex: 'updatedAt', key: 'updatedAt', width: 120, sorter: true },
    { title: t('development.table.actions'), dataIndex: 'action', key: 'action', width: 60,
      render: (_: unknown, record: ProcessItem) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item icon={<IconExternalOpenStroked />} onClick={(e) => { e.stopPropagation(); openProcess({ id: `PROC-2024-${String(record.key).padStart(3, '0')}`, name: record.name }); }}>{t('development.actions.openProcess')}</Dropdown.Item>
              <Dropdown.Item icon={<IconEditStroked />} onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>{t('development.actions.edit')}</Dropdown.Item>
              <Dropdown.Item icon={<IconPlay />} onClick={handleRun}>{t('development.actions.run')}</Dropdown.Item>
              <Dropdown.Item icon={<IconDeleteStroked />} type="danger" onClick={handleDelete}>{t('development.actions.delete')}</Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button icon={<IconMore />} theme="borderless" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="process-development">
      {/* 标题区域 */}
      <div className="process-development-header">
        <div className="process-development-header-title">
          <Title heading={3} className="title">{t('development.title')}</Title>
          <Text type="tertiary">{t('development.description')}</Text>
        </div>

        {/* 操作栏 - 使用Row/Col栅格布局 */}
        <Row type="flex" justify="space-between" align="middle" className="process-development-header-toolbar">
          <Col>
            <Input 
              prefix={<IconSearch />}
              placeholder={t('development.searchPlaceholder')}
              style={{ width: 240 }}
              value={queryParams.keyword}
              onChange={handleSearch}
            />
          </Col>
          <Col>
            <Space spacing={12}>
              <Button icon={<IconDownload />} theme="light">{t('development.importProcess')}</Button>
              <Button icon={<IconPlus />} theme="solid" type="primary" onClick={() => setCreateModalVisible(true)}>{t('development.createProcess')}</Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="process-development-table">
        <Table 
          columns={columns} 
          dataSource={processListData}
          loading={loading}
          onRow={(record) => ({
            onClick: () => openProcessDetail(record as ProcessItem),
            className: selectedProcess?.id === record.id && detailDrawerVisible ? 'process-development-row-selected' : undefined,
            style: { cursor: 'pointer' }
          })}
          pagination={{
            total: paginationInfo.total,
            pageSize: queryParams.pageSize,
            currentPage: queryParams.page,
            onPageChange: (page) => setQueryParams(prev => ({ ...prev, page })),
            onPageSizeChange: (pageSize) => setQueryParams(prev => ({ ...prev, page: 1, pageSize })),
            showSizeChanger: true,
            showTotal: true,
          }}
          scroll={{ y: 'calc(100vh - 320px)' }}
        />
      </div>

      <CreateProcessModal visible={createModalVisible} onCancel={() => setCreateModalVisible(false)} onSuccess={(processData) => {
        loadData();
        setSelectedProcess({ id: processData.id, key: 0, name: processData.name, description: processData.description ?? '', status: processData.status, language: 'Python', timeout: 60, version: '1.0.0', organization: processData.organization, creator: { name: processData.creator, avatar: '' }, created_at: processData.createdAt, updated_at: processData.createdAt });
        setDetailDrawerVisible(true);
      }} />
      <EditProcessModal visible={editModalVisible} onCancel={() => setEditModalVisible(false)} processData={editingProcess} onSuccess={(updatedData) => { console.log('流程已更新:', updatedData); loadData(); }} />
      <ProcessDetailDrawer visible={detailDrawerVisible} onClose={() => setDetailDrawerVisible(false)} processData={selectedProcess} onEdit={() => handleEdit()} onRun={handleRun} onDelete={handleDelete} onOpen={() => selectedProcess && openProcess(selectedProcess)} />
      <OpenProcessModal />
    </div>
  );
};

export default ProcessDevelopment;
