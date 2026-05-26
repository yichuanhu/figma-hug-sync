/**
 * 审批模板页面
 *
 * 合并「发布审批模板」与「停用审批模板」为单一菜单，
 * 通过 Tabs 切换两种业务类型，内部复用 ApprovalConfigPage。
 */
import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabPane } from '@douyinfe/semi-ui';
import ApprovalConfigPage from '@/pages/Requirements/ApprovalConfig';
import './index.less';

type TabKey = 'publish' | 'offline';

const ApprovalTemplatesPage = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const activeKey: TabKey = useMemo(() => {
    return pathname.includes('/offline') ? 'offline' : 'publish';
  }, [pathname]);

  const handleChange = (key: string) => {
    navigate(`/dev-center/approval-templates/${key}`);
  };

  return (
    <div className="approval-templates-page">
      <Tabs
        type="line"
        activeKey={activeKey}
        onChange={handleChange}
        className="approval-templates-tabs"
      >
        <TabPane tab="发布审批" itemKey="publish" />
        <TabPane tab="停用审批" itemKey="offline" />
      </Tabs>
      <div className="approval-templates-body">
        {activeKey === 'publish' ? (
          <ApprovalConfigPage
            key="publish"
            businessType="PROCESS_PUBLISH"
            basePath="/dev-center/approval-templates/publish"
            pageTitle="发布审批模板"
            pageDescription="为流程发布配置审批流并绑定到部门"
            createButtonText="新建发布审批"
          />
        ) : (
          <ApprovalConfigPage
            key="offline"
            businessType="PROCESS_OFFLINE"
            basePath="/dev-center/approval-templates/offline"
            pageTitle="停用审批模板"
            pageDescription="为流程下线配置审批流并绑定到部门"
            createButtonText="新建停用审批"
          />
        )}
      </div>
    </div>
  );
};

export default ApprovalTemplatesPage;
