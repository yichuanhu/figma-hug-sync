/**
 * ROI 配置与"业务量变量"标记的本地持久化（mock 阶段）
 * - ROI 配置：以 processId 为键
 * - 业务量变量标记：以 processId + versionId 为键，按变量名映射布尔值
 */

const ROI_KEY_PREFIX = 'apa.roi.';
const FLAGS_KEY_PREFIX = 'apa.outputFlags.';

export type BusinessVolumeConfig = 'FIXED' | 'PARAM';

export interface ProcessRoiConfig {
  baseHourlyRate?: number;
  businessVolumeConfig?: BusinessVolumeConfig;
  baseTimeSavedMinutes?: number;
  selectedBusinessVolumeVariable?: string;
}

export type OutputVariableFlags = Record<string, boolean>;

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
    return JSON.parse(raw) as ProcessRoiConfig;
  } catch {
    return {};
  }
};

export const saveRoiConfig = (processId: string, config: ProcessRoiConfig): void => {
  safeSet(`${ROI_KEY_PREFIX}${processId}`, JSON.stringify(config));
};

const flagsKey = (processId: string, versionId: string) =>
  `${FLAGS_KEY_PREFIX}${processId}.${versionId}`;

export const getOutputFlags = (
  processId: string,
  versionId: string,
): OutputVariableFlags => {
  const raw = safeGet(flagsKey(processId, versionId));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as OutputVariableFlags;
  } catch {
    return {};
  }
};

export const saveOutputFlags = (
  processId: string,
  versionId: string,
  flags: OutputVariableFlags,
): void => {
  safeSet(flagsKey(processId, versionId), JSON.stringify(flags));
};

export const setOutputFlag = (
  processId: string,
  versionId: string,
  variableName: string,
  isBusinessVolume: boolean,
): OutputVariableFlags => {
  const next = { ...getOutputFlags(processId, versionId), [variableName]: isBusinessVolume };
  saveOutputFlags(processId, versionId, next);
  return next;
};
