import { useTranslation } from 'react-i18next';
import { Modal, Typography } from '@douyinfe/semi-ui';
import { IconAlertTriangle } from '@douyinfe/semi-icons';
import './WorkerDeleteModal.less';

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
  const { t } = useTranslation();

  if (!workerData) return null;

  // 模拟检查是否有未完成任务
  const hasPendingTasks = workerData.status === 'BUSY';

  return (
    <Modal
      title={
        <div className="worker-delete-modal-header">
          <IconAlertTriangle className="worker-delete-modal-icon" />
          <span>{t('worker.deleteModal.title')}</span>
        </div>
      }
      visible={visible}
      onCancel={onClose}
      onOk={hasPendingTasks ? undefined : onConfirm}
      okText={t('worker.deleteModal.confirmDelete')}
      cancelText={t('common.cancel')}
      okButtonProps={{ 
        type: 'danger',
        disabled: hasPendingTasks,
      }}
      width={420}
      centered
    >
      <div className="worker-delete-modal-content">
        {hasPendingTasks ? (
          <div className="worker-delete-modal-alert">
            <Text type="danger" strong className="worker-delete-modal-alert-title">
              {t('worker.deleteModal.cannotDelete')}
            </Text>
            <Text type="danger">
              {t('worker.deleteModal.hasPendingTasks')}
            </Text>
          </div>
        ) : (
          <>
            <Text className="worker-delete-modal-message">
              {t('worker.deleteModal.confirmMessage', { name: workerData.name })}
            </Text>
            <Text type="tertiary">
              {t('worker.deleteModal.deleteWarning')}
            </Text>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WorkerDeleteModal;
