/**
 * 流程下线 — 申请人创建申请弹窗（FEAT-027 issue-002）
 *
 * 强制单选：仅允许选择 1 个 PUBLISHED 状态、且在用户权限范围内的流程。
 * 选择流程后立即触发：
 *  1. 当前申请检查（重复活跃申请引导）
 *  2. 依赖检查（阻塞分组展示，阻塞时禁用提交）
 * 原因必填，10–1000 字符；提交成功后回调通知列表刷新并定位详情。
 */
import { useEffect, useMemo, useState } from 'react';
import { Modal, Form, Select, Toast, Spin, Tag, Typography, Button, Space } from '@douyinfe/semi-ui';
import { AlertTriangle } from 'lucide-react';
import {
  checkOfflineDependency,
  getCurrentOfflineRequest,
  submitOfflineRequest,
  type DependencyCheckSnapshot,
  type ProcessOfflineRequest,
} from '@/mocks/processOfflineApproval';
import {
  fetchPublishedProcessOptions,
  getPublishedProcessById,
  type PublishedProcessOption,
} from '../../availableProcesses';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: (newRequest: ProcessOfflineRequest) => void;
  onJumpExisting?: (existing: ProcessOfflineRequest) => void;
}

const CreateOfflineRequestModal = ({ visible, onCancel, onSuccess, onJumpExisting }: Props) => {
  const [options, setOptions] = useState<PublishedProcessOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [snapshot, setSnapshot] = useState<DependencyCheckSnapshot | null>(null);
  const [checking, setChecking] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 重置
  useEffect(() => {
    if (!visible) return;
    setSelectedId(undefined);
    setSnapshot(null);
    setReason('');
    setLoadingOptions(true);
    fetchPublishedProcessOptions().then((list) => {
      setOptions(list);
    }).finally(() => setLoadingOptions(false));
  }, [visible]);

  const selected = selectedId ? getPublishedProcessById(selectedId) : undefined;
  const existing = selectedId ? getCurrentOfflineRequest(selectedId) : undefined;

  // 选择流程后触发依赖检查
  useEffect(() => {
    if (!selected || existing) {
      setSnapshot(null);
      return;
    }
    setChecking(true);
    setSnapshot(null);
    checkOfflineDependency(selected.id, selected.name)
      .then(setSnapshot)
      .finally(() => setChecking(false));
  }, [selected, existing]);

  const reasonLen = reason.trim().length;
  const reasonValid = reasonLen >= 10 && reasonLen <= 1000;
  const blocked = !!snapshot?.blocking;

  const submitDisabled = useMemo(() => {
    if (!selected || existing) return true;
    if (checking || !snapshot) return true;
    if (blocked) return true;
    if (!reasonValid) return true;
    return false;
  }, [selected, existing, checking, snapshot, blocked, reasonValid]);

  const handleSubmit = async () => {
    if (!selected) return;
    try {
      setSubmitting(true);
      const res = await submitOfflineRequest({
        processId: selected.id,
        processName: selected.name,
        departmentId: selected.department_id,
        departmentName: selected.department_name,
        reason: reason.trim(),
      });
      if (res.needs_approval) {
        Toast.success('已提交，等待审批');
      } else {
        Toast.success('未配置审批流，已直接下线');
      }
      onSuccess?.(res.request);
      onCancel();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderDependency = () => {
    if (!selected) return null;
    if (existing) return null;
    if (checking || !snapshot) {
      return (
        <div style={{ padding: '8px 0' }}>
          <Spin size="small" /> <Text type="tertiary" size="small" style={{ marginLeft: 8 }}>正在检查依赖…</Text>
        </div>
      );
    }
    const { triggers, task_templates, running_tasks, scheduling_refs, blocking } = snapshot;
    const empty = triggers.length + task_templates.length + running_tasks.length + scheduling_refs.length === 0;
    if (empty) return <Tag color="green" type="light" size="small">依赖检查通过</Tag>;
    return (
      <div>
        {blocking && (
          <div className="create-offline-request-modal-blocker-banner">
            <AlertTriangle size={16} strokeWidth={2} />
            <span>存在阻塞依赖，请先处理以下项后再提交申请</span>
          </div>
        )}
        {triggers.length > 0 && (
          <div className="create-offline-request-modal-dependency-group">
            <Text strong size="small">启用中的触发器</Text>
            <ul>{triggers.map((t) => <li key={t.id}><Text size="small">{t.name}（{t.type}）</Text></li>)}</ul>
          </div>
        )}
        {task_templates.length > 0 && (
          <div className="create-offline-request-modal-dependency-group">
            <Text strong size="small">引用此流程的任务模板</Text>
            <ul>{task_templates.map((t) => <li key={t.id}><Text size="small">{t.name}</Text></li>)}</ul>
          </div>
        )}
        {running_tasks.length > 0 && (
          <div className="create-offline-request-modal-dependency-group">
            <Text strong size="small">运行中/排队中任务</Text>
            <ul>{running_tasks.map((t) => <li key={t.id}><Text size="small">{t.name}（{t.status}）</Text></li>)}</ul>
          </div>
        )}
        {scheduling_refs.length > 0 && (
          <div className="create-offline-request-modal-dependency-group">
            <Text strong size="small">调度中心其他引用</Text>
            <ul>{scheduling_refs.map((t) => <li key={t.id}><Text size="small">{t.name}</Text></li>)}</ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      title="发起下线申请"
      visible={visible}
      onCancel={onCancel}
      width={560}
      maskClosable={false}
      footer={
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button
            theme="solid"
            type="primary"
            loading={submitting}
            disabled={submitDisabled}
            onClick={handleSubmit}
          >
            提交申请
          </Button>
        </Space>
      }
    >
      <div className="create-offline-request-modal-body">
        <Form layout="vertical">
          <Form.Slot label="目标流程" required>
            <Select
              style={{ width: '100%' }}
              placeholder="请选择需要下线的流程（仅展示已发布且在权限范围内的流程）"
              value={selectedId}
              onChange={(v) => setSelectedId(v as string)}
              loading={loadingOptions}
              filter
              showClear
            >
              {options.map((opt) => (
                <Select.Option key={opt.id} value={opt.id}>
                  <Space>
                    <span>{opt.name}</span>
                    <Text type="tertiary" size="small">{opt.current_version}</Text>
                    <Text type="tertiary" size="small">· {opt.department_name}</Text>
                  </Space>
                </Select.Option>
              ))}
            </Select>
            <Text type="tertiary" size="small" style={{ marginTop: 4, display: 'block' }}>
              每次仅可选择 1 个流程，不支持批量下线申请
            </Text>
          </Form.Slot>

          {selected && existing && (
            <div className="create-offline-request-modal-existing-tip">
              <span>该流程已有进行中的下线申请（{existing.status}），不能重复提交</span>
              <Button
                size="small"
                theme="solid"
                type="primary"
                onClick={() => {
                  onCancel();
                  onJumpExisting?.(existing);
                }}
              >
                查看现有申请
              </Button>
            </div>
          )}

          {selected && !existing && (
            <Form.Slot label="依赖检查">
              {renderDependency()}
            </Form.Slot>
          )}

          <Form.Slot
            label="下线原因"
            required
            error={selected && !existing && reason && !reasonValid ? '下线原因需 10–1000 字符' : undefined}
          >
            <Form.TextArea
              field="reason"
              noLabel
              placeholder="请说明下线原因（10–1000 字符）"
              initValue={reason}
              onChange={(v) => setReason(v as string)}
              maxCount={1000}
              autosize={{ minRows: 4, maxRows: 8 }}
              disabled={!selected || !!existing}
            />
          </Form.Slot>
        </Form>
      </div>
    </Modal>
  );
};

export default CreateOfflineRequestModal;
