import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Upload, Button, Toast, Banner } from '@douyinfe/semi-ui';
import { IconFile, IconInbox, IconAlertCircle, IconClose } from '@douyinfe/semi-icons';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import type { LYProcessResponse } from '@/api';
import './index.less';

interface UploadVersionModalProps {
  visible: boolean;
  onCancel: () => void;
  processData: LYProcessResponse | null;
  onSuccess?: () => void;
}

const UploadVersionModal = ({ visible, onCancel, processData, onSuccess }: UploadVersionModalProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [showNameMismatchWarning, setShowNameMismatchWarning] = useState(false);

  const handleFileChange = useCallback(
    (info: { fileList: FileItem[] }) => {
      const files = info.fileList;
      setFileList(files);

      // 检查文件名是否与流程名称一致
      if (files.length > 0 && files[0].fileInstance && processData) {
        const fileName = files[0].fileInstance.name.replace('.bot', '');
        const processName = processData.name;
        // 简单检查文件名是否包含流程名称
        if (!fileName.includes(processName) && !processName.includes(fileName.split('(')[0])) {
          setShowNameMismatchWarning(true);
        } else {
          setShowNameMismatchWarning(false);
        }
      }
    },
    [processData],
  );

  const handleRemove = useCallback(() => {
    setFileList([]);
    setShowNameMismatchWarning(false);
    return true;
  }, []);

  const handleUpload = useCallback(async () => {
    if (fileList.length === 0) {
      Toast.warning(t('development.processDevelopment.detail.uploadVersion.validation.fileRequired'));
      return;
    }

    setUploading(true);
    try {
      // 模拟上传延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Toast.success(t('development.processDevelopment.detail.uploadVersion.success'));
      setFileList([]);
      setShowNameMismatchWarning(false);
      onSuccess?.();
      onCancel();
    } catch (error) {
      Toast.error(t('development.processDevelopment.detail.uploadVersion.error'));
    } finally {
      setUploading(false);
    }
  }, [fileList, t, onSuccess, onCancel]);

  const handleClose = useCallback(() => {
    setFileList([]);
    setShowNameMismatchWarning(false);
    onCancel();
  }, [onCancel]);

  const handleDismissWarning = useCallback(() => {
    setShowNameMismatchWarning(false);
  }, []);

  // 自定义上传，阻止自动上传
  const customRequest = useCallback(() => {
    // 不做任何事，阻止自动上传
    return { abort: () => {} };
  }, []);

  return (
    <Modal
      title={t('development.processDevelopment.detail.uploadVersion.title')}
      visible={visible}
      onCancel={handleClose}
      footer={
        <>
          <Button
            theme="solid"
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
          >
            {t('development.processDevelopment.detail.uploadVersion.upload')}
          </Button>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
        </>
      }
      className="upload-version-modal"
      maskClosable={false}
    >
      <div className="upload-version-modal-content">
        {showNameMismatchWarning && (
          <Banner
            type="warning"
            icon={<IconAlertCircle />}
            description={t('development.processDevelopment.detail.uploadVersion.nameMismatchWarning')}
            closeIcon={<IconClose />}
            onClose={handleDismissWarning}
            className="upload-version-modal-warning"
          />
        )}
        <Upload
          action=""
          customRequest={customRequest}
          accept=".bot"
          limit={1}
          draggable
          dragIcon={<IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)' }} />}
          dragMainText={t('development.processDevelopment.detail.uploadVersion.dragText')}
          dragSubText={t('development.processDevelopment.detail.uploadVersion.dragSubText')}
          onChange={handleFileChange}
          onRemove={handleRemove}
          className="upload-version-modal-uploader"
        />
        {fileList.length > 0 && fileList[0].fileInstance && (
          <div className="upload-version-modal-file-info">
            <IconFile style={{ color: 'var(--semi-color-text-2)', marginRight: 8 }} />
            <span className="upload-version-modal-file-name">{fileList[0].fileInstance.name}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadVersionModal;
