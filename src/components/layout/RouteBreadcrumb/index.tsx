import { useLocation, useNavigate, matchPath } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Breadcrumb } from '@douyinfe/semi-ui';
import { routeConfigs } from '@/router/routes';
import { useBreadcrumbParams } from '@/router/BreadcrumbContext';

const RouteBreadcrumb = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { params: contextParams } = useBreadcrumbParams();

  // 查找匹配的路由配置
  const matched = routeConfigs.find(config =>
    matchPath(config.path, location.pathname)
  );

  if (!matched || matched.breadcrumb.length === 0) return null;

  // 提取 URL 参数
  const match = matchPath(matched.path, location.pathname);
  const urlParams = match?.params || {};

  return (
    <div className="app-layout-breadcrumb">
      <Breadcrumb>
        {matched.breadcrumb.map((item, index) => {
          const isLast = index === matched.breadcrumb.length - 1;
          const label = item.paramKey
            ? (contextParams[item.paramKey] || urlParams[item.paramKey] || item.paramKey)
            : t(item.labelKey);

          return (
            <Breadcrumb.Item
              key={index}
              onClick={!isLast && item.path ? () => navigate(item.path!) : undefined}
            >
              {label}
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    </div>
  );
};

export default RouteBreadcrumb;
