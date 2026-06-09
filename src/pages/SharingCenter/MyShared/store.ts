/**
 * 「我的共享」本地数据 Store（mock）
 *
 * - 在 Sharing/Market 数据基础上派生扩展字段（ownerId / creatorId / originUrl / shareStatus / archivedAt）
 * - 维护可变 mock 数据（创建/编辑/归档/恢复/删除/下架/发版），便于跨页面（编辑→列表）同步
 * - 通过 subscribe 通知订阅者刷新
 */
import { allAssets } from '@/pages/Sharing/Market/mockData';
import type { Asset, AssetVersion, AssetSource, AssetType, KnowledgeExtension } from '@/pages/Sharing/Market/types';
import { getHistoryKindByAssetType } from '@/pages/Sharing/Market/utils';
import type { ShareStatus } from '@/components/sharing/StatusTag';
import type { ApprovalEvent } from '@/components/sharing/ApprovalTimeline';
import { getApprovalLevel, type AssetTypeKey } from '@/pages/SharingCenter/shared/approvalConfig';

export const CURRENT_USER_ID = 'me';
export const CURRENT_USER_NAME = '当前用户';
export const CURRENT_USER_DEPT = '研发中心';

export type ShareAsset = Asset & {
  shareStatus: ShareStatus;
  isMine: boolean;
  ownerId: string;
  creatorId: string;
  originUrl?: string;
  submittedAt: string;
  rejectedReason?: string;
  approvalEvents: ApprovalEvent[];
  archivedAt?: string;
};

const ME = CURRENT_USER_NAME;
const DEV_CENTER_BASE = 'https://dev-center.example.com/processes';

// MVP：「我的共享」不再展示 待审批 / 已拒绝 状态，相应位置改为 PUBLISHED / DRAFT
const statusByIndex: ShareStatus[] = ['PUBLISHED', 'DRAFT', 'PUBLISHED', 'PUBLISHED', 'DRAFT', 'PUBLISHED'];

// 推送通知 24h 去重记录： key = `${assetId}@${versionId}`
const pushHistory = new Map<string, number>();
const PUSH_DEDUP_HOURS = 24;

let assets: ShareAsset[] = [];
let initialized = false;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

const buildEvents = (status: ShareStatus, actorName: string, at: string): ApprovalEvent[] => {
  const events: ApprovalEvent[] = [{ type: 'SUBMITTED', actorName, at, comment: '提交审批' }];
  if (status === 'PUBLISHED') events.push({ type: 'APPROVED', actorName: '王审批', at, comment: '内容完整，符合规范' });
  else if (status === 'REJECTED') events.push({ type: 'REJECTED', actorName: '王审批', at, comment: '描述信息不充分，请补充示例后重新提交' });
  return events;
};

// 指定 lineage 的全部版本归属当前用户，用于演示「同一流程多版本」
const MINE_LINEAGES = new Set(['wf-001', 'wf-007']);
// 同 lineage 不同版本的演示状态映射（按下标循环）
const LINEAGE_VERSION_STATUSES: ShareStatus[] = ['PUBLISHED', 'PUBLISHED', 'UNLISTED'];
const lineageVerCounter = new Map<string, number>();

const init = () => {
  if (initialized) return;
  initialized = true;
  // 1) 基于 Market 数据派生
  const derived: ShareAsset[] = allAssets.map((a, idx): ShareAsset => {
    const lineageId = (a as Asset).lineageId;
    const inMineLineage = !!lineageId && MINE_LINEAGES.has(lineageId);
    const isMine = inMineLineage || idx % 3 === 0;
    const isDevCenter = a.source === 'DEV_CENTER';
    let shareStatus: ShareStatus;
    if (inMineLineage) {
      const c = lineageVerCounter.get(lineageId!) ?? 0;
      shareStatus = LINEAGE_VERSION_STATUSES[c % LINEAGE_VERSION_STATUSES.length];
      lineageVerCounter.set(lineageId!, c + 1);
    } else {
      shareStatus = isMine ? statusByIndex[idx % statusByIndex.length] : 'PUBLISHED';
    }
    const submittedAt = a.updatedAt;
    const ownerId = isMine ? CURRENT_USER_ID : `user-${idx}`;
    return {
      ...a,
      isMine,
      shareStatus,
      ownerId,
      creatorId: isMine && !isDevCenter ? CURRENT_USER_ID : `user-${idx}`,
      publishedBy: a.publishedBy ?? ownerId,
      originUrl: a.originUrl ?? (isDevCenter ? `${DEV_CENTER_BASE}/${a.id}` : undefined),
      resourceDeps: a.resourceDeps ?? (isDevCenter ? ['队列-A', 'DB-凭据'] : undefined),
      submittedAt,
      rejectedReason: shareStatus === 'REJECTED' ? '描述信息不充分，请补充示例后重新提交' : undefined,
      approvalEvents: buildEvents(shareStatus, isMine ? ME : a.creatorName, submittedAt),
    };
  });

  // 2) 补齐演示资产：归档 / 已下架 / DEV_CENTER 待上架/待审批
  const today = '2026-05-08';
  const devBase = derived.find((a) => a.source === 'DEV_CENTER') ?? derived[0];
  const extras: ShareAsset[] = [
    makeNativeKnowledge('kn-draft-001', '错误码速查（草稿）', '正在整理的错误码速查表草稿', 'DRAFT', today),
    {
      ...derived[0],
      id: 'wf-unlisted-demo',
      name: '已下架演示流程',
      shareStatus: 'UNLISTED',
      isMine: true,
      ownerId: CURRENT_USER_ID,
      source: 'DEV_CENTER',
      originUrl: `${DEV_CENTER_BASE}/wf-unlisted-demo`,
      submittedAt: today,
      approvalEvents: buildEvents('PUBLISHED', ME, today),
    },
    // DEV_CENTER 待上架（PENDING_PUBLISH）
    {
      ...devBase,
      id: 'wf-pp-001',
      name: '订单审批自动化流程',
      description: '用于订单审批流程的自动化方案，覆盖单据校验、审批路由与归档',
      type: 'WORKFLOW',
      source: 'DEV_CENTER',
      shareStatus: 'PENDING_PUBLISH',
      isMine: true,
      ownerId: CURRENT_USER_ID,
      publishedBy: CURRENT_USER_ID,
      originUrl: `${DEV_CENTER_BASE}/wf-pp-001`,
      resourceDeps: ['队列: order-queue', '凭据: erp-credential'],
      currentVersion: 'v1.0.0',
      currentVersionId: 'wf-pp-001-v1.0.0',
      createdAt: today,
      updatedAt: today,
      reuseCount: 0,
      tags: [],
      categoryTags: undefined,
      coverImage: undefined,
      displayName: undefined,
      displayDesc: undefined,
      overview: undefined,
      videoUrl: undefined,
      versions: [],
      reuseRecords: [],
      submittedAt: today,
      approvalEvents: [],
    },
    {
      ...devBase,
      id: 'wf-pp-002',
      name: 'HR 入职流程',
      description: '新员工入职信息收集、账号开通、设备分配的端到端流程',
      type: 'WORKFLOW',
      source: 'DEV_CENTER',
      shareStatus: 'PENDING_PUBLISH',
      isMine: true,
      ownerId: CURRENT_USER_ID,
      publishedBy: CURRENT_USER_ID,
      originUrl: `${DEV_CENTER_BASE}/wf-pp-002`,
      resourceDeps: ['凭据: ad-admin'],
      currentVersion: 'v2.1.0',
      currentVersionId: 'wf-pp-002-v2.1.0',
      createdAt: today,
      updatedAt: today,
      reuseCount: 0,
      tags: [],
      categoryTags: undefined,
      coverImage: undefined,
      displayName: undefined,
      displayDesc: undefined,
      overview: undefined,
      videoUrl: undefined,
      versions: [],
      reuseRecords: [],
      submittedAt: today,
      approvalEvents: [],
    },
    // DEV_CENTER 已驳回（演示"回开发中心调整"分支）
    {
      ...devBase,
      id: 'wf-rej-001',
      name: '财务对账自动化（已驳回）',
      description: '由于资源依赖未声明，被驳回。请回开发中心补充凭据后重新聚合发布',
      type: 'WORKFLOW',
      source: 'DEV_CENTER',
      shareStatus: 'REJECTED',
      isMine: true,
      ownerId: CURRENT_USER_ID,
      publishedBy: CURRENT_USER_ID,
      originUrl: `${DEV_CENTER_BASE}/wf-rej-001`,
      resourceDeps: ['队列: finance-queue'],
      currentVersion: 'v1.2.0',
      currentVersionId: 'wf-rej-001-v1.2.0',
      createdAt: today,
      updatedAt: today,
      reuseCount: 0,
      tags: ['财务'],
      versions: [],
      reuseRecords: [],
      submittedAt: today,
      rejectedReason: '资源依赖未在开发中心声明，请补充【凭据: erp-finance】后重新聚合发布',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: ME, at: today, comment: '提交审批' },
        { type: 'REJECTED', actorName: '王审批', at: today, comment: '资源依赖未声明，请回开发中心补充后再提交' },
      ],
    },
    // NATIVE 审批中（演示富 approvalEvents 时间线）
    {
      ...derived[0],
      id: 'kn-pa-001',
      name: 'RPA 最佳实践手册（审批中）',
      description: '汇总团队 RPA 项目沉淀的最佳实践，供新团队参考',
      type: 'KNOWLEDGE',
      source: 'NATIVE',
      shareStatus: 'PENDING_APPROVAL',
      isMine: true,
      ownerId: CURRENT_USER_ID,
      creatorId: CURRENT_USER_ID,
      publishedBy: CURRENT_USER_ID,
      // 知识无版本
      currentVersion: '',
      currentVersionId: '',
      createdAt: today,
      updatedAt: today,
      reuseCount: 0,
      tags: ['NATIVE'],
      categoryTags: ['最佳实践', 'RPA'],
      displayName: 'RPA 最佳实践手册（审批中）',
      displayDesc: '汇总团队 RPA 项目沉淀的最佳实践，供新团队参考',
      knowledge: {
        contentHtml: '<h3>最佳实践</h3><p>命名、错误处理、性能优化…</p>',
        attachments: [{ name: 'RPA-best-practice.pdf', size: '2.4 MB', url: '#' }],
        knowledgeType: 'bestPractice',
      },
      versions: [],
      reuseRecords: [],
      submittedAt: today,
      approvalEvents: [
        { type: 'SUBMITTED', actorName: ME, at: today, comment: '首次提交，请审批' },
      ],
    },
    // ============ 审批管理 - 待审批（他人提交，当前用户作为审批人）============
    {
      ...derived[0],
      id: 'wf-apr-pa-001',
      name: '采购下单自动化流程',
      description: '采购员发起的下单流程，覆盖供应商比价、PO 生成与审批',
      type: 'WORKFLOW',
      source: 'NATIVE',
      shareStatus: 'PENDING_APPROVAL',
      isMine: false,
      ownerId: 'user-101',
      creatorId: 'user-101',
      creatorName: '李采购',
      departmentName: '供应链中心',
      publishedBy: 'user-101',
      currentVersion: 'v1.0.0',
      currentVersionId: 'wf-apr-pa-001-v1.0.0',
      createdAt: '2026-05-07',
      updatedAt: '2026-05-07',
      reuseCount: 0,
      tags: ['采购', '自动化'],
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-05-07 09:30',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '李采购', at: '2026-05-07 09:30', comment: '首次提交，请审批' },
      ],
    },
    {
      ...derived[0],
      id: 'wf-apr-pa-002',
      name: '合同归档自动化（DEV_CENTER）',
      description: '合同归档至 OSS、回写台账，开发中心聚合发布',
      type: 'WORKFLOW',
      source: 'DEV_CENTER',
      originUrl: `${DEV_CENTER_BASE}/wf-apr-pa-002`,
      shareStatus: 'PENDING_APPROVAL',
      isMine: false,
      ownerId: 'user-102',
      creatorId: 'user-102',
      creatorName: '张法务',
      departmentName: '法务中心',
      publishedBy: 'user-102',
      resourceDeps: ['队列: contract-queue', '凭据: oss-key'],
      currentVersion: 'v2.0.0',
      currentVersionId: 'wf-apr-pa-002-v2.0.0',
      createdAt: '2026-05-06',
      updatedAt: '2026-05-06',
      reuseCount: 0,
      tags: ['合同', '归档'],
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-05-06 14:00',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '张法务', at: '2026-05-06 14:00', comment: '请审批，已在开发中心补齐依赖' },
      ],
    },
    {
      ...derived[0],
      id: 'kn-apr-pa-001',
      name: '客户工单处理 SOP',
      description: '客服中心处理客户工单的标准操作流程',
      type: 'KNOWLEDGE',
      source: 'NATIVE',
      shareStatus: 'PENDING_APPROVAL',
      isMine: false,
      ownerId: 'user-103',
      creatorId: 'user-103',
      creatorName: '陈客服',
      departmentName: '客户服务中心',
      publishedBy: 'user-103',
      currentVersion: '',
      currentVersionId: '',
      createdAt: '2026-05-08',
      updatedAt: '2026-05-08',
      reuseCount: 0,
      tags: ['NATIVE'],
      categoryTags: ['SOP', '客服'],
      displayName: '客户工单处理 SOP',
      displayDesc: '客服中心处理客户工单的标准操作流程，含退款场景章节',
      knowledge: {
        contentHtml: '<h3>客户工单处理 SOP</h3><ol><li>接单</li><li>分类</li><li>处置</li><li>回访</li></ol>',
        attachments: [{ name: '客户工单 SOP.pdf', size: '980 KB', url: '#' }],
        knowledgeType: 'manual',
      },
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-05-08 08:00',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '陈客服', at: '2026-05-08 08:00', comment: 'v1.1 增补退款场景章节' },
      ],
    },
    // ============ 审批管理 - 历史（当前用户作为审批人决策）============
    {
      ...derived[0],
      id: 'wf-apr-hist-001',
      name: '财务报销自动化流程',
      description: '员工提交报销→自动校验→财务复核→打款',
      type: 'WORKFLOW',
      source: 'NATIVE',
      shareStatus: 'PUBLISHED',
      isMine: false,
      ownerId: 'user-201',
      creatorId: 'user-201',
      creatorName: '赵财务',
      departmentName: '财务中心',
      publishedBy: 'user-201',
      currentVersion: 'v1.2.0',
      currentVersionId: 'wf-apr-hist-001-v1.2.0',
      createdAt: '2026-05-05',
      updatedAt: '2026-05-05',
      reuseCount: 0,
      tags: ['财务', '报销'],
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-05-05 10:00',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '赵财务', at: '2026-05-05 10:00', comment: '请审批' },
        { type: 'APPROVED', actorName: ME, at: '2026-05-05 12:00', comment: '内容完整，符合规范' },
      ],
    },
    {
      ...derived[0],
      id: 'kn-apr-hist-001',
      name: 'IT 安全基线手册',
      description: 'IT 部门发布的内部信息安全操作基线',
      type: 'KNOWLEDGE',
      source: 'NATIVE',
      shareStatus: 'PUBLISHED',
      isMine: false,
      ownerId: 'user-202',
      creatorId: 'user-202',
      creatorName: '周安全',
      departmentName: 'IT 中心',
      publishedBy: 'user-202',
      currentVersion: '',
      currentVersionId: '',
      createdAt: '2026-05-03',
      updatedAt: '2026-05-03',
      reuseCount: 0,
      tags: ['NATIVE'],
      categoryTags: ['安全', 'IT'],
      displayName: 'IT 安全基线手册',
      displayDesc: 'IT 部门发布的内部信息安全操作基线，覆盖账号、终端、网络、数据四大领域',
      knowledge: {
        contentHtml: '<h3>安全基线</h3><p>账号、终端、网络、数据四大领域操作要求…</p>',
        attachments: [{ name: 'IT 安全基线手册.pdf', size: '3.1 MB', url: '#' }],
        knowledgeType: 'manual',
      },
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-05-03 09:00',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '周安全', at: '2026-05-03 09:00', comment: 'v3 大版本更新' },
        { type: 'APPROVED', actorName: ME, at: '2026-05-05 09:00', comment: '已审阅，章节结构清晰，通过' },
      ],
    },
    {
      ...derived[0],
      id: 'wf-apr-hist-002',
      name: '门店巡检数据采集（已驳回）',
      description: '门店巡检数据自动采集与汇总',
      type: 'WORKFLOW',
      source: 'DEV_CENTER',
      originUrl: `${DEV_CENTER_BASE}/wf-apr-hist-002`,
      shareStatus: 'REJECTED',
      isMine: false,
      ownerId: 'user-203',
      creatorId: 'user-203',
      creatorName: '钱运营',
      departmentName: '运营中心',
      publishedBy: 'user-203',
      resourceDeps: ['队列: store-queue'],
      currentVersion: 'v1.0.0',
      currentVersionId: 'wf-apr-hist-002-v1.0.0',
      createdAt: '2026-05-02',
      updatedAt: '2026-05-02',
      reuseCount: 0,
      tags: ['门店', '巡检'],
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-05-02 15:00',
      rejectedReason: '描述与示例不足，建议在开发中心补充输入参数说明后再聚合发布',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '钱运营', at: '2026-05-02 15:00', comment: '请审批' },
        { type: 'REJECTED', actorName: ME, at: '2026-05-02 18:00', comment: '描述与示例不足，建议在开发中心补充输入参数说明后再聚合发布' },
      ],
    },
    {
      ...derived[0],
      id: 'kn-apr-hist-002',
      name: '新员工入职 FAQ',
      description: '新员工入职常见问题汇总',
      type: 'KNOWLEDGE',
      source: 'NATIVE',
      shareStatus: 'PUBLISHED',
      isMine: false,
      ownerId: 'user-204',
      creatorId: 'user-204',
      creatorName: '吴 HR',
      departmentName: '人力资源中心',
      publishedBy: 'user-204',
      currentVersion: '',
      currentVersionId: '',
      createdAt: '2026-04-28',
      updatedAt: '2026-04-28',
      reuseCount: 0,
      tags: ['NATIVE'],
      categoryTags: ['HR', 'FAQ'],
      displayName: '新员工入职 FAQ',
      displayDesc: '新员工入职常见问题汇总，覆盖账号、设备、培训、福利等高频问题',
      knowledge: {
        contentHtml: '<h3>FAQ</h3><p>账号开通、设备申领、入职培训…</p>',
        attachments: [{ name: '入职 FAQ.pdf', size: '720 KB', url: '#' }],
        knowledgeType: 'faq',
      },
      versions: [],
      reuseRecords: [],
      submittedAt: '2026-04-28 10:00',
      approvalEvents: [
        { type: 'SUBMITTED', actorName: '吴 HR', at: '2026-04-28 10:00', comment: '请审批' },
        { type: 'APPROVED', actorName: ME, at: '2026-05-01 10:00', comment: '通过，可发布到共享市场' },
      ],
    },
    // ============ 补充演示数据：我的共享（分页演示，覆盖各状态）============
    // -- DRAFT 草稿 --
    makeNativeWorkflow('wf-mine-d01', '财务对账自动化（草稿）', '银企对账单抓取与差异比对，正在补充异常处理分支', 'DRAFT', '2026-04-20'),
    makeNativeKnowledge('kn-mine-d01', '客户工单 SOP（草稿）', '客户服务工单升级与转派 SOP，待补充示例截图', 'DRAFT', '2026-04-22'),
    makeNativeKnowledge('kn-mine-d02', '数据合规审计要点（草稿）', '内部合规审计常见检查项与证据要求', 'DRAFT', '2026-04-25'),
    // -- PENDING_APPROVAL 审核中 --
    makeNativeWorkflow('wf-mine-pa01', '采购单同步至 ERP 流程', '将 OA 审批通过的采购单同步至 ERP，含异常重试', 'PENDING_APPROVAL', '2026-04-26'),
    makeNativeKnowledge('kn-mine-pa01', 'HR 入职清单手册', '新员工入职准备物料、账号开通流程汇总', 'PENDING_APPROVAL', '2026-04-27'),
    makeNativeWorkflow('wf-mine-pa02', '月度结账自动化', '财务月结脚本：科目余额校验、汇率折算、报表导出', 'PENDING_APPROVAL', '2026-04-28'),
    // -- PUBLISHED 已发布（部分含复用记录）--
    {
      ...makeNativeWorkflow('wf-mine-p01', '发票 OCR 识别录入', '扫描发票 OCR 后写入财务系统并自动认证', 'PUBLISHED', '2026-04-10'),
      reuseCount: 12,
      reuseRecords: [
        { id: 'wf-mine-p01-r1', assetId: 'wf-mine-p01', versionId: 'wf-mine-p01-v1.0.0', versionNumber: 'v1.0.0', reuserName: '李采购', reuseType: 'DIRECT' as const, reusedAt: '2026-04-15 10:20' },
        { id: 'wf-mine-p01-r2', assetId: 'wf-mine-p01', versionId: 'wf-mine-p01-v1.0.0', versionNumber: 'v1.0.0', reuserName: '王财务', reuseType: 'DIRECT' as const, reusedAt: '2026-04-18 14:05' },
        { id: 'wf-mine-p01-r3', assetId: 'wf-mine-p01', versionId: 'wf-mine-p01-v1.0.0', versionNumber: 'v1.0.0', reuserName: '赵运营', reuseType: 'DIRECT' as const, reusedAt: '2026-04-22 09:30' },
      ],
    },
    {
      ...makeNativeKnowledge('kn-mine-p01', 'RPA 项目交付规范', '项目交付各阶段产出物模板与验收标准', 'PUBLISHED', '2026-04-08'),
      reuseCount: 8,
      reuseRecords: [
        { id: 'kn-mine-p01-r1', assetId: 'kn-mine-p01', versionId: 'kn-mine-p01-v1.0.0', versionNumber: 'v1.0.0', reuserName: '陈项目', reuseType: 'DIRECT' as const, reusedAt: '2026-04-12 11:00' },
        { id: 'kn-mine-p01-r2', assetId: 'kn-mine-p01', versionId: 'kn-mine-p01-v1.0.0', versionNumber: 'v1.0.0', reuserName: '孙开发', reuseType: 'DIRECT' as const, reusedAt: '2026-04-20 16:40' },
      ],
    },
    {
      ...makeNativeWorkflow('wf-mine-p02', '电商订单分仓发货', '根据收货地与库存自动匹配最近仓发货', 'PUBLISHED', '2026-04-05'),
      reuseCount: 5,
      reuseRecords: [
        { id: 'wf-mine-p02-r1', assetId: 'wf-mine-p02', versionId: 'wf-mine-p02-v1.0.0', versionNumber: 'v1.0.0', reuserName: '周仓储', reuseType: 'DIRECT' as const, reusedAt: '2026-04-11 08:10' },
      ],
    },
    makeNativeKnowledge('kn-mine-p02', 'SAP 常见操作手册', 'SAP 财务模块常用事务码与操作要点速查', 'PUBLISHED', '2026-04-02'),
    makeNativeWorkflow('wf-mine-p03', '社保公积金申报', '每月社保公积金基数计算与申报数据生成', 'PUBLISHED', '2026-03-30'),
    makeNativeKnowledge('kn-mine-p03', '智能客服话术库', '常见客户咨询场景标准话术与异常处理建议', 'PUBLISHED', '2026-03-28'),
    // -- REJECTED 已驳回 --
    {
      ...makeNativeWorkflow('wf-mine-rj01', '邮件批量分类归档', '邮箱邮件按规则自动分类至文件夹', 'REJECTED', '2026-04-18'),
      rejectedReason: '资源依赖未声明，请补充【凭据: mail-imap】后重新提交',
    },
    {
      ...makeNativeKnowledge('kn-mine-rj01', '内控审计指引（旧稿）', '审计指引文档示例，描述信息不充分', 'REJECTED', '2026-04-16'),
      rejectedReason: '描述信息过于简略，请补充适用范围与示例后重新提交',
    },
    // -- UNLISTED 已下架 --
    makeNativeWorkflow('wf-mine-ul01', '旧版考勤汇总流程（已下架）', '已被新版打卡考勤替代，临时下架', 'UNLISTED', '2026-03-20'),
    makeNativeKnowledge('kn-mine-ul01', '老版用户手册（已下架）', '产品旧版本操作手册，新版本已发布', 'UNLISTED', '2026-03-15'),
    // -- ARCHIVED 已归档（仅流程支持归档；知识资产无归档状态） --
    makeNativeWorkflow('wf-mine-ar01', '2024 年报表汇总流程', '历史归档，仅供回溯使用', 'ARCHIVED', '2026-02-28'),
  ];

  assets = [...derived, ...extras];
};

// ============ 工厂方法 ============
function blankVersion(assetId: string, version: string, changeLog: string, content: string, when: string, assetType?: AssetType): AssetVersion {
  return {
    id: `${assetId}-${version}`,
    assetId,
    version,
    changeLog,
    content,
    isLatest: true,
    createdBy: CURRENT_USER_NAME,
    createdAt: when,
    historyKind: assetType ? getHistoryKindByAssetType(assetType) : undefined,
  };
}

export function makeNativeKnowledge(
  id: string,
  name: string,
  description: string,
  status: ShareStatus,
  when: string,
  ext?: Partial<KnowledgeExtension>,
): ShareAsset {
  // 知识附件必填且单文件：未传时给一个 mock 附件占位
  const attachments = ext?.attachments && ext.attachments.length > 0
    ? ext.attachments.slice(0, 1)
    : [{ name: `${name}.pdf`, size: '1.2 MB', url: '#' }];
  const knowledge: KnowledgeExtension = {
    contentHtml: ext?.contentHtml ?? `<h2>${name}</h2><p>${description}</p>`,
    attachments,
    knowledgeType: ext?.knowledgeType ?? 'manual',
  };
  return {
    id,
    name,
    type: 'KNOWLEDGE',
    source: 'NATIVE',
    status: 'PUBLISHED',
    description,
    creatorName: CURRENT_USER_NAME,
    departmentName: CURRENT_USER_DEPT,
    reuseCount: 0,
    tags: ['NATIVE'],
    // 展示信息（PUBLISHED 资产必填）：DRAFT/REJECTED 也带，无害
    displayName: name,
    displayDesc: description,
    categoryTags: ['知识沉淀'],
    // 知识资产无版本概念
    currentVersion: '',
    currentVersionId: '',
    createdAt: when,
    updatedAt: when,
    knowledge,
    versions: [],
    reuseRecords: [],
    isMine: true,
    shareStatus: status,
    ownerId: CURRENT_USER_ID,
    creatorId: CURRENT_USER_ID,
    submittedAt: when,
    archivedAt: status === 'ARCHIVED' ? when : undefined,
    approvalEvents: buildEvents(status === 'ARCHIVED' ? 'PUBLISHED' : status, ME, when),
  };
}

export function makeNativeWorkflow(
  id: string,
  name: string,
  description: string,
  status: ShareStatus,
  when: string,
  ext?: { processId?: string; processVersion?: string; resourceDeps?: string[]; departmentName?: string },
): ShareAsset {
  const version = ext?.processVersion ?? 'v1.0.0';
  return {
    id,
    name,
    type: 'WORKFLOW',
    source: 'NATIVE',
    status: 'PUBLISHED',
    description,
    creatorName: CURRENT_USER_NAME,
    departmentName: ext?.departmentName ?? CURRENT_USER_DEPT,
    reuseCount: 0,
    tags: ['NATIVE'],
    // 展示信息（PUBLISHED 资产必填）：DRAFT/REJECTED 也带，无害
    displayName: name,
    displayDesc: description,
    categoryTags: ['流程自动化'],
    currentVersion: version,
    currentVersionId: `${id}-${version}`,
    createdAt: when,
    updatedAt: when,
    resourceDeps: ext?.resourceDeps,
    originUrl: ext?.processId ? `${DEV_CENTER_BASE}/${ext.processId}` : undefined,
    versions: [blankVersion(id, version, '首发版本', description, when, 'WORKFLOW')],
    reuseRecords: [],
    isMine: true,
    shareStatus: status,
    ownerId: CURRENT_USER_ID,
    creatorId: CURRENT_USER_ID,
    publishedBy: CURRENT_USER_ID,
    submittedAt: when,
    archivedAt: status === 'ARCHIVED' ? when : undefined,
    approvalEvents: buildEvents(status === 'ARCHIVED' ? 'PUBLISHED' : status, ME, when),
  };
}


// ============ 查询 ============
export function getAll(): ShareAsset[] {
  init();
  return assets;
}

export function getMine(): ShareAsset[] {
  return getAll().filter((a) => a.isMine && a.shareStatus !== 'UNLISTED');
}

// ============ 列表查询封装 ============
export type MyPublishedTypeFilter = 'ALL' | 'WORKFLOW' | 'KNOWLEDGE';
export type MyPublishedSourceFilter = 'ALL' | 'NATIVE' | 'DEV_CENTER';
export type DisplayStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'UNLISTED';

/** 将底层 ShareStatus 归一化为列表 UI 维度的 5 个状态 */
export function toDisplayStatus(s: ShareStatus): DisplayStatus {
  if (s === 'PENDING_PUBLISH') return 'DRAFT';
  if (s === 'ARCHIVED') return 'UNLISTED';
  return s;
}

export interface MyPublishedQueryParams {
  statuses?: DisplayStatus[];
  type?: MyPublishedTypeFilter;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface MyPublishedQueryResult {
  list: ShareAsset[];
  total: number;
}

/**
 * 资产上架列表统一查询入口
 * - MVP 范围：仅返回 WORKFLOW / KNOWLEDGE
 * - statuses 为空表示全部
 * - 关键词命中：name / description / tags
 */
export function queryMyPublished(params: MyPublishedQueryParams): MyPublishedQueryResult {
  const { statuses = [], type = 'ALL', search = '', page = 1, pageSize = 12 } = params;
  // MVP：仅 WORKFLOW + KNOWLEDGE；包含 UNLISTED / ARCHIVED 以便在「已下架」筛选下可见
  // MVP：仅 WORKFLOW + KNOWLEDGE；并且不展示 待审批 / 已拒绝
  const mine = getAll().filter((a) =>
    a.isMine
    && (a.type === 'WORKFLOW' || a.type === 'KNOWLEDGE')
    && a.shareStatus !== 'PENDING_APPROVAL'
    && a.shareStatus !== 'REJECTED'
    // 知识资产无 ARCHIVED 状态
    && !(a.type === 'KNOWLEDGE' && a.shareStatus === 'ARCHIVED')
  );

  const k = search.trim().toLowerCase();
  const matchesFilters = (a: ShareAsset): boolean => {
    if (type !== 'ALL' && a.type !== type) return false;
    
    if (statuses.length > 0 && !statuses.includes(toDisplayStatus(a.shareStatus))) return false;
    if (k) {
      const hit = a.name.toLowerCase().includes(k)
        || a.description.toLowerCase().includes(k)
        || a.tags.some((tag) => tag.toLowerCase().includes(k));
      if (!hit) return false;
    }
    return true;
  };
  const listAll = mine.filter(matchesFilters);

  const total = listAll.length;
  const start = (page - 1) * pageSize;
  const list = listAll.slice(start, start + pageSize);

  return { list, total };
}

export function findAsset(id: string): ShareAsset | undefined {
  return getAll().find((a) => a.id === id);
}

export function getVersions(assetId: string): AssetVersion[] {
  const a = findAsset(assetId);
  return (a?.versions ?? []).slice().sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

// ============ 订阅 ============
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// ============ 变更 ============
const todayStr = () => new Date().toISOString().slice(0, 10);

function patchAsset(id: string, patch: Partial<ShareAsset>) {
  assets = assets.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: todayStr() } : a));
  notify();
}

export function archiveAsset(id: string) { patchAsset(id, { shareStatus: 'ARCHIVED', archivedAt: todayStr() }); }
export function recoverAsset(id: string) { patchAsset(id, { shareStatus: 'PUBLISHED', archivedAt: undefined }); }
export function unlistAsset(id: string) { patchAsset(id, { shareStatus: 'UNLISTED' }); }

/** 撤回审批：NATIVE→DRAFT；DEV_CENTER→PENDING_PUBLISH */
export function withdrawAsset(id: string) {
  const a = findAsset(id);
  if (!a || a.shareStatus !== 'PENDING_APPROVAL') return;
  const next: ShareStatus = a.source === 'DEV_CENTER' ? 'PENDING_PUBLISH' : 'DRAFT';
  patchAsset(id, { shareStatus: next });
}

/** DEV_CENTER 资产上架：写入展示信息 + status→PENDING_APPROVAL */
export function submitDevCenterPublish(id: string, displayPatch: { coverImage?: string; displayName?: string; displayDesc?: string; categoryTags?: string[]; overview?: string; videoUrl?: string }) {
  const a = findAsset(id);
  if (!a) return;
  const when = todayStr();
  patchAsset(id, {
    ...displayPatch,
    shareStatus: 'PENDING_APPROVAL',
    submittedAt: when,
    approvalEvents: [{ type: 'SUBMITTED', actorName: CURRENT_USER_NAME, at: when, comment: '提交上架审批' }],
  } as Partial<ShareAsset>);
}

// ============ 推送通知 ============
export function canPushNotification(assetId: string, versionId: string): { ok: true } | { ok: false; retryAfterHours: number } {
  const key = `${assetId}@${versionId}`;
  const last = pushHistory.get(key);
  if (!last) return { ok: true };
  const elapsedHours = (Date.now() - last) / (1000 * 60 * 60);
  if (elapsedHours >= PUSH_DEDUP_HOURS) return { ok: true };
  return { ok: false, retryAfterHours: Math.ceil(PUSH_DEDUP_HOURS - elapsedHours) };
}

export function recordPushNotification(assetId: string, versionId: string) {
  pushHistory.set(`${assetId}@${versionId}`, Date.now());
}
export function deleteAsset(id: string) {
  assets = assets.filter((a) => a.id !== id);
  notify();
}

export function updateMeta(id: string, meta: { name?: string; description?: string; tags?: string[] }) {
  patchAsset(id, meta);
}

export function updateNativeContent(id: string, payload: { knowledge?: Partial<KnowledgeExtension> }) {
  const a = findAsset(id);
  if (!a) return;
  patchAsset(id, {
    knowledge: payload.knowledge ? { ...(a.knowledge as KnowledgeExtension), ...payload.knowledge } : a.knowledge,
  });
}

export function addAsset(a: ShareAsset) {
  init();
  assets = [a, ...assets];
  notify();
}

// ============ 版本 ============
export type BumpType = 'patch' | 'minor' | 'major';

export function bumpVersion(current: string, bump: BumpType): string {
  const m = current.replace(/^v/, '').split('.').map(Number);
  const [maj, min, pat] = [m[0] || 0, m[1] || 0, m[2] || 0];
  if (bump === 'major') return `v${maj + 1}.0.0`;
  if (bump === 'minor') return `v${maj}.${min + 1}.0`;
  return `v${maj}.${min}.${pat + 1}`;
}

export function publishNewVersion(id: string, params: { bump?: BumpType; changeLog: string }) {
  const a = findAsset(id);
  if (!a) return;
  const isFirst = a.shareStatus === 'DRAFT';
  const newVersion = isFirst ? 'v1.0.0' : bumpVersion(a.currentVersion, params.bump ?? 'patch');
  const when = todayStr();
  const newVer: AssetVersion = {
    id: `${id}-${newVersion}`,
    assetId: id,
    version: newVersion,
    changeLog: params.changeLog,
    content: a.knowledge?.contentHtml ?? '',
    isLatest: true,
    createdBy: CURRENT_USER_NAME,
    createdAt: when,
    historyKind: getHistoryKindByAssetType(a.type),
  };
  const versions = a.versions.map((v) => ({ ...v, isLatest: false }));
  versions.unshift(newVer);
  const requireApproval = getApprovalLevel(a.type as AssetTypeKey) === 'SINGLE';
  const nextStatus: ShareStatus = isFirst
    ? (requireApproval ? 'PENDING_APPROVAL' : 'PUBLISHED')
    : 'PUBLISHED';
  const events: ApprovalEvent[] = [
    { type: 'SUBMITTED', actorName: ME, at: when, comment: '提交审批' },
  ];
  if (nextStatus === 'PUBLISHED' && isFirst) {
    events.push({ type: 'APPROVED', actorName: '系统', at: when, comment: '免审批，自动通过' });
  }
  patchAsset(id, {
    currentVersion: newVersion,
    currentVersionId: newVer.id,
    versions,
    shareStatus: nextStatus,
    submittedAt: when,
    approvalEvents: isFirst ? events : buildEvents(nextStatus, ME, when),
  });
}

// ============ 审批操作 ============
const NOW_USER = CURRENT_USER_NAME;

export function approveAsset(id: string, comment = '审核通过'): { ok: boolean; reason?: 'NOT_PENDING' | 'NOT_FOUND' } {
  const a = findAsset(id);
  if (!a) return { ok: false, reason: 'NOT_FOUND' };
  if (a.shareStatus !== 'PENDING_APPROVAL') return { ok: false, reason: 'NOT_PENDING' };
  const when = todayStr();
  patchAsset(id, {
    shareStatus: 'PUBLISHED',
    approvalEvents: [...a.approvalEvents, { type: 'APPROVED', actorName: NOW_USER, at: when, comment }],
  });
  return { ok: true };
}

export function rejectAsset(id: string, reason: string): { ok: boolean; reason?: 'NOT_PENDING' | 'NOT_FOUND' } {
  const a = findAsset(id);
  if (!a) return { ok: false, reason: 'NOT_FOUND' };
  if (a.shareStatus !== 'PENDING_APPROVAL') return { ok: false, reason: 'NOT_PENDING' };
  const when = todayStr();
  patchAsset(id, {
    shareStatus: 'REJECTED',
    rejectedReason: reason,
    approvalEvents: [...a.approvalEvents, { type: 'REJECTED', actorName: NOW_USER, at: when, comment: reason }],
  });
  return { ok: true };
}

export function batchApprove(ids: string[]): { approved: number; skipped: number } {
  let approved = 0;
  let skipped = 0;
  const when = todayStr();
  ids.forEach((id) => {
    const a = assets.find((x) => x.id === id);
    if (!a || a.shareStatus !== 'PENDING_APPROVAL') { skipped += 1; return; }
    assets = assets.map((x) => x.id === id ? {
      ...x,
      shareStatus: 'PUBLISHED' as ShareStatus,
      updatedAt: when,
      approvalEvents: [...x.approvalEvents, { type: 'APPROVED' as const, actorName: NOW_USER, at: when, comment: '批量通过' }],
    } : x);
    approved += 1;
  });
  if (approved > 0) notify();
  return { approved, skipped };
}

export function buildAssetId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

// ============ 流程发布到共享中心 ============
const DEV_CENTER_PROCESS_URL = 'https://dev-center.example.com/processes';

/**
 * 将开发中心已发布的流程发布到共享中心。
 * 同 processId 已存在 PENDING/PUBLISHED 时，作为新版本资产新增。
 */
export function publishWorkflowToShare(sourceAsset: Asset, note: string): string {
  init();
  const when = todayStr();
  const newId = buildAssetId('wf-shared');
  const versionId = `${newId}-${sourceAsset.currentVersion}`;
  const newVersion: AssetVersion = {
    id: versionId,
    assetId: newId,
    version: sourceAsset.currentVersion,
    changeLog: note || '发布到共享中心',
    content: sourceAsset.workflow?.yaml ?? '',
    isLatest: true,
    createdBy: CURRENT_USER_NAME,
    createdAt: when,
    isSnapshot: true,
    historyKind: 'RELEASE',
  };
  const asset: ShareAsset = {
    ...sourceAsset,
    id: newId,
    currentVersionId: versionId,
    creatorName: CURRENT_USER_NAME,
    departmentName: sourceAsset.departmentName,
    createdAt: when,
    updatedAt: when,
    reuseCount: 0,
    versions: [newVersion],
    reuseRecords: [],
    workflow: sourceAsset.workflow ? { ...sourceAsset.workflow } : undefined,
    isMine: true,
    shareStatus: 'PENDING_APPROVAL',
    ownerId: CURRENT_USER_ID,
    creatorId: CURRENT_USER_ID,
    originUrl: `${DEV_CENTER_PROCESS_URL}/${sourceAsset.id}`,
    submittedAt: when,
    rejectedReason: undefined,
    archivedAt: undefined,
    approvalEvents: [
      { type: 'SUBMITTED', actorName: CURRENT_USER_NAME, at: when, comment: note || '提交审批' },
    ],
  };
  addAsset(asset);
  return newId;
}

/** 资产市场可见数据：基础 mock + store 中已 PUBLISHED 的新增资产（按 id 去重）。缓存以满足 useSyncExternalStore 的稳定快照要求。 */
let marketAssetsCache: Asset[] | null = null;
let marketAssetsCacheVersion = -1;
let storeVersion = 0;
const bumpStoreVersion = () => { storeVersion += 1; marketAssetsCache = null; };
listeners.add(bumpStoreVersion);

export function getMarketAssets(): Asset[] {
  init();
  if (marketAssetsCache && marketAssetsCacheVersion === storeVersion) return marketAssetsCache;
  const baseIds = new Set(allAssets.map((a) => a.id));
  // 同 id 时以 store 的 PUBLISHED 资产覆盖（含 reuseRecords 等动态字段）
  const overrideMap = new Map<string, Asset>();
  for (const a of assets) {
    if (a.shareStatus === 'PUBLISHED' && baseIds.has(a.id)) overrideMap.set(a.id, a);
  }
  const merged = allAssets.map((a) => overrideMap.get(a.id) ?? a);
  const extras = assets.filter((a) => a.shareStatus === 'PUBLISHED' && !baseIds.has(a.id));
  marketAssetsCache = [...merged, ...extras];
  marketAssetsCacheVersion = storeVersion;
  return marketAssetsCache;
}

export function findMarketAsset(id: string): Asset | undefined {
  return getMarketAssets().find((a) => a.id === id);
}

// ============ v1.8 资产市场扩展：当前用户 / 复用 / 我已复用 / 编辑展示信息 ============

export const currentUser = { id: CURRENT_USER_ID, name: CURRENT_USER_NAME };

export function isOwner(assetId: string): boolean {
  // 资产市场以"展示作者"为准：仅当市场卡片显示的 creatorName 是当前用户时，视为本人发布
  const m = findMarketAsset(assetId);
  if (m) return m.creatorName === currentUser.name;
  const a = findAsset(assetId);
  if (!a) return false;
  return (a.publishedBy ?? a.ownerId) === currentUser.id;
}

export function hasReused(assetId: string): boolean {
  const a = findAsset(assetId);
  if (!a) return false;
  return a.reuseRecords.some((r) => r.reuserName === currentUser.name);
}

/** 获取当前用户对该资产的复用时间（最近一次） */
export function getReusedAt(assetId: string): string | undefined {
  const a = findAsset(assetId);
  return a?.reuseRecords.find((r) => r.reuserName === currentUser.name)?.reusedAt;
}

/**
 * 全局唯一性校验：流程名称是否已被占用
 * 范围：所有资产 name/displayName + 所有 WORKFLOW 复用记录 workflowName
 */
export function isWorkflowNameTaken(name: string, excludeAssetId?: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const all = getAll();
  for (const a of all) {
    if (a.id !== excludeAssetId) {
      if ((a.name ?? '').trim() === trimmed) return true;
      if ((a.displayName ?? '').trim() === trimmed) return true;
    }
    for (const r of a.reuseRecords) {
      if ((r.workflowName ?? '').trim() === trimmed) return true;
    }
  }
  return false;
}

/** 创建复用记录（支持多次复用；WORKFLOW 必须传入唯一 workflowName） */
export function addReuseRecord(
  assetId: string,
  opts?: { workflowName?: string },
): { ok: true; reusedAt: string } | { ok: false; reason: 'NOT_FOUND' | 'OWNER' | 'NAME_TAKEN' | 'NAME_REQUIRED' } {
  const a = findAsset(assetId);
  if (!a) return { ok: false, reason: 'NOT_FOUND' };
  if (isOwner(assetId)) return { ok: false, reason: 'OWNER' };
  const isWorkflow = a.type === 'WORKFLOW';
  const workflowName = opts?.workflowName?.trim();
  if (isWorkflow) {
    if (!workflowName) return { ok: false, reason: 'NAME_REQUIRED' };
    if (isWorkflowNameTaken(workflowName)) return { ok: false, reason: 'NAME_TAKEN' };
  }
  const when = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const record = {
    id: `${assetId}-r-${Date.now().toString(36)}`,
    assetId,
    versionId: a.currentVersionId,
    versionNumber: a.currentVersion,
    reuserName: currentUser.name,
    reuseType: 'DIRECT' as const,
    reusedAt: when,
    ...(workflowName ? { workflowName } : {}),
  };
  patchAsset(assetId, {
    reuseRecords: [record, ...a.reuseRecords],
    reuseCount: a.reuseCount + 1,
  } as Partial<ShareAsset>);
  return { ok: true, reusedAt: when };
}

/**
 * 获取当前用户的复用记录（按时间倒序，每条复用记录一项）。
 * 同一资产/同一版本被多次复用时，会展开为多条；点击任意一条联动到对应资产详情卡片。
 */
export function getMyReusedAssets(): Array<Asset & {
  myReusedAt: string;
  myReuseRecordId: string;
  myReusedVersion: string;
}> {
  const out: Array<Asset & { myReusedAt: string; myReuseRecordId: string; myReusedVersion: string }> = [];
  for (const a of getMarketAssets()) {
    if (a.status !== 'PUBLISHED') continue;
    if (a.type !== 'WORKFLOW' && a.type !== 'KNOWLEDGE') continue;
    for (const r of a.reuseRecords) {
      if (r.reuserName !== currentUser.name) continue;
      out.push({
        ...a,
        myReusedAt: r.reusedAt,
        myReuseRecordId: r.id,
        myReusedVersion: r.versionNumber || a.currentVersion,
      });
    }
  }
  return out.sort((x, y) => y.myReusedAt.localeCompare(x.myReusedAt));
}

export interface DisplayInfoPatch {
  displayName?: string;
  displayDesc?: string;
  coverImage?: string;
  categoryTags?: string[];
  overview?: string;
  videoUrl?: string;
}

export function updateDisplayInfo(assetId: string, patch: DisplayInfoPatch): boolean {
  const a = findAsset(assetId);
  if (!a) return false;
  patchAsset(assetId, patch as Partial<ShareAsset>);
  return true;
}

