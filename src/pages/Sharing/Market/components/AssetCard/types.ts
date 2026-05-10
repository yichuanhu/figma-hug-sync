import type { Asset, ReuseState } from '../../types';

export interface AssetCardProps {
  asset: Asset;
  reuseState: ReuseState;
  reusedAt?: string;
  isPublishedBy: boolean;
  onView: (id: string) => void;
  onReuse: (id: string) => void;
  onEditDisplay?: (id: string) => void;
}
