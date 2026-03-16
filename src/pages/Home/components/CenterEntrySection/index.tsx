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
    gradient: 'linear-gradient(to right, #E0EAFF, #F5F8FF, #FFFFFF)',
    hoverGradient: 'linear-gradient(to right, #D0DEFF, #EDF2FF, #FAFCFF)',
    iconBg: 'rgba(59, 130, 246, 0.12)',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    icon: developmentCenterIcon,
    path: '/process-development',
    gradient: 'linear-gradient(to right, #DCF5E7, #F0FAF4, #FFFFFF)',
    hoverGradient: 'linear-gradient(to right, #C8EED8, #E5F7EC, #FAFCFB)',
    iconBg: 'rgba(34, 197, 94, 0.12)',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    icon: schedulingCenterIcon,
    path: '/scheduling-center/execution-assets/automation-process',
    gradient: 'linear-gradient(to right, #FFF0D4, #FFF8EC, #FFFFFF)',
    hoverGradient: 'linear-gradient(to right, #FFE6BC, #FFF3E0, #FFFCF8)',
    iconBg: 'rgba(245, 158, 11, 0.12)',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    icon: operationsCenterIcon,
    path: '/operations',
    gradient: 'linear-gradient(to right, #EDE5FB, #F6F2FD, #FFFFFF)',
    hoverGradient: 'linear-gradient(to right, #E0D4F8, #F0EAFC, #FDFCFF)',
    iconBg: 'rgba(139, 92, 246, 0.12)',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    icon: maintenanceCenterIcon,
    path: '/maintenance',
    gradient: 'linear-gradient(to right, #FCE4E4, #FEF2F2, #FFFFFF)',
    hoverGradient: 'linear-gradient(to right, #FAD2D2, #FDEBEB, #FFFAFA)',
    iconBg: 'rgba(239, 68, 68, 0.12)',
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
