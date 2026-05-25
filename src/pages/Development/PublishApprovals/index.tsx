/**
 * 发布审批列表页（FEAT-025 STORY-002）
 *
 * 展示流程版本的发布审批：待审批 / 已通过 / 已拒绝。
 * 当前用户可对待审批记录通过 / 拒绝。
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Typography, Table, Tag, Input, Button, Toast, Modal, Tabs, TabPane,
  Space, Form, Descriptions, Timeline,
} from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import {
  fetchPublishApprovals,
  approvePublishRequest,
  rejectPublishRequest,
  subscribeProcessVersionChange,
  type ProcessVersion,
  type VersionStatus,
} from '@/mocks/processVersionApproval';
import './index.less';

const { Title, Text } = Typography;

const STATUS_TAG: Record<VersionStatus, { color: 'blue' | 'green' | 'red' | 'grey'; text: string }> = {
  UPLOADED: { color: 'grey', text: '待发布' },
  PENDING_APPROVAL: { color: 'blue', text: '待审批' },
  PUBLISHED: { color: 'green', text: '已通过' },
  REJECTED: { color: 'red', text: '已拒绝' },
};

const fmtTime = (iso?: string) => iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-';
const fmtSize = (b: number) => b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;

const PublishApprovalsPage = () => {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<VersionStatus | 'ALL'>('PENDING_APPROVAL');
  const [list, setList] = useState<ProcessVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ProcessVersion | null>(null);
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setList(await fetchPublishApprovals({ keyword, status }));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [keyword, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeProcessVersionChange(() => load(true)), [load]);

  const handleApprove = async (v: ProcessVersion) => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${v.process_name} v${v.version}」的发布申请？`,
      okText: '通过',
      onOk: async () => {
        try {
          setActingId(v.id);
          await approvePublishRequest(v.id);
          Toast.success('已通过');
          setDetail(null);
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setActingId(null);
        }
      },
    });
  };

  const openReject = (v: ProcessVersion) => {
    setDetail(v);
    setRejectReason('');
    setRejectVisible(true);
  };
  const submitReject = async () => {
    if (!detail) return;
    try {
      setActingId(detail.id);
      await rejectPublishRequest(detail.id, rejectReason.trim());
      Toast.success('已拒绝');
      setRejectVisible(false);
      setDetail(null);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const columns = useMemo(() => [
    { title: '流程名称', dataIndex: 'process_name', ellipsis: true, render: (v: string, r: ProcessVersion) => (
      <Space spacing={8}>
        <Text strong>{v}</Text>
        <Tag size="small" color="grey" type="light">v{r.version}</Tag>
      </Space>
    ) },
    { title: '开发者', dataIndex: 'developer_name', width: 120 },
    { title: '所属部门', dataIndex: 'department_name', width: 160 },
    { title: '提交时间', dataIndex: 'submitted_at', width: 180, render: (v?: string) => fmtTime(v) },
    { title: '审批进度', dataIndex: 'current_level', width: 120, render: (_: unknown, r: ProcessVersion) =>
      r.status === 'PENDING_APPROVAL' && r.total_levels ? (
        <Text size="small" type="tertiary">第 {r.current_level} / {r.total_levels} 级</Text>
      ) : '-' },
    { title: '状态', dataIndex: 'status', width: 100, render: (s: VersionStatus) => (
      <Tag color={STATUS_TAG[s].color} type="light" size="small">{STATUS_TAG[s].text}</Tag>
    ) },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: unknown, r: ProcessVersion) => (
        <Space spacing={4}>
          <Button size="small" theme="borderless" type="tertiary" icon={<Eye size={14} />}
            onClick={(e) => { e.stopPropagation(); setDetail(r); }}>详情</Button>
          {r.status === 'PENDING_APPROVAL' && (
            <>
              <Button size="small" theme="borderless" type="primary" icon={<CheckCircle size={14} />}
                loading={actingId === r.id} onClick={(e) => { e.stopPropagation(); handleApprove(r); }}>通过</Button>
              <Button size="small" theme="borderless" type="danger" icon={<XCircle size={14} />}
                onClick={(e) => { e.stopPropagation(); openReject(r); }}>拒绝</Button>
            </>
          )}
        </Space>
      ),
    },
  ], [actingId]);

  return (
    <div className="publish-approvals-page">
      <div className="publish-approvals-header">
        <Title heading={3} className="title">发布审批</Title>
        <Text type="tertiary">查看和审批流程版本的发布申请。</Text>
      </div>

      <div className="publish-approvals-toolbar">
        <Tabs type="line" activeKey={status} onChange={(k) => setStatus(k as VersionStatus | 'ALL')}>
          <TabPane tab="待审批" itemKey="PENDING_APPROVAL" />
          <TabPane tab="已通过" itemKey="PUBLISHED" />
          <TabPane tab="已拒绝" itemKey="REJECTED" />
          <TabPane tab="全部" itemKey="ALL" />
        </Tabs>
        <Input
          prefix={<IconSearchStroked />}
          placeholder="搜索流程名称 / 开发者 / 版本号"
          value={keyword}
          onChange={setKeyword}
          showClear
          style={{ width: 320 }}
        />
      </div>

      <div className="publish-approvals-content">
        {!loading && list.length === 0 ? (
          <EmptyState variant="noData" description="暂无审批记录" />
        ) : (
          <Table
            size="small"
            dataSource={list}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            onRow={(record) => ({ onClick: () => record && setDetail(record) })}
          />
        )}
      </div>

      {/* 详情弹窗 */}
      <Modal
        title={detail ? `${detail.process_name} v${detail.version}` : ''}
        visible={!!detail && !rejectVisible}
        onCancel={() => setDetail(null)}
        width={720}
        footer={
          detail?.status === 'PENDING_APPROVAL' ? (
            <Space>
              <Button onClick={() => setDetail(null)}>关闭</Button>
              <Button type="danger" theme="light" icon={<XCircle size={14} />} onClick={() => detail && openReject(detail)}>拒绝</Button>
              <Button type="primary" theme="solid" icon={<CheckCircle size={14} />} onClick={() => detail && handleApprove(detail)}>通过</Button>
            </Space>
          ) : (
            <Button onClick={() => setDetail(null)}>关闭</Button>
          )
        }
      >
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Descriptions
              data={[
                { key: '版本号', value: `v${detail.version}` },
                { key: '状态', value: <Tag color={STATUS_TAG[detail.status].color} type="light" size="small">{STATUS_TAG[detail.status].text}</Tag> },
                { key: '开发者', value: detail.developer_name },
                { key: '所属部门', value: detail.department_name },
                { key: '包大小', value: fmtSize(detail.package_size) },
                { key: '校验和', value: <Text size="small" type="tertiary">{detail.package_checksum}</Text> },
                { key: '上传时间', value: fmtTime(detail.uploaded_at) },
                { key: '提交时间', value: fmtTime(detail.submitted_at) },
                ...(detail.deployed_at ? [{ key: '上线时间', value: fmtTime(detail.deployed_at) }] : []),
                ...(detail.publish_note ? [{ key: '发布说明', value: detail.publish_note }] : []),
              ]}
              row
            />

            {detail.approval_template_snapshot && (
              <div>
                <Text strong>审批流：{detail.approval_template_snapshot.name}</Text>
                {detail.status === 'PENDING_APPROVAL' && detail.total_levels && (
                  <Text type="tertiary" style={{ marginLeft: 8 }}>
                    当前第 {detail.current_level} / {detail.total_levels} 级
                  </Text>
                )}
              </div>
            )}

            {detail.records && detail.records.length > 0 && (
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>审批历史</Text>
                <Timeline>
                  {detail.records.map((r, idx) => (
                    <Timeline.Item key={idx} type={r.action === 'approve' ? 'success' : 'error'} time={fmtTime(r.acted_at)}>
                      <Space>
                        <Text strong>{r.approver_name}</Text>
                        <Tag color={r.action === 'approve' ? 'green' : 'red'} type="light" size="small">
                          {r.action === 'approve' ? '通过' : '拒绝'}（第 {r.level} 级）
                        </Tag>
                      </Space>
                      {r.comment && <div><Text type="tertiary" size="small">{r.comment}</Text></div>}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}

            {detail.input_parameters && detail.input_parameters.length > 0 && (
              <div>
                <Text strong style={{ marginBottom: 8, display: 'block' }}>输入参数</Text>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={detail.input_parameters}
                  rowKey="name"
                  columns={[
                    { title: '名称', dataIndex: 'name', width: 160 },
                    { title: '类型', dataIndex: 'type', width: 100 },
                    { title: '必填', dataIndex: 'required', width: 80, render: (v: boolean) => v ? '是' : '否' },
                    { title: '说明', dataIndex: 'description' },
                  ]}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 拒绝原因 */}
      <Modal
        title="拒绝发布申请"
        visible={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        onOk={submitReject}
        okText="确认拒绝"
        okButtonProps={{ type: 'danger', loading: !!actingId }}
        width={520}
      >
        <Form layout="vertical">
          <Form.TextArea
            field="reason"
            label="拒绝原因"
            placeholder="请填写拒绝原因（最多 500 字）"
            value={rejectReason}
            onChange={setRejectReason}
            maxCount={500}
            autosize={{ minRows: 4, maxRows: 8 }}
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default PublishApprovalsPage;
