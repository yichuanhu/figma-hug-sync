import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Spin,
  Typography,
  Select,
  Row,
  Col,
  Space,
  Toast,
  Table,
  Checkbox,
  Image,
} from '@douyinfe/semi-ui';
import type { ColumnProps } from '@douyinfe/semi-ui/lib/es/table';
import EmptyState from '@/components/EmptyState';
import BatchOperationBar from './components/BatchOperationBar';
import type {
  LYTaskScreenshotResponse,
  LYListResponseLYTaskScreenshotResponse,
  GetScreenshotsParams,
} from '@/api';
import './index.less';

const { Text } = Typography;

interface ScreenshotViewModalProps {
  visible: boolean;
  executionId: string;
  taskName?: string;
  onClose: () => void;
}

// 排序选项
type SortOrder = 'asc' | 'desc';

// 生成 UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Mock 数据生成
const generateMockScreenshot = (executionId: string, index: number): LYTaskScreenshotResponse => {
  const baseTime = new Date(2026, 0, 30, 14, 30);
  const capturedAt = new Date(baseTime.getTime() + index * 10000); // 每10秒一张
  
  // 使用 picsum.photos 作为 mock 图片
  const imageId = 100 + index;
  
  return {
    id: generateUUID(),
    execution_id: executionId,
    file_id: generateUUID(),
    file_url: `https://picsum.photos/seed/${imageId}/1920/1080`,
    thumbnail_url: `https://picsum.photos/seed/${imageId}/320/180`,
    name: index % 3 === 0 ? `步骤 ${index + 1} 截图` : null,
    description: index % 4 === 0 ? `这是第 ${index + 1} 个截图的描述信息` : null,
    sequence_number: index + 1,
    captured_at: capturedAt.toISOString(),
    file_size: 150000 + Math.floor(Math.random() * 100000),
    created_at: capturedAt.toISOString(),
  };
};

// Mock API 调用
const fetchScreenshots = async (
  executionId: string,
  params: GetScreenshotsParams
): Promise<LYListResponseLYTaskScreenshotResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // 生成 12 张 mock 截图
  const mockData = Array(12)
    .fill(null)
    .map((_, index) => generateMockScreenshot(executionId, index));
  
  // 排序
  const sorted = [...mockData].sort((a, b) => {
    if (params.sort_order === 'desc') {
      return b.sequence_number - a.sequence_number;
    }
    return a.sequence_number - b.sequence_number;
  });
  
  return {
    range: { offset: 0, size: sorted.length, total: sorted.length },
    list: sorted,
  };
};

// 格式化时间
const formatTime = (isoTime: string): string => {
  const date = new Date(isoTime);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const ScreenshotViewModal = ({
  visible,
  executionId,
  taskName,
  onClose,
}: ScreenshotViewModalProps) => {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [screenshots, setScreenshots] = useState<LYTaskScreenshotResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  
  // 加载数据
  const loadData = useCallback(async () => {
    if (!executionId) return;
    
    setLoading(true);
    try {
      const response = await fetchScreenshots(executionId, {
        sort_order: sortOrder,
      });
      setScreenshots(response.list);
    } finally {
      setLoading(false);
    }
  }, [executionId, sortOrder]);
  
  // 当弹窗打开或排序变化时加载数据
  useEffect(() => {
    if (visible) {
      loadData();
      // 重置选择
      setSelectedIds(new Set());
    }
  }, [visible, loadData]);
  
  // 处理选择
  const handleSelect = useCallback((id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);
  
  // 全选
  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(screenshots.map((s) => s.id)));
  }, [screenshots]);
  
  // 清除选择
  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  // 删除选中项
  const handleDelete = useCallback(() => {
    // Mock 删除
    setScreenshots((prev) => prev.filter((s) => !selectedIds.has(s.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);
  
  // 下载选中项
  const handleDownload = useCallback(() => {
    Toast.info(t('screenshot.batchOperation.downloading', { count: selectedIds.size }));
    // Mock 下载逻辑
  }, [selectedIds, t]);
  
  // 是否全选
  const isAllSelected = useMemo(() => {
    return screenshots.length > 0 && selectedIds.size === screenshots.length;
  }, [screenshots, selectedIds]);
  
  // 排序选项
  const sortOptions = [
    { value: 'asc', label: t('screenshot.sort.asc') },
    { value: 'desc', label: t('screenshot.sort.desc') },
  ];
  
  // 标题
  const modalTitle = taskName
    ? t('screenshot.modalTitle', { taskName })
    : t('screenshot.title');

  // 表格列定义
  const columns: ColumnProps<LYTaskScreenshotResponse>[] = useMemo(() => [
    {
      title: (
        <Checkbox
          checked={isAllSelected}
          indeterminate={selectedIds.size > 0 && selectedIds.size < screenshots.length}
          onChange={(e) => {
            if (e.target.checked) {
              handleSelectAll();
            } else {
              handleClearSelection();
            }
          }}
        />
      ),
      dataIndex: 'id',
      width: 48,
      render: (_: string, record: LYTaskScreenshotResponse) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(record.id)}
            onChange={(e) => handleSelect(record.id, e.target.checked ?? false)}
          />
        </div>
      ),
    },
    {
      title: t('screenshot.table.sequence'),
      dataIndex: 'sequence_number',
      width: 80,
      render: (value: number) => `#${value}`,
    },
    {
      title: t('screenshot.table.thumbnail'),
      dataIndex: 'thumbnail_url',
      width: 180,
      render: (_: string, record: LYTaskScreenshotResponse) => (
        <div className="screenshot-table-thumbnail" onClick={(e) => e.stopPropagation()}>
          <Image
            src={record.thumbnail_url || record.file_url}
            alt={record.name || `截图 ${record.sequence_number}`}
            width={140}
            height={78}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              src: record.file_url,
            }}
          />
        </div>
      ),
    },
    {
      title: t('screenshot.table.name'),
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string | null, record: LYTaskScreenshotResponse) => (
        <Text ellipsis={{ showTooltip: true }}>
          {value || `${t('screenshot.defaultName')} ${record.sequence_number}`}
        </Text>
      ),
    },
    {
      title: t('screenshot.table.capturedAt'),
      dataIndex: 'captured_at',
      width: 160,
      render: (value: string) => formatTime(value),
    },
    {
      title: t('screenshot.table.fileSize'),
      dataIndex: 'file_size',
      width: 100,
      render: (value: number) => formatFileSize(value),
    },
  ], [t, isAllSelected, selectedIds, screenshots.length, handleSelectAll, handleClearSelection, handleSelect]);
  
  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      title={modalTitle}
      footer={null}
      className="screenshot-view-modal"
      width="80vw"
      style={{ maxWidth: 1200 }}
      bodyStyle={{ height: '70vh', overflow: 'hidden' }}
      centered
    >
      <div className="screenshot-view-modal-content">
        {/* 工具栏 */}
        <div className="screenshot-view-modal-toolbar">
          <Row justify="space-between" align="middle">
            <Col>
              <Text type="secondary">
                {t('screenshot.totalCount', { count: screenshots.length })}
              </Text>
            </Col>
            <Col>
              <Space>
                <Text type="tertiary">{t('screenshot.sortBy')}</Text>
                <Select
                  value={sortOrder}
                  onChange={(value) => setSortOrder(value as SortOrder)}
                  optionList={sortOptions}
                  style={{ width: 140 }}
                  size="small"
                />
              </Space>
            </Col>
          </Row>
        </div>
        
        {/* 批量操作栏 */}
        {selectedIds.size > 0 && (
          <BatchOperationBar
            selectedCount={selectedIds.size}
            totalCount={screenshots.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onDelete={handleDelete}
            onDownload={handleDownload}
            isAllSelected={isAllSelected}
          />
        )}
        
        {/* 表格区域 */}
        <div className="screenshot-view-modal-table">
          {loading ? (
            <div className="screenshot-view-modal-loading">
              <Spin size="large" />
            </div>
          ) : screenshots.length === 0 ? (
            <div className="screenshot-view-modal-empty">
              <EmptyState
                variant="noData"
                description={t('screenshot.noData')}
              />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={screenshots}
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ y: 'calc(70vh - 180px)' }}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ScreenshotViewModal;
