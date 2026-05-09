import { useMemo, useRef, useState } from 'react';
import { Modal, Form, Toast, Typography } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { useTranslation } from 'react-i18next';
import { allAssets } from '@/pages/Sharing/Market/mockData';
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

  // 开发中心已发布的流程（DEV_CENTER + WORKFLOW + PUBLISHED）
  const candidates: Asset[] = useMemo(
    () => allAssets.filter((a) => a.type === 'WORKFLOW' && a.source === 'DEV_CENTER' && a.status === 'PUBLISHED'),
    [],
  );

  // 已共享状态映射：processId -> 状态
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

  const optionList = candidates.map((a) => {
    const shared = sharedStatusMap.get(a.id);
    const suffix = shared
      ? ` · ${t(shared === 'PUBLISHED' ? 'publishToSharing.alreadyPublished' : 'publishToSharing.alreadyPending')}`
      : '';
    return { value: a.id, label: `${a.name}${suffix}` };
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
      const newId = publishWorkflowToShare(source, values.note ?? '');
      Toast.success(t('sharing.publish.successToast'));
      onSuccess(newId);
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={t('sharing.publish.modalTitle')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitting}
      okText={t('sharing.publish.confirmBtn')}
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
          label={t('sharing.publish.processLabel')}
          placeholder={t('sharing.publish.processPlaceholder')}
          optionList={optionList}
          rules={[{ required: true, message: t('sharing.publish.processRequired') }]}
          trigger={['blur', 'change']}
          filter
          style={{ width: '100%' }}
        />

        {selected && (
          <div className="pwf-readonly">
            <div className="pwf-readonly-row">
              <Text type="tertiary">{t('sharing.publish.versionLabel')}</Text>
              <Text strong>{selected.currentVersion}</Text>
            </div>
            <div className="pwf-readonly-row">
              <Text type="tertiary">{t('sharing.publish.deptLabel')}</Text>
              <Text strong>{selected.departmentName}</Text>
            </div>
          </div>
        )}

        <Form.TextArea
          field="note"
          label={t('sharing.publish.noteLabel')}
          placeholder={t('sharing.publish.notePlaceholder')}
          maxCount={200}
          maxLength={200}
          rows={4}
          rules={[
            { required: true, message: t('sharing.publish.noteRequired') },
            { min: 5, message: t('sharing.publish.noteMin') },
            { max: 200, message: t('sharing.publish.noteMax') },
          ]}
          trigger={['blur', 'change']}
        />
      </Form>
    </Modal>
  );
};

export default PublishWorkflowModal;
