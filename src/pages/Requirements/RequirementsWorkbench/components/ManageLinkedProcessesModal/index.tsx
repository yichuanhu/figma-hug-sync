import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Checkbox, Typography, Tag, Toast, Button } from '@douyinfe/semi-ui';
import { IconSearchStroked } from '@douyinfe/semi-icons';
import { Trash2 } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { MOCK_PROCESS_POOL, addLinkedProcesses, removeLinkedProcess } from '../../mockData';
import type { LinkedProcess } from '../../types';
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
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setKeyword('');
      setSelected([]);
    }
  }, [visible]);

  const linkedIds = useMemo(() => new Set(linked.map((p) => p.id)), [linked]);

  const candidates = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return MOCK_PROCESS_POOL
      .filter((p) => !linkedIds.has(p.id))
      .filter((p) => !kw || p.name.toLowerCase().includes(kw));
  }, [keyword, linkedIds]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAdd = async () => {
    if (selected.length === 0) {
      onClose();
      return;
    }
    setSubmitting(true);
    try {
      await addLinkedProcesses(requirementId, selected);
      Toast.success(t('requirements.linkedProcesses.addSuccess', { count: selected.length }));
      onChanged();
      onClose();
    } catch (e) {
      Toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (processId: string, name: string) => {
    Modal.confirm({
      title: t('requirements.linkedProcesses.unlinkConfirmTitle'),
      content: t('requirements.linkedProcesses.unlinkConfirmContent', { name }),
      okText: t('requirements.linkedProcesses.unlink'),
      okButtonProps: { type: 'danger' },
      cancelText: t('common.cancel'),
      onOk: async () => {
        await removeLinkedProcess(requirementId, processId);
        Toast.success(t('requirements.linkedProcesses.unlinkSuccess'));
        onChanged();
      },
    });
  };

  return (
    <Modal
      title={t('requirements.linkedProcesses.manageTitle')}
      visible={visible}
      onCancel={onClose}
      onOk={handleAdd}
      okText={selected.length > 0 ? t('requirements.linkedProcesses.addCount', { count: selected.length }) : t('common.close')}
      cancelText={t('common.cancel')}
      confirmLoading={submitting}
      width={600}
      className="manage-linked-processes-modal"
    >
      {linked.length > 0 && (
        <div className="manage-linked-processes-modal__section">
          <Text strong size="small">{t('requirements.linkedProcesses.linkedSection', { count: linked.length })}</Text>
          <div className="manage-linked-processes-modal__linked-list">
            {linked.map((p) => {
              const cfg = linkedProcessStatusConfig[p.status];
              return (
                <div key={p.id} className="manage-linked-processes-modal__linked-row">
                  <Text className="manage-linked-processes-modal__name" ellipsis={{ showTooltip: true }}>{p.name}</Text>
                  <Tag size="small" color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag>
                  <Button
                    icon={<Trash2 size={14} strokeWidth={2} />}
                    theme="borderless"
                    type="danger"
                    size="small"
                    onClick={() => handleRemove(p.id, p.name)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="manage-linked-processes-modal__section">
        <Text strong size="small">{t('requirements.linkedProcesses.candidateSection')}</Text>
        <Input
          prefix={<IconSearchStroked />}
          placeholder={t('requirements.linkedProcesses.searchPlaceholder')}
          value={keyword}
          onChange={setKeyword}
          showClear
          style={{ marginTop: 8, marginBottom: 8 }}
        />
        {candidates.length === 0 ? (
          <div className="manage-linked-processes-modal__empty">
            <EmptyState variant={keyword ? 'noResult' : 'noData'} description={t('requirements.linkedProcesses.noCandidates')} />
          </div>
        ) : (
          <div className="manage-linked-processes-modal__candidate-list">
            {candidates.map((p) => {
              const cfg = linkedProcessStatusConfig[p.status];
              const checked = selected.includes(p.id);
              return (
                <div
                  key={p.id}
                  className={`manage-linked-processes-modal__candidate-row ${checked ? 'is-checked' : ''}`}
                  onClick={() => toggle(p.id)}
                >
                  <Checkbox checked={checked} onChange={() => toggle(p.id)} />
                  <Text className="manage-linked-processes-modal__name" ellipsis={{ showTooltip: true }}>{p.name}</Text>
                  <Tag size="small" color={cfg.color} type="light">{t(cfg.i18nKey)}</Tag>
                  <Text type="tertiary" size="small">{p.ownerName ?? '-'}</Text>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ManageLinkedProcessesModal;
