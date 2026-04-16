import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Upload, Button, Toast, Banner, Notification } from '@douyinfe/semi-ui';
import { AlertCircle, File as FileIcon, Inbox, X } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import type { LYProcessResponse, LYProcessDependency } from '@/api';
import './index.less';

interface UploadVersionModalProps {
  visible: boolean;
  onCancel: () => void;
  processData: LYProcessResponse | null;
  onSuccess?: (newDeps?: LYProcessDependency[]) => void;
  onGoToDependencies?: () => void;
}

const UploadVersionModal = ({ visible, onCancel, processData, onSuccess, onGoToDependencies }: UploadVersionModalProps) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const goToDepsRef = useRef(onGoToDependencies);
  useEffect(() => { goToDepsRef.current = onGoToDependencies; }, [onGoToDependencies]);
  const [showNameMismatchWarning, setShowNameMismatchWarning] = useState(false);

  const handleFileChange = useCallback(
    (info: { fileList: FileItem[] }) => {
      const files = info.fileList;
      setFileList(files);

      // 检查文件名是否与流程名称一致
      if (files.length > 0 && files[0].fileInstance && processData) {
        const fileName = files[0].fileInstance.name.replace('.bot', '');
        const processName = processData.name;
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
    setUploading(true);
    try {
      // 模拟上传延迟
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模拟自动解析出新依赖（部分可能已失效）
      const existingIds = new Set((processData?.dependencies || []).map((d) => d.resource_id));
      const mockNewDeps: LYProcessDependency[] = [];
      const possibleNewDeps: LYProcessDependency[] = [
        {
          resource_id: `param-new-${Date.now()}-1`,
          resource_name: 'Retry Interval (ms)',
          resource_type: 'PARAMETER',
          source: 'AUTO_DETECTED',
          param_type: 'NUMBER',
          status: 'ACTIVE',
        },
        {
          resource_id: `param-new-${Date.now()}-2`,
          resource_name: 'Notification Endpoint',
          resource_type: 'PARAMETER',
          source: 'AUTO_DETECTED',
          param_type: 'TEXT',
          status: 'MISSING', // 模拟已失效的依赖
        },
        {
          resource_id: `cred-new-${Date.now()}-1`,
          resource_name: 'Redis_Cache_Auth',
          resource_type: 'CREDENTIAL',
          source: 'AUTO_DETECTED',
          status: 'MISSING',
        },
      ];
      possibleNewDeps.forEach((d) => {
        if (!existingIds.has(d.resource_id)) {
          mockNewDeps.push(d);
        }
      });

      Toast.success(t('development.processDevelopment.detail.uploadVersion.success'));

      // 统计失效依赖数量并用 Notification 提示
      const missingDeps = mockNewDeps.filter((d) => d.status === 'MISSING');
      if (missingDeps.length > 0) {
        const missingNames = missingDeps.map((d) => d.resource_name);
        const goHandler = goToDepsRef;
        Notification.warning({
          title: t('processDependency.uploadMissingWarningTitle'),
          content: (
            <div className="upload-missing-notification">
              <div className="upload-missing-notification-desc">
                {t('processDependency.uploadMissingWarning', { count: missingDeps.length })}
              </div>
              <div className="upload-missing-notification-names">
                {missingNames.map((name, i) => (
                  <span key={i} className="upload-missing-notification-name">• {name}</span>
                ))}
              </div>
              {goHandler.current && (
                <Button
                  size="small"
                  theme="light"
                  type="warning"
                  style={{ marginTop: 8 }}
                  onClick={() => {
                    goHandler.current?.();
                    Notification.destroyAll();
                  }}
                >
                  {t('processDependency.goHandle')}
                </Button>
              )}
            </div>
          ),
          duration: 0, // 不自动关闭，需要用户手动关闭
          position: 'top',
          theme: 'light',
        });
      } else if (mockNewDeps.length > 0) {
        Toast.info(t('processDependency.autoDetectedNew', { count: mockNewDeps.length }));
      }

      setFileList([]);
      setShowNameMismatchWarning(false);
      onSuccess?.(mockNewDeps.length > 0 ? mockNewDeps : undefined);
      onCancel();
    } catch (error) {
      Toast.error(t('development.processDevelopment.detail.uploadVersion.error'));
    } finally {
      setUploading(false);
    }
  }, [fileList, t, onSuccess, onCancel, processData, onGoToDependencies]);

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
    return { abort: () => {} };
  }, []);

  return (
    <Modal
      title={t('development.processDevelopment.detail.uploadVersion.title')}
      visible={visible}
      onCancel={handleClose}
      footer={
        <>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            theme="solid"
            type="primary"
            onClick={handleUpload}
            loading={uploading}
            disabled={fileList.length === 0}
          >
            {t('development.processDevelopment.detail.uploadVersion.upload')}
          </Button>
        </>
      }
      className="upload-version-modal"
      maskClosable={false}
    >
      <div className="upload-version-modal-content">
        {showNameMismatchWarning && (
          <Banner
            type="warning"
            icon={<AlertCircle size={16} strokeWidth={2} />}
            description={t('development.processDevelopment.detail.uploadVersion.nameMismatchWarning')}
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
          dragIcon={<Inbox size={36} strokeWidth={2} />}
          dragMainText={t('development.processDevelopment.detail.uploadVersion.dragText')}
          dragSubText={t('development.processDevelopment.detail.uploadVersion.dragSubText')}
          onChange={handleFileChange}
          onRemove={handleRemove}
          className="upload-version-modal-uploader"
        />
        {fileList.length > 0 && fileList[0].fileInstance && (
          <div className="upload-version-modal-file-info">
            <div className="file-info-left">
              <FileIcon size={16} strokeWidth={2} />
              <span className="file-name">{fileList[0].fileInstance.name}</span>
            </div>
            <Button
              icon={<X size={14} strokeWidth={2} />}
              type="tertiary"
              theme="borderless"
              size="small"
              onClick={() => { setFileList([]); setShowNameMismatchWarning(false); }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadVersionModal;
