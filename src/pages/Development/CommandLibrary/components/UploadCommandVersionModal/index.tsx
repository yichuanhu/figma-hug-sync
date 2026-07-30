import { useState, useCallback } from 'react';
import { Modal, Upload, Toast, Typography, Input } from '@douyinfe/semi-ui';
import { Inbox, File as FileIcon, X } from 'lucide-react';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import './index.less';

const { Text } = Typography;

interface UploadCommandVersionModalProps {
  visible: boolean;
  commandName?: string;
  onCancel: () => void;
  onSuccess: (payload: { version: string; note: string; fileName: string; fileSize: string }) => void;
}

const UploadCommandVersionModal = ({ visible, commandName, onCancel, onSuccess }: UploadCommandVersionModalProps) => {
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [version, setVersion] = useState('');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = useCallback(() => {
    setFileList([]);
    setVersion('');
    setNote('');
  }, []);

  const handleOk = async () => {
    if (!version.trim()) {
      Toast.warning('请输入版本号');
      return;
    }
    if (fileList.length === 0) {
      Toast.warning('请上传命令包文件');
      return;
    }
    setUploading(true);
    await new Promise((r) => setTimeout(r, 600));
    const file = fileList[0];
    onSuccess({
      version: version.trim(),
      note: note.trim(),
      fileName: file.name || 'command.zip',
      fileSize: `${Math.max(1, Math.round((file.fileInstance?.size || 102400) / 1024))}KB`,
    });
    setUploading(false);
    reset();
    onCancel();
  };

  return (
    <Modal
      title="上传版本"
      visible={visible}
      onCancel={() => {
        reset();
        onCancel();
      }}
      onOk={handleOk}
      okText="上传"
      cancelText="取消"
      confirmLoading={uploading}
      width={520}
      centered
    >
      <div className="upload-command-version-modal">
        {commandName && <Text type="tertiary">命令：{commandName}</Text>}

        <div className="upload-command-version-modal-field">
          <Text className="upload-command-version-modal-label">版本号</Text>
          <Input value={version} onChange={setVersion} placeholder="例如 1.2.0" maxLength={20} showClear />
        </div>

        <div className="upload-command-version-modal-field">
          <Text className="upload-command-version-modal-label">版本说明</Text>
          <Input value={note} onChange={setNote} placeholder="请输入版本说明" maxLength={200} showClear />
        </div>

        <div className="upload-command-version-modal-field">
          <Text className="upload-command-version-modal-label">命令包</Text>
          <Upload
            action=""
            draggable
            limit={1}
            accept=".zip"
            fileList={fileList}
            onChange={(info) => setFileList(info.fileList)}
            customRequest={({ onSuccess: ok }) => ok?.({}, undefined as never)}
            className="upload-command-version-modal-upload"
          >
            <div className="upload-command-version-modal-dragger">
              <Inbox size={32} strokeWidth={1.5} />
              <Text>点击或拖拽文件到此处上传</Text>
              <Text type="tertiary" size="small">支持 .zip 格式，单个文件不超过 50MB</Text>
            </div>
          </Upload>

          {fileList.length > 0 && (
            <div className="upload-command-version-modal-file">
              <FileIcon size={16} strokeWidth={2} />
              <Text ellipsis={{ showTooltip: true }} className="upload-command-version-modal-file-name">
                {fileList[0].name}
              </Text>
              <X size={16} strokeWidth={2} className="upload-command-version-modal-file-remove" onClick={() => setFileList([])} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadCommandVersionModal;
