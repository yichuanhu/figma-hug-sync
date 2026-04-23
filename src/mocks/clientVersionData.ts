// 客户端启用版本 Mock（来自 Laiye Admin Hub 产品配置 → APA → 版本更新）
// 实际接入时由后端返回；这里按 desktop_type / clientType 提供两条记录。

export interface ClientEnabledVersion {
  clientType: 'Console' | 'NotConsole';
  version: string;
  packageSize: string;
  releaseNotes: string;
  publishedAt: string;
}

export const mockEnabledVersions: ClientEnabledVersion[] = [
  {
    clientType: 'Console',
    version: 'v6.8.0',
    packageSize: '48.3 MB',
    releaseNotes: '1. 修复多任务并发时偶发卡死问题\n2. 优化客户端内存占用\n3. 提升网络断连后的自动重连速度',
    publishedAt: '2025-03-15 10:00:00',
  },
  {
    clientType: 'NotConsole',
    version: 'v6.8.0',
    packageSize: '52.1 MB',
    releaseNotes: '1. 修复远程桌面分辨率适配问题\n2. 优化登录稳定性\n3. 增强强制登录的兼容性',
    publishedAt: '2025-03-15 10:00:00',
  },
];

export const getEnabledVersion = (
  desktopType: string | null | undefined
): ClientEnabledVersion | undefined => {
  if (!desktopType) return undefined;
  return mockEnabledVersions.find((v) => v.clientType === desktopType);
};
