import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LocaleProvider } from '@douyinfe/semi-ui';
import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import { useTranslation } from 'react-i18next';
import AppLayout from "@/components/layout/AppLayout";
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
import OperationsDashboard from "@/pages/Operations/Dashboard";
import ROIAnalysis from "@/pages/Operations/ROIAnalysis";
import ResourceEfficiency from "@/pages/Operations/ResourceEfficiency";
import BusinessOutcomes from "@/pages/Operations/BusinessOutcomes";
import CostManagement from "@/pages/Operations/CostManagement";
import PlatformOperations from "@/pages/Operations/PlatformOperations";
// Requirements & Other
import RequirementsWorkbench from "@/pages/Requirements/RequirementsWorkbench";
import RequirementsReview from "@/pages/Requirements/RequirementsReview";
import RequirementsTeam from "@/pages/Requirements/RequirementsTeam";
// Maintenance
import MaintenanceWorkbench from "@/pages/Maintenance/MaintenanceWorkbench";
// Sharing Center
import CreatorComponents from "@/pages/Sharing/Components/CreatorComponents";
import APASkills from "@/pages/Sharing/Skills/APASkills";
import ACPSkills from "@/pages/Sharing/Skills/ACPSkills";
import Showcases from "@/pages/Sharing/Showcases";

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
          <Route path="/requirements/review" element={<RequirementsReview />} />
          <Route path="/requirements/team" element={<RequirementsTeam />} />
          <Route path="/operations" element={<Navigate to="/operations/dashboard" replace />} />
          <Route path="/operations/dashboard" element={<OperationsDashboard />} />
          <Route path="/operations/roi-analysis" element={<ROIAnalysis />} />
          <Route path="/operations/resource-efficiency" element={<ResourceEfficiency />} />
          <Route path="/operations/business-outcomes" element={<BusinessOutcomes />} />
          <Route path="/operations/cost-management" element={<CostManagement />} />
          <Route path="/operations/platform-operations" element={<PlatformOperations />} />
          <Route path="/maintenance" element={<MaintenanceWorkbench />} />
          {/* 共享中心 */}
          <Route path="/sharing" element={<Navigate to="/sharing/components/creator" replace />} />
          <Route path="/sharing/components/creator" element={<CreatorComponents />} />
          <Route path="/sharing/skills/apa" element={<APASkills />} />
          <Route path="/sharing/skills/acp" element={<ACPSkills />} />
          <Route path="/sharing/showcases" element={<Showcases />} />
        </Route>

        {/* 无布局页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
  </LocaleProvider>
  );
};

export default App;
