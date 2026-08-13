/**
 * Search Filter Manager
 * Sticky arama/filtreleme bölümünü yönetir ve header'a göre dinamik pozisyon ayarlar
 *
 * @file search-filter-manager.js
 * @version 1.0.0
 * @date 2025-11-12
 *
 * Features:
 * - Sticky scroll behavior
 * - Header-adaptive positioning (header görünürse sticky alta kayar)
 * - Smooth transitions
 * - Placeholder for layout shift prevention
 */

import Utils from '../core/utils.js';

export class SearchFilterManager {
  constructor(sectionSelector = '.search-filter-section') {
    this.section = document.querySelector(sectionSelector);
    this.header = document.querySelector('.main-header') || document.querySelector('header');
    this.stickyThreshold = 50; // Sticky olmadan önce scroll miktarı (düşürüldü: 200 → 50)
    this.isSticky = false;
    this.headerHeight = 0;
    this.sectionHeight = 0;
    this.placeholder = null;

    if (!this.section) {
      console.warn('SearchFilterManager: Section not found');
      return;
    }

    this.init();
  }

  /**
   * Initialize manager
   */
  init() {
    // Header yüksekliğini al
    this.updateHeaderHeight();

    // Placeholder oluştur (layout shift önlemek için)
    this.createPlaceholder();

    // Scroll event listener
    this.setupScrollListener();

    // Resize event listener (responsive için)
    this.setupResizeListener();

    Utils.log('SearchFilterManager initialized');
  }

  /**
   * Header yüksekliğini güncelle
   */
  updateHeaderHeight() {
    if (this.header) {
      this.headerHeight = this.header.offsetHeight;
    } else {
      this.headerHeight = 80; // Default header yüksekliği
    }
  }

  /**
   * Placeholder oluştur (sticky olduğunda layout shift olmasın)
   */
  createPlaceholder() {
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'sticky-placeholder';
    this.section.parentNode.insertBefore(this.placeholder, this.section);
  }

  /**
   * Scroll event listener kur
   */
  setupScrollListener() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /**
   * Resize event listener kur
   */
  setupResizeListener() {
    let resizeTimer;

    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateHeaderHeight();
        this.handleScroll();
      }, 250);
    });
  }

  /**
   * Scroll handling - Sticky behavior ve header adaptasyonu
   */
  handleScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const sectionTop = this.getSectionOriginalTop();

    // Sticky olmalı mı?
    if (scrollTop > sectionTop + this.stickyThreshold) {
      if (!this.isSticky) {
        this.activateSticky();
      }
      this.updateStickyPosition(scrollTop);
    } else {
      if (this.isSticky) {
        this.deactivateSticky();
      }
    }
  }

  /**
   * Section'ın orijinal top pozisyonunu al (sticky olmadan önce)
   */
  getSectionOriginalTop() {
    if (this.placeholder && this.placeholder.offsetParent) {
      return this.placeholder.offsetTop;
    }
    return this.section.offsetTop;
  }

  /**
   * Sticky mode'u aktif et
   */
  activateSticky() {
    this.isSticky = true;
    this.section.classList.add('sticky');

    // Placeholder'ı aktif et (section'ın yüksekliği kadar)
    this.sectionHeight = this.section.offsetHeight;
    this.placeholder.style.height = `${this.sectionHeight}px`;
    this.placeholder.classList.add('active');

    Utils.log('Sticky activated');
  }

  /**
   * Sticky mode'u deaktif et
   */
  deactivateSticky() {
    this.isSticky = false;
    this.section.classList.remove('sticky', 'below-header', 'at-top');
    this.section.style.top = '';

    // Placeholder'ı deaktif et
    this.placeholder.style.height = '0';
    this.placeholder.classList.remove('active');

    Utils.log('Sticky deactivated');
  }

  /**
   * Sticky pozisyonunu güncelle (header'a göre)
   */
  updateStickyPosition(scrollTop) {
    if (!this.header) {
      // Header yoksa en üstte
      this.section.classList.remove('below-header');
      this.section.classList.add('at-top');
      this.section.style.top = '0';
      return;
    }

    const headerRect = this.header.getBoundingClientRect();
    const headerTop = headerRect.top;
    const headerBottom = headerRect.bottom;

    // Header tam görünüyorsa (top >= -5) sticky'yi alta al
    // -5px tolerans: küçük scroll'larda header yarım kalmayı önler
    if (headerTop >= -5) {
      // Header tam görünüyor - sticky'yi header'ın altına konumlandır
      this.section.classList.add('below-header');
      this.section.classList.remove('at-top');
      this.section.style.top = `${Math.max(0, headerBottom)}px`;
    } else {
      // Header kayboldu - sticky'yi en üste konumlandır
      this.section.classList.remove('below-header');
      this.section.classList.add('at-top');
      this.section.style.top = '0';
    }
  }

  /**
   * Manual olarak sticky'yi güncelle (external trigger için)
   */
  update() {
    this.handleScroll();
  }

  /**
   * Destroy manager (cleanup)
   */
  destroy() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }

    if (this.isSticky) {
      this.deactivateSticky();
    }

    Utils.log('SearchFilterManager destroyed');
  }
}

export default SearchFilterManager;
