import { useTranslation } from 'react-i18next';
import type { ResourceOverviewData } from '@/pages/Operations/types';
import './index.less';

interface ResourceOverviewProps {
  data: ResourceOverviewData;
}

const ResourceOverview = ({ data }: ResourceOverviewProps) => {
  const { t } = useTranslation();

  const formatMinutes = (minutes: number) => {
    if (minutes >= 60000) return `${(minutes / 60000).toFixed(1)}${t('operations.dashboard.tenThousandHours')}`;
    if (minutes >= 60) return `${(minutes / 60).toFixed(0)}${t('operations.dashboard.hours')}`;
    return `${minutes}${t('operations.dashboard.minutes')}`;
  };

  const items = [
    {
      key: 'interactive',
      label: t('operations.dashboard.interactiveRobot'),
      value: `${data.interactiveOnline}/${data.interactiveTotal}`,
      sub: t('operations.dashboard.onlineAuth'),
    },
    {
      key: 'unattended',
      label: t('operations.dashboard.unattendedRobot'),
      value: `${data.unattendedOnline}/${data.unattendedTotal}`,
      sub: t('operations.dashboard.onlineAuth'),
    },
    {
      key: 'todayTasks',
      label: t('operations.dashboard.todayTasks'),
      value: data.todayTasks.toLocaleString(),
      sub: t('operations.dashboard.count'),
    },
    {
      key: 'totalTasks',
      label: t('operations.dashboard.totalTasks'),
      value: data.totalTasks.toLocaleString(),
      sub: t('operations.dashboard.count'),
    },
    {
      key: 'todayRun',
      label: t('operations.dashboard.todayRuntime'),
      value: formatMinutes(data.todayRunMinutes),
      sub: '',
    },
    {
      key: 'totalRun',
      label: t('operations.dashboard.totalRuntime'),
      value: formatMinutes(data.totalRunMinutes),
      sub: '',
    },
  ];

  return (
    <div className="resource-overview">
      <div className="resource-overview-title">{t('operations.dashboard.resourceOverview')}</div>
      <div className="resource-overview-grid">
        {items.map((item) => (
          <div key={item.key} className="resource-overview-item">
            <div className="resource-overview-item-label">{item.label}</div>
            <div className="resource-overview-item-value">{item.value}</div>
            {item.sub && <div className="resource-overview-item-sub">{item.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceOverview;
