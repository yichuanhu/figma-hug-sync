import { Empty, Button } from '@douyinfe/semi-ui';
import { Home, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import noDataSvg from '@/assets/empty-state/no-data.png';
import noResultSvg from '@/assets/empty-state/no-result.png';
import errorSvg from '@/assets/empty-state/error.png';
import noAccessSvg from '@/assets/empty-state/no-access.png';
import maintenanceSvg from '@/assets/empty-state/maintenance.svg';
import notFoundSvg from '@/assets/empty-state/not-found.png';

import './index.less';

/**
 * 空状态变体类型
 */
export type EmptyStateVariant = 'noData' | 'noResult' | 'error' | 'noAccess' | 'maintenance' | 'notFound';

/**
 * 预设操作类型
 */
export type EmptyStateAction = 'retry' | 'goHome' | 'goBack';

interface EmptyStateProps {
  description: string;
  size?: number;
  className?: string;
  variant?: EmptyStateVariant;
  footer?: React.ReactNode;
  actions?: EmptyStateAction[];
  onRetry?: () => void;
}

const illustrationMap: Record<EmptyStateVariant, string> = {
  noData: noDataSvg,
  noResult: noResultSvg,
  error: errorSvg,
  noAccess: noAccessSvg,
  maintenance: maintenanceSvg,
  notFound: notFoundSvg,
};

const EmptyState = ({
  description,
  size = 150,
  className,
  variant = 'noData',
  footer,
  actions,
  onRetry,
}: EmptyStateProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const illustrationSrc = illustrationMap[variant];

  const renderActions = () => {
    if (!actions || actions.length === 0) return null;
    return (
      <div className="empty-state-actions">
        {actions.map((action) => {
          switch (action) {
            case 'retry':
              return (
                <Button
                  key="retry"
                  theme="solid"
                  type="primary"
                  icon={<RefreshCw size={16} strokeWidth={2} />}
                  onClick={onRetry}
                >
                  {t('emptyState.retry')}
                </Button>
              );
            case 'goHome':
              return (
                <Button
                  key="goHome"
                  theme="light"
                  type="primary"
                  icon={<Home size={16} strokeWidth={2} />}
                  onClick={() => navigate('/')}
                >
                  {t('emptyState.goHome')}
                </Button>
              );
            case 'goBack':
              return (
                <Button
                  key="goBack"
                  theme="borderless"
                  type="tertiary"
                  onClick={() => navigate(-1)}
                >
                  {t('emptyState.goBack')}
                </Button>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  return (
    <Empty
      className={className}
      image={
        <img
          src={illustrationSrc}
          alt={description}
          style={{ width: size, height: size }}
          className="empty-state-illustration"
        />
      }
      darkModeImage={
        <img
          src={illustrationSrc}
          alt={description}
          style={{ width: size, height: size }}
          className="empty-state-illustration"
        />
      }
      description={description}
    >
      {footer || renderActions()}
    </Empty>
  );
};

export default EmptyState;
