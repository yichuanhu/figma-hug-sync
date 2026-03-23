import { useTranslation } from 'react-i18next';
import waveHandIcon from '@/assets/wave-hand.svg';

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
        <span className="home-welcome-name">John Smith</span>
        {t('homepage.welcomeSuffix', ', welcome back')}
        <img src={waveHandIcon} alt="wave" className="home-welcome-wave-icon" />
      </h1>
      <div className="home-welcome-date">{dateStr}</div>
    </div>
  );
};

export default WelcomeSection;
