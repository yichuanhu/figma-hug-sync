import { Button, Typography } from '@douyinfe/semi-ui';
import { Home, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import { useLicense } from '@/contexts/LicenseContext';
import './index.less';

const handleResetLicense = () => {
  try {
    localStorage.removeItem('mock-license-status');
    localStorage.removeItem('mock-license-expire-at');
  } catch {
    // ignore
  }
  // 去掉 URL 上的 license/expireAt 参数后刷新，避免重新写入
  const url = new URL(window.location.href);
  url.searchParams.delete('license');
  url.searchParams.delete('expireAt');
  window.location.replace(url.pathname + url.search + url.hash);
};

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
              <Button
                theme="light"
                type="tertiary"
                icon={<RefreshCw size={16} strokeWidth={2} />}
                onClick={handleResetLicense}
              >
                重置授权状态（仅预览）
              </Button>
            </div>
          </div>
        }
      />
    </div>
  );
};

export default NoLicensePage;
