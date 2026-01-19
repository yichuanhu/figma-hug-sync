import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button, Typography } from "@douyinfe/semi-ui";

const { Title, Text } = Typography;

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--semi-color-fill-0)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <Title heading={1} style={{ marginBottom: 16 }}>404</Title>
        <Text type="tertiary" style={{ display: 'block', marginBottom: 16, fontSize: 18 }}>
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
