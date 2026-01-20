import routes, { AppRouteObject } from './index';

export interface BreadcrumbItem {
  title: string;
  path?: string;
}

/**
 * 根据当前路径生成面包屑数据
 * @param pathname 当前路由路径
 * @returns 面包屑数组
 */
export const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  const findRoute = (
    routeList: AppRouteObject[],
    currentPath: string,
    parentPath: string = '',
    parentBreadcrumbs: BreadcrumbItem[] = []
  ): boolean => {
    for (const route of routeList) {
      const fullPath = route.path?.startsWith('/') 
        ? route.path 
        : `${parentPath}/${route.path || ''}`.replace(/\/+/g, '/');
      
      // 处理动态路由参数
      const pathPattern = fullPath.replace(/:\w+/g, '[^/]+');
      const regex = new RegExp(`^${pathPattern}$`);
      
      const currentBreadcrumbs = [...parentBreadcrumbs];
      if (route.meta?.title) {
        currentBreadcrumbs.push({
          title: route.meta.title,
          path: route.children ? undefined : fullPath,
        });
      }
      
      if (regex.test(currentPath)) {
        breadcrumbs.push(...currentBreadcrumbs);
        return true;
      }
      
      if (route.children) {
        if (findRoute(route.children, currentPath, fullPath, currentBreadcrumbs)) {
          return true;
        }
      }
    }
    return false;
  };
  
  findRoute(routes, pathname);
  
  return breadcrumbs;
};
