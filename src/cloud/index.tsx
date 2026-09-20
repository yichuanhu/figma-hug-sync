import { Routes, Route, Navigate } from 'react-router-dom';
import CloudLayout from '@/cloud/layout/CloudLayout';
import CloudHome from '@/cloud/pages/CloudHome';
import TeamManagement from '@/cloud/pages/TeamManagement';
import Billing from '@/cloud/pages/Billing';

/**
 * 公有云板块入口：与私有部署完全隔离，仅在 App.tsx 中以 /cloud/* 挂载。
 */
const CloudApp = () => (
  <Routes>
    <Route element={<CloudLayout />}>
      <Route index element={<Navigate to="/cloud/home" replace />} />
      <Route path="home" element={<CloudHome />} />
      <Route path="teams" element={<TeamManagement />} />
      <Route path="billing" element={<Billing />} />
      <Route path="billing/:tab" element={<Billing />} />
      <Route path="*" element={<Navigate to="/cloud/home" replace />} />
    </Route>
  </Routes>
);

export default CloudApp;
