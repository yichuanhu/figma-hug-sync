import type { SchemeField, SchemeFieldType } from '@/pages/Requirements/RequirementsWorkbench/types';

export interface FieldErrors {
  validation?: {
    range?: string;
    length?: string;
    pattern?: string;
  };
  depends_on?: {
    field?: string;
    operator?: string;
    value?: string;
    cycle?: string;
  };
}

export interface FieldWarnings {
  requiredHidden?: string;
}

export interface FieldValidateResult {
  errors: FieldErrors;
  warnings: FieldWarnings;
  hasError: boolean;
}

const TEXT_TYPES: SchemeFieldType[] = ['text', 'textarea', 'rich_text'];
const NUMBER_TYPES: SchemeFieldType[] = ['number', 'percentage'];
const COMPARABLE_OPS = ['gt', 'lt', 'gte', 'lte'];
const ARRAY_OPS = ['in', 'not_in'];

const isCyclic = (
  startKey: string,
  targetKey: string,
  fields: SchemeField[],
  visited: Set<string> = new Set(),
): boolean => {
  if (startKey === targetKey) return true;
  if (visited.has(targetKey)) return false;
  visited.add(targetKey);
  const target = fields.find((f) => f.key === targetKey);
  const dep = target?.depends_on?.field;
  if (!dep) return false;
  return isCyclic(startKey, dep, fields, visited);
};

export const validateField = (
  field: SchemeField,
  index: number,
  allFields: SchemeField[],
): FieldValidateResult => {
  const errors: FieldErrors = {};
  const warnings: FieldWarnings = {};
  const v = field.validation ?? {};

  // ===== 验证规则内部一致性 =====
  if (NUMBER_TYPES.includes(field.type)) {
    if (typeof v.min === 'number' && typeof v.max === 'number' && v.min > v.max) {
      errors.validation = { ...errors.validation, range: '最小值不能大于最大值' };
    }
  }
  if (TEXT_TYPES.includes(field.type)) {
    if (
      typeof v.minLength === 'number' &&
      typeof v.maxLength === 'number' &&
      v.minLength > v.maxLength
    ) {
      errors.validation = { ...errors.validation, length: '最小长度不能大于最大长度' };
    }
    if (v.pattern) {
      try {
        new RegExp(v.pattern);
      } catch {
        errors.validation = { ...errors.validation, pattern: '正则表达式语法错误' };
      }
    }
  }

  // ===== 依赖关系联动校验 =====
  const dep = field.depends_on;
  if (dep && dep.field) {
    const target = allFields.find((f) => f.key === dep.field);
    const targetIndex = allFields.findIndex((f) => f.key === dep.field);
    if (!target) {
      errors.depends_on = { ...errors.depends_on, field: '依赖字段已不存在，请重新选择' };
    } else {
      if (targetIndex >= index) {
        errors.depends_on = { ...errors.depends_on, field: '依赖字段必须排在当前字段之前' };
      }
      // 操作符与类型匹配
      if (COMPARABLE_OPS.includes(dep.operator)) {
        if (!NUMBER_TYPES.includes(target.type) && target.type !== 'date') {
          errors.depends_on = {
            ...errors.depends_on,
            operator: '该操作符仅适用于数值或日期字段',
          };
        }
        if (dep.value !== undefined && dep.value !== '' && Number.isNaN(Number(dep.value))) {
          errors.depends_on = { ...errors.depends_on, value: '比较值需为数字' };
        }
      }
      if (ARRAY_OPS.includes(dep.operator)) {
        if (typeof dep.value === 'string' && !dep.value.includes(',') && dep.value.length === 0) {
          errors.depends_on = { ...errors.depends_on, value: '请填写至少一个值（多个值用英文逗号分隔）' };
        }
      }
      // 循环依赖
      if (target && isCyclic(field.key, target.depends_on?.field ?? '', allFields)) {
        errors.depends_on = { ...errors.depends_on, cycle: '检测到循环依赖' };
      }
    }
  }

  // ===== Warning：必填字段配置了依赖隐藏 =====
  if (field.required && field.depends_on?.field) {
    warnings.requiredHidden = '字段被依赖隐藏时仍标记为必填，可能导致表单无法提交';
  }

  const hasError =
    !!errors.validation?.range ||
    !!errors.validation?.length ||
    !!errors.validation?.pattern ||
    !!errors.depends_on?.field ||
    !!errors.depends_on?.operator ||
    !!errors.depends_on?.value ||
    !!errors.depends_on?.cycle;

  return { errors, warnings, hasError };
};

export interface AllFieldsValidateResult {
  perField: Record<string, FieldValidateResult>;
  errorFieldKeys: string[];
  hasError: boolean;
}

export const validateAllFields = (fields: SchemeField[]): AllFieldsValidateResult => {
  const perField: Record<string, FieldValidateResult> = {};
  const errorFieldKeys: string[] = [];
  fields.forEach((f, i) => {
    const r = validateField(f, i, fields);
    perField[f.key] = r;
    if (r.hasError) errorFieldKeys.push(f.key);
  });
  return { perField, errorFieldKeys, hasError: errorFieldKeys.length > 0 };
};
