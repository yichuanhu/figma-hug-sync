import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shortcuts } from '../../mockData';
import './index.less';

// Custom filled SVG icon components matching reference design
const ProcessIcon = () => (
  <div className="shortcut-icon-group">
    <svg className="shortcut-icon-bg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="6" width="28" height="36" rx="4" fill="#C5D0F6" />
    </svg>
    <svg className="shortcut-icon-fg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="12" y="2" width="32" height="40" rx="4" fill="#7B8FE8" />
      <rect x="18" y="10" width="14" height="3" rx="1.5" fill="#fff" />
      <rect x="18" y="17" width="20" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="18" y="24" width="16" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="18" y="31" width="10" height="3" rx="1.5" fill="#fff" opacity="0.4" />
    </svg>
  </div>
);

const RobotIcon = () => (
  <div className="shortcut-icon-group">
    <svg className="shortcut-icon-bg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="32" cy="32" r="14" fill="#F9C9D4" />
    </svg>
    <svg className="shortcut-icon-fg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="28" height="24" rx="6" fill="#E8739A" />
      <circle cx="17" cy="20" r="3" fill="#fff" />
      <circle cx="27" cy="20" r="3" fill="#fff" />
      <rect x="15" y="27" width="14" height="3" rx="1.5" fill="#fff" opacity="0.7" />
      <rect x="19" y="4" width="6" height="8" rx="3" fill="#E8739A" />
      <rect x="4" y="18" width="6" height="8" rx="3" fill="#F9C9D4" />
      <rect x="34" y="18" width="6" height="8" rx="3" fill="#F9C9D4" />
    </svg>
  </div>
);

const TaskIcon = () => (
  <div className="shortcut-icon-group">
    <svg className="shortcut-icon-bg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="8" y="10" width="24" height="32" rx="4" fill="#FFD6B0" />
    </svg>
    <svg className="shortcut-icon-fg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="14" y="4" width="28" height="36" rx="4" fill="#F5A25D" />
      <path d="M22 16 L26 20 L34 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="20" y="26" width="16" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="20" y="33" width="12" height="3" rx="1.5" fill="#fff" opacity="0.4" />
    </svg>
  </div>
);

const QueueIcon = () => (
  <div className="shortcut-icon-group">
    <svg className="shortcut-icon-bg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="6" y="12" width="26" height="30" rx="4" fill="#B8E6D4" />
    </svg>
    <svg className="shortcut-icon-fg" width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="14" y="4" width="28" height="36" rx="4" fill="#3CB77E" />
      <rect x="20" y="12" width="16" height="3" rx="1.5" fill="#fff" />
      <rect x="20" y="19" width="16" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="20" y="26" width="16" height="3" rx="1.5" fill="#fff" opacity="0.6" />
      <rect x="20" y="33" width="10" height="3" rx="1.5" fill="#fff" opacity="0.4" />
    </svg>
  </div>
);

const iconMap: Record<string, React.FC> = {
  Workflow: ProcessIcon,
  Bot: RobotIcon,
  Play: TaskIcon,
  ListStart: QueueIcon,
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
              style={{ backgroundColor: item.bgColor, borderColor: item.bgColor }}
              onClick={() => item.path && navigate(item.path)}
            >
              <div className="shortcut-card-info">
                <div className="shortcut-card-title">{t(item.titleKey)}</div>
                <div className="shortcut-card-desc">{t(item.descKey)}</div>
              </div>
              <div className="shortcut-card-icon">
                {IconComp && <IconComp />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShortcutsSection;
