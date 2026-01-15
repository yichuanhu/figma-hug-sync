import { useState } from 'react';
import { Modal, Typography, Button, Toast } from '@douyinfe/semi-ui';
import { IconCopy } from '@douyinfe/semi-icons';

const { Text } = Typography;

interface WorkerData {
  id: string;
  name: string;
  deviceToken: string;
}

interface WorkerKeyModalProps {
  visible: boolean;
  onClose: () => void;
  workerData: WorkerData | null;
}

const WorkerKeyModal = ({ visible, onClose, workerData }: WorkerKeyModalProps) => {
  const [copying, setCopying] = useState(false);

  if (!workerData) return null;

  const handleCopy = async () => {
    try {
      setCopying(true);
      await navigator.clipboard.writeText(workerData.deviceToken);
      Toast.success('密钥已复制到剪贴板');
    } catch (err) {
      Toast.error('复制失败，请手动复制');
    } finally {
      setCopying(false);
    }
  };

  return (
    <Modal
      title={`流程机器人密钥 - ${workerData.name}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={480}
      centered
    >
      <div style={{ padding: '16px 0' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          请妥善保管此密钥，用于机器人客户端连接平台时的身份验证。
        </Text>
        
        <div style={{ 
          backgroundColor: 'var(--semi-color-fill-0)',
          border: '1px solid var(--semi-color-border)',
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
          wordBreak: 'break-all',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          {workerData.deviceToken}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Button 
            icon={<IconCopy />} 
            theme="solid" 
            type="primary"
            onClick={handleCopy}
            loading={copying}
          >
            复制
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WorkerKeyModal;
