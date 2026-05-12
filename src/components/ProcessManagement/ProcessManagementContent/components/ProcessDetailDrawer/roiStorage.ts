/**
 * ROI 配置本地持久化（mock 阶段）
 * - 以 processId 为键
 * - 业务量变量来源：客户端开发流程时通过 YAML/元数据标记，详情页面只读展示
 */

const ROI_KEY_PREFIX = 'apa.roi.';

export type BusinessVolumeConfig = 'FIXED' | 'PARAM';

export interface ProcessRoiConfig {
  businessVolumeConfig?: BusinessVolumeConfig;
  baseTimeSavedMinutes?: number;
  selectedBusinessVolumeVariable?: string;
}

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
};

export const getRoiConfig = (processId: string): ProcessRoiConfig => {
  const raw = safeGet(`${ROI_KEY_PREFIX}${processId}`);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as ProcessRoiConfig & { baseHourlyRate?: number };
    const { businessVolumeConfig, baseTimeSavedMinutes, selectedBusinessVolumeVariable } = parsed;
    return { businessVolumeConfig, baseTimeSavedMinutes, selectedBusinessVolumeVariable };
  } catch {
    return {};
  }
};

export const saveRoiConfig = (processId: string, config: ProcessRoiConfig): void => {
  safeSet(`${ROI_KEY_PREFIX}${processId}`, JSON.stringify(config));
};
