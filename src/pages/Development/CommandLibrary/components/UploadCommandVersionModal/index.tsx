import { useState, useCallback } from 'react';
import { Modal, Toast, Typography, Input } from '@douyinfe/semi-ui';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import UploadField, { formatSize } from '../UploadField';
import './index.less';

const { Text } = Typography;

export interface UploadCommandVersionPayload {
  version: string;
  note: string;
  fileName: string;
  fileSize: string;
  sourceFileName: string;
  sourceFileSize: string;
}

interface UploadCommandVersionModalProps {
  visible: boolean;
  commandName?: string;
  onCancel: () => void;
  onSuccess: (payload: UploadCommandVersionPayload) => void;
}

const UploadCommandVersionModal = ({ visible, commandName, onCancel, onSuccess }: UploadCommandVersionModalProps) => {
  const [pkgFile, setPkgFile] = useState<FileItem | null>(null);
  const [sourceFile, setSourceFile] = useState<FileItem | null>(null);
  const [version, setVersion] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = useCallback(() => {
    setPkgFile(null);
    setSourceFile(null);
    setVersion('');
    setNote('');
  }, []);

  const handleCancel = () => {
    reset();
    onCancel();
  };

  const handleOk = async () => {
    if (!version.trim()) {
      Toast.warning('请输入版本号');
      return;
    }
    if (!pkgFile || !sourceFile) return;
    setUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    onSuccess({
      version: version.trim(),
      note: note.trim(),
      fileName: pkgFile.name || 'command.plg',
      fileSize: formatSize(pkgFile.fileInstance?.size),
      sourceFileName: sourceFile.name || 'command_source.zip',
      sourceFileSize: formatSize(sourceFile.fileInstance?.size),
    });
    setUploading(false);
    reset();
    onCancel();
  };

  return (
    <Modal
      title="新增版本"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      okText="上传"
      cancelText="取消"
      okButtonProps={{ disabled: !version.trim() || !pkgFile || !sourceFile, loading: uploading }}
      width={520}
      centered
    >
      <div className="upload-command-version-modal">
        {commandName && <Text type="tertiary">命令库：{commandName}</Text>}

        <div className="upload-command-version-modal-field">
          <div className="upload-command-version-modal-label">
            <span className="upload-command-version-modal-required">*</span>
            <Text>版本号</Text>
          </div>
          <Input value={version} onChange={setVersion} placeholder="例如 1.2.0" maxLength={20} showClear />
        </div>

        <div className="upload-command-version-modal-field">
          <div className="upload-command-version-modal-label">
            <Text>更新说明</Text>
          </div>
          <Input value={note} onChange={setNote} placeholder="请输入更新说明" maxLength={200} showClear />
        </div>

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

export default UploadCommandVersionModal;
