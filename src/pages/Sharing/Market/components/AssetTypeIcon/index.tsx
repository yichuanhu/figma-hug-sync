import { FileBox, Workflow as WorkflowIcon, BookOpen, Sparkles } from 'lucide-react';
import { AssetType } from '../../types';
import './index.less';

const config: Record<AssetType, { Icon: typeof FileBox; cls: string }> = {
  SNIPPET: { Icon: FileBox, cls: 'snippet' },
  WORKFLOW: { Icon: WorkflowIcon, cls: 'workflow' },
  KNOWLEDGE: { Icon: BookOpen, cls: 'knowledge' },
  SKILL: { Icon: Sparkles, cls: 'skill' },
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
