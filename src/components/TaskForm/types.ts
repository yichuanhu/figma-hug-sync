/**
 * TaskForm 公共类型定义
 * 百分百还原参考代码的类型结构
 */
import { Ref } from 'react';

// 任务优先级枚举
export enum Priority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// 任务来源枚举
export enum TaskFormSource {
  TimerTrigger = 'timerTrigger',
  QueueTrigger = 'queueTrigger',
  TaskTemplate = 'taskTemplate',
  TaskList = 'taskList',
  Process = 'process',
}

// 执行目标类型
export type ExecutionTargetType = 'worker' | 'worker_group';

// 输入参数项
export interface LYInputParameterItem {
  id: string;
  name: string;
  category: 'string' | 'number' | 'boolean' | 'credential';
  description?: string | null;
  value?: string;
  credential_value?: {
    user: string;
    password: string;
  };
}

// 输出参数项
export interface LYOutputParameterItem {
  id: string;
  name: string;
  description?: string | null;
  value?: string;
}

// 流程响应
export interface LYProcessResponse {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  current_version_id?: string | null;
}

// 流程版本详情
export interface LYProcessVersionDetail {
  input_parameters?: LYInputParameterItem[];
  output_parameters?: LYOutputParameterItem[];
}

// 机器人组
export interface WorkerGroup {
  id: string;
  name: string;
  online_count: number;
  member_count: number;
}

// 机器人组树形结构成员
export interface WorkerGroupTreeMember {
  worker_id: string;
  name: string;
  status: 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';
}

// 机器人组树形结构
export interface WorkerGroupTreeItem {
  group_id: string | null;
  group_name: string | null;
  members?: WorkerGroupTreeMember[];
}

// 任务表单数据
export interface ITaskInfo {
  process_id: string;
  process_name: string;
  worker_group_id?: string | null;
  worker_id?: string | string[] | null;
  worker_group_name?: string | null;
  worker_name?: string | null;
  priority: Priority;
  max_execution_duration: number;
  validity_days: number;
  enable_recording: boolean;
  input_parameter_values?: LYInputParameterItem[] | null;
  output_parameter_values?: LYOutputParameterItem[] | null;
  task_num?: number;
  task_repeat?: boolean;
  [key: string]: unknown;
}

// TaskForm ref 接口
export interface TaskFormRef {
  init: () => void;
  submit: () => Promise<ITaskInfo | null>;
  pre: () => ITaskInfo;
}

// TaskForm props 接口
export interface TaskFormProps {
  taskRef: Ref<TaskFormRef>;
  params?: ITaskInfo;
  showParamsHandle: (show: boolean) => void;
  source: TaskFormSource;
  preFormItem?: React.ReactNode;
  bottomFormItem?: React.ReactNode;
  showRightPanel: boolean;
}
