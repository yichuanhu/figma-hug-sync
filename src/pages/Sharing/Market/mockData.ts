import { Asset, AssetType, AssetVersion, ReuseRecord } from './types';

const mkVersions = (assetId: string, list: Array<{ v: string; log: string; date: string; author: string }>): AssetVersion[] =>
  list.map((item, idx) => ({
    id: `${assetId}-v${idx + 1}`,
    assetId,
    version: item.v,
    changeLog: item.log,
    content: `# ${item.v}\n${item.log}`,
    isLatest: idx === 0,
    createdBy: item.author,
    createdAt: item.date,
  }));

const mkReuses = (assetId: string, list: Array<{ user: string; v: string; date: string; type?: 'DIRECT' | 'ADAPTATION'; note?: string }>): ReuseRecord[] =>
  list.map((item, idx) => ({
    id: `${assetId}-r${idx + 1}`,
    assetId,
    versionId: `${assetId}-${item.v}`,
    versionNumber: item.v,
    reuserName: item.user,
    reuseType: item.type ?? 'DIRECT',
    adaptationNote: item.note,
    reusedAt: item.date,
  }));

// ============= 流程 (WORKFLOW, DEV_CENTER) =============
const workflows: Asset[] = [
  {
    id: 'wf-001', name: '发票开具自动化流程', type: 'WORKFLOW', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '自动化发票处理与开具流程，支持增值税发票的自动识别、验证和开具功能，覆盖 SAP / 金蝶 / 用友主流 ERP 系统。',
    creatorName: '张三', departmentName: '财务部', reuseCount: 128, tags: ['RPA', '财务', '发票', '自动化'],
    currentVersion: 'v2.3.1', currentVersionId: 'wf-001-v1', createdAt: '2026-01-15', updatedAt: '2026-03-20',
    workflow: { yaml: 'workflow:\n  name: invoice-issue\n  nodes:\n    - read-erp\n    - generate-invoice\n    - upload-pdf\n    - notify-finance', nodeCount: 12 },
    versions: mkVersions('wf-001', [
      { v: 'v2.3.1', log: '修复发票识别准确率问题', date: '2026-03-20', author: '张三' },
      { v: 'v2.3.0', log: '新增增值税发票支持', date: '2026-03-10', author: '张三' },
      { v: 'v2.2.0', log: '优化性能', date: '2026-02-15', author: '张三' },
      { v: 'v1.0.0', log: '首发版本', date: '2026-01-15', author: '张三' },
    ]),
    reuseRecords: mkReuses('wf-001', [
      { user: '李四', v: 'v2.3.0', date: '2026-04-10' },
      { user: '王五', v: 'v2.2.0', date: '2026-03-25' },
      { user: '赵六', v: 'v2.1.0', date: '2026-03-01', type: 'ADAPTATION', note: '修改了发票模板' },
    ]),
  },
  {
    id: 'wf-002', name: '合同审核流程', type: 'WORKFLOW', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '自动化合同合规审核，OCR 提取条款 + 规则引擎比对 + 法务系统流转。',
    creatorName: '李四', departmentName: '法务部', reuseCount: 89, tags: ['法务', '合同', 'OCR'],
    currentVersion: 'v1.4.0', currentVersionId: 'wf-002-v1', createdAt: '2025-12-08', updatedAt: '2026-03-15',
    workflow: { yaml: 'workflow:\n  name: contract-review', nodeCount: 9 },
    versions: mkVersions('wf-002', [
      { v: 'v1.4.0', log: '增加风险条款识别', date: '2026-03-15', author: '李四' },
      { v: 'v1.0.0', log: '首发版本', date: '2025-12-08', author: '李四' },
    ]),
    reuseRecords: mkReuses('wf-002', [{ user: '王五', v: 'v1.4.0', date: '2026-04-01' }]),
  },
  {
    id: 'wf-003', name: '员工入职流程', type: 'WORKFLOW', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '新员工入职自动化：账号开通、文档分发、培训安排、设备申领。',
    creatorName: '王五', departmentName: '人力资源', reuseCount: 76, tags: ['HR', '入职', '自动化'],
    currentVersion: 'v2.0.0', currentVersionId: 'wf-003-v1', createdAt: '2025-09-20', updatedAt: '2026-02-28',
    workflow: { yaml: 'workflow:\n  name: onboarding', nodeCount: 14 },
    versions: mkVersions('wf-003', [
      { v: 'v2.0.0', log: '增加自助门户', date: '2026-02-28', author: '王五' },
      { v: 'v1.0.0', log: '首发版本', date: '2025-09-20', author: '王五' },
    ]),
    reuseRecords: mkReuses('wf-003', [{ user: '张三', v: 'v2.0.0', date: '2026-03-12' }]),
  },
  {
    id: 'wf-004', name: '客服工单分派流程', type: 'WORKFLOW', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: 'AI 分类 + 优先级评分 + 自动派单到对应技能组的全流程。',
    creatorName: '赵六', departmentName: '客户成功', reuseCount: 64, tags: ['客服', 'AI', '工单'],
    currentVersion: 'v1.2.0', currentVersionId: 'wf-004-v1', createdAt: '2025-11-12', updatedAt: '2026-03-05',
    workflow: { yaml: 'workflow:\n  name: ticket-routing', nodeCount: 7 },
    versions: mkVersions('wf-004', [{ v: 'v1.2.0', log: '增加情感分析', date: '2026-03-05', author: '赵六' }]),
    reuseRecords: [],
  },
  {
    id: 'wf-005', name: '采购订单审批流程', type: 'WORKFLOW', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '采购订单多级审批 + 预算校验 + ERP 自动同步。',
    creatorName: '钱七', departmentName: '采购部', reuseCount: 52, tags: ['采购', '审批', 'ERP'],
    currentVersion: 'v1.0.0', currentVersionId: 'wf-005-v1', createdAt: '2026-02-01', updatedAt: '2026-02-01',
    workflow: { yaml: 'workflow:\n  name: po-approval', nodeCount: 6 },
    versions: mkVersions('wf-005', [{ v: 'v1.0.0', log: '首发版本', date: '2026-02-01', author: '钱七' }]),
    reuseRecords: [],
  },
  {
    id: 'wf-006', name: '月度对账流程', type: 'WORKFLOW', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '银行流水抓取 + 自动对账 + 差异报告生成。',
    creatorName: '孙八', departmentName: '财务部', reuseCount: 43, tags: ['财务', '对账', '自动化'],
    currentVersion: 'v1.1.0', currentVersionId: 'wf-006-v1', createdAt: '2025-10-22', updatedAt: '2026-01-30',
    workflow: { yaml: 'workflow:\n  name: monthly-reconcile', nodeCount: 10 },
    versions: mkVersions('wf-006', [{ v: 'v1.1.0', log: '支持多银行', date: '2026-01-30', author: '孙八' }]),
    reuseRecords: [],
  },
];

// ============= 知识 (KNOWLEDGE, NATIVE) =============
const knowledges: Asset[] = [
  {
    id: 'kn-001', name: 'RPA 最佳实践指南', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: 'RPA 开发规范、命名约定、错误处理最佳实践汇总，涵盖 200+ 真实场景。',
    creatorName: '王五', departmentName: '研发中心', reuseCount: 256, tags: ['RPA', '最佳实践', '规范'],
    currentVersion: 'v3.0.0', currentVersionId: 'kn-001-v1', createdAt: '2025-08-10', updatedAt: '2026-03-22',
    knowledge: {
      knowledgeType: 'bestPractice',
      contentHtml: '<h3>1. 命名规范</h3><p>所有自动化流程命名建议采用 <code>业务域-流程名-环境</code> 三段式结构…</p><h3>2. 错误处理</h3><p>建议使用集中式错误处理器，避免散落 try-catch…</p><h3>3. 性能优化</h3><p>批量操作优先使用 API，避免 UI 自动化带来的稳定性问题。</p>',
      attachments: [
        { name: 'RPA-best-practice-v3.pdf', size: '2.4 MB', url: '#' },
        { name: '命名规范模板.xlsx', size: '120 KB', url: '#' },
      ],
    },
    versions: mkVersions('kn-001', [
      { v: 'v3.0.0', log: '增加云原生 RPA 章节', date: '2026-03-22', author: '王五' },
      { v: 'v2.0.0', log: '重构错误处理章节', date: '2025-12-15', author: '王五' },
      { v: 'v1.0.0', log: '首发版本', date: '2025-08-10', author: '王五' },
    ]),
    reuseRecords: mkReuses('kn-001', [
      { user: '张三', v: 'v3.0.0', date: '2026-04-12' },
      { user: '李四', v: 'v3.0.0', date: '2026-04-08' },
      { user: '赵六', v: 'v2.0.0', date: '2026-02-20' },
    ]),
  },
  {
    id: 'kn-002', name: '常见错误码字典', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '系统及业务错误码全集，含原因、影响范围、推荐处置措施。',
    creatorName: '李四', departmentName: '研发中心', reuseCount: 198, tags: ['错误码', '排障'],
    currentVersion: 'v2.4.0', currentVersionId: 'kn-002-v1', createdAt: '2025-10-05', updatedAt: '2026-03-18',
    knowledge: {
      knowledgeType: 'errorCode',
      contentHtml: '<table><thead><tr><th>错误码</th><th>含义</th><th>处置措施</th></tr></thead><tbody><tr><td>E1001</td><td>凭据失效</td><td>重新登录或更新凭据</td></tr><tr><td>E1002</td><td>队列积压</td><td>检查 Worker 状态</td></tr></tbody></table>',
      attachments: [],
    },
    versions: mkVersions('kn-002', [{ v: 'v2.4.0', log: '新增 30 条错误码', date: '2026-03-18', author: '李四' }]),
    reuseRecords: mkReuses('kn-002', [{ user: '钱七', v: 'v2.4.0', date: '2026-04-05' }]),
  },
  {
    id: 'kn-003', name: 'SAP 集成操作手册', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '从凭据配置到事务执行的端到端 SAP 集成操作指南。',
    creatorName: '张三', departmentName: '集成中心', reuseCount: 142, tags: ['SAP', '集成', '操作手册'],
    currentVersion: 'v1.6.0', currentVersionId: 'kn-003-v1', createdAt: '2025-11-18', updatedAt: '2026-02-25',
    knowledge: {
      knowledgeType: 'manual',
      contentHtml: '<h3>SAP 集成步骤</h3><ol><li>配置 SAP 用户与凭据</li><li>建立 RFC 连接</li><li>调用 BAPI 完成事务</li></ol>',
      attachments: [{ name: 'SAP-RFC-config.pdf', size: '850 KB', url: '#' }],
    },
    versions: mkVersions('kn-003', [{ v: 'v1.6.0', log: '更新 S/4HANA 章节', date: '2026-02-25', author: '张三' }]),
    reuseRecords: [],
  },
  {
    id: 'kn-004', name: '前端开发 FAQ', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '前端开发常见问题、调试技巧与性能优化建议。',
    creatorName: '赵六', departmentName: '研发中心', reuseCount: 96, tags: ['前端', 'FAQ'],
    currentVersion: 'v1.2.0', currentVersionId: 'kn-004-v1', createdAt: '2025-12-22', updatedAt: '2026-03-08',
    knowledge: { knowledgeType: 'faq', contentHtml: '<h3>Q1: React 性能优化怎么做？</h3><p>使用 useMemo / useCallback 避免不必要重渲染…</p>', attachments: [] },
    versions: mkVersions('kn-004', [{ v: 'v1.2.0', log: '新增 10 个 Q&A', date: '2026-03-08', author: '赵六' }]),
    reuseRecords: [],
  },
  {
    id: 'kn-005', name: '凭据管理最佳实践', type: 'KNOWLEDGE', source: 'NATIVE', status: 'PUBLISHED',
    description: '账号、密钥、Token 安全存储与轮换策略。',
    creatorName: '孙八', departmentName: '安全中心', reuseCount: 78, tags: ['安全', '凭据', '最佳实践'],
    currentVersion: 'v1.0.0', currentVersionId: 'kn-005-v1', createdAt: '2026-01-08', updatedAt: '2026-01-08',
    knowledge: { knowledgeType: 'bestPractice', contentHtml: '<p>定期轮换密钥，避免硬编码…</p>', attachments: [] },
    versions: mkVersions('kn-005', [{ v: 'v1.0.0', log: '首发版本', date: '2026-01-08', author: '孙八' }]),
    reuseRecords: [],
  },
];

// ============= 技能 (SKILL, NATIVE) =============
const skills: Asset[] = [
  {
    id: 'sk-001', name: '文档解析技能', type: 'SKILL', source: 'NATIVE', status: 'PUBLISHED',
    description: '支持 PDF/Word/图片解析并提取结构化数据，多种输出格式可选。',
    creatorName: '张三', departmentName: '研发中心', reuseCount: 78, tags: ['文档处理', 'OCR', '数据提取'],
    currentVersion: 'v1.5.0', currentVersionId: 'sk-001-v1', createdAt: '2025-09-12', updatedAt: '2026-03-15',
    skill: {
      category: 'document', skillStatus: 'PUBLISHED',
      callCount: 512, successRate: 98.5, rating: 4.2,
      timeoutSec: 30, retryPolicy: 'exponential, 最多 3 次',
      inputParams: [
        { name: 'fileUrl', type: 'string', required: true, description: '待解析文件 URL' },
        { name: 'format', type: 'string', required: false, description: '输出格式 (json/xml)', defaultValue: 'json' },
        { name: 'ocrMode', type: 'string', required: false, description: 'OCR 模式 (标准/高精度)', defaultValue: 'standard' },
      ],
      outputParams: [
        { name: 'parsedData', type: 'object', required: true, description: '结构化解析结果' },
        { name: 'confidence', type: 'number', required: true, description: '识别置信度 (0-1)' },
        { name: 'pageCount', type: 'number', required: true, description: '文档页数' },
      ],
      callExample: 'POST /api/skills/document-parse/invoke\n{\n  "fileUrl": "https://example.com/file.pdf",\n  "format": "json",\n  "ocrMode": "standard"\n}',
    },
    versions: mkVersions('sk-001', [
      { v: 'v1.5.0', log: '提升 OCR 准确率', date: '2026-03-15', author: '张三' },
      { v: 'v1.0.0', log: '首发版本', date: '2025-09-12', author: '张三' },
    ]),
    reuseRecords: mkReuses('sk-001', [{ user: '李四', v: 'v1.5.0', date: '2026-04-02' }]),
  },
  {
    id: 'sk-002', name: '数据可视化技能', type: 'SKILL', source: 'NATIVE', status: 'PUBLISHED',
    description: '基于 ECharts 自动生成图表与数据分析报告。',
    creatorName: '李四', departmentName: '数据团队', reuseCount: 65, tags: ['数据分析', 'ECharts', '可视化'],
    currentVersion: 'v1.2.0', currentVersionId: 'sk-002-v1', createdAt: '2025-11-08', updatedAt: '2026-02-28',
    skill: {
      category: 'data', skillStatus: 'PUBLISHED',
      callCount: 328, successRate: 96.2, rating: 4.0,
      timeoutSec: 15, retryPolicy: 'fixed, 最多 2 次',
      inputParams: [
        { name: 'data', type: 'array', required: true, description: '数据集' },
        { name: 'chartType', type: 'string', required: true, description: '图表类型 (line/bar/pie)' },
      ],
      outputParams: [{ name: 'imageUrl', type: 'string', required: true, description: '生成的图表 URL' }],
      callExample: 'POST /api/skills/data-viz/invoke\n{ "data": [...], "chartType": "line" }',
    },
    versions: mkVersions('sk-002', [{ v: 'v1.2.0', log: '增加 sankey 图', date: '2026-02-28', author: '李四' }]),
    reuseRecords: [],
  },
  {
    id: 'sk-003', name: '业务报告生成技能', type: 'SKILL', source: 'NATIVE', status: 'PUBLISHED',
    description: '基于模板自动生成业务报告，支持 Word / PDF 输出。',
    creatorName: '王五', departmentName: '运营中心', reuseCount: 52, tags: ['内容生成', '报告', '模板'],
    currentVersion: 'v2.0.0', currentVersionId: 'sk-003-v1', createdAt: '2025-12-20', updatedAt: '2026-03-10',
    skill: {
      category: 'content', skillStatus: 'PUBLISHED',
      callCount: 156, successRate: 99.1, rating: 4.8,
      timeoutSec: 60, retryPolicy: 'exponential, 最多 3 次',
      inputParams: [
        { name: 'templateId', type: 'string', required: true, description: '模板 ID' },
        { name: 'data', type: 'object', required: true, description: '替换数据' },
        { name: 'format', type: 'string', required: false, description: '输出格式 (pdf/docx)', defaultValue: 'pdf' },
      ],
      outputParams: [{ name: 'fileUrl', type: 'string', required: true, description: '报告文件 URL' }],
      callExample: 'POST /api/skills/report-gen/invoke\n{ "templateId": "tpl-001", "data": {}, "format": "pdf" }',
    },
    versions: mkVersions('sk-003', [{ v: 'v2.0.0', log: '支持图表嵌入', date: '2026-03-10', author: '王五' }]),
    reuseRecords: mkReuses('sk-003', [{ user: '张三', v: 'v2.0.0', date: '2026-04-08' }]),
  },
  {
    id: 'sk-004', name: '知识检索技能', type: 'SKILL', source: 'NATIVE', status: 'PUBLISHED',
    description: '基于向量库的语义检索，支持多知识库联合查询。',
    creatorName: '赵六', departmentName: 'AI 中心', reuseCount: 45, tags: ['知识检索', '向量', 'RAG'],
    currentVersion: 'v1.3.0', currentVersionId: 'sk-004-v1', createdAt: '2025-10-30', updatedAt: '2026-02-18',
    skill: {
      category: 'retrieval', skillStatus: 'PUBLISHED',
      callCount: 412, successRate: 95.8, rating: 4.3,
      timeoutSec: 10, retryPolicy: 'fixed, 最多 2 次',
      inputParams: [
        { name: 'query', type: 'string', required: true, description: '检索语句' },
        { name: 'topK', type: 'number', required: false, description: '返回数量', defaultValue: '5' },
      ],
      outputParams: [{ name: 'results', type: 'array', required: true, description: '检索结果列表' }],
      callExample: 'POST /api/skills/knowledge-search/invoke\n{ "query": "如何配置凭据", "topK": 5 }',
    },
    versions: mkVersions('sk-004', [{ v: 'v1.3.0', log: '支持混合检索', date: '2026-02-18', author: '赵六' }]),
    reuseRecords: [],
  },
  {
    id: 'sk-005', name: '邮件发送技能', type: 'SKILL', source: 'NATIVE', status: 'PUBLISHED',
    description: '统一邮件发送服务，支持模板、附件、抄送。',
    creatorName: '钱七', departmentName: '研发中心', reuseCount: 38, tags: ['工具调用', '邮件', '通知'],
    currentVersion: 'v1.0.0', currentVersionId: 'sk-005-v1', createdAt: '2026-01-22', updatedAt: '2026-01-22',
    skill: {
      category: 'tool', skillStatus: 'PUBLISHED',
      callCount: 1024, successRate: 99.6, rating: 4.5,
      timeoutSec: 20, retryPolicy: 'exponential, 最多 5 次',
      inputParams: [
        { name: 'to', type: 'string[]', required: true, description: '收件人列表' },
        { name: 'subject', type: 'string', required: true, description: '邮件主题' },
        { name: 'body', type: 'string', required: true, description: '邮件正文' },
      ],
      outputParams: [{ name: 'messageId', type: 'string', required: true, description: '消息 ID' }],
      callExample: 'POST /api/skills/email/invoke\n{ "to": ["a@x.com"], "subject": "...", "body": "..." }',
    },
    versions: mkVersions('sk-005', [{ v: 'v1.0.0', log: '首发版本', date: '2026-01-22', author: '钱七' }]),
    reuseRecords: [],
  },
];

// ============= 流程块 (SNIPPET, DEV_CENTER) =============
const snippets: Asset[] = [
  {
    id: 'sn-001', name: '邮件附件下载流程块', type: 'SNIPPET', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '从 Outlook / 企业邮箱下载指定主题邮件附件并保存到指定目录。',
    creatorName: '张三', departmentName: '研发中心', reuseCount: 89, tags: ['邮件', '附件', '下载'],
    currentVersion: 'v1.3.0', currentVersionId: 'sn-001-v1', createdAt: '2025-10-05', updatedAt: '2026-03-12',
    snippet: { yaml: 'snippet:\n  name: outlook-attachment-download\n  steps:\n    - connect-outlook\n    - filter-by-subject\n    - save-attachment', nodeCount: 4 },
    versions: mkVersions('sn-001', [{ v: 'v1.3.0', log: '支持 OAuth2', date: '2026-03-12', author: '张三' }]),
    reuseRecords: mkReuses('sn-001', [{ user: '李四', v: 'v1.3.0', date: '2026-04-15' }]),
  },
  {
    id: 'sn-002', name: 'Excel 透视表生成', type: 'SNIPPET', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '快速生成 Excel 透视表与图表，支持自定义聚合维度。',
    creatorName: '李四', departmentName: '研发中心', reuseCount: 73, tags: ['Excel', '透视表'],
    currentVersion: 'v1.0.0', currentVersionId: 'sn-002-v1', createdAt: '2025-12-01', updatedAt: '2025-12-01',
    snippet: { yaml: 'snippet:\n  name: excel-pivot', nodeCount: 5 },
    versions: mkVersions('sn-002', [{ v: 'v1.0.0', log: '首发版本', date: '2025-12-01', author: '李四' }]),
    reuseRecords: [],
  },
  {
    id: 'sn-003', name: '网页表单批量填写', type: 'SNIPPET', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: '基于 CSV 数据批量填写网页表单，支持下拉、单选、文件上传。',
    creatorName: '王五', departmentName: '研发中心', reuseCount: 56, tags: ['Web', '表单', '批量'],
    currentVersion: 'v1.1.0', currentVersionId: 'sn-003-v1', createdAt: '2026-01-18', updatedAt: '2026-02-22',
    snippet: { yaml: 'snippet:\n  name: web-form-batch-fill', nodeCount: 6 },
    versions: mkVersions('sn-003', [{ v: 'v1.1.0', log: '支持文件上传', date: '2026-02-22', author: '王五' }]),
    reuseRecords: [],
  },
  {
    id: 'sn-004', name: 'PDF 拆分合并', type: 'SNIPPET', source: 'DEV_CENTER', status: 'PUBLISHED',
    description: 'PDF 按页拆分、按规则合并，并支持加水印。',
    creatorName: '赵六', departmentName: '研发中心', reuseCount: 41, tags: ['PDF', '文档处理'],
    currentVersion: 'v1.0.0', currentVersionId: 'sn-004-v1', createdAt: '2026-02-10', updatedAt: '2026-02-10',
    snippet: { yaml: 'snippet:\n  name: pdf-split-merge', nodeCount: 3 },
    versions: mkVersions('sn-004', [{ v: 'v1.0.0', log: '首发版本', date: '2026-02-10', author: '赵六' }]),
    reuseRecords: [],
  },
];

export const allAssets: Asset[] = [...workflows, ...knowledges, ...skills, ...snippets];

export const findAssetById = (id: string): Asset | undefined => allAssets.find((a) => a.id === id);
export const findAssetsByType = (type: AssetType | 'ALL'): Asset[] =>
  type === 'ALL' ? allAssets : allAssets.filter((a) => a.type === type);
