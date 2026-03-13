import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { shortcuts } from '../../mockData';
import './index.less';

// Shared glass filter definition
const GlassFilter = () => (
  <defs>
    <filter id="glass" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
      <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.6 0" result="glass" />
    </filter>
  </defs>
);

const ProcessIcon = () => (
  <div className="shortcut-icon-group">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <GlassFilter />
      <rect x="2" y="8" width="30" height="38" rx="6" fill="#A8B8F0" opacity="0.35" filter="url(#glass)" />
      <rect x="14" y="4" width="30" height="38" rx="6" fill="#7B8FE8" />
      <rect x="14" y="4" width="30" height="38" rx="6" fill="rgba(255,255,255,0.12)" />
      <rect x="20" y="13" width="14" height="2.5" rx="1.25" fill="#fff" />
      <rect x="20" y="19" width="18" height="2.5" rx="1.25" fill="#fff" opacity="0.55" />
      <rect x="20" y="25" width="14" height="2.5" rx="1.25" fill="#fff" opacity="0.55" />
      <rect x="20" y="31" width="10" height="2.5" rx="1.25" fill="#fff" opacity="0.35" />
    </svg>
  </div>
);

const RobotIcon = () => (
  <div className="shortcut-icon-group">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <GlassFilter />
      <circle cx="34" cy="34" r="16" fill="#F2A5BB" opacity="0.3" filter="url(#glass)" />
      <rect x="10" y="14" width="28" height="22" rx="6" fill="#E8739A" />
      <rect x="10" y="14" width="28" height="22" rx="6" fill="rgba(255,255,255,0.1)" />
      <circle cx="19" cy="23" r="2.5" fill="#fff" />
      <circle cx="29" cy="23" r="2.5" fill="#fff" />
      <rect x="17" y="29" width="14" height="2.5" rx="1.25" fill="#fff" opacity="0.6" />
      <rect x="21" y="7" width="6" height="9" rx="3" fill="#E8739A" />
      <circle cx="21" cy="7" r="2.5" fill="#F2A5BB" opacity="0.7" />
      <rect x="4" y="20" width="6" height="8" rx="3" fill="#F2A5BB" opacity="0.5" filter="url(#glass)" />
      <rect x="38" y="20" width="6" height="8" rx="3" fill="#F2A5BB" opacity="0.5" filter="url(#glass)" />
    </svg>
  </div>
);

const TaskIcon = () => (
  <div className="shortcut-icon-group">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <GlassFilter />
      <rect x="4" y="10" width="28" height="36" rx="6" fill="#F5C48D" opacity="0.35" filter="url(#glass)" />
      <rect x="16" y="4" width="28" height="36" rx="6" fill="#F5A25D" />
      <rect x="16" y="4" width="28" height="36" rx="6" fill="rgba(255,255,255,0.1)" />
      <path d="M24 18 L28 22 L36 14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="22" y="28" width="16" height="2.5" rx="1.25" fill="#fff" opacity="0.55" />
      <rect x="22" y="34" width="12" height="2.5" rx="1.25" fill="#fff" opacity="0.35" />
    </svg>
  </div>
);

const QueueIcon = () => (
  <div className="shortcut-icon-group">
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <GlassFilter />
      <rect x="4" y="12" width="28" height="34" rx="6" fill="#8AD4B2" opacity="0.35" filter="url(#glass)" />
      <rect x="16" y="6" width="28" height="34" rx="6" fill="#3CB77E" />
      <rect x="16" y="6" width="28" height="34" rx="6" fill="rgba(255,255,255,0.1)" />
      <rect x="22" y="14" width="16" height="2.5" rx="1.25" fill="#fff" />
      <rect x="22" y="20" width="16" height="2.5" rx="1.25" fill="#fff" opacity="0.55" />
      <rect x="22" y="26" width="16" height="2.5" rx="1.25" fill="#fff" opacity="0.55" />
      <rect x="22" y="32" width="10" height="2.5" rx="1.25" fill="#fff" opacity="0.35" />
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
