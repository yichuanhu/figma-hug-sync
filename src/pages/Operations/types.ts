// 运营中心数据类型定义

// ROI 指标
export interface RoiMetrics {
  totalSavedCost: number;        // 总节约成本
  robotUtilization: number;      // 机器人利用率 (%)
  activeRequirements: number;    // 活跃需求数
  totalAutomationHours: number;  // 累计自动化时数
  totalInvestmentCost: number;   // 总投入成本
  savedCostTrend: number;        // 节约成本环比 (%)
  utilizationTrend: number;      // 利用率环比 (%)
  requirementsTrend: number;     // 需求环比变化
  automationHoursTrend: number;  // 自动化时数环比变化
}

// 资源概览
export interface ResourceOverviewData {
  interactiveOnline: number;     // 人机交互在线数
  interactiveTotal: number;      // 人机交互授权数
  unattendedOnline: number;      // 无人值守在线数
  unattendedTotal: number;       // 无人值守授权数
  todayTasks: number;            // 今日任务量
  totalTasks: number;            // 累计任务量
  todayRunMinutes: number;       // 今日运行时长(分钟)
  totalRunMinutes: number;       // 累计运行时长(分钟)
}

// 需求概览
export interface RequirementOverviewData {
  developing: number;            // 开发中
  completed: number;             // 已完成
  running: number;               // 运行中
  total: number;                 // 历史总数
}

// ROI 趋势数据点
export interface RoiTrendPoint {
  month: string;
  roi: number;                   // ROI%
  investmentCost: number;        // 投入成本
  savedCost: number;             // 节约成本
}

// 部门 ROI 排行
export interface DepartmentRoiItem {
  rank: number;
  department: string;
  investmentCost: number;
  savedCost: number;
  roi: number;
  trend: number[];               // 迷你趋势数据
}

// 需求 ROI 排行
export interface RequirementRoiItem {
  rank: number;
  requirementName: string;
  department: string;
  roi: number;
  status: string;
}


// ROI Analysis - 需求维度详情
export interface RequirementRoiDetail {
  id: string;
  name: string;
  department: string;
  roi: number;
  investmentCost: number;
  savedCost: number;
  status: string;
}

// ROI Analysis - 部门维度详情
export interface DepartmentRoiDetail {
  department: string;
  investmentCost: number;
  savedCost: number;
  roi: number;
  requirementCount: number;
  robotCount: number;
  trend: number[];
}

// ROI Analysis - 项目维度详情
export interface ProjectRoiDetail {
  projectName: string;
  status: string;
  investmentCost: number;
  savedCost: number;
  roi: number;
  requirementCount: number;
}

// ROI Analysis 筛选条件
export interface RoiAnalysisFilter {
  timeRange: string;
  department: string;
  project: string;
  timeDimension: string;
}

// 筛选条件
export interface DashboardFilter {
  timeRange: string;
  department: string;
  project: string;
}

// 资源效能 - 机器人详情
export interface RobotDetail {
  id: string;
  name: string;
  type: 'interactive' | 'unattended';
  group: string;
  status: 'working' | 'idle' | 'offline' | 'maintenance';
  utilization: number;
  monthlyTasks: number;
  trend: number[];
}

// 资源效能 - 任务执行统计
export interface TaskExecutionStats {
  total: number;
  success: number;
  failed: number;
  running: number;
  timeout: number;
}

// 资源效能 - 利用率趋势点
export interface UtilizationTrendPoint {
  month: string;
  utilization: number;
}

// 资源效能 - 分组利用率
export interface GroupUtilization {
  group: string;
  utilization: number;
  robotCount: number;
}

// 资源效能 - 成功率趋势点
export interface SuccessRateTrendPoint {
  month: string;
  rate: number;
}

// 资源效能 - 聚合数据
export interface ResourceEfficiencyData {
  overallUtilization: number;
  totalRobots: number;
  working: number;
  idle: number;
  offline: number;
  maintenance: number;
  interactiveOnline: number;
  interactiveTotal: number;
  unattendedOnline: number;
  unattendedTotal: number;
  robotDetails: RobotDetail[];
  taskStats: TaskExecutionStats;
  todayTasks: number;
  totalTasks: number;
  todayRunMinutes: number;
  totalRunMinutes: number;
  successRateToday: number;
  successRateTotal: number;
  utilizationTrend: UtilizationTrendPoint[];
  groupUtilization: GroupUtilization[];
  successRateTrend: SuccessRateTrendPoint[];
}

// 资源效能 - 筛选条件
export interface ResourceEfficiencyFilter {
  timeRange: string;
  group: string;
  status: string;
  timeDimension: string;
}
