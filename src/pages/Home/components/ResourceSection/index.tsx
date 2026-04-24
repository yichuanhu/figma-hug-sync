import { useTranslation } from 'react-i18next';
import { Telescope, BookOpen, FileCode, Download } from 'lucide-react';
import { resources } from '../../mockData';
import './index.less';

const iconMap: Record<string, React.ComponentType<any>> = {
  Telescope,
  BookOpen,
  FileCode,
  Download,
};

const ResourceSection = () => {
  const { t } = useTranslation();

  return (
    <div className="home-card resource-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.resources.title')}</span>
      </div>
      <div className="resource-list">
        {resources.map((item) => {
          const IconComp = iconMap[item.icon];
          return (
            <div key={item.id} className="resource-item" onClick={() => item.url && window.open(item.url, '_blank')}>
              <div className="resource-item-content">
                <div className="resource-item-title">{item.title}</div>
                {item.desc && <div className="resource-item-desc">{item.desc}</div>}
              </div>
              <div
                className="resource-item-icon"
                style={{ backgroundColor: item.iconBgColor, color: item.iconColor }}
              >
                {IconComp && <IconComp size={20} strokeWidth={2} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceSection;
