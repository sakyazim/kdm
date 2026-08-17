/**
 * Quick Actions Component
 * Hızlı işlemler paneli yönetimi
 */

import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

export class QuickActionsManager {
  constructor(app) {
    this.app = app;
    this.panel = null;
    this.toggleBtn = null;
    this.closeBtn = null;
    this.content = null;
    this.isOpen = false;
    this.isAvailable = false; // Öğelerin mevcut olup olmadığını kontrol etmek için yeni bir flag
  }

  /**
   * Get translations for quick actions — JSON'dan okunur (hardcoded metin yok)
   */
  getTranslations() {
    const currentLang = LanguageManager.getCurrentLanguage();
    const t = (this.data && this.data.translations) || {};
    const fallback = currentLang === 'en'
      ? { title: 'Quick Actions', ariaLabel: 'Quick Actions', close: 'Close' }
      : { title: 'Hızlı İşlemler', ariaLabel: 'Hızlı İşlemler', close: 'Kapat' };
    return {
      title: Utils.getLocalizedText(t.title) || fallback.title,
      ariaLabel: Utils.getLocalizedText(t.ariaLabel) || fallback.ariaLabel,
      close: Utils.getLocalizedText(t.close) || fallback.close
    };
  }

  /**
   * HTML yapısını oluştur
   */
  renderHTML() {
    const t = this.getTranslations();

    // Mevcut panel varsa kaldır
    const existingPanel = document.querySelector('.quick-actions-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    // Yeni panel oluştur
    const panel = document.createElement('aside');
    panel.className = 'quick-actions-panel';
    panel.title = t.title;

    panel.innerHTML = `
      <div class="quick-actions-toggle">
        <button type="button" class="quick-actions-btn" aria-label="${t.ariaLabel}">
          <i class="bi bi-lightning-fill"></i>
        </button>
      </div>
      <div class="quick-actions-menu">
        <header class="quick-actions-header">
          <h5>${t.title}</h5>
          <button type="button" class="quick-actions-close" aria-label="${t.close}">
            <i class="bi bi-x-lg"></i>
          </button>
        </header>
        <div class="quick-actions-content"></div>
      </div>
    `;

    document.body.appendChild(panel);
  }

  /**
   * Quick Actions'ı başlat
   */
  init(quickActionsData) {
    if (!quickActionsData) {
      console.log('❌ Quick Actions data not available');
      return;
    }

    console.log('🚀 Quick Actions initializing...', quickActionsData);

    // Data'yı sakla
    this.data = quickActionsData;

    // Translations'ı yükle
    this.notificationTexts = Utils.localizeObject(quickActionsData.translations?.notifications || {});

    // HTML yapısını oluştur
    this.renderHTML();

    // Öğeleri kontrol et
    this.panel = document.querySelector('.quick-actions-panel');

    if (!this.panel) {
      console.error('❌ Quick Actions panel could not be created');
      this.isAvailable = false;
      return;
    }

    this.isAvailable = true;
    this.toggleBtn = this.panel.querySelector('.quick-actions-btn');
    this.closeBtn = this.panel.querySelector('.quick-actions-close');
    this.content = this.panel.querySelector('.quick-actions-content');

    console.log('✅ Quick Actions elements found:', {
      panel: !!this.panel,
      toggleBtn: !!this.toggleBtn,
      closeBtn: !!this.closeBtn,
      content: !!this.content
    });

    // Gerekli tüm öğeler var mı kontrol et
    if (!this.toggleBtn || !this.content) {
      console.error('❌ Some Quick Actions elements not found');
      return;
    }

    // Sayfa bazlı quick actions'ları filtrele
    const filteredActions = this.filterActionsByPage(quickActionsData);
    console.log('⚡ Filtered actions:', filteredActions);

    // Quick Actions listesini render et
    this.renderQuickActions(filteredActions);

    // Event listener'ları ekle
    this.setupEventListeners();

    console.log('✅ Quick Actions initialized successfully');
  }

  /**
   * Sayfa bazlı quick actions'ları filtrele
   */
  filterActionsByPage(data) {
    if (!data) return [];

    // Yeni format kontrolü
    if (data.global && data.pages) {
      const pageType = this.app.pageInfo.type;
      const pageName = this.app.pageInfo.name;
      const currentPageUrl = `${pageName}.html`;

      console.log('🔍 Quick Actions Filter:', {
        pageType,
        pageName,
        currentPageUrl,
        availablePages: Object.keys(data.pages)
      });

      // Global actions
      let actions = [...(data.global || [])];

      // Sayfa özel actions (önce pageName, sonra pageType)
      if (data.pages[pageName]) {
        console.log(`✅ Using page-specific actions for: ${pageName}`);
        actions = [...actions, ...data.pages[pageName]];
      } else if (data.pages[pageType]) {
        console.log(`✅ Using page-type actions for: ${pageType}`);
        actions = [...actions, ...data.pages[pageType]];
      }

      console.log('📋 Actions before filtering:', actions.length);

      // Mevcut sayfaya işaret eden URL'leri filtrele
      actions = actions.filter(action => {
        if (action.url) {
          const actionUrl = action.url.split('#')[0]; // Hash'i kaldır
          const shouldShow = actionUrl !== currentPageUrl;
          if (!shouldShow) {
            console.log(`🚫 Filtering out: ${action.id} (${actionUrl})`);
          }
          return shouldShow;
        }
        return true; // URL yoksa göster
      });

      console.log('📋 Actions after filtering:', actions.length);

      return actions;
    }

    // Eski format desteği (geriye dönük uyumluluk)
    return Array.isArray(data) ? data : [];
  }

  /**
   * Quick Actions listesini render et
   */
  renderQuickActions(actions) {
    if (!this.isAvailable || !this.content || !actions || actions.length === 0) return;

    const activeActions = actions.filter(action => action.enabled !== false);

    this.content.innerHTML = activeActions.map(action => {
      const hasAction = action.action && !action.url;
      const hasUrl = action.url && !action.action;

      // Çoklu dil desteği
      const title = Utils.getLocalizedText(action.title);
      const description = Utils.getLocalizedText(action.description);

      if (hasAction) {
        return `
          <button class="quick-action-item" data-action="${action.action}">
            <i class="${action.icon}"></i>
            <div class="quick-action-info">
              <h6>${title}</h6>
              <p>${description}</p>
            </div>
          </button>
        `;
      } else if (hasUrl) {
        return `
          <a href="${action.url}" class="quick-action-item">
            <i class="${action.icon}"></i>
            <div class="quick-action-info">
              <h6>${title}</h6>
              <p>${description}</p>
            </div>
            ${action.shortcut ? `<span class="shortcut">${action.shortcut}</span>` : ''}
          </a>
        `;
      }
      return '';
    }).join('');

    // Action butonlarına event listener ekle
    this.setupActionListeners();
  }

  /**
   * Event listener'ları kur
   */
  setupEventListeners() {
    if (!this.isAvailable) return;
    
    // Toggle butonu
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggle());
    }

    // Close butonu
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
      }

    // Panel dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
      if (this.isOpen && this.panel &&
          !this.panel.contains(e.target) &&
          this.toggleBtn && !this.toggleBtn.contains(e.target)) {
        this.close();
      }
    });

    // ESC tuşu ile kapat
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
    this.close();
      }
    });
  }

  /**
   * Action butonlarına listener ekle
   */
  setupActionListeners() {
    if (!this.isAvailable || !this.content) return;
    
    const actionButtons = this.content.querySelectorAll('[data-action]');

    actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.executeAction(action);
      });
    });
  }
  /**
   * Action'ı çalıştır
   */
  executeAction(action) {
    // resetAgreement action'ı için özel kontrol (agreementKey parametresi ile)
    if (action.startsWith('resetAgreement:')) {
      const agreementKey = action.split(':')[1];
      this.resetAgreement(agreementKey);
      return;
    }

    switch (action) {
      case 'toggleTheme':
        this.toggleTheme();
        break;
      case 'resetModals':
        this.resetModals();
        break;
      case 'refreshDatabases':
        this.refreshDatabases();
        break;
      case 'printPage':
        this.printPage();
        break;
      case 'sharePage':
        this.sharePage();
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }
  /**
   * Tema değiştir (açık/koyu)
   */
  toggleTheme() {
    // App instance'ından tema değiştirme fonksiyonunu çağır
    if (this.app && this.app.toggleTheme) {
      this.app.toggleTheme();
      const message = this.notificationTexts?.themeChanged || 'Tema değiştirildi!';
      this.showNotification(message);
    } else {
      console.error('Theme toggle function not available');
    }
    this.close();
  }

  /**
   * Modalları sıfırla (tekrar göster)
   */
  resetModals() {
    // LocalStorage'daki tüm modal kayıtlarını temizle
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('modal_') && key.endsWith('_shown')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Başarı mesajı göster
    const message = this.notificationTexts?.modalsReset || 'Duyurular sıfırlandı! Sayfa yenilendiğinde duyurular tekrar gösterilecek.';
    this.showNotification(message);

    // Panel'i kapat
    this.close();

    // Sayfayı yenile (isteğe bağlı - 2 saniye sonra)
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }

  /**
   * Agreement modalını sıfırla (kullanım şartlarını tekrar göster)
   */
  resetAgreement(agreementKey) {
    if (!agreementKey) {
      console.error('Agreement key is required');
      return;
    }

    // LocalStorage'dan agreement verilerini temizle
    const storageKey = `${agreementKey}-accepted`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}-version`);
    localStorage.removeItem(`${storageKey}-date`);

    console.log(`✅ Agreement cleared: ${agreementKey}`);

    // Başarı mesajı göster (JSON'dan yüklenecek)
    const message = this.notificationTexts?.agreementReset?.replace('{title}', agreementKey) || 'Kullanım şartları sıfırlandı! Sayfa yenileniyor...';
    this.showNotification(message);

    // Panel'i kapat
    this.close();

    // Sayfayı yenile (1 saniye sonra)
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  /**
   * Veritabanlarını yenile
   */
  refreshDatabases() {
    const message = this.notificationTexts?.databasesRefreshing || 'Veritabanları yenileniyor...';
    this.showNotification(message);
    this.close();

    setTimeout(() => {
      window.location.reload();
    }, 1000);
    }
  /**
   * Sayfayı yazdır
   */
  printPage() {
    this.close();

    setTimeout(() => {
      window.print();
    }, 300);
  }

  /**
   * Sayfayı paylaş
   */
  sharePage() {
    const url = window.location.href;
    const title = document.title;

    if (navigator.share) {
      navigator.share({
        title: title,
        url: url
      }).then(() => {
        const message = this.notificationTexts?.pageShared || 'Sayfa paylaşıldı!';
        this.showNotification(message);
      }).catch(() => {
        this.copyToClipboard(url);
      });
    } else {
      this.copyToClipboard(url);
  }

    this.close();
}

  /**
   * URL'yi panoya kopyala
   */
  copyToClipboard(text) {
    const message = this.notificationTexts?.linkCopied || 'Sayfa linki kopyalandı!';

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showNotification(message);
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        this.showNotification(message);
      } catch (err) {
        console.error('Kopyalama başarısız:', err);
      }

      document.body.removeChild(textArea);
    }
  }

  /**
   * Bildirim göster
   */
  showNotification(message) {
    // Basit bir toast notification
    const toast = document.createElement('div');
    toast.className = 'quick-action-toast';
    toast.innerHTML = `
      <i class="bi bi-check-circle-fill"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animasyon için kısa gecikme
    setTimeout(() => toast.classList.add('show'), 10);

    // 3 saniye sonra kaldır
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * Panel'i aç/kapat
   */
  toggle() {
    if (!this.isAvailable) return;
    
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Panel'i aç
   */
  open() {
    if (!this.isAvailable || !this.panel) return;
    this.panel.classList.add('active');
    this.isOpen = true;
  }

  /**
   * Panel'i kapat
   */
  close() {
    if (!this.isAvailable || !this.panel) return;
    this.panel.classList.remove('active');
    this.isOpen = false;
  }
}