import { useMemo, useState } from 'react';
import { Typography, Button, Space, Empty, Card, Toast, Tag } from '@douyinfe/semi-ui';
import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { findShareAsset } from '../../shared/mockData';
import SourceBadge from '@/components/sharing/SourceBadge';
import StatusTag from '@/components/sharing/StatusTag';
import ApprovalTimeline from '@/components/sharing/ApprovalTimeline';
import RejectReasonDialog from '@/components/sharing/RejectReasonDialog';
import './index.less';

const { Title, Text, Paragraph } = Typography;

const ApprovalDetailPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const initial = useMemo(() => (id ? findShareAsset(id) : undefined), [id]);
  const [asset, setAsset] = useState(initial);
  const [rejectVisible, setRejectVisible] = useState(false);

  if (!asset) {
    return (
      <div className="approval-detail-page">
        <Empty title={t('sharing.approvals.detail.notFound')} />
      </div>
    );
  }

  const isPending = asset.shareStatus === 'PENDING_APPROVAL';

  const handleApprove = () => {
    setAsset({
      ...asset,
      shareStatus: 'PUBLISHED',
      approvalEvents: [
        ...asset.approvalEvents,
        { type: 'APPROVED', actorName: '当前用户', at: new Date().toISOString().slice(0, 10), comment: '审核通过' },
      ],
    });
    Toast.success(t('sharing.approvals.toast.approved'));
  };

  const handleReject = (reason: string) => {
    setAsset({
      ...asset,
      shareStatus: 'REJECTED',
      rejectedReason: reason,
      approvalEvents: [
        ...asset.approvalEvents,
        { type: 'REJECTED', actorName: '当前用户', at: new Date().toISOString().slice(0, 10), comment: reason },
      ],
    });
    Toast.success(t('sharing.approvals.toast.rejected'));
    setRejectVisible(false);
  };

  return (
    <div className="approval-detail-page">
      <div className="approval-detail-header">
        <Button
          theme="borderless"
          type="tertiary"
          icon={<ChevronLeft size={16} strokeWidth={2} />}
          onClick={() => navigate(-1)}
        >
          {t('common.back')}
        </Button>
        <Title heading={3} className="title">{asset.name}</Title>
        <Space spacing={8}>
          <SourceBadge source={asset.source} />
          <StatusTag status={asset.shareStatus} />
        </Space>
      </div>

      <div className="approval-detail-body">
        <Card className="detail-section" title={t('sharing.approvals.detail.basicInfo')}>
          <div className="info-row">
            <Text type="tertiary">{t('sharing.approvals.col.assetType')}：</Text>
            <Text>{t(`sharing.market.tabs.${asset.type}`)}</Text>
          </div>
          <div className="info-row">
            <Text type="tertiary">{t('sharing.approvals.col.creator')}：</Text>
            <Text>{asset.creatorName} · {asset.departmentName}</Text>
          </div>
          <div className="info-row">
            <Text type="tertiary">{t('sharing.approvals.col.submittedAt')}：</Text>
            <Text>{asset.submittedAt}</Text>
          </div>
          <div className="info-row">
            <Text type="tertiary">{t('sharing.approvals.detail.version')}：</Text>
            <Text>{asset.currentVersion}</Text>
          </div>
          <div className="info-row info-row-tags">
            <Text type="tertiary">{t('sharing.approvals.detail.tags')}：</Text>
            <Space spacing={4} wrap>
              {asset.tags.map((t) => <Tag key={t} size="small" color="grey" type="light">{t}</Tag>)}
            </Space>
          </div>
          <div className="info-row info-row-block">
            <Text type="tertiary">{t('sharing.approvals.detail.description')}：</Text>
            <Paragraph>{asset.description}</Paragraph>
          </div>
        </Card>

        <Card className="detail-section" title={t('sharing.approvals.detail.timeline')}>
          <ApprovalTimeline events={asset.approvalEvents} />
        </Card>
      </div>

      {isPending && (
        <div className="approval-detail-footer">
          <Space spacing={8}>
            <Button type="danger" onClick={() => setRejectVisible(true)}>
              {t('sharing.approvals.actions.reject')}
            </Button>
            <Button theme="solid" type="primary" onClick={handleApprove}>
              {t('sharing.approvals.actions.approve')}
            </Button>
          </Space>
        </div>
      )}

      <RejectReasonDialog
        visible={rejectVisible}
        assetName={asset.name}
        onSubmit={handleReject}
        onCancel={() => setRejectVisible(false)}
      />
    </div>
  );
};

export default ApprovalDetailPage;
