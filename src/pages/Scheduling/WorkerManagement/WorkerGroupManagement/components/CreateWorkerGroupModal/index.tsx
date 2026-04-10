import { useState } from 'react';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import type { LYCreateWorkerGroupRequest } from '@/api';
import DepartmentSelect from '@/components/DepartmentSelect';
import { MOCK_CURRENT_USER } from '@/mocks/departmentData';
import AddMembersModal from '../AddMembersModal';
import './index.less';
import { Users } from 'lucide-react';

interface CreateWorkerGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// Create后generation's 组Info
interface CreatedGroupInfo {
  id: string;
  name: string;
}

const CreateWorkerGroupModal: React.FC<CreateWorkerGroupModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [owningDepartmentId, setOwningDepartmentId] = useState<string | undefined>(undefined);
  const [formApi, setFormApi] = useState<any>(null);
  
  // CreateSuccess后's 提示模态框
  const [promptVisible, setPromptVisible] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroupInfo | null>(null);
  
  // add成员模态框
  const [addMembersVisible, setAddMembersVisible] = useState(false);

  const handleSubmit = async () => {
    if (!formApi) return;
    
    try {
      const values = await formApi.validate();
      setLoading(true);
      
      const request: LYCreateWorkerGroupRequest = {
        name: values.name,
        description: values.description || null,
      };

      // 模拟API调use
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Creating bot group:', request);
      
      // 模拟BackCreate's 组ID
      const newGroupId = `GROUP-${Date.now()}`;
      
      Toast.success(t('workerGroup.createModal.success'));
      formApi.reset();
      
      // SaveCreate's 组Info, display提示模态框
      setCreatedGroup({ id: newGroupId, name: values.name });
      onCancel(); // Close create modal first
      setPromptVisible(true); // Show add members prompt
      
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

  // processingimmediatelyadd成员
  const handleAddNow = () => {
    setPromptVisible(false);
    setAddMembersVisible(true);
  };

  // processing稍后add
  const handleAddLater = () => {
    setPromptVisible(false);
    setCreatedGroup(null);
  };

  // add成员Success
  const handleAddMembersSuccess = () => {
    setAddMembersVisible(false);
    setCreatedGroup(null);
  };

  // Canceladd成员
  const handleAddMembersCancel = () => {
    setAddMembersVisible(false);
    setCreatedGroup(null);
  };

  return (
    <>
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
            
            <Form.Slot label={t('common.owningDepartment')}>
              <DepartmentSelect value={owningDepartmentId} onChange={setOwningDepartmentId} />
            </Form.Slot>
            <Form.Slot label={t('common.owner')}>
              <span>{MOCK_CURRENT_USER.name}</span>
            </Form.Slot>
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

      {/* CreateSuccess's  */}
      <Modal
        visible={promptVisible}
        title={t('workerGroup.createModal.addMembersPrompt.title')}
        onCancel={handleAddLater}
        footer={
          <div className="create-worker-group-modal-prompt-footer">
            <Button onClick={handleAddLater}>
              {t('workerGroup.createModal.addMembersPrompt.later')}
            </Button>
            <Button type="primary" theme="solid" icon={<Users size={16} strokeWidth={2} />} onClick={handleAddNow}>
              {t('workerGroup.createModal.addMembersPrompt.addNow')}
            </Button>
          </div>
        }
        className="create-worker-group-modal-prompt"
        centered
        width={420}
      >
        <div className="create-worker-group-modal-prompt-content">
          {t('workerGroup.createModal.addMembersPrompt.content')}
        </div>
      </Modal>

      {/*  */}
      {createdGroup && (
        <AddMembersModal
          visible={addMembersVisible}
          onCancel={handleAddMembersCancel}
          groupId={createdGroup.id}
          groupName={createdGroup.name}
          onSuccess={handleAddMembersSuccess}
        />
      )}
    </>
  );
};

export default CreateWorkerGroupModal;
