export type ComponentType = 'command' | 'apiConnector' | 'customComponent';

export interface VersionRecord {
  version: string;
  releaseDate: string;
  changelog: string;
  author: string;
}

export interface ComponentItem {
  id: string;
  name: string;
  description: string;
  type: ComponentType;
  tags: string[];
  author: string;
  version: string;
  downloads: number;
  rating: number;
  updatedAt: string;
  status: 'published' | 'draft' | 'deprecated';
  createdAt?: string;
  dependencies?: string[];
  versionHistory?: VersionRecord[];
}
