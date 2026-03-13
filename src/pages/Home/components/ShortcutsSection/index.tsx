import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Workflow, Bot, Play, ListStart } from 'lucide-react';
import { shortcuts } from '../../mockData';
import './index.less';

const iconMap: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  Workflow,
  Bot,
  Play,
  ListStart,
};

const ShortcutsSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="home-card shortcuts-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.shortcuts.title')}</span>
      </div>
      <div className="shortcuts-grid">
        {shortcuts.map((item) => {
          const IconComp = iconMap[item.icon];
          return (
            <div
              key={item.key}
              className="shortcut-card"
              onClick={() => item.path && navigate(item.path)}
            >
              <div className="shortcut-card-info">
                <div className="shortcut-card-title">{t(item.titleKey)}</div>
                <div className="shortcut-card-desc">{t(item.descKey)}</div>
              </div>
              <div
                className="shortcut-card-icon"
                style={{ backgroundColor: item.bgColor, color: item.color }}
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

export default ShortcutsSection;
