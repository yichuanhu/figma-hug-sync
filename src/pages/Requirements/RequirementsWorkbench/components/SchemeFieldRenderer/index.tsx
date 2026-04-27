import { useEffect, useMemo } from 'react';
import { Form, Button, Toast, useFormApi, useFormState } from '@douyinfe/semi-ui';
import { Upload as UploadIcon } from 'lucide-react';
import OwnerSelect from '@/components/OwnerSelect';
import DepartmentSelect from '@/components/DepartmentSelect';
import type { SchemeField, CostConfig } from '../../types';

interface Props {
  field: SchemeField;
  /** 激活方案的 cost_config，供 source='cost_config.rate_table' 与派生提示使用 */
  costConfig?: CostConfig;
}

/**
 * Scheme 驱动的动态字段渲染器
 * 根据 SchemeField.type 渲染对应 Semi UI Form 控件，并装配校验规则。
 * 支持 ui_width（small/medium/large/full）由父级 grid 控制列占比。
 */
const SchemeFieldRenderer = ({ field, costConfig }: Props) => {
  const { key, label, type, required, placeholder, description, options, validation, unit, default: defaultValue, ui_width, source, format } = field;

  const rules: Array<Record<string, unknown>> = [];
  if (required) rules.push({ required: true, message: `请输入${label}` });
  if (validation?.min !== undefined) rules.push({ type: 'number', min: validation.min, message: validation.message ?? `不能小于 ${validation.min}` });
  if (validation?.max !== undefined) rules.push({ type: 'number', max: validation.max, message: validation.message ?? `不能大于 ${validation.max}` });
  if (validation?.minLength !== undefined) rules.push({ min: validation.minLength, message: validation.message ?? `长度不能少于 ${validation.minLength}` });
  if (validation?.maxLength !== undefined) rules.push({ max: validation.maxLength, message: validation.message ?? `长度不能超过 ${validation.maxLength}` });
  if (validation?.pattern) rules.push({ pattern: new RegExp(validation.pattern), message: validation.message ?? '格式不正确' });

  const widthClass = `scheme-field-w-${ui_width ?? 'full'}`;

  const commonProps = {
    field: key,
    label,
    placeholder: placeholder ?? `请输入${label}`,
    extraText: description,
    initValue: defaultValue,
    trigger: ['blur', 'change'] as ('blur' | 'change')[],
    rules,
  };

  const inner = (() => {
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
        return <CalculationField field={field} costConfig={costConfig} precision={format?.precision ?? 2} />;
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
      case 'select': {
        const optionList = resolveSelectOptions(field, costConfig);
        return (
          <Form.Select
            {...commonProps}
            optionList={optionList}
            style={{ width: '100%' }}
          />
        );
      }
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
        return <Form.TextArea {...commonProps} autosize={{ minRows: 4, maxRows: 10 }} maxCount={validation?.maxLength ?? 2000} showClear />;
      case 'user_select':
        return <FormBoundSelect commonProps={commonProps} fieldKey={key} label={label} placeholder={placeholder ?? `请选择${label}`} variant="user" />;
      case 'department_select':
        return <FormBoundSelect commonProps={commonProps} fieldKey={key} label={label} placeholder={placeholder ?? `请选择${label}`} variant="department" />;
      case 'text':
      default:
        return <Form.Input {...commonProps} maxLength={validation?.maxLength ?? 200} showClear />;
    }
  })();

  // 通过 div 包裹注入 ui_width class 供父级 grid 识别
  return <div className={widthClass}>{inner}{source === 'cost_config.rate_table' ? <JobLevelDailyHint fieldKey={key} costConfig={costConfig} /> : null}</div>;
};

/** 根据 source / options 解析 select 候选项 */
const resolveSelectOptions = (field: SchemeField, costConfig?: CostConfig) => {
  if (field.source === 'cost_config.rate_table' && costConfig?.rate_table) {
    return Object.keys(costConfig.rate_table).map((level) => ({
      label: costConfig.level_labels?.[level] ?? level,
      value: level,
    }));
  }
  return (field.options ?? []).map((o) => ({ label: o.label, value: o.value }));
};

/**
 * 自动计算字段：根据 expression 与 source_fields 实时计算并写回表单值。
 * 渲染为禁用的 InputNumber，不可编辑；按 precision 控制小数位。
 * 当字段 key 为 monthly_saved_hours 且存在 cost_config 与 job_level 时，
 * 在下方追加「预估月节省金额」派生提示。
 */
const CalculationField = ({ field, costConfig, precision }: { field: SchemeField; costConfig?: CostConfig; precision: number }) => {
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
      if (!/^[\d+\-*/(). ]+$/.test(expr)) return undefined;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr});`)();
      if (typeof result !== 'number' || !Number.isFinite(result)) return undefined;
      const factor = Math.pow(10, precision);
      return Math.round(result * factor) / factor;
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expression, JSON.stringify((source_fields ?? []).map((k) => values[k]))]);

  useEffect(() => {
    formApi.setValue(key, computed);
  }, [computed, key, formApi]);

  // 派生：预估月节省金额（仅 monthly_saved_hours）
  const savedAmountHint = useMemo(() => {
    if (key !== 'monthly_saved_hours' || !costConfig?.rate_table) return null;
    const jobLevel = values.job_level as string | undefined;
    if (!jobLevel) return null;
    const dailyRate = costConfig.rate_table[jobLevel];
    const wh = costConfig.working_hours_per_day || 8;
    if (!dailyRate || !computed || computed <= 0) return null;
    const amount = Math.round((computed / wh) * dailyRate);
    return `预估月节省金额 ≈ ¥${amount.toLocaleString()} / 月`;
  }, [key, computed, values.job_level, costConfig]);

  return (
    <>
      <Form.InputNumber
        field={key}
        label={label}
        disabled
        extraText={description ?? '系统自动根据上方字段计算'}
        suffix={unit ? <span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)', whiteSpace: 'nowrap' }}>{unit}</span> : undefined}
        style={{ width: '100%' }}
      />
      {savedAmountHint ? (
        <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: 'var(--semi-color-success)' }}>{savedAmountHint}</div>
      ) : null}
    </>
  );
};

/** 岗位级别选中后展示日单价提示 */
const JobLevelDailyHint = ({ fieldKey, costConfig }: { fieldKey: string; costConfig?: CostConfig }) => {
  const formState = useFormState();
  const value = (formState.values ?? {})[fieldKey] as string | undefined;
  if (!value || !costConfig?.rate_table) return null;
  const rate = costConfig.rate_table[value];
  const wh = costConfig.working_hours_per_day || 8;
  if (!rate) return null;
  return (
    <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: 'var(--semi-color-text-2)' }}>
      日成本 ¥{rate.toLocaleString()}/天 · {wh} 小时工作日
    </div>
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
