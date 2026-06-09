import type { Asset } from '../../types';

export interface AssetCardProps {
  asset: Asset;
  isPublishedBy: boolean;
  onView: (id: string) => void;
  onEditDisplay?: (id: string) => void;
}
