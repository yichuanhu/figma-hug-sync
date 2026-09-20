/** 公有云 Mock 数据 */
import type {
  CloudUser,
  CloudProduct,
  CloudLedgerRecord,
  CloudTeam,
  CloudInvitation,
  CloudCreditAccount,
  CloudResourcePack,
  CloudPlan,
  CloudSubscription,
} from '../types';

export const cloudUser: CloudUser = {
  id: 'u-001',
  name: '张明',
  email: 'zhangming@example.com',
  initials: 'ZM',
  workspaceName: '未来工作室',
};

export const cloudProducts: CloudProduct[] = [
  {
    id: 'p-adp',
    code: 'ADP',
    name: '文档智能',
    description: '解析合同、票据与复杂文档，提取结构化数据',
    lastUsed: '今天 10:08',
    accent: '#5B6CF9',
  },
  {
    id: 'p-meeting',
    code: 'MEETING',
    name: '会议助手',
    description: '实时转写会议内容，自动生成摘要与行动项',
    lastUsed: '今天 09:10',
    accent: '#17B26A',
  },
  {
    id: 'p-service',
    code: 'SERVICE',
    name: '智能客服',
    description: '构建企业知识库，统一管理智能问答服务',
    lastUsed: '昨天 16:24',
    accent: '#F79009',
  },
];

export const cloudLedger: CloudLedgerRecord[] = [
  { id: 'l-1', title: '文档智能 · 合同解析', scene: '个人空间', type: 'EXPENSE', amount: 12, time: '今天 10:08' },
  { id: 'l-2', title: '月度套餐赠送积分', scene: 'Basic 套餐', type: 'INCOME', amount: 500, time: '09-11 00:00' },
  { id: 'l-3', title: '会议助手 · 实时转写', scene: '个人空间', type: 'EXPENSE', amount: 36, time: '今天 09:10' },
  { id: 'l-4', title: '智能客服 · 知识问答', scene: '文档智能小队', type: 'EXPENSE', amount: 8, time: '昨天 16:24' },
  { id: 'l-5', title: '积分充值', scene: '在线支付', type: 'INCOME', amount: 200, time: '09-05 14:32' },
];

export const cloudOwnedTeams: CloudTeam[] = [
  {
    id: 't-1',
    name: '文档智能小队',
    initials: 'TI',
    ownerName: '张明',
    planName: 'Basic 套餐',
    memberCount: 3,
    sharedCredits: 496,
    myRole: 'OWNER',
    joinedAt: '2026-05-12',
    active: true,
    members: [
      { id: 'm-1', name: '张明', email: 'zhangming@example.com', role: 'OWNER', status: 'ACTIVE', joinedAt: '2026-05-12' },
      { id: 'm-2', name: '林琪', email: 'linqi@example.com', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-06-01' },
      { id: 'm-3', name: '陈婷', email: 'chenting@example.com', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-07-18' },
    ],
  },
];

export const cloudJoinedTeams: CloudTeam[] = [
  {
    id: 't-2',
    name: '市场增长组',
    initials: 'MG',
    ownerName: '王磊',
    planName: 'Pro 套餐',
    memberCount: 8,
    sharedCredits: 1280,
    myRole: 'MEMBER',
    joinedAt: '2026-04-02',
    active: true,
    members: [],
  },
  {
    id: 't-3',
    name: '客户成功中心',
    initials: 'CS',
    ownerName: '刘芳',
    planName: 'Enterprise 套餐',
    memberCount: 16,
    sharedCredits: 5200,
    myRole: 'MEMBER',
    joinedAt: '2026-02-20',
    active: true,
    members: [],
  },
];

export const cloudInvitations: CloudInvitation[] = [
  { id: 'i-1', email: 'wanglei@example.com', expiresAt: '2026-08-26 18:00' },
];

export const cloudCreditAccounts: CloudCreditAccount[] = [
  {
    id: 'a-personal',
    name: '张明的个人空间',
    type: 'PERSONAL',
    balance: 80,
    monthlyGrant: 500,
    usedThisMonth: 420,
    expireDesc: '套餐积分每月 11 日重置',
  },
  {
    id: 'a-team',
    name: '文档智能小队',
    type: 'TEAM',
    balance: 496,
    monthlyGrant: 500,
    usedThisMonth: 4,
    expireDesc: '所有活跃成员可使用',
  },
];

export const cloudResourcePacks: CloudResourcePack[] = [
  {
    id: 'r-1',
    name: '文档解析加量包',
    productName: '文档智能',
    total: 2000,
    used: 2000,
    unit: '页',
    status: 'EXPIRED',
    expiresAt: '2026-08-31',
  },
  {
    id: 'r-2',
    name: '会议转写时长包',
    productName: '会议助手',
    total: 600,
    used: 128,
    unit: '分钟',
    status: 'ACTIVE',
    expiresAt: '2026-12-31',
  },
];

export const cloudPlans: CloudPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: '¥99',
    priceSuffix: '/ 月',
    description: '适合个人和小型协作团队',
    features: ['每月 500 通用积分', '标准文档解析', '最多 5 位团队成员'],
    current: true,
    recommended: false,
    customized: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '¥299',
    priceSuffix: '/ 月',
    description: '适合高频文档处理团队',
    features: ['每月 1,000 通用积分', '专业版文档能力', '不限团队成员'],
    current: false,
    recommended: true,
    customized: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '定制',
    priceSuffix: '',
    description: '适合大规模、合规要求更高的组织',
    features: ['灵活积分额度', '专属模型与存储', '服务保障与支持'],
    current: false,
    recommended: false,
    customized: true,
  },
];

export const cloudSubscription: CloudSubscription = {
  planName: 'Basic 月度版',
  accountName: '张明的个人空间',
  autoRenew: true,
  nextBillingDate: '2026 年 9 月 11 日',
};
