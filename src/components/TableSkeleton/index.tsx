import './index.less';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: string[];
  showHeader?: boolean;
}

const TableSkeleton = ({ 
  rows = 10, 
  columns = 5, 
  columnWidths,
  showHeader = true 
}: TableSkeletonProps) => {
  const defaultWidths = ['20%', '30%', '15%', '15%', '20%'];
  const widths = columnWidths || defaultWidths.slice(0, columns);

  return (
    <div className="table-skeleton">
      {showHeader && (
        <div className="table-skeleton-header">
          {widths.map((width, index) => (
            <div 
              key={`header-${index}`} 
              className="table-skeleton-header-cell"
              style={{ width }}
            >
              <div className="table-skeleton-shimmer" />
            </div>
          ))}
        </div>
      )}
      <div className="table-skeleton-body">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="table-skeleton-row">
            {widths.map((width, colIndex) => (
              <div 
                key={`cell-${rowIndex}-${colIndex}`} 
                className="table-skeleton-cell"
                style={{ width }}
              >
                <div className="table-skeleton-shimmer" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
