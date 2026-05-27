import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Modal,
  Upload,
  Form,
  Button,
  Toast,
  Typography,
  Select,
  RadioGroup,
  Radio,
  TextArea,
} from '@douyinfe/semi-ui';
import { File as FileIcon, Inbox, X } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';

import {
  PROCESS_DOCUMENT_TARGET_LABEL,
  PROCESS_DOCUMENT_TYPE_LABEL,
  createProcessDocument,
  getPublishRecordsByProcess,
  type ProcessDocumentTargetType,
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
  const [targetType, setTargetType] = useState<ProcessDocumentTargetType>('PROCESS');
  const [targetId, setTargetId] = useState<string>(processId);
  const [remark, setRemark] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const publishRecords = useMemo(() => getPublishRecordsByProcess(processId), [processId]);

  useEffect(() => {
    if (visible) {
      setDocumentType('DESIGN_DOC');
      setTargetType('PROCESS');
      setTargetId(processId);
      setRemark('');
      setSelectedFile(null);
      setSubmitting(false);
    }
  }, [visible, processId]);

  useEffect(() => {
    if (targetType === 'PROCESS') {
      setTargetId(processId);
    } else if (targetType === 'PROCESS_VERSION') {
      setTargetId(versions[0]?.id ?? '');
    } else {
      setTargetId(publishRecords[0]?.id ?? '');
    }
  }, [targetType, processId, versions, publishRecords]);

  const targetOptions = useMemo(() => {
    if (targetType === 'PROCESS') {
      return [{ value: processId, label: processName }];
    }
    if (targetType === 'PROCESS_VERSION') {
      return versions.map((v) => ({ value: v.id, label: v.version }));
    }
    return publishRecords.map((r) => ({ value: r.id, label: r.label }));
  }, [targetType, processId, processName, versions, publishRecords]);

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
    if (!targetId) {
      Toast.warning('请选择关联对象');
      return;
    }
    const targetLabel = targetOptions.find((o) => o.value === targetId)?.label ?? '';
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      createProcessDocument({
        process_id: processId,
        process_name: processName,
        target_type: targetType,
        target_id: targetId,
        target_label: targetLabel,
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
            disabled={!selectedFile || !targetId}
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

          <Form.Slot label={<span><Text type="danger">* </Text>关联层级</span>}>
            <RadioGroup
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as ProcessDocumentTargetType)}
            >
              {(Object.keys(PROCESS_DOCUMENT_TARGET_LABEL) as ProcessDocumentTargetType[]).map(
                (v) => (
                  <Radio key={v} value={v}>
                    {PROCESS_DOCUMENT_TARGET_LABEL[v]}
                  </Radio>
                ),
              )}
            </RadioGroup>
          </Form.Slot>

          <Form.Slot label={<span><Text type="danger">* </Text>关联对象</span>}>
            <Select
              value={targetId}
              onChange={(v) => setTargetId(v as string)}
              optionList={targetOptions}
              disabled={targetType === 'PROCESS' || targetOptions.length === 0}
              placeholder={targetOptions.length === 0 ? '暂无可选项' : '请选择'}
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
            <Input.TextArea
              value={remark}
              onChange={setRemark}
              placeholder="可选，最长 500 字符"
              maxLength={500}
              rows={3}
            />
          </Form.Slot>
        </Form>
      </div>
    </Modal>
  );
};

export default UploadDocumentModal;
