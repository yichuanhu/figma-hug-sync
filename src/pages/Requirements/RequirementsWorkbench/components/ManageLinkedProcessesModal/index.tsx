import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Empty, Tag, Typography, Toast } from '@douyinfe/semi-ui';
import { Link2, Unlink2, Search } from 'lucide-react';
import type { LinkedProcess } from '../../types';
import { MOCK_PROCESS_POOL, addLinkedProcess, removeLinkedProcess } from '../../mockData';
import { linkedProcessStatusConfig } from '../../utils/aggregateLinkedStatus';
import './index.less';

const { Text } = Typography;

interface Props {
  visible: boolean;
  requirementId: string;
  linked: LinkedProcess[];
  onClose: () => void;
  onChanged: () => void;
}

const ManageLinkedProcessesModal = ({ visible, requirementId, linked, onClose, onChanged }: Props) => {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const linkedIds = useMemo(() => new Set(linked.map((p) => p.id)), [linked]);

  const candidates = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return MOCK_PROCESS_POOL.filter((p) => !linkedIds.has(p.id))
      .filter((p) => !kw || p.name.toLowerCase().includes(kw) || p.id.toLowerCase().includes(kw));
  }, [keyword, linkedIds]);

  const handleLink = async (id: string) => {
    setPendingId(id);
    try {
      await addLinkedProcess(requirementId, id);
      Toast.success(t('requirements.linkedProcesses.linkSuccess'));
      onChanged();
    } catch {
      Toast.error(t('requirements.linkedProcesses.linkFailed'));
    } finally {
      setPendingId(null);
    }
  };

  const handleUnlink = async (id: string) => {
    setPendingId(id);
    try {
      await removeLinkedProcess(requirementId, id);
      Toast.success(t('requirements.linkedProcesses.unlinkSuccess'));
      onChanged();
    } catch {
      Toast.error(t('requirements.linkedProcesses.unlinkFailed'));
    } finally {
      setPendingId(null);
    }
  };

  const renderRow = (p: LinkedProcess, action: 'link' | 'unlink') => {
    const cfg = linkedProcessStatusConfig[p.status];
    return (
      <div key={p.id} className="manage-linked-processes__row">
        <span className={`manage-linked-processes__dot manage-linked-processes__dot--${cfg.color}`} />
        <div className="manage-linked-processes__info">
          <Text ellipsis={{ showTooltip: true }} className="manage-linked-processes__name">{p.name}</Text>
          <Text type="tertiary" size="small">{p.id} · {p.ownerName ?? '-'}</Text>
        </div>
        <Tag size="small" color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag>
        {action === 'link' ? (
          <Button
            size="small"
            theme="borderless"
            type="primary"
            icon={<Link2 size={14} strokeWidth={2} />}
            loading={pendingId === p.id}
            onClick={() => handleLink(p.id)}
          >
            {t('requirements.linkedProcesses.link')}
          </Button>
        ) : (
          <Button
            size="small"
            theme="borderless"
            type="danger"
            icon={<Unlink2 size={14} strokeWidth={2} />}
            loading={pendingId === p.id}
            onClick={() => handleUnlink(p.id)}
          >
            {t('requirements.linkedProcesses.unlink')}
          </Button>
        )}
      </div>
    );
  };

  return (
    <Modal
      title={t('requirements.linkedProcesses.manageTitle')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={560}
      className="manage-linked-processes-modal"
    >
      <div className="manage-linked-processes">
        <div className="manage-linked-processes__section">
          <div className="manage-linked-processes__section-title">
            <Text strong size="small">{t('requirements.linkedProcesses.linkedSection')}</Text>
            <Text type="tertiary" size="small">{linked.length}</Text>
          </div>
          {linked.length === 0 ? (
            <Empty description={t('requirements.linkedProcesses.empty')} style={{ padding: '12px 0' }} />
          ) : (
            <div className="manage-linked-processes__list">
              {linked.map((p) => renderRow(p, 'unlink'))}
            </div>
          )}
        </div>

        <div className="manage-linked-processes__section">
          <div className="manage-linked-processes__section-title">
            <Text strong size="small">{t('requirements.linkedProcesses.candidateSection')}</Text>
            <Input
              size="small"
              prefix={<Search size={14} strokeWidth={2} />}
              placeholder={t('requirements.linkedProcesses.searchPlaceholder')}
              value={keyword}
              onChange={setKeyword}
              showClear
              style={{ width: 200 }}
            />
          </div>
          {candidates.length === 0 ? (
            <Empty description={t('requirements.linkedProcesses.noCandidate')} style={{ padding: '12px 0' }} />
          ) : (
            <div className="manage-linked-processes__list">
              {candidates.map((p) => renderRow(p, 'link'))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ManageLinkedProcessesModal;
