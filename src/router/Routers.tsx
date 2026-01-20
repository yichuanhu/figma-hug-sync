import { Routes, Route } from 'react-router-dom';
import routes, { AppRouteObject } from './index';
import NotFound from '@/pages/NotFound';
import AppLayout from '@/components/layout/AppLayout';

// 递归渲染路由
const renderRoutes = (routeList: AppRouteObject[]) => {
  return routeList.map((route) => {
    if (route.children && route.children.length > 0) {
      return (
        <Route key={route.path} path={route.path} element={route.element}>
          {renderRoutes(route.children)}
        </Route>
      );
    }
    return <Route key={route.path} path={route.path} element={route.element} />;
  });
};

const Routers = () => {
  return (
    <AppLayout>
      <Routes>
        {renderRoutes(routes)}
        {/* 404 页面 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

export default Routers;
