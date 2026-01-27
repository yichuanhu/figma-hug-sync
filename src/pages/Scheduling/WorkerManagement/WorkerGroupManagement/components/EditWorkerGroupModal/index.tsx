import { useState, useEffect } from 'react';
import { Modal, Form, Toast } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { LYWorkerGroupResponse, LYUpdateWorkerGroupRequest } from '@/api';
import './index.less';

interface EditWorkerGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  groupData: LYWorkerGroupResponse | null;
  onSuccess: (updatedGroup: LYWorkerGroupResponse) => void;
}

const EditWorkerGroupModal: React.FC<EditWorkerGroupModalProps> = ({
  visible,
  onCancel,
  groupData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<any>(null);

  useEffect(() => {
    if (visible && groupData && formApi) {
      formApi.setValues({
        name: groupData.name,
        description: groupData.description || '',
      });
    }
  }, [visible, groupData, formApi]);

  const handleSubmit = async () => {
    if (!formApi || !groupData) return;
    
    try {
      const values = await formApi.validate();
      setLoading(true);
      
      const request: LYUpdateWorkerGroupRequest = {
        name: values.name,
        description: values.description || null,
      };

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('更新机器人组:', groupData.id, request);
      
      const updatedGroup: LYWorkerGroupResponse = {
        ...groupData,
        name: values.name,
        description: values.description || null,
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      
      Toast.success(t('workerGroup.editModal.success'));
      onCancel();
      onSuccess(updatedGroup);
    } catch (error) {
      if (error !== 'validate failed') {
        Toast.error(t('workerGroup.editModal.error'));
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
      title={t('workerGroup.editModal.title')}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      className="edit-worker-group-modal"
      centered
      width={520}
    >
      <div className="edit-worker-group-modal-form">
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

export default EditWorkerGroupModal;
