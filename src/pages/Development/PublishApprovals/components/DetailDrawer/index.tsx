/**
 * 发布审批详情抽屉
 *
 * 参考 RequirementDetailDrawer：基于 DetailDrawerWrapper，
 * 支持上下条导航、维持原详情页的卡片/Timeline 渲染。
 */
import { useState } from 'react';
import { Typography, Space, Card, Tag, Timeline, Table, Button, Modal, Form, Toast } from '@douyinfe/semi-ui';
import { CheckCircle, XCircle } from 'lucide-react';
import DetailDrawerWrapper, { type PaginationInfo } from '@/components/DetailDrawerWrapper';
import {
  approvePublishRequest,
  rejectPublishRequest,
  type ProcessVersion,
  type VersionStatus,
} from '@/mocks/processVersionApproval';
import { CURRENT_APPROVAL_USER_ID } from '@/pages/Development/PublishApprovals/currentUser';
import './index.less';

const { Text, Paragraph } = Typography;

const STATUS_TAG: Record<VersionStatus, { color: 'blue' | 'green' | 'red' | 'grey'; text: string }> = {
  UPLOADED: { color: 'grey', text: '待发布' },
  PENDING_APPROVAL: { color: 'blue', text: '待审批' },
  PUBLISHED: { color: 'green', text: '已通过' },
  REJECTED: { color: 'red', text: '已拒绝' },
};

const fmtTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('zh-CN', { hour12: false }) : '-');
const fmtSize = (b: number) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`);

interface PublishApprovalDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  data: ProcessVersion | null;
  dataList: ProcessVersion[];
  onNavigate: (item: ProcessVersion) => void;
  pagination?: PaginationInfo;
  onAfterAction?: () => void;
}

const PublishApprovalDetailDrawer = ({
  visible, onClose, data, dataList, onNavigate, pagination, onAfterAction,
}: PublishApprovalDetailDrawerProps) => {
  const [rejectVisible, setRejectVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [acting, setActing] = useState(false);

  if (!data) return null;

  const isPending = data.status === 'PENDING_APPROVAL';
  const reviewedByMe = (data.records ?? []).some((r) => r.approver_id === CURRENT_APPROVAL_USER_ID);

  const handleApprove = () => {
    Modal.confirm({
      title: '确认通过',
      content: `确认通过「${data.process_name} v${data.version}」的发布申请？`,
      okText: '通过',
      onOk: async () => {
        try {
          setActing(true);
          await approvePublishRequest(data.id);
          Toast.success('已通过');
          onAfterAction?.();
        } catch (e) {
          Toast.error((e as Error).message);
        } finally {
          setActing(false);
        }
      },
    });
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActing(true);
      await rejectPublishRequest(data.id, rejectReason.trim());
      Toast.success('已拒绝');
      setRejectVisible(false);
      onAfterAction?.();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setActing(false);
    }
  };

  const title = (
    <Space spacing={8}>
      <span>{data.process_name}</span>
      <Tag color="grey" type="light">v{data.version}</Tag>
      <Tag color={STATUS_TAG[data.status].color} type="light">{STATUS_TAG[data.status].text}</Tag>
    </Space>
  );

  const extraActions = isPending && !reviewedByMe ? (
    <Space spacing={8}>
      <Button type="danger" icon={<XCircle size={14} />} onClick={() => { setRejectReason(''); setRejectVisible(true); }}>
        拒绝
      </Button>
      <Button theme="solid" type="primary" icon={<CheckCircle size={14} />} loading={acting} onClick={handleApprove}>
        通过
      </Button>
    </Space>
  ) : null;

  return (
    <>
      <DetailDrawerWrapper<ProcessVersion>
        visible={visible}
        onClose={onClose}
        title={title}
        dataList={dataList}
        currentId={data.id}
        onNavigate={onNavigate}
        pagination={pagination}
        extraActions={extraActions}
        defaultWidth={900}
        storageKey="publishApprovalDetailDrawerWidth"
        className="publish-approval-detail-drawer"
      >
        <div className="publish-approval-detail-drawer-body">
          <Card className="detail-section" title="基本信息">
            <div className="info-row"><Text type="tertiary">版本号：</Text><Text>v{data.version}</Text></div>
            <div className="info-row"><Text type="tertiary">开发者：</Text><Text>{data.developer_name}</Text></div>
            <div className="info-row"><Text type="tertiary">所属部门：</Text><Text>{data.department_name}</Text></div>
            <div className="info-row"><Text type="tertiary">包大小：</Text><Text>{fmtSize(data.package_size)}</Text></div>
            <div className="info-row"><Text type="tertiary">校验和：</Text><Text size="small" type="tertiary">{data.package_checksum}</Text></div>
            <div className="info-row"><Text type="tertiary">上传时间：</Text><Text>{fmtTime(data.uploaded_at)}</Text></div>
            <div className="info-row"><Text type="tertiary">提交时间：</Text><Text>{fmtTime(data.submitted_at)}</Text></div>
            {data.deployed_at && (
              <div className="info-row"><Text type="tertiary">上线时间：</Text><Text>{fmtTime(data.deployed_at)}</Text></div>
            )}
            {data.publish_note && (
              <div className="info-row info-row-block">
                <Text type="tertiary">发布说明：</Text>
                <Paragraph>{data.publish_note}</Paragraph>
              </div>
            )}
          </Card>

          {data.approval_template_snapshot && (
            <Card
              className="detail-section"
              title={`审批流：${data.approval_template_snapshot.name}`}
              headerExtraContent={isPending && data.total_levels ? (
                <Text type="tertiary" size="small">当前第 {data.current_level} / {data.total_levels} 级</Text>
              ) : undefined}
            >
              {data.records && data.records.length > 0 ? (
                <Timeline>
                  {data.records.map((r, idx) => (
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

          {data.input_parameters && data.input_parameters.length > 0 && (
            <Card className="detail-section" title="输入参数">
              <Table
                size="small"
                pagination={false}
                dataSource={data.input_parameters}
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
      </DetailDrawerWrapper>

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
    </>
  );
};

export default PublishApprovalDetailDrawer;
