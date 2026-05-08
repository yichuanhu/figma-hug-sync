import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip } from '@douyinfe/semi-ui';
import './index.less';

export interface UnackedBadgeProps {
  /** 待响应数量 */
  count: number;
  /** 跳转目标变更日志 ID（可选；若提供则自动展开对应响应面板） */
  changeLogId?: string;
  /** 跳转目标需求 ID（用于自动打开抽屉） */
  requirementId?: string;
  /** 自定义提示文案，默认使用 i18n */
  tooltip?: string;
  /** 仅显示一个红点（不显示数量） */
  dotOnly?: boolean;
  /** 阻止冒泡（用于嵌入可点击行） */
  stopPropagation?: boolean;
  className?: string;
}

const UnackedBadge = ({
  count,
  changeLogId,
  requirementId,
  tooltip,
  dotOnly = false,
  stopPropagation = true,
  className,
}: UnackedBadgeProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!count || count <= 0) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    const params = new URLSearchParams();
    params.set('openDevResponse', '1');
    if (requirementId) params.set('requirementId', requirementId);
    if (changeLogId) params.set('changeLogId', changeLogId);
    navigate(`/requirements/list?${params.toString()}`);
  };

  const text =
    tooltip ?? t('requirements.unacked.tooltip', { count, defaultValue: `${count} 项变更待响应` });

  return (
    <Tooltip content={text} position="top">
      <span
        className={`unacked-badge${dotOnly ? ' unacked-badge-dot' : ''}${className ? ` ${className}` : ''}`}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick(e as unknown as React.MouseEvent);
        }}
      >
        {!dotOnly && <span className="unacked-badge-count">{count > 99 ? '99+' : count}</span>}
      </span>
    </Tooltip>
  );
};

export default UnackedBadge;
