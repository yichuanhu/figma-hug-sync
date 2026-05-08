import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Radio, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

interface Props {
  visible: boolean;
  currentVersion: string; // e.g. "1.2.0" or "v1.2.0"
  isFirstVersion?: boolean;
  onSubmit: (data: { newVersion: string; changeLog: string }) => void;
  onCancel: () => void;
}

const parse = (v: string): [number, number, number] => {
  const m = v.replace(/^v/i, '').split('.').map((s) => parseInt(s, 10) || 0);
  return [m[0] || 0, m[1] || 0, m[2] || 0];
};

const SemVerDialog = ({ visible, currentVersion, isFirstVersion = false, onSubmit, onCancel }: Props) => {
  const { t } = useTranslation();
  const [bump, setBump] = useState<'patch' | 'minor' | 'major'>('patch');
  const [changeLog, setChangeLog] = useState('');

  useEffect(() => {
    if (visible) {
      setBump('patch');
      setChangeLog('');
    }
  }, [visible]);

  const nextVersion = useMemo(() => {
    if (isFirstVersion) return 'v1.0.0';
    const [maj, min, pat] = parse(currentVersion);
    if (bump === 'major') return `v${maj + 1}.0.0`;
    if (bump === 'minor') return `v${maj}.${min + 1}.0`;
    return `v${maj}.${min}.${pat + 1}`;
  }, [bump, currentVersion, isFirstVersion]);

  const handleOk = () => {
    if (changeLog.trim().length < 5) return;
    onSubmit({ newVersion: nextVersion, changeLog: changeLog.trim() });
  };

  return (
    <Modal
      title={t('sharing.semver.title')}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      width={520}
      maskClosable={false}
      okButtonProps={{ disabled: changeLog.trim().length < 5 }}
    >
      <div style={{ marginBottom: 16 }}>
        <Typography.Text type="tertiary">{t('sharing.semver.currentVersion')}: </Typography.Text>
        <Typography.Text strong>{isFirstVersion ? '—' : currentVersion}</Typography.Text>
        <span style={{ margin: '0 8px' }}>→</span>
        <Typography.Text type="success" strong>{nextVersion}</Typography.Text>
      </div>
      {!isFirstVersion && (
        <Form labelPosition="top" style={{ marginBottom: 8 }}>
          <Form.Slot label={t('sharing.semver.bumpType')}>
            <Radio.Group value={bump} onChange={(e) => setBump(e.target.value)}>
              <Radio value="patch">{t('sharing.semver.patch')}</Radio>
              <Radio value="minor">{t('sharing.semver.minor')}</Radio>
              <Radio value="major">{t('sharing.semver.major')}</Radio>
            </Radio.Group>
          </Form.Slot>
        </Form>
      )}
      <Form labelPosition="top">
        <Form.TextArea
          field="changeLog"
          label={t('sharing.semver.changeLog')}
          placeholder={t('sharing.semver.changeLogPlaceholder')}
          maxCount={200}
          maxLength={200}
          rows={4}
          value={changeLog}
          onChange={(v) => setChangeLog(v)}
          showClear
        />
      </Form>
    </Modal>
  );
};

export default SemVerDialog;
