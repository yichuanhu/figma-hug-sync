import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SideSheet,
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
  Tabs,
  TabPane,
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
  IconLink,
  IconGridView,
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
  const [activeTab, setActiveTab] = useState('basic');
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

    // 如果有依赖，阻止删除
    if (file.is_depended_by_process && file.dependent_process_versions?.length) {
      Modal.warning({
        title: t('file.deleteModal.cannotDeleteTitle'),
        content: (
          <div>
            <Text>{t('file.deleteModal.hasDependencies')}</Text>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              {file.dependent_process_versions.map((dep) => (
                <li key={dep.version_id}>
                  {dep.process_name} ({dep.version})
                </li>
              ))}
            </ul>
          </div>
        ),
        okText: t('common.confirm'),
      });
      return;
    }

    onDelete(file);
  }, [file, onDelete, t]);

  // 抽屉关闭时重置状态
  const handleClose = useCallback(() => {
    setActiveTab('basic');
    onClose();
  }, [onClose]);

  // 导航
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < totalCount - 1;

  if (!file) return null;

  const canDelete = context === 'development' && !file.is_depended_by_process;

  return (
    <SideSheet
      title={
        <div className="file-detail-drawer-header">
          <Title heading={5} className="file-detail-drawer-header-title">
            {file.name}
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
            {context === 'development' && (
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
            {context === 'development' && (
              <Tooltip
                content={
                  canDelete
                    ? t('common.delete')
                    : t('file.deleteModal.cannotDeleteTooltip')
                }
              >
                <Button
                  icon={<IconDeleteStroked className={canDelete ? 'file-detail-drawer-header-delete-icon' : ''} />}
                  theme="borderless"
                  size="small"
                  disabled={!canDelete}
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
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="file-detail-drawer-tabs"
      >
        <TabPane tab={t('file.detail.tabs.basicInfo')} itemKey="basic">
          <div className="file-detail-drawer-tab-content">
            {/* 基本信息 */}
            <Descriptions align="left">
              <Descriptions.Item itemKey={t('file.table.name')}>
                {file.name}
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('file.table.size')}>
                {formatFileSize(file.file_size)}
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('file.table.source')}>
                <Tag color={sourceConfig[file.source].color}>
                  {t(sourceConfig[file.source].i18nKey)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item itemKey={t('file.detail.environment')}>
                {file.environment === 'DEV,PRD' || file.environment === 'PRD,DEV' ? (
                  <Tag color="blue">{t('file.environment.all')}</Tag>
                ) : (
                  <Tag color={file.environment === 'DEV' ? 'light-blue' : 'green'}>
                    {file.environment === 'DEV' ? t('file.environment.dev') : t('file.environment.prd')}
                  </Tag>
                )}
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
        </TabPane>

        <TabPane tab={t('file.detail.tabs.dependencies')} itemKey="dependencies">
          <div className="file-detail-drawer-tab-content">
            <div className="file-detail-drawer-section">
              <Text className="file-detail-drawer-section-title">
                <IconLink style={{ marginRight: 8 }} />
                {t('file.detail.dependentProcesses')}
              </Text>
              {file.dependent_process_versions && file.dependent_process_versions.length > 0 ? (
                file.dependent_process_versions.map((dep) => (
                  <div key={dep.version_id} className="file-detail-drawer-dependency-card">
                    <div className="file-detail-drawer-dependency-card-info">
                      <Text className="process-name">{dep.process_name}</Text>
                      <Text className="version">v{dep.version}</Text>
                    </div>
                  </div>
                ))
              ) : (
                <div className="file-detail-drawer-empty">
                  <IconGridView className="file-detail-drawer-empty-icon" />
                  <Text type="tertiary">{t('file.detail.noDependencies')}</Text>
                </div>
              )}
            </div>
          </div>
        </TabPane>
      </Tabs>
    </SideSheet>
  );
};

export default FileDetailDrawer;
