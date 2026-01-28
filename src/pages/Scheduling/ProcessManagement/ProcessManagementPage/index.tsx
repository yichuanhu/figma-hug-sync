import AppLayout from '@/components/layout/AppLayout';
import ProcessManagementContent from '@/components/ProcessManagement/ProcessManagementContent';

const SchedulingProcessManagementPage = () => {
  return (
    <AppLayout>
      <ProcessManagementContent context="scheduling" />
    </AppLayout>
  );
};

export default SchedulingProcessManagementPage;
