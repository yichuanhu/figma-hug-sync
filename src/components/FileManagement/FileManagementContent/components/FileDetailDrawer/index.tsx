import { useState, useEffect, useCallback } from 'react';
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
  IconFile,
  IconLink,
} from '@douyinfe/semi-icons';
import type { LYFileResponse, FileSource } from '@/api/index';

import './index.less';

const { Text } = Typography;

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

  // 获取存储的宽度
  const getStoredWidth = (): number => {
    const stored = localStorage.getItem('file-detail-drawer-width');
    return stored ? parseInt(stored, 10) : 900;
  };

  const [drawerWidth, setDrawerWidth] = useState(getStoredWidth);

  // 保存宽度到 localStorage
  useEffect(() => {
    if (!isFullscreen) {
      localStorage.setItem('file-detail-drawer-width', drawerWidth.toString());
    }
  }, [drawerWidth, isFullscreen]);

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

  if (!file) return null;

  const canDelete = context === 'development' && !file.is_depended_by_process;

  // 自定义 Header
  const renderHeader = () => (
    <div className="file-detail-drawer-header">
      <div className="file-detail-drawer-header-title">
        <IconFile style={{ color: 'var(--semi-color-primary)' }} />
        <Tooltip content={file.name}>
          <span className="title-text">{file.name}</span>
        </Tooltip>
      </div>
      <div className="file-detail-drawer-header-actions">
        {/* 导航按钮 */}
        <Space spacing={8}>
          <Tooltip content={t('common.previous')}>
            <Button
              icon={<IconChevronLeft />}
              theme="borderless"
              type="tertiary"
              disabled={currentIndex <= 0}
              onClick={() => onNavigate('prev')}
            />
          </Tooltip>
          <Text type="tertiary" size="small">
            {currentIndex + 1} / {totalCount}
          </Text>
          <Tooltip content={t('common.next')}>
            <Button
              icon={<IconChevronRight />}
              theme="borderless"
              type="tertiary"
              disabled={currentIndex >= totalCount - 1}
              onClick={() => onNavigate('next')}
            />
          </Tooltip>
        </Space>

        <div className="file-detail-drawer-header-divider" />

        {/* 操作按钮 */}
        {context === 'development' && (
          <Tooltip content={t('file.actions.reupload')}>
            <Button
              icon={<IconUpload />}
              theme="borderless"
              type="tertiary"
              onClick={() => onReupload(file)}
            />
          </Tooltip>
        )}
        <Tooltip content={t('file.actions.download')}>
          <Button
            icon={<IconDownload />}
            theme="borderless"
            type="tertiary"
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
              icon={<IconDeleteStroked />}
              theme="borderless"
              type="tertiary"
              style={{
                color: canDelete
                  ? 'var(--semi-color-danger)'
                  : 'var(--semi-color-text-2)',
              }}
              disabled={!canDelete}
              onClick={handleDelete}
            />
          </Tooltip>
        )}

        <div className="file-detail-drawer-header-divider" />

        {/* 系统按钮 */}
        <Tooltip content={isFullscreen ? t('common.exitFullscreen') : t('common.fullscreen')}>
          <Button
            icon={isFullscreen ? <IconMinimize /> : <IconMaximize />}
            theme="borderless"
            type="tertiary"
            onClick={toggleFullscreen}
          />
        </Tooltip>
        <Tooltip content={t('common.close')}>
          <Button
            icon={<IconClose />}
            theme="borderless"
            type="tertiary"
            onClick={handleClose}
          />
        </Tooltip>
      </div>
    </div>
  );

  return (
    <SideSheet
      visible={visible}
      onCancel={handleClose}
      placement="right"
      width={isFullscreen ? '100%' : drawerWidth}
      closable={false}
      mask={false}
      headerStyle={{ display: 'none' }}
      bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
      style={{
        borderRadius: isFullscreen ? 0 : '8px 0 0 8px',
        margin: isFullscreen ? 0 : 8,
        height: isFullscreen ? '100%' : 'calc(100% - 16px)',
      }}
    >
      {renderHeader()}

      <div className="file-detail-drawer-content">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="file-detail-drawer-tabs"
        >
          <TabPane tab={t('file.detail.tabs.basicInfo')} itemKey="basic">
            <div className="file-detail-drawer-tab-content">
              {/* 基本信息 */}
              <div className="file-detail-drawer-section">
                <div className="file-detail-drawer-section-title">
                  {t('file.detail.basicInfo')}
                </div>
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
                    {file.environment}
                  </Descriptions.Item>
                  <Descriptions.Item itemKey={t('common.description')}>
                    {file.description || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>

              {/* 系统信息 */}
              <div className="file-detail-drawer-section">
                <div className="file-detail-drawer-section-title">
                  {t('file.detail.systemInfo')}
                </div>
                <Descriptions align="left">
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
            </div>
          </TabPane>

          <TabPane tab={t('file.detail.tabs.dependencies')} itemKey="dependencies">
            <div className="file-detail-drawer-tab-content">
              <div className="file-detail-drawer-section">
                <div className="file-detail-drawer-section-title">
                  <IconLink />
                  {t('file.detail.dependentProcesses')}
                </div>
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
                    <IconLink className="file-detail-drawer-empty-icon" />
                    <Text type="tertiary">{t('file.detail.noDependencies')}</Text>
                  </div>
                )}
              </div>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </SideSheet>
  );
};

export default FileDetailDrawer;
