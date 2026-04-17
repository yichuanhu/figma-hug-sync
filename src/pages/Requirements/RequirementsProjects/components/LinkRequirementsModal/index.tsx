import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Tag, Toast, Typography, Empty } from '@douyinfe/semi-ui';
import { Search, X, ArrowRight } from 'lucide-react';
import type { Workspace } from '../../types';
import { linkRequirements, fetchAllWorkspaces } from '../../mockData';
import { fetchRequirementList } from '../../../RequirementsWorkbench/mockData';
import type { RequirementItem } from '../../../RequirementsWorkbench/types';

const { Text } = Typography;

interface Props {
  visible: boolean;
  workspace: Workspace | null;
  onClose: () => void;
  onSuccess: () => void;
}

const LinkRequirementsModal = ({ visible, workspace, onClose, onSuccess }: Props) => {
  const { t } = useTranslation();
  const [requirements, setRequirements] = useState<RequirementItem[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [crossDept, setCrossDept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible && workspace) {
      setSelectedIds([...workspace.linkedRequirementIds]);
      setKeyword('');
      setCrossDept(false);
      Promise.all([
        fetchRequirementList({ offset: 0, size: 500, keyword: '', sort_by: 'created_at', sort_order: 'desc' }),
        fetchAllWorkspaces(),
      ]).then(([reqRes, ws]) => {
        setRequirements(reqRes.list);
        setAllWorkspaces(ws);
      });
    }
  }, [visible, workspace]);

  // 已被其它 workspace 关联的需求 id → 该 workspace
  const otherWorkspaceMap = useMemo(() => {
    const map = new Map<string, Workspace>();
    allWorkspaces.forEach((w) => {
      if (w.id !== workspace?.id) {
        w.linkedRequirementIds.forEach((rid) => map.set(rid, w));
      }
    });
    return map;
  }, [allWorkspaces, workspace?.id]);

  const filteredCandidates = useMemo(() => {
    if (!workspace) return [];
    let list = requirements;
    if (!crossDept) {
      list = list.filter((r) => r.owning_department_id === workspace.departmentId);
    }
    if (keyword.trim()) {
      const k = keyword.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(k) ||
          (r.req_no ?? '').toLowerCase().includes(k),
      );
    }
    // 排除已选
    return list.filter((r) => !selectedIds.includes(r.id));
  }, [requirements, workspace, crossDept, keyword, selectedIds]);

  const selectedItems = useMemo(
    () => requirements.filter((r) => selectedIds.includes(r.id)),
    [requirements, selectedIds],
  );

  const handleAdd = (id: string) => {
    setSelectedIds((prev) => [...prev, id]);
  };
  const handleRemove = (id: string) => {
    if (!workspace) return;
    if (workspace.hasPublishedProcess && workspace.linkedRequirementIds.includes(id)) {
      Toast.warning(t('requirements.projects.validation.cannotUnlinkPublished'));
      return;
    }
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleSave = async () => {
    if (!workspace) return;
    setSubmitting(true);
    try {
      await linkRequirements(workspace.id, selectedIds);
      Toast.success(t('common.saveSuccess'));
      onSuccess();
      onClose();
    } catch (err) {
      if ((err as Error).message === 'CANNOT_UNLINK_PUBLISHED') {
        Toast.error(t('requirements.projects.validation.cannotUnlinkPublished'));
      } else {
        Toast.error(t('common.operationFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!workspace) return null;

  return (
    <Modal
      title={t('requirements.projects.linkRequirementsTitle', { name: workspace.name })}
      visible={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={submitting}
      width={900}
      centered
      maskClosable={false}
      className="requirements-projects-link-modal"
    >
      <div className="link-columns">
        {/* 左：候选需求 */}
        <div className="link-column">
          <div className="link-column-header">
            <Text strong>{t('requirements.projects.candidateRequirements')}</Text>
            <Text
              type={crossDept ? 'primary' : 'tertiary'}
              size="small"
              link
              onClick={() => setCrossDept((v) => !v)}
              style={{ cursor: 'pointer' }}
            >
              {crossDept
                ? t('requirements.projects.showSameDept')
                : t('requirements.projects.showAllDept')}
            </Text>
          </div>
          <div className="link-column-search">
            <Input
              prefix={<Search size={14} />}
              placeholder={t('requirements.projects.searchRequirement')}
              value={keyword}
              onChange={setKeyword}
              showClear
            />
          </div>
          <div className="link-column-list">
            {filteredCandidates.length === 0 ? (
              <Empty
                style={{ padding: 32 }}
                description={t('common.noData')}
              />
            ) : (
              filteredCandidates.map((r) => {
                const linkedTo = otherWorkspaceMap.get(r.id);
                const disabled = !!linkedTo;
                return (
                  <div
                    key={r.id}
                    className={`link-column-item${disabled ? ' disabled' : ''}`}
                    onClick={() => !disabled && handleAdd(r.id)}
                  >
                    <div className="link-column-item-info">
                      <Text className="link-column-item-title" ellipsis={{ showTooltip: true }}>
                        {r.req_no ? `[${r.req_no}] ` : ''}
                        {r.title}
                      </Text>
                      <span className="link-column-item-meta">
                        {r.owning_department_name}
                        {disabled && (
                          <>
                            {' · '}
                            <Tag size="small" color="orange">
                              {t('requirements.projects.alreadyLinkedTo', { name: linkedTo!.name })}
                            </Tag>
                          </>
                        )}
                      </span>
                    </div>
                    {!disabled && <ArrowRight size={14} />}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右：已选 */}
        <div className="link-column">
          <div className="link-column-header">
            <Text strong>{t('requirements.projects.linkedRequirements')}</Text>
            <Tag size="small">{selectedItems.length}</Tag>
          </div>
          <div className="link-column-list">
            {selectedItems.length === 0 ? (
              <Empty style={{ padding: 32 }} description={t('common.noData')} />
            ) : (
              selectedItems.map((r) => (
                <div key={r.id} className="link-column-item">
                  <div className="link-column-item-info">
                    <Text className="link-column-item-title" ellipsis={{ showTooltip: true }}>
                      {r.req_no ? `[${r.req_no}] ` : ''}
                      {r.title}
                    </Text>
                    <span className="link-column-item-meta">{r.owning_department_name}</span>
                  </div>
                  <X
                    size={14}
                    style={{ cursor: 'pointer', color: 'var(--semi-color-text-2)' }}
                    onClick={() => handleRemove(r.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkRequirementsModal;
