// 平台运营 - 公告与可下载资源统一 mock 数据源（与首页共享）
import { useEffect, useState } from 'react';

export type AnnouncementPriority = 'urgent' | 'important' | 'normal';
export type ResourceType = '安装包' | '文档' | '其他';

export interface PlatformAnnouncement {
  id: string;
  title: string;
  summary: string;        // 副标题/摘要
  content: string;        // 富文本占位：v1 纯文本
  isBanner: boolean;
  // Banner 视觉：bannerImageKey 用于复用本地图片资源；bannerImageUrl 用于真实/上传图片
  bannerImageKey?: string;
  bannerImageUrl?: string;
  bannerGradient?: string;
  bannerIcon?: string;     // Lucide icon 名
  bannerVersion?: string;  // Banner 角标
  isPublished: boolean;
  publishedAt?: string;
  priority: AnnouncementPriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadableResource {
  id: string;
  resourceName: string;
  fileName: string;
  fileSize: number;        // 字节
  fileUrl: string;
  resourceType: ResourceType;
  description?: string;
  uploadedBy: string;
  createdAt: string;
}

const now = () => new Date().toISOString();

// ------------- 初始数据 -------------
let announcements: PlatformAnnouncement[] = [
  {
    id: 'anno-001',
    title: 'APA Creator 最新版本发布',
    summary: '全新流程设计器，支持更强大的自动化编排',
    content: '我们很高兴宣布 APA Creator v3.2.0 正式发布。本次更新带来全新的流程设计器、增强的调试体验以及多项性能优化。',
    isBanner: true,
    bannerImageKey: 'apa-creator-release',
    bannerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    bannerIcon: 'Palette',
    bannerVersion: 'v3.2.0',
    isPublished: true,
    publishedAt: '2026-03-12T09:00:00Z',
    priority: 'important',
    createdBy: '管理员',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-12T09:00:00Z',
  },
  {
    id: 'anno-002',
    title: 'APA Worker 最新版本发布',
    summary: '性能升级，支持更多自动化场景',
    content: 'APA Worker v2.8.0 已发布。新版本带来执行性能提升、扩展更多自动化场景能力，并修复多个稳定性问题。',
    isBanner: true,
    bannerImageKey: 'apa-worker-release',
    bannerGradient: 'linear-gradient(135deg, #2BC0E4 0%, #5B86E5 100%)',
    bannerIcon: 'Cpu',
    bannerVersion: 'v2.8.0',
    isPublished: true,
    publishedAt: '2026-03-11T09:00:00Z',
    priority: 'important',
    createdBy: '管理员',
    createdAt: '2026-03-09T10:00:00Z',
    updatedAt: '2026-03-11T09:00:00Z',
  },
  {
    id: 'anno-003',
    title: '系统维护通知：3 月 15 日 02:00-06:00',
    summary: '平台将进行例行维护，请提前安排工作',
    content: '平台将于 2026 年 3 月 15 日 02:00-06:00 进行例行维护，期间服务将不可用，请提前安排好您的工作。',
    isBanner: false,
    isPublished: true,
    publishedAt: '2026-03-12T08:00:00Z',
    priority: 'urgent',
    createdBy: '管理员',
    createdAt: '2026-03-12T07:50:00Z',
    updatedAt: '2026-03-12T08:00:00Z',
  },
  {
    id: 'anno-004',
    title: '2026 开发者大赛报名开启',
    summary: '赢取丰厚奖金，展示你的自动化方案',
    content: '2026 开发者大赛报名通道现已开启，欢迎所有平台用户参与！',
    isBanner: false,
    isPublished: true,
    publishedAt: '2026-03-10T10:00:00Z',
    priority: 'important',
    createdBy: '管理员',
    createdAt: '2026-03-10T09:50:00Z',
    updatedAt: '2026-03-10T10:00:00Z',
  },
  {
    id: 'anno-005',
    title: 'WEP 平台 v4.5 版本发布说明',
    summary: '多项功能改进与缺陷修复',
    content: 'WEP 平台 v4.5 已发布，包含多项功能优化与缺陷修复。',
    isBanner: false,
    isPublished: true,
    publishedAt: '2026-03-08T10:00:00Z',
    priority: 'normal',
    createdBy: '管理员',
    createdAt: '2026-03-08T09:50:00Z',
    updatedAt: '2026-03-08T10:00:00Z',
  },
  {
    id: 'anno-006',
    title: '安全策略更新：密码复杂度要求',
    summary: '请尽快更新您的密码以符合新策略',
    content: '为保障账户安全，平台将于近期更新密码复杂度要求。',
    isBanner: false,
    isPublished: true,
    publishedAt: '2026-03-05T10:00:00Z',
    priority: 'important',
    createdBy: '管理员',
    createdAt: '2026-03-05T09:50:00Z',
    updatedAt: '2026-03-05T10:00:00Z',
  },
];

let resources: DownloadableResource[] = [
  {
    id: 'res-001',
    resourceName: 'APA Creator 客户端',
    fileName: 'apa-creator-3.2.0-win-x64.exe',
    fileSize: 142_606_336,
    fileUrl: '#',
    resourceType: '安装包',
    description: 'APA Creator v3.2.0 Windows 64 位安装包',
    uploadedBy: '管理员',
    createdAt: '2026-03-12T09:00:00Z',
  },
  {
    id: 'res-002',
    resourceName: 'APA Worker 客户端',
    fileName: 'apa-worker-2.8.0-win-x64.exe',
    fileSize: 86_900_736,
    fileUrl: '#',
    resourceType: '安装包',
    description: 'APA Worker v2.8.0 Windows 64 位安装包',
    uploadedBy: '管理员',
    createdAt: '2026-03-11T09:00:00Z',
  },
  {
    id: 'res-003',
    resourceName: 'APA 平台用户手册',
    fileName: 'apa-user-manual-v3.2.pdf',
    fileSize: 8_388_608,
    fileUrl: '#',
    resourceType: '文档',
    description: '面向最终用户的操作手册',
    uploadedBy: '管理员',
    createdAt: '2026-03-12T10:00:00Z',
  },
];

// ------------- 订阅机制（同模块单例） -------------
type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export const subscribe = (l: Listener) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

// ------------- 公告 CRUD -------------
export const getAnnouncements = (): PlatformAnnouncement[] => [...announcements];

export const getPublishedAnnouncements = (limit = 5): PlatformAnnouncement[] =>
  announcements
    .filter((a) => a.isPublished)
    .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
    .slice(0, limit);

export const getBannerAnnouncements = (): PlatformAnnouncement[] =>
  announcements.filter((a) => a.isPublished && a.isBanner);

export const createAnnouncement = (
  data: Omit<PlatformAnnouncement, 'id' | 'createdAt' | 'updatedAt' | 'isPublished' | 'publishedAt' | 'createdBy'>,
) => {
  const item: PlatformAnnouncement = {
    ...data,
    id: `anno-${Date.now()}`,
    isPublished: false,
    createdBy: '管理员',
    createdAt: now(),
    updatedAt: now(),
  };
  announcements = [item, ...announcements];
  emit();
  return item;
};

export const updateAnnouncement = (id: string, patch: Partial<PlatformAnnouncement>) => {
  announcements = announcements.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: now() } : a));
  emit();
};

export const deleteAnnouncement = (id: string) => {
  announcements = announcements.filter((a) => a.id !== id);
  emit();
};

export const publishAnnouncement = (id: string) => {
  updateAnnouncement(id, { isPublished: true, publishedAt: now() });
};

export const unpublishAnnouncement = (id: string) => {
  updateAnnouncement(id, { isPublished: false });
};

// ------------- 资源 CRUD -------------
export const getResources = (): DownloadableResource[] => [...resources];

export const createResource = (data: Omit<DownloadableResource, 'id' | 'createdAt' | 'uploadedBy'>) => {
  // 同名覆盖：基于 fileName
  const existing = resources.find((r) => r.fileName === data.fileName);
  if (existing) {
    resources = resources.map((r) =>
      r.id === existing.id ? { ...r, ...data, createdAt: now() } : r,
    );
  } else {
    resources = [
      { ...data, id: `res-${Date.now()}`, uploadedBy: '管理员', createdAt: now() },
      ...resources,
    ];
  }
  emit();
};

export const deleteResource = (id: string) => {
  resources = resources.filter((r) => r.id !== id);
  emit();
};

// ------------- React 订阅 hook -------------
export const usePlatformOpsData = () => {
  const [, force] = useState(0);
  useEffect(() => subscribe(() => force((n) => n + 1)), []);
};
