import { useTranslation } from 'react-i18next';

const WelcomeSection = () => {
  const { t } = useTranslation();

  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="home-welcome">
      <h1 className="home-welcome-title">
        {t('homepage.welcomePrefix', 'Hi ')}
        <span className="home-welcome-name">张三</span>
        {t('homepage.welcomeSuffix', '，欢迎回来')}
        <span className="home-welcome-wave"> 👋</span>
      </h1>
      <div className="home-welcome-date">{dateStr}</div>
    </div>
  );
};

export default WelcomeSection;
