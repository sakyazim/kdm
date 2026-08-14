/**
 * Anadolu Üniversitesi Kütüphane - Configuration
 * Uygulama ayarları, sabitler ve yapılandırma
 */

export const AppConfig = {
  // API ve JSON ayarları
  jsonPath: 'data/',
  
  // Debug modu
  debug: false,
  
  // Sayfa ayarları
  maxServices: 8,
  maxArrivals: 5,
  maxNewsItems: 4,
  maxAnnouncementsPerPage: 3,
  
  // Slider ayarları
  sliderDuration: 5000, // 5 saniye
  sliderAutoPlay: true,
  
  // Tooltip ayarları
  tooltipDelay: 1000, // 1 saniye bekle
  tooltipDuration: 3000, // 3 saniye göster (touch)
  
  // Animation ayarları
  animationDuration: 300,
  headerHeight: 80,
  
  // Cache ayarları
  cacheEnabled: true,
  cacheExpiry: 3600000, // 1 saat (ms)
  
  // Breakpoints
  breakpoints: {
    mobile: 576,
    tablet: 768,
    desktop: 992,
    wide: 1200
  },
  
  // Kullanıcı konumu
  userLocation: {
    city: 'Eskişehir',
    region: 'Eskişehir',
    country: 'TR'
  },
  
  // Feature flags
  features: {
    enableAnalytics: false,
    enableServiceWorker: false,
    enableLazyLoading: true,
    enableSmoothScroll: true,
    enableProgressBars: true,
    enableMultiLanguage: true // Multi-language support
  },

  // Language settings
  languages: {
    available: ['tr', 'en'],
    default: 'tr',
    names: {
      tr: 'Türkçe',
      en: 'English'
    },
    flags: {
      tr: '🇹🇷',
      en: '🇬🇧'
    }
  },
  
  // JSON dosya isimleri
  dataFiles: {
    header: 'header.json',
    footer: 'footer.json',
    collections: 'collections.json',
    services: 'services.json',
    arrivals: 'arrivals.json',
    modal: 'modal.json',
    settings: 'settings.json',
    quickActions: 'quickactions.json',
    accessibility: 'accessibility.json'
  },
  
  // Sayfa tipleri
  pageTypes: {
    HOME: 'home',
    INNER: 'inner',
    DATABASES: 'databases'
  },
  
  // Local storage keys
  storageKeys: {
    theme: 'theme',
    modalShown: 'modalShown',
    language: 'language'
  },
  
  // Varsayılan değerler
  defaults: {
    theme: 'light',
    language: 'tr'
  }
};

// Freeze config to prevent modifications
Object.freeze(AppConfig);

export default AppConfig;
