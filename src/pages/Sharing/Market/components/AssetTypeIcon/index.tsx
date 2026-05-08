import { FileBox, Workflow as WorkflowIcon, BookOpen, Sparkles } from 'lucide-react';
import { AssetType } from '../../types';
import './index.less';

const config: Record<AssetType, { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; cls: string }> = {
  SNIPPET: { icon: FileBox, cls: 'snippet' },
  WORKFLOW: { icon: WorkflowIcon, cls: 'workflow' },
  KNOWLEDGE: { icon: BookOpen, cls: 'knowledge' },
  SKILL: { icon: Sparkles, cls: 'skill' },
};

interface Props {
  type: AssetType;
  size?: number;
}

const AssetTypeIcon = ({ type, size = 18 }: Props) => {
  const { icon: Icon, cls } = config[type];
  return (
    <span className={`asset-type-icon asset-type-icon--${cls}`} style={{ width: size + 16, height: size + 16 }}>
      <Icon size={size} strokeWidth={2} />
    </span>
  );
};

export default AssetTypeIcon;
