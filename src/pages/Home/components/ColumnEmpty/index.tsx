import { Button } from '@douyinfe/semi-ui';
import { LayoutGrid } from 'lucide-react';
import { ReactNode } from 'react';

interface ColumnEmptyProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const ColumnEmpty = ({ icon, title, description, actionText, onAction }: ColumnEmptyProps) => {
  return (
    <div className="home-column-empty">
      <div className="home-column-empty-icon">
        {icon ?? <LayoutGrid size={22} strokeWidth={2} />}
      </div>
      <div className="home-column-empty-title">{title}</div>
      {description && <div className="home-column-empty-desc">{description}</div>}
      {actionText && onAction && (
        <Button theme="light" type="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};

export default ColumnEmpty;
