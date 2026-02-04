import { useMemo, useCallback } from 'react';
import { Typography, Tooltip } from '@douyinfe/semi-ui';
import type { LYSpecialDate } from '@/api/index';
import './index.less';

const { Text } = Typography;

interface YearCalendarGridProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  weekendDays: number[]; // 0-6, 0=Sunday
  specialDates: LYSpecialDate[];
  readonly?: boolean;
  onDateToggle?: (date: string, isCurrentlyNonWorkday: boolean) => void;
}

// Weekday headers
const WEEKDAY_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const YearCalendarGrid: React.FC<YearCalendarGridProps> = ({
  startDate,
  endDate,
  weekendDays,
  specialDates,
  readonly = true,
  onDateToggle,
}) => {
  // Parse start and end dates
  const { startYear, startMonth, endYear, endMonth } = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return {
      startYear: start.getFullYear(),
      startMonth: start.getMonth(),
      endYear: end.getFullYear(),
      endMonth: end.getMonth(),
    };
  }, [startDate, endDate]);

  // Create special dates lookup map
  const specialDatesMap = useMemo(() => {
    const map = new Map<string, LYSpecialDate>();
    specialDates.forEach((sd) => {
      map.set(sd.date, sd);
    });
    return map;
  }, [specialDates]);

  // Check if a date is within the period
  const isDateInPeriod = useCallback((dateStr: string) => {
    return dateStr >= startDate && dateStr <= endDate;
  }, [startDate, endDate]);

  // Check if a date is a non-workday
  const isNonWorkday = useCallback((dateStr: string, dayOfWeek: number) => {
    const special = specialDatesMap.get(dateStr);
    if (special) {
      if (special.type === 'HOLIDAY') return true;
      if (special.type === 'WORKDAY') return false; // 调休，是工作日
    }
    // Check if it's a weekend
    return weekendDays.includes(dayOfWeek);
  }, [specialDatesMap, weekendDays]);

  // Get special date info for tooltip
  const getSpecialDateInfo = useCallback((dateStr: string) => {
    return specialDatesMap.get(dateStr);
  }, [specialDatesMap]);

  // Generate months to display
  const monthsToDisplay = useMemo(() => {
    const months: { year: number; month: number }[] = [];
    let currentYear = startYear;
    let currentMonth = startMonth;
    
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      months.push({ year: currentYear, month: currentMonth });
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    
    return months;
  }, [startYear, startMonth, endYear, endMonth]);

  // Generate days for a month
  const generateMonthDays = useCallback((year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: string; day: number; dayOfWeek: number } | null> = [];
    
    // Add empty cells for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: dateStr,
        day,
        dayOfWeek: (startingDayOfWeek + day - 1) % 7,
      });
    }
    
    return days;
  }, []);

  // Handle date click
  const handleDateClick = useCallback((dateStr: string, dayOfWeek: number) => {
    if (readonly || !onDateToggle) return;
    if (!isDateInPeriod(dateStr)) return;
    
    const isCurrentlyNonWorkday = isNonWorkday(dateStr, dayOfWeek);
    onDateToggle(dateStr, isCurrentlyNonWorkday);
  }, [readonly, onDateToggle, isDateInPeriod, isNonWorkday]);

  // Render a single month
  const renderMonth = useCallback((year: number, month: number) => {
    const days = generateMonthDays(year, month);
    
    return (
      <div key={`${year}-${month}`} className="year-calendar-month">
        <Text strong className="year-calendar-month-title">
          {year}年{MONTH_NAMES[month]}
        </Text>
        <div className="year-calendar-month-header">
          {WEEKDAY_HEADERS.map((header, index) => (
            <div
              key={index}
              className={`year-calendar-weekday ${weekendDays.includes(index) ? 'year-calendar-weekday-weekend' : ''}`}
            >
              {header}
            </div>
          ))}
        </div>
        <div className="year-calendar-month-grid">
          {days.map((dayInfo, index) => {
            if (!dayInfo) {
              return <div key={index} className="year-calendar-day year-calendar-day-empty" />;
            }
            
            const { date, day, dayOfWeek } = dayInfo;
            const inPeriod = isDateInPeriod(date);
            const nonWorkday = isNonWorkday(date, dayOfWeek);
            const specialInfo = getSpecialDateInfo(date);
            
            const dayElement = (
              <div
                key={index}
                className={`year-calendar-day 
                  ${!inPeriod ? 'year-calendar-day-outside' : ''} 
                  ${nonWorkday && inPeriod ? 'year-calendar-day-nonworkday' : ''} 
                  ${!readonly && inPeriod ? 'year-calendar-day-editable' : ''}
                `}
                onClick={() => handleDateClick(date, dayOfWeek)}
              >
                <span className="year-calendar-day-number">{day}</span>
              </div>
            );
            
            if (specialInfo && specialInfo.name && inPeriod) {
              return (
                <Tooltip key={index} content={specialInfo.name}>
                  {dayElement}
                </Tooltip>
              );
            }
            
            return dayElement;
          })}
        </div>
      </div>
    );
  }, [generateMonthDays, weekendDays, isDateInPeriod, isNonWorkday, getSpecialDateInfo, handleDateClick, readonly]);

  return (
    <div className="year-calendar-grid">
      {monthsToDisplay.map(({ year, month }) => renderMonth(year, month))}
    </div>
  );
};

export default YearCalendarGrid;
