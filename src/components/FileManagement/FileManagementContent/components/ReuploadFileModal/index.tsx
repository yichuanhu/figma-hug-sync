import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Upload,
  Form,
  Button,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconUpload,
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
    }
  }, [t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
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
    try {
      // 模拟重新上传
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
    onClose();
  };

  return (
    <Modal
      title={t('file.reupload.title')}
      visible={visible}
      onCancel={handleClose}
      footer={null}
      width={520}
      closeOnEsc
      centered
      maskClosable={false}
      className="reupload-file-modal"
    >
      {/* 当前文件信息提示 */}
      <div className="reupload-file-modal-info-banner">
        <IconInfoCircle className="reupload-file-modal-info-banner-icon" />
        <div className="reupload-file-modal-info-banner-content">
          <Text type="secondary">
            {t('file.reupload.currentFile')}:
          </Text>
          <Text className="file-name"> {file?.name}</Text>
        </div>
      </div>

      {!selectedFile ? (
        <div className="reupload-file-modal-upload-area">
          <Upload
            draggable
            action=""
            accept="*/*"
            limit={1}
            showUploadList={false}
            beforeUpload={() => false}
            onChange={handleFileChange}
          >
            <div className="upload-drag-content">
              <IconUpload size="extra-large" />
              <Text>{t('file.upload.dragText')}</Text>
              <Text type="tertiary" size="small">
                {t('file.upload.dragSubText')}
              </Text>
            </div>
          </Upload>
        </div>
      ) : (
        <div className="reupload-file-modal-file-info">
          <IconFile className="reupload-file-modal-file-info-icon" />
          <div className="reupload-file-modal-file-info-detail">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-size">{formatFileSize(selectedFile.size)}</div>
          </div>
          <IconClose
            className="reupload-file-modal-file-info-remove"
            onClick={handleRemoveFile}
          />
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

      <div className="reupload-file-modal-footer">
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
        <Button
          type="primary"
          loading={submitting}
          disabled={!selectedFile || !changeReason.trim()}
          onClick={handleSubmit}
        >
          {t('file.reupload.confirm')}
        </Button>
      </div>
    </Modal>
  );
};

export default ReuploadFileModal;
