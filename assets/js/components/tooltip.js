/**
 * Anadolu Üniversitesi Kütüphane - Tooltip Manager
 * Modern minimal tooltip sistemi
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';

export class TooltipManager {
  constructor() {
    this.currentTooltip = null;
    this.showTimer = null;
    this.hideTimer = null;
    this.tooltipDelay = AppConfig.tooltipDelay;
    this.touchDuration = AppConfig.tooltipDuration;
  }

  /**
   * Tooltip'leri başlat
   * @param {string} selector - Element selector
   */
  init(selector = '[data-tooltip]') {
    this.cleanup();
    this.attachTooltips(selector);
    Utils.log('TooltipManager initialized', { selector });
  }

  /**
   * Tooltip'leri temizle
   */
  cleanup() {
    // Mevcut tooltip'leri kaldır
    document.querySelectorAll('.tooltip-minimal, .modern-tooltip').forEach(el => el.remove());
    
    // Timer'ları temizle
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    
    this.currentTooltip = null;
  }

  /**
   * Tooltip'leri elementlere ekle
   * @param {string} selector - Element selector
   */
  attachTooltips(selector) {
    document.querySelectorAll(selector).forEach(element => {
      // Mouseenter event
      element.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, element));
      
      // Mouseleave event
      element.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    });

    // Touch device'lar için tap to show/hide
    if ('ontouchstart' in window) {
      document.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    }

    // Global click ile tooltip'i kapat
    document.addEventListener('click', (e) => this.handleGlobalClick(e));
  }

  /**
   * Mouse enter handler
   * @param {Event} e - Event
   * @param {HTMLElement} element - Element
   */
  handleMouseEnter(e, element) {
    // Önceki timer'ları temizle
    if (this.showTimer) clearTimeout(this.showTimer);
    if (this.hideTimer) clearTimeout(this.hideTimer);
    
    // Aktif tooltip varsa kapat
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
    
    const tooltipText = element.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    // Biraz gecikme ile tooltip göster
    this.showTimer = setTimeout(() => {
      this.showTooltip(element, tooltipText);
    }, this.tooltipDelay);
  }

  /**
   * Mouse leave handler
   * @param {Event} e - Event
   */
  handleMouseLeave(e) {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
    
    if (this.currentTooltip) {
      this.currentTooltip.classList.remove('show');
      this.hideTimer = setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.remove();
          this.currentTooltip = null;
        }
      }, 200);
    }
  }

  /**
   * Touch start handler
   * @param {Event} e - Event
   */
  handleTouchStart(e) {
    const element = e.target.closest('[data-tooltip]');
    if (element && element.hasAttribute('data-tooltip')) {
      e.preventDefault();
      
      const tooltipText = element.getAttribute('data-tooltip');
      if (!tooltipText) return;
      
      // Varsa eski tooltip'i kapat
      if (this.currentTooltip) {
        this.currentTooltip.remove();
        this.currentTooltip = null;
      }
      
      // Touch için anında göster
      this.showTooltip(element, tooltipText);
      
      // 3 saniye sonra otomatik kapat
      setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.remove();
          this.currentTooltip = null;
        }
      }, this.touchDuration);
    }
  }

  /**
   * Global click handler
   * @param {Event} e - Event
   */
  handleGlobalClick(e) {
    if (this.currentTooltip && !e.target.closest('[data-tooltip]')) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
    if (this.showTimer) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  /**
   * Tooltip göster
   * @param {HTMLElement} element - Element
   * @param {string} text - Tooltip metni
   */
  showTooltip(element, text) {
    // Yeni tooltip oluştur
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip-minimal';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    // Pozisyonu hesapla
    const position = this.calculatePosition(element, tooltip);
    
    tooltip.style.left = position.left + 'px';
    tooltip.style.top = position.top + 'px';
    
    // Arrow direction
    if (position.showBelow) {
      tooltip.style.setProperty('--arrow-direction', 'up');
    }
    
    // Göster animasyonu
    requestAnimationFrame(() => {
      tooltip.classList.add('show');
    });
    
    this.currentTooltip = tooltip;
  }

  /**
   * Tooltip pozisyonunu hesapla
   * @param {HTMLElement} element - Element
   * @param {HTMLElement} tooltip - Tooltip element
   * @returns {Object} Position {left, top, showBelow}
   */
  calculatePosition(element, tooltip) {
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = elementRect.left + (elementRect.width / 2) - (tooltipRect.width / 2);
    let top = elementRect.top - tooltipRect.height - 12 + window.scrollY;
    let showBelow = false;
    
    // Ekran sınırları kontrolü
    const padding = 10;
    if (left < padding) {
      left = padding;
    } else if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    
    // Üstte yer yoksa alta al
    if (top < padding + window.scrollY) {
      top = elementRect.bottom + 12 + window.scrollY;
      showBelow = true;
    }
    
    return { left, top, showBelow };
  }

  /**
   * Belirli bir element için tooltip göster (programmatically)
   * @param {HTMLElement|string} target - Element veya selector
   * @param {string} text - Tooltip metni
   * @param {number} duration - Gösterim süresi (ms)
   */
  show(target, text, duration = 2000) {
    const element = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!element) {
      console.warn('Tooltip target not found:', target);
      return;
    }
    
    // Varsa eski tooltip'i kapat
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
    
    this.showTooltip(element, text);
    
    // Belirtilen süre sonra kapat
    if (duration > 0) {
      setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.classList.remove('show');
          setTimeout(() => {
            if (this.currentTooltip) {
              this.currentTooltip.remove();
              this.currentTooltip = null;
            }
          }, 200);
        }
      }, duration);
    }
  }

  /**
   * Aktif tooltip'i kapat
   */
  hide() {
    if (this.currentTooltip) {
      this.currentTooltip.classList.remove('show');
      setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.remove();
          this.currentTooltip = null;
        }
      }, 200);
    }
  }

  /**
   * Tooltip'leri yeniden başlat
   * @param {string} selector - Element selector
   */
  reinit(selector = '[data-tooltip]') {
    this.cleanup();
    this.init(selector);
  }
}

export default TooltipManager;
