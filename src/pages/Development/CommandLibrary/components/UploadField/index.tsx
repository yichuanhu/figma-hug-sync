import { Upload, Toast, Typography, Button, Tooltip } from '@douyinfe/semi-ui';
import type { FileItem, BeforeUploadProps, BeforeUploadObjectResult } from '@douyinfe/semi-ui/lib/es/upload';
import { Upload as UploadIcon, File as FileIcon, X, HelpCircle } from 'lucide-react';
import './index.less';

const { Text } = Typography;

export const MAX_SIZE = 100 * 1024 * 1024;

export const formatSize = (size?: number) => {
  if (!size) return '-';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

export interface UploadFieldProps {
  label: string;
  tip: string;
  hint: string;
  accept: string;
  extension: string;
  file: FileItem | null;
  onChange: (file: FileItem | null) => void;
}

/** 命令库通用上传字段（标签 + 上传按钮 + 已选文件行） */
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
    <div className="command-upload-field">
      <div className="command-upload-field-label">
        <span className="command-upload-field-required">*</span>
        <Text>{label}</Text>
        <Tooltip content={tip} position="top">
          <HelpCircle size={14} strokeWidth={2} className="command-upload-field-help" />
        </Tooltip>
      </div>

      <div className="command-upload-field-control">
        <Upload
          action=""
          limit={1}
          accept={accept}
          fileList={file ? [file] : []}
          beforeUpload={beforeUpload}
          onChange={(info) => onChange(info.fileList[0] || null)}
          customRequest={({ onSuccess }) => onSuccess?.({}, undefined as never)}
          className="command-upload-field-upload"
        >
          <Button icon={<UploadIcon size={16} strokeWidth={2} />}>上传</Button>
        </Upload>
        <Text type="tertiary">{hint}</Text>
      </div>

      {file && (
        <div className="command-upload-field-file">
          <FileIcon size={16} strokeWidth={2} />
          <Text ellipsis={{ showTooltip: true }} className="command-upload-field-file-name">
            {file.name}
          </Text>
          <Text type="tertiary" size="small">
            {formatSize(file.fileInstance?.size)}
          </Text>
          <X size={16} strokeWidth={2} className="command-upload-field-file-remove" onClick={() => onChange(null)} />
        </div>
      )}
    </div>
  );
};

export default UploadField;
