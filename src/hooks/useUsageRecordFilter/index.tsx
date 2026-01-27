import { useState, useCallback, useMemo } from 'react';

/**
 * 使用记录筛选选项
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * 日期预设选项
 */
export interface DatePreset {
  text: string;
  start: Date;
  end: Date;
}

/**
 * 使用记录筛选状态
 */
export interface UsageRecordFilterState {
  // 用户筛选
  userFilter: string[];
  setUserFilter: React.Dispatch<React.SetStateAction<string[]>>;
  
  // 日期范围筛选
  dateRange: [Date, Date] | null;
  setDateRange: React.Dispatch<React.SetStateAction<[Date, Date] | null>>;
  
  // 筛选弹出层可见性
  filterPopoverVisible: boolean;
  setFilterPopoverVisible: React.Dispatch<React.SetStateAction<boolean>>;
  
  // 筛选数量（不含日期）
  filterCount: number;
  
  // 重置所有筛选
  resetFilters: () => void;
  
  // 处理日期变化（自动处理空数组转 null）
  handleDateRangeChange: (dates: Date[] | null | undefined) => void;
  
  // 日期快捷选项
  datePresets: DatePreset[];
}

interface UseUsageRecordFilterOptions {
  onFilterChange?: () => void;
}

/**
 * 获取今天的开始时间
 */
const getStartOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * 获取今天的结束时间
 */
const getEndOfDay = (date: Date): Date => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * 使用记录筛选 Hook
 * 封装用户筛选和日期范围筛选的状态管理
 */
export const useUsageRecordFilter = (
  options?: UseUsageRecordFilterOptions
): UsageRecordFilterState => {
  const { onFilterChange } = options || {};
  
  // 用户筛选状态
  const [userFilter, setUserFilter] = useState<string[]>([]);
  
  // 日期范围状态
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  
  // 筛选弹出层可见性
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  
  // 计算筛选数量（日期筛选独立，不计入筛选按钮）
  const filterCount = useMemo(() => userFilter.length, [userFilter]);
  
  // 日期快捷选项
  const datePresets = useMemo((): DatePreset[] => {
    const now = new Date();
    const today = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    
    // 昨天
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = getEndOfDay(yesterday);
    
    // 最近7天
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 6);
    
    // 最近30天
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 29);
    
    // 本周（周一开始）
    const thisWeekStart = new Date(today);
    const dayOfWeek = thisWeekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    thisWeekStart.setDate(thisWeekStart.getDate() - diff);
    
    // 本月
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return [
      { text: '今天', start: today, end: todayEnd },
      { text: '昨天', start: yesterday, end: yesterdayEnd },
      { text: '最近7天', start: last7Days, end: todayEnd },
      { text: '最近30天', start: last30Days, end: todayEnd },
      { text: '本周', start: thisWeekStart, end: todayEnd },
      { text: '本月', start: thisMonthStart, end: todayEnd },
    ];
  }, []);
  
  // 重置所有筛选
  const resetFilters = useCallback(() => {
    setUserFilter([]);
    setDateRange(null);
    setFilterPopoverVisible(false);
    onFilterChange?.();
  }, [onFilterChange]);
  
  // 处理日期范围变化（自动处理空数组转 null）
  const handleDateRangeChange = useCallback((dates: Date[] | null | undefined) => {
    // 清空日期时 dates 可能是空数组，需要转换为 null
    const validDates = dates && Array.isArray(dates) && dates.length === 2 && dates[0] && dates[1]
      ? (dates as [Date, Date])
      : null;
    setDateRange(validDates);
    onFilterChange?.();
  }, [onFilterChange]);
  
  return {
    userFilter,
    setUserFilter,
    dateRange,
    setDateRange,
    filterPopoverVisible,
    setFilterPopoverVisible,
    filterCount,
    resetFilters,
    handleDateRangeChange,
    datePresets,
  };
};

export default useUsageRecordFilter;
