import { useState, useCallback, useImperativeHandle, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Radio, Select, Spin, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import { useGetProcesses, useGetProcessVersion, useGetWorkerGroups, useWorkerGroupsTree, encrypt } from './hooks/useTaskFormData';
import ParameterInput from './components/ParameterInput';
import {
  TaskFormSource,
  Priority,
  type TaskFormProps,
  type ITaskInfo,
  type LYInputParameterItem,
  type LYOutputParameterItem,
  type LYProcessResponse,
  type ExecutionTargetType,
} from './types';
import './index.less';

const { Text } = Typography;

const TaskForm = (props: TaskFormProps) => {
  const { t } = useTranslation();
  const { taskRef, params, showParamsHandle, source, preFormItem, bottomFormItem, showRightPanel } = props;
  const [formApi, setFormApi] = useState<FormApi<ITaskInfo> | null>(null);
  const [selectedProcess, setSelectedProcess] = useState<LYProcessResponse | null>(null);
  const [targetType, setTargetType] = useState<ExecutionTargetType>('worker');
  const [inputParameters, setInputParameters] = useState<LYInputParameterItem[]>([]);
  const [outputParameters, setOutputParameters] = useState<LYOutputParameterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pendingValidation, setPendingValidation] = useState<ITaskInfo | null>(null);

  // 获取流程列表
  const { data: processData, isLoading: isLoadingProcess } = useGetProcesses({
    offset: 0,
    size: 2000,
    status: 'PUBLISHED',
  });

  // 获取流程版本详情
  const { data: versionDetail } = useGetProcessVersion(selectedProcess?.current_version_id || '', !!processData);

  // 获取机器人组列表
  const { data: workerGroupList, isLoading: isLoadingWorkerGroups } = useGetWorkerGroups(
    { size: 100, offset: 0 },
    targetType === 'worker_group'
  );

  // 获取机器人组树形结构
  const { data: workerGroupsTree, isLoading: isLoadingWorkerTree } = useWorkerGroupsTree(targetType === 'worker');

  // 整理输入参数值
  const getInputParameterValues = useCallback(
    (values: ITaskInfo): LYInputParameterItem[] => {
      return inputParameters.map((params, index) => {
        const formValue = values.input_parameter_values?.[index];
        if (params.category === 'boolean') {
          return { ...params, value: formValue?.value ? 'True' : 'False' };
        }
        if (params.category === 'credential') {
          const password = formValue?.credential_value?.password;
          const encryptedPassword = password && password !== '••••••' ? encrypt(password) : params.credential_value?.password || '';
          return {
            ...params,
            value: '',
            credential_value: {
              user: formValue?.credential_value?.user || params.credential_value?.user || '',
              password: encryptedPassword,
            },
          };
        }
        return { ...params, value: (formValue?.value ?? '')?.toString() || '' };
      });
    },
    [inputParameters]
  );

  // 整理 worker 相关值
  const getWorkerData = useCallback(
    (values: ITaskInfo) => {
      if (targetType === 'worker_group') {
        return {
          worker_id: null,
          worker_name: null,
          worker_group_name: workerGroupList.find(x => x.id === values.worker_group_id)?.name || null,
        };
      }
      // worker 模式
      if (!values.worker_id) {
        return {
          worker_group_id: null,
          worker_group_name: null,
          worker_id: '000',
          worker_name: null,
        };
      }
      const [groupId, workerId] = values.worker_id as string[];
      let group = workerGroupsTree.find(g => g.group_id === groupId);
      if (!group) {
        group = workerGroupsTree.find(g => !g.group_id);
      }
      const worker = group?.members?.find(m => m.worker_id === workerId);
      return {
        worker_group_id: groupId === '0' ? null : groupId,
        worker_group_name: group?.group_name || null,
        worker_id: workerId,
        worker_name: worker?.name,
      };
    },
    [targetType, workerGroupList, workerGroupsTree]
  );

  // 初始化表单
  const initForm = useCallback(() => {
    if (formApi) {
      formApi.reset();
      if (params) {
        setLoading(true);
        setTargetType(params.worker_id ? 'worker' : 'worker_group');
        formApi.setValues({
          task_num: 1,
          task_repeat: false,
          ...params,
          process_id: null as any,
          worker_group_id: null as any,
          worker_id: null as any,
        });
        setPendingValidation(params);
      } else {
        setInputParameters([]);
        setOutputParameters([]);
        showParamsHandle(false);
        setTargetType('worker');
        setPendingValidation(null);
        formApi.setValues({
          priority: Priority.MEDIUM,
          max_execution_duration: 3600,
          validity_days: 7,
          enable_recording: false,
          task_num: 1,
        } as any);
      }
    }
  }, [formApi, params]);

  // 当待验证参数和数据都准备好时，执行存在性验证
  useEffect(() => {
    if (!pendingValidation || !formApi) return;

    const isLoadingAny =
      isLoadingProcess || (pendingValidation.worker_group_id && isLoadingWorkerGroups) || (pendingValidation.worker_id && isLoadingWorkerTree);

    if (isLoadingAny) return;

    if (pendingValidation.process_id && processData?.list) {
      const processExists = processData.list.some((p) => p.id === pendingValidation.process_id);
      if (processExists) {
        formApi.setValue('process_id', pendingValidation.process_id);
        if (source === TaskFormSource.Process) {
          handleProcessChange(pendingValidation.process_id);
        }
      }
    }
    if (pendingValidation.worker_group_id && workerGroupList?.length) {
      const groupExists = workerGroupList.some(g => g.id === pendingValidation.worker_group_id);
      if (groupExists) {
        formApi.setValue('worker_group_id', pendingValidation.worker_group_id);
      }
    }
    if (pendingValidation.worker_id && workerGroupsTree?.length) {
      const workerId = pendingValidation.worker_id.toString();
      for (const group of workerGroupsTree) {
        const member = group.members?.find(m => m.worker_id === workerId);
        if (member) {
          formApi.setValue('worker_id', [group.group_id || '0', workerId]);
          break;
        }
      }
    }
    setInputParameters(pendingValidation.input_parameter_values || []);
    setOutputParameters(pendingValidation.output_parameter_values || []);
    setLoading(false);
    setPendingValidation(null);
    showParamsHandle(!!pendingValidation.input_parameter_values?.length || !!pendingValidation.output_parameter_values?.length);
  }, [pendingValidation, formApi, processData, workerGroupList, workerGroupsTree, isLoadingProcess, isLoadingWorkerGroups, isLoadingWorkerTree]);

  // 提交表单
  const submitForm = useCallback(async (): Promise<ITaskInfo | null> => {
    if (!formApi) return null;

    try {
      const values = (await formApi.validate()) as ITaskInfo;

      const selectedProc = processData?.list.find((p) => p.id === values.process_id);
      if (!selectedProc?.current_version_id) {
        Toast.error(t('template.validation.processNoVersion'));
        return null;
      }

      const input_parameter_values = getInputParameterValues(values);
      const workerData = getWorkerData(values);

      return {
        ...values,
        ...workerData,
        process_name: processData!.list.find(x => x.id === values.process_id)?.name || '',
        input_parameter_values,
        output_parameter_values: outputParameters,
      };
    } catch {
      return null;
    }
  }, [formApi, getInputParameterValues, getWorkerData, outputParameters, processData, t]);

  // 上一步
  const preForm = useCallback(() => {
    const values = formApi!.getValues();
    const input_parameter_values = getInputParameterValues(values);
    const workerData = getWorkerData(values);

    return {
      ...values,
      ...workerData,
      input_parameter_values,
      output_parameter_values: outputParameters,
    };
  }, [formApi, getInputParameterValues, getWorkerData, outputParameters]);

  useImperativeHandle(
    taskRef,
    () => ({
      init: initForm,
      submit: submitForm,
      pre: preForm,
    }),
    [initForm, submitForm]
  );

  // 选择流程
  const handleProcessChange = useCallback(
    (processId: string) => {
      const process = processData?.list.find((p) => p.id === processId);
      if (process) {
        if (!process.current_version_id) {
          Toast.error(t('template.validation.processNoVersion'));
          return;
        }
        setSelectedProcess(process);
      }
    },
    [processData, t]
  );

  const renderSelectedItem = (optionNode: { label?: string; name?: string }) => {
    return <>{optionNode.label}</>;
  };

  // 机器人状态定义
  const statusConfig: Record<string, { color: string; text: string }> = useMemo(
    () => ({
      OFFLINE: { color: 'grey', text: t('worker.status.offline') },
      IDLE: { color: 'green', text: t('worker.status.idle') },
      BUSY: { color: 'blue', text: t('worker.status.busy') },
      FAULT: { color: 'red', text: t('worker.status.fault') },
      MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
    }),
    [t]
  );

  // 将机器人组树形数据转换为 Cascader 格式
  const workerTreeData = useMemo(() => {
    if (!workerGroupsTree) return [];

    return workerGroupsTree.map(group => ({
      label: <span className="bot-target-selector-worker-group-name">{group.group_name || t('template.fields.ungrouped')}</span>,
      value: group.group_id || '0',
      display: group.group_name || t('template.fields.ungrouped'),
      children:
        group.members?.map(member => {
          const config = statusConfig[member.status];
          return {
            label: (
              <div className="bot-target-selector-option">
                <Text className="bot-target-selector-option-name">{member.name}</Text>
                <Tag size="small" color={config.color as 'grey' | 'green' | 'blue' | 'red' | 'orange'} type="light">
                  {config.text}
                </Tag>
              </div>
            ),
            value: member.worker_id,
            display: member.name,
            isLeaf: true,
          };
        }) || [],
    }));
  }, [workerGroupsTree, t]);

  useEffect(() => {
    if (versionDetail && selectedProcess) {
      setInputParameters(versionDetail.input_parameters || []);
      setOutputParameters(versionDetail.output_parameters || []);
      showParamsHandle(!!versionDetail.input_parameters?.length || !!versionDetail.output_parameters?.length);
    }
  }, [versionDetail, selectedProcess]);

  return (
    <Spin spinning={loading}>
      <Form className="task-template-form" labelPosition="top" getFormApi={setFormApi as any} autoScrollToError={true}>
        <div className="task-template-body">
          {/* 左侧：基本配置 */}
          <div className="task-template-left">
            <div className="task-template-content">
              {/* 预置表单项 */}
              {preFormItem}

              {/* 流程配置 */}
              <div className="task-template-section">
                <div className="task-template-section-title">{t('template.createModal.processSection')}</div>
                <Form.Select
                  field="process_id"
                  label={t('template.fields.process')}
                  placeholder={t('template.fields.processPlaceholder')}
                  filter
                  optionList={processData?.list.map(p => ({
                    value: p.id,
                    label: p.name,
                  }))}
                  dropdownStyle={{ '--select-option-max-width': showRightPanel ? '382px' : '460px' } as React.CSSProperties}
                  dropdownClassName="semi-select-option-ellipsis"
                  className="task-template-select-full"
                  rules={[{ required: true, message: t('template.validation.processRequired') }]}
                  onChange={v => handleProcessChange(v as string)}
                  disabled={source === TaskFormSource.Process}
                />
              </div>

              {/* 执行目标 */}
              <div className="task-template-section">
                <div className="task-template-section-title">{t('template.createModal.targetSection')}</div>
                <div className="semi-form-field-label-text m-b-12 m-t-12 label-text-required">{t('template.fields.targetType')}</div>
                <Radio.Group value={targetType} onChange={e => setTargetType(e.target.value as ExecutionTargetType)}>
                  <Radio value="worker_group">{t('template.targetType.botGroup')}</Radio>
                  <Radio value="worker">{t('template.targetType.botInGroup')}</Radio>
                </Radio.Group>
                {/* 机器人组选择 */}
                <div style={targetType === 'worker_group' ? undefined : { display: 'none' }}>
                  <Form.Select
                    field="worker_group_id"
                    noLabel
                    placeholder={t('template.fields.workerGroupPlaceholder')}
                    filter
                    className="task-template-select-full"
                    rules={targetType === 'worker_group' ? [{ required: true, message: t('template.validation.workerGroupRequired') }] : []}
                    renderSelectedItem={renderSelectedItem}
                    dropdownStyle={{ '--select-option-max-width': showRightPanel ? '382px' : '460px' } as React.CSSProperties}
                    dropdownClassName="semi-select-option-ellipsis"
                  >
                    {workerGroupList.map(group => {
                      return (
                        <Select.Option value={group.id} key={group.id} label={group.name}>
                          <div className="bot-target-selector-option">
                            <Text className="bot-target-selector-option-name">{group.name}</Text>
                            <Tag
                              size="small"
                              color={group.online_count > 0 ? 'green' : 'grey'}
                              className="bot-target-selector-option-status"
                            >
                              {group.online_count} / {group.member_count} {t('botSelector.statusOnline')}
                            </Tag>
                          </div>
                        </Select.Option>
                      );
                    })}
                  </Form.Select>
                </div>
                {/* 机器人选择 */}
                <div style={targetType === 'worker' ? undefined : { display: 'none' }}>
                  <Form.Cascader
                    field="worker_id"
                    noLabel
                    placeholder={t('template.fields.workerPlaceholder')}
                    treeData={workerTreeData}
                    multiple={false}
                    filterTreeNode
                    treeNodeFilterProp="display"
                    className="task-template-select-full"
                    rules={targetType === 'worker' ? [{ required: true, message: t('template.validation.workerRequired') }] : []}
                    displayProp="display"
                    displayRender={selected => (Array.isArray(selected) ? selected.join(' - ') : '')}
                    dropdownStyle={{ width: showRightPanel ? '382px' : '460px' } as React.CSSProperties}
                    dropdownClassName="task-template-select-dropdown"
                  />
                </div>
              </div>

              {/* 执行设置 */}
              <div className="task-template-section">
                <div className="task-template-section-title">{t('template.createModal.executionSection')}</div>
                <Form.RadioGroup field="priority" label={t('template.fields.priority')} direction="horizontal" rules={[{ required: true }]}>
                  {source === TaskFormSource.TaskList && <Form.Radio value="URGENT">{t('task.priority.urgent')}</Form.Radio>}
                  <Form.Radio value="HIGH">{t('task.priority.high')}</Form.Radio>
                  <Form.Radio value="MEDIUM">{t('task.priority.medium')}</Form.Radio>
                  <Form.Radio value="LOW">{t('task.priority.low')}</Form.Radio>
                </Form.RadioGroup>
                {source === TaskFormSource.TimerTrigger && (
                  <>
                    <Form.Switch field="task_repeat" label={t('template.fields.taskRepeat')} size="small" />
                    <Form.InputNumber
                      field="task_num"
                      label={t('template.fields.taskNum')}
                      suffix={t('common.num')}
                      style={{ width: 150 }}
                      step={1}
                      rules={[
                        { required: true, message: t('template.validation.taskNumRequired') },
                        {
                          validator: (_rule: any, value: number, callback: (msg?: string) => void) => {
                            if (value < 1 || value > 100) {
                              callback(t('template.validation.taskNumRange'));
                              return false;
                            }
                            if (!Number.isInteger(value)) {
                              callback(t('template.validation.mustBeInteger'));
                              return false;
                            }
                            callback();
                            return true;
                          },
                        },
                      ]}
                    />
                  </>
                )}
                <Form.InputNumber
                  field="max_execution_duration"
                  label={t('template.fields.maxDuration')}
                  suffix={t('common.seconds')}
                  style={{ width: 150 }}
                  step={1}
                  rules={[
                    { required: true, message: t('template.validation.maxDurationRequired') },
                    {
                      validator: (_rule: any, value: number, callback: (msg?: string) => void) => {
                        if (value < 60 || value > 86400) {
                          callback(t('template.validation.maxDurationRange'));
                          return false;
                        }
                        if (!Number.isInteger(value)) {
                          callback(t('template.validation.mustBeInteger'));
                          return false;
                        }
                        callback();
                        return true;
                      },
                    },
                  ]}
                />
                <Form.InputNumber
                  field="validity_days"
                  label={t('template.fields.validityDays')}
                  suffix={t('common.days')}
                  style={{ width: 150 }}
                  step={1}
                  rules={[
                    { required: true, message: t('template.validation.validityDaysRequired') },
                    {
                      validator: (_rule: any, value: number, callback: (msg?: string) => void) => {
                        if (value < 1 || value > 30) {
                          callback(t('template.validation.validityDaysRange'));
                          return false;
                        }
                        if (!Number.isInteger(value)) {
                          callback(t('template.validation.mustBeInteger'));
                          return false;
                        }
                        callback();
                        return true;
                      },
                    },
                  ]}
                />
                <Form.Switch field="enable_recording" label={t('template.fields.enableRecording')} size="small" />
              </div>

              {/* 底部表单项 */}
              {bottomFormItem}
            </div>
          </div>

          {/* 右侧：流程输入和流程输出 */}
          {(!!inputParameters.length || !!outputParameters.length) && (
            <div className="task-template-right">
              <div className="task-template-content">
                <ParameterInput inputParameters={inputParameters} outputParameters={outputParameters} />
              </div>
            </div>
          )}
        </div>
      </Form>
    </Spin>
  );
};

export { TaskFormSource, Priority };
export type { TaskFormRef, ITaskInfo, TaskFormProps } from './types';
export default TaskForm;
