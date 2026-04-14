import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import DepartmentSelect from '@/components/DepartmentSelect';
import { Download, Ellipsis, Trash2, Upload, UserPlus } from 'lucide-react';
import { debounce } from 'lodash';
import type {
  LYFileResponse,
  LYFileListResultResponse,
  GetFilesParams,
  FileSource,
} from '@/api/index';
import UploadFileModal from './components/UploadFileModal';

import FileDetailDrawer from './components/FileDetailDrawer';
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

const generateMockFile = (index: number): LYFileResponse => {
  const sources: FileSource[] = ['MANUAL', 'AUTOMATION_PROCESS'];
  const source = sources[index % 2];
  const originalNames = [
    'config.json',
    'data-template.xlsx',
    'input-mapping.xml',
    'process-assets.zip',
    'report-template.docx',
    'script-helper.py',
    'credentials.enc',
    'workflow-config.yaml',
  ];
  const displayNames = [
    'System Configuration',
    'Data Template',
    'Input Mapping Config',
    'Process Asset Package',
    'Report Template',
    'Script Helper Tool',
    'Encrypted Credentials',
    'Workflow Configuration',
  ];

  const originalName = originalNames[index % originalNames.length];
  const displayName = displayNames[index % displayNames.length];
  // 部分文件已发布
  const isPublished = index % 3 === 0;
  
  const deptNames = ['Finance Department', 'R&D Center', 'Enterprise Business Center', 'Human Resources Department'];
  const deptIds = ['dept-finance', 'dept-rd', 'dept-enterprise', 'dept-hr'];

  return {
    id: generateUUID(),
    display_name: displayName,
    original_name: originalName,
    storage_id: generateUUID(),
    file_size: Math.floor(Math.random() * 10 * 1024 * 1024) + 1024, // 1KB - 10MB
    is_published: isPublished,
    source,
    description: index === 0
      ? 'A core configuration file containing connection parameters and authentication info for multiple critical systems. Do not modify without authorization.'
      : `Description for ${displayName}.`,
    change_reason: index % 4 === 0 ? 'Fixed configuration error' : undefined,
    owning_department_id: deptIds[index % deptIds.length],
    owning_department_name: deptNames[index % deptNames.length],
    created_by: `user-00${(index % 4) + 1}`,
    created_by_name: ['John Smith', 'Jane Doe', 'Mike Wang', 'David Zhao'][index % 4],
    created_by_department: ['R&D Dept', 'Product Dept', 'QA Dept', 'Ops Dept'][index % 4],
    created_by_role: ['Senior Engineer', 'Product Manager', 'QA Engineer', 'Ops Engineer'][index % 4],
    created_by_email: ['john.smith@example.com', 'jane.doe@example.com', 'mike.wang@example.com', 'david.zhao@example.com'][index % 4],
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_by: index % 2 === 0 ? generateUUID() : null,
    updated_by_name: index % 2 === 0 ? 'Updater' : null,
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
};

const generateMockFileList = (): LYFileResponse[] => {
  return Array.from({ length: 15 }, (_, i) => generateMockFile(i));
};

// 模拟API调用
const fetchFileList = async (
  params: GetFilesParams & { sourceFilter?: FileSource | null }
): Promise<LYFileListResultResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  let data = generateMockFileList();

  // 关键词筛选
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    data = data.filter((item) => item.display_name.toLowerCase().includes(keyword));
  }

  // 来源筛选
  if (params.sourceFilter) {
    data = data.filter((item) => item.source === params.sourceFilter);
  }

  // 部门筛选
  if ((params as any).departmentFilter && (params as any).departmentFilter.length > 0) {
    const deptNames: string[] = (params as any).departmentFilter;
    data = data.filter((item) => deptNames.includes((item as any).owning_department_name));
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

// 来源类型配置
const sourceConfig: Record<FileSource, { color: 'blue' | 'green'; i18nKey: string }> = {
  MANUAL: { color: 'blue', i18nKey: 'file.source.manual' },
  AUTOMATION_PROCESS: { color: 'green', i18nKey: 'file.source.automationProcess' },
};

interface QueryParams {
  page: number;
  pageSize: number;
  keyword: string;
}

export interface FileManagementContentProps {
  context: 'development' | 'scheduling';
}

const FileManagementContent = ({ context }: FileManagementContentProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 表格容器ref和高度计算
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableScrollY, setTableScrollY] = useState<number | undefined>(undefined);

  useEffect(() => {
    const calcHeight = () => {
      if (tableContainerRef.current) {
        // 减去表头(约40px)和分页组件(约56px)的高度
        const availableHeight = tableContainerRef.current.clientHeight - 40 - 56;
        setTableScrollY(availableHeight > 100 ? availableHeight : undefined);
      }
    };
    calcHeight();
    const observer = new ResizeObserver(calcHeight);
    if (tableContainerRef.current) {
      observer.observe(tableContainerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 搜索框输入值
  const [searchValue, setSearchValue] = useState('');

  // 查询参数
  const [queryParams, setQueryParams] = useState<QueryParams>({
    page: 1,
    pageSize: 20,
    keyword: '',
  });

  // 来源筛选
  const [sourceFilter, setSourceFilter] = useState<FileSource[]>([]);
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  // 部门筛选
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);

  // 列表数据
  const [listResponse, setListResponse] = useState<LYFileListResultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 选中的文件（用于详情）
  const [selectedFile, setSelectedFile] = useState<LYFileResponse | null>(null);
  

  // 预选文件（用于先选择文件再弹窗）
  const [preSelectedFile, setPreSelectedFile] = useState<File | null>(null);

  // 模态框/抽屉状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchFileList({
        keyword: queryParams.keyword || undefined,
        context,
        offset: (queryParams.page - 1) * queryParams.pageSize,
        size: queryParams.pageSize,
        sourceFilter: sourceFilter.length > 0 ? sourceFilter[0] : null,
        departmentFilter,
      } as any);
      setListResponse(response);
      return response.data;
    } catch (error) {
      console.error('加载文件列表失败:', error);
      Toast.error(t('file.list.loadError'));
      return [];
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, sourceFilter, departmentFilter, context, t]);

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
    setSearchValue(value);
    debouncedSearch(value);
  };

  // 来源筛选选项
  const sourceFilterOptions = [
    { value: 'MANUAL', label: t('file.source.manual') },
    { value: 'AUTOMATION_PROCESS', label: t('file.source.automationProcess') },
  ];

  // 点击行查看详情
  const handleRowClick = (record: LYFileResponse) => {
    setSelectedFile(record);
    setDetailInitialTab('basic');
    setDetailDrawerVisible(true);
  };


  // 下载
  const handleDownload = (record: LYFileResponse) => {
    Toast.info(t('file.actions.downloading'));
    setTimeout(() => {
      Toast.success(t('file.actions.downloadSuccess'));
    }, 500);
    console.log('Download file:', record.id);
  };

  // 删除文件
  const handleDelete = (record: LYFileResponse) => {
    Modal.confirm({
      title: t('file.deleteModal.title'),      content: (
        <div>
          <div>{t('file.deleteModal.confirmMessage', { name: record.display_name })}</div>
          {record.is_published && (
            <div style={{ color: 'var(--semi-color-warning)', marginTop: 8 }}>{t('file.deleteModal.publishedWarning')}</div>
          )}
        </div>
      ),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        Toast.success(t('file.deleteModal.success'));
        setDetailDrawerVisible(false);
        loadData();
      },
    });
  };

  // 分页变化
  const handlePageChange = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page }));
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 抽屉导航
  const handleDrawerNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      if (!listResponse?.data || !selectedFile) return;
      const currentIndex = listResponse.data.findIndex((f) => f.id === selectedFile.id);
      const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < listResponse.data.length) {
        setSelectedFile(listResponse.data[newIndex]);
      }
    },
    [listResponse?.data, selectedFile]
  );

  // 获取当前索引
  const currentFileIndex = useMemo(() => {
    if (!listResponse?.data || !selectedFile) return -1;
    return listResponse.data.findIndex((f) => f.id === selectedFile.id);
  }, [listResponse?.data, selectedFile]);

  // 获取已有文件名列表（用于上传时校验）
  const existingFileNames = useMemo(() => {
    return listResponse?.data?.map((f) => f.display_name) || [];
  }, [listResponse?.data]);

  // 处理上传按钮点击
  const handleUploadClick = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.xml,.yaml,.yml,.txt,.csv,.xlsx,.xls,.docx,.doc,.pdf,.zip,.rar,.7z,.py,.js,.ts,.sh,.bat,.enc,.key,.pem,.png,.jpg,.jpeg,.gif,.svg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setPreSelectedFile(file);
        setUploadModalVisible(true);
      }
    };
    input.click();
  }, []);

  // 表格列定义
  const columns = [
    {
      title: t('file.table.name'),
      dataIndex: 'display_name',
      key: 'display_name',
      width: 200,
      ellipsis: true,
    },
    {
      title: t('file.table.size'),
      dataIndex: 'file_size',
      key: 'file_size',
      width: 100,
      render: (size: number) => (
        <span>{formatFileSize(size)}</span>
      ),
    },
    {
      title: t('file.table.source'),
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: FileSource) => {
        const config = sourceConfig[source];
        return <Tag color={config.color}>{t(config.i18nKey)}</Tag>;
      },
    },
    // 发布状态列 - 仅开发中心显示
    ...(context === 'development' ? [{
      title: t('file.detail.publishStatus'),
      dataIndex: 'is_published',
      key: 'is_published',
      width: 100,
      render: (isPublished: boolean) => (
        <Tag color={isPublished ? 'green' : 'grey'}>
          {isPublished ? t('file.detail.published') : t('file.detail.unpublished')}
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
      width: 180,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('common.updateTime'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 160,
      sorter: (a: LYFileResponse, b: LYFileResponse) => 
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      render: (time: string) => new Date(time).toLocaleString('zh-CN'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: LYFileResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          clickToHide
          render={
            <Dropdown.Menu>
              <Dropdown.Item
                 icon={<Download size={16} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(record);
                }}
              >
                {t('file.actions.download')}
              </Dropdown.Item>
              <Dropdown.Item
                icon={<UserPlus size={14} strokeWidth={2} />}
                onClick={(e) => {
                  e.stopPropagation();
                  openCollaborator(record.id);
                }}
              >
                {t('collaborator.actions.addCollaborator')}
              </Dropdown.Item>
              {context === 'development' && (
                <Dropdown.Item
                  icon={<Trash2 size={16} strokeWidth={2} />}
                  type="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record);
                  }}
                >
                  {t('common.delete')}
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button
            icon={<Ellipsis size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  // 分页信息
  const range = listResponse?.range;
  const total = range?.total || 0;

  const { Title, Text } = Typography;

  return (
    <div className="file-management-content">



      {/* 标题区域 */}
      <div className="file-management-content-header">
        <div className="file-management-content-header-title">
          <Title heading={3} className="title">
            {t('file.title')}
          </Title>
          <Text type="tertiary">{t('file.description')}</Text>
        </div>

        {/* 操作栏 */}
        <Row
          type="flex"
          justify="space-between"
          align="middle"
          className="file-management-content-header-toolbar"
        >
          <Col>
            <Space>
              <Input
                prefix={<IconSearchStroked />}
                placeholder={t('file.searchPlaceholder')}
                className="file-management-content-search-input"
                value={searchValue}
                onChange={handleSearch}
                showClear
                maxLength={100}
              />
              <DepartmentSelect
                placeholder={t('common.owningDepartment')}
                value={departmentFilter}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams((prev) => ({ ...prev, page: 1 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 120, maxWidth: 600 }}
              />
              <FilterPopover
                visible={filterPopoverVisible}
                onVisibleChange={setFilterPopoverVisible}
                onConfirm={(values) => {
                  setSourceFilter((values.source as FileSource[]) || []);
                  setQueryParams((prev) => ({ ...prev, page: 1 }));
                }}
                sections={[
                  {
                    key: 'source',
                    label: t('file.filter.source'),
                    type: 'checkbox',
                    options: sourceFilterOptions,
                    value: sourceFilter,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col>
            {context === 'development' && (
              <Button
                icon={<Upload size={16} strokeWidth={2} />}
                theme="solid"
                style={{ backgroundColor: 'var(--semi-color-text-0)', borderColor: 'var(--semi-color-text-0)' }}
                onClick={handleUploadClick}
              >
                {t('file.upload.button')}
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {/* 表格 */}
      <div className="file-management-content-table" ref={tableContainerRef}>
        {isInitialLoad ? (
          <TableSkeleton />
        ) : listResponse?.data?.length === 0 ? (
          <EmptyState
            variant={queryParams.keyword || sourceFilter.length > 0 ? 'noResult' : 'noData'}
            description={
              queryParams.keyword || sourceFilter.length > 0
                ? t('file.empty.filterDescription')
                : t('file.empty.defaultDescription')
            }
          />
        ) : (
          <Table
            size="small"
            columns={columns}
            dataSource={listResponse?.data || []}
            rowKey="id"
            loading={loading && !isInitialLoad}
            scroll={tableScrollY ? { y: tableScrollY } : undefined}
            pagination={{
              currentPage: queryParams.page,
              pageSize: queryParams.pageSize,
              total,
              onPageChange: handlePageChange,
              onPageSizeChange: (newPageSize) => setQueryParams((prev) => ({ ...prev, page: 1, pageSize: newPageSize })),
              showSizeChanger: true,
              showTotal: true,
            }}
            onRow={(record) => ({
              onClick: () => handleRowClick(record as LYFileResponse),
              className:
                selectedFile?.id === (record as LYFileResponse).id && detailDrawerVisible
                  ? 'file-management-row-selected'
                  : '',
            })}
          />
        )}
      </div>

      {/* 上传文件弹窗 */}
      <UploadFileModal
        visible={uploadModalVisible}
        onClose={() => {
          setUploadModalVisible(false);
          setPreSelectedFile(null);
        }}
        onSuccess={loadData}
        existingFileNames={existingFileNames}
        preSelectedFile={preSelectedFile}
      />

      {/* 详情抽屉 */}
      <FileDetailDrawer
        visible={detailDrawerVisible}
        file={selectedFile}
        context={context}
        dataList={listResponse?.data || []}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedFile(null);
          setDetailInitialTab('basic');
        }}
        onNavigate={(file) => setSelectedFile(file)}
        onDelete={handleDelete}
        initialTab={detailInitialTab}
      />

      {renderCollaboratorPanel('FILE', context)}
    </div>
  );
};

export default FileManagementContent;
