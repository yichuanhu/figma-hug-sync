/** 公有云板块领域模型（与私有部署完全隔离） */

export interface CloudUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  workspaceName: string;
}

export interface CloudOverviewMetric {
  key: 'credits' | 'resources' | 'teams' | 'plan';
  label: string;
  value: string;
  desc: string;
  path: string;
}

export interface CloudProduct {
  id: string;
  code: string;
  name: string;
  description: string;
  lastUsed: string;
  accent: string;
}

/** 收支流水 */
export type CloudLedgerType = 'INCOME' | 'EXPENSE';

export interface CloudLedgerRecord {
  id: string;
  title: string;
  scene: string;
  type: CloudLedgerType;
  amount: number;
  time: string;
}

/** 团队 */
export type CloudTeamRole = 'OWNER' | 'MEMBER';
export type CloudMemberStatus = 'ACTIVE' | 'PENDING' | 'DISABLED';

export interface CloudTeamMember {
  id: string;
  name: string;
  email: string;
  role: CloudTeamRole;
  status: CloudMemberStatus;
  joinedAt: string;
}

export interface CloudTeam {
  id: string;
  name: string;
  initials: string;
  ownerName: string;
  planName: string;
  memberCount: number;
  sharedCredits: number;
  members: CloudTeamMember[];
  myRole: CloudTeamRole;
  joinedAt: string;
  active: boolean;
}

export interface CloudInvitation {
  id: string;
  email: string;
  expiresAt: string;
}

/** 积分 */
export interface CloudCreditAccount {
  id: string;
  name: string;
  type: 'PERSONAL' | 'TEAM';
  balance: number;
  monthlyGrant: number;
  usedThisMonth: number;
  expireDesc: string;
}

/** 资源包 */
export type CloudResourcePackStatus = 'ACTIVE' | 'EXPIRED' | 'NONE';

export interface CloudResourcePack {
  id: string;
  name: string;
  productName: string;
  total: number;
  used: number;
  unit: string;
  status: CloudResourcePackStatus;
  expiresAt: string;
}

/** 套餐 */
export interface CloudPlan {
  id: string;
  name: string;
  price: string;
  priceSuffix: string;
  description: string;
  features: string[];
  current: boolean;
  recommended: boolean;
  customized: boolean;
}

export interface CloudSubscription {
  planName: string;
  accountName: string;
  autoRenew: boolean;
  nextBillingDate: string;
}
