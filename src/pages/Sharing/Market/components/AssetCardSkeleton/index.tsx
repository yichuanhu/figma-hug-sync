import { Card, Skeleton } from '@douyinfe/semi-ui';

const placeholder = (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <Skeleton.Title style={{ width: '70%' }} />
    <Skeleton.Paragraph rows={2} />
    <Skeleton.Title style={{ width: '40%', marginTop: 8 }} />
  </div>
);

const AssetCardSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="asset-list-grid">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i} bodyStyle={{ padding: 16 }} style={{ height: '100%' }}>
        <Skeleton placeholder={placeholder} loading active />
      </Card>
    ))}
  </div>
);

export default AssetCardSkeleton;
