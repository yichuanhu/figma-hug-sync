import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Button,
  Input,
  Tag,
  Toast,
  Modal,
  Dropdown,
  Row,
  Col,
  Space,
  Table,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Ellipsis, CheckCircle, Pencil, Trash2, Plus, Pause } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchApprovalFlows,
  createApprovalFlow,
  updateApprovalFlow,
  deleteApprovalFlow,
  activateApprovalFlow,
  deactivateApprovalFlow,
  type ApprovalFlowTemplate,
} from './mockData';
import ApprovalFlowEditModal from './components/ApprovalFlowEditModal';
import './index.less';

const { Title, Text } = Typography;

const formatTime = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ApprovalConfigPage = () => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [flows, setFlows] = useState<ApprovalFlowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editing, setEditing] = useState<ApprovalFlowTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setFlows(await fetchApprovalFlows(keyword));
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setEditVisible(true);
  };
  const openEdit = (f: ApprovalFlowTemplate) => {
    setEditing(f);
    setEditVisible(true);
  };

  const handleSubmit = async (payload: Parameters<Parameters<typeof ApprovalFlowEditModal>[0]['onSubmit']>[0]) => {
    if (editing) {
      await updateApprovalFlow(editing.id, payload);
    } else {
      await createApprovalFlow(payload);
    }
    await load();
  };

  const handleActivate = (f: ApprovalFlowTemplate) => {
    Modal.confirm({
      title: '启用审批流',
      content: `确认将「${f.name}」设为当前生效的审批流？同一时间仅一个审批流处于启用状态。`,
      okText: '启用',
      cancelText: t('common.cancel'),
      onOk: async () => {
        await activateApprovalFlow(f.id);
        Toast.success('启用成功');
        load();
      },
    });
  };

  const handleDeactivate = async (f: ApprovalFlowTemplate) => {
    await deactivateApprovalFlow(f.id);
    Toast.success('已停用');
    load();
  };

  const handleDelete = (f: ApprovalFlowTemplate) => {
    Modal.confirm({
      title: '删除审批流',
      content: `确认删除「${f.name}」？此操作不可恢复。`,
      okText: t('common.delete'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          await deleteApprovalFlow(f.id);
          Toast.success(t('common.deleteSuccess'));
          load();
        } catch (e) {
          Toast.error((e as Error).message);
        }
      },
    });
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      width: 240,
      render: (_: unknown, r: ApprovalFlowTemplate) => (
        <Space>
          <Text strong ellipsis={{ showTooltip: true }} style={{ maxWidth: 180 }}>{r.name}</Text>
          {r.is_preset && <Tag color="blue" type="light" size="small">预设</Tag>}
        </Space>
      ),
    },
    { title: '编码', dataIndex: 'code', width: 140, render: (v: string) => <Text type="tertiary">{v}</Text> },
    {
      title: '描述',
      dataIndex: 'description',
      render: (v?: string) => (
        <Text type="secondary" ellipsis={{ showTooltip: true }} style={{ display: 'block' }}>
          {v || '-'}
        </Text>
      ),
    },
    {
      title: '审批节点',
      dataIndex: 'levels',
      width: 110,
      render: (levels: ApprovalFlowTemplate['levels']) => (
        <Tag color="grey" type="light" size="small">{levels.length} 级</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s: ApprovalFlowTemplate['status']) =>
        s === 'active' ? (
          <Tag color="green" type="solid" size="small">已启用</Tag>
        ) : (
          <Tag color="grey" type="light" size="small">未启用</Tag>
        ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      render: (v: string) => <Text type="tertiary" size="small">{formatTime(v)}</Text>,
    },
    {
      title: '操作',
      dataIndex: 'op',
      width: 80,
      render: (_: unknown, r: ApprovalFlowTemplate) => (
        <Dropdown
          trigger="click"
          clickToHide
          position="bottomRight"
          render={
            <Dropdown.Menu>
              <Dropdown.Item icon={<Pencil size={14} />} onClick={() => openEdit(r)}>编辑</Dropdown.Item>
              {r.status !== 'active' ? (
                <Dropdown.Item icon={<CheckCircle size={14} />} onClick={() => handleActivate(r)}>启用</Dropdown.Item>
              ) : (
                <Dropdown.Item icon={<Pause size={14} />} onClick={() => handleDeactivate(r)}>停用</Dropdown.Item>
              )}
              {!r.is_preset && (
                <Dropdown.Item icon={<Trash2 size={14} />} type="danger" onClick={() => handleDelete(r)}>
                  {t('common.delete')}
                </Dropdown.Item>
              )}
            </Dropdown.Menu>
          }
        >
          <Button icon={<Ellipsis size={16} />} theme="borderless" size="small" />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="approval-config-page">
      <div className="approval-config-page-header">
        <div className="approval-config-page-header-title">
          <Title heading={3} className="title">审批配置</Title>
          <Text type="tertiary">集中管理需求审批流模板，与具体的需求模版解耦，支持创建、编辑、启用与停用。</Text>
        </div>
        <Row type="flex" justify="space-between" align="middle" className="approval-config-page-header-toolbar">
          <Col>
            <Input
              prefix={<IconSearchStroked />}
              placeholder="搜索名称 / 编码 / 描述"
              className="approval-config-page-search-input"
              value={keyword}
              onChange={setKeyword}
              showClear
              maxLength={100}
            />
          </Col>
          <Col>
            <Button icon={<Plus size={16} strokeWidth={2} />} theme="solid" type="primary" onClick={openCreate}>
              新建审批流
            </Button>
          </Col>
        </Row>
      </div>

      <div className="approval-config-page-content">
        {!loading && flows.length === 0 ? (
          <EmptyState variant="noData" description="暂无审批流，点击右上角新建" />
        ) : (
          <Table
            size="small"
            dataSource={flows}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
        )}
      </div>

      <ApprovalFlowEditModal
        visible={editVisible}
        flow={editing}
        onClose={() => setEditVisible(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ApprovalConfigPage;
