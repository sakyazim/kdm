/**
 * ADMIN PANEL CONFIGURATION
 * Version: 3.0
 * Last Updated: 2025-11-26
 */

const ADMIN_CONFIG = {
  // ============================================
  // PATH SETTINGS
  // ============================================

  /**
   * Local data path (relative to admin folder)
   * Used when working locally to read/write JSON files
   */
  localDataPath: '../data/',

  /**
   * Production data URL
   * Used to preview production data
   */
  productionDataUrl: 'https://kutuphane.anadolu.edu.tr/data/',

  /**
   * Working mode
   * - 'local': Work with local files (recommended)
   * - 'preview': Preview production files (read-only)
   */
  mode: 'local',

  // ============================================
  // LANGUAGE SETTINGS
  // ============================================

  /**
   * Available languages
   */
  languages: ['tr', 'en'],

  /**
   * Default language
   */
  defaultLanguage: 'tr',

  /**
   * Language labels
   */
  languageLabels: {
    tr: 'Türkçe',
    en: 'English'
  },

  // ============================================
  // FILE STRUCTURE
  // ============================================

  /**
   * Available JSON file categories
   */
  fileCategories: [
    {
      id: 'home',
      label: 'Ana Sayfa',
      icon: 'bi-house-fill',
      collapsed: false,
      files: [
        { id: 'home', label: 'Ana Sayfa İçeriği', path: 'pages/' }
      ]
    },
    {
      id: 'about',
      label: 'Hakkımızda',
      icon: 'bi-info-circle-fill',
      collapsed: false,
      files: [
        { id: 'calisma-saatleri', label: 'Çalışma Saatleri', path: 'pages/' },
        { id: 'personel', label: 'Personel', path: 'pages/' },
        { id: 'organizasyon-semasi', label: 'Organizasyon Şeması', path: 'pages/' },
        { id: 'tarihce-genel-bilgiler', label: 'Tarihçe & Genel Bilgiler', path: 'pages/' },
        { id: 'kutuphane-kurallari', label: 'Kütüphane Kuralları', path: 'pages/' },
        { id: 'koleksiyon-kat-plani', label: 'Koleksiyon & Kat Planı', path: 'pages/' }
      ]
    },
    {
      id: 'services',
      label: 'Hizmetler',
      icon: 'bi-gear-fill',
      collapsed: false,
      files: [
        { id: 'bilgisayar-laboratuvari', label: 'Bilgisayar Laboratuvarı', path: 'pages/' },
        { id: 'calisma-odalari', label: 'Çalışma Odaları', path: 'pages/' },
        { id: 'uzaktan-erisim', label: 'Uzaktan Erişim', path: 'pages/' },
        { id: 'kime-sormaliyim', label: 'Kime Sormalıyım', path: 'pages/' },
        { id: 'ill', label: 'Kütüphanelerarası Ödünç', path: 'pages/' },
        { id: 'uyelik-odunc-islemleri', label: 'Üyelik & Ödünç İşlemleri', path: 'pages/' },
        { id: 'databases', label: 'Veritabanları (Databases)', path: 'pages/' },
        { id: 'veritabanlari', label: 'Veritabanları (TR)', path: 'pages/' },
        { id: 'sure-uzatma', label: 'Süre Uzatma', path: 'pages/' },
        { id: 'kutuphane-kullanim-klavuzu', label: 'Kütüphane Kullanım Klavuzu', path: 'pages/' }
      ]
    },
    {
      id: 'research',
      label: 'Araştırma',
      icon: 'bi-search',
      collapsed: false,
      files: [
        { id: 'anadolu-arastirma', label: 'Anadolu Araştırma', path: 'pages/' },
        { id: 'arastirmaci-profili-olusturma', label: 'Araştırmacı Profili Oluşturma', path: 'pages/' },
        { id: 'makale-islem-ucretleri', label: 'Makale İşlem Ücretleri', path: 'pages/' },
        { id: 'mendeley-referans-yonetim-araci', label: 'Mendeley Referans Yönetim Aracı', path: 'pages/' },
        { id: 'istatistikler-ve-raporlar', label: 'İstatistikler ve Raporlar', path: 'pages/' }
      ]
    },
    {
      id: 'education',
      label: 'Eğitim & Etkinlikler',
      icon: 'bi-calendar-event-fill',
      collapsed: false,
      files: [
        { id: 'egitim-programlari', label: 'Eğitim Programları', path: 'pages/' }
      ]
    },
    {
      id: 'contact',
      label: 'İletişim & Diğer',
      icon: 'bi-envelope-fill',
      collapsed: false,
      files: [
        { id: 'iletisim', label: 'İletişim', path: 'pages/' },
        { id: 'sss', label: 'Sıkça Sorulan Sorular', path: 'pages/' },
        { id: 'formlar', label: 'Formlar', path: 'pages/' },
        { id: 'duyurular', label: 'Duyurular', path: 'pages/' },
        { id: 'guncel-haberler', label: 'Güncel Haberler', path: 'pages/' }
      ]
    },
    {
      id: 'legal',
      label: 'Yasal & Politikalar',
      icon: 'bi-shield-check',
      collapsed: false,
      files: [
        { id: 'erisilebilirlik', label: 'Erişilebilirlik', path: 'pages/' },
        { id: 'gizlilik', label: 'Gizlilik Politikası', path: 'pages/' },
        { id: 'kosullar', label: 'Kullanım Koşulları', path: 'pages/' }
      ]
    },
    {
      id: 'global',
      label: 'Global Ayarlar',
      icon: 'bi-globe',
      collapsed: false,
      files: [
        { id: 'header', label: 'Header (Üst Menü)', path: 'global/' },
        { id: 'footer', label: 'Footer (Alt Menü)', path: 'global/' },
        { id: 'settings', label: 'Site Ayarları', path: 'global/' },
        { id: 'quickActions', label: 'Hızlı İşlemler', path: 'global/' },
        { id: 'accessibility', label: 'Erişilebilirlik Menüsü', path: 'global/' }
      ]
    },
    {
      id: 'content',
      label: 'İçerik Ayarları',
      icon: 'bi-collection-fill',
      collapsed: false,
      files: [
        { id: 'arrivals', label: 'Yeni Gelenler', path: 'content/' },
        { id: 'services', label: 'Hizmetler Widget', path: 'content/' },
        { id: 'collections', label: 'Koleksiyonlar', path: 'content/' },
        { id: 'modal', label: 'Modal İçerikleri', path: 'content/' }
      ]
    },
    {
      id: 'agreements',
      label: 'Sözleşmeler',
      icon: 'bi-file-earmark-text-fill',
      collapsed: false,
      files: [
        { id: 'uzaktan-erisim-kullanim-sartlari', label: 'Uzaktan Erişim Kullanım Şartları', path: 'agreements/' },
        { id: 'veritabanlari-kullanim-sartlari', label: 'Veritabanları Kullanım Şartları', path: 'agreements/' }
      ]
    }
  ],

  // ============================================
  // EDITOR SETTINGS
  // ============================================

  /**
   * Auto-save interval (ms)
   * Set to 0 to disable auto-save
   */
  autoSaveInterval: 0,

  /**
   * Enable validation
   */
  enableValidation: true,

  /**
   * Show line numbers in code editor
   */
  showLineNumbers: true,

  /**
   * Theme
   */
  theme: 'light', // 'light' or 'dark'

  // ============================================
  // TECHNICAL FIELDS (Do not translate)
  // ============================================

  /**
   * Fields that should not be localized
   * These are technical/structural fields
   */
  technicalFields: [
    'icon',
    'url',
    'link',
    'href',
    'image',
    'backgroundImage',
    'logo',
    'type',
    'id',
    'variant',
    'layout',
    'gap',
    'justify',
    'embedUrl',
    'statusBadge.variant',
    'statusBadge.type'
  ],

  // ============================================
  // VALIDATION RULES
  // ============================================

  /**
   * Required fields for each page type
   */
  requiredFields: {
    page: ['meta', 'hero', 'content', 'help'],
    meta: ['title', 'description'],
    hero: ['title', 'description'],
    help: ['title', 'description', 'buttons']
  },

  // ============================================
  // UI SETTINGS
  // ============================================

  /**
   * UI Labels (Turkish)
   */
  uiLabels: {
    tr: {
      appTitle: 'Kütüphane Admin Panel',
      selectFile: 'Dosya Seçin',
      selectCategory: 'Kategori Seçin',
      save: 'Kaydet',
      download: 'İndir',
      preview: 'Önizleme',
      reset: 'Sıfırla',
      cancel: 'İptal',
      confirm: 'Onayla',
      delete: 'Sil',
      add: 'Ekle',
      edit: 'Düzenle',
      close: 'Kapat',
      search: 'Ara',
      filter: 'Filtrele',
      sort: 'Sırala',
      view: 'Görüntüle',
      loading: 'Yükleniyor...',
      saving: 'Kaydediliyor...',
      saved: 'Kaydedildi!',
      error: 'Hata!',
      success: 'Başarılı!',
      warning: 'Uyarı!',
      info: 'Bilgi',
      unsavedChanges: 'Kaydedilmemiş değişiklikler var. Devam etmek istiyor musunuz?',
      deleteConfirm: 'Silmek istediğinize emin misiniz?',
      validationError: 'Lütfen zorunlu alanları doldurun.',
      fileLoaded: 'Dosya yüklendi',
      fileSaved: 'Dosya kaydedildi',
      fileDownloaded: 'Dosya indirildi',
      invalidJson: 'Geçersiz JSON formatı!',
      requiredField: 'Bu alan zorunludur',
      turkish: 'Türkçe',
      english: 'İngilizce',
      bothLanguages: 'Her iki dil',
      missingTranslation: 'Eksik çeviri',
      translationComplete: 'Çeviri tamamlandı',
      noFileSelected: 'Dosya seçilmedi',
      mode: {
        local: 'Local Mod (Dosyalarınızı düzenleyin)',
        preview: 'Önizleme Mod (Sadece görüntüleme)'
      }
    },
    en: {
      appTitle: 'Library Admin Panel',
      selectFile: 'Select File',
      selectCategory: 'Select Category',
      save: 'Save',
      download: 'Download',
      preview: 'Preview',
      reset: 'Reset',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      add: 'Add',
      edit: 'Edit',
      close: 'Close',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      view: 'View',
      loading: 'Loading...',
      saving: 'Saving...',
      saved: 'Saved!',
      error: 'Error!',
      success: 'Success!',
      warning: 'Warning!',
      info: 'Info',
      unsavedChanges: 'You have unsaved changes. Do you want to continue?',
      deleteConfirm: 'Are you sure you want to delete?',
      validationError: 'Please fill in required fields.',
      fileLoaded: 'File loaded',
      fileSaved: 'File saved',
      fileDownloaded: 'File downloaded',
      invalidJson: 'Invalid JSON format!',
      requiredField: 'This field is required',
      turkish: 'Turkish',
      english: 'English',
      bothLanguages: 'Both languages',
      missingTranslation: 'Missing translation',
      translationComplete: 'Translation complete',
      noFileSelected: 'No file selected',
      mode: {
        local: 'Local Mode (Edit your files)',
        preview: 'Preview Mode (View only)'
      }
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ADMIN_CONFIG;
}
