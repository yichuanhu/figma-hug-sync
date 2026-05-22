import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";

const LegacyAssetDetailRedirect = () => {
  const { type, id } = useParams();
  return <Navigate to={`/sharing-center/market/${type}/${id}`} replace />;
};
import { LocaleProvider } from '@douyinfe/semi-ui';
import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import { useTranslation } from 'react-i18next';
import AppLayout from "@/components/layout/AppLayout";
import { LicenseProvider } from "@/contexts/LicenseContext";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
// Development
import ProcessDevelopment from "@/pages/Development/ProcessDevelopment";
import CredentialManagementPage from "@/pages/Development/CredentialManagement/CredentialManagementPage";
import ParameterManagementPage from "@/pages/Development/ParameterManagement/ParameterManagementPage";
import DevQueueManagementPage from "@/pages/Development/QueueManagement/QueueManagementPage";
import DevQueueMessagesPage from "@/pages/Development/QueueManagement/QueueMessagesPage";
import DevFileManagementPage from "@/pages/Development/FileManagement/FileManagementPage";
// Release Management
import ReleaseListPage from "@/pages/Development/ReleaseManagement/ReleaseListPage";
import CreateReleasePage from "@/pages/Development/ReleaseManagement/CreateReleasePage";
// Scheduling - Worker Management
import WorkerManagementPage from "@/pages/Scheduling/WorkerManagement/WorkerManagementPage";
// Scheduling - Credential Management
import SchedulingCredentialManagementPage from "@/pages/Scheduling/CredentialManagement/CredentialManagementPage";
// Scheduling - Process Management
import SchedulingProcessManagementPage from "@/pages/Scheduling/ProcessManagement/ProcessManagementPage";
// Scheduling - Parameter Management
import SchedulingParameterManagementPage from "@/pages/Scheduling/ParameterManagement/ParameterManagementPage";
// Scheduling - Queue Management
import SchedulingQueueManagementPage from "@/pages/Scheduling/QueueManagement/QueueManagementPage";
import SchedulingQueueMessagesPage from "@/pages/Scheduling/QueueManagement/QueueMessagesPage";
// Scheduling - File Management
import SchedulingFileManagementPage from "@/pages/Scheduling/FileManagement/FileManagementPage";
// Scheduling - Task Management
import TaskManagementPage from "@/pages/Scheduling/TaskManagement/TaskManagementPage";
// Scheduling - Task Log
import TaskLogPage from "@/pages/Scheduling/TaskManagement/TaskLogPage";
// Scheduling - Recording View
import RecordingViewPage from "@/pages/Scheduling/TaskManagement/RecordingViewPage";
// Scheduling - Template Management
import TemplateManagementPage from "@/pages/Scheduling/TemplateManagement/TemplateManagementPage";
// Scheduling - Auto Execution Policy
import AutoExecutionPolicyPage from "@/pages/Scheduling/AutoExecutionPolicy/AutoExecutionPolicyPage";
// Scheduling - Work Calendar Management
import WorkCalendarManagement from "@/pages/Scheduling/WorkCalendarManagement";
// Personal Center
import PersonalCenter from "@/pages/PersonalCenter";
// Dev Preview
import EmptyStatePreview from "@/pages/DevPreview/EmptyStatePreview";
import EmptyStateOptionsPreview from "@/pages/DevPreview/EmptyStateOptionsPreview";
// Operations
import ResourceEfficiency from "@/pages/Operations/ResourceEfficiency";
import BusinessOutcomes from "@/pages/Operations/BusinessOutcomes";
import MetricsConfig from "@/pages/Operations/MetricsConfig";
import PlatformOperations from "@/pages/Operations/PlatformOperations";
import CostManagement from "@/pages/Operations/CostManagement";
// Requirements & Other
import RequirementsWorkbench from "@/pages/Requirements/RequirementsWorkbench";
import RequirementCreatePage from "@/pages/Requirements/RequirementsWorkbench/components/RequirementCreatePage";
import RequirementsReview from "@/pages/Requirements/RequirementsReview";
import RequirementsAssessment from "@/pages/Requirements/RequirementsAssessment";

import RequirementsScheme from "@/pages/Requirements/RequirementsScheme";
import SchemeBuilderPage from "@/pages/Requirements/RequirementsScheme/components/SchemeBuilder";
import ApprovalConfigPage from "@/pages/Requirements/ApprovalConfig";
import ApprovalFlowBuilderPage from "@/pages/Requirements/ApprovalConfig/components/ApprovalFlowBuilder";

import RequirementsProjects from "@/pages/Requirements/RequirementsProjects";
// Maintenance
import MaintenanceWorkbench from "@/pages/Maintenance/MaintenanceWorkbench";
import MaintenanceConfig from "@/pages/Maintenance/ConfigManagement";
import SystemMetricsPage from "@/pages/Maintenance/Dashboard/SystemMetricsPage";
import MiddlewareStatusPage from "@/pages/Maintenance/Dashboard/MiddlewareStatusPage";
// Sharing Center - Asset Market
import MarketHome from "@/pages/Sharing/Market/MarketHome";
import WorkflowMarket from "@/pages/Sharing/Market/WorkflowMarket";
import SnippetMarket from "@/pages/Sharing/Market/SnippetMarket";
import KnowledgeMarket from "@/pages/Sharing/Market/KnowledgeMarket";
import SkillMarket from "@/pages/Sharing/Market/SkillMarket";
import AssetDetail from "@/pages/Sharing/Market/AssetDetail";
import EditDisplay from "@/pages/Sharing/Market/EditDisplay";
// Sharing Center - 我的共享 / 审批 / 配置
import MySharedPage from "@/pages/SharingCenter/MyShared";
import KnowledgeCreatePage from "@/pages/SharingCenter/MyShared/Create/Knowledge";

import MySharedEditPage from "@/pages/SharingCenter/MyShared/Edit";
import MySharedVersionsPage from "@/pages/SharingCenter/MyShared/Versions";
import DevCenterPublishPage from "@/pages/SharingCenter/MyShared/Publish";
import SupplyAssetDetail from "@/pages/SharingCenter/MyShared/Detail";
import SupplierGuard from "@/pages/SharingCenter/MyShared/components/SupplierGuard";
import ApprovalsListPage from "@/pages/SharingCenter/Approvals/List";
import ApprovalDetailPage from "@/pages/SharingCenter/Approvals/Detail";
import ApprovalLevelsPage from "@/pages/SharingCenter/Admin/ApprovalLevels";
import PermissionsPage from "@/pages/SharingCenter/Admin/Permissions";
// Notification Center
import NotificationCenter from "@/pages/NotificationCenter";


const queryClient = new QueryClient();

const semiLocaleMap: Record<string, any> = {
  'en': en_US,
  'en-US': en_US,
  'zh-CN': zh_CN,
};

const App = () => {
  const { i18n } = useTranslation();
  const semiLocale = semiLocaleMap[i18n.language] || zh_CN;

  return (
  <LocaleProvider locale={semiLocale}>
  <LicenseProvider>
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* 所有带侧边栏布局的页面 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/process-development" element={<ProcessDevelopment />} />
          
          <Route path="/scheduling-center/resource-monitoring/worker-management" element={<WorkerManagementPage />} />
          
          
          {/* 凭据管理 */}
          <Route path="/dev-center/business-assets/credentials" element={<CredentialManagementPage />} />
          <Route path="/scheduling-center/business-assets/credentials" element={<SchedulingCredentialManagementPage />} />
          
          {/* 参数管理 */}
          <Route path="/dev-center/business-assets/parameters" element={<ParameterManagementPage />} />
          <Route path="/scheduling-center/business-assets/parameters" element={<SchedulingParameterManagementPage />} />
          
          {/* 队列管理 */}
          <Route path="/dev-center/business-assets/queues" element={<DevQueueManagementPage />} />
          <Route path="/dev-center/business-assets/queues/:queueId/messages" element={<DevQueueMessagesPage />} />
          <Route path="/scheduling-center/business-assets/queues" element={<SchedulingQueueManagementPage />} />
          <Route path="/scheduling-center/business-assets/queues/:queueId/messages" element={<SchedulingQueueMessagesPage />} />
          
          {/* 文件管理 */}
          <Route path="/dev-center/business-assets/files" element={<DevFileManagementPage />} />
          <Route path="/scheduling-center/business-assets/files" element={<SchedulingFileManagementPage />} />
          
          {/* 发布管理 */}
          <Route path="/dev-center/release-management" element={<ReleaseListPage />} />
          <Route path="/dev-center/release-management/create" element={<CreateReleasePage />} />
          
          {/* 自动化流程 - 调度中心 */}
          <Route path="/scheduling-center/execution-assets/automation-process" element={<SchedulingProcessManagementPage />} />
          
          {/* 任务执行 */}
          <Route path="/scheduling-center/task-execution/templates" element={<TemplateManagementPage />} />
          <Route path="/scheduling-center/task-execution/auto-execution-policy" element={<AutoExecutionPolicyPage />} />
          <Route path="/scheduling-center/task-execution/work-calendar" element={<WorkCalendarManagement />} />
          <Route path="/scheduling-center/task-execution/task-list" element={<TaskManagementPage />} />
          <Route path="/scheduling-center/task-execution/task-list/:executionId/logs" element={<TaskLogPage />} />
          <Route path="/scheduling-center/task-execution/task-list/:executionId/recording" element={<RecordingViewPage />} />
          
          {/* 个人中心 */}
          <Route path="/personal-center" element={<PersonalCenter />} />
          <Route path="/personal-center/personal-credentials" element={<PersonalCenter />} />
          <Route path="/personal-center/settings" element={<PersonalCenter />} />
          
          {/* 开发预览 */}
          <Route path="/dev-preview/empty-state" element={<EmptyStatePreview />} />
          <Route path="/dev-preview/empty-state-options" element={<EmptyStateOptionsPreview />} />
          
          {/* 需求中心 */}
          <Route path="/requirements" element={<Navigate to="/requirements/list" replace />} />
          <Route path="/requirements/list" element={<RequirementsWorkbench />} />
          <Route path="/requirements/list/create" element={<RequirementCreatePage />} />
          <Route path="/requirements/list/edit/:id" element={<RequirementCreatePage />} />
          <Route path="/requirements/review" element={<RequirementsReview />} />
          <Route path="/requirements/assessment" element={<RequirementsAssessment />} />
          
          <Route path="/requirements/scheme" element={<RequirementsScheme />} />
          <Route path="/requirements/scheme/builder/:id" element={<SchemeBuilderPage />} />
          <Route path="/requirements/approval-config" element={<ApprovalConfigPage />} />
          <Route path="/requirements/approval-config/builder/:id" element={<ApprovalFlowBuilderPage />} />
          <Route path="/requirements/approval-config/detail/:id" element={<ApprovalFlowBuilderPage />} />
          <Route path="/requirements/approval-config/*" element={<Navigate to="/requirements/approval-config" replace />} />
          
          <Route path="/requirements/projects" element={<RequirementsProjects />} />
          <Route path="/operations" element={<Navigate to="/operations/business-outcomes" replace />} />
          <Route path="/operations/dashboard" element={<Navigate to="/operations/business-outcomes" replace />} />
          <Route path="/operations/roi-analysis" element={<Navigate to="/operations/business-outcomes" replace />} />
          <Route path="/operations/resource-efficiency" element={<ResourceEfficiency />} />
          <Route path="/operations/business-outcomes" element={<BusinessOutcomes />} />
          <Route path="/operations/metrics-config" element={<MetricsConfig />} />
          <Route path="/operations/platform-operations" element={<PlatformOperations />} />
          <Route path="/operations/cost-management" element={<CostManagement />} />
          <Route path="/maintenance" element={<Navigate to="/maintenance/config" replace />} />
          <Route path="/maintenance/workbench" element={<MaintenanceWorkbench />} />
          <Route path="/maintenance/config" element={<MaintenanceConfig />} />
          <Route path="/maintenance/config/system-params" element={<MaintenanceConfig />} />
          <Route path="/maintenance/config/service-params" element={<MaintenanceConfig />} />
          <Route path="/maintenance/config/infrastructure" element={<MaintenanceConfig />} />
          <Route path="/maintenance/config/monitoring" element={<MaintenanceConfig />} />
          <Route path="/maintenance/config/logger" element={<MaintenanceConfig />} />
          <Route path="/maintenance/dashboard/system-metrics" element={<SystemMetricsPage />} />
          <Route path="/maintenance/dashboard/middleware-status" element={<MiddlewareStatusPage />} />
          {/* 共享中心 - 新路由 /sharing-center */}
          <Route path="/sharing-center" element={<Navigate to="/sharing-center/market" replace />} />
          <Route path="/sharing-center/market" element={<MarketHome />} />
          <Route path="/sharing-center/market/workflow" element={<WorkflowMarket />} />
          <Route path="/sharing-center/market/snippet" element={<SnippetMarket />} />
          <Route path="/sharing-center/market/knowledge" element={<KnowledgeMarket />} />
          <Route path="/sharing-center/market/skill" element={<SkillMarket />} />
          <Route path="/sharing-center/market/:type/:id/edit-display" element={<EditDisplay />} />
          <Route path="/sharing-center/market/:type/:id" element={<AssetDetail />} />
          {/* 资产上架（FEAT-107）— R-05：仅供应商可访问 */}
          <Route path="/sharing-center/my-published" element={<SupplierGuard><MySharedPage /></SupplierGuard>} />
          <Route path="/sharing-center/my-published/:type/:id" element={<SupplierGuard><SupplyAssetDetail /></SupplierGuard>} />
          <Route path="/sharing-center/my-published/:type/:id/publish" element={<SupplierGuard><DevCenterPublishPage /></SupplierGuard>} />
          <Route path="/sharing-center/market/knowledge/create" element={<SupplierGuard><KnowledgeCreatePage /></SupplierGuard>} />

          <Route path="/sharing-center/market/:type/:id/edit" element={<SupplierGuard><MySharedEditPage /></SupplierGuard>} />
          <Route path="/sharing-center/my-published/:id/versions" element={<SupplierGuard><MySharedVersionsPage /></SupplierGuard>} />
          {/* 旧路径兼容 */}
          <Route path="/sharing-center/my-shared" element={<Navigate to="/sharing-center/my-published" replace />} />
          <Route path="/sharing-center/my-shared/create/knowledge" element={<Navigate to="/sharing-center/market/knowledge/create" replace />} />
          
          <Route path="/sharing-center/my-shared/edit/:id" element={<MySharedEditPage />} />
          <Route path="/sharing-center/my-shared/:id/versions" element={<MySharedVersionsPage />} />
          <Route path="/sharing-center/approvals" element={<ApprovalsListPage />} />
          <Route path="/sharing-center/approvals/:id" element={<ApprovalDetailPage />} />
          <Route path="/sharing-center/admin/approval-levels" element={<ApprovalLevelsPage />} />
          <Route path="/sharing-center/admin/permissions" element={<PermissionsPage />} />

          {/* 旧 /sharing 路径 → 新 /sharing-center 兜底 */}
          <Route path="/sharing" element={<Navigate to="/sharing-center/market" replace />} />
          <Route path="/sharing/market" element={<Navigate to="/sharing-center/market" replace />} />
          <Route path="/sharing/market/workflow" element={<Navigate to="/sharing-center/market/workflow" replace />} />
          <Route path="/sharing/market/snippet" element={<Navigate to="/sharing-center/market/snippet" replace />} />
          <Route path="/sharing/market/knowledge" element={<Navigate to="/sharing-center/market/knowledge" replace />} />
          <Route path="/sharing/market/skill" element={<Navigate to="/sharing-center/market/skill" replace />} />
          <Route path="/sharing/market/:type/:id" element={<LegacyAssetDetailRedirect />} />
          <Route path="/sharing/components/creator" element={<Navigate to="/sharing-center/market/snippet" replace />} />
          <Route path="/sharing/skills/apa" element={<Navigate to="/sharing-center/market/skill" replace />} />
          <Route path="/sharing/skills/acp" element={<Navigate to="/sharing-center/market/skill" replace />} />
          <Route path="/sharing/showcases" element={<Navigate to="/sharing-center/market" replace />} />
          {/* 通知中心 */}
          <Route path="/notification-center" element={<NotificationCenter />} />
        </Route>

        {/* 无布局页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </BrowserRouter>
  </QueryClientProvider>
  </LicenseProvider>
  </LocaleProvider>
  );
};

export default App;
