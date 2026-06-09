/**
 * 共享市场 Mock 数据
 *
 * 基线约定（与编辑/创建页保持一致）：
 *  1. 知识资产无版本概念：versions=[]，currentVersion/currentVersionId 为空串，reuseRecords 中 versionNumber/versionId 为空串
 *  2. 知识元信息层无 description 字段（描述由展示层 displayDesc 承载）
 *  3. 知识附件必填且单文件：knowledge.attachments.length === 1
 *  4. knowledgeType 字段已无 UI（保留 schema 与 mock 默认值仅作兼容）
 *  5. PUBLISHED 资产必须有 displayName / displayDesc / categoryTags（coverImage / overview / videoUrl 选填）
 *  6. 业务分类用 categoryTags，tags 仅用于内部标记（如 'NATIVE'）
 */
import { Asset, AssetType, AssetVersion, ReuseRecord, ReuseType } from './types';

// 演示用：根据复用人姓名推断部门
const DEPT_BY_USER: Record<string, string> = {
  张三: '财务部', 李四: 'IT 运维', 王五: '人力资源', 赵六: '研发中心',
  钱七: '客户成功', 孙八: '市场部',
};

// 流程类版本上架人池（同一逻辑流程的不同版本可能由不同人上架）
const PUBLISHERS = [
  { name: '张三', dept: '财务部', id: 'pub-001' },
  { name: '李四', dept: '法务部', id: 'pub-002' },
  { name: '王五', dept: '人力资源', id: 'pub-003' },
  { name: '赵六', dept: '研发中心', id: 'pub-004' },
  { name: '钱七', dept: '采购部', id: 'pub-005' },
  { name: '孙八', dept: '集成中心', id: 'pub-006' },
  { name: '周九', dept: '运营中心', id: 'pub-007' },
  { name: '吴十', dept: 'AI 中心', id: 'pub-008' },
];

const pickPublisher = (lineageId: string, version: string) => {
  // 用 lineage + version 拼接的字符简单哈希，保证可复现
  const key = `${lineageId}@${version}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return PUBLISHERS[Math.abs(h) % PUBLISHERS.length];
};

// ==================== 工厂：流程类（按版本拆卡片） ====================

interface ProcessLineage {
  lineageId: string;
  type: 'WORKFLOW';
  baseName: string;
  description: string;
  tags: string[];
  /** 资产概览富文本 HTML（流程类共享同一份概览） */
  overview?: string;
  /** 演示视频 URL（流程类共享） */
  videoUrl?: string;
  // 按发布顺序倒序排列：第一个为最新
  versions: Array<{
    v: string;
    log: string;
    date: string;
    reuseCount: number;
    reusers?: Array<{ user: string; date: string; type?: ReuseType; dept?: string }>;
  }>;
  // 类型扩展数据
  workflow?: { yaml: string; nodeCount: number };
}

/** 构造统一的概览 HTML */
const buildOverview = (cfg: {
  scenario: string;
  capabilities: string[];
  systems: string;
  highlight: string;
}) => `
<div class="asset-overview">
  <h4>适用场景</h4>
  <p>${cfg.scenario}</p>
  <h4>核心能力</h4>
  <ul>${cfg.capabilities.map((c) => `<li>${c}</li>`).join('')}</ul>
  <h4>对接系统</h4>
  <p>${cfg.systems}</p>
  <h4>本版本亮点</h4>
  <p>${cfg.highlight}</p>
</div>`.trim();


const expandLineage = (l: ProcessLineage): Asset[] => {
  return l.versions.map((ver, idx) => {
    const publisher = pickPublisher(l.lineageId, ver.v);
    const cardId = `${l.lineageId}-${ver.v}`;
    const versionId = `${cardId}-v`;
    const versionRecord: AssetVersion = {
      id: versionId,
      assetId: cardId,
      version: ver.v,
      changeLog: ver.log,
      content: `# ${ver.v}\n${ver.log}`,
      isLatest: true,
      createdBy: publisher.name,
      createdAt: ver.date,
    };
    const reuseRecords: ReuseRecord[] = (ver.reusers ?? []).map((r, i) => ({
      id: `${cardId}-r${i + 1}`,
      assetId: cardId,
      versionId,
      versionNumber: ver.v,
      usageKind: 'REUSE',
      reuserName: r.user,
      reuserDept: r.dept ?? DEPT_BY_USER[r.user] ?? '—',
      reuseType: r.type ?? 'DIRECT',
      reusedAt: r.date,
    }));
    const asset: Asset = {
      id: cardId,
      lineageId: l.lineageId,
      name: l.baseName,
      type: l.type,
      source: 'DEV_CENTER',
      status: 'PUBLISHED',
      description: l.description,
      creatorName: publisher.name,
      departmentName: publisher.dept,
      reuseCount: ver.reuseCount,
      tags: l.tags,
      // 展示信息（PUBLISHED 必填）
      displayName: l.baseName,
      displayDesc: l.description.slice(0, 200),
      categoryTags: l.tags.slice(0, 3),
      currentVersion: ver.v,
      currentVersionId: versionId,
      createdAt: ver.date,
      updatedAt: ver.date,
      publishedBy: publisher.id,
      versions: [versionRecord],
      reuseRecords,
      ...(l.overview ? { overview: l.overview } : {}),
      ...(l.videoUrl ? { videoUrl: l.videoUrl } : {}),
      ...(l.workflow ? { workflow: l.workflow } : {}),
    };
    return asset;
  });
};

// ==================== 流程 (WORKFLOW) ====================
const workflowLineages: ProcessLineage[] = [
  {
    lineageId: 'wf-001', type: 'WORKFLOW',
    baseName: '发票开具自动化流程',
    description: '自动化发票处理与开具流程，支持增值税发票的自动识别、验证和开具功能，覆盖 SAP / 金蝶 / 用友主流 ERP 系统。',
    tags: ['RPA', '财务', '发票', '自动化'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    overview: buildOverview({
      scenario: '面向财务共享中心，自动完成销售订单到增值税发票的开具与归档，替代人工录入与多系统切换。',
      capabilities: [
        '从 ERP 抓取销售订单与客户信息，自动校验税号、地址、开票限额',
        '调用税控盘 / 电子发票平台批量开具，支持专票 / 普票 / 数电票',
        '自动回写发票号与 PDF 至 ERP 与 OA，并推送企微 / 邮件通知',
        '异常单据自动转人工，附带失败原因与上下文截图',
      ],
      systems: 'SAP S/4HANA、金蝶 K/3 Cloud、用友 NC、百望税控、企业微信',
      highlight: '本版本将发票识别准确率从 96.4% 提升至 99.2%，并新增电子发票（数电票）开具能力。',
    }),
    workflow: { yaml: 'workflow:\n  name: invoice-issue\n  nodes:\n    - read-erp\n    - generate-invoice\n    - upload-pdf\n    - notify-finance', nodeCount: 12 },
    versions: [
      { v: 'v2.3.1', log: '修复发票识别准确率问题', date: '2026-03-20', reuseCount: 45, reusers: [
        { user: '李四', date: '2026-04-10' },
        { user: '王五', date: '2026-04-02' },
        // 同一版本被「当前用户」复用 3 次（演示多次复用）
        { user: '当前用户', date: '2026-04-18 10:24', dept: '研发中心' },
        { user: '当前用户', date: '2026-04-22 14:08', dept: '研发中心', type: 'ADAPTATION' },
        { user: '当前用户', date: '2026-04-28 09:42', dept: '研发中心' },
      ]},
      { v: 'v2.3.0', log: '新增增值税发票支持', date: '2026-03-10', reuseCount: 56, reusers: [
        { user: '赵六', date: '2026-03-25', type: 'ADAPTATION' },
        { user: '钱七', date: '2026-03-15' },
        { user: '当前用户', date: '2026-03-22 09:10', dept: '研发中心', type: 'ADAPTATION' },
      ]},
      { v: 'v1.0.0', log: '首发版本', date: '2026-01-15', reuseCount: 30, reusers: [
        { user: '当前用户', date: '2026-02-08 11:00', dept: '研发中心' },
      ]},
    ],
  },
  {
    lineageId: 'wf-002', type: 'WORKFLOW',
    baseName: '合同审核流程',
    description: '自动化合同合规审核，OCR 提取条款 + 规则引擎比对 + 法务系统流转。',
    tags: ['法务', '合同', 'OCR'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    overview: buildOverview({
      scenario: '面向法务与商务团队，自动审核标准与非标合同的合规性，缩短审批周期 60% 以上。',
      capabilities: [
        'OCR 解析 PDF / Word / 扫描件，提取关键条款与签署主体',
        '基于规则引擎比对企业合同模板库，标记差异条款与风险等级',
        '高风险条款自动转法务复核，低风险条款一键放行',
        '审核结果回写法务系统并生成可追溯的审计日志',
      ],
      systems: '法大大、e签宝、企业微信审批、自建合同模板库',
      highlight: '本版本新增 27 类风险条款识别模型，覆盖数据合规、知识产权、劳动用工等场景。',
    }),
    workflow: { yaml: 'workflow:\n  name: contract-review', nodeCount: 9 },
    versions: [
      { v: 'v1.4.0', log: '增加风险条款识别', date: '2026-03-15', reuseCount: 65, reusers: [
        { user: '王五', date: '2026-04-01' },
        { user: '当前用户', date: '2026-04-05 16:42', dept: '研发中心' },
      ]},
      { v: 'v1.0.0', log: '首发版本', date: '2025-12-08', reuseCount: 24, reusers: [
        { user: '当前用户', date: '2026-01-12 13:20', dept: '研发中心', type: 'ADAPTATION' },
      ]},
    ],
  },
  {
    lineageId: 'wf-003', type: 'WORKFLOW',
    baseName: '员工入职流程',
    description: '新员工入职自动化：账号开通、文档分发、培训安排、设备申领。',
    tags: ['HR', '入职', '自动化'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    overview: buildOverview({
      scenario: '面向 HRBP 与 IT 服务台，串联新员工入职全流程，从 Offer 接受到首日报到的零接触自动化。',
      capabilities: [
        '账号开通：AD、邮箱、企微、ERP、研发工具链批量创建并下发凭据',
        '设备申领：根据岗位画像匹配电脑配置并触发资产管理工单',
        '培训安排：自动报名通用与岗位课程，发送日历邀请',
        '文档分发：员工手册、保密协议、薪酬确认书电子签署',
      ],
      systems: 'Active Directory、企业微信、北森 HCM、易快报、Coding DevOps',
      highlight: '本版本上线员工自助门户，新员工可在入职前完成 80% 资料收集与系统选项确认。',
    }),
    workflow: { yaml: 'workflow:\n  name: onboarding', nodeCount: 14 },
    versions: [
      { v: 'v2.0.0', log: '增加自助门户', date: '2026-02-28', reuseCount: 50, reusers: [
        { user: '张三', date: '2026-03-12' },
        { user: '当前用户', date: '2026-03-30 10:15', dept: '研发中心' },
      ]},
      { v: 'v1.0.0', log: '首发版本', date: '2025-09-20', reuseCount: 26, reusers: [
        { user: '当前用户', date: '2025-11-05 16:00', dept: '研发中心' },
      ]},
    ],
  },
  {
    lineageId: 'wf-004', type: 'WORKFLOW',
    baseName: '客服工单分派流程',
    description: 'AI 分类 + 优先级评分 + 自动派单到对应技能组的全流程。',
    tags: ['客服', 'AI', '工单'],
    overview: buildOverview({
      scenario: '面向客服中心，将多渠道工单（邮件、Web、微信、电话转写）统一分类并派发到对应技能组。',
      capabilities: [
        'NLP 多轮意图识别，支持 50+ 业务标签与意图槽位填充',
        '基于 SLA 与历史满意度评分动态调整工单优先级',
        '与坐席状态系统打通，按技能、负载、班次自动派单',
        '高情绪风险工单自动升级到金牌客服与主管二线',
      ],
      systems: 'Salesforce Service Cloud、网易七鱼、企业微信客服、自建知识库',
      highlight: '本版本引入情感分析模型，对高情绪工单识别准确率达 92%，平均响应时长下降 35%。',
    }),
    workflow: { yaml: 'workflow:\n  name: ticket-routing', nodeCount: 7 },
    versions: [
      { v: 'v1.2.0', log: '增加情感分析', date: '2026-03-05', reuseCount: 64, reusers: [
        { user: '当前用户', date: '2026-03-28 09:40', dept: '研发中心' },
      ]},
    ],
  },
  {
    lineageId: 'wf-005', type: 'WORKFLOW',
    baseName: '采购订单审批流程',
    description: '采购订单多级审批 + 预算校验 + ERP 自动同步。',
    tags: ['采购', '审批', 'ERP'],
    overview: buildOverview({
      scenario: '面向采购与财务部门，覆盖采购订单从发起、预算校验、多级审批到 ERP 同步的完整链路。',
      capabilities: [
        '基于金额、品类、供应商资质动态生成审批路由',
        '实时调用预算系统校验科目余额，超预算单据自动拦截',
        '审批通过后自动落 ERP 并通知供应商交付',
        '提供采购数据看板，支持周期与品类粒度的下钻分析',
      ],
      systems: 'SAP MM、用友 NC、钉钉审批、震坤行供应商门户',
      highlight: '首发版本即支持金额阈值、品类、供应商三维度的并行审批策略。',
    }),
    workflow: { yaml: 'workflow:\n  name: po-approval', nodeCount: 6 },
    versions: [
      { v: 'v1.0.0', log: '首发版本', date: '2026-02-01', reuseCount: 52, reusers: [
        { user: '当前用户', date: '2026-02-22 15:30', dept: '研发中心' },
      ]},
    ],
  },
  {
    lineageId: 'wf-006', type: 'WORKFLOW',
    baseName: '月度对账流程',
    description: '银行流水抓取 + 自动对账 + 差异报告生成。',
    tags: ['财务', '对账', '自动化'],
    overview: buildOverview({
      scenario: '面向集团财务，每月自动完成多银行流水与 ERP 应收应付的精细化对账，输出差异报告。',
      capabilities: [
        '多银行网银 / 企业网关流水自动抓取，含付款附言解析',
        '基于金额、日期、对手方多策略匹配 ERP 凭证',
        '差异自动归类为「在途、未达、错记、缺单」并指派处理人',
        '生成月度对账简报与往来单位健康度评分',
      ],
      systems: '招商银行 CBS、工行企业网银、SAP FI、金蝶云星空',
      highlight: '本版本支持 12 家主流银行的流水自动抓取，对账自动化率从 60% 提升至 88%。',
    }),
    workflow: { yaml: 'workflow:\n  name: monthly-reconcile', nodeCount: 10 },
    versions: [
      { v: 'v1.1.0', log: '支持多银行', date: '2026-01-30', reuseCount: 28, reusers: [
        { user: '当前用户', date: '2026-02-18 10:00', dept: '研发中心' },
      ]},
      { v: 'v1.0.0', log: '首发版本', date: '2025-10-22', reuseCount: 15, reusers: [
        { user: '当前用户', date: '2025-12-10 14:25', dept: '研发中心' },
      ]},
    ],
  },
  {
    lineageId: 'wf-007', type: 'WORKFLOW',
    baseName: '费用报销自动化流程',
    description: '员工报销单据 OCR 识别 + 规则校验 + 财务系统多级审批与回写。',
    tags: ['财务', '报销', 'OCR'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    overview: buildOverview({
      scenario: '面向员工与财务共享中心，把发票拍照、单据填写、规则校验与多级审批合并为单一移动端流程。',
      capabilities: [
        'OCR 自动识别增值税发票、火车票、出租车票，重复票自动拦截',
        '内置 30+ 公司差旅与招待规则，违规单据当场提示',
        '审批路由按金额、部门、出差地点动态生成',
        '审批通过自动落账并触发付款指令至网银',
      ],
      systems: '汇联易、易快报、企业微信审批、SAP FI、招商银行 CBS',
      highlight: '本版本新增多币种与跨境税率支持，海外差旅报销时长由 5 天压缩至 1 天。',
    }),
    workflow: { yaml: 'workflow:\n  name: expense-reimburse', nodeCount: 11 },
    versions: [
      { v: 'v3.0.0', log: '新增多币种与税率支持', date: '2026-04-12', reuseCount: 18, reusers: [
        { user: '李四', date: '2026-04-25' },
        { user: '当前用户', date: '2026-04-30 16:18', dept: '研发中心' },
      ]},
      { v: 'v2.1.0', log: '优化校验规则与审批路由', date: '2026-02-22', reuseCount: 36, reusers: [
        { user: '赵六', date: '2026-03-08' },
        // 同一版本被「当前用户」复用 2 次
        { user: '当前用户', date: '2026-03-12 11:05', dept: '研发中心' },
        { user: '当前用户', date: '2026-03-26 09:38', dept: '研发中心', type: 'ADAPTATION' },
      ]},
      { v: 'v2.0.0', log: '重构核心校验引擎', date: '2025-12-18', reuseCount: 22 },
      { v: 'v1.0.0', log: '首发版本', date: '2025-08-30', reuseCount: 9 },
    ],
  },
];

// ==================== 知识 (KNOWLEDGE) — 单卡片，无版本 ====================
// 约定：知识资产 versions=[]，currentVersion/currentVersionId 为空串；附件必填且单文件；
//      展示信息（displayName/displayDesc/categoryTags）为 PUBLISHED 必填。
const knowledgeAssets: Asset[] = [
  {
    id: 'kn-001', name: 'RPA 最佳实践指南', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: 'RPA 开发规范、命名约定、错误处理最佳实践汇总，涵盖 200+ 真实场景。',
    creatorName: '王五', departmentName: '研发中心', reuseCount: 256, tags: ['NATIVE'],
    displayName: 'RPA 最佳实践指南',
    displayDesc: '汇总 200+ 真实场景的 RPA 开发规范、命名约定与错误处理实践，开发新流程前必读。',
    categoryTags: ['RPA', '最佳实践', '规范'],
    overview: '<h4>适用读者</h4><p>新接触 RPA 的开发者与项目交付团队。</p><h4>核心内容</h4><ul><li>命名规范三段式</li><li>集中式错误处理</li><li>批量操作性能优化</li></ul>',
    currentVersion: '', currentVersionId: '', createdAt: '2025-08-10', updatedAt: '2026-03-22',
    publishedBy: 'pub-003',
    knowledge: {
      knowledgeType: 'bestPractice',
      contentHtml: '<h3>1. 命名规范</h3><p>所有自动化流程命名建议采用 <code>业务域-流程名-环境</code> 三段式结构…</p><h3>2. 错误处理</h3><p>建议使用集中式错误处理器，避免散落 try-catch…</p><h3>3. 性能优化</h3><p>批量操作优先使用 API，避免 UI 自动化带来的稳定性问题。</p>',
      attachments: [{ name: 'RPA-best-practice.pdf', size: '2.4 MB', url: '#' }],
    },
    versions: [],
    reuseRecords: [
      { id: 'kn-001-r1', assetId: 'kn-001', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '张三', reuserDept: '财务部', reusedAt: '2026-04-12' },
      { id: 'kn-001-r2', assetId: 'kn-001', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '李四', reuserDept: 'IT 运维', reusedAt: '2026-04-08' },
      { id: 'kn-001-r3', assetId: 'kn-001', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '当前用户', reuserDept: '研发中心', reusedAt: '2026-04-25 15:18' },
    ],
  },
  {
    id: 'kn-002', name: '常见错误码字典', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '系统及业务错误码全集，含原因、影响范围、推荐处置措施。',
    creatorName: '李四', departmentName: '研发中心', reuseCount: 198, tags: ['NATIVE'],
    displayName: '常见错误码字典',
    displayDesc: '系统与业务错误码全集，含原因、影响范围与推荐处置措施，排障必备。',
    categoryTags: ['错误码', '排障'],
    overview: '<h4>覆盖范围</h4><p>核心业务错误码 E1xxx ~ E9xxx，含调用方、责任人、SLA 要求。</p>',
    currentVersion: '', currentVersionId: '', createdAt: '2025-10-05', updatedAt: '2026-03-18',
    publishedBy: 'pub-002',
    knowledge: {
      knowledgeType: 'errorCode',
      contentHtml: '<table><thead><tr><th>错误码</th><th>含义</th><th>处置措施</th></tr></thead><tbody><tr><td>E1001</td><td>凭据失效</td><td>重新登录或更新凭据</td></tr><tr><td>E1002</td><td>队列积压</td><td>检查 Worker 状态</td></tr></tbody></table>',
      attachments: [{ name: '错误码字典.xlsx', size: '320 KB', url: '#' }],
    },
    versions: [],
    reuseRecords: [
      { id: 'kn-002-r1', assetId: 'kn-002', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '钱七', reuserDept: '客户成功', reusedAt: '2026-04-05' },
      { id: 'kn-002-r2', assetId: 'kn-002', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '当前用户', reuserDept: '研发中心', reusedAt: '2026-04-22 10:50' },
    ],
  },
  {
    id: 'kn-003', name: 'SAP 集成操作手册', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '从凭据配置到事务执行的端到端 SAP 集成操作指南。',
    creatorName: '张三', departmentName: '集成中心', reuseCount: 142, tags: ['NATIVE'],
    displayName: 'SAP 集成操作手册',
    displayDesc: '从凭据配置到事务执行的端到端 SAP 集成指南，含 RFC/BAPI 完整示例。',
    categoryTags: ['SAP', '集成', '操作手册'],
    overview: '<h4>覆盖范围</h4><p>SAP S/4HANA、ECC 6.0 的 RFC/BAPI 集成完整流程。</p>',
    currentVersion: '', currentVersionId: '', createdAt: '2025-11-18', updatedAt: '2026-02-25',
    publishedBy: 'pub-001',
    knowledge: {
      knowledgeType: 'manual',
      contentHtml: '<h3>SAP 集成步骤</h3><ol><li>配置 SAP 用户与凭据</li><li>建立 RFC 连接</li><li>调用 BAPI 完成事务</li></ol>',
      attachments: [{ name: 'SAP-RFC-config.pdf', size: '850 KB', url: '#' }],
    },
    versions: [],
    reuseRecords: [
      { id: 'kn-003-r1', assetId: 'kn-003', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '当前用户', reuserDept: '研发中心', reusedAt: '2026-03-12 15:08' },
    ],
  },
  {
    id: 'kn-004', name: '前端开发 FAQ', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '前端开发常见问题、调试技巧与性能优化建议。',
    creatorName: '赵六', departmentName: '研发中心', reuseCount: 96, tags: ['NATIVE'],
    displayName: '前端开发 FAQ',
    displayDesc: '前端开发常见问题、调试技巧与性能优化建议，覆盖 React/Vite/TS 全链路。',
    categoryTags: ['前端', 'FAQ'],
    overview: '<h4>常见问题</h4><p>性能优化、状态管理、调试技巧、构建配置。</p>',
    currentVersion: '', currentVersionId: '', createdAt: '2025-12-22', updatedAt: '2026-03-08',
    publishedBy: 'pub-004',
    knowledge: {
      knowledgeType: 'faq',
      contentHtml: '<h3>Q1: React 性能优化怎么做？</h3><p>使用 useMemo / useCallback 避免不必要重渲染…</p>',
      attachments: [{ name: '前端 FAQ.pdf', size: '560 KB', url: '#' }],
    },
    versions: [],
    reuseRecords: [
      { id: 'kn-004-r1', assetId: 'kn-004', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '当前用户', reuserDept: '研发中心', reusedAt: '2026-03-20 09:35' },
    ],
  },
  {
    id: 'kn-005', name: '凭据管理最佳实践', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '账号、密钥、Token 安全存储与轮换策略。',
    creatorName: '孙八', departmentName: '安全中心', reuseCount: 78, tags: ['NATIVE'],
    displayName: '凭据管理最佳实践',
    displayDesc: '账号、密钥、Token 的安全存储与轮换策略，含审计与应急响应建议。',
    categoryTags: ['安全', '凭据', '最佳实践'],
    overview: '<h4>核心建议</h4><ul><li>定期轮换密钥</li><li>避免硬编码</li><li>最小权限原则</li></ul>',
    currentVersion: '', currentVersionId: '', createdAt: '2026-01-08', updatedAt: '2026-01-08',
    publishedBy: 'pub-006',
    knowledge: {
      knowledgeType: 'bestPractice',
      contentHtml: '<p>定期轮换密钥，避免硬编码…</p>',
      attachments: [{ name: '凭据管理最佳实践.pdf', size: '410 KB', url: '#' }],
    },
    versions: [],
    reuseRecords: [
      { id: 'kn-005-r1', assetId: 'kn-005', versionId: '', versionNumber: '', usageKind: 'DOWNLOAD',
        reuserName: '当前用户', reuserDept: '研发中心', reusedAt: '2026-02-14 13:00' },
    ],
  },
];

// ==================== 汇总 ====================
const workflows: Asset[] = workflowLineages.flatMap(expandLineage);

export const allAssets: Asset[] = [...workflows, ...knowledgeAssets];

export const findAssetById = (id: string): Asset | undefined => allAssets.find((a) => a.id === id);
export const findAssetsByType = (type: AssetType | 'ALL'): Asset[] =>
  type === 'ALL' ? allAssets : allAssets.filter((a) => a.type === type);
