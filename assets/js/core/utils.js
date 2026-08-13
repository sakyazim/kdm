/**
 * Anadolu Üniversitesi Kütüphane - Utilities
 * Yardımcı fonksiyonlar ve araçlar
 */

export const Utils = {
  /**
   * Tarih formatlama - Çoklu dil desteği
   * @param {string} dateString - ISO tarih string
   * @param {string} locale - Locale (optional - otomatik mevcut dile göre belirlenir)
   * @returns {string} Formatlanmış tarih
   */
  formatDate(dateString, locale = null) {
    const date = new Date(dateString);

    // Locale belirtilmemişse mevcut dilden belirle
    if (!locale) {
      const currentLang = localStorage.getItem('library_language') || 'tr';
      locale = currentLang === 'tr' ? 'tr-TR' : 'en-US';
    }

    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  /**
   * Ay ismi al
   * @param {number} monthIndex - Ay index (0-11)
   * @returns {string} Ay adı
   */
  getMonthName(monthIndex) {
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
                   'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return months[monthIndex];
  },

  /**
   * Metin kısaltma
   * @param {string} text - Kısaltılacak metin
   * @param {number} maxLength - Maksimum uzunluk
   * @returns {string} Kısaltılmış metin
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  },

  /**
   * Debounce fonksiyonu
   * @param {Function} func - Çalıştırılacak fonksiyon
   * @param {number} wait - Bekleme süresi (ms)
   * @returns {Function} Debounced fonksiyon
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle fonksiyonu
   * @param {Function} func - Çalıştırılacak fonksiyon
   * @param {number} limit - Limit (ms)
   * @returns {Function} Throttled fonksiyon
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Query string parse
   * @param {string} queryString - Query string
   * @returns {Object} Parsed object
   */
  parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Cookie get
   * @param {string} name - Cookie adı
   * @returns {string|null} Cookie değeri
   */
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },

  /**
   * Cookie set
   * @param {string} name - Cookie adı
   * @param {string} value - Cookie değeri
   * @param {number} days - Geçerlilik süresi (gün)
   */
  setCookie(name, value, days) {
    const d = new Date();
    d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  },

  /**
   * Local storage get (with error handling)
   * @param {string} key - Storage key
   * @returns {any} Parsed value
   */
  getLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return null;
    }
  },

  /**
   * Local storage set (with error handling)
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   */
  setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  },

  /**
   * Element'in viewport'ta görünür olup olmadığını kontrol et
   * @param {HTMLElement} element - Kontrol edilecek element
   * @returns {boolean} Görünür mü?
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Smooth scroll to element
   * @param {HTMLElement|string} target - Element veya selector
   * @param {number} offset - Offset (varsayılan: header height)
   */
  scrollToElement(target, offset = 80) {
    const element = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  },

  /**
   * Create element with attributes
   * @param {string} tag - HTML tag
   * @param {Object} attributes - Attributes object
   * @param {string} content - Inner content
   * @returns {HTMLElement} Created element
   */
  createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    
    if (content) {
      element.innerHTML = content;
    }
    
    return element;
  },

  /**
   * Wait for element to exist
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout (ms)
   * @returns {Promise<HTMLElement>} Promise that resolves with element
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        return resolve(element);
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  },

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success
   */
  async copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      return false;
    }
  },

  /**
   * Get current page info
   * @returns {Object} Page info
   */
  getPageInfo() {
    const body = document.body;
    return {
      type: body.getAttribute('data-page-type') || 'unknown',
      name: body.getAttribute('data-page-name') || 'unknown',
      path: window.location.pathname,
      url: window.location.href
    };
  },

  /**
   * Check if mobile device
   * @returns {boolean} Is mobile
   */
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Get viewport size
   * @returns {Object} Width and height
   */
  getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  },

  /**
   * Show toast notification
   * @param {string} message - Message
   * @param {string} type - Type (success, error, info, warning)
   * @param {number} duration - Duration (ms)
   */
  showToast(message, type = 'success', duration = 3000) {
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const toastElement = document.createElement('div');
    toastElement.id = toastId;
    toastElement.className = `toast align-items-center text-bg-${type} border-0`;
    toastElement.setAttribute('role', 'alert');
    toastElement.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    toastContainer.appendChild(toastElement);

    // Bootstrap toast olmalı
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
      const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: duration
      });
      toast.show();

      toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
      });
    } else {
      // Fallback: Simple show/hide
      toastElement.style.display = 'block';
      setTimeout(() => {
        toastElement.style.opacity = '0';
        setTimeout(() => toastElement.remove(), 300);
      }, duration);
    }
  },

  /**
   * Log with timestamp (debug mode)
   * @param {string} message - Log message
   * @param {any} data - Additional data
   */
  log(message, data = null) {
    if (this.debug) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${message}`, data || '');
    }
  },

  /**
   * Get text in current language from multi-language object
   * @param {Object|string|Array} textObj - Object with {tr: "...", en: "..."}, plain string, or array
   * @param {string} lang - Language code (optional, uses current language if not provided)
   * @returns {string|Array} Text in requested language
   */
  getLocalizedText(textObj, lang = null) {
    // Eğer null veya undefined ise boş string döndür
    if (textObj === null || textObj === undefined) {
      return '';
    }

    // Eğer string ise direkt döndür
    if (typeof textObj === 'string') {
      return textObj;
    }

    // Eğer array ise her elemanı işle
    if (Array.isArray(textObj)) {
      return textObj.map(item => this.getLocalizedText(item, lang));
    }

    // Eğer object değilse string'e çevir
    if (typeof textObj !== 'object') {
      return String(textObj);
    }

    // Mevcut dili al (LanguageManager ile aynı storage key kullan!)
    const currentLang = lang || localStorage.getItem('library_language') || 'tr';

    // DEBUG LOG
    if (this.debug) {
      console.log('[getLocalizedText] Lang:', currentLang, 'Keys:', Object.keys(textObj));
    }

    // İstenen dilde varsa döndür
    if (textObj[currentLang]) {
      return textObj[currentLang];
    }

    // Yoksa TR'ye fallback (default language)
    if (textObj.tr) {
      return textObj.tr;
    }

    // TR de yoksa EN'e fallback
    if (textObj.en) {
      return textObj.en;
    }

    // Hiçbiri yoksa ilk değeri döndür
    const firstValue = Object.values(textObj)[0];
    if (firstValue) {
      return firstValue;
    }

    // Son çare: boş string
    return '';
  },

  /**
   * Deep localize an entire object recursively
   * @param {Object} obj - Object to localize
   * @param {string} lang - Language code (optional)
   * @returns {Object} Localized object
   */
  localizeObject(obj, lang = null) {
    if (!obj || typeof obj !== 'object') {
      return this.getLocalizedText(obj, lang);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.localizeObject(item, lang));
    }

    // Check if this object is a multi-language object (has tr/en keys)
    const hasLangKeys = obj.tr !== undefined || obj.en !== undefined;
    if (hasLangKeys && Object.keys(obj).every(key => ['tr', 'en'].includes(key))) {
      return this.getLocalizedText(obj, lang);
    }

    // Recursively process all properties
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = this.localizeObject(obj[key], lang);
      }
    }
    return result;
  }
};

export default Utils;
