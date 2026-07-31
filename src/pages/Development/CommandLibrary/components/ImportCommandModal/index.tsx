import { useState, useCallback } from 'react';
import { Modal, Upload, Toast, Typography, Button, Tooltip } from '@douyinfe/semi-ui';
import type { FileItem, BeforeUploadProps, BeforeUploadObjectResult } from '@douyinfe/semi-ui/lib/es/upload';
import { Upload as UploadIcon, File as FileIcon, X, HelpCircle } from 'lucide-react';
import './index.less';

const { Text } = Typography;

const MAX_SIZE = 100 * 1024 * 1024;

export interface ImportCommandPayload {
  fileName: string;
  fileSize: string;
  sourceFileName: string;
  sourceFileSize: string;
}

interface ImportCommandModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (payload: ImportCommandPayload) => void;
}

const formatSize = (size?: number) => {
  if (!size) return '-';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

interface UploadFieldProps {
  label: string;
  tip: string;
  hint: string;
  accept: string;
  extension: string;
  file: FileItem | null;
  onChange: (file: FileItem | null) => void;
}

const UploadField = ({ label, tip, hint, accept, extension, file, onChange }: UploadFieldProps) => {
  const beforeUpload = ({ file: uploadFile }: BeforeUploadProps): BeforeUploadObjectResult => {
    const name = uploadFile.name || '';
    if (!name.toLowerCase().endsWith(extension)) {
      Toast.warning(`仅支持 ${extension} 格式文件`);
      return { status: 'validateFail', validateMessage: '格式不支持', shouldUpload: false };
    }
    if ((uploadFile.fileInstance?.size || 0) > MAX_SIZE) {
      Toast.warning('文件大小不能超过 100M');
      return { status: 'validateFail', validateMessage: '文件过大', shouldUpload: false };
    }
    return { status: 'success', shouldUpload: true };
  };

  return (
    <div className="import-command-modal-field">
      <div className="import-command-modal-field-label">
        <span className="import-command-modal-field-required">*</span>
        <Text>{label}</Text>
        <Tooltip content={tip} position="top">
          <HelpCircle size={14} strokeWidth={2} className="import-command-modal-field-help" />
        </Tooltip>
      </div>

      <div className="import-command-modal-field-control">
        <Upload
          action=""
          limit={1}
          accept={accept}
          fileList={file ? [file] : []}
          beforeUpload={beforeUpload}
          onChange={(info) => onChange(info.fileList[0] || null)}
          customRequest={({ onSuccess }) => onSuccess?.({}, undefined as never)}
          className="import-command-modal-upload"
        >
          <Button icon={<UploadIcon size={16} strokeWidth={2} />}>上传</Button>
        </Upload>
        <Text type="tertiary">{hint}</Text>
      </div>

      {file && (
        <div className="import-command-modal-file">
          <FileIcon size={16} strokeWidth={2} />
          <Text ellipsis={{ showTooltip: true }} className="import-command-modal-file-name">
            {file.name}
          </Text>
          <Text type="tertiary" size="small">
            {formatSize(file.fileInstance?.size)}
          </Text>
          <X
            size={16}
            strokeWidth={2}
            className="import-command-modal-file-remove"
            onClick={() => onChange(null)}
          />
        </div>
      )}
    </div>
  );
};

const ImportCommandModal = ({ visible, onCancel, onSubmit }: ImportCommandModalProps) => {
  const [pkgFile, setPkgFile] = useState<FileItem | null>(null);
  const [sourceFile, setSourceFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setPkgFile(null);
    setSourceFile(null);
  }, []);

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleOk = async () => {
    if (!pkgFile || !sourceFile) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    onSubmit({
      fileName: pkgFile.name || 'command.plg',
      fileSize: formatSize(pkgFile.fileInstance?.size),
      sourceFileName: sourceFile.name || 'command_source.zip',
      sourceFileSize: formatSize(sourceFile.fileInstance?.size),
    });
    setLoading(false);
    reset();
    onCancel();
  };

  return (
    <Modal
      title="导入命令库"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="导入"
      cancelText="取消"
      okButtonProps={{ disabled: !pkgFile || !sourceFile, loading }}
      width={520}
      centered
    >
      <div className="import-command-modal">
        <UploadField
          label="命令库文件"
          tip="命令库安装包，用于在机器人端安装并执行命令"
          hint="（仅支持.plg格式，不超过100M）"
          accept=".plg"
          extension=".plg"
          file={pkgFile}
          onChange={setPkgFile}
        />
        <UploadField
          label="命令库源码"
          tip="命令库源码压缩包，用于后续维护与二次开发"
          hint="（仅支持.zip格式，不超过100M）"
          accept=".zip"
          extension=".zip"
          file={sourceFile}
          onChange={setSourceFile}
        />
      </div>
    </Modal>
  );
};

export default ImportCommandModal;
