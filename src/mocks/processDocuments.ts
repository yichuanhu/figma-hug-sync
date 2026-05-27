// 流程资料 Mock 数据与服务
// 关联类型：流程 / 流程版本 / 发布记录

export type ProcessDocumentTargetType = 'PROCESS' | 'PROCESS_VERSION' | 'PUBLISH_RECORD';

export type ProcessDocumentType =
  | 'DESIGN_DOC'
  | 'TEST_REPORT'
  | 'USER_MANUAL'
  | 'DEPLOYMENT_NOTE'
  | 'OTHER';

export interface ProcessDocument {
  id: string;
  process_id: string;
  target_type: ProcessDocumentTargetType;
  target_id: string;
  target_label: string; // 关联对象的显示文本（版本号 / 发布单号 / 流程名）
  document_type: ProcessDocumentType;
  file_id: string;
  file_name: string;
  file_size: number; // bytes
  mime_type: string;
  uploader_id: string;
  uploader_name: string;
  uploaded_at: string; // ISO
  remark?: string;
}

export const PROCESS_DOCUMENT_TYPE_LABEL: Record<ProcessDocumentType, string> = {
  DESIGN_DOC: '设计文档',
  TEST_REPORT: '测试报告',
  USER_MANUAL: '用户手册',
  DEPLOYMENT_NOTE: '部署说明',
  OTHER: '其他资料',
};

export const PROCESS_DOCUMENT_TARGET_LABEL: Record<ProcessDocumentTargetType, string> = {
  PROCESS: '流程',
  PROCESS_VERSION: '流程版本',
  PUBLISH_RECORD: '发布记录',
};

export const PROCESS_DOCUMENT_TYPE_COLOR: Record<
  ProcessDocumentType,
  'blue' | 'green' | 'orange' | 'purple' | 'grey'
> = {
  DESIGN_DOC: 'blue',
  TEST_REPORT: 'green',
  USER_MANUAL: 'orange',
  DEPLOYMENT_NOTE: 'purple',
  OTHER: 'grey',
};

// 当前流程对应的发布记录（mock 列表，用于上传时选择）
export interface ProcessPublishRecordBrief {
  id: string;
  label: string; // 例如 "REL-2025-001 v1.1.0"
}

const publishRecordStore = new Map<string, ProcessPublishRecordBrief[]>();

export const getPublishRecordsByProcess = (processId: string): ProcessPublishRecordBrief[] => {
  if (!publishRecordStore.has(processId)) {
    publishRecordStore.set(processId, [
      { id: `${processId}-rel-001`, label: 'REL-2025-001 v1.1.0' },
      { id: `${processId}-rel-002`, label: 'REL-2025-002 v2.0.0' },
    ]);
  }
  return publishRecordStore.get(processId)!;
};

// In-memory store
const documentStore = new Map<string, ProcessDocument[]>();

const uid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const ensureSeeded = (processId: string, processName: string) => {
  if (documentStore.has(processId)) return;
  const now = Date.now();
  const seed: ProcessDocument[] = [
    {
      id: uid(),
      process_id: processId,
      target_type: 'PROCESS',
      target_id: processId,
      target_label: processName,
      document_type: 'DESIGN_DOC',
      file_id: uid(),
      file_name: '流程设计文档_V1.docx',
      file_size: 1.8 * 1024 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      uploader_id: 'user-001',
      uploader_name: '张明',
      uploaded_at: new Date(now - 7 * 86400000).toISOString(),
      remark: '初版整体设计说明',
    },
    {
      id: uid(),
      process_id: processId,
      target_type: 'PROCESS_VERSION',
      target_id: 'version-mock-1',
      target_label: 'v1.1.0',
      document_type: 'USER_MANUAL',
      file_id: uid(),
      file_name: '用户操作手册_v1.1.0.pdf',
      file_size: 3.2 * 1024 * 1024,
      mime_type: 'application/pdf',
      uploader_id: 'user-002',
      uploader_name: '李华',
      uploaded_at: new Date(now - 3 * 86400000).toISOString(),
    },
    {
      id: uid(),
      process_id: processId,
      target_type: 'PUBLISH_RECORD',
      target_id: `${processId}-rel-001`,
      target_label: 'REL-2025-001 v1.1.0',
      document_type: 'TEST_REPORT',
      file_id: uid(),
      file_name: '上线测试报告.xlsx',
      file_size: 256 * 1024,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploader_id: 'user-003',
      uploader_name: '王芳',
      uploaded_at: new Date(now - 1 * 86400000).toISOString(),
      remark: 'UAT 通过',
    },
  ];
  documentStore.set(processId, seed);
};

export interface ListDocumentsFilter {
  documentTypes?: ProcessDocumentType[];
  targetTypes?: ProcessDocumentTargetType[];
  keyword?: string;
}

export const listProcessDocuments = (
  processId: string,
  processName: string,
  filter: ListDocumentsFilter = {},
): ProcessDocument[] => {
  ensureSeeded(processId, processName);
  let list = documentStore.get(processId) || [];
  if (filter.documentTypes?.length) {
    list = list.filter((d) => filter.documentTypes!.includes(d.document_type));
  }
  if (filter.targetTypes?.length) {
    list = list.filter((d) => filter.targetTypes!.includes(d.target_type));
  }
  if (filter.keyword) {
    const kw = filter.keyword.trim().toLowerCase();
    if (kw) {
      list = list.filter(
        (d) =>
          d.file_name.toLowerCase().includes(kw) ||
          d.target_label.toLowerCase().includes(kw),
      );
    }
  }
  return [...list].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime(),
  );
};

export interface CreateDocumentInput {
  process_id: string;
  process_name: string;
  target_type: ProcessDocumentTargetType;
  target_id: string;
  target_label: string;
  document_type: ProcessDocumentType;
  file: File;
  remark?: string;
}

export const createProcessDocument = (input: CreateDocumentInput): ProcessDocument => {
  ensureSeeded(input.process_id, input.process_name);
  const doc: ProcessDocument = {
    id: uid(),
    process_id: input.process_id,
    target_type: input.target_type,
    target_id: input.target_id,
    target_label: input.target_label,
    document_type: input.document_type,
    file_id: uid(),
    file_name: input.file.name,
    file_size: input.file.size,
    mime_type: input.file.type || 'application/octet-stream',
    uploader_id: 'user-current',
    uploader_name: '当前用户',
    uploaded_at: new Date().toISOString(),
    remark: input.remark,
  };
  const list = documentStore.get(input.process_id) || [];
  documentStore.set(input.process_id, [doc, ...list]);
  return doc;
};

export const deleteProcessDocument = (processId: string, documentId: string): void => {
  const list = documentStore.get(processId) || [];
  documentStore.set(
    processId,
    list.filter((d) => d.id !== documentId),
  );
};
