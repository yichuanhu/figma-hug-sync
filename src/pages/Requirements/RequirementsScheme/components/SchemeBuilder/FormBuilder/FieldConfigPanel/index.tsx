import { useMemo } from 'react';
import { Input, InputNumber, Select, Typography, Tag } from '@douyinfe/semi-ui';
import { AlertTriangle } from 'lucide-react';
import type {
  SchemeField,
  SchemeFieldType,
  SchemeFieldDependsOn,
} from '@/pages/Requirements/RequirementsWorkbench/types';
import { validateField } from '../validators';

const { Text } = Typography;

interface Props {
  field: SchemeField;
  index: number;
  allFields: SchemeField[];
  onPatch: (patch: Partial<SchemeField>) => void;
}

const TEXT_TYPES: SchemeFieldType[] = ['text', 'textarea', 'rich_text'];
const NUMBER_TYPES: SchemeFieldType[] = ['number', 'percentage'];

const OPERATORS: Array<{ value: SchemeFieldDependsOn['operator']; label: string }> = [
  { value: 'eq', label: '等于' },
  { value: 'ne', label: '不等于' },
  { value: 'in', label: '包含于（多值用英文逗号分隔）' },
  { value: 'not_in', label: '不包含于' },
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lte', label: '小于等于' },
];

const ErrorText = ({ msg }: { msg?: string }) =>
  msg ? (
    <Text type="danger" size="small" style={{ display: 'block', marginTop: 4 }}>
      {msg}
    </Text>
  ) : null;

const FieldConfigPanel = ({ field, index, allFields, onPatch }: Props) => {
  const { errors, warnings, hasError } = useMemo(
    () => validateField(field, index, allFields),
    [field, index, allFields],
  );

  const v = field.validation ?? {};
  const updateValidation = (patch: Partial<NonNullable<SchemeField['validation']>>) =>
    onPatch({ validation: { ...v, ...patch } });

  const dep = field.depends_on;
  const setDep = (next: SchemeFieldDependsOn | undefined) => onPatch({ depends_on: next });

  const showText = TEXT_TYPES.includes(field.type);
  const showNumber = NUMBER_TYPES.includes(field.type);

  return (
    <div className="field-config-panel">
      {(hasError || warnings.requiredHidden) && (
        <div className={`fcp-banner ${hasError ? 'is-error' : 'is-warning'}`}>
          <AlertTriangle size={14} strokeWidth={2} />
          <span>
            {hasError
              ? '当前配置存在问题，请修正后再保存方案'
              : warnings.requiredHidden}
          </span>
        </div>
      )}

      {/* ====== 验证规则 ====== */}
      <div className="fcp-section">
        <div className="fcp-section-title">验证规则</div>
        <div className="fcp-grid">
          {showText && (
            <>
              <div className="fcp-field">
                <label>最小长度</label>
                <InputNumber
                  value={v.minLength}
                  onChange={(val) =>
                    updateValidation({ minLength: typeof val === 'number' ? val : undefined })
                  }
                  min={0}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="fcp-field">
                <label>最大长度</label>
                <InputNumber
                  value={v.maxLength}
                  onChange={(val) =>
                    updateValidation({ maxLength: typeof val === 'number' ? val : undefined })
                  }
                  min={0}
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
          {showNumber && (
            <>
              <div className="fcp-field">
                <label>最小值</label>
                <InputNumber
                  value={v.min}
                  onChange={(val) =>
                    updateValidation({ min: typeof val === 'number' ? val : undefined })
                  }
                  style={{ width: '100%' }}
                />
              </div>
              <div className="fcp-field">
                <label>最大值</label>
                <InputNumber
                  value={v.max}
                  onChange={(val) =>
                    updateValidation({ max: typeof val === 'number' ? val : undefined })
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </>
          )}
          {!showText && !showNumber && (
            <Text type="tertiary" size="small">
              该字段类型暂无可配置的验证规则
            </Text>
          )}
          <div className="fcp-field full">
            <label>错误提示</label>
            <Input
              value={v.message ?? ''}
              onChange={(val) => updateValidation({ message: val })}
              placeholder="校验未通过时显示给填写者的文案"
            />
          </div>
        </div>
        {errors.validation?.range && <ErrorText msg={errors.validation.range} />}
        {errors.validation?.length && <ErrorText msg={errors.validation.length} />}
      </div>

      {/* ====== 依赖关系 ====== */}
      <div className="fcp-section">
        <div className="fcp-section-title">依赖关系</div>
        <div className="fcp-grid">
          <div className="fcp-field">
            <label>依赖字段</label>
            <Select
              value={dep?.field}
              showClear
              placeholder="选择前置字段"
              style={{ width: '100%' }}
              optionList={allFields
                .filter((f, i) => f.key !== field.key && i < index)
                .map((f) => ({ label: f.label, value: f.key }))}
              onChange={(val) =>
                setDep(
                  val
                    ? {
                        field: val as string,
                        operator: dep?.operator ?? 'eq',
                        value: dep?.value ?? '',
                      }
                    : undefined,
                )
              }
            />
            <ErrorText msg={errors.depends_on?.field} />
          </div>
          {dep && (
            <>
              <div className="fcp-field">
                <label>操作符</label>
                <Select
                  value={dep.operator}
                  style={{ width: '100%' }}
                  optionList={OPERATORS as Array<{ value: string; label: string }>}
                  onChange={(val) =>
                    setDep({
                      ...dep,
                      operator: val as SchemeFieldDependsOn['operator'],
                    })
                  }
                />
                <ErrorText msg={errors.depends_on?.operator} />
              </div>
              <div className="fcp-field full">
                <label>比较值</label>
                <Input
                  value={String(dep.value ?? '')}
                  onChange={(val) => setDep({ ...dep, value: val })}
                  placeholder="如 'A'，多值用英文逗号"
                />
                <ErrorText msg={errors.depends_on?.value} />
                <ErrorText msg={errors.depends_on?.cycle} />
              </div>
              <div className="fcp-field full">
                <Tag color="purple" type="light" size="small">
                  当 {allFields.find((f) => f.key === dep.field)?.label || '?'}{' '}
                  {OPERATORS.find((o) => o.value === dep.operator)?.label} {String(dep.value)} 时显示
                </Tag>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldConfigPanel;
