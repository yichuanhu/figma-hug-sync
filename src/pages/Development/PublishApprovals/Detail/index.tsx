/**
 * 发布审批详情页（FEAT-025 STORY-002 - 详情页化）
 *
 * 参考共享中心审批详情页（src/pages/SharingCenter/Approvals/Detail）实现。
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography, Button, Space, Card, Toast, Tag, Modal, Form, Table, Timeline, Empty,
} from '@douyinfe/semi-ui';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import {
  approvePublishRequest,
  rejectPublishRequest,
  getProcessVersionById,
  subscribeProcessVersionChange,
  type ProcessVersion,
  type VersionStatus,
} from '@/mocks/processVersionApproval';
import './index.less';

const { Title, Text, Paragraph } = Typography;

const STATUS_TAG: Record<VersionStatus, { color: 'blue' | 'green' | 'red' | 'grey'; text: string }> = {
  UPLOADED: { color: 'grey', text: '待发布' },
  PENDING_APPROVAL: { color: 'blue', text: '待审批' },
  PUBLISHED: { color: 'green', text: '已通过' },
  REJECTED: { color: 'red', text: '已拒绝' },
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');
const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);

const PublishApprovalDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<ProcessVersion | undefined>(() => (id ? getProcessVersionById(id) : undefined));
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => subscribeProcessVersionChange(() => setDetail(id ? getProcessVersionById(id) : undefined)), [id]);

  if (!detail) {
    return (
      <div className="publish-approval-detail-page">
        <div className="detail-header">
          <Button theme="borderless" type="tertiary" icon={<ChevronLeft size={16} />} onClick={() => navigate(-1)}>返回</Button>
        </div>
        <Empty title="未找到该审批记录" />
      </div>
    );
  }

  const handleApprove = () => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${detail.process_name} v${detail.version}」的发布申请？`,
      okText: '通过',
      onOk: async () => {
        try {
          setActing(true);
          await approvePublishRequest(detail.id);
          Toast.success('已通过');
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setActing(false);
        }
      },
    });
  };

  const submitReject = async () => {
    try {
      setActing(true);
      await rejectPublishRequest(detail.id, rejectReason.trim());
      Toast.success('已拒绝');
      setRejectVisible(false);
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const isPending = detail.status === 'PENDING_APPROVAL';

  return (
    <div className="publish-approval-detail-page">
      <div className="detail-header">
        <Button theme="borderless" type="tertiary" icon={<ChevronLeft size={16} />} onClick={() => navigate(-1)}>返回</Button>
        <Title heading={3} className="title">{detail.process_name}</Title>
        <Space spacing={8}>
          <Tag color="grey" type="light">v{detail.version}</Tag>
          <Tag color={STATUS_TAG[detail.status].color} type="light">{STATUS_TAG[detail.status].text}</Tag>
        </Space>
      </div>

      <div className="detail-body">
        <Card className="detail-section" title="基本信息">
          <div className="info-row"><Text type="tertiary">版本号：</Text><Text>v{detail.version}</Text></div>
          <div className="info-row"><Text type="tertiary">开发者：</Text><Text>{detail.developer_name}</Text></div>
          <div className="info-row"><Text type="tertiary">所属部门：</Text><Text>{detail.department_name}</Text></div>
          <div className="info-row"><Text type="tertiary">包大小：</Text><Text>{fmtSize(detail.package_size)}</Text></div>
          <div className="info-row"><Text type="tertiary">校验和：</Text><Text size="small" type="tertiary">{detail.package_checksum}</Text></div>
          <div className="info-row"><Text type="tertiary">上传时间：</Text><Text>{fmtTime(detail.uploaded_at)}</Text></div>
          <div className="info-row"><Text type="tertiary">提交时间：</Text><Text>{fmtTime(detail.submitted_at)}</Text></div>
          {detail.deployed_at && (
            <div className="info-row"><Text type="tertiary">上线时间：</Text><Text>{fmtTime(detail.deployed_at)}</Text></div>
          )}
          {detail.publish_note && (
            <div className="info-row info-row-block">
              <Text type="tertiary">发布说明：</Text>
              <Paragraph>{detail.publish_note}</Paragraph>
            </div>
          )}
        </Card>

        {detail.approval_template_snapshot && (
          <Card
            className="detail-section"
            title={`审批流：${detail.approval_template_snapshot.name}`}
            headerExtraContent={isPending && detail.total_levels ? (
              <Text type="tertiary" size="small">当前第 {detail.current_level} / {detail.total_levels} 级</Text>
            ) : undefined}
          >
            {detail.records && detail.records.length > 0 ? (
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
            ) : (
              <Text type="tertiary" size="small">暂无审批记录</Text>
            )}
          </Card>
        )}

        {detail.input_parameters && detail.input_parameters.length > 0 && (
          <Card className="detail-section" title="输入参数">
            <Table
              size="small"
              pagination={false}
              dataSource={detail.input_parameters}
              rowKey="name"
              columns={[
                { title: '名称', dataIndex: 'name', width: 160 },
                { title: '类型', dataIndex: 'type', width: 100 },
                { title: '必填', dataIndex: 'required', width: 80, render: (v: boolean) => (v ? '是' : '否') },
                { title: '说明', dataIndex: 'description' },
              ]}
            />
          </Card>
        )}
      </div>

      {isPending && (
        <div className="detail-footer">
          <Space spacing={8}>
            <Button type="danger" icon={<XCircle size={14} />} onClick={() => { setRejectReason(''); setRejectVisible(true); }}>拒绝</Button>
            <Button theme="solid" type="primary" icon={<CheckCircle size={14} />} loading={acting} onClick={handleApprove}>通过</Button>
          </Space>
        </div>
      )}

      <Modal
        title="拒绝发布申请"
        visible={rejectVisible}
        onCancel={() => setRejectVisible(false)}
        onOk={submitReject}
        okText="确认拒绝"
        okButtonProps={{ type: 'danger', loading: acting }}
        width={520}
      >
        <Form layout="vertical">
          <Form.TextArea
            field="reason"
            label="拒绝原因"
            placeholder="请填写拒绝原因（最多 500 字）"
            initValue={rejectReason}
            onChange={(v) => setRejectReason(v as string)}
            maxCount={500}
            autosize={{ minRows: 4, maxRows: 8 }}
            rules={[{ required: true, message: '请填写拒绝原因' }]}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default PublishApprovalDetailPage;
