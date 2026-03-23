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
