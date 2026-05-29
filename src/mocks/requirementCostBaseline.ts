/**
 * 成本基线配置 Mock 层（STORY-020-RC-COST-BASELINE-CONFIG）
 *
 * 维护租户级通用成本项清单，供 STORY-003 新建/编辑需求时选择。
 * v1 范围：列表 + 新建 + 编辑，无删除/启停/部门范围/版本管理。
 */

export type CostItemType = 'role' | 'activity';

export const COST_TYPE_LABEL: Record<CostItemType, string> = {
  role: '岗位',
  activity: '活动',
};

export const COST_TYPE_TAG_COLOR: Record<CostItemType, 'blue' | 'violet'> = {
  role: 'blue',
  activity: 'violet',
};

export const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY 人民币' },
  { value: 'USD', label: 'USD 美元' },
  { value: 'EUR', label: 'EUR 欧元' },
];

export interface CostBaselineItem {
  id: string;
  cost_type: CostItemType;
  name: string;
  daily_cost: number;
  currency: string;
  description?: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  updated_by_name: string;
}

export interface CreateCostBaselineItemInput {
  cost_type: CostItemType;
  name: string;
  daily_cost: number;
  currency: string;
  description?: string;
}

export type UpdateCostBaselineItemInput = CreateCostBaselineItemInput;

export interface ListCostBaselineFilter {
  keyword?: string;
  costTypes?: CostItemType[];
}

export class CostItemNameDuplicatedError extends Error {
  constructor() {
    super('成本项名称已存在');
    this.name = 'CostItemNameDuplicatedError';
  }
}

const now = () => new Date().toISOString();

const genId = () => `cost-${Math.random().toString(36).slice(2, 10)}`;

const store: CostBaselineItem[] = [
  {
    id: 'cost-finance-specialist',
    cost_type: 'role',
    name: '财务专员',
    daily_cost: 500,
    currency: 'CNY',
    description: '财务部门常规人工处理岗位，对应日常票据、对账等工作。',
    created_at: '2026-05-20T10:00:00.000Z',
    updated_at: '2026-05-28T09:30:00.000Z',
    created_by_name: '系统管理员',
    updated_by_name: '系统管理员',
  },
  {
    id: 'cost-senior-specialist',
    cost_type: 'role',
    name: '高级专员',
    daily_cost: 800,
    currency: 'CNY',
    description: '具备 3 年以上经验的高级岗位，覆盖复杂业务场景。',
    created_at: '2026-05-20T10:05:00.000Z',
    updated_at: '2026-05-26T11:20:00.000Z',
    created_by_name: '系统管理员',
    updated_by_name: '李婷',
  },
  {
    id: 'cost-ops-engineer',
    cost_type: 'role',
    name: '运维工程师',
    daily_cost: 950,
    currency: 'CNY',
    description: '负责系统运维、监控和故障处理。',
    created_at: '2026-05-21T14:00:00.000Z',
    updated_at: '2026-05-25T16:00:00.000Z',
    created_by_name: '李婷',
    updated_by_name: '李婷',
  },
  {
    id: 'cost-invoice-entry',
    cost_type: 'activity',
    name: '发票录入',
    daily_cost: 450,
    currency: 'CNY',
    description: '按张录入发票信息并校验，常见的财务活动。',
    created_at: '2026-05-22T09:30:00.000Z',
    updated_at: '2026-05-27T10:00:00.000Z',
    created_by_name: '系统管理员',
    updated_by_name: '系统管理员',
  },
  {
    id: 'cost-data-reconciliation',
    cost_type: 'activity',
    name: '数据对账',
    daily_cost: 600,
    currency: 'CNY',
    description: '业务系统间核对账目，按对账批次计量人工成本。',
    created_at: '2026-05-23T11:00:00.000Z',
    updated_at: '2026-05-23T11:00:00.000Z',
    created_by_name: '李婷',
    updated_by_name: '李婷',
  },
];

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((cb) => cb());

export const subscribeCostBaselineChange = (cb: Listener): (() => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

const matchKeyword = (item: CostBaselineItem, keyword: string): boolean => {
  const k = keyword.trim().toLowerCase();
  if (!k) return true;
  return (
    item.name.toLowerCase().includes(k) ||
    (item.description ?? '').toLowerCase().includes(k)
  );
};

const sortByUpdatedDesc = (a: CostBaselineItem, b: CostBaselineItem) =>
  b.updated_at.localeCompare(a.updated_at);

export const listCostBaselineItems = async (
  filter: ListCostBaselineFilter = {},
): Promise<CostBaselineItem[]> => {
  const { keyword = '', costTypes = [] } = filter;
  return store
    .filter((item) => matchKeyword(item, keyword))
    .filter((item) => (costTypes.length === 0 ? true : costTypes.includes(item.cost_type)))
    .slice()
    .sort(sortByUpdatedDesc);
};

export const getCostBaselineItem = async (id: string): Promise<CostBaselineItem | undefined> => {
  return store.find((x) => x.id === id);
};

const assertNameUnique = (name: string, ignoreId?: string) => {
  const trimmed = name.trim();
  const dup = store.some(
    (x) => x.name.trim().toLowerCase() === trimmed.toLowerCase() && x.id !== ignoreId,
  );
  if (dup) throw new CostItemNameDuplicatedError();
};

export const createCostBaselineItem = async (
  input: CreateCostBaselineItemInput,
): Promise<CostBaselineItem> => {
  assertNameUnique(input.name);
  const ts = now();
  const item: CostBaselineItem = {
    id: genId(),
    cost_type: input.cost_type,
    name: input.name.trim(),
    daily_cost: input.daily_cost,
    currency: input.currency || 'CNY',
    description: input.description?.trim() || undefined,
    created_at: ts,
    updated_at: ts,
    created_by_name: '当前用户',
    updated_by_name: '当前用户',
  };
  store.unshift(item);
  notify();
  return item;
};

export const updateCostBaselineItem = async (
  id: string,
  input: UpdateCostBaselineItemInput,
): Promise<CostBaselineItem> => {
  assertNameUnique(input.name, id);
  const idx = store.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error('成本项不存在');
  const prev = store[idx];
  const next: CostBaselineItem = {
    ...prev,
    cost_type: input.cost_type,
    name: input.name.trim(),
    daily_cost: input.daily_cost,
    currency: input.currency || 'CNY',
    description: input.description?.trim() || undefined,
    updated_at: now(),
    updated_by_name: '当前用户',
  };
  store[idx] = next;
  notify();
  return next;
};

export const deleteCostBaselineItem = async (id: string): Promise<void> => {
  const idx = store.findIndex((x) => x.id === id);
  if (idx < 0) throw new Error('成本项不存在');
  store.splice(idx, 1);
  notify();
};
