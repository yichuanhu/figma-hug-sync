// 成本管理 mock 数据与 CRUD（运营中心唯一自有数据表 cost_record）
import { useEffect, useState } from 'react';

export type CostType =
  | 'PROJECT'
  | 'LICENSE'
  | 'INFRASTRUCTURE'
  | 'THIRD_PARTY'
  | 'TRAINING'
  | 'OTHER';

export type RecurrencePattern =
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'YEARLY';

export interface CostRecord {
  id: string;
  costType: CostType;
  projectId?: string;
  projectName?: string;
  costName: string;
  amount: number;
  occurrenceDate: string; // YYYY-MM-DD
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  description?: string;
  createdBy: string;
  createdAt: string;
}

export interface CostOverview {
  periodCost: number;       // 本期（本月）成本
  cumulativeCost: number;   // 累计成本
  costItemCount: number;    // 成本项目数
  monthlyAvgCost: number;   // 月均成本
}

export interface CostProjectOption {
  id: string;
  name: string;
}

// 全平台可关联项目（mock，与 ROI 模块项目对齐）
export const COST_PROJECT_OPTIONS: CostProjectOption[] = [
  { id: 'proj-001', name: 'Financial Automation' },
  { id: 'proj-002', name: 'Operational Efficiency' },
  { id: 'proj-003', name: 'HR Digital Transformation' },
  { id: 'proj-004', name: 'Smart Approval' },
  { id: 'proj-005', name: 'Customer Service Bot' },
];

const projectName = (id?: string) =>
  COST_PROJECT_OPTIONS.find((p) => p.id === id)?.name;

const now = () => new Date().toISOString();

// ------------- 初始 mock 数据 -------------
let store: CostRecord[] = [
  // 项目成本
  { id: 'cost-001', costType: 'PROJECT', projectId: 'proj-001', projectName: 'Financial Automation', costName: '财务自动化一期开发', amount: 50000, occurrenceDate: '2026-02-15', isRecurring: false, description: '财务部门 RPA 一期开发投入', createdBy: '管理员', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'cost-002', costType: 'PROJECT', projectId: 'proj-001', projectName: 'Financial Automation', costName: '财务自动化二期开发', amount: 38000, occurrenceDate: '2026-03-10', isRecurring: false, createdBy: '管理员', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'cost-003', costType: 'PROJECT', projectId: 'proj-002', projectName: 'Operational Efficiency', costName: '运营提效流程开发', amount: 42000, occurrenceDate: '2026-02-28', isRecurring: false, createdBy: '管理员', createdAt: '2026-02-28T10:00:00Z' },
  { id: 'cost-004', costType: 'PROJECT', projectId: 'proj-003', projectName: 'HR Digital Transformation', costName: 'HR 数字化建设', amount: 60000, occurrenceDate: '2026-01-20', isRecurring: false, createdBy: '管理员', createdAt: '2026-01-20T10:00:00Z' },
  { id: 'cost-005', costType: 'PROJECT', projectId: 'proj-004', projectName: 'Smart Approval', costName: '智能审批实施', amount: 30000, occurrenceDate: '2026-03-08', isRecurring: false, createdBy: '管理员', createdAt: '2026-03-08T10:00:00Z' },
  { id: 'cost-006', costType: 'PROJECT', projectId: 'proj-005', projectName: 'Customer Service Bot', costName: '客服机器人接入', amount: 25000, occurrenceDate: '2026-04-02', isRecurring: false, createdBy: '管理员', createdAt: '2026-04-02T10:00:00Z' },

  // License 成本
  { id: 'cost-101', costType: 'LICENSE', costName: '2026 年 APA Worker License', amount: 120000, occurrenceDate: '2026-01-01', isRecurring: true, recurrencePattern: 'YEARLY', description: '年度 License 续费', createdBy: '管理员', createdAt: '2026-01-01T09:00:00Z' },
  { id: 'cost-102', costType: 'LICENSE', costName: '2026 年 APA Creator License', amount: 80000, occurrenceDate: '2026-01-01', isRecurring: true, recurrencePattern: 'YEARLY', createdBy: '管理员', createdAt: '2026-01-01T09:00:00Z' },
  { id: 'cost-103', costType: 'LICENSE', costName: 'OCR 引擎商用 License', amount: 36000, occurrenceDate: '2026-02-01', isRecurring: true, recurrencePattern: 'YEARLY', createdBy: '管理员', createdAt: '2026-02-01T09:00:00Z' },

  // 基础设施
  { id: 'cost-201', costType: 'INFRASTRUCTURE', costName: '阿里云生产服务器', amount: 5800, occurrenceDate: '2026-04-01', isRecurring: true, recurrencePattern: 'MONTHLY', description: '执行机集群每月费用', createdBy: '管理员', createdAt: '2026-04-01T09:00:00Z' },
  { id: 'cost-202', costType: 'INFRASTRUCTURE', costName: '数据库实例 RDS', amount: 3200, occurrenceDate: '2026-04-01', isRecurring: true, recurrencePattern: 'MONTHLY', createdBy: '管理员', createdAt: '2026-04-01T09:00:00Z' },
  { id: 'cost-203', costType: 'INFRASTRUCTURE', costName: '对象存储 OSS', amount: 1200, occurrenceDate: '2026-04-01', isRecurring: true, recurrencePattern: 'MONTHLY', createdBy: '管理员', createdAt: '2026-04-01T09:00:00Z' },

  // 第三方服务
  { id: 'cost-301', costType: 'THIRD_PARTY', costName: '短信通知服务', amount: 2400, occurrenceDate: '2026-03-15', isRecurring: true, recurrencePattern: 'MONTHLY', createdBy: '管理员', createdAt: '2026-03-15T09:00:00Z' },
  { id: 'cost-302', costType: 'THIRD_PARTY', costName: '企业邮件网关', amount: 1800, occurrenceDate: '2026-03-15', isRecurring: true, recurrencePattern: 'MONTHLY', createdBy: '管理员', createdAt: '2026-03-15T09:00:00Z' },

  // 培训
  { id: 'cost-401', costType: 'TRAINING', costName: '开发者认证培训', amount: 18000, occurrenceDate: '2026-02-20', isRecurring: false, description: '三期开发者集训费用', createdBy: '管理员', createdAt: '2026-02-20T10:00:00Z' },
  { id: 'cost-402', costType: 'TRAINING', costName: '业务用户使用培训', amount: 9000, occurrenceDate: '2026-03-22', isRecurring: false, createdBy: '管理员', createdAt: '2026-03-22T10:00:00Z' },

  // 其他
  { id: 'cost-501', costType: 'OTHER', costName: '安全审计服务', amount: 15000, occurrenceDate: '2026-03-05', isRecurring: false, createdBy: '管理员', createdAt: '2026-03-05T10:00:00Z' },
];

// ------------- 订阅机制 -------------
type Listener = () => void;
const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

export const subscribeCostStore = (l: Listener) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

// ------------- 查询 -------------
export const getCostList = (costType: CostType): CostRecord[] =>
  store
    .filter((r) => r.costType === costType)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const getCostOverview = (costType: CostType): CostOverview => {
  const list = store.filter((r) => r.costType === costType);
  const cumulativeCost = list.reduce((s, r) => s + r.amount, 0);
  const ym = (d: string) => d.slice(0, 7);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const periodCost = list
    .filter((r) => ym(r.occurrenceDate) === currentMonth)
    .reduce((s, r) => s + r.amount, 0);
  const months = new Set(list.map((r) => ym(r.occurrenceDate)));
  const monthlyAvgCost = months.size > 0 ? cumulativeCost / months.size : 0;
  return {
    periodCost,
    cumulativeCost,
    costItemCount: list.length,
    monthlyAvgCost,
  };
};

// ------------- CRUD -------------
export interface CostFormPayload {
  costType: CostType;
  projectId?: string;
  costName: string;
  amount: number;
  occurrenceDate: string;
  description?: string;
}

export const isCostNameDuplicate = (
  costType: CostType,
  costName: string,
  excludeId?: string,
): boolean =>
  store.some(
    (r) =>
      r.costType === costType &&
      r.costName.trim() === costName.trim() &&
      r.id !== excludeId,
  );

export const createCostRecord = (data: CostFormPayload): CostRecord => {
  const item: CostRecord = {
    id: `cost-${Date.now()}`,
    ...data,
    projectName: data.costType === 'PROJECT' ? projectName(data.projectId) : undefined,
    createdBy: '管理员',
    createdAt: now(),
  };
  store = [item, ...store];
  emit();
  return item;
};

export const updateCostRecord = (id: string, patch: Partial<CostFormPayload>) => {
  store = store.map((r) =>
    r.id === id
      ? {
          ...r,
          ...patch,
          // costType 与 projectId 不可变更
          costType: r.costType,
          projectId: r.projectId,
          projectName: r.projectName,
        }
      : r,
  );
  emit();
};

export const deleteCostRecord = (id: string) => {
  store = store.filter((r) => r.id !== id);
  emit();
};

// ------------- React 订阅 hook -------------
export const useCostStore = () => {
  const [, force] = useState(0);
  useEffect(() => {
    const unsub = subscribeCostStore(() => force((n) => n + 1));
    return () => { unsub(); };
  }, []);
};
