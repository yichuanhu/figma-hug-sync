import { useTranslation } from 'react-i18next';
import { Descriptions, Button, Toast, Tooltip, Typography } from '@douyinfe/semi-ui';
import { Copy, Info } from 'lucide-react';
import { PLATFORM_VERSION } from '@/constants/platformVersion';
import './index.less';

const { Text } = Typography;

const SettingsContent = () => {
  const { t } = useTranslation();

  const handleCopyVersion = async () => {
    try {
      await navigator.clipboard.writeText(PLATFORM_VERSION.version);
      Toast.success(t('personalCenter.settings.version.copySuccess'));
    } catch {
      Toast.error(t('personalCenter.settings.version.copyError'));
    }
  };

  const versionData = [
    {
      key: t('personalCenter.settings.version.platformName'),
      value: <Text>{PLATFORM_VERSION.name}</Text>,
    },
    {
      key: t('personalCenter.settings.version.versionNumber'),
      value: (
        <div className="settings-version-row">
          <span className="settings-version-num">{PLATFORM_VERSION.version}</span>
          <Tooltip content={t('personalCenter.settings.version.copy')}>
            <Button
              icon={<Copy size={14} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              size="small"
              onClick={handleCopyVersion}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      key: t('personalCenter.settings.version.releaseDate'),
      value: <Text>{PLATFORM_VERSION.releaseDate}</Text>,
    },
  ];

  return (
    <div className="settings-content">
      <div className="settings-section">
        <div className="settings-section-title">
          <Info size={16} strokeWidth={2} />
          {t('personalCenter.settings.version.title')}
        </div>
        <Descriptions data={versionData} align="left" />
      </div>
    </div>
  );
};

export default SettingsContent;
