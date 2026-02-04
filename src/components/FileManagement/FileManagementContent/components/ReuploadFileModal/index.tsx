import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Upload,
  Form,
  Button,
  Toast,
  Typography,
  Banner,
  Progress,
} from '@douyinfe/semi-ui';
import {
  IconInbox,
  IconFile,
  IconClose,
  IconInfoCircle,
} from '@douyinfe/semi-icons';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import type { LYFileResponse } from '@/api/index';

import './index.less';

const { Text } = Typography;

// 最大文件大小 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface ReuploadFileModalProps {
  visible: boolean;
  file: LYFileResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ReuploadFileModal = ({
  visible,
  file,
  onClose,
  onSuccess,
}: ReuploadFileModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [changeReason, setChangeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = useCallback((info: { fileList: FileItem[] }) => {
    const newFile = info.fileList[0]?.fileInstance;
    if (newFile) {
      // 检查文件大小
      if (newFile.size > MAX_FILE_SIZE) {
        Toast.error(t('file.validation.fileTooLarge'));
        return;
      }
      setSelectedFile(newFile);
      setUploadProgress(0);
    }
  }, [t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
  }, []);

  // 自定义上传，阻止自动上传
  const customRequest = useCallback(() => {
    return { abort: () => {} };
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      Toast.error(t('file.validation.fileRequired'));
      return;
    }
    if (!changeReason.trim()) {
      Toast.error(t('file.validation.changeReasonRequired'));
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);

      // 模拟重新上传
      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearInterval(progressInterval);
      setUploadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 300));
      Toast.success(t('file.reupload.success'));
      onSuccess();
      handleClose();
    } catch {
      Toast.error(t('file.reupload.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setChangeReason('');
    setUploadProgress(0);
    onClose();
  };

  return (
    <Modal
      title={t('file.reupload.title')}
      visible={visible}
      onCancel={handleClose}
      footer={
        <>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            theme="solid"
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!selectedFile || !changeReason.trim()}
          >
            {t('file.reupload.confirm')}
          </Button>
        </>
      }
      width={520}
      closeOnEsc
      centered
      maskClosable={false}
      className="reupload-file-modal"
    >
      <div className="reupload-file-modal-content">
        {/* 当前文件信息提示 */}
        <Banner
          type="info"
          icon={<IconInfoCircle />}
          description={
            <span>
              {t('file.reupload.currentFile')}:
              <Text strong style={{ marginLeft: 4 }}>{file?.name}</Text>
            </span>
          }
          className="reupload-file-modal-info-banner"
        />

        <Upload
          action=""
          customRequest={customRequest}
          accept="*/*"
          limit={1}
          draggable
          dragIcon={<IconInbox size="extra-large" style={{ color: 'var(--semi-color-text-2)' }} />}
          dragMainText={t('file.upload.dragText')}
          dragSubText={t('file.upload.dragSubText')}
          onChange={handleFileChange}
          className="reupload-file-modal-uploader"
        />

        {selectedFile && (
          <div className="reupload-file-modal-file-info">
            <IconFile style={{ color: 'var(--semi-color-text-2)', marginRight: 8, fontSize: 20 }} />
            <div className="reupload-file-modal-file-detail">
              <Text className="reupload-file-modal-file-name">{selectedFile.name}</Text>
              <Text type="tertiary" size="small">{formatFileSize(selectedFile.size)}</Text>
            </div>
            {!submitting && (
              <IconClose
                className="reupload-file-modal-file-remove"
                onClick={handleRemoveFile}
              />
            )}
          </div>
        )}

        {submitting && uploadProgress > 0 && (
          <div className="reupload-file-modal-progress">
            <Progress percent={Math.min(uploadProgress, 100)} showInfo />
          </div>
        )}

        <Form 
          className="reupload-file-modal-form" 
          initValues={{ changeReason: '' }}
          onValueChange={(values) => setChangeReason(values.changeReason || '')}
        >
          <Form.TextArea
            field="changeReason"
            label={t('file.fields.changeReason')}
            placeholder={t('file.fields.changeReasonPlaceholder')}
            maxLength={500}
            rows={3}
            rules={[{ required: true, message: t('file.validation.changeReasonRequired') }]}
          />
        </Form>
      </div>
    </Modal>
  );
};

export default ReuploadFileModal;
