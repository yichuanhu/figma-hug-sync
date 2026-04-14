import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import type { LYQueueResponse } from '@/api/index';
import DepartmentSelect from '@/components/DepartmentSelect';

import './index.less';

interface EditQueueModalProps {
  visible: boolean;
  queue: LYQueueResponse | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditQueueModal = ({
  visible,
  queue,
  onCancel,
  onSuccess,
}: EditQueueModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string | undefined>(queue?.owning_department_id || undefined);

  const handleSubmit = async (values: {
    description?: string;
  }) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('更新队列:', {
        queue_id: queue?.queue_id,
        ...values,
      });

      Toast.success(t('queue.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('更新队列失败:', error);
      Toast.error(t('queue.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const { Text } = Typography;

  return (
    <Modal
      className="edit-queue-modal"
      title={t('queue.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
    >
      <Form
        className="edit-queue-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
        initValues={{
          description: queue?.description || '',
        }}
        key={queue?.queue_id}
      >
        <Form.Input
          field="queue_name"
          label={t('queue.fields.name')}
          initValue={queue?.queue_name || ''}
          rules={[{ required: true, message: t('queue.validation.nameRequired') }]}
          trigger={['blur', 'change']}
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('queue.fields.descriptionPlaceholder')}
          maxCount={2000}
          rows={3}
        />

        <Form.Slot label={t('common.owningDepartment')}>
          <DepartmentSelect
            value={owningDepartmentId}
            onChange={setOwningDepartmentId}
          />
        </Form.Slot>

        <Form.Slot label={t('common.owner')}>
          <Form.Input field="__owner_readonly" noLabel initValue={queue?.owner_name || '-'} disabled style={{ width: '100%' }} />
        </Form.Slot>

        <div className="edit-queue-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.save')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditQueueModal;
