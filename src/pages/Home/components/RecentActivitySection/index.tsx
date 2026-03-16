import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Play, Upload, Trash2, PenLine, ChevronUp, ChevronDown } from 'lucide-react';
import { recentActivities } from '../../mockData';
import './index.less';

const typeConfig: Record<string, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  create: { icon: PlusCircle, color: '#3370FF', bgColor: '#EEF3FF' },
  execute: { icon: Play, color: '#00B365', bgColor: '#E8F8F0' },
  publish: { icon: Upload, color: '#7C3AED', bgColor: '#F3EEFF' },
  delete: { icon: Trash2, color: '#F53F3F', bgColor: '#FFF0F0' },
  update: { icon: PenLine, color: '#FF7D00', bgColor: '#FFF3E8' },
};

const RecentActivitySection = () => {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`home-card activity-section ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.activity.title')}</span>
        <button
          className="activity-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
        >
          <span>{collapsed ? t('homepage.activity.expand') : t('homepage.activity.collapse')}</span>
          {collapsed ? <ChevronDown size={14} strokeWidth={2} /> : <ChevronUp size={14} strokeWidth={2} />}
        </button>
      </div>
      {!collapsed && (
        <div className="activity-list">
          {recentActivities.map((item) => {
            const config = typeConfig[item.type] || typeConfig.create;
            const IconComp = config.icon;
            return (
              <div key={item.id} className="activity-item">
                <div
                  className="activity-item-icon"
                  style={{ backgroundColor: config.bgColor, color: config.color }}
                >
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
      )}
    </div>
  );
};

export default RecentActivitySection;
