import type { ParameterType } from '@/api/index';

export const PARAM_IMPORT_ROW_LIMIT = 500;
export const PARAM_NAME_MAX_LEN = 30;
export const PARAM_DESC_MAX_LEN = 2000;
export const PARAM_TEXT_VALUE_MAX_LEN = 65535;

export interface ParsedParameterRow {
  row_number: number;
  parameter_name: string;
  parameter_type_raw: string;
  parameter_type?: ParameterType;
  parameter_value: string;
  parameter_description?: string;
}

export type ParamImportErrorType =
  | 'EMPTY_FIELD'
  | 'NAME_TOO_LONG'
  | 'DUPLICATE_NAME'
  | 'INVALID_TYPE'
  | 'INVALID_VALUE'
  | 'DESC_TOO_LONG'
  | 'EXCEED_LIMIT';

export interface ParamImportRowError {
  row_number: number | null;
  parameter_name?: string;
  type: ParamImportErrorType;
  reason: string;
}

export interface ParamValidationResult {
  total_parsed: number;
  valid_rows: ParsedParameterRow[];
  errors: ParamImportRowError[];
  exceeded_limit: boolean;
}

const TYPE_MAP: Record<string, ParameterType> = {
  text: 1,
  string: 1,
  '文本': 1,
  '1': 1,
  boolean: 2,
  bool: 2,
  '布尔': 2,
  '2': 2,
  number: 3,
  numeric: 3,
  '数值': 3,
  '3': 3,
};

export const normalizeType = (raw: string): ParameterType | undefined => {
  const key = raw.trim().toLowerCase();
  return TYPE_MAP[key];
};

const BOOL_VALUES = new Set(['true', 'false']);

export const validateParameterImportRows = (
  rows: ParsedParameterRow[],
  existingNames: Set<string> = new Set(),
): ParamValidationResult => {
  const errors: ParamImportRowError[] = [];
  const totalParsed = rows.length;

  // 1) 必填、类型规范化
  const stepOne: ParsedParameterRow[] = [];
  rows.forEach((r) => {
    const missing: string[] = [];
    if (!r.parameter_name) missing.push('parameter_name');
    if (!r.parameter_type_raw) missing.push('parameter_type');
    if (!r.parameter_value) missing.push('parameter_value');
    if (missing.length > 0) {
      errors.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name || undefined,
        type: 'EMPTY_FIELD',
        reason: `必填字段为空：${missing.join('、')}`,
      });
      return;
    }
    if (r.parameter_name.length > PARAM_NAME_MAX_LEN) {
      errors.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        type: 'NAME_TOO_LONG',
        reason: `参数名称长度超出上限（最多 ${PARAM_NAME_MAX_LEN} 字符）`,
      });
      return;
    }
    const type = normalizeType(r.parameter_type_raw);
    if (!type) {
      errors.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        type: 'INVALID_TYPE',
        reason: `参数类型「${r.parameter_type_raw}」无效，仅支持 TEXT / BOOLEAN / NUMBER`,
      });
      return;
    }
    stepOne.push({ ...r, parameter_type: type });
  });

  // 2) 值格式
  const stepTwo: ParsedParameterRow[] = [];
  stepOne.forEach((r) => {
    const value = r.parameter_value;
    if (r.parameter_type === 2) {
      if (!BOOL_VALUES.has(value.trim().toLowerCase())) {
        errors.push({
          row_number: r.row_number,
          parameter_name: r.parameter_name,
          type: 'INVALID_VALUE',
          reason: '布尔类型参数值仅支持 True / False',
        });
        return;
      }
    } else if (r.parameter_type === 3) {
      if (!/^-?\d+(\.\d+)?$/.test(value.trim())) {
        errors.push({
          row_number: r.row_number,
          parameter_name: r.parameter_name,
          type: 'INVALID_VALUE',
          reason: '数值类型参数值必须为合法数字',
        });
        return;
      }
    } else if (r.parameter_type === 1) {
      if (value.length > PARAM_TEXT_VALUE_MAX_LEN) {
        errors.push({
          row_number: r.row_number,
          parameter_name: r.parameter_name,
          type: 'INVALID_VALUE',
          reason: `文本类型参数值长度不能超过 ${PARAM_TEXT_VALUE_MAX_LEN} 字符`,
        });
        return;
      }
    }
    if (r.parameter_description && r.parameter_description.length > PARAM_DESC_MAX_LEN) {
      errors.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        type: 'DESC_TOO_LONG',
        reason: `参数描述长度不能超过 ${PARAM_DESC_MAX_LEN} 字符`,
      });
      return;
    }
    stepTwo.push(r);
  });

  // 3) 文件内参数名重复检测
  const seen = new Map<string, number[]>();
  stepTwo.forEach((r) => {
    const key = r.parameter_name.trim().toLowerCase();
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(r.row_number);
  });
  const duplicateRows = new Set<number>();
  seen.forEach((rs, name) => {
    if (rs.length > 1) {
      rs.slice(1).forEach((rn) => {
        duplicateRows.add(rn);
        errors.push({
          row_number: rn,
          parameter_name: name,
          type: 'DUPLICATE_NAME',
          reason: `参数名称「${name}」在文件内重复`,
        });
      });
    }
  });

  const allValid = stepTwo.filter((r) => !duplicateRows.has(r.row_number));

  const exceededLimit = allValid.length > PARAM_IMPORT_ROW_LIMIT;
  const validRows = exceededLimit ? allValid.slice(0, PARAM_IMPORT_ROW_LIMIT) : allValid;

  if (exceededLimit) {
    // 每条超限行单独进入错误明细，便于用户在错误 Tab 中定位
    allValid.slice(PARAM_IMPORT_ROW_LIMIT).forEach((r) => {
      errors.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        type: 'EXCEED_LIMIT',
        reason: `超出单次导入上限 ${PARAM_IMPORT_ROW_LIMIT} 行，已自动剔除`,
      });
    });
  }

  return {
    total_parsed: totalParsed,
    valid_rows: validRows,
    errors,
    exceeded_limit: exceededLimit,
  };
};

// ============= 导入结果 =============

export interface ParamImportRowResult {
  row_number: number;
  parameter_name: string;
  status: 'SUCCESS' | 'FAILED';
  sub_status?: 'CREATED' | 'UPDATED';
  reason?: string;
}

export interface ParamImportSummary {
  total: number;
  success: number;
  created: number;
  updated: number;
  failed: number;
  details: ParamImportRowResult[];
}

export const mockImportParameters = (
  validRows: ParsedParameterRow[],
  existingNames: Set<string>,
): ParamImportSummary => {
  const details: ParamImportRowResult[] = [];
  let created = 0;
  let updated = 0;
  let failed = 0;

  validRows.forEach((r, idx) => {
    // 模拟少量服务端失败（例如权限不足）：每 50 行中第 7 行模拟失败
    if (idx > 0 && idx % 50 === 7) {
      failed++;
      details.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        status: 'FAILED',
        reason: '当前用户无该参数的写入权限',
      });
      return;
    }
    const exists = existingNames.has(r.parameter_name.trim().toLowerCase());
    if (exists) {
      updated++;
      details.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        status: 'SUCCESS',
        sub_status: 'UPDATED',
        reason: '已覆盖更新参数开发值',
      });
    } else {
      created++;
      details.push({
        row_number: r.row_number,
        parameter_name: r.parameter_name,
        status: 'SUCCESS',
        sub_status: 'CREATED',
      });
    }
  });

  return {
    total: validRows.length,
    success: created + updated,
    created,
    updated,
    failed,
    details,
  };
};
