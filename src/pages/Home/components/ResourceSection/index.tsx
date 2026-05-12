import { useTranslation } from 'react-i18next';
import { Toast } from '@douyinfe/semi-ui';
import { Download, FileText, Package, File as FileIcon } from 'lucide-react';
import {
  getResources,
  usePlatformOpsData,
  type DownloadableResource,
} from '@/pages/Operations/PlatformOperations/mockData';
import './index.less';

const typeIconMap: Record<string, { Icon: React.ComponentType<any>; color: string; bg: string }> = {
  '安装包': { Icon: Package, color: '#3370FF', bg: '#EEF3FF' },
  '文档': { Icon: FileText, color: '#00B42A', bg: '#E8F5E9' },
  '其他': { Icon: FileIcon, color: '#86909C', bg: '#F2F3F5' },
};

const ResourceSection = () => {
  const { t } = useTranslation();
  usePlatformOpsData();
  const resources = getResources().slice(0, 5);

  const handleClick = (item: DownloadableResource) => {
    if (!item.fileUrl || item.fileUrl === '#') {
      Toast.info(item.fileName);
      return;
    }
    const a = document.createElement('a');
    a.href = item.fileUrl;
    a.download = item.fileName;
    a.click();
  };

  return (
    <div className="home-card resource-section">
      <div className="home-card-header">
        <span className="home-card-title">{t('homepage.resources.title')}</span>
      </div>
      <div className="resource-list">
        {resources.map((item) => {
          const cfg = typeIconMap[item.resourceType] ?? typeIconMap['其他'];
          const Icon = cfg.Icon;
          return (
            <div key={item.id} className="resource-item" onClick={() => handleClick(item)}>
              <div className="resource-item-content">
                <div className="resource-item-title">{item.resourceName}</div>
                {item.description && <div className="resource-item-desc">{item.description}</div>}
              </div>
              <div
                className="resource-item-icon"
                style={{ backgroundColor: cfg.bg, color: cfg.color }}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
            </div>
          );
        })}
        {resources.length === 0 && (
          <div className="resource-empty">
            <Download size={20} strokeWidth={2} />
            <span>{t('operations.platformOperations.resources.empty')}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceSection;
