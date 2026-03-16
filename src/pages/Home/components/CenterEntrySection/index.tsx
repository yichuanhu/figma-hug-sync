import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import requirementsCenterIcon from '@/assets/icons/requirements-center.png';
import developmentCenterIcon from '@/assets/icons/development-center.png';
import schedulingCenterIcon from '@/assets/icons/scheduling-center.png';
import operationsCenterIcon from '@/assets/icons/operations-center.png';
import maintenanceCenterIcon from '@/assets/icons/maintenance-center.png';
import './index.less';

interface CenterEntry {
  key: string;
  titleKey: string;
  descKey: string;
  icon: string;
  path: string;
  gradient: string;
  hoverGradient: string;
  iconBg: string;
  iconFilter?: string;
}

const centerEntries: CenterEntry[] = [
  {
    key: 'requirements',
    titleKey: 'homepage.centers.requirements',
    descKey: 'homepage.centers.requirementsDesc',
    icon: requirementsCenterIcon,
    path: '/requirements',
    gradient: 'linear-gradient(135deg, #EBF2FF 0%, #F8FBFF 50%, #FFFFFF 100%)',
    hoverGradient: 'linear-gradient(135deg, #D6E4FF 0%, #F0F6FF 50%, #FAFDFF 100%)',
    iconBg: 'rgba(59, 130, 246, 0.15)',
    iconFilter: 'invert(47%) sepia(85%) saturate(4452%) hue-rotate(207deg) brightness(99%) contrast(98%)',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    icon: developmentCenterIcon,
    path: '/process-development',
    gradient: 'linear-gradient(135deg, #E8F6EF 0%, #F5FCF8 50%, #FFFFFF 100%)',
    hoverGradient: 'linear-gradient(135deg, #D1EDE0 0%, #EBF9F1 50%, #FAFEFC 100%)',
    iconBg: 'rgba(34, 197, 94, 0.15)',
    iconFilter: 'invert(56%) sepia(59%) saturate(638%) hue-rotate(89deg) brightness(94%) contrast(91%)',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    icon: schedulingCenterIcon,
    path: '/scheduling-center/execution-assets/automation-process',
    gradient: 'linear-gradient(135deg, #FFF4E6 0%, #FFFCF7 50%, #FFFFFF 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFE8CC 0%, #FFF8EC 50%, #FFFEFB 100%)',
    iconBg: 'rgba(245, 158, 11, 0.15)',
    iconFilter: 'invert(64%) sepia(95%) saturate(2120%) hue-rotate(4deg) brightness(105%) contrast(96%)',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    icon: operationsCenterIcon,
    path: '/operations',
    gradient: 'linear-gradient(135deg, #F3E8FF 0%, #FAF6FF 50%, #FFFFFF 100%)',
    hoverGradient: 'linear-gradient(135deg, #EAD5FF 0%, #F5EDFF 50%, #FDFBFF 100%)',
    iconBg: 'rgba(139, 92, 246, 0.15)',
    iconFilter: 'invert(44%) sepia(85%) saturate(3753%) hue-rotate(242deg) brightness(99%) contrast(95%)',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    icon: maintenanceCenterIcon,
    path: '/maintenance',
    gradient: 'linear-gradient(135deg, #FFEAEA 0%, #FFF5F5 50%, #FFFFFF 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFD4D4 0%, #FFEBEB 50%, #FFFAFA 100%)',
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconFilter: 'invert(46%) sepia(74%) saturate(5211%) hue-rotate(341deg) brightness(96%) contrast(98%)',
  },
];

const CenterEntrySection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div className="center-entry-section">
      {centerEntries.map((entry) => (
        <div
          key={entry.key}
          className="center-entry-card"
          style={{
            background: hoveredKey === entry.key ? entry.hoverGradient : entry.gradient,
          }}
          onClick={() => navigate(entry.path)}
          onMouseEnter={() => setHoveredKey(entry.key)}
          onMouseLeave={() => setHoveredKey(null)}
        >
          <div className="center-entry-icon-wrapper" style={{ backgroundColor: entry.iconBg }}>
            <img src={entry.icon} alt={entry.key} className="center-entry-icon" />
          </div>
          <div className="center-entry-info">
            <div className="center-entry-title">{t(entry.titleKey)}</div>
            <div className="center-entry-desc">{t(entry.descKey)}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CenterEntrySection;
