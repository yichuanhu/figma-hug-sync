// 命令库 Mock 数据（纯前端原型）
// 命令是独立实体：不关联需求、不接入发布单与停用审批

export type CommandStatus = 'UNPUBLISHED' | 'PUBLISHED';
export type CommandPlatform = 'Windows' | 'Linux' | 'macOS' | 'Web';

export interface CommandParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  default_value?: string | null;
  description?: string;
}

export interface CommandEntry {
  name: string;
  usage: string;
  inputs: CommandParam[];
  outputs: CommandParam[];
}

export interface CommandVersion {
  id: string;
  command_id: string;
  version: string;
  is_active: boolean;
  version_note: string;
  file_name: string;
  file_size: string;
  source_file_name: string;
  source_file_size: string;
  uploader_id: string;
  uploader_name: string;
  created_at: string;
  publish_time: string | null;
  /** 该版本包含的命令清单（参数归属命令这一级） */
  commands: CommandEntry[];
}

export interface CommandItem {
  id: string;
  name: string;
  description: string;
  status: CommandStatus;
  platforms: CommandPlatform[];
  compatible_systems: string[];
  install_count: number;
  current_version: string | null;
  owning_department_id: string;
  owning_department_name: string;
  owner_id: string;
  owner_name: string;
  publisher_id: string;
  publisher_name: string;
  created_at: string;
  updated_at: string;
  /** 命令库整体发布时间（取最新已发布版本的发布时间） */
  publish_time: string | null;
  commands: CommandEntry[];
  versions: CommandVersion[];
}

const NAMES = [
  '打开浏览器',
  '点击元素',
  '输入文本',
  '读取 Excel 单元格',
  '写入 Excel 区域',
  '发送企业邮件',
  '下载文件',
  '解析 PDF 文本',
  'OCR 图片识别',
  '调用 HTTP 接口',
  '执行 SQL 查询',
  '压缩文件夹',
  '截取屏幕图像',
  '等待元素出现',
  '关闭应用进程',
  '读取剪贴板',
  '发送飞书消息',
  '解析 JSON 数据',
  '批量重命名文件',
  '生成随机验证码',
  '登录 ERP 系统',
  '导出报表数据',
  '校验身份证号',
  '合并 Word 文档',
  '执行 Shell 脚本',
  '监听文件夹变更',
  '写入日志文件',
  '发送短信通知',
  '识别验证码图片',
  '关闭浏览器',
];

const DESCRIPTIONS = [
  '在指定 Worker 上启动浏览器实例，支持无头模式与自定义 UA。',
  '按选择器定位页面元素并执行点击动作，支持重试与超时配置。',
  '向目标输入框写入文本内容，可选择是否先清空原有内容。',
  '按坐标或名称读取 Excel 单元格内容，支持公式结果读取。',
  '将二维数组批量写入指定 Excel 区域，自动扩展行列。',
  '通过企业邮箱凭据发送邮件，支持抄送、密送与附件。',
  '从给定 URL 下载文件到本地目录，支持断点续传。',
  '解析 PDF 文档中的文本内容，支持按页范围提取。',
  '调用 OCR 服务识别图片中的文字，返回结构化结果。',
  '发起 HTTP 请求并返回响应体，支持自定义 Header 与超时。',
];

const DEPARTMENTS = [
  { id: 'dept-finance', name: '财务部' },
  { id: 'dept-hr', name: '人力资源部' },
  { id: 'dept-rd', name: '研发中心' },
  { id: 'dept-apa-product', name: 'APA 产品部' },
  { id: 'dept-enterprise', name: '企业业务中心' },
];

const OWNERS = [
  { id: 'user-001', name: '张伟' },
  { id: 'user-002', name: '李娜' },
  { id: 'user-003', name: '王强' },
  { id: 'user-004', name: '刘洋' },
  { id: 'user-005', name: '陈静' },
];

const PLATFORM_SETS: CommandPlatform[][] = [
  ['Windows'],
  ['Windows', 'Linux'],
  ['Windows', 'macOS'],
  ['Linux'],
  ['Windows', 'Linux', 'macOS'],
  ['Web'],
];

const STATUSES: CommandStatus[] = ['UNPUBLISHED', 'PUBLISHED', 'PUBLISHED', 'UNPUBLISHED'];

const INPUT_POOL: CommandParam[][] = [
  [
    { name: 'url', type: 'string', required: true, default_value: null, description: '目标地址' },
    { name: 'timeout', type: 'number', required: false, default_value: '30', description: '超时时间（秒）' },
    { name: 'headless', type: 'boolean', required: false, default_value: 'false', description: '是否无头模式' },
  ],
  [
    { name: 'selector', type: 'string', required: true, default_value: null, description: '元素选择器' },
    { name: 'retry', type: 'number', required: false, default_value: '3', description: '失败重试次数' },
  ],
  [
    { name: 'file_path', type: 'string', required: true, default_value: null, description: '文件绝对路径' },
    { name: 'sheet', type: 'string', required: false, default_value: 'Sheet1', description: '工作表名称' },
    { name: 'range', type: 'string', required: false, default_value: 'A1', description: '单元格区域' },
  ],
];

const OUTPUT_POOL: CommandParam[][] = [
  [{ name: 'success', type: 'boolean', required: true, default_value: null, description: '执行是否成功' }],
  [
    { name: 'result', type: 'object', required: true, default_value: null, description: '执行结果对象' },
    { name: 'message', type: 'string', required: false, default_value: null, description: '错误或提示信息' },
  ],
  [
    { name: 'rows', type: 'array', required: true, default_value: null, description: '读取到的数据行' },
    { name: 'count', type: 'number', required: true, default_value: null, description: '数据行数' },
  ],
];

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

const buildVersions = (commandId: string, index: number, owner: { id: string; name: string }): CommandVersion[] => {
  const specs = [
    { version: '1.0.0', note: '初始版本，实现基础能力', active: true },
    { version: '1.1.0', note: '优化执行性能，修复已知问题', active: true },
    { version: '1.2.0', note: '新增超时与重试参数', active: index % 2 === 0 },
  ];
  return specs.slice(0, 2 + (index % 2)).map((spec, i) => {
    const created = new Date(2025, 2, 1 + index, 9 + i, (index * 13) % 60, 0);
    return {
      id: `${commandId}-v${i + 1}`,
      command_id: commandId,
      version: spec.version,
      is_active: spec.active,
      version_note: spec.note,
      file_name: `command_${index + 1}_v${spec.version}.plg`,
      file_size: `${(120 + index * 7 + i * 33) % 900}KB`,
      source_file_name: `command_${index + 1}_v${spec.version}_source.zip`,
      source_file_size: `${(220 + index * 11 + i * 41) % 900}KB`,
      uploader_id: owner.id,
      uploader_name: owner.name,
      created_at: fmt(created),
      publish_time: spec.active ? fmt(new Date(created.getTime() + 3600 * 1000)) : null,
      commands: buildEntries(index + i),
    };
  });
};

const SYSTEM_SETS: string[][] = [
  ['Windows x64', 'Windows x86'],
  ['Windows x64'],
  ['Windows x64', 'Linux x64'],
  ['Windows x64', 'macOS arm64'],
  ['Linux x64'],
];

const COMMAND_ENTRY_POOL: { name: string; usage: string }[] = [
  { name: '返回输入的任意字符', usage: '请输入任意字符串' },
  { name: '两数求和', usage: '得出 2 个数相加的结果' },
  { name: '获取标准格式的当前时间', usage: '返回 yyyy-mm-dd hh:mm:ss 字符串格式的当前时间' },
  { name: '字符串截取', usage: '按起止下标截取子字符串并返回' },
  { name: '判断文件是否存在', usage: '传入绝对路径，返回布尔值' },
];

const buildEntries = (index: number): CommandEntry[] => {
  const count = 2 + (index % 3);
  return Array.from({ length: count }, (_, i) => {
    const base = COMMAND_ENTRY_POOL[(index + i) % COMMAND_ENTRY_POOL.length];
    return {
      ...base,
      inputs: INPUT_POOL[(index + i) % INPUT_POOL.length],
      outputs: OUTPUT_POOL[(index + i) % OUTPUT_POOL.length],
    };
  });
};

const buildCommand = (index: number): CommandItem => {
  const id = `command-${index + 1}`;
  const dept = DEPARTMENTS[index % DEPARTMENTS.length];
  const owner = OWNERS[index % OWNERS.length];
  const publisher = OWNERS[(index + 2) % OWNERS.length];
  const status = STATUSES[index % STATUSES.length];
  const versions = buildVersions(id, index, owner);
  const created = new Date(2025, 1, 1 + (index % 25), 10, (index * 11) % 60, 0);
  const updated = new Date(created.getTime() + ((index % 9) + 1) * 24 * 3600 * 1000);
  const activeVersions = versions.filter((v) => v.is_active);
  const latestActiveVersion = activeVersions[activeVersions.length - 1] || null;
  return {
    id,
    name: NAMES[index % NAMES.length],
    description: DESCRIPTIONS[index % DESCRIPTIONS.length],
    status,
    platforms: PLATFORM_SETS[index % PLATFORM_SETS.length],
    compatible_systems: SYSTEM_SETS[index % SYSTEM_SETS.length],
    install_count: (index * 37) % 480,
    current_version: status === 'UNPUBLISHED' ? null : latestActiveVersion?.version || null,
    owning_department_id: dept.id,
    owning_department_name: dept.name,
    owner_id: owner.id,
    owner_name: owner.name,
    publisher_id: publisher.id,
    publisher_name: publisher.name,
    created_at: fmt(created),
    updated_at: fmt(updated),
    publish_time: status === 'UNPUBLISHED' ? null : latestActiveVersion?.publish_time || null,
    commands: buildEntries(index),
    versions,
  };
};

export const mockCommandList: CommandItem[] = Array.from({ length: 30 }, (_, i) => buildCommand(i));

export const COMMAND_STATUS_CONFIG: Record<CommandStatus, { label: string; color: 'blue' | 'green' | 'grey' }> = {
  UNPUBLISHED: { label: '未发布', color: 'grey' },
  PUBLISHED: { label: '已发布', color: 'green' },
};

export const COMMAND_PLATFORM_OPTIONS: CommandPlatform[] = ['Windows', 'Linux', 'macOS', 'Web'];

export const COMMAND_OWNER_POOL = OWNERS;
