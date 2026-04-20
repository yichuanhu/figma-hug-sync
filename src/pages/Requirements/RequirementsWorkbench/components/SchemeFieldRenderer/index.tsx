import { Form } from '@douyinfe/semi-ui';
import type { SchemeField } from '../../types';

interface Props {
  field: SchemeField;
}

/**
 * Scheme 驱动的动态字段渲染器
 * 根据 SchemeField.type 渲染对应 Semi UI Form 控件，并装配校验规则。
 */
const SchemeFieldRenderer = ({ field }: Props) => {
  const { key, label, type, required, placeholder, description, options, validation, unit, default: defaultValue } = field;

  const rules: Array<Record<string, unknown>> = [];
  if (required) rules.push({ required: true, message: `请输入${label}` });
  if (validation?.min !== undefined) rules.push({ type: 'number', min: validation.min, message: validation.message ?? `不能小于 ${validation.min}` });
  if (validation?.max !== undefined) rules.push({ type: 'number', max: validation.max, message: validation.message ?? `不能大于 ${validation.max}` });
  if (validation?.minLength !== undefined) rules.push({ min: validation.minLength, message: validation.message ?? `长度不能少于 ${validation.minLength}` });
  if (validation?.maxLength !== undefined) rules.push({ max: validation.maxLength, message: validation.message ?? `长度不能超过 ${validation.maxLength}` });
  if (validation?.pattern) rules.push({ pattern: new RegExp(validation.pattern), message: validation.message ?? '格式不正确' });

  const commonProps = {
    field: key,
    label,
    placeholder: placeholder ?? `请输入${label}`,
    extraText: description,
    initValue: defaultValue,
    trigger: ['blur', 'change'] as ('blur' | 'change')[],
    rules,
  };

  switch (type) {
    case 'number':
      return (
        <Form.InputNumber
          {...commonProps}
          min={validation?.min}
          max={validation?.max}
          suffix={unit ? <span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)', whiteSpace: 'nowrap' }}>{unit}</span> : undefined}
          style={{ width: '100%' }}
        />
      );
    case 'percentage':
      return (
        <Form.InputNumber
          {...commonProps}
          min={validation?.min ?? 0}
          max={validation?.max ?? 100}
          suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)' }}>%</span>}
          style={{ width: '100%' }}
        />
      );
    case 'select':
      return (
        <Form.Select
          {...commonProps}
          optionList={(options ?? []).map((o) => ({ label: o.label, value: o.value }))}
          style={{ width: '100%' }}
        />
      );
    case 'multi_select':
      return (
        <Form.Select
          {...commonProps}
          multiple
          optionList={(options ?? []).map((o) => ({ label: o.label, value: o.value }))}
          style={{ width: '100%' }}
        />
      );
    case 'radio':
      return (
        <Form.RadioGroup {...commonProps}>
          {(options ?? []).map((o) => (
            <Form.Radio key={String(o.value)} value={o.value}>{o.label}</Form.Radio>
          ))}
        </Form.RadioGroup>
      );
    case 'checkbox_group':
      return (
        <Form.CheckboxGroup {...commonProps}>
          {(options ?? []).map((o) => (
            <Form.Checkbox key={String(o.value)} value={o.value}>{o.label}</Form.Checkbox>
          ))}
        </Form.CheckboxGroup>
      );
    case 'date':
      return <Form.DatePicker {...commonProps} type="date" style={{ width: '100%' }} />;
    case 'textarea':
      return <Form.TextArea {...commonProps} autosize={{ minRows: 2, maxRows: 4 }} maxCount={2000} showClear />;
    case 'text':
    default:
      return <Form.Input {...commonProps} maxLength={validation?.maxLength ?? 200} showClear />;
  }
};

export default SchemeFieldRenderer;
