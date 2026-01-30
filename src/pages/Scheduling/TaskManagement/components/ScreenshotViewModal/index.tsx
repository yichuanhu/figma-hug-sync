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
  Button,
  Image,
  ImagePreview,
} from '@douyinfe/semi-ui';
import {
  IconDeleteStroked,
  IconChevronLeft,
  IconChevronRight,
} from '@douyinfe/semi-icons';
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
  
  // 灯箱预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  
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
  
  // 删除单个截图
  const handleDeleteSingle = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    Modal.confirm({
      title: t('screenshot.deleteConfirm.title'),
      content: t('screenshot.deleteConfirm.content'),
      okType: 'danger',
      onOk: () => {
        setScreenshots((prev) => prev.filter((s) => s.id !== id));
        Toast.success(t('screenshot.deleteSuccess'));
      },
    });
  }, [t]);
  
  // 灯箱中删除当前图片
  const handleDeleteInPreview = useCallback(() => {
    const currentScreenshot = screenshots[previewIndex];
    if (!currentScreenshot) return;
    
    Modal.confirm({
      title: t('screenshot.deleteConfirm.title'),
      content: t('screenshot.deleteConfirm.content'),
      okType: 'danger',
      onOk: () => {
        setScreenshots((prev) => prev.filter((s) => s.id !== currentScreenshot.id));
        Toast.success(t('screenshot.deleteSuccess'));
        
        // 调整预览索引
        if (screenshots.length <= 1) {
          setPreviewVisible(false);
        } else if (previewIndex >= screenshots.length - 1) {
          setPreviewIndex(previewIndex - 1);
        }
      },
    });
  }, [screenshots, previewIndex, t]);
  
  // 下载选中项
  const handleDownload = useCallback(() => {
    Toast.info(t('screenshot.batchOperation.downloading', { count: selectedIds.size }));
    // Mock 下载逻辑
  }, [selectedIds, t]);
  
  // 是否全选
  const isAllSelected = useMemo(() => {
    return screenshots.length > 0 && selectedIds.size === screenshots.length;
  }, [screenshots, selectedIds]);
  
  // 打开灯箱预览
  const handleOpenPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  }, []);
  
  // 关闭灯箱
  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);
  
  // 上一张
  const handlePrevImage = useCallback(() => {
    setPreviewIndex((prev) => (prev > 0 ? prev - 1 : screenshots.length - 1));
  }, [screenshots.length]);
  
  // 下一张
  const handleNextImage = useCallback(() => {
    setPreviewIndex((prev) => (prev < screenshots.length - 1 ? prev + 1 : 0));
  }, [screenshots.length]);
  
  // 当前预览的截图
  const currentPreviewScreenshot = screenshots[previewIndex];
  
  // 排序选项
  const sortOptions = [
    { value: 'asc', label: t('screenshot.sort.asc') },
    { value: 'desc', label: t('screenshot.sort.desc') },
  ];
  
  // 标题
  const modalTitle = taskName
    ? t('screenshot.modalTitle', { taskName })
    : t('screenshot.title');

  // 预览图片列表
  const previewSrcList = useMemo(() => 
    screenshots.map((s) => s.file_url),
    [screenshots]
  );

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
      title: t('screenshot.table.thumbnail'),
      dataIndex: 'thumbnail_url',
      width: 180,
      render: (_: string, record: LYTaskScreenshotResponse, index: number) => (
        <div 
          className="screenshot-table-thumbnail" 
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPreview(index ?? 0);
          }}
        >
          <Image
            src={record.thumbnail_url || record.file_url}
            alt={record.name || `截图 ${record.sequence_number}`}
            width={140}
            height={78}
            style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            preview={false}
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
      title: t('screenshot.table.sequence'),
      dataIndex: 'sequence_number',
      width: 80,
      render: (value: number) => `#${value}`,
    },
    {
      title: t('screenshot.table.capturedAt'),
      dataIndex: 'captured_at',
      width: 160,
      render: (value: string) => formatTime(value),
    },
    {
      title: t('screenshot.table.operation'),
      dataIndex: 'operation',
      width: 80,
      render: (_: unknown, record: LYTaskScreenshotResponse) => (
        <Button
          icon={<IconDeleteStroked />}
          theme="borderless"
          size="small"
          onClick={(e) => handleDeleteSingle(record.id, e)}
        />
      ),
    },
  ], [t, isAllSelected, selectedIds, screenshots.length, handleSelectAll, handleClearSelection, handleSelect, handleOpenPreview, handleDeleteSingle]);
  
  // 自定义灯箱渲染
  const renderPreviewFooter = () => {
    if (!currentPreviewScreenshot) return null;
    
    const displayName = currentPreviewScreenshot.name || 
      `${t('screenshot.defaultName')} ${currentPreviewScreenshot.sequence_number}`;
    
    return (
      <div className="screenshot-preview-footer">
        <div className="screenshot-preview-info">
          <div className="screenshot-preview-info-main">
            <Text className="screenshot-preview-name">{displayName}</Text>
            <Text className="screenshot-preview-sequence" type="tertiary">
              #{currentPreviewScreenshot.sequence_number} / {screenshots.length}
            </Text>
          </div>
          <div className="screenshot-preview-info-detail">
            <Text type="tertiary" size="small">
              {t('screenshot.table.capturedAt')}: {formatTime(currentPreviewScreenshot.captured_at)}
            </Text>
            <Text type="tertiary" size="small" style={{ marginLeft: 16 }}>
              {t('screenshot.table.fileSize')}: {formatFileSize(currentPreviewScreenshot.file_size)}
            </Text>
            {currentPreviewScreenshot.description && (
              <Text type="tertiary" size="small" style={{ marginLeft: 16 }}>
                {currentPreviewScreenshot.description}
              </Text>
            )}
          </div>
        </div>
        <div className="screenshot-preview-actions">
          <Button
            icon={<IconChevronLeft />}
            theme="borderless"
            onClick={handlePrevImage}
            disabled={screenshots.length <= 1}
          />
          <Button
            icon={<IconChevronRight />}
            theme="borderless"
            onClick={handleNextImage}
            disabled={screenshots.length <= 1}
          />
          <Button
            icon={<IconDeleteStroked />}
            theme="borderless"
            onClick={handleDeleteInPreview}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <>
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
      
      {/* 自定义灯箱预览 */}
      <ImagePreview
        visible={previewVisible}
        src={previewSrcList}
        currentIndex={previewIndex}
        onVisibleChange={handleClosePreview}
        onChange={(index) => setPreviewIndex(index)}
        renderPreviewMenu={() => null}
      />
      
      {/* 灯箱底部信息栏 */}
      {previewVisible && (
        <div className="screenshot-preview-overlay">
          {renderPreviewFooter()}
        </div>
      )}
    </>
  );
};

export default ScreenshotViewModal;
