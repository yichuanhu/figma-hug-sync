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
  iconFilter?: string;
}

const centerEntries: CenterEntry[] = [
  {
    key: 'requirements',
    titleKey: 'homepage.centers.requirements',
    descKey: 'homepage.centers.requirementsDesc',
    icon: requirementsCenterIcon,
    path: '/requirements',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0F3F8 60%, #E8EDF5 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E8EDF5 60%, #DEE5F2 100%)',
    iconFilter: 'invert(47%) sepia(85%) saturate(4452%) hue-rotate(207deg) brightness(99%) contrast(98%)',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    icon: developmentCenterIcon,
    path: '/process-development',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #EDF3F0 60%, #E3EDE8 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E3EDE8 60%, #D9EAE1 100%)',
    iconFilter: 'invert(56%) sepia(59%) saturate(638%) hue-rotate(89deg) brightness(94%) contrast(91%)',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    icon: schedulingCenterIcon,
    path: '/scheduling-center/execution-assets/automation-process',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F5F0EA 60%, #F2EBE2 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F2EBE2 60%, #EDE5DA 100%)',
    iconFilter: 'invert(64%) sepia(95%) saturate(2120%) hue-rotate(4deg) brightness(105%) contrast(96%)',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    icon: operationsCenterIcon,
    path: '/operations',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F0EDF5 60%, #EBE5F2 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFFFFF 0%, #EBE5F2 60%, #E2DCEC 100%)',
    iconFilter: 'invert(44%) sepia(85%) saturate(3753%) hue-rotate(242deg) brightness(99%) contrast(95%)',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    icon: maintenanceCenterIcon,
    path: '/maintenance',
    gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F5EDEC 60%, #F2E5E5 100%)',
    hoverGradient: 'linear-gradient(135deg, #FFFFFF 0%, #F2E5E5 60%, #ECDCDC 100%)',
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
            <img src={entry.icon} alt={entry.key} className="center-entry-icon" style={{ filter: entry.iconFilter }} />
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
