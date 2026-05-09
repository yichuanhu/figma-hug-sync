import { ALL_ORG_USERS } from '@/components/CollaboratorManager/mockData';

export interface AssignedValue {
  id: string;
  user_id: string;
  user_name: string;
  account: string;
  password_display: string; // always ******
  description?: string;
}

const STORE = new Map<string, AssignedValue[]>();

const seedFor = (credentialId: string): AssignedValue[] => {
  const users = ALL_ORG_USERS.slice(0, 5);
  return users.map((u, i) => ({
    id: `av-${credentialId}-${i + 1}`,
    user_id: u.id,
    user_name: u.name,
    account: `acct_${u.name.toLowerCase().replace(/\s+/g, '_')}`,
    password_display: '******',
    description: `${u.name} 的账号`,
  }));
};

export const listAssignedValues = (credentialId: string): AssignedValue[] => {
  if (!STORE.has(credentialId)) STORE.set(credentialId, seedFor(credentialId));
  return [...STORE.get(credentialId)!];
};

export const createAssignedValue = (
  credentialId: string,
  data: { user_id: string; user_name: string; account: string; description?: string },
): { ok: true } | { ok: false; reason: string } => {
  const list = listAssignedValues(credentialId);
  if (list.some((v) => v.user_id === data.user_id)) {
    return { ok: false, reason: '该用户已存在分配值映射' };
  }
  const next: AssignedValue = {
    id: `av-${credentialId}-${Date.now()}`,
    user_id: data.user_id,
    user_name: data.user_name,
    account: data.account,
    password_display: '******',
    description: data.description,
  };
  STORE.set(credentialId, [next, ...list]);
  return { ok: true };
};

export const updateAssignedValue = (
  credentialId: string,
  valueId: string,
  data: { account: string; description?: string },
): void => {
  const list = listAssignedValues(credentialId);
  const idx = list.findIndex((v) => v.id === valueId);
  if (idx < 0) return;
  list[idx] = { ...list[idx], account: data.account, description: data.description };
  STORE.set(credentialId, list);
};

export const deleteAssignedValue = (credentialId: string, valueId: string): void => {
  const list = listAssignedValues(credentialId).filter((v) => v.id !== valueId);
  STORE.set(credentialId, list);
};

export interface ImportRowResult {
  row_number: number;
  username: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  sub_status?: 'CREATED' | 'UPDATED';
  reason?: string;
}

export interface ImportSummary {
  total: number;
  success: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  details: ImportRowResult[];
}

/** Mock 导入：随机生成结果并写入 store */
export const mockImport = (credentialId: string, fileName: string): ImportSummary => {
  const existing = listAssignedValues(credentialId);
  const existingUserIds = new Set(existing.map((v) => v.user_id));
  const total = 30;
  const details: ImportRowResult[] = [];
  let created = 0, updated = 0, skipped = 0, failed = 0;
  const usedUsers = new Set<string>();

  for (let i = 1; i <= total; i++) {
    const u = ALL_ORG_USERS[(i - 1) % ALL_ORG_USERS.length];
    const username = u.name.toLowerCase().replace(/\s+/g, '_');
    // 模拟少量异常
    if (i === 3) {
      details.push({ row_number: i, username: '', status: 'FAILED', reason: '必填字段为空(username)' });
      failed++;
      continue;
    }
    if (i === 5) {
      details.push({ row_number: i, username: 'notexist_user', status: 'FAILED', reason: '用户名未匹配到站内用户' });
      failed++;
      continue;
    }
    if (i === 8 || i === 12) {
      details.push({ row_number: i, username, status: 'SKIPPED', reason: '数据行重复' });
      skipped++;
      continue;
    }
    if (existingUserIds.has(u.id) || usedUsers.has(u.id)) {
      // 覆盖更新
      details.push({ row_number: i, username, status: 'SUCCESS', sub_status: 'UPDATED', reason: '用户已存在分配值，已覆盖更新' });
      updated++;
      // 写入 store（更新）
      const list = STORE.get(credentialId) || [];
      const idx = list.findIndex((v) => v.user_id === u.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], account: `imported_${username}_${i}` };
      } else {
        list.unshift({
          id: `av-${credentialId}-imp-${i}`,
          user_id: u.id, user_name: u.name,
          account: `imported_${username}_${i}`, password_display: '******',
          description: `批量导入 - ${fileName}`,
        });
      }
      STORE.set(credentialId, list);
    } else {
      details.push({ row_number: i, username, status: 'SUCCESS', sub_status: 'CREATED' });
      created++;
      const list = STORE.get(credentialId) || [];
      list.unshift({
        id: `av-${credentialId}-imp-${i}`,
        user_id: u.id, user_name: u.name,
        account: `imported_${username}_${i}`, password_display: '******',
        description: `批量导入 - ${fileName}`,
      });
      STORE.set(credentialId, list);
    }
    usedUsers.add(u.id);
  }

  return {
    total,
    success: created + updated,
    created, updated, skipped, failed,
    details,
  };
};
