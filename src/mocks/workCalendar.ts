 import type { LYWorkCalendarResponse } from '@/api/index';
 
 // 共享的工作日历 Mock 数据
 const now = new Date();
 const year = now.getFullYear();
 
 export const mockWorkCalendarData: LYWorkCalendarResponse[] = [
   {
     id: 'cal-001',
     name: '2025年工作日历',
     template: 'WEEKEND_DOUBLE',
     start_date: `${year}-01-01`,
     end_date: `${year}-12-31`,
     weekend_days: [0, 6],
     special_dates: [
       { date: `${year}-01-01`, type: 'HOLIDAY', name: '元旦' },
       { date: `${year}-01-28`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-01-29`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-01-30`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-01-31`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-02-01`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-02-02`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-02-03`, type: 'HOLIDAY', name: '春节' },
       { date: `${year}-01-26`, type: 'WORKDAY', name: '春节调休' },
       { date: `${year}-02-08`, type: 'WORKDAY', name: '春节调休' },
       { date: `${year}-04-04`, type: 'HOLIDAY', name: '清明节' },
       { date: `${year}-05-01`, type: 'HOLIDAY', name: '劳动节' },
       { date: `${year}-05-02`, type: 'HOLIDAY', name: '劳动节' },
       { date: `${year}-05-03`, type: 'HOLIDAY', name: '劳动节' },
       { date: `${year}-06-01`, type: 'HOLIDAY', name: '端午节' },
       { date: `${year}-10-01`, type: 'HOLIDAY', name: '国庆节' },
       { date: `${year}-10-02`, type: 'HOLIDAY', name: '国庆节' },
       { date: `${year}-10-03`, type: 'HOLIDAY', name: '国庆节' },
       { date: `${year}-10-04`, type: 'HOLIDAY', name: '国庆节' },
       { date: `${year}-10-05`, type: 'HOLIDAY', name: '国庆节' },
       { date: `${year}-10-06`, type: 'HOLIDAY', name: '国庆节' },
       { date: `${year}-10-07`, type: 'HOLIDAY', name: '国庆节' },
     ],
     reference_count: 2,
     creator_id: 'user-001',
     creator_name: '张三',
     created_at: '2024-12-01T10:00:00Z',
     updated_at: '2024-12-15T14:30:00Z',
   },
   {
     id: 'cal-002',
     name: '研发团队日历',
     template: 'WEEKEND_SINGLE',
     start_date: `${year}-01-01`,
     end_date: `${year}-06-30`,
     weekend_days: [0],
     special_dates: [
       { date: `${year}-01-01`, type: 'HOLIDAY', name: '元旦' },
     ],
     reference_count: 0,
     creator_id: 'user-002',
     creator_name: '李四',
     created_at: '2025-01-05T09:00:00Z',
     updated_at: '2025-01-05T09:00:00Z',
   },
   {
     id: 'cal-003',
     name: '银行工作日历',
     template: 'WEEKEND_DOUBLE',
     start_date: `${year}-01-01`,
     end_date: `${year}-12-31`,
     weekend_days: [0, 6],
     special_dates: [
       { date: `${year}-01-01`, type: 'HOLIDAY', name: '元旦' },
       { date: `${year}-05-01`, type: 'HOLIDAY', name: '劳动节' },
       { date: `${year}-10-01`, type: 'HOLIDAY', name: '国庆节' },
     ],
     reference_count: 1,
     creator_id: 'user-001',
     creator_name: '张三',
     created_at: '2025-01-10T08:00:00Z',
     updated_at: '2025-01-10T08:00:00Z',
   },
 ];
 
 // 转换为 Select 组件使用的选项格式
 export const getWorkCalendarOptions = () => {
   return mockWorkCalendarData.map((cal) => ({
     value: cal.id,
     label: cal.name,
   }));
 };
 
 // 根据 ID 获取日历
 export const getWorkCalendarById = (id: string) => {
   return mockWorkCalendarData.find((cal) => cal.id === id);
 };