import { Workflow as WorkflowIcon, BookOpen } from 'lucide-react';
import { AssetType } from '../../types';
import './index.less';

const config: Record<AssetType, { Icon: typeof WorkflowIcon; cls: string }> = {
  WORKFLOW: { Icon: WorkflowIcon, cls: 'workflow' },
  KNOWLEDGE: { Icon: BookOpen, cls: 'knowledge' },
};

interface Props {
  type: AssetType;
  size?: number;
}

const AssetTypeIcon = ({ type, size = 18 }: Props) => {
  const { Icon, cls } = config[type];
  return (
    <span className={`asset-type-icon asset-type-icon--${cls}`} style={{ width: size + 16, height: size + 16 }}>
      <Icon size={size} strokeWidth={2} />
    </span>
  );
};

export default AssetTypeIcon;
