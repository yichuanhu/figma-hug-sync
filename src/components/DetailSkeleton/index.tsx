import './index.less';

interface DetailSkeletonProps {
  rows?: number;
  showTabs?: boolean;
  sections?: number;
}

const DetailSkeleton = ({ rows = 6, showTabs = true, sections = 3 }: DetailSkeletonProps) => {
  return (
    <div className="detail-skeleton">
      {showTabs && (
        <div className="detail-skeleton-tabs">
          <div className="detail-skeleton-tab">
            <div className="detail-skeleton-shimmer" />
          </div>
          <div className="detail-skeleton-tab">
            <div className="detail-skeleton-shimmer" />
          </div>
          <div className="detail-skeleton-tab">
            <div className="detail-skeleton-shimmer" />
          </div>
        </div>
      )}
      
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="detail-skeleton-section">
          <div className="detail-skeleton-section-title">
            <div className="detail-skeleton-shimmer" />
          </div>
          <div className="detail-skeleton-content">
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="detail-skeleton-row">
                <div className="detail-skeleton-label">
                  <div className="detail-skeleton-shimmer" />
                </div>
                <div className="detail-skeleton-value">
                  <div className="detail-skeleton-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DetailSkeleton;
