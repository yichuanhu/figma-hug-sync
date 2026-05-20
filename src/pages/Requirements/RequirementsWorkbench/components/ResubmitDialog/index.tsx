/**
 * 重新提交弹窗（STORY-006 / 007 / 014）
 *
 * - 520px Modal
 * - 必填「变更说明」（≥10 字），实时计数；按钮在不满足时禁用
 * - 调用方负责实际 resubmitRequirement(id, reason) 调用
 */
import { useEffect, useState } from 'react';
import { Modal, TextArea, Typography } from '@douyinfe/semi-ui';

const { Text } = Typography;
const MIN_LEN = 10;
const MAX_LEN = 2000;

interface ResubmitDialogProps {
  visible: boolean;
  requirementTitle?: string;
  /** 文案区分：true=「重新提交审批」 false=「重新提交（无审批，直接进入下一阶段）」 */
  needsApproval: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (changeReason: string) => Promise<void> | void;
}

const ResubmitDialog = ({
  visible,
  requirementTitle,
  needsApproval,
  loading,
  onCancel,
  onConfirm,
}: ResubmitDialogProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => { if (visible) setReason(''); }, [visible]);

  const trimmed = reason.trim();
  const valid = trimmed.length >= MIN_LEN;

  return (
    <Modal
      title={needsApproval ? '重新提交审批' : '重新提交需求'}
      visible={visible}
      onCancel={onCancel}
      onOk={() => valid && onConfirm(trimmed)}
      okText="提交"
      cancelText="取消"
      width={520}
      okButtonProps={{ disabled: !valid, loading }}
      maskClosable={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {requirementTitle && (
          <Text type="secondary" size="small">
            需求：<Text strong>{requirementTitle}</Text>
          </Text>
        )}
        <Text type="secondary" size="small">
          {needsApproval
            ? '请填写「变更说明」，说明本次重新提交相对于上一轮的修改点。重新提交将开启新一轮审批，旧轮次记录会被折叠保留。'
            : '该部门未配置审批/评估，重新提交后将直接进入「待开发」。仍需填写变更说明以便后续追溯。'}
        </Text>
        <div>
          <Text size="small" style={{ marginBottom: 4, display: 'block' }}>
            变更说明 <Text type="danger">*</Text>
            <Text type="tertiary" size="small" style={{ marginLeft: 6 }}>
              （至少 {MIN_LEN} 字 · 当前 {trimmed.length}/{MAX_LEN}）
            </Text>
          </Text>
          <TextArea
            value={reason}
            onChange={setReason}
            rows={5}
            maxLength={MAX_LEN}
            placeholder={`请描述本次相对于上一轮的修改点（至少 ${MIN_LEN} 字）…`}
            autoFocus
            showClear
          />
        </div>
      </div>
    </Modal>
  );
};

export default ResubmitDialog;
