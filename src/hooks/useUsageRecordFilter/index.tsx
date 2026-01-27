import { useState, useCallback, useMemo } from 'react';

/**
 * 使用记录筛选选项
 */
export interface FilterOption {
  value: string;
  label: string;
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
}

interface UseUsageRecordFilterOptions {
  onFilterChange?: () => void;
}

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
  };
};

export default useUsageRecordFilter;
