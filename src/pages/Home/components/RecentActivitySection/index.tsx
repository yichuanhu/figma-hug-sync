import { useTranslation } from 'react-i18next';
import { Workflow, Play, Upload, Trash2, PenLine } from 'lucide-react';
import { recentActivities } from '../../mockData';
import './index.less';

const typeIconMap: Record<string, React.ComponentType<any>> = {
  create: Workflow,
  execute: Play,
  publish: Upload,
  delete: Trash2,
  update: PenLine,
};

const RecentActivitySection = () => {
  const { t } = useTranslation();

  return (
    <div className="home-card activity-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.activity.title')}</span>
      </div>
      <div className="activity-list">
        {recentActivities.map((item) => {
          const IconComp = typeIconMap[item.type] || Workflow;
          return (
            <div key={item.id} className="activity-item">
              <div className="activity-item-icon">
                <IconComp size={14} strokeWidth={2} />
              </div>
              <div className="activity-item-content">
                <div className="activity-item-desc">
                  {item.description} <span className="activity-target">{item.target}</span>
                </div>
                <div className="activity-item-time">{item.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivitySection;
