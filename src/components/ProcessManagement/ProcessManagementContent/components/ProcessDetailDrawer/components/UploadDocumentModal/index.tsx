import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  Upload,
  Form,
  Button,
  Toast,
  Typography,
  Select,
  TextArea,
} from '@douyinfe/semi-ui';
import { File as FileIcon, Inbox, X } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';

import {
  PROCESS_DOCUMENT_TYPE_LABEL,
  createProcessDocument,
  type ProcessDocumentType,
} from '@/mocks/processDocuments';

import './index.less';

const { Text } = Typography;

const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface VersionOption {
  id: string;
  version: string;
}

export interface UploadDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  processId: string;
  processName: string;
  versions: VersionOption[];
}

const documentTypeOptions = (Object.keys(PROCESS_DOCUMENT_TYPE_LABEL) as ProcessDocumentType[]).map(
  (v) => ({ value: v, label: PROCESS_DOCUMENT_TYPE_LABEL[v] }),
);

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UploadDocumentModal = ({
  visible,
  onClose,
  onSuccess,
  processId,
  processName,
  versions,
}: UploadDocumentModalProps) => {
  const [documentType, setDocumentType] = useState<ProcessDocumentType>('DESIGN_DOC');
  const [applicableVersionId, setApplicableVersionId] = useState<string | undefined>(undefined);
  const [remark, setRemark] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setDocumentType('DESIGN_DOC');
      setApplicableVersionId(undefined);
      setRemark('');
      setSelectedFile(null);
      setSubmitting(false);
    }
  }, [visible]);

  const versionOptions = versions.map((v) => ({ value: v.id, label: v.version }));

  const handleFileChange = useCallback((info: { fileList: FileItem[] }) => {
    const file = info.fileList[0]?.fileInstance;
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      Toast.error('文件大小不能超过 100MB');
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const customRequest = useCallback(() => ({ abort: () => {} }), []);

  const handleSubmit = async () => {
    if (!selectedFile) {
      Toast.warning('请选择要上传的文件');
      return;
    }
    const versionLabel = versions.find((v) => v.id === applicableVersionId)?.version;
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      createProcessDocument({
        process_id: processId,
        process_name: processName,
        applicable_version_id: applicableVersionId || undefined,
        applicable_version_label: versionLabel,
        document_type: documentType,
        file: selectedFile,
        remark: remark.trim() || undefined,
      });
      Toast.success('资料上传成功');
      onSuccess();
      onClose();
    } catch {
      Toast.error('上传失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="上传资料"
      visible={visible}
      onCancel={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            theme="solid"
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            disabled={!selectedFile}
          >
            确定
          </Button>
        </>
      }
      width={520}
      closeOnEsc
      centered
      maskClosable={false}
      className="upload-document-modal"
    >
      <div className="upload-document-modal-content">
        <Form labelPosition="top" className="upload-document-modal-form">
          <Form.Slot label={<span><Text type="danger">* </Text>资料类型</span>}>
            <Select
              value={documentType}
              onChange={(v) => setDocumentType(v as ProcessDocumentType)}
              optionList={documentTypeOptions}
              style={{ width: '100%' }}
            />
          </Form.Slot>

          <Form.Slot label="适用版本">
            <Select
              value={applicableVersionId}
              onChange={(v) => setApplicableVersionId(v as string | undefined)}
              optionList={versionOptions}
              placeholder="不指定则归档到流程级"
              showClear
              style={{ width: '100%' }}
            />
          </Form.Slot>

          <Form.Slot label={<span><Text type="danger">* </Text>文件</span>}>
            <Upload
              action=""
              customRequest={customRequest}
              limit={1}
              draggable
              dragIcon={<Inbox size={36} strokeWidth={2} />}
              dragMainText="点击或拖拽文件到此处上传"
              dragSubText="单个文件最大 100MB"
              onChange={handleFileChange}
              onRemove={() => {
                handleRemoveFile();
                return true;
              }}
              showUploadList={false}
              className="upload-document-modal-uploader"
            />
            {selectedFile && (
              <div className="upload-document-modal-file-info">
                <div className="file-info-left">
                  <FileIcon size={16} strokeWidth={2} />
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">({formatSize(selectedFile.size)})</span>
                </div>
                <Button
                  icon={<X size={14} strokeWidth={2} />}
                  type="tertiary"
                  theme="borderless"
                  size="small"
                  onClick={handleRemoveFile}
                />
              </div>
            )}
          </Form.Slot>

          <Form.Slot label="备注">
            <TextArea
              value={remark}
              onChange={setRemark}
              placeholder="可选，最长 500 字符"
              maxCount={500}
              rows={3}
            />
          </Form.Slot>
        </Form>
      </div>
    </Modal>
  );
};

export default UploadDocumentModal;
