import type {
  RoiMetrics,
  ResourceOverviewData,
  RequirementOverviewData,
  RoiTrendPoint,
  DepartmentRoiItem,
  RequirementRoiItem,
} from './types';

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
  { rank: 1, department: '财务部', investmentCost: 198000, savedCost: 612000, roi: 309, trend: [120, 180, 220, 280, 300, 309] },
  { rank: 2, department: '运营部', investmentCost: 152000, savedCost: 453000, roi: 198, trend: [80, 110, 140, 170, 190, 198] },
  { rank: 3, department: '人事部', investmentCost: 104000, savedCost: 256000, roi: 146, trend: [50, 70, 90, 120, 135, 146] },
  { rank: 4, department: 'IT部', investmentCost: 183000, savedCost: 365000, roi: 99, trend: [30, 50, 65, 80, 90, 99] },
  { rank: 5, department: '法务部', investmentCost: 118000, savedCost: 182000, roi: 54, trend: [10, 20, 30, 40, 48, 54] },
];

export const mockRequirementRoi: RequirementRoiItem[] = [
  { rank: 1, requirementName: '发票自动识别与录入', department: '财务部', roi: 512, status: 'running' },
  { rank: 2, requirementName: '订单自动处理与分发', department: '运营部', roi: 348, status: 'running' },
  { rank: 3, requirementName: '报销单据自动审批', department: '财务部', roi: 283, status: 'running' },
  { rank: 4, requirementName: '薪资自动计算与核验', department: '人事部', roi: 221, status: 'running' },
  { rank: 5, requirementName: '合同条款自动审核', department: '法务部', roi: 176, status: 'running' },
];

// 部门和项目选项
export const mockDepartments = [
  { value: 'all', label: '全部' },
  { value: 'finance', label: '财务部' },
  { value: 'operations', label: '运营部' },
  { value: 'hr', label: '人事部' },
  { value: 'it', label: 'IT部' },
  { value: 'legal', label: '法务部' },
];

export const mockProjects = [
  { value: 'all', label: '全部' },
  { value: 'proj-001', label: '财务自动化项目' },
  { value: 'proj-002', label: '运营效能提升' },
  { value: 'proj-003', label: 'HR数字化转型' },
];
