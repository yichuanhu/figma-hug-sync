import { Modal, Typography } from '@douyinfe/semi-ui';
import { IconAlertTriangle } from '@douyinfe/semi-icons';

const { Text } = Typography;

interface WorkerData {
  id: string;
  name: string;
  status: string;
}

interface WorkerDeleteModalProps {
  visible: boolean;
  onClose: () => void;
  workerData: WorkerData | null;
  onConfirm: () => void;
}

const WorkerDeleteModal = ({ 
  visible, 
  onClose, 
  workerData, 
  onConfirm 
}: WorkerDeleteModalProps) => {
  if (!workerData) return null;

  // 模拟检查是否有未完成任务
  const hasPendingTasks = workerData.status === 'BUSY';

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertTriangle style={{ color: 'var(--semi-color-danger)' }} />
          <span>删除确认</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      onOk={hasPendingTasks ? undefined : onConfirm}
      okText="确认删除"
      cancelText="取消"
      okButtonProps={{ 
        type: 'danger',
        disabled: hasPendingTasks,
      }}
      width={420}
      centered
    >
      <div style={{ padding: '8px 0' }}>
        {hasPendingTasks ? (
          <div style={{ 
            backgroundColor: 'var(--semi-color-danger-light-default)',
            border: '1px solid var(--semi-color-danger)',
            borderRadius: 6,
            padding: 16,
          }}>
            <Text type="danger" strong style={{ display: 'block', marginBottom: 8 }}>
              无法删除流程机器人
            </Text>
            <Text type="danger">
              当前流程机器人有未完成任务，请等待任务完成或取消相关任务后再执行删除操作。
            </Text>
          </div>
        ) : (
          <>
            <Text style={{ display: 'block', marginBottom: 8 }}>
              确定要删除流程机器人 <Text strong>"{workerData.name}"</Text> 吗？
            </Text>
            <Text type="tertiary">
              删除后将无法恢复，该机器人将不再参与任务调度。如果该设备没有其他机器人关联，设备也将被一并删除。
            </Text>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WorkerDeleteModal;
