import type {
  RoiMetrics,
  ResourceOverviewData,
  RequirementOverviewData,
  RoiTrendPoint,
  DepartmentRoiItem,
  RequirementRoiItem,
  RequirementRoiDetail,
  DepartmentRoiDetail,
  ProjectRoiDetail,
  ResourceEfficiencyData,
  BusinessOutcomesData,
} from './types';
import { getCostList } from './CostManagement/mockData';

// 总投入成本 = 成本管理中所有成本类型的累计支出之和
const getTotalInvestmentFromCostStore = (): number => {
  const types = ['PROJECT', 'LICENSE', 'INFRASTRUCTURE', 'THIRD_PARTY', 'TRAINING', 'OTHER'] as const;
  return types.reduce((sum, t) => sum + getCostList(t).reduce((s, r) => s + r.amount, 0), 0);
};

export const mockRoiMetrics: RoiMetrics = {
  totalSavedCost: 1247800,
  robotUtilization: 85.2,
  activeRequirements: 127,
  totalAutomationHours: 12580,
  totalInvestmentCost: 823500,
  savedCostTrend: 12.3,
  utilizationTrend: -2.8,
  requirementsTrend: 8,
  automationHoursTrend: 1240,
  // 回本周期 = 总投入 / 月均节约; 这里模拟 6.5 个月; null 表示无法计算
  paybackMonths: 6.5,
};

export const mockResourceOverview: ResourceOverviewData = {
  interactiveOnline: 5,
  interactiveTotal: 10,
  unattendedOnline: 35,
  unattendedTotal: 40,
  todayTasks: 1258,
  totalTasks: 98432,
  todayRunMinutes: 452,
  totalRunMinutes: 752400,
};

export const mockRequirementOverview: RequirementOverviewData = {
  developing: 18,
  completed: 127,
  running: 98,
  total: 263,
};

export const mockRoiTrend: RoiTrendPoint[] = [
  { month: '2025-10', roi: 45, investmentCost: 180000, savedCost: 261000 },
  { month: '2025-11', roi: 72, investmentCost: 165000, savedCost: 283800 },
  { month: '2025-12', roi: 98, investmentCost: 142000, savedCost: 281160 },
  { month: '2026-01', roi: 125, investmentCost: 130000, savedCost: 292500 },
  { month: '2026-02', roi: 148, investmentCost: 115000, savedCost: 285200 },
  { month: '2026-03', roi: 162, investmentCost: 91500, savedCost: 239730 },
];

export const mockDepartmentRoi: DepartmentRoiItem[] = [
  { rank: 1, department: 'Finance', investmentCost: 198000, savedCost: 612000, roi: 309, trend: [120, 180, 220, 280, 300, 309] },
  { rank: 2, department: 'Operations', investmentCost: 152000, savedCost: 453000, roi: 198, trend: [80, 110, 140, 170, 190, 198] },
  { rank: 3, department: 'Human Resources', investmentCost: 104000, savedCost: 256000, roi: 146, trend: [50, 70, 90, 120, 135, 146] },
  { rank: 4, department: 'IT', investmentCost: 183000, savedCost: 365000, roi: 99, trend: [30, 50, 65, 80, 90, 99] },
  { rank: 5, department: 'Legal', investmentCost: 118000, savedCost: 182000, roi: 54, trend: [10, 20, 30, 40, 48, 54] },
];

export const mockRequirementRoi: RequirementRoiItem[] = [
  { rank: 1, requirementName: 'Invoice Auto-Recognition & Entry', department: 'Finance', roi: 512, status: 'running' },
  { rank: 2, requirementName: 'Order Auto-Processing & Dispatch', department: 'Operations', roi: 348, status: 'running' },
  { rank: 3, requirementName: 'Expense Report Auto-Approval', department: 'Finance', roi: 283, status: 'running' },
  { rank: 4, requirementName: 'Payroll Auto-Calculation & Verification', department: 'Human Resources', roi: 221, status: 'running' },
  { rank: 5, requirementName: 'Contract Clause Auto-Review', department: 'Legal', roi: 176, status: 'running' },
];

// 部门和项目选项
export const mockDepartments = [
  { value: 'all', label: '' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'it', label: 'IT' },
  { value: 'legal', label: 'Legal' },
];

export const mockProjects = [
  { value: 'all', label: '' },
  { value: 'proj-001', label: 'Financial Automation' },
  { value: 'proj-002', label: 'Operational Efficiency' },
  { value: 'proj-003', label: 'HR Digital Transformation' },
];

// ROI Analysis Mock Data
export const mockRequirementRoiDetails: RequirementRoiDetail[] = [
  { id: 'req-001', name: 'Invoice Auto-Recognition & Entry', department: 'Finance', roi: 512, investmentCost: 45000, savedCost: 275400, status: 'running' },
  { id: 'req-002', name: 'Order Auto-Processing & Dispatch', department: 'Operations', roi: 348, investmentCost: 62000, savedCost: 277760, status: 'running' },
  { id: 'req-003', name: 'Expense Report Auto-Approval', department: 'Finance', roi: 283, investmentCost: 38000, savedCost: 145540, status: 'running' },
  { id: 'req-004', name: 'Payroll Auto-Calculation', department: 'Human Resources', roi: 221, investmentCost: 55000, savedCost: 176550, status: 'running' },
  { id: 'req-005', name: 'Contract Clause Auto-Review', department: 'Legal', roi: 176, investmentCost: 72000, savedCost: 198720, status: 'running' },
  { id: 'req-006', name: 'Customer Data Sync & Cleansing', department: 'IT', roi: 158, investmentCost: 48000, savedCost: 123840, status: 'completed' },
  { id: 'req-007', name: 'Inventory Auto-Replenishment', department: 'Operations', roi: 134, investmentCost: 41000, savedCost: 95940, status: 'running' },
  { id: 'req-008', name: 'Employee Onboarding Automation', department: 'Human Resources', roi: 112, investmentCost: 35000, savedCost: 74200, status: 'developing' },
  { id: 'req-009', name: 'Tax Filing Auto-Submission', department: 'Finance', roi: 95, investmentCost: 58000, savedCost: 113100, status: 'completed' },
  { id: 'req-010', name: 'Compliance Document Generation', department: 'Legal', roi: 67, investmentCost: 32000, savedCost: 53440, status: 'developing' },
];

export const mockDepartmentRoiDetails: DepartmentRoiDetail[] = [
  { department: 'Finance', investmentCost: 141000, savedCost: 534040, roi: 279, requirementCount: 3, robotCount: 8, trend: [120, 180, 220, 260, 279] },
  { department: 'Operations', investmentCost: 103000, savedCost: 373700, roi: 263, requirementCount: 2, robotCount: 6, trend: [80, 140, 190, 240, 263] },
  { department: 'Human Resources', investmentCost: 90000, savedCost: 250750, roi: 179, requirementCount: 2, robotCount: 4, trend: [50, 90, 130, 160, 179] },
  { department: 'Legal', investmentCost: 104000, savedCost: 252160, roi: 142, requirementCount: 2, robotCount: 3, trend: [30, 60, 95, 125, 142] },
  { department: 'IT', investmentCost: 48000, savedCost: 123840, roi: 158, requirementCount: 1, robotCount: 2, trend: [40, 70, 110, 140, 158] },
];

export const mockProjectRoiDetails: ProjectRoiDetail[] = [
  { projectName: 'Financial Automation', status: 'running', investmentCost: 141000, savedCost: 534040, roi: 279, requirementCount: 3 },
  { projectName: 'Operational Efficiency', status: 'running', investmentCost: 103000, savedCost: 373700, roi: 263, requirementCount: 2 },
  { projectName: 'HR Digital Transformation', status: 'running', investmentCost: 90000, savedCost: 250750, roi: 179, requirementCount: 2 },
];

// Resource Efficiency Mock Data
export const mockResourceEfficiency: ResourceEfficiencyData = {
  overallUtilization: 78.5,
  totalRobots: 50,
  working: 32,
  idle: 8,
  offline: 6,
  maintenance: 4,
  interactiveOnline: 5,
  interactiveTotal: 10,
  unattendedOnline: 35,
  unattendedTotal: 40,
  robotDetails: [
    { id: 'bot-001', name: 'Invoice-Bot-01', type: 'unattended', group: 'Finance', status: 'working', utilization: 92, monthlyTasks: 3420, trend: [78, 82, 85, 88, 90, 92] },
    { id: 'bot-002', name: 'Order-Bot-01', type: 'unattended', group: 'Operations', status: 'working', utilization: 88, monthlyTasks: 2850, trend: [70, 75, 80, 84, 86, 88] },
    { id: 'bot-003', name: 'HR-Bot-01', type: 'interactive', group: 'HR', status: 'working', utilization: 76, monthlyTasks: 1230, trend: [60, 65, 68, 72, 74, 76] },
    { id: 'bot-004', name: 'Contract-Bot-01', type: 'unattended', group: 'Legal', status: 'idle', utilization: 45, monthlyTasks: 680, trend: [30, 35, 38, 40, 42, 45] },
    { id: 'bot-005', name: 'Data-Sync-Bot', type: 'unattended', group: 'IT', status: 'working', utilization: 82, monthlyTasks: 2100, trend: [65, 70, 74, 78, 80, 82] },
    { id: 'bot-006', name: 'Expense-Bot-01', type: 'interactive', group: 'Finance', status: 'working', utilization: 85, monthlyTasks: 1950, trend: [68, 72, 76, 80, 83, 85] },
    { id: 'bot-007', name: 'Inventory-Bot', type: 'unattended', group: 'Operations', status: 'offline', utilization: 0, monthlyTasks: 0, trend: [55, 48, 30, 15, 5, 0] },
    { id: 'bot-008', name: 'Compliance-Bot', type: 'unattended', group: 'Legal', status: 'maintenance', utilization: 0, monthlyTasks: 0, trend: [40, 42, 38, 35, 10, 0] },
  ],
  taskStats: { total: 12580, success: 11450, failed: 420, running: 580, timeout: 130 },
  todayTasks: 1258,
  totalTasks: 98432,
  todayRunMinutes: 452,
  totalRunMinutes: 752400,
  successRateToday: 94.2,
  successRateTotal: 91.0,
  utilizationTrend: [
    { month: '2025-10', utilization: 68 },
    { month: '2025-11', utilization: 72 },
    { month: '2025-12', utilization: 74 },
    { month: '2026-01', utilization: 76 },
    { month: '2026-02', utilization: 77 },
    { month: '2026-03', utilization: 78.5 },
  ],
  groupUtilization: [
    { group: 'Finance', utilization: 88.5, robotCount: 2 },
    { group: 'Operations', utilization: 72.0, robotCount: 2 },
    { group: 'HR', utilization: 76.0, robotCount: 1 },
    { group: 'IT', utilization: 82.0, robotCount: 1 },
    { group: 'Legal', utilization: 22.5, robotCount: 2 },
  ],
  successRateTrend: [
    { month: '2025-10', rate: 88.2 },
    { month: '2025-11', rate: 89.5 },
    { month: '2025-12', rate: 90.1 },
    { month: '2026-01', rate: 91.8 },
    { month: '2026-02', rate: 93.0 },
    { month: '2026-03', rate: 94.2 },
  ],
  taskVolumeTrend: [
    { month: '2025-10', success: 9420, failed: 580 },
    { month: '2025-11', success: 10380, failed: 620 },
    { month: '2025-12', success: 10920, failed: 540 },
    { month: '2026-01', success: 11540, failed: 470 },
    { month: '2026-02', success: 11820, failed: 420 },
    { month: '2026-03', success: 11450, failed: 420 },
  ],
  avgExecutionMinutes: 4.8,
  avgExecutionTrend: -8.5,
  failedProcessTop: [
    { processName: 'Invoice OCR Recognition', failedCount: 128, totalCount: 1850, ratio: 6.9 },
    { processName: 'Order Sync to ERP', failedCount: 96, totalCount: 1620, ratio: 5.9 },
    { processName: 'Payroll Calculation', failedCount: 72, totalCount: 980, ratio: 7.3 },
    { processName: 'Contract Auto-Review', failedCount: 64, totalCount: 720, ratio: 8.9 },
    { processName: 'Inventory Replenishment', failedCount: 60, totalCount: 1240, ratio: 4.8 },
  ],
};

export const mockRobotGroups = [
  { value: 'all', label: '' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'HR' },
  { value: 'it', label: 'IT' },
  { value: 'legal', label: 'Legal' },
];

export const mockRobotStatuses = [
  { value: 'all', label: '' },
  { value: 'working', label: 'Working' },
  { value: 'idle', label: 'Idle' },
  { value: 'offline', label: 'Offline' },
  { value: 'maintenance', label: 'Maintenance' },
];

// ============ 业务成果看板 mock ============
export const mockBusinessOutcomes: BusinessOutcomesData = {
  funnel: [
    { name: '需求提报', value: 263, conversionRate: 100 },
    { name: '需求评审通过', value: 198, conversionRate: 75.3 },
    { name: '完成开发', value: 145, conversionRate: 73.2 },
    { name: '上线运行', value: 98, conversionRate: 67.6 },
    { name: '验收完成', value: 76, conversionRate: 77.6 },
  ],
  requirementProgress: {
    total: 263,
    submitted: 18,
    approved: 24,
    developing: 23,
    running: 98,
    completed: 100,
    estimatedHours: 2500,
    actualHours: 2800,
  },
  todayVolume: 1258,
  totalVolume: 98432,
  volumeGrowthMoM: 15.2,
  todayHoursSaved: 562,
  totalHoursSaved: 42180,
  hoursPerYearFactor: 2000,
  volumeTrend: [
    { month: '2025-10', volume: 12450 },
    { month: '2025-11', volume: 14820 },
    { month: '2025-12', volume: 16930 },
    { month: '2026-01', volume: 17820 },
    { month: '2026-02', volume: 18540 },
    { month: '2026-03', volume: 17872 },
  ],
  volumeRanking: [
    { name: '订单自动处理', volume: 18420 },
    { name: '发票识别录入', volume: 15280 },
    { name: '报销自动审批', volume: 12150 },
    { name: '薪资计算', volume: 8420 },
    { name: '合同条款审核', volume: 6240 },
  ],
  timeSavedTrend: [
    { month: '2025-10', hours: 5240, cumulative: 5240 },
    { month: '2025-11', hours: 6180, cumulative: 11420 },
    { month: '2025-12', hours: 7320, cumulative: 18740 },
    { month: '2026-01', hours: 7820, cumulative: 26560 },
    { month: '2026-02', hours: 8120, cumulative: 34680 },
    { month: '2026-03', hours: 7500, cumulative: 42180 },
  ],
  businessTypeShare: [
    { name: 'Finance', value: 32 },
    { name: 'Operations', value: 26 },
    { name: 'HR', value: 18 },
    { name: 'Legal', value: 14 },
    { name: 'IT', value: 10 },
  ],
  departmentOutcomes: [
    { department: 'Finance', requirementCount: 38, runningCount: 24, hoursSaved: 14820, costSaved: 612000 },
    { department: 'Operations', requirementCount: 32, runningCount: 21, hoursSaved: 11250, costSaved: 453000 },
    { department: 'Human Resources', requirementCount: 24, runningCount: 18, hoursSaved: 7860, costSaved: 256000 },
    { department: 'Legal', requirementCount: 18, runningCount: 12, hoursSaved: 4520, costSaved: 182000 },
    { department: 'IT', requirementCount: 15, runningCount: 9, hoursSaved: 3730, costSaved: 123840 },
  ],
  devCapacity: {
    requirement: {
      monthlyDelivered: 24,
      avgCycleDays: 18.5,
      developerCount: 18,
    },
    process: {
      monthlyDelivered: 56,
      avgCycleDays: 6.2,
      developerCount: 22,
    },
    capacityTrend: [
      { month: '2025-10', requirement: 14, process: 32 },
      { month: '2025-11', requirement: 18, process: 41 },
      { month: '2025-12', requirement: 21, process: 47 },
      { month: '2026-01', requirement: 22, process: 50 },
      { month: '2026-02', requirement: 25, process: 58 },
      { month: '2026-03', requirement: 24, process: 56 },
    ],
    // FEAT-023 严格规格补充
    kpi: {
      totalEstimatedHours: 2500,
      totalActualHours: 2800,
      completionRate: 65,
      unregisteredProcessCount: 8,
      activeDeveloperCount: 22,
      timeoutProcessCount: 5,
    },
    accuracyScatter: [
      { processName: '发票识别录入', estimatedHours: 80, actualHours: 92 },
      { processName: '订单自动处理', estimatedHours: 120, actualHours: 138 },
      { processName: '报销自动审批', estimatedHours: 60, actualHours: 55 },
      { processName: '薪资计算', estimatedHours: 95, actualHours: 110 },
      { processName: '合同条款审核', estimatedHours: 140, actualHours: 175 },
      { processName: '客户数据同步', estimatedHours: 50, actualHours: 48 },
      { processName: '库存自动补货', estimatedHours: 75, actualHours: 88 },
      { processName: '员工入职自动化', estimatedHours: 65, actualHours: 70 },
      { processName: '税务申报', estimatedHours: 110, actualHours: 145 },
      { processName: '合规文档生成', estimatedHours: 85, actualHours: 78 },
    ],
    capacityTimeline: [
      { period: '2025-10', delivered: 14, planned: 16 },
      { period: '2025-11', delivered: 18, planned: 18 },
      { period: '2025-12', delivered: 21, planned: 22 },
      { period: '2026-01', delivered: 22, planned: 24 },
      { period: '2026-02', delivered: 25, planned: 24 },
      { period: '2026-03', delivered: 24, planned: 26 },
    ],
  },
  growthVsHours: [
    { month: '2025-10', growthRate: 0,    hoursSaved: 5240 },
    { month: '2025-11', growthRate: 19.0, hoursSaved: 6180 },
    { month: '2025-12', growthRate: 14.2, hoursSaved: 7320 },
    { month: '2026-01', growthRate: 5.3,  hoursSaved: 7820 },
    { month: '2026-02', growthRate: 4.0,  hoursSaved: 8120 },
    { month: '2026-03', growthRate: -3.6, hoursSaved: 7500 },
  ],
};

export const mockClassifications = [
  { value: 'all', label: '' },
  { value: 'cls-finance', label: 'Finance' },
  { value: 'cls-operations', label: 'Operations' },
  { value: 'cls-hr', label: 'Human Resources' },
  { value: 'cls-legal', label: 'Legal' },
  { value: 'cls-it', label: 'IT' },
];

export const mockBusinessTypes = [
  { value: 'all', label: '' },
  { value: 'finance', label: 'Finance' },
  { value: 'operations', label: 'Operations' },
  { value: 'hr', label: 'HR' },
  { value: 'legal', label: 'Legal' },
  { value: 'it', label: 'IT' },
];

// ============================================================
// 派生函数：让筛选 + 刷新真正影响数据
// ============================================================

import type {
  BusinessOutcomesFilter,
  RoiAnalysisFilter,
  ResourceEfficiencyFilter,
} from './types';

// 时间范围 → 缩放系数（thisMonth 为基线 1.0）
const TIME_RANGE_SCALE: Record<string, number> = {
  thisMonth: 1.0,
  lastMonth: 0.85,
  thisQuarter: 2.6,
  thisYear: 10,
  all: 14,
};

// 简易 seeded RNG（mulberry32）
function seededRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 数值 ±3% 抖动（保整数语义）
const jitter = (v: number, rng: () => number) => {
  if (typeof v !== 'number' || !isFinite(v) || v === 0) return v;
  const delta = (rng() - 0.5) * 0.06; // ±3%
  const next = v * (1 + delta);
  return Number.isInteger(v) ? Math.round(next) : Number(next.toFixed(2));
};

// 缩放 + 抖动
const scaleNum = (v: number, scale: number, rng: () => number) => {
  if (typeof v !== 'number' || !isFinite(v)) return v;
  const next = v * scale;
  return jitter(Number.isInteger(v) ? Math.round(next) : Number(next.toFixed(2)), rng);
};

// 深度遍历对象按 key 黑名单跳过（保留固定字段如 rank/id/month/period/name 等）
const SKIP_KEYS = new Set([
  'id', 'rank', 'name', 'month', 'period', 'department', 'group', 'status',
  'type', 'projectName', 'requirementName', 'processName', 'hoursPerYearFactor',
  'paybackMonths', 'savedCostTrend', 'utilizationTrend', 'requirementsTrend',
  'automationHoursTrend', 'avgExecutionTrend', 'volumeGrowthMoM',
  'completionRate', 'conversionRate', 'ratio', 'roi', 'growthRate',
]);

function scaleDeep<T>(obj: T, scale: number, rng: () => number): T {
  if (Array.isArray(obj)) return obj.map(v => scaleDeep(v, scale, rng)) as any;
  if (obj && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      if (SKIP_KEYS.has(k)) {
        // 仅做轻微抖动，不缩放（百分比/排名/标识保持稳定语义）
        out[k] = typeof v === 'number' ? jitter(v, rng) : scaleDeep(v, 1, rng);
      } else if (typeof v === 'number') {
        out[k] = scaleNum(v, scale, rng);
      } else {
        out[k] = scaleDeep(v, scale, rng);
      }
    }
    return out;
  }
  return obj;
}

const clone = <T>(x: T): T =>
  typeof structuredClone === 'function' ? structuredClone(x) : JSON.parse(JSON.stringify(x));

// =============== 业务成果看板 ===============
export function getBusinessOutcomes(
  filter: BusinessOutcomesFilter,
  seed = 0,
): BusinessOutcomesData {
  const rng = seededRng((seed || 1) ^ hashStr(JSON.stringify(filter)));
  const timeScale = TIME_RANGE_SCALE[filter.timeRange] ?? 1;
  // 多选维度缩放：选中数量越多越接近 1
  const multiScale = (selected: number, total: number, minScale: number) => {
    if (selected <= 0 || selected >= total) return 1;
    return minScale + (1 - minScale) * (selected / total);
  };
  const deptTotal = mockDepartments.filter(d => d.value !== 'all').length;
  const bizTotal = mockBusinessTypes.filter(b => b.value !== 'all').length;
  const clsTotal = mockClassifications.filter(c => c.value !== 'all').length;
  const deptScale = multiScale(filter.departments.length, deptTotal, 0.28);
  const bizScale = multiScale(filter.businessTypes.length, bizTotal, 0.4);
  const clsScale = multiScale(filter.classifications.length, clsTotal, 0.4);
  const totalScale = timeScale * deptScale * bizScale * clsScale;

  let data = scaleDeep(clone(mockBusinessOutcomes), totalScale, rng);

  // 部门切片
  if (filter.departments.length > 0) {
    const deptLabels = filter.departments
      .map(v => mockDepartments.find(d => d.value === v)?.label)
      .filter((l): l is string => !!l);
    if (deptLabels.length > 0) {
      const lower = deptLabels.map(l => l.toLowerCase());
      data.departmentOutcomes = data.departmentOutcomes.filter(d =>
        lower.some(l => d.department.toLowerCase().includes(l)),
      );
      if (data.departmentOutcomes.length === 0) {
        data.departmentOutcomes = deptLabels.map(deptLabel => ({
          department: deptLabel,
          requirementCount: Math.max(1, Math.round(20 * deptScale)),
          runningCount: Math.max(1, Math.round(12 * deptScale)),
          hoursSaved: Math.round(8000 * timeScale * deptScale),
          costSaved: Math.round(300000 * timeScale * deptScale),
        }));
      }
    }
  }

  // 业务类型 / 分类聚焦：饼图保留命中分片
  const focusNames: string[] = [];
  if (filter.businessTypes.length > 0) {
    filter.businessTypes.forEach(v => {
      const label = mockBusinessTypes.find(b => b.value === v)?.label;
      if (label) focusNames.push(label);
    });
  } else if (filter.classifications.length > 0) {
    filter.classifications.forEach(v => {
      const label = mockClassifications.find(c => c.value === v)?.label;
      if (label) focusNames.push(label);
    });
  }
  if (focusNames.length > 0) {
    const lower = focusNames.map(n => n.toLowerCase());
    const hits = data.businessTypeShare.filter(s => lower.some(n => s.name.toLowerCase() === n));
    if (hits.length > 0) {
      const sum = hits.reduce((acc, h) => acc + h.value, 0) || 1;
      data.businessTypeShare = hits.map(h => ({ name: h.name, value: Math.round((h.value / sum) * 100) }));
    } else {
      const each = Math.round(100 / focusNames.length);
      data.businessTypeShare = focusNames.map(n => ({ name: n, value: each }));
    }
  }

  // 今日维度：累计型砍到 1/30，趋势仅保留最后一个点
  if (filter.timeDimension === 'today') {
    const trim = (v: number) => Math.max(0, Math.round(v / 30));
    data.totalVolume = trim(data.totalVolume);
    data.totalHoursSaved = trim(data.totalHoursSaved);
    data.requirementProgress.estimatedHours = trim(data.requirementProgress.estimatedHours);
    data.requirementProgress.actualHours = trim(data.requirementProgress.actualHours);
    data.volumeTrend = data.volumeTrend.slice(-1);
    data.timeSavedTrend = data.timeSavedTrend.slice(-1);
    data.growthVsHours = data.growthVsHours.slice(-1);
    data.devCapacity.capacityTimeline = data.devCapacity.capacityTimeline.slice(-1);
  }

  return data;
}

// =============== ROI 分析 ===============
export interface RoiAnalysisDerived {
  metrics: RoiMetrics;
  requirements: RequirementRoiDetail[];
  departments: DepartmentRoiDetail[];
  projects: ProjectRoiDetail[];
}

export function getRoiAnalysis(filter: RoiAnalysisFilter, seed = 0): RoiAnalysisDerived {
  const rng = seededRng((seed || 1) ^ hashStr(JSON.stringify(filter)));
  const timeScale = TIME_RANGE_SCALE[filter.timeRange] ?? 1;
  const multiScale = (selectedCount: number, total: number, base: number) => {
    if (selectedCount <= 0 || selectedCount >= total) return 1;
    return base + (1 - base) * (selectedCount / total);
  };
  const deptTotal = mockDepartments.filter(d => d.value !== 'all').length;
  const projTotal = mockProjects.filter(p => p.value !== 'all').length;
  const clsTotal = mockClassifications.filter(c => c.value !== 'all').length;
  const deptScale = multiScale(filter.departments.length, deptTotal, 0.3);
  const projScale = multiScale(filter.projects.length, projTotal, 0.4);
  const clsScale = multiScale(filter.classifications.length, clsTotal, 0.5);
  const totalScale = timeScale * deptScale * projScale * clsScale;

  const metrics = scaleDeep(clone(mockRoiMetrics), totalScale, rng);
  // 总投入成本以「成本管理」全部成本之和为准，不随筛选/缩放变化
  metrics.totalInvestmentCost = getTotalInvestmentFromCostStore();

  let requirements = clone(mockRequirementRoiDetails);
  let departments = clone(mockDepartmentRoiDetails);
  let projects = clone(mockProjectRoiDetails);

  if (filter.departments.length > 0) {
    const deptLabels = filter.departments
      .map(v => mockDepartments.find(d => d.value === v)?.label?.toLowerCase())
      .filter(Boolean) as string[];
    if (deptLabels.length > 0) {
      requirements = requirements.filter(r => deptLabels.some(l => r.department.toLowerCase().includes(l)));
      departments = departments.filter(d => deptLabels.some(l => d.department.toLowerCase().includes(l)));
    }
  }
  if (filter.projects.length > 0) {
    const projLabels = filter.projects
      .map(v => mockProjects.find(p => p.value === v)?.label?.toLowerCase())
      .filter(Boolean) as string[];
    if (projLabels.length > 0) {
      projects = projects.filter(p => projLabels.some(l => p.projectName.toLowerCase().includes(l)));
    }
  }
  if (filter.classifications.length > 0) {
    const clsLabels = filter.classifications
      .map(v => mockClassifications.find(c => c.value === v)?.label?.toLowerCase())
      .filter(Boolean) as string[];
    if (clsLabels.length > 0) {
      requirements = requirements.filter(r => clsLabels.some(l => r.department.toLowerCase().includes(l)));
    }
  }

  requirements = scaleDeep(requirements, totalScale, rng);
  departments = scaleDeep(departments, totalScale, rng);
  projects = scaleDeep(projects, totalScale, rng);

  return { metrics, requirements, departments, projects };
}

// =============== 资源效能 ===============
export function getResourceEfficiency(
  filter: ResourceEfficiencyFilter,
  seed = 0,
): ResourceEfficiencyData {
  const rng = seededRng((seed || 1) ^ hashStr(JSON.stringify(filter)));
  const timeScale = TIME_RANGE_SCALE[filter.timeRange] ?? 1;
  const deptCount = filter.departments?.length ?? 0;
  const groupScale = deptCount > 0 ? Math.min(1, 0.35 * deptCount + 0.15) : 1;
  const totalScale = timeScale * groupScale;

  let data = clone(mockResourceEfficiency);

  if (deptCount > 0) {
    const labels = filter.departments
      .map(v => mockDepartments.find(d => d.value === v)?.label?.toLowerCase())
      .filter(Boolean) as string[];
    if (labels.length) {
      data.robotDetails = data.robotDetails.filter(r =>
        labels.some(l => r.group.toLowerCase().includes(l) || l.includes(r.group.toLowerCase()))
      );
      data.groupUtilization = data.groupUtilization.filter(g =>
        labels.some(l => g.group.toLowerCase().includes(l) || l.includes(g.group.toLowerCase()))
      );
    }
  }
  if (filter.status !== 'all') {
    data.robotDetails = data.robotDetails.filter(r => r.status === filter.status);
  }

  data = scaleDeep(data, totalScale, rng);

  if (filter.timeDimension === 'today') {
    data.totalTasks = Math.round(data.totalTasks / 30);
    data.totalRunMinutes = Math.round(data.totalRunMinutes / 30);
    data.taskStats = {
      total: Math.round(data.taskStats.total / 30),
      success: Math.round(data.taskStats.success / 30),
      failed: Math.round(data.taskStats.failed / 30),
      running: Math.round(data.taskStats.running / 30),
      timeout: Math.round(data.taskStats.timeout / 30),
    };
    data.taskVolumeTrend = data.taskVolumeTrend.slice(-1);
    data.utilizationTrend = data.utilizationTrend.slice(-1);
    data.successRateTrend = data.successRateTrend.slice(-1);
  }

  return data;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
