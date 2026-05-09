import type { PublishProcessRecord, PublishShareStatus } from './types';

const PROCESS_NAMES = [
  'Invoice Generation Automation',
  'Contract Review Automation',
  'Customer Info Sync',
  'Employee Onboarding Flow',
  'Monthly Financial Report',
  'Order Processing',
  'Inventory Sync to ERP',
  'Lead Qualification Bot',
  'Helpdesk Ticket Triage',
  'Vendor Master Data Sync',
  'Payroll Validation',
  'Expense Approval Workflow',
  'KYC Identity Verification',
  'Marketing Campaign Dispatch',
  'IT Asset Discovery',
];

const DEPARTMENTS = ['财务部', '法务部', '信息中心', '人力资源', '运营中心', '市场部', '研发中心'];
const PUBLISHERS = [
  { name: '张三', dept: '研发中心' },
  { name: '李四', dept: '产品中心' },
  { name: '王五', dept: '运营中心' },
  { name: '赵六', dept: '财务部' },
];

const STATUS_BY_INDEX: PublishShareStatus[] = [
  'UNPUBLISHED', 'UNPUBLISHED', 'PENDING_APPROVAL', 'UNPUBLISHED',
  'PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'UNPUBLISHED',
  'PUBLISHED', 'UNPUBLISHED', 'PENDING_APPROVAL', 'UNPUBLISHED',
  'UNPUBLISHED', 'PUBLISHED', 'UNPUBLISHED',
];

const pad = (n: number) => String(n).padStart(2, '0');

export const generateMockRecords = (): PublishProcessRecord[] => {
  const now = new Date();
  return PROCESS_NAMES.map((name, i) => {
    const date = new Date(now);
    date.setDate(now.getDate() - i * 2);
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    const status = STATUS_BY_INDEX[i] ?? 'UNPUBLISHED';
    const publisher = PUBLISHERS[i % PUBLISHERS.length];
    const versionMajor = (i % 3) + 1;
    const versionMinor = i % 5;

    return {
      id: `pp-${String(i + 1).padStart(3, '0')}`,
      processId: `proc-${String(i + 1).padStart(3, '0')}`,
      processName: name,
      version: `v${versionMajor}.${versionMinor}.0`,
      description: `${name}：自动化覆盖核心业务环节，支持参数配置与多环境运行。`,
      department: DEPARTMENTS[i % DEPARTMENTS.length],
      releaseId: `RLS-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${String(i + 1).padStart(3, '0')}`,
      publisherName: publisher.name,
      publisherDepartment: publisher.dept,
      publishTime: dateStr,
      shareStatus: status,
      submitTime: status === 'PENDING_APPROVAL' ? date.getTime() : undefined,
      assetId: status === 'PUBLISHED' || status === 'PENDING_APPROVAL' ? `ASSET-${String(i + 1).padStart(4, '0')}` : undefined,
      reviewComment: status === 'REJECTED' ? '流程描述不完整，请补充触发条件与依赖说明后再提交。' : undefined,
    };
  });
};
