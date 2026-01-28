import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast, Typography, Radio, InputNumber } from '@douyinfe/semi-ui';
import type { ParameterType } from '@/api/index';

import './index.less';

interface CreateParameterModalProps {
  visible: boolean;
  context: 'development' | 'scheduling';
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateParameterModal = ({
  visible,
  context,
  onCancel,
  onSuccess,
}: CreateParameterModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [parameterType, setParameterType] = useState<ParameterType>(1);

  const handleSubmit = async (values: {
    name: string;
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

      console.log('创建参数:', {
        ...values,
        value: finalValue,
        context,
      });

      Toast.success(t('parameter.createModal.success'));
      onSuccess();
    } catch (error) {
      console.error('创建参数失败:', error);
      Toast.error(t('parameter.createModal.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (value: ParameterType) => {
    setParameterType(value);
  };

  const { Text } = Typography;

  const typeOptions = [
    { value: 1, label: t('parameter.type.text') },
    { value: 2, label: t('parameter.type.boolean') },
    { value: 3, label: t('parameter.type.number') },
  ];

  return (
    <Modal
      className="create-parameter-modal"
      title={t('parameter.createModal.title')}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={520}
    >
      <Form
        className="create-parameter-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
        initValues={{ type: 1, boolValue: 'True' }}
      >
        <Form.Input
          field="name"
          label={t('parameter.fields.name')}
          placeholder={t('parameter.fields.namePlaceholder')}
          rules={[
            { required: true, message: t('parameter.validation.nameRequired') },
            { max: 30, message: t('parameter.validation.nameLengthError') },
          ]}
          extraText={<Text type="tertiary" size="small">⚠️ {t('parameter.fields.nameHint')}</Text>}
          maxLength={30}
          showClear
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
          <Form.InputNumber
            field="numberValue"
            label={t('parameter.fields.value')}
            placeholder={t('parameter.fields.numberValuePlaceholder')}
            rules={[{ required: true, message: t('parameter.validation.valueRequired') }]}
            style={{ width: '100%' }}
          />
        )}

        <Form.TextArea
          field="description"
          label={t('common.description')}
          placeholder={t('parameter.fields.descriptionPlaceholder')}
          maxCount={2000}
          rows={3}
        />

        <div className="create-parameter-modal-footer">
          <Button theme="light" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            {t('common.confirm')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateParameterModal;
