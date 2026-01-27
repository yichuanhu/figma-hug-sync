import './index.less';

interface ColumnConfig {
  width: number | string; // 支持数字(px)或百分比字符串
}

interface TableSkeletonProps {
  columns?: ColumnConfig[];
  rows?: number;
}

// 默认列配置
const defaultColumns: ColumnConfig[] = [
  { width: '20%' },
  { width: '25%' },
  { width: '20%' },
  { width: '20%' },
  { width: '15%' },
];

const TableSkeleton = ({ columns = defaultColumns, rows = 10 }: TableSkeletonProps) => {
  const getWidth = (width: number | string) => {
    if (typeof width === 'number') {
      return `${width}px`;
    }
    return width;
  };

  return (
    <div className="table-skeleton">
      {/* 表头 */}
      <div className="table-skeleton-header">
        {columns.map((col, index) => (
          <div
            key={`header-${index}`}
            className="table-skeleton-header-cell"
            style={{ width: getWidth(col.width), flexShrink: 0 }}
          />
        ))}
      </div>

      {/* 数据行 */}
      <div className="table-skeleton-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="table-skeleton-row">
            {columns.map((col, colIndex) => (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className="table-skeleton-cell"
                style={{ width: getWidth(col.width), flexShrink: 0 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
