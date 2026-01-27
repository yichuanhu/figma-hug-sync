import { useState } from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { LYCreateWorkerGroupRequest } from '@/api';
import './index.less';

interface CreateWorkerGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateWorkerGroupModal: React.FC<CreateWorkerGroupModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);

  const handleSubmit = async () => {
    if (!formApi) return;
    
    try {
      const values = await formApi.validate();
      setLoading(true);
      
      const request: LYCreateWorkerGroupRequest = {
        name: values.name,
        description: values.description || null,
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('创建机器人组:', request);
      
      Toast.success(t('workerGroup.createModal.success'));
      formApi.reset();
      onCancel();
      onSuccess();
    } catch (error) {
      if (error !== 'validate failed') {
        Toast.error(t('workerGroup.createModal.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    formApi?.reset();
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      title={t('workerGroup.createModal.title')}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={t('common.create')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      className="create-worker-group-modal"
      centered
      width={520}
    >
      <div className="create-worker-group-modal-form">
        <Form 
          getFormApi={(api) => setFormApi(api)}
          labelPosition="top"
        >
          <Form.Input
            field="name"
            label={t('workerGroup.fields.name')}
            placeholder={t('workerGroup.fields.namePlaceholder')}
            rules={[
              { required: true, message: t('workerGroup.validation.nameRequired') },
              { max: 30, message: t('workerGroup.validation.nameLengthError') },
            ]}
            maxLength={30}
            showClear
          />
          
          <Form.TextArea
            field="description"
            label={t('common.description')}
            placeholder={t('workerGroup.fields.descriptionPlaceholder')}
            maxCount={2000}
            autosize={{ minRows: 3, maxRows: 6 }}
            rules={[
              { max: 2000, message: t('workerGroup.validation.descriptionLengthError') },
            ]}
          />
        </Form>
      </div>
    </Modal>
  );
};

export default CreateWorkerGroupModal;
