import { useCallback, useEffect, useRef } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Typography,
  Descriptions,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconEditStroked,
  IconDeleteStroked,
  IconList,
} from '@douyinfe/semi-icons';
import type { LYQueueResponse } from '@/api/index';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import { useCollaboratorPermission } from '@/hooks/useCollaboratorPermission';

import './index.less';

interface QueueDetailDrawerProps {
  visible: boolean;
  queue: LYQueueResponse | null;
  context: 'development' | 'scheduling';
  onClose: () => void;
  onEdit: (queue: LYQueueResponse) => void;
  onDelete?: (queue: LYQueueResponse) => void;
  allQueues: LYQueueResponse[];
  onQueueChange: (queue: LYQueueResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
  initialTab?: string;
}

const QueueDetailDrawer = ({
  visible,
  queue,
  context,
  onClose,
  onEdit,
  onDelete,
  allQueues,
  onQueueChange,
  pagination,
  onPageChange,
  onScrollToRow,
}: QueueDetailDrawerProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { Text } = Typography;

  const { canManage } = useCollaboratorPermission('QUEUE', queue?.queue_id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  const handleViewMessages = useCallback(() => {
    if (!queue) return;
    const basePath = context === 'development'
      ? '/dev-center/business-assets/queues'
      : '/scheduling-center/business-assets/queues';
    navigate(`${basePath}/${queue.queue_id}/messages`);
    onClose();
  }, [queue, context, navigate, onClose]);

  if (!queue) return null;

  const extraActions = (
    <>
      <Tooltip content={t('queue.actions.viewMessages')}>
        <Button icon={<IconList />} theme="borderless" type="tertiary" size="small" onClick={handleViewMessages} />
      </Tooltip>
      {!queue.is_published && (
        <Tooltip content={t('common.edit')}>
          <Button icon={<IconEditStroked />} theme="borderless" type="tertiary" size="small" onClick={() => onEdit(queue)} />
        </Tooltip>
      )}
      {onDelete && context === 'development' && !queue.is_published && (
        <Tooltip content={t('common.delete')}>
          <Button icon={<IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />} theme="borderless" size="small" onClick={() => onDelete(queue)} />
        </Tooltip>
      )}
    </>
  );

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={onClose}
      title={queue.queue_name}
      dataList={allQueues}
      currentId={queue.queue_id}
      getId={(item) => item.queue_id}
      onNavigate={onQueueChange}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      collaboratorProps={{
        assetType: 'QUEUE',
        assetId: queue.queue_id,
        context,
        canManage,
      }}
      defaultWidth={900}
      minWidth={576}
      storageKey="queue-detail-drawer-width"
      className="queue-detail-drawer"
    >
      <div className="queue-detail-drawer-content" style={{ padding: '16px 24px' }}>
        <Text strong className="queue-detail-drawer-section-title">
          {t('queue.detail.tabs.basicInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queue.fields.name')}>
            {queue.queue_name || '-'}
          </Descriptions.Item>
          {context === 'development' && (
            <Descriptions.Item itemKey={t('queue.detail.isPublished')}>
              {queue.is_published ? (
                <Tag color="green">{t('queue.detail.published')}</Tag>
              ) : (
                <Tag color="grey">{t('queue.detail.unpublished')}</Tag>
              )}
            </Descriptions.Item>
          )}
          <Descriptions.Item itemKey={t('common.description')}>
            <ExpandableText text={queue.description} maxLines={3} />
          </Descriptions.Item>
        </Descriptions>

        <Text strong className="queue-detail-drawer-section-title">
          {t('queue.detail.messageStats')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('queue.table.unconsumedCount')}>
            {context === 'development' ? queue.test_unconsumed_count : queue.prod_unconsumed_count}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queue.table.consumedCount')}>
            {context === 'development' ? queue.test_consumed_count : queue.prod_consumed_count}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('queue.table.failedCount')}>
            <Text type={((context === 'development' ? queue.test_failed_count : queue.prod_failed_count) || 0) > 0 ? 'danger' : undefined}>
              {context === 'development' ? queue.test_failed_count : queue.prod_failed_count}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Text strong className="queue-detail-drawer-section-title">
          {t('queue.detail.systemInfo')}
        </Text>
        <Descriptions align="left">
          <Descriptions.Item itemKey={t('common.creator')}>
            {queue.created_by_name ? <UserNameWithCard name={queue.created_by_name} userId={queue.created_by} department={queue.created_by_department || undefined} role={queue.created_by_role || undefined} email={queue.created_by_email || undefined} /> : '-'}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.createTime')}>
            {formatDate(queue.created_at || null)}
          </Descriptions.Item>
          <Descriptions.Item itemKey={t('common.updateTime')}>
            {formatDate(queue.updated_at || null)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </DetailDrawerWrapper>
  );
};

export default QueueDetailDrawer;
