import { useMemo } from 'react';
import { Modal, Typography, Tag, Empty, Banner } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { AlertCircle, ArrowUpCircle, Clock, Monitor, Wifi } from 'lucide-react';
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
  // 可执行升级的客户端：必须有可用升级版本，且不能全部离线
  const upgradableDevices = validDevices.filter((d) => !d.allOffline);
  const offlineDevices = validDevices.filter((d) => d.allOffline);
  const busyDevices = upgradableDevices.filter((d) => d.blocking.length > 0);
  const totalRobots = upgradableDevices.reduce((s, d) => s + d.workers.length, 0);

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
    onOk(upgradableDevices.map((d) => d.machineCode));
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
      okButtonProps={{ disabled: upgradableDevices.length === 0 }}
      className="upgrade-device-modal"
      centered
    >
      {upgradableDevices.length > 0 && (
        <Banner
          type="warning"
          fullMode={false}
          closeIcon={null}
          description={t('worker.upgrade.modal.receivingTasksTip')}
          style={{ marginBottom: 16 }}
        />
      )}

      <div className="upgrade-device-modal-summary">
        <ArrowUpCircle size={18} className="upgrade-device-modal-summary-icon" strokeWidth={2} />
        <Text>
          {t('worker.upgrade.modal.summary', {
            deviceCount: upgradableDevices.length,
            robotCount: totalRobots,
          })}
        </Text>
      </div>

      {busyDevices.length > 0 && (
        <Banner
          type="info"
          fullMode={false}
          closeIcon={null}
          description={t('worker.upgrade.modal.waitBusyBannerTip', { count: busyDevices.length })}
          style={{ marginBottom: 12 }}
        />
      )}

      {offlineDevices.length > 0 && (
        <Banner
          type="danger"
          fullMode={false}
          closeIcon={null}
          description={t('worker.upgrade.modal.offlineBlockedTip', { count: offlineDevices.length })}
          style={{ marginBottom: 12 }}
        />
      )}

      {validDevices.length === 0 ? (
        <Empty description={t('worker.upgrade.modal.allLatest')} style={{ padding: '24px 0' }} />
      ) : (
        grouped.map(([clientType, list]) => (
          <div key={clientType} className="upgrade-device-modal-group">
            <div className="upgrade-device-modal-group-header">
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
                ellipsis={{ rows: 2, expandable: true, collapsible: true, expandText: t('common.expand'), collapseText: t('common.collapse') }}
              >
                {list[0].target.releaseNotes}
              </Paragraph>
            )}

            {list.map((d) => (
              <div key={d.machineCode} className={`upgrade-device-modal-card${d.allOffline ? ' disabled' : ''}`}>
                <div className="upgrade-device-modal-card-header">
                  <Monitor size={14} strokeWidth={2} />
                  <Text strong>{d.sample?.host_name || d.machineCode}</Text>
                  <Text type="tertiary" size="small">{d.sample?.ip_address}</Text>
                  {d.allOffline && (
                    <Tag color="red" type="light" size="small" style={{ marginLeft: 'auto' }}>
                      {t('worker.upgrade.modal.cannotUpgradeTag')}
                    </Tag>
                  )}
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
                  <div className="upgrade-device-modal-card-tip danger">
                    <AlertCircle size={12} strokeWidth={2} />
                    <Text size="small" type="danger">
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

    </Modal>
  );
};

export default UpgradeDeviceModal;
