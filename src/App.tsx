import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Index from "@/pages/Index";
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
import OperationsWorkbench from "@/pages/Operations/OperationsWorkbench";
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
// Maintenance
import MaintenanceWorkbench from "@/pages/Maintenance/MaintenanceWorkbench";
// Requirements
import RequirementsWorkbench from "@/pages/Requirements/RequirementsWorkbench";
// Scheduling
import SchedulingWorkbench from "@/pages/Scheduling/SchedulingWorkbench";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        {/* 所有带侧边栏布局的页面 */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/process-development" element={<ProcessDevelopment />} />
          
          <Route path="/scheduling-center/resource-monitoring/worker-management" element={<WorkerManagementPage />} />
          <Route path="/development-workbench" element={<DevelopmentWorkbench />} />
          <Route path="/scheduling-workbench" element={<SchedulingWorkbench />} />
          <Route path="/operations-workbench" element={<OperationsWorkbench />} />
          <Route path="/requirements-workbench" element={<RequirementsWorkbench />} />
          <Route path="/maintenance-workbench" element={<MaintenanceWorkbench />} />
          
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
        </Route>

        {/* 无布局页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
