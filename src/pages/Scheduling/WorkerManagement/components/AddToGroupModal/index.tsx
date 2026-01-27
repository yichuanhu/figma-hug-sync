import { useState, useEffect } from 'react';
import { Modal, Select, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { LYWorkerResponse } from '@/api';
import './index.less';

// Mock机器人组数据
const mockWorkerGroups = [
  { id: 'group-001', name: '财务流程机器人组' },
  { id: 'group-002', name: '人事流程机器人组' },
  { id: 'group-003', name: '运维巡检机器人组' },
];

interface AddToGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  workerData: LYWorkerResponse | null;
  onSuccess: (updatedWorker: LYWorkerResponse) => void;
}

const AddToGroupModal = ({ visible, onCancel, workerData, onSuccess }: AddToGroupModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);

  // 重置表单
  useEffect(() => {
    if (visible) {
      setSelectedGroupId(undefined);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!selectedGroupId || !workerData) {
      Toast.warning(t('worker.addToGroup.selectRequired'));
      return;
    }

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const selectedGroup = mockWorkerGroups.find(g => g.id === selectedGroupId);
      const updatedWorker: LYWorkerResponse = {
        ...workerData,
        group_id: selectedGroupId,
        group_name: selectedGroup?.name || null,
      };
      
      onSuccess(updatedWorker);
      onCancel();
      Toast.success(t('worker.addToGroup.success'));
    } catch (error) {
      Toast.error(t('worker.addToGroup.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={t('worker.addToGroup.title')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      className="add-to-group-modal"
      width={480}
    >
      <div className="add-to-group-modal-content">
        <div className="add-to-group-modal-worker-info">
          {t('worker.addToGroup.workerLabel')}: <strong>{workerData?.name}</strong>
        </div>
        <div className="add-to-group-modal-field">
          <label className="add-to-group-modal-label">{t('worker.addToGroup.groupLabel')}</label>
          <Select
            placeholder={t('worker.addToGroup.groupPlaceholder')}
            value={selectedGroupId}
            onChange={(value) => setSelectedGroupId(value as string)}
            style={{ width: '100%' }}
            optionList={mockWorkerGroups.map(g => ({
              label: g.name,
              value: g.id,
            }))}
          />
        </div>
      </div>
    </Modal>
  );
};

export default AddToGroupModal;
