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
} from '@douyinfe/semi-icons';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';

import './index.less';

const { Text } = Typography;

// 最大文件大小 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface UploadFileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingFileNames: string[];
}

const UploadFileModal = ({
  visible,
  onClose,
  onSuccess,
  existingFileNames,
}: UploadFileModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = useCallback((info: { fileList: FileItem[] }) => {
    const file = info.fileList[0]?.fileInstance;
    if (file) {
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        Toast.error(t('file.validation.fileTooLarge'));
        return;
      }
      // 检查文件名是否重复
      if (existingFileNames.includes(file.name)) {
        Toast.error(t('file.validation.nameExists'));
        return;
      }
      setSelectedFile(file);
    }
  }, [existingFileNames, t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      Toast.error(t('file.validation.fileRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // 模拟上传
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Toast.success(t('file.upload.success'));
      onSuccess();
      handleClose();
    } catch {
      Toast.error(t('file.upload.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      title={t('file.upload.title')}
      visible={visible}
      onCancel={handleClose}
      footer={null}
      width={520}
      closeOnEsc
      centered
      maskClosable={false}
      className="upload-file-modal"
    >
      {!selectedFile ? (
        <div className="upload-file-modal-upload-area">
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
        <div className="upload-file-modal-file-info">
          <IconFile className="upload-file-modal-file-info-icon" />
          <div className="upload-file-modal-file-info-detail">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-size">{formatFileSize(selectedFile.size)}</div>
          </div>
          <IconClose
            className="upload-file-modal-file-info-remove"
            onClick={handleRemoveFile}
          />
        </div>
      )}

      <Form className="upload-file-modal-form" initValues={{ description: '' }}>
        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('file.fields.descriptionPlaceholder')}
          maxLength={500}
          rows={3}
        />
      </Form>

      <div className="upload-file-modal-footer">
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
        <Button
          type="primary"
          loading={submitting}
          disabled={!selectedFile}
          onClick={handleSubmit}
        >
          {t('file.upload.confirm')}
        </Button>
      </div>
    </Modal>
  );
};

export default UploadFileModal;
