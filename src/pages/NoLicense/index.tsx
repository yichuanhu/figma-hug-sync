import { Button, Toast, Typography } from '@douyinfe/semi-ui';
import { RefreshCw, Mail, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import { useLicense } from '@/contexts/LicenseContext';
import './index.less';

const ADMIN_EMAIL = 'admin@laiye.com';

const NoLicensePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, expireAt, refresh } = useLicense();

  const isExpired = status === 'expired';
  const title = t(isExpired ? 'noLicense.titleExpired' : 'noLicense.titleInvalid');
  const description = isExpired
    ? t('noLicense.descExpired', { date: expireAt || '-' })
    : t('noLicense.descInvalid');

  const handleContact = async () => {
    try {
      await navigator.clipboard.writeText(ADMIN_EMAIL);
      Toast.success(t('noLicense.copySuccess'));
    } catch {
      Toast.info(ADMIN_EMAIL);
    }
  };

  return (
    <div className="no-license-page">
      <EmptyState
        variant="noAccess"
        size={180}
        description={
          <div className="no-license-text">
            <Typography.Title heading={4} className="no-license-title">
              {title}
            </Typography.Title>
            <Typography.Text type="tertiary" className="no-license-desc">
              {description}
            </Typography.Text>
          </div>
        }
        footer={
          <div className="no-license-actions">
            <Button
              theme="solid"
              type="primary"
              icon={<RefreshCw size={16} strokeWidth={2} />}
              onClick={refresh}
            >
              {t('noLicense.refresh')}
            </Button>
            <Button
              theme="light"
              type="primary"
              icon={<Mail size={16} strokeWidth={2} />}
              onClick={handleContact}
            >
              {t('noLicense.contactAdmin')}
            </Button>
            <Button
              theme="borderless"
              type="tertiary"
              icon={<Home size={16} strokeWidth={2} />}
              onClick={() => navigate('/')}
            >
              {t('noLicense.goHome')}
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default NoLicensePage;
