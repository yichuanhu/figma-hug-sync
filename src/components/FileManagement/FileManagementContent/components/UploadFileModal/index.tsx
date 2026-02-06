import { useState, useCallback, useEffect } from 'react';
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
  Input,
} from '@douyinfe/semi-ui';
import {
  IconAlertCircle,
} from '@douyinfe/semi-icons';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';

import './index.less';

const { Text } = Typography;

// 最大文件大小 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

// 文件后缀白名单
const ALLOWED_EXTENSIONS = [
  '.json', '.xml', '.yaml', '.yml', '.txt', '.csv',
  '.xlsx', '.xls', '.docx', '.doc', '.pdf',
  '.zip', '.rar', '.7z',
  '.py', '.js', '.ts', '.sh', '.bat',
  '.enc', '.key', '.pem',
  '.png', '.jpg', '.jpeg', '.gif', '.svg',
];

// 文件后缀黑名单（优先级高于白名单）
const BLOCKED_EXTENSIONS = [
  '.exe', '.dll', '.bat', '.cmd', '.com', '.msi',
  '.vbs', '.vbe', '.js', '.jse', '.wsf', '.wsh',
];

interface UploadFileModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingFileNames: string[];
  preSelectedFile?: File | null;
}

const UploadFileModal = ({
  visible,
  onClose,
  onSuccess,
  existingFileNames,
  preSelectedFile,
}: UploadFileModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  // 当弹窗打开时，如果有预选文件则设置
  useEffect(() => {
    if (visible && preSelectedFile) {
      // 检查文件大小
      if (preSelectedFile.size > MAX_FILE_SIZE) {
        Toast.error(t('file.validation.fileTooLarge'));
        onClose();
        return;
      }

      // 检查文件扩展名
      const extValidation = validateFileExtension(preSelectedFile.name);
      if (!extValidation.valid) {
        Toast.error(extValidation.message);
        onClose();
        return;
      }

      setSelectedFile(preSelectedFile);
      // 使用不含扩展名的原文件名作为默认显示名称
      const nameWithoutExt = preSelectedFile.name.replace(/\.[^/.]+$/, '');
      setDisplayName(nameWithoutExt);
      setUploadProgress(0);
      
      // 检查文件名是否重复
      if (existingFileNames.includes(nameWithoutExt)) {
        setShowWarning(t('file.validation.displayNameExistsWarning'));
      } else {
        setShowWarning(null);
      }
    }
  }, [visible, preSelectedFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.slice(lastDot).toLowerCase();
  };

  // 验证文件扩展名
  const validateFileExtension = (filename: string): { valid: boolean; message?: string } => {
    const ext = getFileExtension(filename);
    
    if (!ext) {
      return { valid: false, message: t('file.validation.noExtension') };
    }

    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { valid: false, message: t('file.validation.blockedExtension', { ext }) };
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return { valid: false, message: t('file.validation.notAllowedExtension', { ext }) };
    }

    return { valid: true };
  };

  // 验证显示名称
  const validateDisplayName = useCallback((name: string): boolean => {
    if (!name.trim()) {
      setDisplayNameError(t('file.validation.displayNameRequired'));
      return false;
    }
    if (name.length > 100) {
      setDisplayNameError(t('file.validation.displayNameTooLong'));
      return false;
    }
    if (existingFileNames.includes(name.trim())) {
      setDisplayNameError(t('file.validation.displayNameExists'));
      return false;
    }
    setDisplayNameError(null);
    return true;
  }, [existingFileNames, t]);

  // 处理显示名称变化
  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
    if (value.trim()) {
      if (existingFileNames.includes(value.trim())) {
        setShowWarning(t('file.validation.displayNameExistsWarning'));
      } else {
        setShowWarning(null);
      }
      setDisplayNameError(null);
    }
  }, [existingFileNames, t]);

  const handleFileChange = useCallback((info: { fileList: FileItem[] }) => {
    const file = info.fileList[0]?.fileInstance;
    if (file) {
      // 检查文件大小
      if (file.size > MAX_FILE_SIZE) {
        Toast.error(t('file.validation.fileTooLarge'));
        return;
      }

      // 检查文件扩展名
      const extValidation = validateFileExtension(file.name);
      if (!extValidation.valid) {
        Toast.error(extValidation.message);
        return;
      }

      setSelectedFile(file);
      // 使用不含扩展名的原文件名作为默认显示名称
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setDisplayName(nameWithoutExt);
      setUploadProgress(0);

      // 检查文件名是否重复
      if (existingFileNames.includes(nameWithoutExt)) {
        setShowWarning(t('file.validation.displayNameExistsWarning'));
      } else {
        setShowWarning(null);
      }
    }
  }, [existingFileNames, t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setDisplayName('');
    setShowWarning(null);
    setUploadProgress(0);
    setDisplayNameError(null);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      Toast.error(t('file.validation.fileRequired'));
      return;
    }

    if (!validateDisplayName(displayName)) {
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

      // 模拟上传
      await new Promise((resolve) => setTimeout(resolve, 1500));
      clearInterval(progressInterval);
      setUploadProgress(100);

      await new Promise((resolve) => setTimeout(resolve, 300));
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
    setDisplayName('');
    setDescription('');
    setShowWarning(null);
    setUploadProgress(0);
    setDisplayNameError(null);
    onClose();
  };

  const handleDismissWarning = useCallback(() => {
    setShowWarning(null);
  }, []);

  // 自定义上传，阻止自动上传
  const customRequest = useCallback(() => {
    return { abort: () => {} };
  }, []);

  return (
    <Modal
      title={t('file.upload.title')}
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
            disabled={!selectedFile || !displayName.trim()}
          >
            {t('file.upload.confirm')}
          </Button>
        </>
      }
      width={520}
      closeOnEsc
      centered
      maskClosable={false}
      className="upload-file-modal"
    >
      <div className="upload-file-modal-content">
        {showWarning && (
          <Banner
            type="warning"
            icon={<IconAlertCircle />}
            description={showWarning}
            onClose={handleDismissWarning}
            className="upload-file-modal-warning"
          />
        )}

        {/* 始终显示上传区域，允许重新选择文件 */}
        <Upload
          action=""
          customRequest={customRequest}
          accept={ALLOWED_EXTENSIONS.join(',')}
          limit={1}
          draggable
          dragMainText={t('file.upload.dragText')}
          dragSubText={t('file.upload.dragSubText')}
          onChange={handleFileChange}
          onRemove={() => { handleRemoveFile(); return true; }}
          className="upload-file-modal-uploader"
        />

        {submitting && uploadProgress > 0 && (
          <div className="upload-file-modal-progress">
            <Progress percent={Math.min(uploadProgress, 100)} showInfo />
          </div>
        )}

        {/* 文件名称输入框 */}
        {selectedFile && (
          <div className="upload-file-modal-display-name">
            <div className="upload-file-modal-display-name-label">
              <Text>{t('file.fields.displayName')}</Text>
              <Text type="danger"> *</Text>
            </div>
            <Input
              value={displayName}
              onChange={handleDisplayNameChange}
              placeholder={t('file.fields.displayNamePlaceholder')}
              maxLength={100}
              showClear
              validateStatus={displayNameError ? 'error' : undefined}
            />
            {displayNameError && (
              <Text type="danger" size="small" className="upload-file-modal-error">
                {displayNameError}
              </Text>
            )}
          </div>
        )}

        <Form className="upload-file-modal-form" initValues={{ description: '' }}>
          <Form.TextArea
            field="description"
            label={t('common.description')}
            placeholder={t('file.fields.descriptionPlaceholder')}
            maxLength={2000}
            rows={3}
          />
        </Form>
      </div>
    </Modal>
  );
};

export default UploadFileModal;
