import { useMemo, useState } from 'react';
import { Modal, Form, TreeSelect, Input, TextArea, Checkbox, Toast, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  type ShareAsset,
  canPushNotification,
  recordPushNotification,
} from '@/pages/SharingCenter/MyShared/store';

const { Text } = Typography;

interface Props {
  visible: boolean;
  asset: ShareAsset | null;
  onCancel: () => void;
}

// 部门 mock 树（含人数估算）
const ORG_TREE = [
  {
    label: '研发中心', value: 'dept-rd', recipients: 124,
    children: [
      { label: '前端组', value: 'dept-rd-fe', recipients: 28 },
      { label: '后端组', value: 'dept-rd-be', recipients: 36 },
      { label: '测试组', value: 'dept-rd-qa', recipients: 22 },
      { label: '算法组', value: 'dept-rd-ai', recipients: 18 },
    ],
  },
  {
    label: '业务中心', value: 'dept-biz', recipients: 96,
    children: [
      { label: '财务部', value: 'dept-biz-fin', recipients: 24 },
      { label: '人事部', value: 'dept-biz-hr', recipients: 18 },
      { label: '运营部', value: 'dept-biz-ops', recipients: 30 },
    ],
  },
  {
    label: '客户成功中心', value: 'dept-cs', recipients: 64,
    children: [
      { label: '售前组', value: 'dept-cs-pre', recipients: 20 },
      { label: '实施组', value: 'dept-cs-impl', recipients: 26 },
    ],
  },
];

const flat = (() => {
  const out: Record<string, number> = {};
  ORG_TREE.forEach((g) => {
    out[g.value] = g.recipients;
    g.children?.forEach((c) => { out[c.value] = c.recipients; });
  });
  return out;
})();

const PushNotificationDialog = ({ visible, asset, onCancel }: Props) => {
  const { t } = useTranslation();
  const [scope, setScope] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isVersion, setIsVersion] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const recipients = useMemo(
    () => scope.reduce((sum, v) => sum + (flat[v] ?? 0), 0),
    [scope],
  );

  const reset = () => {
    setScope([]); setTitle(''); setBody(''); setIsVersion(false);
  };
  const handleCancel = () => { reset(); onCancel(); };

  const handleSubmit = () => {
    if (!asset) return;
    if (scope.length === 0) { Toast.warning(t('sharing.assetSupply.push.noTargetHint')); return; }
    if (title.trim().length < 10 || title.trim().length > 100) {
      Toast.warning(t('sharing.assetSupply.push.notificationTitlePh')); return;
    }
    if (body.trim().length < 10 || body.trim().length > 500) {
      Toast.warning(t('sharing.assetSupply.push.notificationBodyPh')); return;
    }
    const check = canPushNotification(asset.id, asset.currentVersionId);
    if (check.ok === false) {
      Toast.warning(t('sharing.assetSupply.toast.pushDuplicated', { hours: check.retryAfterHours }));
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      recordPushNotification(asset.id, asset.currentVersionId);
      Toast.success(t('sharing.assetSupply.toast.pushSent', { count: scope.length }));
      setSubmitting(false);
      reset(); onCancel();
    }, 400);
  };

  return (
    <Modal
      title={t('sharing.assetSupply.push.title')}
      visible={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText={t('sharing.assetSupply.push.send')}
      cancelText={t('sharing.assetSupply.push.cancel')}
      confirmLoading={submitting}
      width={520}
      centered
    >
      {asset && (
        <Form labelPosition="top">
          <Text type="tertiary" size="small" style={{ display: 'block', marginBottom: 12 }}>
            {asset.displayName || asset.name} · {asset.currentVersion}
          </Text>

          <Form.Slot label={t('sharing.assetSupply.push.scope')}>
            <TreeSelect
              value={scope}
              onChange={(v) => setScope((v as string[]) ?? [])}
              treeData={ORG_TREE}
              multiple
              filterTreeNode
              placeholder={t('sharing.assetSupply.push.scopePh')}
              style={{ width: '100%' }}
              maxTagCount={3}
            />
            <Text type="tertiary" size="small" style={{ marginTop: 4, display: 'block' }}>
              {t('sharing.assetSupply.push.selectedSummary', { count: scope.length, recipients })}
            </Text>
          </Form.Slot>

          <Form.Slot label={t('sharing.assetSupply.push.notificationTitle')}>
            <Input
              value={title}
              onChange={setTitle}
              placeholder={t('sharing.assetSupply.push.notificationTitlePh')}
              maxLength={100}
              showClear
            />
          </Form.Slot>

          <Form.Slot label={t('sharing.assetSupply.push.notificationBody')}>
            <TextArea
              value={body}
              onChange={setBody}
              placeholder={t('sharing.assetSupply.push.notificationBodyPh')}
              maxLength={500}
              autosize={{ minRows: 4, maxRows: 8 }}
            />
          </Form.Slot>

          <Checkbox checked={isVersion} onChange={(e) => setIsVersion(!!e.target.checked)}>
            {t('sharing.assetSupply.push.isVersionUpgrade')}
          </Checkbox>
          <Text type="tertiary" size="small" style={{ display: 'block', marginTop: 4 }}>
            {t('sharing.assetSupply.push.versionUpgradeHint')}
          </Text>
        </Form>
      )}
    </Modal>
  );
};

export default PushNotificationDialog;
