import { useState, useEffect } from 'react';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
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
  const [formApi, setFormApi] = useState<any>(null);

  // 重置表单
  useEffect(() => {
    if (visible && formApi) {
      formApi.reset();
    }
  }, [visible, formApi]);

  const handleSubmit = async (values: { groupId: string }) => {
    if (!workerData) return;

    setLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const selectedGroup = mockWorkerGroups.find(g => g.id === values.groupId);
      const updatedWorker: LYWorkerResponse = {
        ...workerData,
        group_id: values.groupId,
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
      footer={null}
      className="add-to-group-modal"
      width={480}
    >
      <Form
        className="add-to-group-modal-form"
        labelPosition="top"
        getFormApi={setFormApi}
        onSubmit={handleSubmit}
      >
        <div className="add-to-group-modal-content">
          <div className="add-to-group-modal-worker-info">
            {t('worker.addToGroup.workerLabel')}: <strong>{workerData?.name}</strong>
          </div>
          
          <Form.Select
            field="groupId"
            label={t('worker.addToGroup.groupLabel')}
            placeholder={t('worker.addToGroup.groupPlaceholder')}
            style={{ width: '100%' }}
            optionList={mockWorkerGroups.map(g => ({
              label: g.name,
              value: g.id,
            }))}
            rules={[
              { required: true, message: t('worker.addToGroup.selectRequired') },
            ]}
          />
        </div>

        <div className="add-to-group-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddToGroupModal;
