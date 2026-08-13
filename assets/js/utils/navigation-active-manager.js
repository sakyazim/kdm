/**
 * Navigation Active Manager
 * Header ve Footer için ortak aktiflik yönetimi
 */

export class NavigationActiveManager {
  /**
   * Verilen container içindeki navigationda aktif öğeyi işaretle
   * @param {string} containerSelector - Container CSS selector (.main-header, .main-footer)
   * @param {Object} options - Opsiyonlar
   */
  static setActiveItems(containerSelector, options = {}) {
    const {
      skipHomepage = true,           // Anasayfada aktiflik gösterme
      skipExternalLinks = true,      // Dış linkleri atla
      skipLanguageSwitcher = false,  // Dil değiştiricisini atla (header için false, footer için true)
      activeClass = 'active',        // Active class adı
      markParentDropdown = true      // Üst dropdown'ı da işaretle
    } = options;

    const container = document.querySelector(containerSelector);
    if (!container) {
      console.warn(`NavigationActiveManager: Container bulunamadı: ${containerSelector}`);
      return;
    }

    // Mevcut sayfa bilgilerini al
    const currentPath = window.location.pathname;
    const currentHost = window.location.hostname;
    const isHomepage = currentPath === '/' || currentPath === '/index.html';

    // Anasayfada aktiflik gösterme
    if (skipHomepage && isHomepage) {
      console.log('NavigationActiveManager: Anasayfa - Aktiflik gösterilmiyor');
      return;
    }

    // Tüm active class'ları temizle
    this._clearActiveClasses(container, activeClass);

    // Mobil menü ve footer için özel kontrol
    const isMobileMenu = containerSelector.includes('mobile-menu');
    const isMobileFooter = containerSelector.includes('mobile-footer');

    // Dropdown item'larda ara (desktop, mobil header ve mobil footer için)
    let foundInDropdown = false;
    let dropdownSelector;

    if (isMobileMenu) {
      dropdownSelector = '.mobile-submenu-link';
    } else if (isMobileFooter) {
      dropdownSelector = '.mobile-footer-submenu-link';
    } else {
      dropdownSelector = '.dropdown-item';
    }

    const dropdownItems = container.querySelectorAll(dropdownSelector);

    for (const item of dropdownItems) {
      // Dil değiştiricisini atla
      if (skipLanguageSwitcher && item.closest('.language-switcher')) {
        continue;
      }

      // # veya javascript: ile başlayan linkleri atla
      if (item.href === '#' || item.href.endsWith('#') || item.href.startsWith('javascript:')) {
        continue;
      }

      try {
        const itemUrl = new URL(item.href, window.location.origin);
        const itemPath = itemUrl.pathname;
        const itemHost = itemUrl.hostname;

        // # hash'i olan linkleri atla (sadece hash varsa)
        if (itemUrl.hash && itemPath === currentPath && itemUrl.hash === item.href.split(currentPath)[1]) {
          continue;
        }

        // Dış linkleri atla
        if (skipExternalLinks && itemHost !== currentHost) {
          continue;
        }

        // URL eşleşmesi kontrolü
        if (itemPath === currentPath) {
          item.classList.add(activeClass);
          foundInDropdown = true;

          // Üst dropdown'ı da işaretle
          if (markParentDropdown) {
            if (isMobileMenu) {
              // Mobil header menü için parent item'ı işaretle
              const parentMobileItem = item.closest('.mobile-menu-item');
              if (parentMobileItem) {
                parentMobileItem.classList.add(activeClass);
              }
            } else if (isMobileFooter) {
              // Mobil footer için parent item'ı işaretle
              const parentMobileFooterItem = item.closest('.mobile-footer-menu-item');
              if (parentMobileFooterItem) {
                parentMobileFooterItem.classList.add(activeClass);
              }
            } else {
              // Desktop için parent dropdown'ı işaretle
              const parentDropdown = item.closest('.dropdown') || item.closest('.nav-item');
              if (parentDropdown) {
                parentDropdown.classList.add(activeClass);
              }
            }
          }

          console.log(`NavigationActiveManager: Aktif dropdown item bulundu: ${itemPath}`);
          break;
        }
      } catch (e) {
        // Geçersiz URL'leri atla
        console.warn('NavigationActiveManager: Geçersiz URL:', item.href);
      }
    }

    // Dropdown'da bulunamadıysa, ana menü linklerinde ara
    if (!foundInDropdown) {
      let mainNavSelector;

      if (isMobileMenu) {
        mainNavSelector = '.mobile-menu-link';
      } else if (isMobileFooter) {
        mainNavSelector = '.mobile-footer-menu-link';
      } else {
        mainNavSelector = '.nav-link:not(.dropdown-toggle)';
      }

      const mainNavLinks = container.querySelectorAll(mainNavSelector);

      for (const link of mainNavLinks) {
        // Mobil menü ve footer'da button'ları atla (bunlar dropdown toggle'lar)
        if ((isMobileMenu || isMobileFooter) && link.tagName === 'BUTTON') {
          continue;
        }

        // Dil değiştiricisini atla
        if (skipLanguageSwitcher && link.closest('.language-switcher')) {
          continue;
        }

        // Desktop'ta dropdown toggle'ları atla
        if (!isMobileMenu && link.classList.contains('dropdown-toggle')) {
          continue;
        }

        // # veya javascript: ile başlayan linkleri atla
        if (link.href === '#' || link.href.endsWith('#') || link.href.startsWith('javascript:')) {
          continue;
        }

        try {
          const linkUrl = new URL(link.href, window.location.origin);
          const linkPath = linkUrl.pathname;
          const linkHost = linkUrl.hostname;

          // Dış linkleri atla
          if (skipExternalLinks && linkHost !== currentHost) {
            continue;
          }

          // URL eşleşmesi kontrolü
          if (linkPath === currentPath) {
            if (isMobileMenu) {
              // Mobil header menü için link'i ve parent'ını işaretle
              link.classList.add(activeClass);
              const parentMobileItem = link.closest('.mobile-menu-item');
              if (parentMobileItem) {
                parentMobileItem.classList.add(activeClass);
              }
            } else if (isMobileFooter) {
              // Mobil footer için link'i ve parent'ını işaretle
              link.classList.add(activeClass);
              const parentMobileFooterItem = link.closest('.mobile-footer-menu-item');
              if (parentMobileFooterItem) {
                parentMobileFooterItem.classList.add(activeClass);
              }
            } else {
              // Desktop için nav-item'ı işaretle
              const parentNavItem = link.closest('.nav-item');
              if (parentNavItem) {
                parentNavItem.classList.add(activeClass);
              }
            }
            console.log(`NavigationActiveManager: Aktif nav item bulundu: ${linkPath}`);
            break;
          }
        } catch (e) {
          // Geçersiz URL'leri atla
          console.warn('NavigationActiveManager: Geçersiz URL:', link.href);
        }
      }
    }

    // Footer linkleri için özel kontrol (dropdown olmayan basit linkler)
    if (!foundInDropdown && containerSelector.includes('footer')) {
      const footerLinks = container.querySelectorAll('.footer-links a');

      for (const link of footerLinks) {
        // # veya javascript: ile başlayan linkleri atla
        if (link.href === '#' || link.href.endsWith('#') || link.href.startsWith('javascript:')) {
          continue;
        }

        try {
          const linkUrl = new URL(link.href, window.location.origin);
          const linkPath = linkUrl.pathname;
          const linkHost = linkUrl.hostname;

          // Dış linkleri atla
          if (skipExternalLinks && linkHost !== currentHost) {
            continue;
          }

          // URL eşleşmesi kontrolü
          if (linkPath === currentPath) {
            link.classList.add(activeClass);
            console.log(`NavigationActiveManager: Aktif footer link bulundu: ${linkPath}`);
            break;
          }
        } catch (e) {
          // Geçersiz URL'leri atla
          console.warn('NavigationActiveManager: Geçersiz URL:', link.href);
        }
      }
    }
  }

  /**
   * Dil değiştirici için aktif dili işaretle
   * @param {string} containerSelector - Container CSS selector
   * @param {string} currentLanguage - Mevcut dil kodu (tr, en, vb.)
   */
  static setActiveLanguage(containerSelector, currentLanguage) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const languageSwitcher = container.querySelector('.language-switcher');
    if (!languageSwitcher) return;

    // Tüm dil item'larından active class'ı kaldır
    const languageItems = languageSwitcher.querySelectorAll('.dropdown-item');
    languageItems.forEach(item => item.classList.remove('active'));

    // Mevcut dili işaretle
    const activeLanguageItem = languageSwitcher.querySelector(`[data-language="${currentLanguage}"]`);
    if (activeLanguageItem) {
      activeLanguageItem.classList.add('active');
      console.log(`NavigationActiveManager: Aktif dil ayarlandı: ${currentLanguage}`);
    }
  }

  /**
   * Container içindeki tüm active class'ları temizle
   * @private
   */
  static _clearActiveClasses(container, activeClass) {
    const activeElements = container.querySelectorAll(`.${activeClass}`);
    activeElements.forEach(el => {
      // Dil seçiciyi koruyalım (language-switcher içindeki active'ler silinmesin)
      if (!el.closest('.language-switcher')) {
        el.classList.remove(activeClass);
      }
    });
  }

  /**
   * Sayfa değiştiğinde aktifliği güncelle (SPA uygulamalar için)
   * @param {string} headerSelector - Header container selector
   * @param {string} footerSelector - Footer container selector
   */
  static updateOnPageChange(headerSelector = '.main-header', footerSelector = '.main-footer') {
    // Header için aktiflik
    this.setActiveItems(headerSelector, {
      skipHomepage: true,
      skipExternalLinks: true,
      skipLanguageSwitcher: false,
      markParentDropdown: true
    });

    // Footer için aktiflik
    this.setActiveItems(footerSelector, {
      skipHomepage: true,
      skipExternalLinks: true,
      skipLanguageSwitcher: true,
      markParentDropdown: false
    });
  }
}

export default NavigationActiveManager;
