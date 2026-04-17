import yaml from 'js-yaml';
import type { RequirementScheme } from '../RequirementsWorkbench/types';

export interface SchemeParseError {
  line?: number;
  message: string;
}

export interface SchemeParseResult {
  ok: boolean;
  scheme?: RequirementScheme;
  errors: SchemeParseError[];
  raw: string;
}

const REQUIRED_NODES = ['meta', 'custom_fields', 'assessment_models', 'approval_flow'];
const ALLOWED_APPROVER_TYPES = ['user', 'role', 'department'];

export function parseSchemeYaml(raw: string): SchemeParseResult {
  const errors: SchemeParseError[] = [];
  let doc: Record<string, unknown>;

  try {
    doc = yaml.load(raw) as Record<string, unknown>;
  } catch (e: unknown) {
    const err = e as { mark?: { line?: number }; message?: string };
    return {
      ok: false,
      errors: [{ line: err.mark?.line !== undefined ? err.mark.line + 1 : undefined, message: err.message || 'YAML 语法错误' }],
      raw,
    };
  }

  if (!doc || typeof doc !== 'object') {
    return { ok: false, errors: [{ message: 'YAML 内容为空或格式不正确' }], raw };
  }

  for (const node of REQUIRED_NODES) {
    if (!(node in doc)) errors.push({ message: `缺少必需节点：${node}` });
  }

  const meta = doc.meta as { code?: string; name?: string; version?: string; description?: string } | undefined;
  if (meta && (!meta.code || !meta.name)) {
    errors.push({ message: 'meta 节点必须包含 code 与 name' });
  }

  const flow = doc.approval_flow as { levels?: Array<{ approver_type?: string }> } | undefined;
  if (flow?.levels) {
    flow.levels.forEach((lvl, i) => {
      if (lvl.approver_type && !ALLOWED_APPROVER_TYPES.includes(lvl.approver_type)) {
        errors.push({ message: `approval_flow.levels[${i}].approver_type 不支持："${lvl.approver_type}"，仅支持 user/role/department` });
      }
    });
  }

  if (errors.length > 0) return { ok: false, errors, raw };

  const assessmentModels = (doc.assessment_models as Record<string, unknown>) || {};
  const scheme: RequirementScheme = {
    id: `scheme-${Date.now()}`,
    code: meta!.code!,
    name: meta!.name!,
    version: meta?.version || '1.0.0',
    description: meta?.description,
    status: 'inactive',
    is_preset: false,
    meta: { code: meta!.code!, name: meta!.name!, description: meta?.description },
    custom_fields: (doc.custom_fields as RequirementScheme['custom_fields']) || [],
    value_assessment_model: assessmentModels.value as RequirementScheme['value_assessment_model'],
    complexity_assessment_model: assessmentModels.complexity as RequirementScheme['complexity_assessment_model'],
    approval_flow: (doc.approval_flow as RequirementScheme['approval_flow']) || { levels: [] },
    cost_config: doc.cost_config as RequirementScheme['cost_config'],
    raw_yaml: raw,
    created_at: new Date().toISOString(),
    created_by: 'current-user',
  };

  return { ok: true, scheme, errors: [], raw };
}
