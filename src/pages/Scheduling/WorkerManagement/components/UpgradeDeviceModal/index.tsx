import { useMemo } from 'react';
import { Modal, Typography, Tag, Empty, Banner } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { ArrowUpCircle, Clock, Monitor, Wifi, WifiOff } from 'lucide-react';
import {
  WorkerWithUpgrade,
  isUpgradeAvailable,
  isDeviceAllOffline,
  getDeviceBlockingWorkers,
} from '../../utils/upgrade';
import { getEnabledVersion } from '@/mocks/clientVersionData';
import './index.less';

const { Text, Paragraph } = Typography;

interface UpgradeDeviceModalProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (deviceMachineCodes: string[]) => void;
  /** 已聚合的设备列表：每个设备包含其下所有机器人 */
  devices: { machineCode: string; workers: WorkerWithUpgrade[] }[];
}

const UpgradeDeviceModal = ({ visible, onCancel, onOk, devices }: UpgradeDeviceModalProps) => {
  const { t } = useTranslation();

  // 过滤可升级（剔除「已是最新」、剔除目标版本未发布的设备）
  const enriched = useMemo(() => {
    return devices.map((d) => {
      const sample = d.workers[0];
      const target = getEnabledVersion(sample?.desktop_type);
      const upgradable = !!target && d.workers.some(isUpgradeAvailable);
      const allOffline = isDeviceAllOffline(d.workers);
      const blocking = getDeviceBlockingWorkers(d.workers);
      return { ...d, sample, target, upgradable, allOffline, blocking };
    });
  }, [devices]);

  const validDevices = enriched.filter((d) => d.upgradable);
  const totalRobots = validDevices.reduce((s, d) => s + d.workers.length, 0);

  // 按 clientType 分组（Console / NotConsole）
  const grouped = useMemo(() => {
    const map = new Map<string, typeof validDevices>();
    validDevices.forEach((d) => {
      const key = d.target?.clientType || 'Unknown';
      if (!map.has(key)) map.set(key, [] as any);
      map.get(key)!.push(d);
    });
    return Array.from(map.entries());
  }, [validDevices]);

  const handleOk = () => {
    onOk(validDevices.map((d) => d.machineCode));
  };

  return (
    <Modal
      title={t('worker.upgrade.modal.title')}
      visible={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText={t('worker.upgrade.modal.confirm')}
      cancelText={t('common.cancel')}
      width={560}
      okButtonProps={{ disabled: validDevices.length === 0 }}
      className="upgrade-device-modal"
      centered
    >
      <div className="upgrade-device-modal-summary">
        <ArrowUpCircle size={18} className="upgrade-device-modal-summary-icon" strokeWidth={2} />
        <Text>
          {t('worker.upgrade.modal.summary', {
            deviceCount: validDevices.length,
            robotCount: totalRobots,
          })}
        </Text>
      </div>

      {validDevices.length === 0 ? (
        <Empty description={t('worker.upgrade.modal.allLatest')} style={{ padding: '24px 0' }} />
      ) : (
        grouped.map(([clientType, list]) => (
          <div key={clientType} className="upgrade-device-modal-group">
            <div className="upgrade-device-modal-group-header">
              <Tag color="blue" type="light">{clientType}</Tag>
              <Text strong>
                {t('worker.upgrade.modal.targetVersion')}：{list[0].target?.version}
              </Text>
              <Text type="tertiary" size="small">
                {list[0].target?.packageSize}
              </Text>
            </div>

            {list[0].target?.releaseNotes && (
              <Paragraph
                className="upgrade-device-modal-release-notes"
                ellipsis={{ rows: 2, showTooltip: true, expandable: true, expandText: t('common.expand'), collapseText: t('common.collapse') }}
              >
                {list[0].target.releaseNotes}
              </Paragraph>
            )}

            {list.map((d) => (
              <div key={d.machineCode} className="upgrade-device-modal-card">
                <div className="upgrade-device-modal-card-header">
                  <Monitor size={14} strokeWidth={2} />
                  <Text strong>{d.sample?.host_name || d.machineCode}</Text>
                  <Text type="tertiary" size="small">{d.sample?.ip_address}</Text>
                </div>
                <div className="upgrade-device-modal-card-version">
                  <Text type="tertiary" size="small">{t('worker.upgrade.modal.currentVersion')}：</Text>
                  <Text size="small">{d.sample?.client_version}</Text>
                  <Text type="tertiary" size="small"> → </Text>
                  <Text strong size="small">{d.target?.version}</Text>
                </div>
                <div className="upgrade-device-modal-card-robots">
                  <Text type="tertiary" size="small">
                    {t('worker.upgrade.modal.affectedRobots', { count: d.workers.length })}：
                  </Text>
                  <Text size="small">
                    {d.workers.map((w) => w.name).join('、')}
                  </Text>
                </div>
                {d.allOffline ? (
                  <div className="upgrade-device-modal-card-tip warning">
                    <WifiOff size={12} strokeWidth={2} />
                    <Text size="small" type="warning">
                      {t('worker.upgrade.modal.allOfflineTip')}
                    </Text>
                  </div>
                ) : d.blocking.length > 0 ? (
                  <div className="upgrade-device-modal-card-tip info">
                    <Clock size={12} strokeWidth={2} />
                    <Text size="small">
                      {t('worker.upgrade.modal.busyTip', { count: d.blocking.length })}
                    </Text>
                  </div>
                ) : (
                  <div className="upgrade-device-modal-card-tip success">
                    <Wifi size={12} strokeWidth={2} />
                    <Text size="small" type="success">
                      {t('worker.upgrade.modal.idleTip')}
                    </Text>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}

      {validDevices.length > 0 && (
        <div className="upgrade-device-modal-footer-tip">
          <Info size={14} strokeWidth={2} />
          <Text size="small" type="tertiary">{t('worker.upgrade.modal.queueExplain')}</Text>
        </div>
      )}
    </Modal>
  );
};

export default UpgradeDeviceModal;
