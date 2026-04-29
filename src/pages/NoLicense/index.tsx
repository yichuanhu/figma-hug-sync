import { Button, Typography } from '@douyinfe/semi-ui';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import { useLicense } from '@/contexts/LicenseContext';
import './index.less';

const NoLicensePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { status, expireAt } = useLicense();

  const isExpired = status === 'expired';
  const title = t(isExpired ? 'noLicense.titleExpired' : 'noLicense.titleInvalid');
  const description = isExpired
    ? t('noLicense.descExpired', { date: expireAt || '-' })
    : t('noLicense.descInvalid');

  return (
    <div className="no-license-page">
      <EmptyState
        variant="noAccess"
        size={150}
        description=""
        footer={
          <div className="no-license-content">
            <Typography.Title heading={4} className="no-license-title">
              {title}
            </Typography.Title>
            <Typography.Text type="tertiary" className="no-license-desc">
              {description}
            </Typography.Text>
            <div className="no-license-actions">
              <Button
                theme="solid"
                type="primary"
                icon={<Home size={16} strokeWidth={2} />}
                onClick={() => navigate('/')}
              >
                {t('noLicense.goHome')}
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default NoLicensePage;
