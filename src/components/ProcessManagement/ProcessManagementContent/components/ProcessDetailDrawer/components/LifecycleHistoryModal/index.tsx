import { useMemo } from 'react';
import { Modal, Table, Typography, Tag } from '@douyinfe/semi-ui';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import {
  FIELD_LABEL,
  getLifecycleAdjustments,
  type LifecycleAdjustment,
  type LifecycleField,
} from '@/mocks/processLifecycleLedger';

const { Text } = Typography;

interface Props {
  visible: boolean;
  processId: string;
  onClose: () => void;
}

const formatDateTime = (v: string | null) => {
  if (!v) return '-';
  return v.replace('T', ' ').substring(0, 16);
};

const LifecycleHistoryModal = ({ visible, processId, onClose }: Props) => {
  const data = useMemo<LifecycleAdjustment[]>(
    () => (visible ? getLifecycleAdjustments(processId) : []),
    [visible, processId],
  );

  const columns = [
    {
      title: '字段',
      dataIndex: 'field',
      width: 120,
      render: (f: LifecycleField) => FIELD_LABEL[f],
    },
    {
      title: '修正前',
      dataIndex: 'previous_effective_at',
      width: 140,
      render: (v: string | null) => <Text>{formatDateTime(v)}</Text>,
    },
    {
      title: '修正后',
      dataIndex: 'new_effective_at',
      width: 140,
      render: (v: string) => <Text>{formatDateTime(v)}</Text>,
    },
    {
      title: '原始事件',
      dataIndex: 'original_event_at',
      width: 140,
      render: (v: string | null) => <Text type="tertiary">{formatDateTime(v)}</Text>,
    },
    {
      title: '原因',
      dataIndex: 'reason',
      ellipsis: { showTooltip: true },
      render: (v: string, r: LifecycleAdjustment) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {r.backfill && <Tag size="small" color="orange" type="light">补录</Tag>}
          <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: 200 }}>{v}</Text>
        </span>
      ),
    },
    {
      title: '修正人',
      dataIndex: 'actor_name',
      width: 120,
      render: (_: string, r: LifecycleAdjustment) => (
        <UserNameWithCard name={r.actor_name} userId={r.actor_id} />
      ),
    },
    {
      title: '修正时间',
      dataIndex: 'at',
      width: 150,
      render: (v: string) => <Text type="tertiary">{formatDateTime(v)}</Text>,
    },
  ];

  return (
    <Modal
      title="生命周期修正历史"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={840}
      centered
    >
      <Table
        size="small"
        columns={columns as any}
        dataSource={data}
        rowKey="id"
        pagination={false}
        empty="暂无修正记录"
      />
    </Modal>
  );
};

export default LifecycleHistoryModal;
