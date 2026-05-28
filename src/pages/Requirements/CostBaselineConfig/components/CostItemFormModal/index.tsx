/**
 * 成本项新建/编辑弹窗（STORY-020）
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, Form, Button, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import {
  createCostBaselineItem,
  updateCostBaselineItem,
  CostItemNameDuplicatedError,
  CURRENCY_OPTIONS,
  COST_TYPE_LABEL,
  type CostBaselineItem,
  type CostItemType,
} from '@/mocks/requirementCostBaseline';
import './index.less';

interface CostItemFormModalProps {
  visible: boolean;
  editing: CostBaselineItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface FormValues {
  cost_type: CostItemType;
  name: string;
  daily_cost: number;
  currency: string;
  description?: string;
}

const DEFAULT_VALUES: FormValues = {
  cost_type: 'role',
  name: '',
  daily_cost: 0,
  currency: 'CNY',
  description: '',
};

const CostItemFormModal = ({ visible, editing, onCancel, onSuccess }: CostItemFormModalProps) => {
  const formApiRef = useRef<FormApi<FormValues> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!editing;
  const title = isEdit ? '编辑成本项' : '新建成本项';

  const initValues: FormValues = editing
    ? {
        cost_type: editing.cost_type,
        name: editing.name,
        daily_cost: editing.daily_cost,
        currency: editing.currency,
        description: editing.description ?? '',
      }
    : DEFAULT_VALUES;

  // 关闭时重置表单
  useEffect(() => {
    if (!visible) {
      setSubmitting(false);
    }
  }, [visible]);

  const handleOk = async () => {
    const api = formApiRef.current;
    if (!api) return;
    try {
      const values = await api.validate();
      setSubmitting(true);
      const payload = {
        cost_type: values.cost_type,
        name: values.name.trim(),
        daily_cost: Number(values.daily_cost),
        currency: values.currency,
        description: values.description?.trim() || undefined,
      };
      if (isEdit && editing) {
        await updateCostBaselineItem(editing.id, payload);
        Toast.success('修改成功');
      } else {
        await createCostBaselineItem(payload);
        Toast.success('新建成功');
      }
      onSuccess();
    } catch (e) {
      if (e instanceof CostItemNameDuplicatedError) {
        api.setError('name', '成本项名称已存在');
      } else if (e && typeof e === 'object' && 'errorFields' in (e as object)) {
        // 校验失败，Semi UI 已展示字段错误
      } else {
        Toast.error((e as Error)?.message ?? '保存失败');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      className="cost-item-form-modal"
      title={title}
      visible={visible}
      onCancel={onCancel}
      maskClosable={false}
      closeOnEsc
      width={520}
      centered
      footer={
        <>
          <Button theme="light" onClick={onCancel}>
            取消
          </Button>
          <Button theme="solid" type="primary" loading={submitting} onClick={handleOk}>
            保存
          </Button>
        </>
      }
    >
      <Form<FormValues>
        labelPosition="top"
        initValues={initValues}
        key={editing?.id ?? 'new'}
        getFormApi={(api) => {
          formApiRef.current = api as FormApi<FormValues>;
        }}
      >
        <Form.RadioGroup
          field="cost_type"
          label="成本类型"
          type="button"
          options={[
            { value: 'role', label: COST_TYPE_LABEL.role },
            { value: 'activity', label: COST_TYPE_LABEL.activity },
          ]}
          rules={[{ required: true, message: '请选择成本类型' }]}
          trigger={['blur', 'change']}
        />



        <Form.Input
          field="name"
          label="成本项名称"
          placeholder="请输入成本项名称，如：财务专员"
          maxLength={100}
          showClear
          trigger={['blur', 'change']}
          rules={[
            { required: true, message: '请输入成本项名称' },
            { max: 100, message: '名称不超过 100 个字符' },
            {
              validator: (_rule, value: string) => !value || value.trim().length > 0,
              message: '名称不能仅为空白',
            },
          ]}
        />

        <Form.InputNumber
          field="daily_cost"
          label="人天成本"
          placeholder="请输入"
          min={0}
          precision={0}
          step={50}
          style={{ width: '100%' }}
          suffix={
            <span style={{ paddingRight: 8, color: 'var(--semi-color-text-2)', whiteSpace: 'nowrap' }}>
              元/人天
            </span>
          }
          trigger={['blur', 'change']}
          rules={[
            {
              required: true,
              type: 'number',
              message: '请输入人天成本',
              validator: (_r, value) => typeof value === 'number' && !Number.isNaN(value),
            },
            {
              type: 'number',
              min: 0,
              message: '人天成本必须 ≥ 0',
            },
          ]}
        />

        <Form.Select
          field="currency"
          label="币种"
          optionList={CURRENCY_OPTIONS}
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择币种' }]}
        />

        <Form.TextArea
          field="description"
          label="说明"
          placeholder="可填写成本项适用的业务场景说明（可选）"
          maxCount={500}
          maxLength={500}
          autosize={{ minRows: 3, maxRows: 6 }}
          showClear
        />
      </Form>
    </Modal>
  );
};

export default CostItemFormModal;
