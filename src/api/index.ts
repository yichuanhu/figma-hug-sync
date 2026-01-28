/**
 * API 类型定义文件
 * 本文件只包含类型定义，不包含逻辑代码
 * 后续API调用逻辑在各模块中实现
 */

/** Body_upload_process_package_web_apa__tenant_name__processes__process_id__versions_upload_post */
export interface BodyUploadProcessPackageWebApaTenantNameProcessesProcessIdVersionsUploadPost {
  /**
   * Packagefile
   * @format binary
   */
  packageFile?: File;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/**
 * LYApprovalRequest
 * 审批请求
 */
export interface LYApprovalRequest {
  /**
   * Action
   * 审批操作 (APPROVE/REJECT)
   */
  action: string;
  /**
   * Comment
   * 审批意见
   */
  comment?: string | null;
}

/**
 * LYCreateProcessRequest
 * 创建流程请求
 */
export interface LYCreateProcessRequest {
  /**
   * Name
   * 流程名称
   * @minLength 1
   * @maxLength 100
   */
  name: string;
  /**
   * Description
   * 流程描述
   */
  description?: string | null;
  /**
   * Requirement Id
   * 关联需求ID
   */
  requirement_id?: string | null;
}

/**
 * LYCreateVersionRequest
 * 创建版本请求
 */
export interface LYCreateVersionRequest {
  /**
   * Version
   * 版本号
   */
  version: string;
  /**
   * Source Code
   * 源代码
   */
  source_code: string;
  /**
   * Package File Id
   * 包文件ID
   */
  package_file_id: string;
  /**
   * Package Size
   * 包大小（字节）
   */
  package_size: number;
  /**
   * Package Checksum
   * 包校验和
   */
  package_checksum: string;
  /**
   * Version Note
   * 版本说明
   */
  version_note?: string | null;
  /**
   * Usage Note
   * 使用说明
   */
  usage_note?: string | null;
  /**
   * Client Version
   * 客户端版本
   */
  client_version?: string | null;
  /**
   * Os
   * 操作系统
   */
  os?: string | null;
  /**
   * Architecture
   * 系统架构
   */
  architecture?: string | null;
  /**
   * Min Client Version
   * 最低客户端版本
   */
  min_client_version?: string | null;
  /**
   * Supported Os
   * 支持的操作系统列表
   */
  supported_os?: string[] | null;
  /**
   * Required Components
   * 必需的系统组件列表
   */
  required_components?: string[] | null;
  /**
   * Parameters
   * 参数定义列表
   */
  parameters?: Record<string, unknown>[] | null;
  /**
   * Dependencies
   * 依赖资源列表
   */
  dependencies?: Record<string, unknown>[] | null;
}

/**
 * LYDeleteProcessRequest
 * 删除流程请求
 */
export interface LYDeleteProcessRequest {
  /**
   * Confirm
   * 确认标志
   * @default false
   */
  confirm?: boolean;
  /**
   * Force
   * 强制删除标志
   * @default false
   */
  force?: boolean;
}

/** LYListResponse[LYPendingApprovalResponse] */
export interface LYListResponseLYPendingApprovalResponse {
  /** 范围 */
  range?: LYRangeResponse | null;
  /**
   * List
   * 列表
   */
  list: LYPendingApprovalResponse[];
}

/** LYListResponse[LYWorkerResponse] */
export interface LYListResponseLYWorkerResponse {
  /** 范围 */
  range?: LYRangeResponse | null;
  /**
   * List
   * 列表
   */
  list: LYWorkerResponse[];
}

/** LYListResponse[LYProcessResponse] */
export interface LYListResponseLYProcessResponse {
  /** 范围 */
  range?: LYRangeResponse | null;
  /**
   * List
   * 列表
   */
  list: LYProcessResponse[];
}

/** LYListResponse[LYProcessVersionResponse] */
export interface LYListResponseLYProcessVersionResponse {
  /** 范围 */
  range?: LYRangeResponse | null;
  /**
   * List
   * 列表
   */
  list: LYProcessVersionResponse[];
}

/**
 * LYPendingApprovalListResultResponse
 * 待审批列表结果响应
 */
export interface LYPendingApprovalListResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYListResponseLYPendingApprovalResponse | null;
}

/**
 * LYPendingApprovalResponse
 * 待审批版本响应模型
 */
export interface LYPendingApprovalResponse {
  /**
   * Id
   * 版本ID
   */
  id: string;
  /**
   * Version
   * 版本号
   */
  version: string;
  /**
   * Process Id
   * 流程ID
   */
  process_id: string;
  /**
   * Process Name
   * 流程名称
   */
  process_name: string;
  /**
   * Status
   * 版本状态
   */
  status: string;
  /**
   * Creator Id
   * 创建者ID
   */
  creator_id: string;
  /**
   * Created At
   * 创建时间
   * @format date-time
   */
  created_at: string;
}

/**
 * LYProcessListResultResponse
 * 流程列表结果响应
 */
export interface LYProcessListResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYListResponseLYProcessResponse | null;
}

/**
 * LYProcessResponse
 * 流程响应模型
 */
export interface LYProcessResponse {
  /**
   * Id
   * 流程ID
   */
  id: string;
  /**
   * Name
   * 流程名称
   */
  name: string;
  /**
   * Description
   * 流程描述
   */
  description?: string | null;
  /**
   * Language
   * 开发语言
   */
  language?: string | null;
  /**
   * Process Type
   * 流程类型
   */
  process_type: string;
  /**
   * Timeout
   * 超时时间（分钟）
   */
  timeout: number;
  /**
   * Status
   * 流程状态
   */
  status: string;
  /**
   * Current Version Id
   * 当前版本ID
   */
  current_version_id?: string | null;
  /**
   * Creator Id
   * 创建者ID
   */
  creator_id: string;
  /**
   * Requirement Id
   * 关联需求ID
   */
  requirement_id?: string | null;
  /**
   * Created At
   * 创建时间
   */
  created_at: string | null;
  /**
   * Updated At
   * 更新时间
   */
  updated_at: string | null;
}

/**
 * LYProcessResultResponse
 * 流程结果响应
 */
export interface LYProcessResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYProcessResponse | null;
}

/**
 * LYProcessVersionListResultResponse
 * 流程版本列表结果响应
 */
export interface LYProcessVersionListResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYListResponseLYProcessVersionResponse | null;
}

/**
 * LYProcessVersionResponse
 * 流程版本响应模型
 */
export interface LYProcessVersionResponse {
  /**
   * Id
   * 版本ID
   */
  id: string;
  /**
   * Version
   * 版本号
   */
  version: string;
  /**
   * Process Id
   * 流程ID
   */
  process_id: string;
  /**
   * Is Active
   * 版本激活状态：true=已上线，false=未上线
   */
  is_active: boolean;
  /**
   * Status
   * 版本状态
   */
  status: string;
  /**
   * Source Code
   * 源代码
   */
  source_code: string;
  /**
   * Package File Id
   * 包文件ID
   */
  package_file_id: string;
  /**
   * Package Size
   * 包大小（字节）
   */
  package_size: number;
  /**
   * Package Checksum
   * 包校验和
   */
  package_checksum: string;
  /**
   * Version Note
   * 版本说明
   */
  version_note?: string | null;
  /**
   * Usage Note
   * 使用说明
   */
  usage_note?: string | null;
  /**
   * Creator Id
   * 创建者ID
   */
  creator_id: string;
  /**
   * Created At
   * 创建时间
   */
  created_at: string | null;
  /**
   * Publish Time
   * 发布时间
   */
  publish_time?: string | null;
  /**
   * Publisher Id
   * 发布者ID
   */
  publisher_id?: string | null;
  /**
   * Client Version
   * 客户端版本
   */
  client_version?: string | null;
  /**
   * Os
   * 操作系统
   */
  os?: string | null;
  /**
   * Architecture
   * 系统架构
   */
  architecture?: string | null;
  /**
   * Min Client Version
   * 最低客户端版本
   */
  min_client_version?: string | null;
  /**
   * Supported Os
   * 支持的操作系统列表
   */
  supported_os?: string[] | null;
  /**
   * Required Components
   * 必需的系统组件列表
   */
  required_components?: string[] | null;
  /**
   * Parameters
   * 参数定义列表
   */
  parameters?: Record<string, unknown>[] | null;
  /**
   * Dependencies
   * 依赖资源列表
   */
  dependencies?: Record<string, unknown>[] | null;
}

/**
 * LYRangeResponse
 * 列表范围响应模型
 */
export interface LYRangeResponse {
  /**
   * Offset
   * 偏移量
   */
  offset: number;
  /**
   * Size
   * 大小
   */
  size: number;
  /**
   * Total
   * 总数
   */
  total: number;
}

/**
 * LYUpdateProcessRequest
 * 更新流程请求
 */
export interface LYUpdateProcessRequest {
  /**
   * Name
   * 流程名称
   * @minLength 1
   * @maxLength 100
   */
  name?: string | null;
  /**
   * Description
   * 流程描述
   */
  description?: string | null;
  /**
   * Requirement Id
   * 关联需求ID
   */
  requirement_id?: string | null;
  /**
   * Status
   * 流程状态
   */
  status?: string | null;
}

/**
 * LYVersionApprovalResultResponse
 * 版本审批结果响应
 */
export interface LYVersionApprovalResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYProcessVersionResponse | null;
}

/**
 * LYWorkerResponse
 * Worker响应模型
 */
export interface LYWorkerResponse {
  /**
   * Id
   * Worker ID
   */
  id: string;
  /**
   * Name
   * Worker名称
   */
  name: string;
  /**
   * Description
   * Worker描述
   */
  description?: string | null;
  /**
   * Status
   * Worker状态
   */
  status: string;
  /**
   * Ip Address
   * IP地址
   */
  ip_address: string;
  /**
   * Priority
   * 任务调度优先级
   */
  priority: string;
  /**
   * Client Version
   * 客户端版本
   */
  client_version?: string | null;
  /**
   * Last Heartbeat Time
   * 最近心跳时间
   */
  last_heartbeat_time?: string | null;
  /**
   * Last Heartbeat
   * 最近心跳时间（别名）
   */
  last_heartbeat?: string | null;
  /**
   * Receive Tasks
   * 是否接收任务
   */
  receive_tasks?: boolean | null;
  /**
   * Sync Status
   * 同步状态
   */
  sync_status: string;
  /**
   * Group Id
   * 所属分组ID
   */
  group_id?: string | null;
  /**
   * Group Name
   * 所属分组名称
   */
  group_name?: string | null;
  /**
   * Worker Group Id
   * 所属分组ID（别名）
   */
  worker_group_id?: string | null;
  /**
   * Worker Group Name
   * 所属分组名称（别名）
   */
  worker_group_name?: string | null;
  /**
   * Username
   * 用户名/账户
   */
  username?: string | null;
  /**
   * Account
   * 账户
   */
  account?: string | null;
  /**
   * Device Token
   * 设备Token
   */
  device_token?: string | null;
  /**
   * Desktop Type
   * 桌面类型
   */
  desktop_type?: string | null;
  /**
   * Enable Auto Unlock
   * 启用自动解锁
   */
  enable_auto_unlock?: boolean | null;
  /**
   * Display Size
   * 显示分辨率
   */
  display_size?: string | null;
  /**
   * Resolution
   * 分辨率（别名）
   */
  resolution?: string | null;
  /**
   * Password Sync Status
   * 密码同步状态
   */
  password_sync_status?: string | null;
  /**
   * Force Login
   * 强制登录
   */
  force_login?: boolean | null;
  /**
   * Machine Code
   * 机器码
   */
  machine_code?: string | null;
  /**
   * Host Name
   * 主机名称
   */
  host_name?: string | null;
  /**
   * Host Ip
   * 主机IP
   */
  host_ip?: string | null;
  /**
   * Os
   * 操作系统
   */
  os?: string | null;
  /**
   * Arch
   * 系统架构
   */
  arch?: string | null;
  /**
   * Cpu Model
   * CPU型号
   */
  cpu_model?: string | null;
  /**
   * Cpu Cores
   * CPU核心数
   */
  cpu_cores?: number | null;
  /**
   * Memory Capacity
   * 内存容量
   */
  memory_capacity?: string | null;
  /**
   * Robot Count
   * 机器人数量
   */
  robot_count?: number | null;
  /**
   * Creator Id
   * 创建者ID
   */
  creator_id: string;
  /**
   * Created At
   * 创建时间
   */
  created_at: string | null;
  /**
   * Updated At
   * 更新时间
   */
  updated_at?: string | null;
}

/**
 * LYWorkerListResultResponse
 * Worker列表结果响应
 */
export interface LYWorkerListResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYListResponseLYWorkerResponse | null;
}

/**
 * LYWorkerResultResponse
 * Worker结果响应
 */
export interface LYWorkerResultResponse {
  /**
   * Message
   * 消息
   * @default ""
   */
  message?: string;
  /**
   * Tips
   * 提示
   */
  tips?: string | null;
  /**
   * Code
   * 结果代码
   * @default "success"
   */
  code?: 'success' | 'failed' | 'invalid_params' | 'exists' | 'not_exists' | 'forbidden' | 'timeout' | 'expired';
  /** 数据 */
  data?: LYWorkerResponse | null;
}

/**
 * LYCreateWorkerRequest
 * 创建Worker请求
 */
export interface LYCreateWorkerRequest {
  /**
   * Name
   * Worker名称
   * @minLength 2
   * @maxLength 50
   */
  name: string;
  /**
   * Description
   * Worker描述
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Desktop Type
   * 桌面类型 (console/not_console)
   */
  desktop_type: string;
  /**
   * Account
   * 账户
   * @minLength 2
   * @maxLength 100
   */
  account: string;
  /**
   * Password
   * 密码
   */
  password?: string | null;
  /**
   * Force Login
   * 强制登录
   * @default false
   */
  force_login?: boolean;
  /**
   * Resolution
   * 分辨率
   */
  resolution?: string | null;
  /**
   * Worker Group Id
   * 分组ID
   */
  worker_group_id?: string | null;
  /**
   * Existing Worker Id
   * 已存在的Worker ID（用于复用同一机器）
   */
  existing_worker_id?: string | null;
}

/**
 * LYUpdateWorkerRequest
 * 更新Worker请求
 */
export interface LYUpdateWorkerRequest {
  /**
   * Name
   * Worker名称
   * @minLength 2
   * @maxLength 50
   */
  name?: string | null;
  /**
   * Description
   * Worker描述
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Priority
   * 任务调度优先级 (high/medium/low)
   */
  priority?: string | null;
  /**
   * Receive Tasks
   * 是否接收任务
   */
  receive_tasks?: boolean | null;
  /**
   * Account
   * 账户
   */
  account?: string | null;
  /**
   * Password
   * 密码
   */
  password?: string | null;
  /**
   * Force Login
   * 强制登录
   */
  force_login?: boolean | null;
  /**
   * Resolution
   * 分辨率
   */
  resolution?: string | null;
  /**
   * Worker Group Id
   * 分组ID
   */
  worker_group_id?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

/**
 * GetProcessesParams
 * 获取流程列表参数
 */
export interface GetProcessesParams {
  /**
   * Offset
   * 偏移量
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 大小
   * @default 20
   */
  size?: number;
  /**
   * Keyword
   * 搜索关键词
   */
  keyword?: string;
  /**
   * Status
   * 流程状态筛选
   */
  status?: string;
  /**
   * Sort By
   * 排序字段
   */
  sort_by?: string;
  /**
   * Sort Order
   * 排序方向
   */
  sort_order?: 'asc' | 'desc';
}

/**
 * GetWorkersParams
 * 获取Worker列表参数
 */
export interface GetWorkersParams {
  /**
   * Offset
   * 偏移量
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 大小
   * @default 20
   */
  size?: number;
  /**
   * Keyword
   * 搜索关键词
   */
  keyword?: string;
  /**
   * Status
   * Worker状态筛选
   */
  status?: string;
  /**
   * Priority
   * 优先级筛选
   */
  priority?: string;
  /**
   * Worker Group Id
   * 分组ID筛选
   */
  worker_group_id?: string;
  /**
   * Sort By
   * 排序字段
   */
  sort_by?: string;
  /**
   * Sort Order
   * 排序方向
   */
  sort_order?: 'asc' | 'desc';
}

// ==================== 凭据管理相关类型 ====================

/**
 * 凭据类型枚举
 * FIXED_VALUE - 固定值凭据
 * PERSONAL_REF - 关联个人凭据
 */
export type CredentialType = 'FIXED_VALUE' | 'PERSONAL_REF';

/**
 * 凭据值结构
 */
export interface CredentialValue {
  /**
   * Username
   * 用户名
   */
  username: string;
  /**
   * Password
   * 密码（显示为******）
   */
  password: string;
}

/**
 * LYCredentialResponse
 * 凭据响应模型
 */
export interface LYCredentialResponse {
  /**
   * Credential Id
   * 凭据ID
   */
  credential_id: string;
  /**
   * Credential Name
   * 凭据名称
   */
  credential_name: string;
  /**
   * Credential Type
   * 凭据类型
   */
  credential_type: CredentialType;
  /**
   * Test Value
   * 测试凭据值
   */
  test_value: CredentialValue;
  /**
   * Production Value
   * 生产凭据值
   */
  production_value: CredentialValue;
  /**
   * Description
   * 凭据描述
   */
  description?: string | null;
  /**
   * Linked Personal Credential Value
   * 关联的个人凭据值（格式：用户名/******）
   */
  linked_personal_credential_value?: string | null;
  /**
   * Created By
   * 创建者ID
   */
  created_by: string;
  /**
   * Created By Name
   * 创建者名称
   */
  created_by_name?: string | null;
  /**
   * Created At
   * 创建时间
   */
  created_at: string;
  /**
   * Updated At
   * 更新时间
   */
  updated_at: string;
}

/**
 * LYCredentialListResultResponse
 * 凭据列表结果响应
 */
export interface LYCredentialListResultResponse {
  /**
   * Data
   * 凭据列表
   */
  data: LYCredentialResponse[];
  /**
   * Range
   * 分页信息
   */
  range: LYRangeResponse;
}

/**
 * LYCreateCredentialRequest
 * 创建凭据请求
 */
export interface LYCreateCredentialRequest {
  /**
   * Name
   * 凭据名称
   * @minLength 1
   * @maxLength 30
   */
  name: string;
  /**
   * Type
   * 凭据类型
   */
  type: CredentialType;
  /**
   * Username
   * 用户名
   */
  username: string;
  /**
   * Password
   * 密码
   */
  password: string;
  /**
   * Description
   * 凭据描述
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Context
   * 创建上下文（development/scheduling）
   */
  context: 'development' | 'scheduling';
}

/**
 * LYUpdateCredentialRequest
 * 更新凭据请求
 */
export interface LYUpdateCredentialRequest {
  /**
   * Name
   * 凭据名称
   * @minLength 1
   * @maxLength 30
   */
  name?: string | null;
  /**
   * Username
   * 用户名
   */
  username?: string | null;
  /**
   * Password
   * 密码（留空则不修改）
   */
  password?: string | null;
  /**
   * Description
   * 凭据描述
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Context
   * 更新上下文（development/scheduling）
   */
  context: 'development' | 'scheduling';
}

/**
 * GetCredentialsParams
 * 获取凭据列表参数
 */
export interface GetCredentialsParams {
  /**
   * Offset
   * 偏移量
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 大小
   * @default 20
   */
  size?: number;
  /**
   * Keyword
   * 搜索关键词
   */
  keyword?: string;
  /**
   * Context
   * 上下文（development/scheduling）
   */
  context?: 'development' | 'scheduling';
}

// ==================== 参数管理相关类型 ====================

/**
 * 参数类型枚举
 * 1 - 文本
 * 2 - 布尔
 * 3 - 数值
 */
export type ParameterType = 1 | 2 | 3;

/**
 * LYParameterResponse
 * 参数响应模型
 */
export interface LYParameterResponse {
  /**
   * Parameter Id
   * 参数ID
   */
  parameter_id: string;
  /**
   * Parameter Name
   * 参数名称
   */
  parameter_name: string;
  /**
   * Parameter Type
   * 参数类型（1=文本，2=布尔，3=数值）
   */
  parameter_type: ParameterType;
  /**
   * Dev Value
   * 调试值（开发中心使用）
   */
  dev_value: string | null;
  /**
   * Prod Value
   * 生产值（调度中心使用）
   */
  prod_value: string | null;
  /**
   * Description
   * 参数说明
   */
  description?: string | null;
  /**
   * Is Published
   * 是否已发布
   */
  is_published: boolean;
  /**
   * Created By
   * 创建者ID
   */
  created_by: string;
  /**
   * Created By Name
   * 创建者名称
   */
  created_by_name?: string | null;
  /**
   * Created At
   * 创建时间
   */
  created_at: string;
  /**
   * Updated At
   * 更新时间
   */
  updated_at: string;
}

/**
 * LYParameterListResultResponse
 * 参数列表结果响应
 */
export interface LYParameterListResultResponse {
  /**
   * Data
   * 参数列表
   */
  data: LYParameterResponse[];
  /**
   * Range
   * 分页信息
   */
  range: LYRangeResponse;
}

/**
 * LYCreateParameterRequest
 * 创建参数请求
 */
export interface LYCreateParameterRequest {
  /**
   * Name
   * 参数名称
   * @minLength 1
   * @maxLength 30
   */
  name: string;
  /**
   * Type
   * 参数类型（1=文本，2=布尔，3=数值）
   */
  type: ParameterType;
  /**
   * Value
   * 参数值
   */
  value: string;
  /**
   * Description
   * 参数说明
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Context
   * 创建上下文（development/scheduling）
   * - development: 保存到dev_value
   * - scheduling: 保存到prod_value
   */
  context: 'development' | 'scheduling';
}

/**
 * LYUpdateParameterRequest
 * 更新参数请求
 */
export interface LYUpdateParameterRequest {
  /**
   * Type
   * 参数类型（1=文本，2=布尔，3=数值）
   */
  type?: ParameterType | null;
  /**
   * Value
   * 参数值
   */
  value?: string | null;
  /**
   * Description
   * 参数说明
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Context
   * 更新上下文（development/scheduling）
   * - development: 更新dev_value
   * - scheduling: 更新prod_value
   */
  context: 'development' | 'scheduling';
}

/**
 * GetParametersParams
 * 获取参数列表参数
 */
export interface GetParametersParams {
  /**
   * Offset
   * 偏移量
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 大小
   * @default 20
   */
  size?: number;
  /**
   * Keyword
   * 搜索关键词（参数名称）
   */
  keyword?: string;
  /**
   * Type
   * 参数类型筛选
   */
  type?: ParameterType | null;
  /**
   * Context
   * 上下文（development/scheduling）
   * - development: 返回所有参数，显示dev_value
   * - scheduling: 仅返回isPublished=true的参数，显示prod_value
   */
  context?: 'development' | 'scheduling';
}

// ==================== 个人凭据管理相关类型 ====================

/**
 * PersonalCredentialValue
 * 个人凭据值结构
 */
export interface PersonalCredentialValue {
  username: string;
  password: string;
}

/**
 * LYPersonalCredentialResponse
 * 个人凭据响应模型
 */
export interface LYPersonalCredentialResponse {
  credential_id: string;
  credential_name: string;
  credential_value: PersonalCredentialValue;
  description?: string | null;
  linked_credentials_count?: number;
  owner_id: string;
  owner_name?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * LYPersonalCredentialListResultResponse
 * 个人凭据列表结果响应
 */
export interface LYPersonalCredentialListResultResponse {
  data: LYPersonalCredentialResponse[];
  range: LYRangeResponse;
}

/**
 * LYCreatePersonalCredentialRequest
 * 创建个人凭据请求
 */
export interface LYCreatePersonalCredentialRequest {
  credential_name: string;
  credential_value: PersonalCredentialValue;
  description?: string | null;
}

/**
 * LYUpdatePersonalCredentialRequest
 * 更新个人凭据请求
 */
export interface LYUpdatePersonalCredentialRequest {
  credential_name?: string | null;
  credential_value?: PersonalCredentialValue;
  description?: string | null;
}

/**
 * GetPersonalCredentialsParams
 * 获取个人凭据列表参数
 */
export interface GetPersonalCredentialsParams {
  offset?: number;
  size?: number;
  keyword?: string;
}

/**
 * LYLinkCredentialRequest
 * 关联凭据请求
 */
export interface LYLinkCredentialRequest {
  personal_credential_id: string;
  credential_id: string;
  credential_ids?: string[];
}

// ==================== 流程机器人组管理相关类型 ====================

/**
 * LYWorkerGroupResponse
 * 流程机器人组响应模型
 */
export interface LYWorkerGroupResponse {
  id: string;
  name: string;
  description?: string | null;
  member_count: number;
  creator_id: string;
  creator_name?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** LYListResponse[LYWorkerGroupResponse] */
export interface LYListResponseLYWorkerGroupResponse {
  range?: LYRangeResponse | null;
  list: LYWorkerGroupResponse[];
}

/**
 * LYWorkerGroupMemberResponse
 * 流程机器人组成员响应模型
 */
export interface LYWorkerGroupMemberResponse {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  sync_status?: string | null;
  ip_address?: string | null;
  priority?: string | null;
  client_version?: string | null;
  last_heartbeat_time?: string | null;
  last_heartbeat?: string | null;
  receive_tasks?: boolean | null;
  username?: string | null;
  desktop_type?: string | null;
  enable_auto_unlock?: boolean | null;
  display_size?: string | null;
  force_login?: boolean | null;
  device_token?: string | null;
  machine_code?: string | null;
  host_name?: string | null;
  os?: string | null;
  arch?: string | null;
  cpu_model?: string | null;
  cpu_cores?: number | null;
  memory_capacity?: string | null;
  robot_count?: number | null;
  created_at?: string | null;
  creator_id?: string | null;
  group_id?: string | null;
  joined_at?: string | null;
}

/** LYListResponse[LYWorkerGroupMemberResponse] */
export interface LYListResponseLYWorkerGroupMemberResponse {
  range?: LYRangeResponse | null;
  list: LYWorkerGroupMemberResponse[];
}

/**
 * LYCreateWorkerGroupRequest
 * 创建流程机器人组请求
 */
export interface LYCreateWorkerGroupRequest {
  name: string;
  description?: string | null;
}

/**
 * LYUpdateWorkerGroupRequest
 * 更新流程机器人组请求
 */
export interface LYUpdateWorkerGroupRequest {
  name?: string | null;
  description?: string | null;
}

/**
 * GetWorkerGroupsParams
 * 获取流程机器人组列表参数
 */
export interface GetWorkerGroupsParams {
  offset?: number;
  size?: number;
  keyword?: string;
}

/**
 * GetWorkerGroupMembersParams
 * 获取流程机器人组成员列表参数
 */
export interface GetWorkerGroupMembersParams {
  group_id: string;
  offset?: number;
  size?: number;
  keyword?: string;
  status?: string;
}

/**
 * GetAvailableWorkersForGroupParams
 * 获取可添加到组的流程机器人列表参数
 */
export interface GetAvailableWorkersForGroupParams {
  group_id: string;
  offset?: number;
  size?: number;
  keyword?: string;
}
