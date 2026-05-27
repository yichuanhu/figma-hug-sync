import { useState, useMemo } from 'react';
import { Modal, Form, Button, Typography, Toast } from '@douyinfe/semi-ui';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import {
  adjustLifecycleMilestone,
  FIELD_LABEL,
  getProcessLifecycleLedger,
  type LifecycleField,
} from '@/mocks/processLifecycleLedger';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  processId: string;
  field: LifecycleField;
  onClose: () => void;
}

const formatDateTime = (v: string | null) => {
  if (!v) return '-';
  return v.replace('T', ' ').substring(0, 16);
};

const toIsoLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
};

const LifecycleAdjustModal = ({ visible, processId, field, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi | null>(null);

  const ledger = useMemo(
    () => (visible ? getProcessLifecycleLedger(processId) : null),
    [visible, processId],
  );
  const milestone = ledger?.[field];
  const deployedAt = ledger?.deployed_at.effective_at;

  const handleSubmit = async (values: Record<string, unknown>) => {
    const newDate = values.new_effective_at as Date | undefined;
    const reason = ((values.reason as string) || '').trim();
    const backfill = !!values.backfill;

    if (!newDate) {
      Toast.warning('请选择新时间');
      return;
    }
    if (!reason) {
      Toast.warning('请填写修正原因');
      return;
    }
    if (field === 'offline_at' && deployedAt) {
      const newIso = toIsoLocal(newDate);
      if (newIso < deployedAt && !backfill) {
        Toast.warning('下线时间不得早于部署上线时间，如确需补录请开启“历史补录”。');
        return;
      }
    }

    setLoading(true);
    try {
      adjustLifecycleMilestone(processId, field, {
        new_effective_at: toIsoLocal(newDate),
        reason,
        backfill,
      });
      Toast.success('修正成功');
      onClose();
    } catch (e) {
      Toast.error('修正失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`修正${FIELD_LABEL[field]}`}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      maskClosable={false}
      className="lifecycle-adjust-modal"
    >
      <Form
        labelPosition="top"
        onSubmit={handleSubmit}
        getFormApi={setFormApi}
        initValues={{
          new_effective_at: milestone?.effective_at ? new Date(milestone.effective_at) : undefined,
          reason: '',
          backfill: false,
        }}
      >
        <div className="lifecycle-adjust-modal-readonly">
          <div className="lifecycle-adjust-modal-readonly-row">
            <Text type="tertiary">原始事件值</Text>
            <Text>{formatDateTime(milestone?.original_event_at ?? null)}</Text>
          </div>
          <div className="lifecycle-adjust-modal-readonly-row">
            <Text type="tertiary">当前生效值</Text>
            <Text>{formatDateTime(milestone?.effective_at ?? null)}</Text>
          </div>
        </div>

        <Form.DatePicker
          field="new_effective_at"
          label="新时间"
          type="dateTime"
          format="yyyy-MM-dd HH:mm"
          style={{ width: '100%' }}
          rules={[{ required: true, message: '请选择新时间' }]}
          trigger={['blur', 'change']}
        />

        <Form.TextArea
          field="reason"
          label="修正原因"
          placeholder="请填写修正原因（必填）"
          maxCount={500}
          autosize={{ minRows: 3, maxRows: 6 }}
          rules={[
            { required: true, message: '请填写修正原因' },
            { max: 500, message: '最多 500 字符' },
          ]}
          trigger={['blur', 'change']}
        />

        {field === 'offline_at' && (
          <Form.Switch
            field="backfill"
            label="历史补录（新值早于部署上线时间时必须开启）"
          />
        )}

        <div className="lifecycle-adjust-modal-footer">
          <Button theme="light" onClick={onClose}>取消</Button>
          <Button htmlType="submit" theme="solid" type="primary" loading={loading}>
            保存
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default LifecycleAdjustModal;
