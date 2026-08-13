/**
 * Anadolu Üniversitesi Kütüphane - Theme Manager
 * Dark/Light tema yönetimi
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';

export class ThemeManager {
  constructor() {
    this.currentTheme = null;
    this.storageKey = AppConfig.storageKeys.theme;
    this.init();
  }

  /**
   * Theme manager'ı başlat
   */
  init() {
    // Kaydedilmiş temayı yükle veya varsayılanı kullan
    const savedTheme = localStorage.getItem(this.storageKey);
    this.currentTheme = savedTheme || AppConfig.defaults.theme;
    
    // Temayı uygula
    this.applyTheme(this.currentTheme);
    
    // Icon'u güncelle
    this.updateThemeIcon();
    
    // Event listener'ları ekle
    this.attachEventListeners();
    
    Utils.log('ThemeManager initialized', { theme: this.currentTheme });
  }

  /**
   * Temayı uygula
   * @param {string} theme - 'light' veya 'dark'
   */
  applyTheme(theme) {
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    this.currentTheme = theme;
    localStorage.setItem(this.storageKey, theme);
    
    // Meta theme-color güncelle (mobil tarayıcılar için)
    this.updateMetaThemeColor(theme);
    
    Utils.log('Theme applied', { theme });
  }

  /**
   * Temayı değiştir (toggle)
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.updateThemeIcon();
    
    // Toast göster
    const themeText = newTheme === 'dark' ? 'Koyu' : 'Açık';
    Utils.showToast(`${themeText} tema aktif edildi!`, 'success');
    
    // Custom event dispatch et
    this.dispatchThemeChangeEvent(newTheme);
  }

  /**
   * Tema icon'unu güncelle
   */
  updateThemeIcon() {
    const lightIcon = document.querySelector('#themeSwitcher .light-icon');
    const darkIcon = document.querySelector('#themeSwitcher .dark-icon');

    if (lightIcon && darkIcon) {
      if (this.currentTheme === 'dark') {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'inline-block';
      } else {
        lightIcon.style.display = 'inline-block';
        darkIcon.style.display = 'none';
      }
    }
  }

  /**
   * Meta theme-color güncelle
   * @param {string} theme - Tema
   */
  updateMetaThemeColor(theme) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    // Renkleri CSS değişkenlerinden al
    const color = theme === 'dark' ? '#1e1e1e' : '#ffffff';
    metaThemeColor.content = color;
  }

  /**
   * Event listener'ları ekle
   */
  attachEventListeners() {
    // Theme switcher button
    const themeSwitcher = document.getElementById('themeSwitcher');
    if (themeSwitcher) {
      themeSwitcher.addEventListener('click', () => this.toggleTheme());
    }

    // Klavye kısayolu: Alt+T
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        this.toggleTheme();
      }
    });

    // System theme değişikliğini dinle
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem(this.storageKey)) {
          // Kullanıcı manuel seçim yapmamışsa sistem temasını kullan
          const systemTheme = e.matches ? 'dark' : 'light';
          this.applyTheme(systemTheme);
          this.updateThemeIcon();
        }
      });
    }
  }

  /**
   * Theme change eventi dispatch et
   * @param {string} theme - Yeni tema
   */
  dispatchThemeChangeEvent(theme) {
    const event = new CustomEvent('themechange', {
      detail: { theme, previousTheme: this.currentTheme }
    });
    document.dispatchEvent(event);
  }

  /**
   * Mevcut temayı al
   * @returns {string} Mevcut tema
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Sistem temasını al
   * @returns {string} Sistem teması
   */
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  /**
   * Sistem temasını kullan
   */
  useSystemTheme() {
    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
    this.updateThemeIcon();
    localStorage.removeItem(this.storageKey);
    Utils.showToast('Sistem teması kullanılıyor', 'info');
  }
}

export default ThemeManager;
