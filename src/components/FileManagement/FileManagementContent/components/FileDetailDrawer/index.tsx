import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
  Toast,
  Modal,
  Space,
  Divider,
} from '@douyinfe/semi-ui';
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMaximize,
  IconMinimize,
  IconUpload,
  IconDownload,
  IconDeleteStroked,
} from '@douyinfe/semi-icons';
import type { LYFileResponse, FileSource } from '@/api/index';

import './index.less';

const { Title, Text } = Typography;

// 来源类型配置
const sourceConfig: Record<FileSource, { color: 'blue' | 'green'; i18nKey: string }> = {
  MANUAL: { color: 'blue', i18nKey: 'file.source.manual' },
  AUTOMATION_PROCESS: { color: 'green', i18nKey: 'file.source.automationProcess' },
};

interface FileDetailDrawerProps {
  visible: boolean;
  file: LYFileResponse | null;
  context: 'development' | 'scheduling';
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onReupload: (file: LYFileResponse) => void;
  onDelete: (file: LYFileResponse) => void;
}

const FileDetailDrawer = ({
  visible,
  file,
  context,
  currentIndex,
  totalCount,
  onClose,
  onNavigate,
  onReupload,
  onDelete,
}: FileDetailDrawerProps) => {
  const { t } = useTranslation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('file-detail-drawer-width');
    return saved ? Math.max(Number(saved), 576) : 900;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(drawerWidth);

  // 保存宽度到 localStorage
  useEffect(() => {
    if (!isFullscreen) {
      localStorage.setItem('file-detail-drawer-width', drawerWidth.toString());
    }
  }, [drawerWidth, isFullscreen]);

  // 拖拽调整宽度
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = drawerWidth;
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = startX.current - e.clientX;
        setDrawerWidth(Math.min(Math.max(startWidth.current + diff, 576), window.innerWidth - 100));
      };
      const handleMouseUp = () => {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [drawerWidth],
  );

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '-';
    return new Date(time).toLocaleString('zh-CN');
  };

  // 切换全屏
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 下载文件
  const handleDownload = useCallback(() => {
    if (file) {
      Toast.info(t('file.actions.downloading'));
      // 模拟下载
      setTimeout(() => {
        Toast.success(t('file.actions.downloadSuccess'));
      }, 500);
    }
  }, [file, t]);

  // 删除检查
  const handleDelete = useCallback(() => {
    if (!file) return;

    // 已发布的文件不允许删除
    if (file.is_published) {
      Modal.warning({
        title: t('file.deleteModal.cannotDeleteTitle'),
        content: t('file.deleteModal.publishedError'),
        okText: t('common.confirm'),
      });
      return;
    }

    onDelete(file);
  }, [file, onDelete, t]);

  // 抽屉关闭时重置状态
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 导航
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalCount - 1;

  if (!file) return null;

  // 已发布的文件不允许重新上传和删除
  const canReupload = context === 'development' && !file.is_published;
  const canDelete = context === 'development' && !file.is_published;

  return (
    <SideSheet
      title={
        <div className="file-detail-drawer-header">
          <Title heading={5} className="file-detail-drawer-header-title">
            {file.display_name}
          </Title>
          <Space spacing={8}>
            <Tooltip content={t('common.previous')}>
              <Button
                icon={<IconChevronLeft />}
                theme="borderless"
                size="small"
                disabled={!canGoPrev}
                onClick={() => onNavigate('prev')}
              />
            </Tooltip>
            <Tooltip content={t('common.next')}>
              <Button
                icon={<IconChevronRight />}
                theme="borderless"
                size="small"
                disabled={!canGoNext}
                onClick={() => onNavigate('next')}
              />
            </Tooltip>
            <Divider layout="vertical" className="file-detail-drawer-header-divider" />
            {context === 'development' && canReupload && (
              <Tooltip content={t('file.actions.reupload')}>
                <Button
                  icon={<IconUpload />}
                  theme="borderless"
                  size="small"
                  onClick={() => onReupload(file)}
                />
              </Tooltip>
            )}
            <Tooltip content={t('file.actions.download')}>
              <Button
                icon={<IconDownload />}
                theme="borderless"
                size="small"
                onClick={handleDownload}
              />
            </Tooltip>
            {context === 'development' && canDelete && (
              <Tooltip content={t('common.delete')}>
                <Button
                  icon={<IconDeleteStroked className="file-detail-drawer-header-delete-icon" />}
                  theme="borderless"
                  size="small"
                  onClick={handleDelete}
                />
              </Tooltip>
            )}
            <Divider layout="vertical" className="file-detail-drawer-header-divider" />
            <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
              <Button
                icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
                theme="borderless"
                size="small"
                onClick={toggleFullscreen}
              />
            </Tooltip>
            <Tooltip content={t('common.close')}>
              <Button
                icon={<IconClose />}
                theme="borderless"
                size="small"
                onClick={handleClose}
                className="file-detail-drawer-header-close-btn"
              />
            </Tooltip>
          </Space>
        </div>
      }
      visible={visible}
      onCancel={handleClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      mask={false}
      footer={null}
      closable={false}
      className={`card-sidesheet resizable-sidesheet file-detail-drawer ${isFullscreen ? 'fullscreen-sidesheet' : ''}`}
    >
      {!isFullscreen && <div className="file-detail-drawer-resize-handle" onMouseDown={handleMouseDown} />}
      <div className="file-detail-drawer-content">
        {/* 基本信息 */}
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('file.table.name')}>
            {file.display_name}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('file.detail.originalName')}>
            {file.original_name}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('file.table.size')}>
            {formatFileSize(file.file_size)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('file.table.source')}>
            <Tag color={sourceConfig[file.source].color}>
              {t(sourceConfig[file.source].i18nKey)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('file.detail.publishStatus')}>
            <Tag color={file.is_published ? 'green' : 'grey'}>
              {file.is_published ? t('file.detail.published') : t('file.detail.unpublished')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.description')}>
            {file.description || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.creator')}>
            {file.created_by_name}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.createTime')}>
            {formatTime(file.created_at)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('file.detail.updater')}>
            {file.updated_by_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.updateTime')}>
            {formatTime(file.updated_at)}
          </Descriptions.Item>
          {file.change_reason && (
            <Descriptions.Item itemKey={t('file.fields.changeReason')}>
              {file.change_reason}
            </Descriptions.Item>
          )}
        </Descriptions>
      </div>
    </SideSheet>
  );
};

export default FileDetailDrawer;
