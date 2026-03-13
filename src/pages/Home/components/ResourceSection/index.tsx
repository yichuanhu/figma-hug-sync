import { useTranslation } from 'react-i18next';
import { Download, BookOpen, FileCode, ExternalLink } from 'lucide-react';
import { resources } from '../../mockData';
import './index.less';

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Download,
  BookOpen,
  FileCode,
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
              <div className="resource-item-icon">
                {IconComp && <IconComp size={16} strokeWidth={2} />}
              </div>
              <div className="resource-item-content">
                <div className="resource-item-title">{item.title}</div>
                <div className="resource-item-desc">{item.desc}</div>
              </div>
              <div className="resource-item-arrow">
                <ExternalLink size={14} strokeWidth={2} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResourceSection;
