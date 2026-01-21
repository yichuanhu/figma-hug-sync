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
     * Language
     * 开发语言
     * @default "Python"
     */
    language?: string;
    /**
     * Timeout
     * 超时时间（分钟）
     * @min 1
     * @max 1440
     * @default 60
     */
    timeout?: number;
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
    parameters?: Record<string, any>[] | null;
    /**
     * Dependencies
     * 依赖资源列表
     */
    dependencies?: Record<string, any>[] | null;
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
    language: string;
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
    /**
     * Timeout
     * 超时时间（分钟）
     */
    timeout?: number | null;
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

export interface ProcessesVersionsSubmitByProcessIdAndVersionIdParams {
    /** Process Id */
    processId: string;
    /** Version Id */
    versionId: string;
}

export type ProcessesVersionsSubmitByProcessIdAndVersionIdData = LYProcessVersionResultResponse;

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

/**
 * @title apa - WebAPI
 * @version 1.0.0
 */
import { LYBaseApp } from '@laiye_packages/uci';

export default {
    /**
     * @description 查询流程列表 * * @tags Process Management
     * @name GetProcesses
     * @summary List Processes
     * @request GET:/web/apa/{tenant_name}/processes
     * @secure */
    async getProcesses(params: GetProcessesParams) {
        return await LYBaseApp.get('apa').httpClient.get<GetProcessesData>(`/processes`, params);
    },

    /**
     * @description 创建新流程 * * @tags Process Management
     * @name AddProcesses
     * @summary Create Process
     * @request POST:/web/apa/{tenant_name}/processes
     * @secure */
    async addProcesses(params: LYCreateProcessRequest) {
        return await LYBaseApp.get('apa').httpClient.post<AddProcessesData>(`/processes`, params);
    },

    /**
     * @description 查询流程详情 * * @tags Process Management
     * @name GetProcessesByProcessId
     * @summary Get Process
     * @request GET:/web/apa/{tenant_name}/processes/{process_id}
     * @secure */
    async getProcessesByProcessId(processId: string) {
        return await LYBaseApp.get('apa').httpClient.get<GetProcessesByProcessIdData>(`/processes/${processId}`);
    },

    /**
     * @description 更新流程信息 * * @tags Process Management
     * @name AddProcessesByProcessId
     * @summary Update Process
     * @request POST:/web/apa/{tenant_name}/processes/{process_id}
     * @secure */
    async addProcessesByProcessId(processId: string, params: LYUpdateProcessRequest) {
        return await LYBaseApp.get('apa').httpClient.post<AddProcessesByProcessIdData>(`/processes/${processId}`, params);
    },

    /**
     * @description 删除流程 * * @tags Process Management
     * @name ProcessesRemoveByProcessId
     * @summary Delete Process
     * @request POST:/web/apa/{tenant_name}/processes/{process_id}/delete
     * @secure */
    async processesRemoveByProcessId(processId: string, params: LYDeleteProcessRequest) {
        return await LYBaseApp.get('apa').httpClient.post<ProcessesRemoveByProcessIdData>(`/processes/${processId}/delete`, params);
    },

    /**
     * @description 查询流程版本列表 * * @tags Process Management
     * @name ProcessesVersionsByProcessId
     * @summary List Process Versions
     * @request GET:/web/apa/{tenant_name}/processes/{process_id}/versions
     * @secure */
    async processesVersionsByProcessId(params: ProcessesVersionsByProcessIdParams) {
        const { processId } = params;
        return await LYBaseApp.get('apa').httpClient.get<ProcessesVersionsByProcessIdData>(`/processes/${processId}/versions`, params);
    },

    /**
     * @description 创建流程版本 * * @tags Process Management
     * @name ProcessesVersionsByProcessId2
     * @summary Create Process Version
     * @request POST:/web/apa/{tenant_name}/processes/{process_id}/versions
     * @originalName processesVersionsByProcessId
     * @duplicate
     * @secure */
    async processesVersionsByProcessId2(processId: string, params: LYCreateVersionRequest) {
        return await LYBaseApp.get('apa').httpClient.post<ProcessesVersionsByProcessId2Data>(`/processes/${processId}/versions`, params);
    },

    /**
     * @description 查询版本详情 * * @tags Process Management
     * @name ProcessesVersionsByProcessIdAndVersionId
     * @summary Get Process Version
     * @request GET:/web/apa/{tenant_name}/processes/{process_id}/versions/{version_id}
     * @secure */
    async processesVersionsByProcessIdAndVersionId(processId: string, versionId: string) {
        return await LYBaseApp.get('apa').httpClient.get<ProcessesVersionsByProcessIdAndVersionIdData>(`/processes/${processId}/versions/${versionId}`);
    },

    /**
     * @description 提交流程版本审批申请 * * @tags Process Management
     * @name ProcessesVersionsSubmitByProcessIdAndVersionId
     * @summary Submit Process Version For Approval
     * @request POST:/web/apa/{tenant_name}/processes/{process_id}/versions/{version_id}/submit
     * @secure */
    async processesVersionsSubmitByProcessIdAndVersionId(processId: string, versionId: string) {
        return await LYBaseApp.get('apa').httpClient.post<ProcessesVersionsSubmitByProcessIdAndVersionIdData>(
            `/processes/${processId}/versions/${versionId}/submit`
        );
    },

    /**
     * @description 审批流程版本 * * @tags Process Management
     * @name ProcessesVersionsApproveByProcessIdAndVersionId
     * @summary Approve Process Version
     * @request POST:/web/apa/{tenant_name}/processes/{process_id}/versions/{version_id}/approve
     * @secure */
    async processesVersionsApproveByProcessIdAndVersionId(processId: string, versionId: string, params: LYApprovalRequest) {
        return await LYBaseApp.get('apa').httpClient.post<ProcessesVersionsApproveByProcessIdAndVersionIdData>(
            `/processes/${processId}/versions/${versionId}/approve`,
            params
        );
    },

    /**
     * @description 查询待审批版本列表 * * @tags Process Management
     * @name ProcessesApprovalsPending
     * @summary List Pending Approvals
     * @request GET:/web/apa/{tenant_name}/processes/approvals/pending
     * @secure */
    async processesApprovalsPending(params: ProcessesApprovalsPendingParams) {
        return await LYBaseApp.get('apa').httpClient.get<ProcessesApprovalsPendingData>(`/processes/approvals/pending`, params);
    },
};
