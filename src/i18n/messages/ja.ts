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
  validation: {
    cityRequired: '都市名を入力してください',
    cityMin: '2文字以上入力してください',
    cityMax: '都市名が長すぎます',
  },
  card: {
    viewForecast: '{city}の予報を見る',
    remove: '{city}を削除',
    loadError: '天気を読み込めませんでした - 接続を確認してください。',
    retry: '再試行',
    wind: '{value} km/h',
    humidity: '{value}%',
  },
  chart: {
    tempHigh: '最高 {unit}',
    tempLow: '最低 {unit}',
    temperature: '気温 {unit}',
    precipitation: '降水量',
  },
  detail: {
    forecastHeading: '7日間の予報',
    temperatureHeading: '気温',
    hourlyHeading: '時間ごとの予報',
    notFoundTitle: '都市が見つかりません',
    notFoundBody: 'その都市は保存されていません - ダッシュボードに戻って検索してください。',
    backToDashboard: 'ダッシュボードに戻る',
    loadError: '予報を読み込めませんでした - 接続を確認してください。',
    retry: '再試行',
  },
  notFound: {
    title: 'ページが見つかりません',
    body: 'その URL は存在しません - ダッシュボードに戻ってください。',
    backToDashboard: 'ダッシュボードに戻る',
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
