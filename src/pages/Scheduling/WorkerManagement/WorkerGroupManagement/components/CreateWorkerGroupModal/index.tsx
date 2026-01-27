import { useState } from 'react';
import { Modal, Form, Toast, Button } from '@douyinfe/semi-ui';
import { IconUserGroup } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import type { LYCreateWorkerGroupRequest } from '@/api';
import AddMembersModal from '../AddMembersModal';
import './index.less';

interface CreateWorkerGroupModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// 创建后生成的组信息
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
  const [formApi, setFormApi] = useState<any>(null);
  
  // 创建成功后的提示模态框
  const [promptVisible, setPromptVisible] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<CreatedGroupInfo | null>(null);
  
  // 添加成员模态框
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

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('创建机器人组:', request);
      
      // 模拟返回创建的组ID
      const newGroupId = `GROUP-${Date.now()}`;
      
      Toast.success(t('workerGroup.createModal.success'));
      formApi.reset();
      
      // 保存创建的组信息，显示提示模态框
      setCreatedGroup({ id: newGroupId, name: values.name });
      onCancel(); // 先关闭创建模态框
      setPromptVisible(true); // 显示添加成员提示
      
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

  // 处理立即添加成员
  const handleAddNow = () => {
    setPromptVisible(false);
    setAddMembersVisible(true);
  };

  // 处理稍后添加
  const handleAddLater = () => {
    setPromptVisible(false);
    setCreatedGroup(null);
  };

  // 添加成员成功
  const handleAddMembersSuccess = () => {
    setAddMembersVisible(false);
    setCreatedGroup(null);
  };

  // 取消添加成员
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

      {/* 创建成功后的提示模态框 */}
      <Modal
        visible={promptVisible}
        title={t('workerGroup.createModal.addMembersPrompt.title')}
        onCancel={handleAddLater}
        footer={
          <div className="create-worker-group-modal-prompt-footer">
            <Button onClick={handleAddLater}>
              {t('workerGroup.createModal.addMembersPrompt.later')}
            </Button>
            <Button type="primary" theme="solid" icon={<IconUserGroup />} onClick={handleAddNow}>
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

      {/* 添加成员模态框 */}
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
