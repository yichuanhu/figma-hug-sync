import { useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Popover, Tag, Space, useFormApi } from '@douyinfe/semi-ui';
import { IconHelpCircle } from '@douyinfe/semi-icons';
import React from 'react';
import type { LYInputParameterItem, LYOutputParameterItem } from '../../types';
import './index.less';

interface PasswordInputState {
  isFirstClick: boolean;
  originalEncryptedPassword: string;
}

interface ParameterInputProps {
  inputParameters?: LYInputParameterItem[] | null;
  outputParameters?: LYOutputParameterItem[] | null;
}

// 标签组件
const ParameterLabel = ({ parameter }: { parameter: LYInputParameterItem }) => (
  <div className="parameter-input-label">
    <Space>
      <span className="parameter-input-label-name">{parameter.name}</span>
      <Tag size="small" color="grey" className="parameter-input-label-type">
        {parameter.category.toUpperCase()}
      </Tag>
      {parameter.description && (
        <Popover
          showArrow
          content={parameter.description}
          position="bottom"
          trigger="hover"
          className="parameter-label-description"
        >
          <IconHelpCircle size="small" style={{ color: 'var(--semi-color-text-2)', cursor: 'pointer' }} />
        </Popover>
      )}
    </Space>
  </div>
);

// 输出参数标签组件（不显示类型）
const OutputParameterLabel = ({ parameter }: { parameter: LYOutputParameterItem }) => (
  <div className="parameter-input-label">
    <Space>
      <span className="parameter-input-label-name">{parameter.name}</span>
      {parameter.description && (
        <Popover
          showArrow
          content={parameter.description}
          position="top"
          trigger="click"
          className="parameter-label-description"
        >
          <IconHelpCircle size="small" style={{ color: 'var(--semi-color-text-2)', cursor: 'pointer' }} />
        </Popover>
      )}
    </Space>
  </div>
);

// String 类型输入组件
const StringParameterInput = ({ parameter, index, placeholder }: { parameter: LYInputParameterItem; index: number; placeholder: string }) => (
  <Form.TextArea
    field={`input_parameter_values[${index}].value`}
    label={<ParameterLabel parameter={parameter} />}
    placeholder={placeholder}
    initValue={parameter.value}
    showClear
  />
);

// Number 类型输入组件
const NumberParameterInput = ({ parameter, index, placeholder }: { parameter: LYInputParameterItem; index: number; placeholder: string }) => (
  <Form.InputNumber
    field={`input_parameter_values[${index}].value`}
    label={<ParameterLabel parameter={parameter} />}
    placeholder={placeholder}
    style={{ width: '100%' }}
    initValue={parameter.value}
    showClear
  />
);

// Boolean 类型输入组件
const BooleanParameterInput = ({ parameter, index }: { parameter: LYInputParameterItem; index: number }) => (
  <Form.Switch
    field={`input_parameter_values[${index}].value`}
    label={<ParameterLabel parameter={parameter} />}
    initValue={parameter.value === 'True'}
    size="small"
  />
);

// Credential 类型输入组件
const CredentialParameterInput = ({
  parameter,
  index,
  userPlaceholder,
  passwordPlaceholder,
  formApi,
  passwordState,
}: {
  parameter: LYInputParameterItem;
  index: number;
  userPlaceholder: string;
  passwordPlaceholder: string;
  formApi: any;
  passwordState: PasswordInputState;
}) => (
  <React.Fragment key={parameter.id}>
    <Form.Input
      field={`input_parameter_values[${index}].credential_value.user`}
      placeholder={userPlaceholder}
      maxLength={100}
      showClear
      label={<ParameterLabel parameter={parameter} />}
      className="parameter-input-credential-field"
      initValue={parameter.credential_value?.user}
    />
    <Form.Input
      field={`input_parameter_values[${index}].credential_value.password`}
      mode="password"
      placeholder={passwordPlaceholder}
      maxLength={100}
      showClear
      noLabel
      className="parameter-input-credential-field"
      initValue={'••••••'}
      onFocus={() => {
        if (passwordState.isFirstClick && formApi) {
          formApi.setValue(`input_parameter_values[${index}].credential_value.password`, '');
        }
      }}
      onChange={() => {
        if (passwordState.isFirstClick) {
          passwordState.isFirstClick = false;
        }
      }}
      onBlur={() => {
        if (passwordState.isFirstClick && formApi) {
          formApi.setValue(`input_parameter_values[${index}].credential_value.password`, '••••••');
        }
      }}
    />
  </React.Fragment>
);

const ParameterInput = ({ inputParameters, outputParameters }: ParameterInputProps) => {
  const { t } = useTranslation();
  const formApi = useFormApi();
  const passwordStates = useRef<Record<number, PasswordInputState>>({});

  const getPasswordState = (index: number, originalPassword: string): PasswordInputState => {
    if (!passwordStates.current[index]) {
      passwordStates.current[index] = {
        isFirstClick: true,
        originalEncryptedPassword: originalPassword,
      };
    }
    return passwordStates.current[index];
  };

  useMemo(() => {
    inputParameters?.forEach((param, index) => {
      if (param.category === 'credential') {
        getPasswordState(index, param.credential_value?.password || '');
      }
    });
  }, [inputParameters]);

  return (
    <>
      {/* 流程输入 */}
      {!!inputParameters?.length && (
        <div className="task-template-section">
          <div className="task-template-section-title">{t('template.createModal.parametersSection')}</div>
          <div className="task-template-params">
            {inputParameters.map((parameter, index) => {
              const placeholder = t('template.validation.parameterPlaceholder', { name: parameter.name });

              switch (parameter.category) {
                case 'string':
                  return <StringParameterInput key={parameter.id} parameter={parameter} index={index} placeholder={placeholder} />;

                case 'number':
                  return <NumberParameterInput key={parameter.id} parameter={parameter} index={index} placeholder={placeholder} />;

                case 'boolean':
                  return <BooleanParameterInput key={parameter.id} parameter={parameter} index={index} />;

                case 'credential': {
                  const passwordState = getPasswordState(index, parameter.credential_value?.password || '');
                  return (
                    <CredentialParameterInput
                      key={parameter.id}
                      parameter={parameter}
                      index={index}
                      userPlaceholder={t('template.validation.credentialUserPlaceholder')}
                      passwordPlaceholder={t('template.validation.credentialPasswordPlaceholder')}
                      formApi={formApi}
                      passwordState={passwordState}
                    />
                  );
                }

                default:
                  return null;
              }
            })}
          </div>
        </div>
      )}

      {/* 流程输出（只读） */}
      {!!outputParameters?.length && (
        <div className="task-template-section">
          <div className="task-template-section-title">{t('template.createModal.outputParametersSection')}</div>
          <div className="task-template-params">
            {outputParameters.map((parameter, index) => {
              const placeholder = t('template.validation.parameterPlaceholder', { name: parameter.name });

              return (
                <Form.Input
                  key={parameter.id}
                  field={`output_parameter_values[${index}].value`}
                  label={<OutputParameterLabel parameter={parameter} />}
                  placeholder={placeholder}
                  maxLength={2000}
                  initValue={parameter.value}
                  disabled
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default ParameterInput;
