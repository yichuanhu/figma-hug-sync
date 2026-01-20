import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button, Typography } from "@douyinfe/semi-ui";
import './NotFound.less';

const { Title, Text } = Typography;

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="not-found">
      <div className="not-found-content">
        <Title heading={1} className="not-found-title">404</Title>
        <Text type="tertiary" className="not-found-text">
          页面未找到
        </Text>
        <Button theme="solid" type="primary" onClick={() => window.location.href = '/'}>
          返回首页
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
