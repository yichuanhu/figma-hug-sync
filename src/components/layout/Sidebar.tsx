import { Nav } from '@douyinfe/semi-ui';
import { 
  IconHome, 
  IconList, 
  IconCode, 
  IconSetting, 
  IconServer, 
  IconBell, 
  IconBookStroked, 
  IconDownload,
  IconFlowChartStroked,
  IconComponentStroked,
  IconTestScoreStroked,
  IconPulse
} from '@douyinfe/semi-icons';

interface SidebarProps {
  collapsed: boolean;
}

const Sidebar = ({ collapsed }: SidebarProps) => {
  return (
    <Nav
      style={{ height: '100%', maxWidth: collapsed ? 60 : 180 }}
      defaultSelectedKeys={['流程开发']}
      defaultOpenKeys={['开发中心']}
      isCollapsed={collapsed}
      items={[
        { itemKey: '首页', text: '首页', icon: <IconHome /> },
        { 
          itemKey: '需求中心', 
          text: '需求中心', 
          icon: <IconList />,
        },
        { 
          itemKey: '开发中心', 
          text: '开发中心', 
          icon: <IconCode />,
          items: [
            { itemKey: '流程开发', text: '流程开发', icon: <IconFlowChartStroked /> },
            { itemKey: '组件开发', text: '组件开发', icon: <IconComponentStroked /> },
            { itemKey: '测试与质量', text: '测试与质量', icon: <IconTestScoreStroked /> },
            { itemKey: '开发效能', text: '开发效能', icon: <IconPulse /> },
          ]
        },
        { 
          itemKey: '调度中心', 
          text: '调度中心', 
          icon: <IconSetting />,
        },
        { 
          itemKey: '运营中心', 
          text: '运营中心', 
          icon: <IconServer />,
        },
        { 
          itemKey: '运维中心', 
          text: '运维中心', 
          icon: <IconServer />,
        },
      ]}
      footer={{
        collapseButton: false,
      }}
    />
  );
};

export default Sidebar;
