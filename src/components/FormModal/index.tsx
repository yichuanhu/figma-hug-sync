import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Form, Button, Toast, Typography, Banner } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

import './index.less';

// 表单字段基础类型
interface BaseFieldConfig {
  field: string;
  label: string;
  placeholder?: string;
  rules?: Array<{
    required?: boolean;
    max?: number;
    min?: number;
    pattern?: RegExp;
    message?: string;
    validator?: (rule: unknown, value: unknown, callback: (error?: string) => void) => boolean;
  }>;
}

// 输入框字段
interface InputFieldConfig extends BaseFieldConfig {
  type: 'input';
  maxLength?: number;
  showClear?: boolean;
  disabled?: boolean;
}

// 文本域字段
interface TextAreaFieldConfig extends BaseFieldConfig {
  type: 'textarea';
  rows?: number;
  maxCount?: number;
  autosize?: { minRows: number; maxRows: number };
}

// 下拉选择字段
interface SelectFieldConfig extends BaseFieldConfig {
  type: 'select';
  options: Array<{ value: string | number; label: string }>;
  filter?: boolean;
  multiple?: boolean;
  disabled?: boolean;
}

// 单选组字段
interface RadioGroupFieldConfig extends BaseFieldConfig {
  type: 'radioGroup';
  options: Array<{ value: string | number; label: string }>;
  direction?: 'horizontal' | 'vertical';
}

// 只读展示字段
interface ReadonlyFieldConfig {
  type: 'readonly';
  field: string;
  label: string;
  value: string;
  hint?: string;
}

// 自定义渲染字段
interface CustomFieldConfig {
  type: 'custom';
  field: string;
  label?: string;
  render: (formApi: FormApi) => React.ReactNode;
}

// 所有字段类型联合
export type FieldConfig =
  | InputFieldConfig
  | TextAreaFieldConfig
  | SelectFieldConfig
  | RadioGroupFieldConfig
  | ReadonlyFieldConfig
  | CustomFieldConfig;

// 字段分组配置
export interface FieldSection {
  title?: string;
  fields: FieldConfig[];
}

// Banner 提示配置
export interface BannerConfig {
  type: 'info' | 'warning' | 'danger' | 'success';
  content: string | React.ReactNode;
  afterField?: string; // 在某个字段后显示
}

// FormModal 属性
export interface FormModalProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
  width?: number;
  
  // 字段配置 - 支持简单数组或分组
  fields?: FieldConfig[];
  sections?: FieldSection[];
  
  // 初始值
  initialValues?: Record<string, unknown>;
  
  // Banner 提示
  banners?: BannerConfig[];
  
  // 按钮文案
  cancelText?: string;
  submitText?: string;
  
  // 成功/失败提示
  successMessage?: string;
  errorMessage?: string;
  
  // 是否居中
  centered?: boolean;
  
  // 表单 key，用于重置表单
  formKey?: string | number;
  
  // 额外的 className
  className?: string;
}

const { Text } = Typography;

const FormModal: React.FC<FormModalProps> = ({
  visible,
  title,
  onCancel,
  onSubmit,
  width = 520,
  fields = [],
  sections,
  initialValues = {},
  banners = [],
  cancelText,
  submitText,
  successMessage,
  errorMessage,
  centered = true,
  formKey,
  className = '',
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const formApiRef = useRef<FormApi | null>(null);

  // 重置表单状态
  useEffect(() => {
    if (!visible) {
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await onSubmit(values);
      if (successMessage) {
        Toast.success(successMessage);
      }
      onCancel();
    } catch (error) {
      console.error('Form submit error:', error);
      if (errorMessage) {
        Toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // 渲染单个字段
  const renderField = (config: FieldConfig, formApi?: FormApi) => {
    switch (config.type) {
      case 'input':
        return (
          <Form.Input
            key={config.field}
            field={config.field}
            label={config.label}
            placeholder={config.placeholder}
            rules={config.rules}
            maxLength={config.maxLength}
            showClear={config.showClear}
            disabled={config.disabled}
          />
        );

      case 'textarea':
        return (
          <Form.TextArea
            key={config.field}
            field={config.field}
            label={config.label}
            placeholder={config.placeholder}
            rules={config.rules}
            rows={config.rows}
            maxCount={config.maxCount}
            autosize={config.autosize}
          />
        );

      case 'select':
        return (
          <Form.Select
            key={config.field}
            field={config.field}
            label={config.label}
            placeholder={config.placeholder}
            rules={config.rules}
            optionList={config.options}
            filter={config.filter}
            multiple={config.multiple}
            disabled={config.disabled}
          />
        );

      case 'radioGroup':
        return (
          <Form.RadioGroup
            key={config.field}
            field={config.field}
            label={config.label}
            rules={config.rules}
            direction={config.direction || 'horizontal'}
            options={config.options}
          />
        );

      case 'readonly':
        return (
          <div key={config.field} className="form-modal-readonly-field">
            <Text strong className="form-modal-readonly-label">
              {config.label}
            </Text>
            <Text className="form-modal-readonly-value">
              {config.value || '-'}
            </Text>
            {config.hint && (
              <Text type="tertiary" size="small" className="form-modal-readonly-hint">
                {config.hint}
              </Text>
            )}
          </div>
        );

      case 'custom':
        return (
          <div key={config.field} className="form-modal-custom-field">
            {config.label && (
              <div className="semi-form-field-label">
                <label>{config.label}</label>
              </div>
            )}
            {formApi && config.render(formApi)}
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染 Banner
  const renderBanner = (banner: BannerConfig) => {
    return (
      <Banner
        key={`banner-${banner.afterField || 'top'}`}
        type={banner.type}
        className="form-modal-banner"
        description={banner.content}
      />
    );
  };

  // 渲染字段列表（包含 Banner）
  const renderFieldsWithBanners = (fieldList: FieldConfig[], formApi?: FormApi) => {
    const result: React.ReactNode[] = [];
    
    // 顶部 Banner
    banners
      .filter((b) => !b.afterField)
      .forEach((banner) => result.push(renderBanner(banner)));

    fieldList.forEach((fieldConfig) => {
      result.push(renderField(fieldConfig, formApi));
      
      // 字段后的 Banner
      const afterBanners = banners.filter((b) => b.afterField === fieldConfig.field);
      afterBanners.forEach((banner) => result.push(renderBanner(banner)));
    });

    return result;
  };

  // 渲染分组字段
  const renderSections = (formApi?: FormApi) => {
    if (!sections) return null;

    return sections.map((section, index) => (
      <div key={index} className="form-modal-section">
        {section.title && (
          <div className="form-modal-section-title">
            <span className="form-modal-section-title-line" />
            <Text strong>{section.title}</Text>
          </div>
        )}
        {renderFieldsWithBanners(section.fields, formApi)}
      </div>
    ));
  };

  const allFields = sections ? sections.flatMap((s) => s.fields) : fields;
  const hasFields = allFields.length > 0;

  return (
    <Modal
      className={`form-modal ${className}`}
      title={title}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      closeOnEsc
      maskClosable={false}
      width={width}
      centered={centered}
    >
      <Form
        className="form-modal-form"
        onSubmit={handleSubmit}
        labelPosition="top"
        initValues={initialValues}
        key={formKey}
        getFormApi={(api) => {
          formApiRef.current = api;
        }}
      >
        {({ formApi }) => (
          <>
            <div className="form-modal-content">
              {sections
                ? renderSections(formApi)
                : renderFieldsWithBanners(fields, formApi)}
            </div>

            <div className="form-modal-footer">
              <Button theme="light" onClick={onCancel}>
                {cancelText || t('common.cancel')}
              </Button>
              <Button
                htmlType="submit"
                theme="solid"
                type="primary"
                loading={loading}
                disabled={!hasFields}
              >
                {submitText || t('common.confirm')}
              </Button>
            </div>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default FormModal;
