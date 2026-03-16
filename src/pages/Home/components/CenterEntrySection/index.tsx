import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import requirementsCenterIcon from '@/assets/icons/requirements-center.svg?raw';
import developmentCenterIcon from '@/assets/icons/development-center.svg?raw';
import schedulingCenterIcon from '@/assets/icons/scheduling-center.svg?raw';
import operationsCenterIcon from '@/assets/icons/operations-center.svg?raw';
import maintenanceCenterIcon from '@/assets/icons/maintenance-center.svg?raw';
import './index.less';

interface CenterEntry {
  key: string;
  titleKey: string;
  descKey: string;
  icon: string;
  path: string;
  accentColor: string;
}

const centerEntries: CenterEntry[] = [
  {
    key: 'requirements',
    titleKey: 'homepage.centers.requirements',
    descKey: 'homepage.centers.requirementsDesc',
    icon: requirementsCenterIcon,
    path: '/requirements',
    accentColor: '22, 93, 255',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    icon: developmentCenterIcon,
    path: '/process-development',
    accentColor: '79, 190, 49',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    icon: schedulingCenterIcon,
    path: '/scheduling-center/execution-assets/automation-process',
    accentColor: '79, 193, 206',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    icon: operationsCenterIcon,
    path: '/operations',
    accentColor: '202, 109, 255',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    icon: maintenanceCenterIcon,
    path: '/maintenance',
    accentColor: '177, 160, 15',
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
          <div
            className="center-entry-icon-wrapper"
            dangerouslySetInnerHTML={{ __html: entry.icon }}
          />
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
