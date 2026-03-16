import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import requirementsCenterIcon from '@/assets/icons/requirements-center.svg';
import developmentCenterIcon from '@/assets/icons/development-center.svg';
import schedulingCenterIcon from '@/assets/icons/scheduling-center.svg';
import operationsCenterIcon from '@/assets/icons/operations-center.svg';
import maintenanceCenterIcon from '@/assets/icons/maintenance-center.svg';
import './index.less';

interface CenterEntry {
  key: string;
  titleKey: string;
  descKey: string;
  icon: string;
  path: string;
  accentColor: string;
  iconFilter?: string;
}

const centerEntries: CenterEntry[] = [
  {
    key: 'requirements',
    titleKey: 'homepage.centers.requirements',
    descKey: 'homepage.centers.requirementsDesc',
    icon: requirementsCenterIcon,
    path: '/requirements',
    accentColor: '83, 123, 255',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    icon: developmentCenterIcon,
    path: '/process-development',
    accentColor: '60, 180, 120',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    icon: schedulingCenterIcon,
    path: '/scheduling-center/execution-assets/automation-process',
    accentColor: '255, 160, 80',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    icon: operationsCenterIcon,
    path: '/operations',
    accentColor: '150, 100, 255',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    icon: maintenanceCenterIcon,
    path: '/maintenance',
    accentColor: '255, 100, 100',
  },
];

const CenterEntrySection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="center-entry-section">
      {centerEntries.map((entry) => (
        <div
          key={entry.key}
          className="center-entry-card"
          style={{
            background: `linear-gradient(90deg, rgba(255, 255, 255, 0.00) 65%, rgba(${entry.accentColor}, 0.12) 100%), #FFF`,
          }}
          onClick={() => navigate(entry.path)}
        >
          <div className="center-entry-icon-wrapper">
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
