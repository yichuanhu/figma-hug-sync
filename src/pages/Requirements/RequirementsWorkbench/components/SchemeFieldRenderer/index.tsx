import { useEffect, useMemo } from 'react';
import { Form, Upload, Button, Toast, useFormApi, useFormState } from '@douyinfe/semi-ui';
import { Upload as UploadIcon } from 'lucide-react';
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
          suffix={<span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)', whiteSpace: 'nowrap' }}>%</span>}
          style={{ width: '100%' }}
        />
      );
    case 'calculation':
      return <CalculationField field={field} />;
    case 'file_upload':
      return <FileUploadField field={field} commonProps={commonProps} />;
    case 'rich_text':
      return (
        <Form.TextArea
          {...commonProps}
          autosize={{ minRows: 4, maxRows: 8 }}
          maxCount={5000}
          showClear
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

/**
 * 自动计算字段：根据 expression 与 source_fields 实时计算并写回表单值。
 * 渲染为禁用的 InputNumber，不可编辑。
 */
const CalculationField = ({ field }: { field: SchemeField }) => {
  const { key, label, unit, expression, source_fields, description } = field;
  const formApi = useFormApi();
  const formState = useFormState();
  const values = formState.values ?? {};

  const computed = useMemo(() => {
    if (!expression) return undefined;
    let expr = expression;
    (source_fields ?? []).forEach((srcKey) => {
      const v = Number(values[srcKey] ?? 0);
      expr = expr.replace(new RegExp(`\\{${srcKey}\\}`, 'g'), String(Number.isFinite(v) ? v : 0));
    });
    try {
      // 仅允许数字与四则运算字符
      if (!/^[\d+\-*/(). ]+$/.test(expr)) return undefined;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr});`)();
      if (typeof result !== 'number' || !Number.isFinite(result)) return undefined;
      return Math.round(result * 100) / 100;
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expression, JSON.stringify((source_fields ?? []).map((k) => values[k]))]);

  useEffect(() => {
    formApi.setValue(key, computed);
  }, [computed, key, formApi]);

  return (
    <Form.InputNumber
      field={key}
      label={label}
      disabled
      extraText={description ?? '系统自动根据上方字段计算'}
      suffix={unit ? <span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)', whiteSpace: 'nowrap' }}>{unit}</span> : undefined}
      style={{ width: '100%' }}
    />
  );
};

/**
 * 文件上传字段：使用 Semi UI Upload，最多 5 个 / 单文件 10MB。
 */
const FileUploadField = ({
  field,
  commonProps,
}: {
  field: SchemeField;
  commonProps: Record<string, unknown>;
}) => {
  return (
    <Form.Upload
      {...commonProps}
      field={field.key}
      action=""
      limit={5}
      maxSize={10240}
      draggable={false}
      listType="list"
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.zip,.rar,.txt,.csv"
      onExceed={() => Toast.warning('最多上传 5 个文件')}
      onSizeError={() => Toast.warning('文件大小不能超过 10MB')}
    >
      <Button icon={<UploadIcon size={14} strokeWidth={2} />} theme="light" type="tertiary">
        点击上传
      </Button>
    </Form.Upload>
  );
};

export default SchemeFieldRenderer;
