import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Tabs, TabPane, Form, Button, Toast, Typography, Tag } from '@douyinfe/semi-ui';
import { Plus, Trash2 } from 'lucide-react';
import type {
  SchemeField,
  SchemeFieldType,
  SchemeFieldOption,
  SchemeFieldDependsOn,
} from '@/pages/Requirements/RequirementsWorkbench/types';

const { Text } = Typography;

interface Props {
  visible: boolean;
  field: SchemeField | null;
  allFields: SchemeField[];
  onClose: () => void;
  onSubmit: (updated: SchemeField) => void;
}

const HAS_OPTIONS: SchemeFieldType[] = ['select', 'multi_select', 'radio', 'checkbox_group'];
const IS_TEXT: SchemeFieldType[] = ['text', 'textarea'];
const IS_NUMBER: SchemeFieldType[] = ['number', 'percentage'];

const OPERATORS = [
  { value: 'eq', label: '等于' },
  { value: 'ne', label: '不等于' },
  { value: 'in', label: '包含于' },
  { value: 'not_in', label: '不包含于' },
  { value: 'gt', label: '大于' },
  { value: 'lt', label: '小于' },
  { value: 'gte', label: '大于等于' },
  { value: 'lte', label: '小于等于' },
];

const FieldConfigModal = ({ visible, field, allFields, onClose, onSubmit }: Props) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<SchemeField | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (visible && field) {
      setDraft({ ...field });
      setActiveTab('basic');
    }
  }, [visible, field]);

  const validationError = useMemo(() => {
    if (!draft) return '';
    const v = draft.validation;
    if (v?.min !== undefined && v?.max !== undefined && v.min > v.max) {
      return t('requirements.scheme.builder.errors.minGtMax');
    }
    if (v?.minLength !== undefined && v?.maxLength !== undefined && v.minLength > v.maxLength) {
      return t('requirements.scheme.builder.errors.minLenGtMaxLen');
    }
    if (!draft.key.trim()) return t('requirements.scheme.builder.errors.keyRequired');
    if (!draft.label.trim()) return t('requirements.scheme.builder.errors.labelRequired');
    return '';
  }, [draft, t]);

  if (!draft) return null;

  const update = (patch: Partial<SchemeField>) => setDraft({ ...draft, ...patch });
  const updateValidation = (patch: Partial<NonNullable<SchemeField['validation']>>) =>
    update({ validation: { ...(draft.validation ?? {}), ...patch } });

  const handleOk = () => {
    if (validationError) {
      Toast.error(validationError);
      return;
    }
    onSubmit(draft);
  };

  const renderOptions = () => (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Text strong>选项</Text>
      </div>
      {(draft.options ?? []).map((opt, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
          <Form.Input field={`opt_label_${i}`} initValue={opt.label} placeholder="标签" noLabel
            onChange={(v: string) => update({ options: draft.options!.map((o, idx) => idx === i ? { ...o, label: v } : o) })} style={{ flex: 1 }} />
          <Form.Input field={`opt_value_${i}`} initValue={String(opt.value)} placeholder="值" noLabel
            onChange={(v: string) => update({ options: draft.options!.map((o, idx) => idx === i ? { ...o, value: v } : o) })} style={{ flex: 1 }} />
          <Button icon={<Trash2 size={14} strokeWidth={2} />} theme="borderless" type="danger" size="small"
            onClick={() => update({ options: draft.options!.filter((_, idx) => idx !== i) })} />
        </div>
      ))}
      <Button icon={<Plus size={14} strokeWidth={2} />} theme="borderless" size="small"
        onClick={() => update({ options: [...(draft.options ?? []), { label: `选项${(draft.options?.length ?? 0) + 1}`, value: `option${(draft.options?.length ?? 0) + 1}` } as SchemeFieldOption] })}>
        添加选项
      </Button>
    </div>
  );

  return (
    <Modal
      title={t('requirements.scheme.builder.fieldConfig.title', { name: draft.label })}
      visible={visible}
      onCancel={onClose}
      onOk={handleOk}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      width={620}
      maskClosable={false}
      okButtonProps={{ disabled: !!validationError }}
    >
      {validationError && (
        <div style={{ background: 'var(--semi-color-danger-light-default)', color: 'var(--semi-color-danger)', padding: '6px 10px', borderRadius: 4, marginBottom: 12, fontSize: 12 }}>
          {validationError}
        </div>
      )}
      <Tabs type="line" activeKey={activeTab} onChange={setActiveTab}>
        {/* 基本信息 */}
        <TabPane tab={t('requirements.scheme.builder.fieldConfig.basic')} itemKey="basic">
          <Form labelPosition="left" labelWidth={100}>
            <Form.Input field="key" label="字段名称" initValue={draft.key} onChange={(v: string) => update({ key: v })} />
            <Form.Input field="label" label="显示标签" initValue={draft.label} onChange={(v: string) => update({ label: v })} />
            <Form.Input field="type" label="字段类型" initValue={draft.type} disabled />
            <Form.Input field="placeholder" label="占位符" initValue={draft.placeholder} onChange={(v: string) => update({ placeholder: v })} />
            <Form.TextArea field="description" label="字段说明" initValue={draft.description} onChange={(v: string) => update({ description: v })} maxCount={500} maxLength={500} />
            <Form.Switch field="required" label="是否必填" initValue={draft.required} onChange={(v: boolean) => update({ required: v })} />
            {draft.type === 'number' || draft.type === 'percentage' ? (
              <Form.Input field="unit" label="单位" initValue={draft.unit} onChange={(v: string) => update({ unit: v })} />
            ) : null}
            {HAS_OPTIONS.includes(draft.type) && renderOptions()}
            {draft.type === 'calculation' && (
              <Form.TextArea field="expression" label="表达式" initValue={draft.expression}
                placeholder="如 {a} * {b} / 60"
                onChange={(v: string) => update({ expression: v })} />
            )}
          </Form>
        </TabPane>

        {/* 验证规则 */}
        <TabPane tab={t('requirements.scheme.builder.fieldConfig.validation')} itemKey="validation">
          <Form labelPosition="left" labelWidth={120}>
            {IS_TEXT.includes(draft.type) && (
              <>
                <Form.InputNumber field="minLength" label="最小长度" initValue={draft.validation?.minLength}
                  onChange={(v) => updateValidation({ minLength: v as number })} min={0} />
                <Form.InputNumber field="maxLength" label="最大长度" initValue={draft.validation?.maxLength}
                  onChange={(v) => updateValidation({ maxLength: v as number })} min={0} />
                <Form.Input field="pattern" label="正则表达式" initValue={draft.validation?.pattern}
                  onChange={(v: string) => updateValidation({ pattern: v })} />
              </>
            )}
            {IS_NUMBER.includes(draft.type) && (
              <>
                <Form.InputNumber field="min" label="最小值" initValue={draft.validation?.min}
                  onChange={(v) => updateValidation({ min: v as number })} />
                <Form.InputNumber field="max" label="最大值" initValue={draft.validation?.max}
                  onChange={(v) => updateValidation({ max: v as number })} />
              </>
            )}
            <Form.Input field="message" label="错误提示" initValue={draft.validation?.message}
              onChange={(v: string) => updateValidation({ message: v })} />
          </Form>
        </TabPane>

        {/* UI 配置 */}
        <TabPane tab={t('requirements.scheme.builder.fieldConfig.ui')} itemKey="ui">
          <Form labelPosition="left" labelWidth={100}>
            <Form.Select field="ui_width" label="字段宽度" initValue={draft.ui_width ?? 'full'}
              onChange={(v) => update({ ui_width: v as SchemeField['ui_width'] })}
              optionList={[
                { label: '小 (small)', value: 'small' },
                { label: '中 (medium)', value: 'medium' },
                { label: '大 (large)', value: 'large' },
                { label: '满宽 (full)', value: 'full' },
              ]} />
          </Form>
        </TabPane>

        {/* 默认值 */}
        <TabPane tab={t('requirements.scheme.builder.fieldConfig.default')} itemKey="default">
          <Form labelPosition="left" labelWidth={100}>
            <Form.Input field="default" label="默认值" initValue={String(draft.default ?? '')}
              onChange={(v: string) => update({ default: v })} />
            <Text type="tertiary" size="small">不同字段类型解释不同：text 为字符串、number 为数字、checkbox 为 true/false 等</Text>
          </Form>
        </TabPane>

        {/* 依赖关系 */}
        <TabPane tab={t('requirements.scheme.builder.fieldConfig.depends')} itemKey="depends">
          <Form labelPosition="left" labelWidth={100}>
            <Form.Select field="dep_field" label="依赖字段" initValue={draft.depends_on?.field} showClear
              optionList={allFields.filter((f) => f.key !== draft.key).map((f) => ({ label: f.label, value: f.key }))}
              onChange={(v) => update({ depends_on: v ? { field: v as string, operator: draft.depends_on?.operator ?? 'eq', value: draft.depends_on?.value ?? '' } : undefined })} />
            {draft.depends_on && (
              <>
                <Form.Select field="dep_op" label="操作符" initValue={draft.depends_on.operator}
                  optionList={OPERATORS}
                  onChange={(v) => update({ depends_on: { ...draft.depends_on!, operator: v as SchemeFieldDependsOn['operator'] } })} />
                <Form.Input field="dep_value" label="比较值" initValue={String(draft.depends_on.value)}
                  onChange={(v: string) => update({ depends_on: { ...draft.depends_on!, value: v } })} />
                <Tag color="purple" type="light" size="small" style={{ marginLeft: 100 }}>
                  当{allFields.find((f) => f.key === draft.depends_on!.field)?.label} {OPERATORS.find((o) => o.value === draft.depends_on!.operator)?.label} {String(draft.depends_on.value)} 时显示
                </Tag>
              </>
            )}
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default FieldConfigModal;
