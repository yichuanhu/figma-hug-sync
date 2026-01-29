import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

type TranslationResource = Record<string, unknown>;

// 创建初始化 Promise，确保 i18n 在应用渲染前完成加载
// 注意：这里采用“先 fetch 资源再 init”的方式，避免 HttpBackend 在某些环境下资源未挂载导致全站显示 key。
const initPromise = (async () => {
  let zhCN: TranslationResource = {};

  try {
    const resp = await fetch('/i18n/zh-CN.json', { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`Failed to load /i18n/zh-CN.json: ${resp.status}`);
    }
    zhCN = (await resp.json()) as TranslationResource;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[i18n] load zh-CN.json failed', err);
  }

  await i18n
    .use(initReactI18next)
    .init({
      // 显式声明默认命名空间与分隔符，避免 key 解析差异
      ns: ['translation'],
      defaultNS: 'translation',
      keySeparator: '.',
      nsSeparator: ':',
      debug: import.meta.env.DEV,
      lng: 'zh-CN',
      fallbackLng: 'zh-CN',
      supportedLngs: ['zh-CN'],
      load: 'currentOnly',
      returnNull: false,
      returnEmptyString: false,
      resources: {
        'zh-CN': {
          translation: zhCN,
        },
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: true,
      },
    });

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[i18n] ready', {
      language: i18n.language,
      hasTranslationBundle: i18n.hasResourceBundle('zh-CN', 'translation'),
      sample_sidebar_developmentCenter: i18n.t('sidebar.developmentCenter'),
    });
  }
})();

export { initPromise };
export default i18n;
