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
}

/**
 * LYProcessVersionResultResponse
 * 流程版本结果响应
 */
export interface LYProcessVersionResultResponse {
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

/** LYRangeResponse */
export interface LYRangeResponse {
  /**
   * Offset
   * 偏移量
   */
  offset: number;
  /**
   * Size
   * 查询数量
   */
  size: number;
  /**
   * Total
   * 总数量
   */
  total?: number | null;
}

/**
 * LYUpdateProcessRequest
 * 更新流程请求
 */
export interface LYUpdateProcessRequest {
  /**
   * Name
   * 流程名称
   */
  name?: string | null;
  /**
   * Description
   * 流程描述
   */
  description?: string | null;
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
 * LYWorkerResponse
 * 机器人响应模型
 */
export interface LYWorkerResponse {
  /**
   * Id
   * 机器人ID
   */
  id: string;
  /**
   * Name
   * 机器人名称
   */
  name: string;
  /**
   * Description
   * 机器人描述
   */
  description?: string | null;
  /**
   * Status
   * 机器人状态 (OFFLINE/IDLE/BUSY/FAULT/MAINTENANCE)
   */
  status: 'OFFLINE' | 'IDLE' | 'BUSY' | 'FAULT' | 'MAINTENANCE';
  /**
   * Sync Status
   * 同步状态 (SYNCED/PENDING)
   */
  sync_status: 'SYNCED' | 'PENDING';
  /**
   * Ip Address
   * IP地址
   */
  ip_address: string;
  /**
   * Priority
   * 优先级 (HIGH/MEDIUM/LOW)
   */
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /**
   * Client Version
   * 客户端版本
   */
  client_version: string;
  /**
   * Last Heartbeat Time
   * 最后心跳时间
   */
  last_heartbeat_time: string;
  /**
   * Receive Tasks
   * 是否接收任务
   */
  receive_tasks: boolean;
  /**
   * Username
   * 用户名
   */
  username: string;
  /**
   * Desktop Type
   * 桌面类型 (Console/NotConsole)
   */
  desktop_type: 'Console' | 'NotConsole';
  /**
   * Display Size
   * 显示尺寸
   */
  display_size?: string | null;
  /**
   * Enable Auto Unlock
   * 是否启用自动解锁
   */
  enable_auto_unlock?: boolean | null;
  /**
   * Force Login
   * 是否强制登录
   */
  force_login: boolean;
  /**
   * Device Token
   * 设备令牌
   */
  device_token: string;
  /**
   * Machine Code
   * 机器码
   */
  machine_code: string;
  /**
   * Host Name
   * 主机名
   */
  host_name: string;
  /**
   * Os
   * 操作系统
   */
  os: string;
  /**
   * Arch
   * 系统架构
   */
  arch: string;
  /**
   * Cpu Model
   * CPU型号
   */
  cpu_model: string;
  /**
   * Cpu Cores
   * CPU核心数
   */
  cpu_cores: number;
  /**
   * Memory Capacity
   * 内存容量
   */
  memory_capacity: string;
  /**
   * Robot Count
   * 机器人数量
   */
  robot_count: number;
  /**
   * Created At
   * 创建时间
   */
  created_at: string;
  /**
   * Creator Id
   * 创建者ID
   */
  creator_id: string;
}

/**
 * GetWorkersParams
 * 机器人列表查询参数
 */
export interface GetWorkersParams {
  /** Keyword */
  keyword?: string | null;
  /** Status */
  status?: string | null;
  /** Sync Status */
  sync_status?: string | null;
  /** Priority */
  priority?: string | null;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量
   * @min 0
   * @default 20
   */
  size?: number;
}

export interface GetProcessesParams {
  /** Keyword */
  keyword?: string | null;
  /** Language */
  language?: string | null;
  /** Process Type */
  process_type?: string | null;
  /** Status */
  status?: string | null;
  /**
   * Sort By
   * @default "updated_at"
   */
  sort_by?: string;
  /**
   * Sort Order
   * @default "desc"
   */
  sort_order?: string;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量，最大值请参考web_api.max_count_per_query
   * @min 0
   * @default 20
   */
  size?: number;
}

export type GetProcessesData = LYProcessListResultResponse;

export interface AddProcessesParams {}

export type AddProcessesData = LYProcessResultResponse;

export interface GetProcessesByProcessIdParams {
  /** Process Id */
  processId: string;
}

export type GetProcessesByProcessIdData = LYProcessResultResponse;

export interface AddProcessesByProcessIdParams {
  /** Process Id */
  processId: string;
}

export type AddProcessesByProcessIdData = LYProcessResultResponse;

export interface ProcessesRemoveByProcessIdParams {
  /** Process Id */
  processId: string;
}

export type ProcessesRemoveByProcessIdData = LYProcessResultResponse;

export interface ProcessesVersionsByProcessIdParams {
  /** Status */
  status?: string | null;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量，最大值请参考web_api.max_count_per_query
   * @min 0
   * @default 20
   */
  size?: number;
  /** Process Id */
  processId: string;
}

export type ProcessesVersionsByProcessIdData = LYProcessVersionListResultResponse;

export interface ProcessesVersionsByProcessId2Params {
  /** Process Id */
  processId: string;
}

export type ProcessesVersionsByProcessId2Data = LYProcessVersionResultResponse;

export interface ProcessesVersionsByProcessIdAndVersionIdParams {
  /** Process Id */
  processId: string;
  /** Version Id */
  versionId: string;
}

export type ProcessesVersionsByProcessIdAndVersionIdData = LYProcessVersionResultResponse;

export interface ProcessesVersionsUploadByProcessIdParams {
  /** Version */
  version?: string;
  /** Language */
  language?: string | null;
  /** Version Note */
  version_note?: string | null;
  /** Usage Note */
  usage_note?: string | null;
  /** Source Code */
  source_code?: string | null;
  /** Environment Info */
  environment_info?: string | null;
  /** Parameters */
  parameters?: string | null;
  /** Dependencies */
  dependencies?: string | null;
  /** Process Id */
  processId: string;
}

export type ProcessesVersionsUploadByProcessIdData = LYProcessVersionResultResponse;

export interface ProcessesVersionsSubmitByProcessIdAndVersionIdParams {
  /** Process Id */
  processId: string;
  /** Version Id */
  versionId: string;
}

export type ProcessesVersionsSubmitByProcessIdAndVersionIdData = LYProcessVersionResultResponse;

export interface ProcessesVersionsDownloadByProcessIdAndVersionIdParams {
  /** Process Id */
  processId: string;
  /** Version Id */
  versionId: string;
}

export type ProcessesVersionsDownloadByProcessIdAndVersionIdData = unknown;

export interface ProcessesVersionsApproveByProcessIdAndVersionIdParams {
  /** Process Id */
  processId: string;
  /** Version Id */
  versionId: string;
}

export type ProcessesVersionsApproveByProcessIdAndVersionIdData = LYProcessVersionResultResponse;

export interface ProcessesApprovalsPendingParams {
  /** Process Id */
  process_id?: string | null;
  /** Keyword */
  keyword?: string | null;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量，最大值请参考web_api.max_count_per_query
   * @min 0
   * @default 20
   */
  size?: number;
}

export type ProcessesApprovalsPendingData = LYPendingApprovalListResultResponse;

// ============= 凭据管理相关类型定义 =============

/**
 * 凭据类型枚举
 */
export type CredentialType = 'FIXED_VALUE' | 'PERSONAL_REF';

/**
 * 凭据值结构
 */
export interface LYCredentialValue {
  /**
   * Username
   * 用户名
   */
  username: string;
  /**
   * Password
   * 密码（加密显示为 ******）
   */
  password: string;
}

/**
 * LYCredentialResponse
 * 凭据响应
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
   * @minLength 1
   * @maxLength 30
   */
  credential_name: string;
  /**
   * Credential Type
   * 凭据类型 (FIXED_VALUE/PERSONAL_REF)
   */
  credential_type: CredentialType;
  /**
   * Test Value
   * 测试值（开发中心使用）
   */
  test_value?: LYCredentialValue | null;
  /**
   * Production Value
   * 生产值（调度中心使用）
   */
  production_value?: LYCredentialValue | null;
  /**
   * Description
   * 凭据描述
   * @maxLength 500
   */
  description?: string | null;
  /**
   * Linked Personal Credential Value
   * 关联的个人凭据值（格式：用户名/****** 或 -）
   */
  linked_personal_credential_value?: string | null;
  /**
   * Created By
   * 创建人ID
   */
  created_by: string;
  /**
   * Created By Name
   * 创建人名称
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
  updated_at?: string | null;
}

/**
 * LYCredentialListResultResponse
 * 凭据列表结果响应
 */
export interface LYCredentialListResultResponse {
  /** Data */
  data?: LYCredentialResponse[] | null;
  /** Range */
  range?: LYRangeResponse | null;
}

/**
 * LYCredentialResultResponse
 * 凭据单条结果响应
 */
export interface LYCredentialResultResponse {
  /** Data */
  data?: LYCredentialResponse | null;
}

/**
 * LYCreateCredentialRequest
 * 创建凭据请求
 */
export interface LYCreateCredentialRequest {
  /**
   * Credential Name
   * 凭据名称
   * @minLength 1
   * @maxLength 30
   */
  credential_name: string;
  /**
   * Credential Type
   * 凭据类型 (FIXED_VALUE/PERSONAL_REF)
   */
  credential_type: CredentialType;
  /**
   * Credential Value
   * 凭据值（根据入口保存到 test_value 或 production_value）
   */
  credential_value: LYCredentialValue;
  /**
   * Description
   * 凭据描述
   * @maxLength 500
   */
  description?: string | null;
}

/**
 * LYUpdateCredentialRequest
 * 更新凭据请求
 */
export interface LYUpdateCredentialRequest {
  /**
   * Credential Name
   * 凭据名称
   * @minLength 1
   * @maxLength 30
   */
  credential_name?: string | null;
  /**
   * Credential Value
   * 凭据值（根据入口更新 test_value 或 production_value）
   */
  credential_value?: LYCredentialValue | null;
  /**
   * Description
   * 凭据描述
   * @maxLength 500
   */
  description?: string | null;
}

/**
 * GetCredentialsParams
 * 获取凭据列表参数
 */
export interface GetCredentialsParams {
  /**
   * Keyword
   * 凭据名称关键词
   */
  keyword?: string | null;
  /**
   * Credential Type
   * 凭据类型过滤
   */
  credential_type?: CredentialType | null;
  /**
   * Context
   * 入口上下文 (development/scheduling)
   */
  context: 'development' | 'scheduling';
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量
   * @min 0
   * @default 20
   */
  size?: number;
}

export type GetCredentialsData = LYCredentialListResultResponse;

export type AddCredentialData = LYCredentialResultResponse;

export interface GetCredentialByIdParams {
  /** Credential Id */
  credentialId: string;
}

export type GetCredentialByIdData = LYCredentialResultResponse;

export interface UpdateCredentialParams {
  /** Credential Id */
  credentialId: string;
}

export type UpdateCredentialData = LYCredentialResultResponse;

export interface DeleteCredentialParams {
  /** Credential Id */
  credentialId: string;
}

export type DeleteCredentialData = LYCredentialResultResponse;

// ============= 流程机器人组 (Worker Group) =============

/**
 * LYWorkerGroupResponse
 * 流程机器人组响应模型
 */
export interface LYWorkerGroupResponse {
  /**
   * Id
   * 机器人组ID
   */
  id: string;
  /**
   * Name
   * 机器人组名称
   */
  name: string;
  /**
   * Description
   * 机器人组描述
   */
  description?: string | null;
  /**
   * Member Count
   * 成员数量
   */
  member_count: number;
  /**
   * Creator Id
   * 创建者ID
   */
  creator_id: string;
  /**
   * Creator Name
   * 创建者名称
   */
  creator_name?: string | null;
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

/** LYListResponse[LYWorkerGroupResponse] */
export interface LYListResponseLYWorkerGroupResponse {
  /** 范围 */
  range?: LYRangeResponse | null;
  /**
   * List
   * 列表
   */
  list: LYWorkerGroupResponse[];
}

/**
 * LYCreateWorkerGroupRequest
 * 创建流程机器人组请求
 */
export interface LYCreateWorkerGroupRequest {
  /**
   * Name
   * 机器人组名称
   * @minLength 1
   * @maxLength 30
   */
  name: string;
  /**
   * Description
   * 机器人组描述
   * @maxLength 2000
   */
  description?: string | null;
}

/**
 * LYUpdateWorkerGroupRequest
 * 更新流程机器人组请求
 */
export interface LYUpdateWorkerGroupRequest {
  /**
   * Name
   * 机器人组名称
   * @minLength 1
   * @maxLength 30
   */
  name?: string | null;
  /**
   * Description
   * 机器人组描述
   * @maxLength 2000
   */
  description?: string | null;
}

/**
 * LYAddWorkerGroupMembersRequest
 * 添加流程机器人组成员请求
 */
export interface LYAddWorkerGroupMembersRequest {
  /**
   * Worker Ids
   * 流程机器人ID列表
   */
  worker_ids: string[];
}

/**
 * LYWorkerGroupMemberResponse
 * 流程机器人组成员响应模型 - 与LYWorkerResponse相同但增加group相关字段
 */
export interface LYWorkerGroupMemberResponse extends LYWorkerResponse {
  /**
   * Group Id
   * 所属组ID
   */
  group_id?: string | null;
  /**
   * Joined At
   * 加入时间
   */
  joined_at?: string | null;
}

/** LYListResponse[LYWorkerGroupMemberResponse] */
export interface LYListResponseLYWorkerGroupMemberResponse {
  /** 范围 */
  range?: LYRangeResponse | null;
  /**
   * List
   * 列表
   */
  list: LYWorkerGroupMemberResponse[];
}

/**
 * GetWorkerGroupsParams
 * 机器人组列表查询参数
 */
export interface GetWorkerGroupsParams {
  /** Keyword */
  keyword?: string | null;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量
   * @min 0
   * @default 20
   */
  size?: number;
}

/**
 * GetWorkerGroupMembersParams
 * 机器人组成员列表查询参数
 */
export interface GetWorkerGroupMembersParams {
  /** Group Id */
  group_id: string;
  /** Keyword */
  keyword?: string | null;
  /** Status */
  status?: string | null;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量
   * @min 0
   * @default 20
   */
  size?: number;
}

/**
 * GetAvailableWorkersForGroupParams
 * 可添加到组的机器人列表查询参数
 */
export interface GetAvailableWorkersForGroupParams {
  /** Keyword */
  keyword?: string | null;
  /**
   * Offset
   * 查询偏移量
   * @min 0
   * @default 0
   */
  offset?: number;
  /**
   * Size
   * 查询数量
   * @min 0
   * @default 20
   */
  size?: number;
}
