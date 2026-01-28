import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast, Radio } from '@douyinfe/semi-ui';
import type { LYParameterResponse, ParameterType } from '@/api/index';

import './index.less';

interface EditParameterModalProps {
  visible: boolean;
  parameter: LYParameterResponse | null;
  context: 'development' | 'scheduling';
  onCancel: () => void;
  onSuccess: () => void;
}

const EditParameterModal = ({
  visible,
  parameter,
  context,
  onCancel,
  onSuccess,
}: EditParameterModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [parameterType, setParameterType] = useState<ParameterType>(1);

  useEffect(() => {
    if (parameter) {
      setParameterType(parameter.parameter_type);
    }
  }, [parameter]);

  const handleSubmit = async (values: {
    type: ParameterType;
    value: string;
    boolValue?: string;
    numberValue?: number;
    description?: string;
  }) => {
    setLoading(true);
    try {
      // 根据类型获取参数值
      let finalValue: string;
      if (values.type === 2) {
        finalValue = values.boolValue || 'True';
      } else if (values.type === 3) {
        finalValue = String(values.numberValue || 0);
      } else {
        finalValue = values.value || '';
      }

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('更新参数:', {
        parameter_id: parameter?.parameter_id,
        ...values,
        value: finalValue,
        context,
      });

      Toast.success(t('parameter.editModal.success'));
      onSuccess();
    } catch (error) {
      console.error('更新参数失败:', error);
      Toast.error(t('parameter.editModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: ParameterType) => {
    setParameterType(value);
  };

  const typeOptions = [
    { value: 1, label: t('parameter.type.text') },
    { value: 2, label: t('parameter.type.boolean') },
    { value: 3, label: t('parameter.type.number') },
  ];

  // 获取当前上下文对应的参数值
  const getCurrentValue = () => {
    if (!parameter) return '';
    return context === 'development' ? parameter.dev_value : parameter.prod_value;
  };

  const getInitialValues = () => {
    if (!parameter) return {};
    const currentValue = getCurrentValue();
    return {
      type: parameter.parameter_type,
      value: parameter.parameter_type === 1 ? currentValue : '',
      boolValue: parameter.parameter_type === 2 ? currentValue : 'True',
      numberValue: parameter.parameter_type === 3 ? Number(currentValue) : undefined,
      description: parameter.description || '',
    };
  };

  return (
    <Modal
      className="edit-parameter-modal"
      title={t('parameter.editModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
    >
      {parameter && (
        <Form
          className="edit-parameter-modal-form"
          onSubmit={handleSubmit}
          labelPosition="top"
          initValues={getInitialValues()}
          key={parameter.parameter_id}
        >
          <Form.Input
            field="name"
            label={t('parameter.fields.name')}
            initValue={parameter.parameter_name}
            disabled
            extraText={t('parameter.fields.nameReadonly')}
          />
          <Form.Select
            field="type"
            label={t('parameter.fields.type')}
            optionList={typeOptions}
            rules={[{ required: true, message: t('parameter.validation.typeRequired') }]}
            onChange={(value) => handleTypeChange(value as ParameterType)}
          />

          {/* 根据类型显示不同的值输入控件 */}
          {parameterType === 1 && (
            <Form.TextArea
              field="value"
              label={t('parameter.fields.value')}
              placeholder={t('parameter.fields.textValuePlaceholder')}
              rules={[
                { required: true, message: t('parameter.validation.valueRequired') },
                { max: 65535, message: t('parameter.validation.textValueLengthError') },
              ]}
              maxCount={65535}
              rows={3}
            />
          )}

          {parameterType === 2 && (
            <Form.RadioGroup
              field="boolValue"
              label={t('parameter.fields.value')}
              rules={[{ required: true, message: t('parameter.validation.valueRequired') }]}
            >
              <Radio value="True">True</Radio>
              <Radio value="False">False</Radio>
            </Form.RadioGroup>
          )}

          {parameterType === 3 && (
            <Form.Slot label={t('parameter.fields.value')}>
              <Form.InputNumber
                field="numberValue"
                placeholder={t('parameter.fields.numberValuePlaceholder')}
                rules={[{ required: true, message: t('parameter.validation.valueRequired') }]}
                style={{ width: '100%' }}
              />
            </Form.Slot>
          )}

          <Form.TextArea
            field="description"
            label={t('common.description')}
            placeholder={t('parameter.fields.descriptionPlaceholder')}
            maxCount={2000}
            rows={3}
          />

          <div className="edit-parameter-modal-footer">
            <Button theme="light" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
              {t('common.confirm')}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default EditParameterModal;
