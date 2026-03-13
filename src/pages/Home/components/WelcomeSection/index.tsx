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
        {t('homepage.welcome', { name: '张三' })}
      </h1>
      <div className="home-welcome-date">{dateStr}</div>
    </div>
  );
};

export default WelcomeSection;
