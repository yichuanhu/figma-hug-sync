import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';

import './index.less';

interface CreateQueueModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateQueueModal = ({
  visible,
  onCancel,
  onSuccess,
}: CreateQueueModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  // 模拟已存在的队列名称
  const existingQueueNames = ['订单处理队列', '邮件发送队列', '数据同步队列'];

  const validateQueueNameUnique = (rule: unknown, value: string, callback: (error?: string) => void) => {
    if (value && existingQueueNames.includes(value.trim())) {
      callback(t('queue.validation.nameExists'));
      return false;
    }
    callback();
    return true;
  };

  const handleSubmit = async (values: {
    name: string;
    description?: string;
  }) => {
    setLoading(true);
    try {
      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('创建队列:', values);

      Toast.success(t('queue.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建队列失败:', error);
      Toast.error(t('queue.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      className="create-queue-modal"
      title={t('queue.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
    >
      <Form
        className="create-queue-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
      >
        <Form.Input
          field="name"
          label={t('queue.fields.name')}
          placeholder={t('queue.fields.namePlaceholder')}
          rules={[
            { required: true, message: t('queue.validation.nameRequired') },
            { max: 30, message: t('queue.validation.nameLengthError') },
            { validator: validateQueueNameUnique },
          ]}
          maxLength={30}
          showClear
        />

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('queue.fields.descriptionPlaceholder')}
          maxCount={2000}
          rows={3}
        />

        <div className="create-queue-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.create')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateQueueModal;
