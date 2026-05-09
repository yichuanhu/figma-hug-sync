import { useMemo, useRef, useState } from 'react';
import { Modal, Form, Toast, Typography } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { useTranslation } from 'react-i18next';
import { getAllMockProcesses } from '@/components/ProcessManagement/ProcessManagementContent';
import type { LYProcessResponse } from '@/api';
import type { Asset } from '@/pages/Sharing/Market/types';
import { getAll, publishWorkflowToShare } from '../../store';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  /** 发布成功回调，参数为新资产 id */
  onSuccess: (assetId: string) => void;
}

interface FormValues {
  processId?: string;
  note?: string;
}

const PublishWorkflowModal = ({ visible, onCancel, onSuccess }: Props) => {
  const { t } = useTranslation();
  const formRef = useRef<FormApi<FormValues>>();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  // 「调度中心」已发布的流程（status === 'PUBLISHED'）
  const candidates: LYProcessResponse[] = useMemo(
    () => getAllMockProcesses().filter((p) => p.status === 'PUBLISHED'),
    [visible],
  );

  // 已共享状态映射：originUrl 末段保存的 processId -> 状态
  const sharedStatusMap = useMemo(() => {
    const map = new Map<string, 'PENDING_APPROVAL' | 'PUBLISHED'>();
    getAll().forEach((a) => {
      const srcId = a.originUrl?.split('/').pop();
      if (!srcId || a.type !== 'WORKFLOW') return;
      if (a.shareStatus === 'PUBLISHED') map.set(srcId, 'PUBLISHED');
      else if (a.shareStatus === 'PENDING_APPROVAL' && map.get(srcId) !== 'PUBLISHED') {
        map.set(srcId, 'PENDING_APPROVAL');
      }
    });
    return map;
  }, [visible]);

  const selected = candidates.find((c) => c.id === selectedId);
  const selectedVersion = selected?.current_version_id
    ? `v${(selected.current_version_id.match(/\d/g) || ['1']).slice(0, 1).join('')}.0.0`
    : 'v1.0.0';

  const optionList = candidates.map((p) => {
    const shared = sharedStatusMap.get(p.id);
    const suffix = shared
      ? ` · ${t(shared === 'PUBLISHED' ? 'publishToSharing.alreadyPublished' : 'publishToSharing.alreadyPending')}`
      : '';
    return { value: p.id, label: `${p.name}${suffix}` };
  });

  const handleAfterClose = () => {
    formRef.current?.reset();
    setSelectedId(undefined);
    setSubmitting(false);
  };

  const handleOk = async () => {
    try {
      const values = await formRef.current!.validate();
      const source = candidates.find((c) => c.id === values.processId);
      if (!source) return;
      setSubmitting(true);
      // 适配为 Asset 入参（来源：调度中心已发布流程）
      const adapted: Asset = {
        id: source.id,
        name: source.name,
        type: 'WORKFLOW',
        source: 'DEV_CENTER',
        status: 'PUBLISHED',
        description: source.description ?? '',
        creatorName: source.creator_id,
        departmentName: source.owning_department_name ?? '',
        reuseCount: 0,
        tags: [],
        currentVersion: selectedVersion,
        currentVersionId: source.current_version_id ?? `${source.id}-v1`,
        createdAt: source.created_at,
        updatedAt: source.updated_at,
        workflow: { yaml: '', nodeCount: 0 },
        versions: [],
        reuseRecords: [],
      };
      const newId = publishWorkflowToShare(adapted, values.note ?? '');
      Toast.success(t('publishToSharing.successToast'));
      onSuccess(newId);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('publishToSharing.modalTitle')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      okText={t('publishToSharing.confirmBtn')}
      cancelText={t('common.cancel')}
      width={520}
      maskClosable={false}
      afterClose={handleAfterClose}
      className="publish-workflow-modal"
    >
      <Form<FormValues>
        getFormApi={(api) => { formRef.current = api; }}
        labelPosition="top"
        onValueChange={(v) => setSelectedId(v.processId)}
      >
        <Form.Select
          field="processId"
          label={t('publishToSharing.processLabel')}
          placeholder={t('publishToSharing.processPlaceholder')}
          optionList={optionList}
          rules={[{ required: true, message: t('publishToSharing.processRequired') }]}
          trigger={['blur', 'change']}
          filter
          style={{ width: '100%' }}
        />

        {selected && (
          <div className="pwf-readonly">
            <div className="pwf-readonly-row">
              <Text type="tertiary">{t('publishToSharing.versionLabel')}</Text>
              <Text strong>{selectedVersion}</Text>
            </div>
            <div className="pwf-readonly-row">
              <Text type="tertiary">{t('publishToSharing.deptLabel')}</Text>
              <Text strong>{selected.owning_department_name}</Text>
            </div>
          </div>
        )}

        <Form.TextArea
          field="note"
          label={t('publishToSharing.noteLabel')}
          placeholder={t('publishToSharing.notePlaceholder')}
          maxCount={200}
          maxLength={200}
          rows={4}
          rules={[
            { required: true, message: t('publishToSharing.noteRequired') },
            { min: 5, message: t('publishToSharing.noteMin') },
            { max: 200, message: t('publishToSharing.noteMax') },
          ]}
          trigger={['blur', 'change']}
        />
      </Form>
    </Modal>
  );
};

export default PublishWorkflowModal;
