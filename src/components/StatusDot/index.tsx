import type { ReactNode, CSSProperties } from 'react';
import './index.less';

export type StatusDotColor =
  | 'grey'
  | 'blue'
  | 'light-blue'
  | 'green'
  | 'orange'
  | 'amber'
  | 'red'
  | 'purple'
  | 'violet'
  | 'cyan'
  | 'teal'
  | 'pink'
  | 'lime'
  | 'yellow'
  | 'white';

interface StatusDotProps {
  color: StatusDotColor;
  label: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const colorMap: Record<StatusDotColor, string> = {
  grey: 'var(--semi-color-text-2)',
  blue: 'var(--semi-color-primary)',
  'light-blue': '#0ea5e9',
  green: 'var(--semi-color-success)',
  orange: 'var(--semi-color-warning)',
  amber: '#f59e0b',
  red: 'var(--semi-color-danger)',
  purple: '#a855f7',
  violet: '#7c3aed',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  pink: '#ec4899',
  lime: '#84cc16',
  yellow: '#eab308',
  white: 'var(--semi-color-text-2)',
};

const StatusDot = ({ color, label, className, style }: StatusDotProps) => {
  const dotColor = colorMap[color] || colorMap.grey;
  return (
    <span className={`ly-status-dot${className ? ` ${className}` : ''}`} style={style}>
      <span className="ly-status-dot__dot" style={{ backgroundColor: dotColor }} />
      <span className="ly-status-dot__label">{label}</span>
    </span>
  );
};

export default StatusDot;
