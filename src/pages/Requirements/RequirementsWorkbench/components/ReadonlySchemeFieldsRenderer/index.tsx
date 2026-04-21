/**
 * ReadonlySchemeFieldsRenderer
 * 公共只读自定义字段渲染器：根据 Scheme.custom_fields + form_data 渲染 label/value 列表。
 *
 * 用法：
 *   <ReadonlySchemeFieldsRenderer fields={scheme.custom_fields} formData={req.form_data} />
 *
 * - showEmpty=false（默认）：仅渲染有值字段；全部为空时返回 null
 * - showEmpty=true：始终渲染所有字段（无值显示 "-"），用于方案预览
 */

import { Typography } from '@douyinfe/semi-ui';
import type { SchemeField } from '../../types';
import './index.less';

const { Text } = Typography;

const formatValue = (field: SchemeField, value: unknown): string => {
  if (value === undefined || value === null || value === '') return '-';
  if (Array.isArray(value)) {
    if (field.options) {
      return value
        .map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v))
        .join('、');
    }
    return value.map((v) => String(v)).join('、');
  }
  if (field.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  if (field.type === 'percentage' && typeof value === 'number') {
    return `${value}%`;
  }
  if (field.unit && (typeof value === 'number' || typeof value === 'string')) {
    return `${value}${field.unit}`;
  }
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
};

interface Props {
  fields: SchemeField[];
  formData?: Record<string, unknown>;
  /** 是否渲染无值字段（true 用于方案预览；默认 false 仅渲染有值字段） */
  showEmpty?: boolean;
  className?: string;
}

const ReadonlySchemeFieldsRenderer = ({
  fields,
  formData = {},
  showEmpty = false,
  className,
}: Props) => {
  const visible = showEmpty
    ? fields
    : fields.filter(
        (f) => formData[f.key] !== undefined && formData[f.key] !== null && formData[f.key] !== '',
      );

  if (visible.length === 0) return null;

  return (
    <div className={`readonly-scheme-fields ${className ?? ''}`}>
      {visible.map((f) => (
        <div key={f.key} className="readonly-scheme-fields-item">
          <Text type="tertiary" size="small" className="readonly-scheme-fields-label">
            {f.label}
          </Text>
          <Text className="readonly-scheme-fields-value">
            {formatValue(f, formData[f.key])}
          </Text>
        </div>
      ))}
    </div>
  );
};

export default ReadonlySchemeFieldsRenderer;
