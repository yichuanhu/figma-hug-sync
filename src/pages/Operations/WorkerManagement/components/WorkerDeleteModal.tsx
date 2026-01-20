import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  if (!workerData) return null;

  // 模拟检查是否有未完成任务
  const hasPendingTasks = workerData.status === 'BUSY';

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <IconAlertTriangle style={{ color: 'var(--semi-color-danger)' }} />
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
      <div style={{ padding: '8px 0' }}>
        {hasPendingTasks ? (
          <div style={{ 
            backgroundColor: 'var(--semi-color-danger-light-default)',
            border: '1px solid var(--semi-color-danger)',
            borderRadius: 6,
            padding: 16,
          }}>
            <Text type="danger" strong style={{ display: 'block', marginBottom: 8 }}>
              {t('worker.deleteModal.cannotDelete')}
            </Text>
            <Text type="danger">
              {t('worker.deleteModal.hasPendingTasks')}
            </Text>
          </div>
        ) : (
          <>
            <Text style={{ display: 'block', marginBottom: 8 }}>
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
