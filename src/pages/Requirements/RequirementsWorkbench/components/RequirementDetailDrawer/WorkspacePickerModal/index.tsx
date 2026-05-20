/**
 * WorkspacePickerModal — 待开发引导卡片中的工作空间选择弹窗
 * 复用 WorkspaceSelect，按需求所属部门过滤；提交时调用 linkRequirements。
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Toast, Typography } from '@douyinfe/semi-ui';
import WorkspaceSelect from '@/components/WorkspaceSelect';
import { linkRequirements } from '@/pages/Requirements/RequirementsProjects/mockData';
import type { Workspace } from '@/pages/Requirements/RequirementsProjects/types';

const { Text } = Typography;

interface Props {
  visible: boolean;
  requirementId: string;
  departmentId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const WorkspacePickerModal = ({
  visible,
  requirementId,
  departmentId,
  onClose,
  onSuccess,
}: Props) => {
  const { t } = useTranslation();
  const [workspaceId, setWorkspaceId] = useState<string | undefined>(undefined);
  const [workspace, setWorkspace] = useState<Workspace | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setWorkspaceId(undefined);
      setWorkspace(undefined);
    }
  }, [visible]);

  const handleOk = async () => {
    if (!workspaceId || !workspace) return;
    setSubmitting(true);
    try {
      await linkRequirements(workspaceId, [requirementId]);
      Toast.success(
        t('requirements.detail.pendingProject.linkSuccess', { name: workspace.name }),
      );
      onSuccess?.();
      onClose();
    } catch {
      Toast.error(t('common.operationFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('requirements.detail.pendingProject.modalTitle')}
      visible={visible}
      onCancel={onClose}
      onOk={handleOk}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      okButtonProps={{ disabled: !workspaceId, loading: submitting }}
      width={480}
      centered
      maskClosable={false}
    >
      <div style={{ paddingTop: 4 }}>
        <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
          {t('requirements.detail.pendingProject.modalTip')}
        </Text>
        <WorkspaceSelect
          value={workspaceId}
          onChange={(id, ws) => {
            setWorkspaceId(id);
            setWorkspace(ws);
          }}
          departmentId={departmentId}
          placeholder={t('requirements.detail.pendingProject.selectPlaceholder')}
        />
      </div>
    </Modal>
  );
};

export default WorkspacePickerModal;
