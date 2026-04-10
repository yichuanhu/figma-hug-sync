import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Button, Tag, Descriptions, Switch, Tooltip, Space } from '@douyinfe/semi-ui';
import type { LYWorkerResponse } from '@/api';
import ExpandableText from '@/components/ExpandableText';
import DetailDrawerWrapper from '@/components/DetailDrawerWrapper';
import type { PaginationInfo } from '@/components/DetailDrawerWrapper';
import './index.less';
import { Key, MinusCircle, Pencil, Trash2, Users } from 'lucide-react';

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
  dataList?: LYWorkerResponse[];
  onNavigate?: (worker: LYWorkerResponse) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number, direction: 'prev' | 'next') => void;
  onScrollToRow?: (id: string) => void;
  
}

const WorkerDetailDrawer = ({ visible, onClose, workerData, onEdit, onViewKey, onDelete, onToggleReceiveTasks, onAddToGroup, onRemoveFromGroup, dataList = [], onNavigate, pagination, onPageChange, onScrollToRow }: WorkerDetailDrawerProps) => {
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
    { key: t('worker.detail.fields.status'), value: <Tag color={statusCfg.color as any} type="light">{statusCfg.text}</Tag> },
    { key: t('worker.detail.fields.receiveTasks'), value: <Switch checked={workerData.receive_tasks} size="small" disabled={!canOperateReceiveTasks} onChange={(checked) => onToggleReceiveTasks?.(workerData, checked)} /> },
  ];

  const isRemoteDesktop = workerData.desktop_type === 'NotConsole';

  const detailInfoData = [
    { key: t('worker.detail.fields.desktopType'), value: workerData.desktop_type === 'Console' ? t('worker.detail.desktopTypes.console') : t('worker.detail.desktopTypes.notConsole') },
    { key: t('worker.detail.fields.account'), value: workerData.username },
    { key: t('worker.detail.fields.passwordSyncStatus'), value: <Tag color={workerData.sync_status === 'SYNCED' ? 'green' : 'orange'} type="light">{workerData.sync_status === 'SYNCED' ? t('worker.syncStatus.synced') : t('worker.syncStatus.pending')}</Tag> },
    ...(isRemoteDesktop ? [{ key: t('worker.detail.fields.forceLogin'), value: <Tag color={workerData.force_login ? 'green' : 'grey'} type="light">{workerData.force_login ? t('common.yes') : t('common.no')}</Tag> }] : []),
    ...(isRemoteDesktop ? [{ key: t('worker.detail.fields.resolution'), value: workerData.display_size || '-' }] : []),
    { key: t('worker.detail.fields.clientVersion'), value: workerData.client_version },
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
