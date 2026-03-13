export interface ShortcutItem {
  key: string;
  titleKey: string;
  descKey: string;
  icon: string; // lucide icon name
  color: string; // CSS color variable
  bgColor: string; // CSS background color
  borderColor?: string; // CSS border color
  path?: string;
}

export interface MetricItem {
  key: string;
  labelKey: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
}

export interface NotificationItem {
  id: string;
  titleKey: string;
  title: string;
  time: string;
  read: boolean;
  type: 'error' | 'warning' | 'info' | 'success';
}

export interface AnnouncementItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  priority: 'urgent' | 'important' | 'normal';
}

export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  version: string;
  gradient: string;
  icon: string;
}

export interface ResourceItem {
  id: string;
  titleKey: string;
  title: string;
  descKey: string;
  desc: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  url?: string;
}

export interface ActivityItem {
  id: string;
  type: 'create' | 'execute' | 'update' | 'delete' | 'publish';
  description: string;
  target: string;
  time: string;
}
