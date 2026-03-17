import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import './index.less';

// 使用 ?raw 导入，保留 SVG 内部所有毛玻璃效果（首页专用 v6 图标）
import requirementsIconRaw from '@/assets/icons/home-requirements.svg?raw';
import developmentIconRaw from '@/assets/icons/home-development.svg?raw';
import schedulingIconRaw from '@/assets/icons/home-scheduling.svg?raw';
import operationsIconRaw from '@/assets/icons/home-operations.svg?raw';
import maintenanceIconRaw from '@/assets/icons/home-maintenance.svg?raw';

interface CenterEntry {
  key: string;
  titleKey: string;
  descKey: string;
  iconRaw: string;
  path: string;
  accentColor: string;
}

const centerEntries: CenterEntry[] = [
  {
    key: 'requirements',
    titleKey: 'homepage.centers.requirements',
    descKey: 'homepage.centers.requirementsDesc',
    iconRaw: requirementsIconRaw,
    path: '/requirements',
    accentColor: '22, 93, 255',
  },
  {
    key: 'development',
    titleKey: 'homepage.centers.development',
    descKey: 'homepage.centers.developmentDesc',
    iconRaw: developmentIconRaw,
    path: '/process-development',
    accentColor: '79, 190, 49',
  },
  {
    key: 'scheduling',
    titleKey: 'homepage.centers.scheduling',
    descKey: 'homepage.centers.schedulingDesc',
    iconRaw: schedulingIconRaw,
    path: '/scheduling-center/execution-assets/automation-process',
    accentColor: '79, 193, 206',
  },
  {
    key: 'operations',
    titleKey: 'homepage.centers.operations',
    descKey: 'homepage.centers.operationsDesc',
    iconRaw: operationsIconRaw,
    path: '/operations',
    accentColor: '202, 109, 255',
  },
  {
    key: 'maintenance',
    titleKey: 'homepage.centers.maintenance',
    descKey: 'homepage.centers.maintenanceDesc',
    iconRaw: maintenanceIconRaw,
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
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: entry.iconRaw }}
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
