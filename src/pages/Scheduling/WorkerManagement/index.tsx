import { useState, useMemo, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
import {
  Breadcrumb, 
  Typography, 
  Input, 
  Button, 
  Table, 
  Tag, 
  Dropdown,
  Switch,
  Checkbox,
  Row,
  Col,
  Space,
  Modal,
  Toast,
  Select,
  Pagination,
  Popover,
} from '@douyinfe/semi-ui';
import DepartmentSelect from '@/components/DepartmentSelect';
import { IconSearchStroked, IconDeleteStroked } from '@douyinfe/semi-icons';
import EmptyState from '@/components/EmptyState';
import TableSkeleton from '@/components/TableSkeleton';
import FilterPopover from '@/components/FilterPopover';
import { Ellipsis, Eye, Key, MinusCircle, Pencil, Plus, Trash2, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import WorkerDetailDrawer from './components/WorkerDetailDrawer';
import WorkerKeyModal from './components/WorkerKeyModal';
import CreateWorkerModal from './components/CreateWorkerModal';
import EditWorkerModal from './components/EditWorkerModal';
import AddToGroupModal from './components/AddToGroupModal';
import UpgradeDeviceModal from './components/UpgradeDeviceModal';
import type { LYWorkerResponse, LYListResponseLYWorkerResponse, GetWorkersParams } from '@/api';
import { useCollaboratorAction } from '@/hooks/useCollaboratorAction';
import {
  WorkerWithUpgrade,
  isUpgradeAvailable,
  aggregateSelectedDevices,
  groupWorkersByDevice,
} from './utils/upgrade';
import { getEnabledVersion } from '@/mocks/clientVersionData';
import { ArrowUpCircle, AlertCircle, Loader2, Clock, WifiOff } from 'lucide-react';
import { Tooltip } from '@douyinfe/semi-ui';
import './index.less';

const { Title, Text } = Typography;
const CheckboxGroup = Checkbox.Group;

// Mockbot组Data
const mockWorkerGroups = [
  { id: 'group-001', name: 'Finance Bot Group' },
  { id: 'group-002', name: 'HR Bot Group' },
  { id: 'group-003', name: 'Ops Inspection Bot Group' },
];

// MockData - 覆盖升级状态分支演示场景
// 设备 1: DESKTOP-A1B2 - NONE + 可升级 (3 IDLE, v6.7.0 Console)
// 设备 2: DESKTOP-C3D4 - UPGRADING 升级中 (1 BUSY + 2 IDLE, v6.7.0 Console)
// 设备 3: DESKTOP-E5F6 - UPGRADING 升级中 (3 BUSY + 1 IDLE, v6.7.2 NotConsole)
// 设备 4: DESKTOP-G7H8 - UPGRADING 升级中 (2 IDLE, v6.7.0 Console)
// 设备 5: DESKTOP-I9J0 - FAILED 升级失败 (2 IDLE, v6.6.5 Console)
// 设备 6: DESKTOP-K1L2 - UPGRADING 升级中（离线场景，等设备恢复后会继续）
// 设备 7: DESKTOP-LATEST - 已是最新 (1 IDLE, v6.8.0 Console) 对照组
const mockWorkers: WorkerWithUpgrade[] = [
  // ===== 设备 1: DESKTOP-A1B2 - NONE + 可升级 =====
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Finance Bot-01',
    description: '核心财务自动化机器人，处理发票识别、报销审核、财务报表生成、银行对账与税务申报数据准备。',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.100',
    priority: 'HIGH',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:25:33',
    receive_tasks: true,
    username: 'DOMAIN\\robot01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567yzabc890',
    machine_code: 'DESKTOP-A1B2',
    host_name: 'WIN-SERVER-01',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '32 GB',
    robot_count: 3,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-05 14:30:00',
    creator_id: 'admin',
    upgrade_status: 'NONE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440011',
    name: 'Finance Bot-01B',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.100',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:25:00',
    receive_tasks: true,
    username: 'DOMAIN\\robot01b',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'a1b2-token-002',
    machine_code: 'DESKTOP-A1B2',
    host_name: 'WIN-SERVER-01',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '32 GB',
    robot_count: 3,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-05 14:31:00',
    creator_id: 'admin',
    upgrade_status: 'NONE',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440012',
    name: 'Finance Bot-01C',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.100',
    priority: 'LOW',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:24:00',
    receive_tasks: true,
    username: 'DOMAIN\\robot01c',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'a1b2-token-003',
    machine_code: 'DESKTOP-A1B2',
    host_name: 'WIN-SERVER-01',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '32 GB',
    robot_count: 3,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-05 14:32:00',
    creator_id: 'admin',
    upgrade_status: 'NONE',
  },
  // ===== 设备 2: DESKTOP-C3D4 - QUEUED 等待空闲 =====
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Finance Bot-02',
    description: '财务报表自动化机器人',
    status: 'BUSY',
    sync_status: 'PENDING',
    ip_address: '10.0.1.101',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:20:15',
    receive_tasks: true,
    username: 'DOMAIN\\robot02',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'c3d4-token-001',
    machine_code: 'DESKTOP-C3D4',
    host_name: 'WIN-SERVER-02',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '16 GB',
    robot_count: 3,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-06 09:15:00',
    creator_id: 'admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440021',
    name: 'Finance Bot-02B',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.101',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:20:00',
    receive_tasks: true,
    username: 'DOMAIN\\robot02b',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'c3d4-token-002',
    machine_code: 'DESKTOP-C3D4',
    host_name: 'WIN-SERVER-02',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '16 GB',
    robot_count: 3,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-06 09:16:00',
    creator_id: 'admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440022',
    name: 'Finance Bot-02C',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.101',
    priority: 'LOW',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:20:00',
    receive_tasks: true,
    username: 'DOMAIN\\robot02c',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'c3d4-token-003',
    machine_code: 'DESKTOP-C3D4',
    host_name: 'WIN-SERVER-02',
    os: 'Windows Server 2019 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) CPU E5-2680 v4 @ 2.40GHz',
    cpu_cores: 8,
    memory_capacity: '16 GB',
    robot_count: 3,
    group_id: 'group-001',
    group_name: 'Finance Bot Group',
    owning_department_name: 'Finance Department',
    created_at: '2025-01-06 09:17:00',
    creator_id: 'admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  // ===== 设备 3: DESKTOP-E5F6 - QUEUED 多机器人阻塞 =====
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'HR Bot-01',
    description: 'HR 审批流程机器人',
    status: 'BUSY',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.102',
    priority: 'HIGH',
    client_version: 'v6.7.2',
    last_heartbeat_time: '2025-01-08 10:25:00',
    receive_tasks: true,
    username: 'DOMAIN\\hr01',
    desktop_type: 'NotConsole',
    display_size: '1920x1080',
    force_login: false,
    device_token: 'e5f6-token-001',
    machine_code: 'DESKTOP-E5F6',
    host_name: 'WIN-HR-DESK',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 4,
    group_id: 'group-002',
    group_name: 'HR Bot Group',
    owning_department_name: 'Human Resources Department',
    created_at: '2025-01-04 11:20:00',
    creator_id: 'hr_admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440031',
    name: 'HR Bot-02',
    description: '同设备机器人',
    status: 'BUSY',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.102',
    priority: 'HIGH',
    client_version: 'v6.7.2',
    last_heartbeat_time: '2025-01-08 10:25:00',
    receive_tasks: true,
    username: 'DOMAIN\\hr02',
    desktop_type: 'NotConsole',
    display_size: '1920x1080',
    force_login: false,
    device_token: 'e5f6-token-002',
    machine_code: 'DESKTOP-E5F6',
    host_name: 'WIN-HR-DESK',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 4,
    group_id: 'group-002',
    group_name: 'HR Bot Group',
    owning_department_name: 'Human Resources Department',
    created_at: '2025-01-04 11:21:00',
    creator_id: 'hr_admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440032',
    name: 'HR Bot-03',
    description: '同设备机器人',
    status: 'BUSY',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.102',
    priority: 'MEDIUM',
    client_version: 'v6.7.2',
    last_heartbeat_time: '2025-01-08 10:25:00',
    receive_tasks: true,
    username: 'DOMAIN\\hr03',
    desktop_type: 'NotConsole',
    display_size: '1920x1080',
    force_login: false,
    device_token: 'e5f6-token-003',
    machine_code: 'DESKTOP-E5F6',
    host_name: 'WIN-HR-DESK',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 4,
    group_id: 'group-002',
    group_name: 'HR Bot Group',
    owning_department_name: 'Human Resources Department',
    created_at: '2025-01-04 11:22:00',
    creator_id: 'hr_admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440033',
    name: 'HR Bot-04',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.1.102',
    priority: 'LOW',
    client_version: 'v6.7.2',
    last_heartbeat_time: '2025-01-08 10:25:00',
    receive_tasks: true,
    username: 'DOMAIN\\hr04',
    desktop_type: 'NotConsole',
    display_size: '1920x1080',
    force_login: false,
    device_token: 'e5f6-token-004',
    machine_code: 'DESKTOP-E5F6',
    host_name: 'WIN-HR-DESK',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i7-8700 @ 3.20GHz',
    cpu_cores: 6,
    memory_capacity: '16 GB',
    robot_count: 4,
    group_id: 'group-002',
    group_name: 'HR Bot Group',
    owning_department_name: 'Human Resources Department',
    created_at: '2025-01-04 11:23:00',
    creator_id: 'hr_admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  // ===== 设备 4: DESKTOP-G7H8 - UPGRADING 升级中 =====
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Ops Bot-01',
    description: '运维巡检机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.2.50',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:22:00',
    receive_tasks: false,
    username: 'ops01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'g7h8-token-001',
    machine_code: 'DESKTOP-G7H8',
    host_name: 'WIN-OPS-01',
    os: 'Windows Server 2022 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'AMD Ryzen 9 5900X 12-Core Processor',
    cpu_cores: 12,
    memory_capacity: '64 GB',
    robot_count: 2,
    group_id: 'group-003',
    group_name: 'Ops Inspection Bot Group',
    owning_department_name: 'Enterprise Business Center',
    created_at: '2025-01-02 08:30:00',
    creator_id: 'ops_admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440041',
    name: 'Ops Bot-02',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.2.50',
    priority: 'LOW',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-08 10:22:00',
    receive_tasks: false,
    username: 'ops02',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'g7h8-token-002',
    machine_code: 'DESKTOP-G7H8',
    host_name: 'WIN-OPS-01',
    os: 'Windows Server 2022 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'AMD Ryzen 9 5900X 12-Core Processor',
    cpu_cores: 12,
    memory_capacity: '64 GB',
    robot_count: 2,
    group_id: 'group-003',
    group_name: 'Ops Inspection Bot Group',
    owning_department_name: 'Enterprise Business Center',
    created_at: '2025-01-02 08:31:00',
    creator_id: 'ops_admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  // ===== 设备 5: DESKTOP-I9J0 - FAILED 升级失败 =====
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Test Bot-01',
    description: '自动化测试机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.3.10',
    priority: 'LOW',
    client_version: 'v6.6.5',
    last_heartbeat_time: '2025-01-08 09:00:00',
    receive_tasks: true,
    username: 'DOMAIN\\test01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'i9j0-token-001',
    machine_code: 'DESKTOP-I9J0',
    host_name: 'WIN-TEST-01',
    os: 'Windows 11 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i9-12900K @ 3.20GHz',
    cpu_cores: 16,
    memory_capacity: '32 GB',
    robot_count: 2,
    group_id: null,
    group_name: null,
    owning_department_name: 'R&D Center',
    created_at: '2025-01-01 10:00:00',
    creator_id: 'qa_admin',
    upgrade_status: 'FAILED',
    upgrade_target_version: 'v6.8.0',
    upgrade_failed_reason: '网络超时：升级包下载失败，请检查客户端网络连接',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440051',
    name: 'Test Bot-02',
    description: '同设备机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.3.10',
    priority: 'LOW',
    client_version: 'v6.6.5',
    last_heartbeat_time: '2025-01-08 09:00:00',
    receive_tasks: true,
    username: 'DOMAIN\\test02',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'i9j0-token-002',
    machine_code: 'DESKTOP-I9J0',
    host_name: 'WIN-TEST-01',
    os: 'Windows 11 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i9-12900K @ 3.20GHz',
    cpu_cores: 16,
    memory_capacity: '32 GB',
    robot_count: 2,
    group_id: null,
    group_name: null,
    owning_department_name: 'R&D Center',
    created_at: '2025-01-01 10:01:00',
    creator_id: 'qa_admin',
    upgrade_status: 'FAILED',
    upgrade_target_version: 'v6.8.0',
    upgrade_failed_reason: '网络超时：升级包下载失败，请检查客户端网络连接',
  },
  // ===== 设备 6: DESKTOP-K1L2 - QUEUED 全离线 =====
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Finance Bot-Off-01',
    description: '离线财务机器人',
    status: 'OFFLINE',
    sync_status: 'SYNCED',
    ip_address: '10.0.4.20',
    priority: 'MEDIUM',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-07 16:30:22',
    receive_tasks: false,
    username: 'DOMAIN\\foff01',
    desktop_type: 'Console',
    enable_auto_unlock: false,
    force_login: false,
    device_token: 'k1l2-token-001',
    machine_code: 'DESKTOP-K1L2',
    host_name: 'WIN-FOFF-01',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i5-8400 @ 2.80GHz',
    cpu_cores: 6,
    memory_capacity: '8 GB',
    robot_count: 3,
    group_id: null,
    group_name: null,
    owning_department_name: 'Finance Department',
    created_at: '2025-01-03 15:45:00',
    creator_id: 'admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440061',
    name: 'Finance Bot-Off-02',
    description: '同设备机器人',
    status: 'OFFLINE',
    sync_status: 'SYNCED',
    ip_address: '10.0.4.20',
    priority: 'LOW',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-07 16:30:22',
    receive_tasks: false,
    username: 'DOMAIN\\foff02',
    desktop_type: 'Console',
    enable_auto_unlock: false,
    force_login: false,
    device_token: 'k1l2-token-002',
    machine_code: 'DESKTOP-K1L2',
    host_name: 'WIN-FOFF-01',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i5-8400 @ 2.80GHz',
    cpu_cores: 6,
    memory_capacity: '8 GB',
    robot_count: 3,
    group_id: null,
    group_name: null,
    owning_department_name: 'Finance Department',
    created_at: '2025-01-03 15:46:00',
    creator_id: 'admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440062',
    name: 'Finance Bot-Off-03',
    description: '同设备机器人',
    status: 'FAULT',
    sync_status: 'SYNCED',
    ip_address: '10.0.4.20',
    priority: 'LOW',
    client_version: 'v6.7.0',
    last_heartbeat_time: '2025-01-06 09:15:00',
    receive_tasks: false,
    username: 'DOMAIN\\foff03',
    desktop_type: 'Console',
    enable_auto_unlock: false,
    force_login: false,
    device_token: 'k1l2-token-003',
    machine_code: 'DESKTOP-K1L2',
    host_name: 'WIN-FOFF-01',
    os: 'Windows 10 Pro 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Core(TM) i5-8400 @ 2.80GHz',
    cpu_cores: 6,
    memory_capacity: '8 GB',
    robot_count: 3,
    group_id: null,
    group_name: null,
    owning_department_name: 'Finance Department',
    created_at: '2025-01-03 15:47:00',
    creator_id: 'admin',
    upgrade_status: 'UPGRADING',
    upgrade_target_version: 'v6.8.0',
  },
  // ===== 设备 7: DESKTOP-LATEST - 已是最新 (对照组) =====
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    name: 'Latest Bot-01',
    description: '已是最新版本的机器人',
    status: 'IDLE',
    sync_status: 'SYNCED',
    ip_address: '10.0.5.30',
    priority: 'MEDIUM',
    client_version: 'v6.8.0',
    last_heartbeat_time: '2025-01-08 10:25:00',
    receive_tasks: true,
    username: 'DOMAIN\\latest01',
    desktop_type: 'Console',
    enable_auto_unlock: true,
    force_login: false,
    device_token: 'latest-token-001',
    machine_code: 'DESKTOP-LATEST',
    host_name: 'WIN-LATEST-01',
    os: 'Windows Server 2022 Standard 64-bit',
    arch: 'x64',
    cpu_model: 'Intel(R) Xeon(R) Gold 6248R @ 3.00GHz',
    cpu_cores: 24,
    memory_capacity: '128 GB',
    robot_count: 1,
    group_id: 'group-003',
    group_name: 'Ops Inspection Bot Group',
    owning_department_name: 'Enterprise Business Center',
    created_at: '2025-01-01 10:00:00',
    creator_id: 'ops_admin',
    upgrade_status: 'NONE',
  },
];

// 特殊Filter值常量
const UNGROUPED_FILTER_VALUE = '__UNGROUPED__';

interface FilterState {
  status: string[];
  sync_status: string[];
  group_id: string[];
}

interface SortState {
  sortBy?: string;
  sortOrder?: 'ascend' | 'descend';
}

// ============= Data获取 - BackLYListResponseLYWorkerResponse =============

// StatusSortPriority
const STATUS_ORDER: Record<string, number> = {
  BUSY: 1,
  IDLE: 2,
  MAINTENANCE: 3,
  FAULT: 4,
  OFFLINE: 5,
};

const fetchWorkerList = async (params: GetWorkersParams & { filters?: FilterState; sort?: SortState }): Promise<LYListResponseLYWorkerResponse> => {
  // 模拟Network延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let data = [...mockWorkers];

  // 关键词Search(Name或IP)
  if (params.keyword?.trim()) {
    const keyword = params.keyword.toLowerCase().trim();
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.ip_address.toLowerCase().includes(keyword)
    );
  }

  // StatusFilter
  if (params.filters?.status && params.filters.status.length > 0) {
    data = data.filter(item => params.filters!.status.includes(item.status));
  }

  // 同步StatusFilter
  if (params.filters?.sync_status && params.filters.sync_status.length > 0) {
    data = data.filter(item => params.filters!.sync_status.includes(item.sync_status));
  }

  // bot组Filter
  if (params.filters?.group_id && params.filters.group_id.length > 0) {
    data = data.filter(item => {
      const selectedGroups = params.filters!.group_id;
      if (selectedGroups.includes(UNGROUPED_FILTER_VALUE)) {
        if (!item.group_id) return true;
      }
      if (item.group_id && selectedGroups.includes(item.group_id)) {
        return true;
      }
      return false;
    });
  }

  // 归属部门Filter
  if ((params as any).owning_department_name && (params as any).owning_department_name.length > 0) {
    const deptNames: string[] = (params as any).owning_department_name;
    data = data.filter(item => deptNames.includes((item as any).owning_department_name));
  }

  // Sortprocessing
  if (params.sort?.sortBy && params.sort?.sortOrder) {
    const { sortBy, sortOrder } = params.sort;
    data.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, 'zh-CN');
      } else if (sortBy === 'status') {
        comparison = (STATUS_ORDER[a.status] || 99) - (STATUS_ORDER[b.status] || 99);
      }
      
      return sortOrder === 'descend' ? -comparison : comparison;
    });
  }

  const total = data.length;
  const offset = params.offset || 0;
  const size = params.size || 20;
  const paginatedData = data.slice(offset, offset + size);

  // BackLYListResponseLYWorkerResponseFormat
  return {
    range: {
      offset,
      size,
      total,
    },
    list: paginatedData,
  };
};

interface WorkerManagementProps {
  isActive?: boolean;
  pendingWorkerId?: string | null;
  onWorkerDetailOpened?: () => void;
  openCreateFromHome?: boolean;
  onCreateFromHomeHandled?: () => void;
}

const WorkerManagement = ({ isActive = true, pendingWorkerId, onWorkerDetailOpened, openCreateFromHome, onCreateFromHomeHandled }: WorkerManagementProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Search框input值(即is shown)
  const [searchValue, setSearchValue] = useState('');
  
  // queryParameter - usingAPIType
  const [queryParams, setQueryParams] = useState<GetWorkersParams>({
    offset: 0,
    size: 20,
    keyword: undefined,
  });
  
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    sync_status: [],
    group_id: [],
  });
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [sortState, setSortState] = useState<SortState>({});
  const [filterVisible, setFilterVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // List响应Data - 直接usingAPI LYListResponseLYWorkerResponse
  const [listResponse, setListResponse] = useState<LYListResponseLYWorkerResponse>({
    range: { offset: 0, size: 20, total: 0 },
    list: [],
  });
  
  // Drawer and ModalStatus
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<LYWorkerResponse | null>(null);
  const [detailInitialTab, setDetailInitialTab] = useState('basic');
  const { openCollaborator, renderCollaboratorPanel } = useCollaboratorAction();
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [keyModalWorker, setKeyModalWorker] = useState<LYWorkerResponse | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // from首页快捷入口跳转时auto-open新建Modal
  useEffect(() => {
    if (openCreateFromHome) {
      setCreateModalVisible(true);
      onCreateFromHomeHandled?.();
    }
  }, [openCreateFromHome, onCreateFromHomeHandled]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LYWorkerResponse | null>(null);
  const [addToGroupModalVisible, setAddToGroupModalVisible] = useState(false);
  const [addToGroupWorker, setAddToGroupWorker] = useState<LYWorkerResponse | null>(null);

  // 升级相关 state
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [upgradeDevices, setUpgradeDevices] = useState<{ machineCode: string; workers: WorkerWithUpgrade[] }[]>([]);

  // StatusConfig
  type WorkerStatus = LYWorkerResponse['status'];
  
  const statusConfig: Record<WorkerStatus, { color: string; text: string }> = useMemo(() => ({
    OFFLINE: { color: 'grey', text: t('worker.status.offline') },
    IDLE: { color: 'green', text: t('worker.status.idle') },
    BUSY: { color: 'blue', text: t('worker.status.busy') },
    FAULT: { color: 'red', text: t('worker.status.fault') },
    MAINTENANCE: { color: 'orange', text: t('worker.status.maintenance') },
  }), [t]);

  // Filter选项
  const filterOptions = useMemo(() => ({
    status: [
      { label: t('worker.status.offline'), value: 'OFFLINE' },
      { label: t('worker.status.idle'), value: 'IDLE' },
      { label: t('worker.status.busy'), value: 'BUSY' },
      { label: t('worker.status.fault'), value: 'FAULT' },
      { label: t('worker.status.maintenance'), value: 'MAINTENANCE' },
    ],
    sync_status: [
      { label: t('worker.syncStatus.synced'), value: 'SYNCED' },
      { label: t('worker.syncStatus.pending'), value: 'PENDING' },
    ],
    group_id: [
      { label: t('worker.filter.ungrouped'), value: UNGROUPED_FILTER_VALUE },
      ...mockWorkerGroups.map(g => ({ label: g.name, value: g.id })),
    ],
  }), [t]);

  // departmentOptions removed - using DepartmentSelect with tree data

  // LoadingData
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchWorkerList({
        ...queryParams,
        filters,
        sort: sortState,
        owning_department_name: departmentFilter,
      } as any);
      setListResponse(response);
      return response.list;
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [queryParams, filters, sortState, departmentFilter]);

  // 翻页并Back新Data(usefor Drawer导航时auto-翻页)
  const handleDrawerPageChange = useCallback(async (page: number): Promise<LYWorkerResponse[]> => {
    const currentPageSize = listResponse.range?.size || 20;
    const newOffset = (page - 1) * currentPageSize;
    setQueryParams(prev => ({ ...prev, offset: newOffset }));
    
    // 直接获取Data而notisWaitstateUpdate
    const response = await fetchWorkerList({
      ...queryParams,
      offset: newOffset,
      filters,
      sort: sortState,
      owning_department_name: departmentFilter,
    } as any);
    setListResponse(response);
    return response.list;
  }, [queryParams, filters, sortState, departmentFilter, listResponse.range?.size]);

  // 当Tab switchto非激活Status时, CloseDrawer
  useEffect(() => {
    if (!isActive) {
      setDetailDrawerVisible(false);
    }
  }, [isActive]);

  // 初始化Loading
  useEffect(() => {
    loadData();
  }, [loadData]);

  // processingfrombot组跳转过's 情况
  useEffect(() => {
    if (pendingWorkerId && listResponse.list.length > 0) {
      const worker = listResponse.list.find(w => w.id === pendingWorkerId);
      if (worker) {
        setSelectedWorker(worker);
        setDetailDrawerVisible(true);
        onWorkerDetailOpened?.();
      }
    }
  }, [pendingWorkerId, listResponse.list, onWorkerDetailOpened]);

  // Searchdebounced
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setQueryParams(prev => ({ ...prev, keyword: value || undefined, offset: 0 }));
      }, 500),
    []
  );

  // Search
  const handleSearch = (value: string) => {
    setSearchValue(value);  // Immediately update input display
    debouncedSearch(value); // Debounced query update
  };

  const handleFilterConfirm = (values: Record<string, unknown>) => {
    setFilters(prev => ({
      ...prev,
      status: (values.status as string[]) || [],
      sync_status: (values.sync_status as string[]) || [],
    }));
    setQueryParams(prev => ({ ...prev, offset: 0 }));
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  // 切换接收taskStatus
  const handleToggleReceiveTasks = async (worker: LYWorkerResponse, checked: boolean) => {
    // Update本地Data
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === worker.id ? { ...item, receive_tasks: checked } : item
      ),
    }));
    
    // alsoUpdateSelected's worker(ifDraweropen)
    if (selectedWorker?.id === worker.id) {
      setSelectedWorker(prev => prev ? { ...prev, receive_tasks: checked } : null);
    }
    
    // 模拟API调use
    Toast.success(checked ? t('worker.receiveTasks.enabled') : t('worker.receiveTasks.disabled'));
  };

  // filterContent removed - using FilterPopover directly

  // openDetails drawer
  const openDetail = (worker: LYWorkerResponse) => {
    setSelectedWorker(worker);
    setDetailInitialTab('basic');
    setDetailDrawerVisible(true);
  };

  // open密钥Modal
  const openKeyModal = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setKeyModalWorker(worker);
    setKeyModalVisible(true);
  };

  // DeleteConfirm
  const handleDeleteClick = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // Checkis否has未Donetask
    if (worker.status === 'BUSY') {
      Modal.warning({
        title: t('worker.deleteModal.cannotDelete'),
        content: t('worker.deleteModal.hasPendingTasks'),
        okText: t('common.confirm'),
      });
      return;
    }

    Modal.confirm({
      title: t('worker.deleteModal.title'),
      icon: <IconDeleteStroked style={{ color: 'var(--semi-color-danger)' }} />,
      content: (
        <>
          <div>{t('worker.deleteModal.confirmMessage', { name: worker.name })}</div>
          <div style={{ color: 'var(--semi-color-text-2)', marginTop: 8 }}>
            {t('worker.deleteModal.deleteWarning')}
          </div>
        </>
      ),
      okText: t('worker.deleteModal.confirmDelete'),
      cancelText: t('common.cancel'),
      okButtonProps: { type: 'danger' },
      onOk: async () => {
        try {
          // 模拟Delete API 调use
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('Deletebot:', worker.id);
          
          // CloseDrawer
          setDetailDrawerVisible(false);
          setSelectedWorker(null);
          
          // 重新LoadingData
          loadData();
          
          // displaySuccess提示
          Toast.success(t('worker.deleteModal.success'));
        } catch (error) {
          // displayError提示
          Toast.error(t('worker.deleteModal.error'));
          throw error;
        }
      },
    });
  };

  // fromDetails drawer跳转toEdit
  const handleEditFromDrawer = () => {
    if (selectedWorker) {
      setEditingWorker(selectedWorker);
      setEditModalVisible(true);
    }
  };

  // fromDetails drawerDelete
  const handleDeleteFromDrawer = () => {
    if (selectedWorker) {
      handleDeleteClick(selectedWorker);
    }
  };

  // Editbot
  const handleEdit = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingWorker(worker);
    setEditModalVisible(true);
  };

  // add至分组
  const handleAddToGroup = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setAddToGroupWorker(worker);
    setAddToGroupModalVisible(true);
  };

  // CreateSuccess回调
  const handleCreateSuccess = () => {
    loadData();
  };

  // EditSuccess回调
  const handleEditSuccess = (updatedWorker: LYWorkerResponse) => {
    // UpdateListData
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedWorker.id ? updatedWorker : item
      ),
    }));
    // 同步UpdateSelected's worker(ifDraweropen)
    if (selectedWorker?.id === updatedWorker.id) {
      setSelectedWorker(updatedWorker);
    }
  };

  // add至分组Success回调
  const handleAddToGroupSuccess = (updatedWorker: LYWorkerResponse) => {
    // UpdateListData
    setListResponse(prev => ({
      ...prev,
      list: prev.list.map(item => 
        item.id === updatedWorker.id ? updatedWorker : item
      ),
    }));
    // 同步UpdateSelected's worker(ifDraweropen)
    if (selectedWorker?.id === updatedWorker.id) {
      setSelectedWorker(updatedWorker);
    }
  };

  // 移出分组
  const handleRemoveFromGroup = (worker: LYWorkerResponse, e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    Modal.confirm({
      title: t('worker.removeFromGroup.title'),      content: t('worker.removeFromGroup.confirmMessage', { 
        name: worker.name,
        group: worker.group_name 
      }),
      okText: t('worker.removeFromGroup.confirm'),
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          // 模拟API调use
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const updatedWorker: LYWorkerResponse = {
            ...worker,
            group_id: null,
            group_name: null,
          };
          
          // UpdateListData
          setListResponse(prev => ({
            ...prev,
            list: prev.list.map(item => 
              item.id === updatedWorker.id ? updatedWorker : item
            ),
          }));
          
          // 同步UpdateSelected's worker(ifDraweropen)
          if (selectedWorker?.id === updatedWorker.id) {
            setSelectedWorker(updatedWorker);
          }
          
          Toast.success(t('worker.removeFromGroup.success'));
        } catch (error) {
          Toast.error(t('worker.removeFromGroup.error'));
          throw error;
        }
      },
    });
  };

  // from响应获取分页Info
  const { range, list } = listResponse;
  const currentPage = Math.floor((range?.offset || 0) / (range?.size || 20)) + 1;
  const pageSize = range?.size || 20;
  const total = range?.total || 0;

  // 设备维度聚合（同 machine_code 视为同一设备）
  const deviceMap = useMemo(() => groupWorkersByDevice(list as WorkerWithUpgrade[]), [list]);

  const getDevicePeers = useCallback(
    (record: WorkerWithUpgrade) => deviceMap.get(record.machine_code || record.id) || [record],
    [deviceMap]
  );

  // 行 / 批量 升级触发
  const triggerUpgrade = useCallback(
    (workerIds: string[]) => {
      const enabled = workerIds.some((id) => {
        const w = (list as WorkerWithUpgrade[]).find((x) => x.id === id);
        return w && getEnabledVersion(w.desktop_type);
      });
      if (!enabled) {
        Toast.warning(t('worker.upgrade.noEnabledVersion'));
        return;
      }
      const devices = aggregateSelectedDevices(list as WorkerWithUpgrade[], workerIds);
      setUpgradeDevices(devices);
      setUpgradeModalVisible(true);
    },
    [list, t]
  );

  const handleConfirmUpgrade = useCallback(
    (machineCodes: string[]) => {
      // 简化：所有勾选客户端直接进入 UPGRADING 状态（已移除预约升级）
      setListResponse((prev) => ({
        ...prev,
        list: prev.list.map((w) => {
          const code = (w as WorkerWithUpgrade).machine_code || w.id;
          if (!machineCodes.includes(code)) return w;
          const target = getEnabledVersion(w.desktop_type);
          return {
            ...w,
            upgrade_status: 'UPGRADING',
            upgrade_target_version: target?.version || null,
            upgrade_failed_reason: null,
          } as WorkerWithUpgrade;
        }),
      }));
      setUpgradeModalVisible(false);
      setSelectedRowKeys([]);
      Toast.success(t('worker.upgrade.upgradingStarted', { count: machineCodes.length }));
    },
    [t]
  );


  const columns = [
    {
      title: t('worker.table.workerName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: true,
      sortOrder: sortState.sortBy === 'name' ? sortState.sortOrder : undefined,
      render: (name: string, record: LYWorkerResponse) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{name}</span>
            {record.sync_status === 'PENDING' && (
              <Tag color="orange" size="small" type="light">{t('worker.syncStatus.pending')}</Tag>
            )}
          </div>
          <div>
            {record.username || '-'}
          </div>
        </div>
      ),
    },
    {
      title: t('worker.table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      sorter: true,
      sortOrder: sortState.sortBy === 'status' ? sortState.sortOrder : undefined,
      render: (status: WorkerStatus | undefined) => {
        if (!status) return null;
        const config = statusConfig[status];
        return (
          <Tag color={config.color as 'grey' | 'green' | 'blue' | 'red' | 'orange'} type="light">
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: t('worker.table.workerGroup'),
      dataIndex: 'group_name',
      key: 'group_name',
      width: 150,
      ellipsis: true,
      render: (groupName: string | null | undefined) => groupName || t('worker.filter.ungrouped'),
    },
    {
      title: t('worker.table.ipAddress'),
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 120,
    },
    {
      title: t('worker.table.clientVersion'),
      dataIndex: 'client_version',
      key: 'client_version',
      width: 180,
      render: (version: string | null, record: WorkerWithUpgrade) => {
        const peers = getDevicePeers(record);
        // 取设备维度的升级状态（同一设备同步）
        const deviceStatus = peers.find((p) => p.upgrade_status && p.upgrade_status !== 'NONE')?.upgrade_status;
        const target = getEnabledVersion(record.desktop_type);
        const upgradable = isUpgradeAvailable(record);

        // 已移除 QUEUED 预约升级逻辑
        if (deviceStatus === 'UPGRADING') {
          const targetVersion = peers.find((p) => p.upgrade_target_version)?.upgrade_target_version || target?.version;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <span>{version}</span>
              <Tooltip content={t('worker.upgrade.upgrading.tooltip', { version: targetVersion })}>
                <Tag
                  color="blue"
                  type="solid"
                  size="small"
                  prefixIcon={<Loader2 size={12} strokeWidth={2} className="upgrade-spin" />}
                >
                  {t('worker.upgrade.upgrading.tag')}
                </Tag>
              </Tooltip>
            </div>
          );
        }
        if (deviceStatus === 'FAILED') {
          const failedReason = peers.find((p) => p.upgrade_failed_reason)?.upgrade_failed_reason
            || record.upgrade_failed_reason
            || t('worker.upgrade.failed.defaultReason');
          const failedPopover = (
            <div style={{ padding: 12, width: 280 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <AlertCircle size={14} strokeWidth={2} color="var(--semi-color-danger)" />
                <Text strong>{t('worker.upgrade.failed.title')}</Text>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="tertiary" size="small">{t('worker.upgrade.failed.reasonLabel')}：</Text>
                <div style={{ marginTop: 4 }}>
                  <Text size="small">{failedReason}</Text>
                </div>
              </div>
              <Button
                theme="solid"
                type="primary"
                size="small"
                icon={<ArrowUpCircle size={14} strokeWidth={2} />}
                block
                onClick={() => triggerUpgrade([record.id])}
              >
                {t('worker.upgrade.failed.retry')}
              </Button>
            </div>
          );
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <span>{version}</span>
              <Popover content={failedPopover} trigger="hover" position="top" showArrow>
                <Tag color="red" type="light" size="small" prefixIcon={<AlertCircle size={12} strokeWidth={2} />} style={{ cursor: 'pointer' }}>
                  {t('worker.upgrade.failed.tag')}
                </Tag>
              </Popover>
            </div>
          );
        }
        if (upgradable && target) {
          const popoverContent = (
            <div style={{ padding: 12, width: 280 }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <ArrowUpCircle size={14} strokeWidth={2} color="var(--semi-color-warning)" />
                <Text strong>{t('worker.upgrade.popover.title')}</Text>
              </div>
              <div style={{ marginBottom: 6 }}>
                <Text type="tertiary" size="small">{t('worker.upgrade.popover.targetVersion')}：</Text>
                <Text size="small" strong>{target.version}</Text>
              </div>
              <div style={{ marginBottom: 6 }}>
                <Text type="tertiary" size="small">{t('worker.upgrade.popover.currentVersion')}：</Text>
                <Text size="small">{version}</Text>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="tertiary" size="small">
                  {t('worker.upgrade.popover.affectedRobots', { count: peers.length })}
                </Text>
                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 96, overflowY: 'auto' }}>
                  {peers.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: p.id === record.id ? 'var(--semi-color-primary)' : 'var(--semi-color-fill-2)',
                        flexShrink: 0,
                      }} />
                      <Text size="small" ellipsis={{ showTooltip: true }} style={{ maxWidth: 180 }}>
                        {p.name}
                      </Text>
                      {p.id === record.id && (
                        <Text size="small" type="tertiary">({t('worker.upgrade.popover.current')})</Text>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button
                theme="solid"
                type="primary"
                size="small"
                icon={<ArrowUpCircle size={14} strokeWidth={2} />}
                block
                onClick={() => triggerUpgrade([record.id])}
              >
                {t('worker.upgrade.popover.button')}
              </Button>
            </div>
          );
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <span>{version}</span>
              <Popover content={popoverContent} trigger="hover" position="top" showArrow>
                <ArrowUpCircle size={14} strokeWidth={2} color="var(--semi-color-warning)" style={{ cursor: 'pointer' }} />
              </Popover>
            </div>
          );
        }
        return version;
      },
    },
    {
      title: t('worker.table.lastHeartbeat'),
      dataIndex: 'last_heartbeat_time',
      key: 'last_heartbeat_time',
      width: 160,
      sorter: true,
    },
    {
      title: t('common.owningDepartment'),
      dataIndex: 'owning_department_name',
      key: 'owning_department_name',
      width: 140,
      ellipsis: true,
      render: (text: string | null) => text || '-',
    },
    {
      title: t('worker.table.receiveTasks'),
      dataIndex: 'receive_tasks',
      key: 'receive_tasks',
      width: 90,
      render: (receiveTasks: boolean, record: LYWorkerResponse) => {
        // 只hasOnline且非故障Status才允许Operation
        const canOperate = record.status !== 'OFFLINE' && record.status !== 'FAULT';
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch 
              checked={receiveTasks} 
              size="small" 
              disabled={!canOperate}
              onChange={(checked) => handleToggleReceiveTasks(record, checked)}
            />
          </div>
        );
      },
    },
    {
      title: t('worker.table.actions'),
      dataIndex: 'action',
      key: 'action',
      width: 60,
      render: (_: unknown, record: LYWorkerResponse) => (
        <Dropdown
          trigger="click"
          position="bottomRight"
          stopPropagation={true}
          clickToHide={true}
          render={
            <Dropdown.Menu>
              <Dropdown.Item 
                icon={<Eye size={16} strokeWidth={2} />} 
                onClick={() => {
                  openDetail(record);
                }}
              >
                {t('worker.actions.viewDetail')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<Key size={16} strokeWidth={2} />}
                onClick={() => {
                  openKeyModal(record);
                }}
              >
                {t('worker.actions.viewKey')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<Pencil size={16} strokeWidth={2} />} 
                onClick={() => {
                  handleEdit(record);
                }}
              >
                {t('worker.actions.edit')}
              </Dropdown.Item>
              {/* 's bot""Operation */}
              {!record.group_id && (
                <Dropdown.Item 
                  icon={<Users size={16} strokeWidth={2} />}
                  onClick={() => {
                    handleAddToGroup(record);
                  }}
                >
                  {t('worker.actions.addToGroup')}
                </Dropdown.Item>
              )}
              {/* Already's bot""Operation */}
              {record.group_id && (
                <Dropdown.Item 
                  icon={<MinusCircle size={16} strokeWidth={2} />}
                  onClick={() => {
                    handleRemoveFromGroup(record);
                  }}
                >
                  {t('worker.actions.removeFromGroup')}
                </Dropdown.Item>
              )}
              <Dropdown.Item
                icon={<UserPlus size={14} strokeWidth={2} />}
                onClick={() => {
                  openCollaborator(record.id);
                }}
              >
                {t('collaborator.actions.addCollaborator')}
              </Dropdown.Item>
              <Dropdown.Item 
                icon={<Trash2 size={16} strokeWidth={2} />} 
                type="danger" 
                onClick={() => {
                  handleDeleteClick(record);
                }}
              >
                {t('worker.actions.delete')}
              </Dropdown.Item>
            </Dropdown.Menu>
          }
        >
          <Button 
            icon={<Ellipsis size={16} strokeWidth={2} />} 
            theme="borderless" 
            onClick={(e) => e.stopPropagation()}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="worker-management">
      {/* Operation */}
      <div className="worker-management-header">
        {/* Operation */}
        <Row type="flex" justify="space-between" align="middle" className="worker-management-header-toolbar">
          <Col>
            <Space>
              <Input 
                prefix={<IconSearchStroked />}
                placeholder={t('worker.searchPlaceholder')}
                className="worker-management-search-input"
                value={searchValue}
                onChange={handleSearch}
              />
              <DepartmentSelect
                placeholder={t('common.filterDepartment')}
                value={departmentFilter}
                onChange={(v) => {
                  setDepartmentFilter(v);
                  setQueryParams(prev => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                useNameAsValue
                style={{ width: 'auto', minWidth: 150, maxWidth: 600 }}
              />
              <Select
                placeholder={t('common.filterGroup')}
                value={filters.group_id}
                onChange={(v) => {
                  setFilters(prev => ({ ...prev, group_id: v as string[] }));
                  setQueryParams(prev => ({ ...prev, offset: 0 }));
                }}
                multiple
                showClear
                maxTagCount={1}
                style={{ width: 'auto', minWidth: 120 }}
                optionList={filterOptions.group_id}
              />
              <FilterPopover
                visible={filterVisible}
                onVisibleChange={setFilterVisible}
                onConfirm={handleFilterConfirm}
                sections={[
                  {
                    key: 'status',
                    label: t('worker.filter.workerStatus'),
                    type: 'checkbox',
                    options: filterOptions.status,
                    value: filters.status,
                  },
                  {
                    key: 'sync_status',
                    label: t('worker.filter.syncStatus'),
                    type: 'checkbox',
                    options: filterOptions.sync_status,
                    value: filters.sync_status,
                  },
                ]}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              {selectedRowKeys.length > 0 && (() => {
                const selectedDevices = aggregateSelectedDevices(list as WorkerWithUpgrade[], selectedRowKeys);
                const hasUpgradable = selectedDevices.some((d) =>
                  d.workers.some(isUpgradeAvailable) && !d.workers.some((w) => w.upgrade_status === 'UPGRADING')
                );
                return (
                  <>
                    <Text type="tertiary" size="small">
                      {t('worker.upgrade.batchSelected', { count: selectedRowKeys.length })}
                    </Text>
                    {hasUpgradable && (
                      <Button
                        icon={<ArrowUpCircle size={16} strokeWidth={2} />}
                        onClick={() => triggerUpgrade(selectedRowKeys)}
                      >
                        {t('worker.upgrade.batchButton')}
                      </Button>
                    )}
                  </>
                );
              })()}
              <Button
                icon={<Plus size={16} strokeWidth={2} />}
                theme="solid"
                type="primary"
                onClick={() => setCreateModalVisible(true)}
              >
                {t('worker.createWorker')}
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Table area */}
      <div className="worker-management-table">
        {isInitialLoad ? (
          <TableSkeleton rows={10} columns={7} columnWidths={['18%', '10%', '15%', '12%', '10%', '15%', '10%']} />
        ) : (
          <Table 
            size="small"
            columns={columns} 
            dataSource={list}
            loading={loading}
            rowKey="id"
            empty={
              <EmptyState 
                variant={queryParams.keyword || departmentFilter.length > 0 || hasActiveFilters ? 'noResult' : 'noData'}
                description={queryParams.keyword || departmentFilter.length > 0 || hasActiveFilters ? t('common.noResult') : t('worker.noData')} 
              />
            }
            onRow={(record) => {
              const isSelected = selectedWorker?.id === record?.id && detailDrawerVisible;
              return {
                id: `worker-row-${record?.id}`,
                onClick: () => openDetail(record as LYWorkerResponse),
                className: isSelected ? 'worker-management-row-selected' : undefined,
                style: { cursor: 'pointer' },
              };
            }}
            onChange={({ sorter }) => {
              if (sorter) {
                const { dataIndex, sortOrder } = sorter as { dataIndex?: string; sortOrder?: 'ascend' | 'descend' };
                setSortState({
                  sortBy: sortOrder ? dataIndex : undefined,
                  sortOrder: sortOrder || undefined,
                });
              }
            }}
            pagination={false}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys((keys || []) as string[]),
            }}
          />
        )}
        {total > 0 && (
          <div className="list-pagination">
            <Text type="tertiary">
              {t('common.showingRecords', {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, total),
                total,
              })}
            </Text>
            <div className="list-pagination-right">
              <Text type="tertiary">{t('common.totalPages', { total: Math.ceil(total / pageSize) })}</Text>
              <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                onPageChange={(page: number) => {
                  setQueryParams(prev => ({ ...prev, offset: (page - 1) * pageSize }));
                }}
                onPageSizeChange={(newPageSize: number) => setQueryParams(prev => ({ ...prev, offset: 0, size: newPageSize }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Details drawer */}
      <WorkerDetailDrawer
        visible={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setDetailInitialTab('basic'); }}
        workerData={selectedWorker}
        onEdit={handleEditFromDrawer}
        onViewKey={() => {
          if (selectedWorker) {
            setKeyModalWorker(selectedWorker);
            setKeyModalVisible(true);
          }
        }}
        onDelete={handleDeleteFromDrawer}
        onToggleReceiveTasks={handleToggleReceiveTasks}
        onAddToGroup={(worker) => {
          setAddToGroupWorker(worker);
          setAddToGroupModalVisible(true);
        }}
        onRemoveFromGroup={handleRemoveFromGroup}
        dataList={list}
        onNavigate={(worker) => setSelectedWorker(worker)}
        pagination={{
          currentPage,
          totalPages: Math.ceil(total / pageSize),
          pageSize,
          total,
        }}
        onPageChange={handleDrawerPageChange}
        onScrollToRow={(id) => {
          const row = document.getElementById(`worker-row-${id}`);
          row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }}
        onUpgradeDevice={(worker) => triggerUpgrade([worker.id])}
      />

      {/* Modal */}
      <WorkerKeyModal
        visible={keyModalVisible}
        onClose={() => setKeyModalVisible(false)}
        workerData={keyModalWorker}
      />

      {/* Create modal */}
      <CreateWorkerModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit modal */}
      <EditWorkerModal
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        workerData={editingWorker}
        onSuccess={handleEditSuccess}
      />

      {/* Modal */}
      <AddToGroupModal
        visible={addToGroupModalVisible}
        onCancel={() => setAddToGroupModalVisible(false)}
        workerData={addToGroupWorker}
        onSuccess={handleAddToGroupSuccess}
      />

      <UpgradeDeviceModal
        visible={upgradeModalVisible}
        onCancel={() => setUpgradeModalVisible(false)}
        onOk={handleConfirmUpgrade}
        devices={upgradeDevices}
      />

      {renderCollaboratorPanel('WORKER', 'scheduling')}
    </div>
  );
};

export default WorkerManagement;
