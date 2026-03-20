import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Avatar, Popover } from '@douyinfe/semi-ui';
import { UserInfoDropdown } from '../UserInfoDropdown';
import laiyeLogo from '@/assets/laiye-logo.png';
import './index.less';

const HomeTopBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="home-top-bar">
      <div className="home-top-bar-logo">
        <img src={laiyeLogo} alt="Laiye" className="home-top-bar-logo-img" />
      </div>
      <div className="home-top-bar-right">
        <Popover
          trigger="hover"
          position="bottomRight"
          showArrow={false}
          spacing={4}
          mouseLeaveDelay={100}
          mouseEnterDelay={0}
          content={
            <UserInfoDropdown
              name="Ling hui"
              username="alim huang"
              companyName="来也科技股份有限公司有限..."
              actions={[
                {
                  key: 'admin',
                  label: t('sidebar.userMenu.adminConsole'),
                },
                {
                  key: 'settings',
                  label: t('sidebar.userMenu.personalCenter'),
                  onClick: () => navigate('/personal-center/personal-credentials'),
                },
                {
                  key: 'logout',
                  label: t('sidebar.userMenu.logout'),
                },
              ]}
            />
          }
        >
          <Avatar size="small" className="home-top-bar-avatar">
            L
          </Avatar>
        </Popover>
      </div>
    </div>
  );
};

export default HomeTopBar;
