import { useState, useEffect } from 'react';
import UserNameWithCard from '@/components/layout/UserNameWithCard';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Tag, Descriptions, Switch, Tooltip, Space } from '@douyinfe/semi-ui';
import type { LYWorkerResponse } from '@/api';
import ExpandableText from '@/components/ExpandableText';
import { getDepartmentName } from '@/mocks/departmentData';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import { isUpgradeAvailable, type WorkerWithUpgrade } from '../../utils/upgrade';
import { getEnabledVersion } from '@/mocks/clientVersionData';
import './index.less';
import { ArrowUpCircle, Key, MinusCircle, Pencil, Trash2, Users } from 'lucide-react';

const { Text } = Typography;

interface WorkerDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  workerData: LYWorkerResponse | null;
  onEdit?: () => void;
  onViewKey?: () => void;
  onDelete?: () => void;
  onToggleReceiveTasks?: (worker: LYWorkerResponse, checked: boolean) => void;
  onAddToGroup?: (worker: LYWorkerResponse) => void;
  onRemoveFromGroup?: (worker: LYWorkerResponse) => void;
  onUpgradeDevice?: (worker: LYWorkerResponse) => void;
  onCancelUpgrade?: (worker: LYWorkerResponse) => void;
  dataList?: LYWorkerResponse[];
  onNavigate?: (worker: LYWorkerResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
  
}

const WorkerDetailDrawer = ({ visible, onClose, workerData, onEdit, onViewKey, onDelete, onToggleReceiveTasks, onAddToGroup, onRemoveFromGroup, onUpgradeDevice, onCancelUpgrade, dataList = [], onNavigate, pagination, onPageChange, onScrollToRow }: WorkerDetailDrawerProps) => {
  const { t } = useTranslation();

  if (!workerData) return null;

  type WorkerStatus = LYWorkerResponse['status'];

  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = {
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  };

  const statusCfg = statusConfig[workerData.status];
  const canOperateReceiveTasks = workerData.status !== 'OFFLINE' && workerData.status !== 'FAULT';

  const renderGroupValue = () => {
    if (workerData.group_id && workerData.group_name) {
      return (
        <Space spacing={8}>
          <Tag color="blue" type="light">{workerData.group_name}</Tag>
          <Tooltip content={t('worker.actions.removeFromGroup')}>
            <Button icon={<MinusCircle size={16} strokeWidth={2} />} theme="borderless" size="small" type="tertiary" onClick={() => onRemoveFromGroup?.(workerData)} />
          </Tooltip>
        </Space>
      );
    }
    return (
      <Space spacing={8}>
        <Text type="tertiary">{t('worker.filter.ungrouped')}</Text>
        <Tooltip content={t('worker.actions.addToGroup')}>
          <Button icon={<Users size={16} strokeWidth={2} />} theme="borderless" size="small" type="tertiary" onClick={() => onAddToGroup?.(workerData)} />
        </Tooltip>
      </Space>
    );
  };

  const basicInfoData = [
    { key: t('worker.detail.fields.workerName'), value: workerData.name },
    { key: t('worker.detail.fields.group'), value: renderGroupValue() },
    { key: t('worker.detail.fields.description'), value: <ExpandableText text={workerData.description} maxLines={3} /> },
    { key: t('common.owningDepartment'), value: getDepartmentName(workerData.owning_department_id) },
    { key: t('common.owner'), value: workerData.owner_name ? <UserNameWithCard name={workerData.owner_name} userId={workerData.owner_id || ''} /> : '-' },
    { key: t('worker.detail.fields.status'), value: <Tag color={statusCfg.color as any} type="light">{statusCfg.text}</Tag> },
    { key: t('worker.detail.fields.receiveTasks'), value: <Switch checked={workerData.receive_tasks} size="small" disabled={!canOperateReceiveTasks} onChange={(checked) => onToggleReceiveTasks?.(workerData, checked)} /> },
  ];

  const isRemoteDesktop = workerData.desktop_type === 'NotConsole';

  // 升级状态展示
  const wd = workerData as WorkerWithUpgrade;
  const upgradeTarget = getEnabledVersion(workerData.desktop_type);
  const upgradable = isUpgradeAvailable(workerData);
  const upgradeStatus = wd.upgrade_status;

  const renderClientVersion = () => {
    if (upgradeStatus === 'QUEUED') {
      return (
        <div>
          <Space spacing={8}>
            <span>{workerData.client_version}</span>
            <Tag color="blue" type="light" size="small">{t('worker.upgrade.queued.tag')}</Tag>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="tertiary" size="small">
              {t('worker.upgrade.queued.detailDescription', { version: wd.upgrade_target_version || upgradeTarget?.version || '' })}
            </Text>
            <Button
              theme="borderless"
              type="danger"
              size="small"
              onClick={() => onCancelUpgrade?.(workerData)}
              style={{ marginLeft: 8 }}
            >
              {t('worker.upgrade.cancel.menu')}
            </Button>
          </div>
        </div>
      );
    }
    if (upgradeStatus === 'UPGRADING') {
      return (
        <div>
          <Space spacing={8}>
            <span>{workerData.client_version}</span>
            <Tag color="blue" type="solid" size="small">{t('worker.upgrade.upgrading.tag')}</Tag>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="tertiary" size="small" style={{ color: 'var(--semi-color-primary)' }}>
              {t('worker.upgrade.upgrading.tooltip', { version: wd.upgrade_target_version || upgradeTarget?.version || '' })}
            </Text>
          </div>
        </div>
      );
    }
    if (upgradeStatus === 'FAILED') {
      return (
        <div>
          <Space spacing={8}>
            <span>{workerData.client_version}</span>
            <Tag color="red" type="light" size="small">{t('worker.upgrade.failed.tag')}</Tag>
          </Space>
          <div style={{ marginTop: 4 }}>
            <Text type="danger" size="small">
              {t('worker.upgrade.failed.reasonLabel')}：{wd.upgrade_failed_reason || t('worker.upgrade.failed.defaultReason')}
            </Text>
            <Button
              theme="borderless"
              type="primary"
              size="small"
              onClick={() => onUpgradeDevice?.(workerData)}
              style={{ marginLeft: 8 }}
            >
              {t('worker.upgrade.failed.retry')}
            </Button>
          </div>
        </div>
      );
    }
    if (upgradable && upgradeTarget) {
      return (
        <Space spacing={8}>
          <span>{workerData.client_version}</span>
          <Tag color="orange" type="light" size="small">
            {t('worker.upgrade.badge.tag', { version: upgradeTarget.version })}
          </Tag>
          <Button theme="borderless" type="primary" size="small" onClick={() => onUpgradeDevice?.(workerData)}>
            {t('worker.upgrade.popover.button')}
          </Button>
        </Space>
      );
    }
    return workerData.client_version;
  };

  const detailInfoData = [
    { key: t('worker.detail.fields.desktopType'), value: workerData.desktop_type === 'Console' ? t('worker.detail.desktopTypes.console') : t('worker.detail.desktopTypes.notConsole') },
    { key: t('worker.detail.fields.account'), value: workerData.username },
    { key: t('worker.detail.fields.passwordSyncStatus'), value: <Tag color={workerData.sync_status === 'SYNCED' ? 'green' : 'orange'} type="light">{workerData.sync_status === 'SYNCED' ? t('worker.syncStatus.synced') : t('worker.syncStatus.pending')}</Tag> },
    ...(isRemoteDesktop ? [{ key: t('worker.detail.fields.forceLogin'), value: <Tag color={workerData.force_login ? 'green' : 'grey'} type="light">{workerData.force_login ? t('common.yes') : t('common.no')}</Tag> }] : []),
    ...(isRemoteDesktop ? [{ key: t('worker.detail.fields.resolution'), value: workerData.display_size || '-' }] : []),
    { key: t('worker.detail.fields.clientVersion'), value: renderClientVersion() },
    { key: t('worker.detail.fields.lastHeartbeat'), value: workerData.last_heartbeat_time },
  ];

  const hostInfoData = [
    { key: t('worker.detail.fields.machineCode'), value: workerData.machine_code },
    { key: t('worker.detail.fields.hostName'), value: workerData.host_name },
    { key: t('worker.detail.fields.hostIp'), value: workerData.ip_address },
    { key: t('worker.detail.fields.os'), value: workerData.os },
    { key: t('worker.detail.fields.arch'), value: workerData.arch },
    { key: t('worker.detail.fields.cpuModel'), value: workerData.cpu_model },
    { key: t('worker.detail.fields.cpuCores'), value: `${workerData.cpu_cores} cores` },
    { key: t('worker.detail.fields.memoryCapacity'), value: workerData.memory_capacity },
    { key: t('worker.detail.fields.robotCount'), value: `${workerData.robot_count} units` },
  ];

  const extraActions = (
    <>
      {upgradeStatus === 'QUEUED' ? (
        <Tooltip content={t('worker.upgrade.cancel.menu')}>
          <Button
            icon={<ArrowUpCircle size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onCancelUpgrade?.(workerData)}
          />
        </Tooltip>
      ) : upgradeStatus === 'UPGRADING' ? (
        <Tooltip content={t('worker.upgrade.upgrading.cannotCancel')}>
          <Button
            icon={<ArrowUpCircle size={16} strokeWidth={2} />}
            theme="borderless"
            type="tertiary"
            size="small"
            disabled
          />
        </Tooltip>
      ) : upgradeStatus === 'FAILED' ? (
        <Tooltip content={t('worker.upgrade.failed.retry')}>
          <Button
            icon={<ArrowUpCircle size={16} strokeWidth={2} color="var(--semi-color-danger)" />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onUpgradeDevice?.(workerData)}
          />
        </Tooltip>
      ) : upgradable ? (
        <Tooltip content={t('worker.upgrade.popover.button')}>
          <Button
            icon={<ArrowUpCircle size={16} strokeWidth={2} color="var(--semi-color-warning)" />}
            theme="borderless"
            type="tertiary"
            size="small"
            onClick={() => onUpgradeDevice?.(workerData)}
          />
        </Tooltip>
      ) : null}
      <Tooltip content={t('common.edit')}>
        <Button icon={<Pencil size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onEdit} />
      </Tooltip>
      <Tooltip content={t('worker.actions.viewKey')}>
        <Button icon={<Key size={16} strokeWidth={2} />} theme="borderless" type="tertiary" size="small" onClick={onViewKey} />
      </Tooltip>
    </>
  );

  const deleteAction = (
    <Tooltip content={t('common.delete')}>
      <Button icon={<Trash2 size={16} strokeWidth={2} color="var(--semi-color-danger)" />} theme="borderless" type="tertiary" size="small" onClick={onDelete} />
    </Tooltip>
  );

  const handleClose = () => {
    onClose();
  };

  return (
    <DetailDrawerWrapper
      visible={visible}
      onClose={handleClose}
      title={t('worker.detail.title')}
      dataList={dataList}
      currentId={workerData.id}
      getId={(item) => item.id}
      onNavigate={(item) => onNavigate?.(item)}
      pagination={pagination}
      onPageChange={onPageChange}
      onScrollToRow={onScrollToRow}
      extraActions={extraActions}
      deleteAction={deleteAction}
      collaboratorProps={{
        assetType: 'WORKER',
        assetId: workerData.id,
        context: 'scheduling',
        canManage: true,
      }}
      defaultWidth={900}
      minWidth={576}
      storageKey="workerDetailDrawerWidth"
      className="worker-detail-drawer"
    >
      <div className="worker-detail-drawer-tab-content">
        <div className="worker-detail-drawer-info-section">
          <Text strong className="worker-detail-drawer-info-title">{t('worker.detail.basicInfo')}</Text>
          <Descriptions data={basicInfoData} align="left" />
        </div>
        <div className="worker-detail-drawer-info-section">
          <Text strong className="worker-detail-drawer-info-title">{t('worker.detail.detailInfo')}</Text>
          <Descriptions data={detailInfoData} align="left" />
        </div>
        <div className="worker-detail-drawer-info-section">
          <Text strong className="worker-detail-drawer-info-title">{t('worker.detail.hostInfo')}</Text>
          <Descriptions data={hostInfoData} align="left" />
        </div>
        <div>
          <Descriptions align="left" data={[
            { key: t('worker.detail.fields.createdAt'), value: workerData.created_at },
            { key: t('worker.detail.fields.creator'), value: workerData.creator_id },
          ]} />
        </div>
      </div>
    </DetailDrawerWrapper>
  );
};

export default WorkerDetailDrawer;
