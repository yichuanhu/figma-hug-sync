import { Typography } from '@douyinfe/semi-ui';
import { formatDepartmentPath, getDepartmentPath } from '@/mocks/departmentData';
import './index.less';

interface DepartmentPathProps {
  departmentId?: string | null;
  separator?: string;
  /** 是否展示最顶层根节点（如 "Laiye Technology"），默认 true */
  includeRoot?: boolean;
  className?: string;
}

/**
 * 部门链路展示组件：以 " / " 拼接的从根到叶子的完整链路。
 * 单行省略，超出宽度时展示 Tooltip 完整链路。
 */
const DepartmentPath = ({
  departmentId,
  separator = ' / ',
  includeRoot = true,
  className,
}: DepartmentPathProps) => {
  if (!departmentId) return <span>-</span>;
  const path = getDepartmentPath(departmentId);
  const arr = includeRoot ? path : path.slice(1);
  if (!arr.length) return <span>-</span>;

  const text = formatDepartmentPath(departmentId, { separator, includeRoot });
  const last = arr.length - 1;

  return (
    <Typography.Text
      className={`department-path ${className || ''}`.trim()}
      ellipsis={{ showTooltip: { opts: { content: text } } }}
    >
      {arr.map((name, idx) => (
        <span key={idx}>
          {idx > 0 && <span className="department-path__sep">{separator}</span>}
          <span className={idx === last ? 'department-path__leaf' : 'department-path__node'}>
            {name}
          </span>
        </span>
      ))}
    </Typography.Text>
  );
};

export default DepartmentPath;
