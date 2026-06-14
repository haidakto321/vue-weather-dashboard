// Japanese message catalogue for vue-i18n.
//
// Same key shape as en.ts (every en key exists here, none missing). Values are natural
// Japanese for the app chrome and pages. WMO condition labels stay English-only (see en.ts).
export default {
  nav: {
    dashboard: 'ダッシュボード',
    cityDetail: '都市の詳細',
    settings: '設定',
  },
  app: {
    title: 'Vue 天気ダッシュボード',
    toggleNavigation: 'ナビゲーションの切り替え',
    toggleDarkMode: 'ダークモードの切り替え',
  },
  dashboard: {
    heading: 'ダッシュボード',
    emptyState: '都市を検索して現在の天気を表示します。',
  },
  search: {
    label: '都市を検索',
    placeholder: '都市名を入力してください',
  },
  card: {
    viewForecast: '{city}の予報を見る',
    remove: '{city}を削除',
    notFound: '都市が見つかりません。',
    loadError: '天気を読み込めませんでした - 接続を確認してください。',
    wind: '{value} km/h',
    humidity: '{value}%',
  },
  detail: {
    forecastHeading: '7日間の予報',
    temperatureHeading: '気温',
    notFoundTitle: '都市が見つかりません',
    notFoundBody: 'その都市は保存されていません - ダッシュボードに戻って検索してください。',
    backToDashboard: 'ダッシュボードに戻る',
    loadError: '予報を読み込めませんでした - 接続を確認してください。',
  },
  settings: {
    heading: '設定',
    unitSection: '温度の単位',
    themeSection: 'テーマ',
    languageSection: '言語',
    celsius: '摂氏 (°C)',
    fahrenheit: '華氏 (°F)',
    darkModeLabel: 'ダークモード',
    english: 'English',
    japanese: '日本語',
  },
}
