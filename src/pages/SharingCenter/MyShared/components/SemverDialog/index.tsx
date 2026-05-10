import { useTranslation } from 'react-i18next';
import { Form, Modal, Radio, RadioGroup, TextArea } from '@douyinfe/semi-ui';
import { useEffect, useState } from 'react';
import { bumpVersion, type BumpType } from '@/pages/SharingCenter/MyShared/store';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onOk: (params: { bump?: BumpType; changeLog: string }) => void;
  currentVersion: string;
  isFirstRelease: boolean;
}

const SemverDialog = ({ visible, onCancel, onOk, currentVersion, isFirstRelease }: Props) => {
  const { t } = useTranslation();
  const [bump, setBump] = useState<BumpType>('patch');
  const [changeLog, setChangeLog] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (visible) { setBump('patch'); setChangeLog(''); setErr(''); }
  }, [visible]);

  const next = isFirstRelease ? 'v1.0.0' : bumpVersion(currentVersion, bump);

  const handleOk = () => {
    if (changeLog.trim().length < 5 || changeLog.trim().length > 200) {
      setErr(t('sharing.semver.changeLogPlaceholder'));
      return;
    }
    onOk({ bump: isFirstRelease ? undefined : bump, changeLog: changeLog.trim() });
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      title={isFirstRelease ? t('sharing.assetSupply.semver.firstTitle') : t('sharing.assetSupply.semver.title')}
      okText={t('common.confirm')}
      cancelText={t('common.cancel')}
      width={520}
      centered
    >
      <Form labelPosition="top" labelAlign="left">
        {!isFirstRelease ? (
          <>
            <div style={{ marginBottom: 12, color: 'var(--semi-color-text-2)', fontSize: 13 }}>
              {t('sharing.assetSupply.semver.currentToNext', { current: currentVersion, next })}
            </div>
            <Form.Slot label={t('sharing.assetSupply.semver.bumpType')}>
              <RadioGroup value={bump} onChange={(e) => setBump(e.target.value)} direction="vertical">
                <Radio value="patch">{t('sharing.assetSupply.semver.patch')}</Radio>
                <Radio value="minor">{t('sharing.assetSupply.semver.minor')}</Radio>
                <Radio value="major">{t('sharing.assetSupply.semver.major')}</Radio>
              </RadioGroup>
            </Form.Slot>
          </>
        ) : (
          <div style={{ marginBottom: 12, color: 'var(--semi-color-text-2)', fontSize: 13 }}>
            {t('sharing.assetSupply.semver.firstVersionHint')}
          </div>
        )}
        <Form.Slot label={t('sharing.assetSupply.semver.changeLog')}>
          <TextArea
            value={changeLog}
            onChange={(v) => { setChangeLog(v); setErr(''); }}
            placeholder={t('sharing.assetSupply.semver.changeLogPh')}
            maxCount={200}
            maxLength={200}
            rows={4}
            validateStatus={err ? 'error' : undefined}
          />
          {err && <div style={{ color: 'var(--semi-color-danger)', fontSize: 12 }}>{err}</div>}
        </Form.Slot>
      </Form>
    </Modal>
  );
};

export default SemverDialog;
