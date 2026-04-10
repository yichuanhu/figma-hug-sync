import { useState, useEffect, useCallback, useRef } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
  Toast,
  Modal,
} from '@douyinfe/semi-ui';
import { Download, Trash2 } from 'lucide-react';
import type { LYFileResponse, FileSource } from '@/api/index';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';

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
  dataList: LYFileResponse[];
  onClose: () => void;
  onNavigate: (file: LYFileResponse) => void;
  onDelete: (file: LYFileResponse) => void;
  initialTab?: string;
}

const FileDetailDrawer = ({
  visible,
  file,
  context,
  dataList,
  onClose,
  onNavigate,
  onDelete,
  initialTab = 'basic',
}: FileDetailDrawerProps) => {
  const { t } = useTranslation();

  const { canManage } = useCollaboratorPermission('FILE', file?.id);

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

  // 下载文件
  const handleDownload = useCallback(() => {
    if (file) {
      Toast.info(t('file.actions.downloading'));
      setTimeout(() => {
        Toast.success(t('file.actions.downloadSuccess'));
      }, 500);
    }
  }, [file, t]);

  // 删除检查
  const handleDelete = useCallback(() => {
    if (!file) return;
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

  if (!file) return null;

  const canDeleteFile = context === 'development' && !file.is_published;

  const extraActions = (
    <>
      <Tooltip content={t('file.actions.download')}>
        <Button icon={<Download size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={handleDownload} />
      </Tooltip>
    </>
  );

  const deleteAction = canDeleteFile ? (
    <Tooltip content={t('common.delete')}>
      <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} theme="borderless" type="tertiary" size="small" onClick={handleDelete} />
    </Tooltip>
  ) : null;

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={file.display_name}
      dataList={dataList}
      currentId={file.id}
      getId={(item) => item.id}
      onNavigate={onNavigate}
      extraActions={extraActions}
      deleteAction={deleteAction}
      collaboratorProps={{
        assetType: 'FILE',
        assetId: file.id,
        context,
        canManage,
      }}
      defaultWidth={900}
      minWidth={576}
      storageKey="file-detail-drawer-width"
      className="file-detail-drawer"
    >
      <div className="file-detail-drawer-content" style={{ padding: '16px 24px' }}>
        <div className="file-detail-drawer-section">
          <Text className="file-detail-drawer-section-title">{t('file.detail.basicInfo')}</Text>
          <Descriptions align="left">
            <Descriptions.Item itemKey={t('file.table.name')}>{file.display_name}</Descriptions.Item>
            <Descriptions.Item itemKey={t('file.table.source')}>
              <Tag color={sourceConfig[file.source].color}>{t(sourceConfig[file.source].i18nKey)}</Tag>
            </Descriptions.Item>
            {context === 'development' && (
              <Descriptions.Item itemKey={t('file.detail.publishStatus')}>
                <Tag color={file.is_published ? 'green' : 'grey'}>{file.is_published ? t('file.detail.published') : t('file.detail.unpublished')}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item itemKey={t('common.description')}><ExpandableText text={file.description} maxLines={3} /></Descriptions.Item>
            <Descriptions.Item itemKey={t('common.creator')}>
              {file.created_by_name ? <UserNameWithCard name={file.created_by_name} userId={file.created_by} department={file.created_by_department || undefined} role={file.created_by_role || undefined} email={file.created_by_email || undefined} /> : '-'}
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('common.createTime')}>{formatTime(file.created_at)}</Descriptions.Item>
            <Descriptions.Item itemKey={t('file.detail.updater')}>
              {file.updated_by_name ? <UserNameWithCard name={file.updated_by_name} userId={file.updated_by} /> : '-'}
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('common.updateTime')}>{formatTime(file.updated_at)}</Descriptions.Item>
            {file.change_reason && (
              <Descriptions.Item itemKey={t('file.fields.changeReason')}>{file.change_reason}</Descriptions.Item>
            )}
          </Descriptions>
        </div>
        <div className="file-detail-drawer-section">
          <Text className="file-detail-drawer-section-title">{t('file.detail.fileContent')}</Text>
          <Descriptions align="left">
            <Descriptions.Item itemKey={t('file.detail.originalName')}>{file.original_name}</Descriptions.Item>
            <Descriptions.Item itemKey={t('file.table.size')}>
              <span className="file-detail-drawer-mono">{formatFileSize(file.file_size)}</span>
            </Descriptions.Item>
            <Descriptions.Item itemKey={t('file.detail.mimeType')}>{file.mime_type || '-'}</Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default FileDetailDrawer;
