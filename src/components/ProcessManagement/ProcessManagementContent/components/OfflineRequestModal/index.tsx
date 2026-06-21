/**
 * 流程停用申请 Modal（FEAT-027 STORY-002）
 * - 展示依赖检查快照；阻塞依赖时禁用提交
 * - 必填停用原因（10–1000 字）
 * - 提交时若部门未配置审批模板则直接执行下线
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Form, Toast, Tag, Typography, Spin, Button, Space } from '@douyinfe/semi-ui';
import {
  buildDependencySnapshot,
  checkOfflineDependency,
  getCurrentOfflineRequest,
  submitOfflineRequest,
  type DependencyCheckSnapshot,
} from '@/mocks/processOfflineApproval';

const { Text } = Typography;

interface OfflineRequestModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
  process: {
    id: string;
    name: string;
    department_id: string;
    department_name: string;
  } | null;
}

const DependencyView = ({ snapshot }: { snapshot: DependencyCheckSnapshot | null }) => {
  if (!snapshot) return <Spin />;
  const { triggers, task_templates, running_tasks, scheduling_refs } = snapshot;
  const empty = triggers.length + task_templates.length + running_tasks.length + scheduling_refs.length === 0;
  if (empty) return <Tag color="green" type="light" size="small">依赖检查通过</Tag>;

  const groups: { title: string; items: { id: string; label: string }[] }[] = [];
  if (triggers.length) groups.push({ title: '启用中的触发器', items: triggers.map((t) => ({ id: t.id, label: `${t.name}（${t.type}）` })) });
  if (task_templates.length) groups.push({ title: '引用此流程的任务模板', items: task_templates.map((t) => ({ id: t.id, label: t.name })) });
  if (running_tasks.length) groups.push({ title: '运行中/排队中任务', items: running_tasks.map((t) => ({ id: t.id, label: `${t.name}（${t.status}）` })) });
  if (scheduling_refs.length) groups.push({ title: '调度中心其他引用', items: scheduling_refs.map((t) => ({ id: t.id, label: t.name })) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {snapshot.blocking && (
        <Tag color="red" type="light" size="small">存在阻塞依赖，无法停用</Tag>
      )}
      {groups.map((g) => (
        <div key={g.title} style={{ border: '1px solid var(--semi-color-border)', borderRadius: 6, padding: '8px 12px' }}>
          <Text strong size="small">{g.title}</Text>
          <ul style={{ margin: '4px 0 0 16px' }}>
            {g.items.map((it) => <li key={it.id}><Text size="small">{it.label}</Text></li>)}
          </ul>
        </div>
      ))}
    </div>
  );
};

const OfflineRequestModal = ({ visible, onCancel, onSuccess, process }: OfflineRequestModalProps) => {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<DependencyCheckSnapshot | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const existing = process ? getCurrentOfflineRequest(process.id) : undefined;

  useEffect(() => {
    if (!visible || !process) return;
    setSnapshot(null);
    setReason('');
    if (existing) {
      // 已有未结束申请，不再做依赖扫描
      setSnapshot(buildDependencySnapshot(process.id, process.name));
      return;
    }
    checkOfflineDependency(process.id, process.name).then(setSnapshot);
  }, [visible, process, existing]);

  const handleSubmit = async () => {
    if (!process) return;
    if (snapshot?.blocking) {
      Toast.warning('存在阻塞依赖，无法提交停用申请');
      return;
    }
    const r = reason.trim();
    if (r.length < 10) { Toast.warning('停用原因至少 10 字'); return; }
    if (r.length > 1000) { Toast.warning('停用原因最多 1000 字'); return; }

    try {
      setSubmitting(true);
      const res = await submitOfflineRequest({
        processId: process.id,
        processName: process.name,
        departmentId: process.department_id,
        departmentName: process.department_name,
        reason: r,
      });
      if (res.needs_approval) {
        Toast.success('已提交，等待审批');
      } else {
        Toast.success('未配置审批流，已直接下线');
      }
      onSuccess?.();
      onCancel();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (existing) {
    return (
      <Modal
        title={`申请停用：${process?.name ?? ''}`}
        visible={visible}
        onCancel={onCancel}
        width={520}
        footer={
          <Space>
            <Button onClick={onCancel}>关闭</Button>
            <Button type="primary" theme="solid" onClick={() => { onCancel(); navigate(`/dev-center/offline-requests/${existing.id}`); }}>查看申请</Button>
          </Space>
        }
      >
        <Text>该流程已存在未结束的停用申请（状态：{existing.status}），不能重复提交。</Text>
      </Modal>
    );
  }

  const blocked = !!snapshot?.blocking;

  return (
    <Modal
      title={`申请停用：${process?.name ?? ''}`}
      visible={visible}
      onCancel={onCancel}
      width={520}
      onOk={handleSubmit}
      okText="提交申请"
      okButtonProps={{ disabled: blocked || !snapshot, loading: submitting }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Text type="tertiary" size="small">所属部门：{process?.department_name || '-'}</Text>
        </div>
        <div>
          <Text strong style={{ marginBottom: 6, display: 'block' }}>依赖检查</Text>
          <DependencyView snapshot={snapshot} />
        </div>
        <Form layout="vertical">
          <Form.TextArea
            field="reason"
            label="停用原因"
            placeholder="请说明停用原因（10–1000 字）"
            initValue={reason}
            onChange={(v) => setReason(v as string)}
            maxCount={1000}
            autosize={{ minRows: 4, maxRows: 8 }}
            rules={[{ required: true, message: '请填写停用原因' }]}
          />
        </Form>
      </div>
    </Modal>
  );
};

export default OfflineRequestModal;
