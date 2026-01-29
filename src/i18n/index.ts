import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 预加载翻译资源，确保在 i18n.init 前资源已就绪
async function loadResources(): Promise<Record<string, unknown>> {
  try {
    const response = await fetch('/i18n/zh-CN.json', {
      cache: 'no-store',
    });
    if (!response.ok) {
      console.error('[i18n] Failed to load zh-CN.json:', response.status);
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('[i18n] Error loading zh-CN.json:', error);
    return {};
  }
}

// 创建初始化 Promise，确保 i18n 在应用渲染前完成加载
const initPromise = loadResources().then((zhCN) => {
  return i18n
    .use(initReactI18next)
    .init({
      resources: {
        'zh-CN': {
          translation: zhCN,
        },
      },
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      supportedLngs: ['zh-CN'],
      ns: ['translation'],
      defaultNS: 'translation',
      keySeparator: '.',
      nsSeparator: ':',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
});

export { initPromise };
export default i18n;
