---
name: Worker Device Upgrade
description: 流程机器人按设备维度的客户端升级机制：聚合 machine_code、预约升级等待空闲、Admin Hub 启用版本对比
type: feature
---
流程机器人客户端升级以「设备」（machine_code）为单位，同一设备下所有机器人会被一起升级。

入口：
- 列表 client_version 列：可升级设备显示橙色 ArrowUpCircle 徽标，hover 提示影响 N 台机器人
- 行操作菜单：「升级设备」/「取消升级预约」/ UPGRADING 时置灰 + Tooltip
- 顶部 Action Bar：勾选行后展示「升级设备」「取消预约」（按勾选行的设备聚合，去重 machine_code）
- 详情抽屉：extraActions 头部按钮 + 主机信息 client_version 字段下方升级标记/取消按钮

「等待空闲」机制：
- 点击「确认预约升级」后，设备的所有机器人 upgrade_status 置为 'QUEUED'，状态共享同 machine_code
- 设备空闲条件：所有机器人 IDLE/OFFLINE/FAULT
- BUSY/MAINTENANCE 机器人会阻塞升级，但设备仍可接收新任务
- UPGRADING 状态不可取消

技术实现：
- src/mocks/clientVersionData.ts: Console / NotConsole 两条启用版本 mock
- src/pages/Scheduling/WorkerManagement/utils/upgrade.ts: compareVersion / isUpgradeAvailable / groupWorkersByDevice / aggregateSelectedDevices / isDeviceIdle / getDeviceBlockingWorkers
- src/pages/Scheduling/WorkerManagement/components/UpgradeDeviceModal: 设备维度升级弹窗，按 clientType 分组，每个设备卡片显示影响机器人 + 状态提示
- WorkerWithUpgrade 类型扩展 LYWorkerResponse 增加 upgrade_status / upgrade_target_version / upgrade_failed_reason
- i18n key: worker.upgrade.{menu,batchButton,badge,queued,upgrading,failed,cancel,modal}
