/**
 * Mock 实现：模拟参考代码 useQuery.ts 中的数据 hooks
 * 返回结构与参考代码一致
 */
import { useState, useEffect, useMemo } from 'react';
import type {
  LYProcessResponse,
  LYProcessVersionDetail,
  WorkerGroup,
  WorkerGroupTreeItem,
} from '../types';

// Mock 流程列表
const mockProcessList: LYProcessResponse[] = [
  {
    id: 'proc-001',
    name: 'Auto Order Processing',
    description: 'Automated order processing workflow',
    status: 'PUBLISHED',
    current_version_id: 'ver-001',
  },
  {
    id: 'proc-002',
    name: 'Expense Reimbursement Approval',
    description: 'Finance approval automation',
    status: 'PUBLISHED',
    current_version_id: 'ver-002',
  },
  {
    id: 'proc-003',
    name: 'Employee Onboarding Flow',
    description: 'HR onboarding process',
    status: 'PUBLISHED',
    current_version_id: 'ver-003',
  },
  {
    id: 'proc-004',
    name: 'Data Collection Flow',
    description: 'Data collection and extraction',
    status: 'PUBLISHED',
    current_version_id: 'ver-004',
  },
];

// Mock 流程版本详情
const mockVersionDetails: Record<string, LYProcessVersionDetail> = {
  'ver-001': {
    input_parameters: [
      { id: 'param-001', name: 'targetUrl', category: 'string', description: 'Target URL address for the automated order processing workflow. This parameter specifies the endpoint from which the RPA bot will fetch pending orders.', value: '' },
      { id: 'param-002', name: 'maxCount', category: 'number', description: 'Maximum processing count', value: '100' },
      { id: 'param-003', name: 'enableRetry', category: 'boolean', description: 'Enable retry', value: 'True' },
    ],
    output_parameters: [
      { id: 'out-001', name: 'processedCount', description: 'Processed order count' },
      { id: 'out-002', name: 'successRate', description: 'Processing success rate' },
      { id: 'out-003', name: 'errorList', description: 'Error order list' },
    ],
  },
  'ver-002': {
    input_parameters: [
      { id: 'param-004', name: 'department', category: 'string', description: 'Department name', value: '' },
      { id: 'param-005', name: 'approvalCredential', category: 'credential', description: 'Approval credential', credential_value: { user: '', password: '' } },
    ],
    output_parameters: [
      { id: 'out-004', name: 'approvalResult', description: 'Approval result' },
      { id: 'out-005', name: 'approvalNote', description: 'Approval comments' },
    ],
  },
  'ver-003': {
    input_parameters: [],
    output_parameters: [],
  },
  'ver-004': {
    input_parameters: [
      { id: 'param-006', name: 'sourceUrl', category: 'string', description: 'Data source URL', value: '' },
      { id: 'param-007', name: 'pageLimit', category: 'number', description: 'Page limit for collection', value: '10' },
    ],
    output_parameters: [
      { id: 'out-006', name: 'collectedCount', description: 'Collected data count' },
      { id: 'out-007', name: 'dataFilePath', description: 'Data file path' },
      { id: 'out-008', name: 'isComplete', description: 'Collection complete' },
    ],
  },
};

// Mock 机器人组列表
const mockWorkerGroups: WorkerGroup[] = [
  { id: 'group-001', name: 'Order Processing Group', online_count: 3, member_count: 5 },
  { id: 'group-002', name: 'Finance Approval Group', online_count: 2, member_count: 3 },
  { id: 'group-003', name: 'HR Management Group', online_count: 1, member_count: 2 },
];

// Mock 机器人组树形结构
const mockWorkerGroupsTree: WorkerGroupTreeItem[] = [
  {
    group_id: 'group-001',
    group_name: 'Order Processing Group',
    members: [
      { worker_id: 'bot-001', name: 'RPA-BOT-001', status: 'IDLE' },
      { worker_id: 'bot-002', name: 'RPA-BOT-002', status: 'OFFLINE' },
      { worker_id: 'bot-003', name: 'RPA-BOT-003', status: 'BUSY' },
      { worker_id: 'bot-004', name: 'RPA-BOT-004', status: 'IDLE' },
      { worker_id: 'bot-005', name: 'RPA-BOT-005', status: 'MAINTENANCE' },
    ],
  },
  {
    group_id: 'group-002',
    group_name: 'Finance Approval Group',
    members: [
      { worker_id: 'bot-006', name: 'RPA-BOT-006', status: 'IDLE' },
      { worker_id: 'bot-007', name: 'RPA-BOT-007', status: 'BUSY' },
      { worker_id: 'bot-008', name: 'RPA-BOT-008', status: 'FAULT' },
    ],
  },
  {
    group_id: 'group-003',
    group_name: 'HR Management Group',
    members: [
      { worker_id: 'bot-009', name: 'RPA-BOT-009', status: 'IDLE' },
      { worker_id: 'bot-010', name: 'RPA-BOT-010', status: 'OFFLINE' },
    ],
  },
  {
    group_id: null,
    group_name: null,
    members: [
      { worker_id: 'bot-011', name: 'RPA-BOT-011', status: 'IDLE' },
      { worker_id: 'bot-012', name: 'RPA-BOT-012', status: 'OFFLINE' },
    ],
  },
];

interface ProcessesParams {
  offset: number;
  size: number;
  status?: string;
}

interface WorkerGroupsParams {
  offset: number;
  size: number;
}

/**
 * 获取流程列表
 */
export const useGetProcesses = (params: ProcessesParams) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, []);

  const data = useMemo(() => ({
    list: mockProcessList,
    range: { offset: params.offset, limit: params.size, count: mockProcessList.length },
  }), [params.offset, params.size]);

  return { data: isLoading ? undefined : data, isLoading };
};

/**
 * 获取流程版本详情
 */
export const useGetProcessVersion = (versionId: string, enabled?: boolean) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (versionId && enabled !== false) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(timer);
    }
  }, [versionId, enabled]);

  const data = useMemo(() => {
    if (!versionId || enabled === false) return undefined;
    return mockVersionDetails[versionId] || { input_parameters: [], output_parameters: [] };
  }, [versionId, enabled]);

  return { data: isLoading ? undefined : data, isLoading };
};

/**
 * 获取机器人组列表
 */
export const useGetWorkerGroups = (_params: WorkerGroupsParams, enabled?: boolean) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (enabled) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(timer);
    }
  }, [enabled]);

  return {
    data: enabled && !isLoading ? mockWorkerGroups : [],
    isLoading: enabled ? isLoading : false,
  };
};

/**
 * 获取机器人组树形结构
 */
export const useWorkerGroupsTree = (enabled?: boolean) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (enabled) {
      setIsLoading(true);
      const timer = setTimeout(() => setIsLoading(false), 150);
      return () => clearTimeout(timer);
    }
  }, [enabled]);

  return {
    data: enabled && !isLoading ? mockWorkerGroupsTree : [],
    isLoading: enabled ? isLoading : false,
  };
};

/**
 * Mock encrypt 函数
 */
export const encrypt = (value: string): string => {
  return value;
};
