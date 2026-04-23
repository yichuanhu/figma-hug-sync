import { useTranslation } from 'react-i18next';
import { Bell, CheckSquare, Bot, Shield } from 'lucide-react';
import './index.less';

export interface NotificationStats {
  unread: number;
  task: number;
  robot: number;
  license: number;
}

interface Props {
  stats: NotificationStats;
}

const NotificationStatsCards = ({ stats }: Props) => {
  const { t } = useTranslation();

  const items = [
    { key: 'unread', label: t('notificationCenter.stats.unread'), value: stats.unread, Icon: Bell, iconColor: '#F54A45', bgColor: '#FFF7F7' },
    { key: 'task', label: t('notificationCenter.stats.task'), value: stats.task, Icon: CheckSquare, iconColor: '#3370FF', bgColor: '#F5F8FF' },
    { key: 'robot', label: t('notificationCenter.stats.robot'), value: stats.robot, Icon: Bot, iconColor: '#FF7D00', bgColor: '#FFF9F5' },
    { key: 'license', label: t('notificationCenter.stats.license'), value: stats.license, Icon: Shield, iconColor: '#7C3AED', bgColor: '#F8F5FF' },
  ];

  return (
    <div className="notification-stats-cards">
      {items.map(({ key, label, value, Icon, iconColor, bgColor }) => (
        <div key={key} className="notification-stat-card">
          <div className="notification-stat-card-icon" style={{ backgroundColor: bgColor, color: iconColor }}>
            <Icon size={20} strokeWidth={2} />
          </div>
          <div className="notification-stat-card-info">
            <div className="notification-stat-card-label">{label}</div>
            <div className="notification-stat-card-value">{value}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationStatsCards;
