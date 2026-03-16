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
}

const centerEntries: CenterEntry[] = [
  {
    key: 'requirements',
    titleKey: 'homepage.centers.requirements',
    descKey: 'homepage.centers.requirementsDesc',
    icon: requirementsCenterIcon,
    path: '/requirements',
    gradient: 'linear-gradient(135deg, #E8F0FE, #D0E2FF)',
    hoverGradient: 'linear-gradient(135deg, #D0E2FF, #B8D4FF)',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    icon: developmentCenterIcon,
    path: '/process-development',
    gradient: 'linear-gradient(135deg, #E6F7ED, #C6EFCE)',
    hoverGradient: 'linear-gradient(135deg, #C6EFCE, #A6E7B0)',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    icon: schedulingCenterIcon,
    path: '/scheduling-center/execution-assets/automation-process',
    gradient: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
    hoverGradient: 'linear-gradient(135deg, #FFE0B2, #FFCC80)',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    icon: operationsCenterIcon,
    path: '/operations',
    gradient: 'linear-gradient(135deg, #F3E8FD, #E1D5FA)',
    hoverGradient: 'linear-gradient(135deg, #E1D5FA, #D0C0F5)',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    icon: maintenanceCenterIcon,
    path: '/maintenance',
    gradient: 'linear-gradient(135deg, #FDE8E8, #FCCFCF)',
    hoverGradient: 'linear-gradient(135deg, #FCCFCF, #FAB6B6)',
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
          <img src={entry.icon} alt={entry.key} className="center-entry-icon" />
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
