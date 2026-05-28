/**
 * 审批流配置 — 详情抽屉（FEAT-017 STORY-016）
 *
 * 参考 SchemeDetailDrawer，使用两个 Tab：
 *   1. 基本信息：name/code/description/status/适用部门/创建时间 等元信息
 *   2. 审批流配置：只读复用 ApproverListEditor 展示审批级配置
 *
 * 预设模板：提供「基于此模板创建」操作；自定义模板：编辑、启用（如未启用）、删除。
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tabs, TabPane, Typography, Tag, Button, Tooltip, Empty } from '@douyinfe/semi-ui';
import { Pencil, CheckCircle, Trash2, Copy, Building2 } from 'lucide-react';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import { getDepartmentName } from '@/mocks/departmentData';
import { listDepartmentsByTemplate } from '@/mocks/departmentApprovalFlowBinding';
import ApproverListEditor from '../ApproverListEditor';
import type { ApprovalFlowTemplate, ApprovalBusinessType } from '../../mockData';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  flow: ApprovalFlowTemplate | null;
  flows: ApprovalFlowTemplate[];
  businessType: ApprovalBusinessType;
  onClose: () => void;
  onNavigate: (f: ApprovalFlowTemplate) => void;
  onEdit: (f: ApprovalFlowTemplate) => void;
  onActivate: (f: ApprovalFlowTemplate) => void;
  onDelete: (f: ApprovalFlowTemplate) => void;
  onClone: (f: ApprovalFlowTemplate) => void;
}

const formatDate = (s?: string) => {
  if (!s) return '-';
  try {
    return new Date(s).toLocaleString('zh-CN', { hour12: false });
  } catch {
    return s;
  }
};

const ApprovalFlowDetailDrawer = ({
  visible,
  flow,
  flows,
  businessType,
  onClose,
  onNavigate,
  onEdit,
  onActivate,
  onDelete,
  onClone,
}: Props) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('basic');
  const lastVisible = useRef(visible);

  useEffect(() => {
    if (visible && !lastVisible.current) setActiveTab('basic');
    lastVisible.current = visible;
  }, [visible]);

  // 适用部门：优先模板字段，否则回查绑定表
  const applicableDeptIds = useMemo(() => {
    if (!flow) return [] as string[];
    const fromField = flow.applicable_department_ids ?? [];
    if (fromField.length > 0) return fromField;
    return listDepartmentsByTemplate(flow.id, businessType);
  }, [flow, businessType]);

  const extraActions = useMemo(() => {
    if (!flow) return null;
    if (flow.is_preset) {
      return (
        <Tooltip content="基于此模板创建" position="bottom">
          <Button
            icon={<Copy size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onClone(flow)}
          />
        </Tooltip>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Tooltip content={t('common.edit')} position="bottom">
          <Button
            icon={<Pencil size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onEdit(flow)}
          />
        </Tooltip>
        {flow.status !== 'active' && (
          <Tooltip content="启用" position="bottom">
            <Button
              icon={<CheckCircle size={16} strokeWidth={2} />}
              theme="borderless"
              type="tertiary"
              size="small"
              onClick={() => onActivate(flow)}
            />
          </Tooltip>
        )}
      </span>
    );
  }, [flow, onClone, onEdit, onActivate, t]);

  const deleteAction = useMemo(() => {
    if (!flow || flow.is_preset) return null;
    return (
      <Button
        icon={<Trash2 size={16} strokeWidth={2} />}
        theme="borderless"
        type="danger"
        size="small"
        onClick={() => onDelete(flow)}
      />
    );
  }, [flow, onDelete]);

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {flow?.name}
          {flow?.status === 'active' && !flow?.is_preset && (
            <Tag color="green" type="solid" size="small">已启用</Tag>
          )}
          {flow?.is_preset && <Tag color="blue" type="light" size="small">预设</Tag>}
        </span>
      }
      defaultWidth={900}
      minWidth={720}
      storageKey="approvalFlowDetailDrawerWidth"
      dataList={flows}
      currentId={flow?.id}
      onNavigate={onNavigate}
      extraActions={extraActions}
      deleteAction={deleteAction}
      className="approval-flow-detail-drawer"
    >
      {flow && (
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="line" style={{ height: '100%' }}>
          <TabPane tab="基本信息" itemKey="basic">
            <div className="approval-flow-detail-drawer-content">
              <div className="approval-flow-detail-drawer-meta-grid">
                <Text className="label">名称</Text>
                <Text>{flow.name}</Text>
                <Text className="label">编码</Text>
                <Text>{flow.code}</Text>
                <Text className="label">状态</Text>
                <Text>
                  {flow.is_preset
                    ? '预设模板（不可启用）'
                    : flow.status === 'active'
                    ? '已启用'
                    : '未启用'}
                </Text>
                <Text className="label">描述</Text>
                <Text>{flow.description || '-'}</Text>
                <Text className="label">适用部门</Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {applicableDeptIds.length === 0 ? (
                    <Text type="tertiary">尚未配置适用部门</Text>
                  ) : (
                    applicableDeptIds.map((id) => (
                      <Tag
                        key={id}
                        color="violet"
                        type="light"
                        size="small"
                        prefixIcon={<Building2 size={12} strokeWidth={2} />}
                      >
                        {getDepartmentName(id)}
                      </Tag>
                    ))
                  )}
                </div>
                <Text className="label">审批级数</Text>
                <Text>{flow.approvers.length} 级</Text>
                <Text className="label">{t('common.createdAt')}</Text>
                <Text>{formatDate(flow.created_at)}</Text>
                <Text className="label">{t('common.updatedAt') || '更新时间'}</Text>
                <Text>{formatDate(flow.updated_at)}</Text>
              </div>
            </div>
          </TabPane>

          <TabPane tab={`审批流配置 (${flow.approvers.length})`} itemKey="approvers">
            <div className="approval-flow-detail-drawer-content">
              {flow.approvers.length === 0 ? (
                <Empty description="暂无审批级配置" />
              ) : (
                <ApproverListEditor
                  title="审批人配置"
                  approvers={flow.approvers}
                  onChange={() => undefined}
                  emptyHint="暂无审批级"
                  defaultItemName="新审批级"
                  readOnly
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      )}
    </DetailDrawerWrapper>
  );
};

export default ApprovalFlowDetailDrawer;
