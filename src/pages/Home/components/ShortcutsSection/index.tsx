import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shortcuts } from '../../mockData';
import processIcon from '@/assets/shortcut-new-process.svg';
import robotIcon from '@/assets/shortcut-new-robot.svg';
import taskIcon from '@/assets/shortcut-create-task.svg';
import './index.less';

const iconMap: Record<string, string> = {
  Workflow: processIcon,
  Bot: robotIcon,
  Play: taskIcon,
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
              style={{ backgroundColor: item.bgColor, borderColor: item.borderColor || item.bgColor }}
              onClick={() => item.path && navigate(item.path)}
            >
              <div className="shortcut-card-info">
                <div className="shortcut-card-title">{t(item.titleKey)}</div>
                <div className="shortcut-card-desc">{t(item.descKey)}</div>
              </div>
              <div className="shortcut-card-icon">
                {iconMap[item.icon] && <img src={iconMap[item.icon]} alt="" width={56} height={56} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortcutsSection;
