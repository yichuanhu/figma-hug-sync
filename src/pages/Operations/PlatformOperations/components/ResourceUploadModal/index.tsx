import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal, Form, Upload, Toast, Button,
} from '@douyinfe/semi-ui';
import { Inbox, File as FileIcon, X } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import { createResource, type ResourceType } from '../../mockData';
import './index.less';

const MAX_SIZE = 50 * 1024 * 1024;

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface FormValues {
  resourceName: string;
  resourceType: ResourceType;
  description?: string;
}

const ResourceUploadModal = ({ visible, onClose }: Props) => {
  const { t } = useTranslation();
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formApi, setFormApi] = useState<any>(null);

  useEffect(() => {
    if (!visible) {
      setFileList([]);
      setFileError(null);
    }
  }, [visible]);

  const handleFileChange = useCallback((info: { fileList: FileItem[] }) => {
    const last = info.fileList[info.fileList.length - 1];
    if (last?.fileInstance) {
      if (last.fileInstance.size > MAX_SIZE) {
        setFileError(t('operations.platformOperations.resources.validation.fileTooLarge'));
        setFileList([]);
        return;
      }
    }
    setFileError(null);
    setFileList(info.fileList.slice(-1));
  }, [t]);

  const file = fileList[0]?.fileInstance ?? null;

  const handleSubmit = (values: FormValues) => {
    if (!file) {
      setFileError(t('operations.platformOperations.resources.validation.fileRequired'));
      return;
    }
    createResource({
      resourceName: values.resourceName.trim(),
      fileName: file.name,
      fileSize: file.size,
      fileUrl: URL.createObjectURL(file),
      resourceType: values.resourceType,
      description: values.description?.trim(),
    });
    Toast.success(t('operations.platformOperations.resources.toast.uploaded'));
    onClose();
  };

  return (
    <Modal
      title={t('operations.platformOperations.resources.upload')}
      visible={visible}
      onCancel={onClose}
      onOk={() => formApi?.submitForm()}
      width={520}
      maskClosable={false}
      className="platform-ops-resource-upload-modal"
    >
      <Form<FormValues>
        initValues={{ resourceName: '', resourceType: '文档', description: '' }}
        onSubmit={handleSubmit}
        getFormApi={setFormApi}
        labelPosition="top"
      >
        <Form.Input
          field="resourceName"
          label={t('operations.platformOperations.resources.form.resourceName')}
          placeholder={t('operations.platformOperations.resources.form.resourceNamePlaceholder')}
          maxLength={200}
          showClear
          trigger={['blur', 'change']}
          rules={[{ required: true, message: t('operations.platformOperations.resources.validation.nameRequired') }]}
        />

        <Form.Slot label={t('operations.platformOperations.resources.form.file')}>
          {!file ? (
            <Upload
              action=""
              customRequest={() => ({ abort: () => {} })}
              limit={1}
              draggable
              dragIcon={<Inbox size={36} strokeWidth={2} />}
              dragMainText={t('operations.platformOperations.resources.form.file')}
              dragSubText={t('operations.platformOperations.resources.form.fileHint')}
              fileList={fileList}
              onChange={handleFileChange}
              showUploadList={false}
              className="resource-upload-uploader"
            />
          ) : (
            <div className="resource-upload-file-info">
              <div className="file-info-left">
                <FileIcon size={16} strokeWidth={2} />
                <span className="file-name">{file.name}</span>
              </div>
              <Button
                icon={<X size={14} strokeWidth={2} />}
                type="tertiary"
                theme="borderless"
                size="small"
                onClick={() => setFileList([])}
              />
            </div>
          )}
          {fileError && <div className="form-error-tip">{fileError}</div>}
        </Form.Slot>

        <Form.Select
          field="resourceType"
          label={t('operations.platformOperations.resources.form.resourceType')}
          style={{ width: '100%' }}
          optionList={[
            { label: t('operations.platformOperations.resources.types.installer'), value: '安装包' },
            { label: t('operations.platformOperations.resources.types.document'), value: '文档' },
            { label: t('operations.platformOperations.resources.types.other'), value: '其他' },
          ]}
        />
        <Form.TextArea
          field="description"
          label={t('operations.platformOperations.resources.form.description')}
          placeholder={t('operations.platformOperations.resources.form.descriptionPlaceholder')}
          rows={3}
          maxLength={500}
          maxCount={500}
        />
      </Form>
    </Modal>
  );
};

export default ResourceUploadModal;
