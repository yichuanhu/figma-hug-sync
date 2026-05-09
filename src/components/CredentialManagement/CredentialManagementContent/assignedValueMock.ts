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

// ============= 前端解析 / 校验 =============

export const IMPORT_ROW_LIMIT = 500;

export interface ParsedRow {
  row_number: number; // 数据行号（从 2 开始，1 是表头）
  username: string;
  account: string;
  password: string;
  description?: string;
}

export type ImportErrorType =
  | 'EMPTY_FIELD'
  | 'DUPLICATE_USERNAME'
  | 'EXCEED_LIMIT';

export interface ImportRowError {
  row_number: number | null; // 行号；EXCEED_LIMIT 不指向具体行
  username?: string;
  type: ImportErrorType;
  reason: string;
}

export interface ValidationResult {
  total_parsed: number; // 解析出的数据行总数（含错误）
  valid_rows: ParsedRow[];
  errors: ImportRowError[];
  exceeded_limit: boolean;
}

export const validateImportRows = (rawRows: ParsedRow[]): ValidationResult => {
  const errors: ImportRowError[] = [];
  const totalParsed = rawRows.length;

  // 1) 空字段
  const fieldOkRows: ParsedRow[] = [];
  rawRows.forEach((r) => {
    const missing: string[] = [];
    if (!r.username) missing.push('username');
    if (!r.account) missing.push('account');
    if (!r.password) missing.push('password');
    if (missing.length > 0) {
      errors.push({
        row_number: r.row_number,
        username: r.username || undefined,
        type: 'EMPTY_FIELD',
        reason: `必填字段为空：${missing.join('、')}`,
      });
    } else {
      fieldOkRows.push(r);
    }
  });

  // 2) 用户名重复（在所有非空 username 中检测）
  const seen = new Map<string, number[]>(); // username -> row_numbers
  fieldOkRows.forEach((r) => {
    const key = r.username.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(r.row_number);
  });

  const duplicateRowNumbers = new Set<number>();
  seen.forEach((rows, name) => {
    if (rows.length > 1) {
      // 第一行保留，其余标记为重复
      rows.slice(1).forEach((rn) => {
        duplicateRowNumbers.add(rn);
        errors.push({
          row_number: rn,
          username: name,
          type: 'DUPLICATE_USERNAME',
          reason: `用户名「${name}」在文件内重复`,
        });
      });
    }
  });

  const allValidRows = fieldOkRows.filter((r) => !duplicateRowNumbers.has(r.row_number));

  // 仅对"有效数据"应用 500 行上限：超出部分截断，但提示用户
  const exceededLimit = allValidRows.length > IMPORT_ROW_LIMIT;
  const validRows = exceededLimit ? allValidRows.slice(0, IMPORT_ROW_LIMIT) : allValidRows;

  if (exceededLimit) {
    errors.push({
      row_number: null,
      type: 'EXCEED_LIMIT',
      reason: `单次导入有效数据上限 ${IMPORT_ROW_LIMIT} 行，已截断 ${allValidRows.length - IMPORT_ROW_LIMIT} 行（仅前 ${IMPORT_ROW_LIMIT} 行有效数据将被导入）`,
    });
  }

  return {
    total_parsed: totalParsed,
    valid_rows: validRows,
    errors,
    exceeded_limit: exceededLimit,
  };
};

// ============= Mock 后端导入结果（仅处理前端过滤后的有效行）=============

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

/** Mock 导入：基于已通过前端校验的行，生成结果并写入 store */
export const mockImport = (
  credentialId: string,
  fileName: string,
  validRows: ParsedRow[],
): ImportSummary => {
  const existing = listAssignedValues(credentialId);
  const existingUserIds = new Set(existing.map((v) => v.user_id));

  const details: ImportRowResult[] = [];
  let created = 0, updated = 0, skipped = 0, failed = 0;
  const usedUserIds = new Set<string>();

  validRows.forEach((r) => {
    const matched = ALL_ORG_USERS.find(
      (u) => u.name.toLowerCase().replace(/\s+/g, '_') === r.username.toLowerCase()
        || u.name.toLowerCase() === r.username.toLowerCase()
        || u.id === r.username,
    );

    if (!matched) {
      failed++;
      details.push({
        row_number: r.row_number,
        username: r.username,
        status: 'FAILED',
        reason: '用户名未匹配到站内用户',
      });
      return;
    }

    const list = STORE.get(credentialId) || [];
    if (existingUserIds.has(matched.id) || usedUserIds.has(matched.id)) {
      updated++;
      details.push({
        row_number: r.row_number,
        username: r.username,
        status: 'SUCCESS',
        sub_status: 'UPDATED',
        reason: '用户已存在分配值，已覆盖更新',
      });
      const idx = list.findIndex((v) => v.user_id === matched.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], account: r.account, description: r.description || list[idx].description };
      }
    } else {
      created++;
      details.push({
        row_number: r.row_number,
        username: r.username,
        status: 'SUCCESS',
        sub_status: 'CREATED',
      });
      list.unshift({
        id: `av-${credentialId}-imp-${Date.now()}-${r.row_number}`,
        user_id: matched.id,
        user_name: matched.name,
        account: r.account,
        password_display: '******',
        description: r.description || `批量导入 - ${fileName}`,
      });
    }
    usedUserIds.add(matched.id);
    STORE.set(credentialId, list);
  });

  return {
    total: validRows.length,
    success: created + updated,
    created,
    updated,
    skipped,
    failed,
    details,
  };
};
