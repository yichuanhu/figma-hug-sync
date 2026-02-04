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
  IconInbox,
  IconFile,
  IconClose,
  IconAlertCircle,
} from '@douyinfe/semi-icons';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import type { LYFileResponse } from '@/api/index';

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

interface ReuploadFileModalProps {
  visible: boolean;
  file: LYFileResponse | null;
  onClose: () => void;
  onSuccess: () => void;
  existingFileNames: string[];
}

const ReuploadFileModal = ({
  visible,
  file,
  onClose,
  onSuccess,
  existingFileNames,
}: ReuploadFileModalProps) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  // 弹窗打开时初始化显示名称
  useEffect(() => {
    if (visible && file) {
      setDisplayName(file.display_name);
      setDisplayNameError(null);
      setShowWarning(null);
    }
  }, [visible, file]);

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
    // 检查名称是否与其他文件重复（排除当前文件）
    const otherFileNames = existingFileNames.filter(n => n !== file?.display_name);
    if (otherFileNames.includes(name.trim())) {
      setDisplayNameError(t('file.validation.displayNameExists'));
      return false;
    }
    setDisplayNameError(null);
    return true;
  }, [existingFileNames, file?.display_name, t]);

  // 处理显示名称变化
  const handleDisplayNameChange = useCallback((value: string) => {
    setDisplayName(value);
    if (value.trim()) {
      const otherFileNames = existingFileNames.filter(n => n !== file?.display_name);
      if (otherFileNames.includes(value.trim())) {
        setDisplayNameError(t('file.validation.displayNameExists'));
      } else {
        setDisplayNameError(null);
      }
    }
  }, [existingFileNames, file?.display_name, t]);

  const handleFileChange = useCallback((info: { fileList: FileItem[] }) => {
    const newFile = info.fileList[0]?.fileInstance;
    if (newFile) {
      // 检查文件大小
      if (newFile.size > MAX_FILE_SIZE) {
        Toast.error(t('file.validation.fileTooLarge'));
        return;
      }

      // 检查文件扩展名
      const extValidation = validateFileExtension(newFile.name);
      if (!extValidation.valid) {
        Toast.error(extValidation.message);
        return;
      }

      // 检查文件名是否与原文件一致
      if (file && newFile.name !== file.original_name) {
        setShowWarning(t('file.reupload.fileNameMismatchWarning'));
      } else {
        setShowWarning(null);
      }

      setSelectedFile(newFile);
      setUploadProgress(0);
    }
  }, [file, t]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setShowWarning(null);
    setUploadProgress(0);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      Toast.error(t('file.validation.fileRequired'));
      return;
    }
    if (!validateDisplayName(displayName)) {
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
    setDisplayName('');
    setChangeReason('');
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
            disabled={!selectedFile || !displayName.trim() || !changeReason.trim()}
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
          icon={<IconAlertCircle />}
          description={
            <span>
              {t('file.reupload.currentFile')}: <strong>{file?.display_name}</strong>
              <span style={{ color: 'var(--semi-color-text-2)', marginLeft: 8 }}>({file?.original_name})</span>
            </span>
          }
          className="reupload-file-modal-info-banner"
        />

        {showWarning && (
          <Banner
            type="warning"
            icon={<IconAlertCircle />}
            description={showWarning}
            onClose={handleDismissWarning}
            className="reupload-file-modal-warning"
          />
        )}

        <Upload
          action=""
          customRequest={customRequest}
          accept={ALLOWED_EXTENSIONS.join(',')}
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

        {/* 文件名称输入框 */}
        <div className="reupload-file-modal-display-name">
          <div className="reupload-file-modal-display-name-label">
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
            <Text type="danger" size="small" className="reupload-file-modal-error">
              {displayNameError}
            </Text>
          )}
        </div>

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
