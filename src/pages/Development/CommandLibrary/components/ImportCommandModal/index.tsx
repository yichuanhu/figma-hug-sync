import { useState, useCallback } from 'react';
import { Modal } from '@douyinfe/semi-ui';
import type { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import UploadField, { formatSize } from '../UploadField';
import './index.less';

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
    if (!pkgFile) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    onSubmit({
      fileName: pkgFile.name || 'command.plg',
      fileSize: formatSize(pkgFile.fileInstance?.size),
      sourceFileName: sourceFile?.name || '',
      sourceFileSize: sourceFile ? formatSize(sourceFile.fileInstance?.size) : '-',
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
      okButtonProps={{ disabled: !pkgFile, loading }}
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
          required={false}
          file={sourceFile}
          onChange={setSourceFile}
        />
      </div>
    </Modal>
  );
};

export default ImportCommandModal;
