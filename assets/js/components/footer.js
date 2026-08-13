/**
 * Anadolu Üniversitesi Kütüphane - Footer Component
 * JSON dosyasından veri çekerek footer'ı render eder
 */

import { NavigationActiveManager } from '../utils/navigation-active-manager.js';
import Utils from '../core/utils.js';

export class FooterManager {
  constructor() {
    this.footerContainer = null;
    this.footerData = null;
  }

  /**
   * Footer'ı başlat
   * @param {Object} footerData - Footer verisi (opsiyonel, yoksa JSON'dan yükler)
   */
  async init(footerData = null) {
    this.footerContainer = document.getElementById('footer-container');

    if (!this.footerContainer) {
      console.warn('Footer container not found');
      return;
    }

    // Eğer veri parametre olarak geldiyse kullan, yoksa yükle
    if (footerData) {
      this.footerData = footerData;
      this.render();
    } else {
      await this.loadFooterData();
      this.render();
    }

    // Aktif navigasyon öğelerini işaretle
    this.setActiveNavigation();
  }

  /**
   * Footer verilerini JSON'dan yükle (fallback)
   */
  async loadFooterData() {
    try {
      const response = await fetch('/data/global/footer.json');
      if (!response.ok) {
        throw new Error('Footer data could not be loaded');
      }
      this.footerData = await response.json();
      console.log('Footer data loaded from JSON');
    } catch (error) {
      console.error('Error loading footer data:', error);
      // JSON yüklenemezse default data kullan
      this.footerData = this.getDefaultFooterData();
      console.log('Using default footer data');
    }
  }

  /**
   * Varsayılan footer verisi (fallback)
   * @returns {Object} Footer data object
   */
  getDefaultFooterData() {
    return {
      contactInfo: [
        {
          icon: "bi bi-telephone-fill",
          text: "0 222 335 05 80 / 1730",
          url: "tel:+902223350580"
        },
        {
          icon: "bi bi-envelope-fill",
          text: "library@anadolu.edu.tr",
          url: "mailto:library@anadolu.edu.tr"
        },
        {
          icon: "bi bi-geo-alt-fill",
          text: "Anadolu Üniversitesi, Eskişehir",
          url: "https://goo.gl/maps/YJrNZmkJFVGACbL99",
          target: "_blank"
        }
      ],
      socialMedia: [
        {
          icon: "bi bi-facebook",
          url: "https://facebook.com/anadoluuniversitesi",
          title: "Facebook",
          target: "_blank"
        },
        {
          icon: "bi bi-twitter-x",
          url: "https://twitter.com/anadoluuni",
          title: "Twitter",
          target: "_blank"
        },
        {
          icon: "bi bi-instagram",
          url: "https://instagram.com/anadoluuniversitesi",
          title: "Instagram",
          target: "_blank"
        },
        {
          icon: "bi bi-youtube",
          url: "https://youtube.com/@anadoluuniversitesi",
          title: "YouTube",
          target: "_blank"
        },
        {
          icon: "bi bi-linkedin",
          url: "https://linkedin.com/school/anadolu-universitesi",
          title: "LinkedIn",
          target: "_blank"
        }
      ],
      columns: [
        {
          title: "E-Kaynaklar",
          links: [
            {
              text: "Veritabanları",
              url: "databases.html"
            },
            {
              text: "Bütünleşik Arama",
              url: "#"
            },
            {
              text: "Kurumsal Akademik Arşiv",
              url: "#"
            },
            {
              text: "Uzaktan Erişim",
              url: "#"
            },
            {
              text: "Açık Kütüphane",
              url: "#"
            }
          ]
        },
        {
          title: "Araştırma",
          links: [
            {
              text: "Makale İşlem Ücretleri (APC)",
              url: "#"
            },
            {
              text: "Referans Yönetim Aracı (Mendeley)",
              url: "#"
            },
            {
              text: "Araştırmacı Profili Oluşturma",
              url: "#"
            },
            {
              text: "Bilgisayar Laboratuvarı",
              url: "#"
            },
            {
              text: "Çalışma Odaları",
              url: "#"
            }
          ]
        },
        {
          title: "Rehber",
          links: [
            {
              text: "Üyelik ve Ödünç İşlemleri",
              url: "#"
            },
            {
              text: "Kütüphanelerarası İşbirliği (ILL)",
              url: "#"
            },
            {
              text: "Kime Sormalıyım",
              url: "#"
            },
            {
              text: "Sıkça Sorulan Sorular (SSS)",
              url: "sss.html"
            },
            {
              text: "Formlar",
              url: "#"
            },
            {
              text: "Eğitim Programları",
              url: "#"
            }
          ]
        },
        {
          title: "Hakkımızda",
          links: [
            {
              text: "İletişim",
              url: "#"
            },
            {
              text: "Çalışma Saatleri",
              url: "#"
            },
            {
              text: "Personel",
              url: "#"
            },
            {
              text: "Organizasyon Şeması",
              url: "#"
            },
            {
              text: "Tarihçe & Genel Bilgiler",
              url: "tarihce.html"
            },
            {
              text: "Kurallar",
              url: "#"
            },
            {
              text: "Koleksiyon (Kat Planı)",
              url: "#"
            },
            {
              text: "İstatistikler ve Raporlar",
              url: "#"
            }
          ]
        }
      ],
      copyright: "© Anadolu Üniversitesi Kütüphane ve Dokümantasyon Dairesi Başkanlığı",
      legalLinks: [
        {
          text: "Gizlilik",
          url: "#"
        },
        {
          text: "Koşullar",
          url: "#"
        },
        {
          text: "Erişilebilirlik",
          url: "#"
        }
      ]
    };
  }

  /**
   * Footer HTML'ini oluştur ve render et
   */
  render() {
    if (!this.footerData) {
      console.warn('Footer data not available');
      return;
    }

    const footerHTML = `
<!-- Footer start -->
<footer class="footer">
  <!-- Footer Top Info - Contact and Social -->
  <div class="footer-top-info">
    <div class="container">
      <div class="row">
        <div class="col-md-8">
          <div class="contact-links">
            ${this.renderContactLinks()}
          </div>
        </div>
        <div class="col-md-4">
          <div class="social-links">
            ${this.renderSocialLinks()}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer Content - Links organized in columns (Desktop) -->
  <div class="footer-content-wrapper">
    <div class="container">
      <div class="row">
        ${this.renderColumns()}
      </div>
    </div>
  </div>

  <!-- Mobile Footer Menu Button -->
  <div class="mobile-footer-menu-container">
    <div class="container">
      <button class="mobile-footer-menu-btn" aria-label="Footer Menüsünü Aç">
        <i class="bi bi-list-ul"></i>
        <span>Site Haritası</span>
        <i class="bi bi-chevron-up"></i>
      </button>
    </div>
  </div>

  <!-- Mobile Footer Menu Panel -->
  <div class="mobile-footer-overlay"></div>
  <div class="mobile-footer-panel">
    <div class="mobile-footer-header">
      <h3 class="mobile-footer-title">
        <i class="bi bi-list-ul"></i>
        Site Haritası
      </h3>
      <button class="mobile-footer-close" aria-label="Menüyü Kapat">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>
    <nav class="mobile-footer-content">
      ${this.renderMobileFooterMenu()}
    </nav>
  </div>

  <!-- Footer Bottom - Copyright and legal links -->
  <div class="footer-bottom-wrapper">
    <div class="container">
      <div class="row">
        <div class="col-md-8">
          <div class="copyright">
            ${Utils.getLocalizedText(this.footerData.copyright)}
          </div>
        </div>
        <div class="col-md-4">
          <div class="footer-legal">
            ${this.renderLegalLinks()}
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>
<!-- Footer end -->
    `;

    this.footerContainer.innerHTML = footerHTML;

    // Mobil footer menü setup
    this.setupMobileFooterMenu();
  }

  /**
   * İletişim linklerini render et
   */
  renderContactLinks() {
    if (!this.footerData.contactInfo) return '';

    return this.footerData.contactInfo.map(contact => {
      const target = contact.target ? `target="${contact.target}"` : '';
      const text = Utils.getLocalizedText(contact.text);
      return `<a href="${contact.url}" ${target}><i class="${contact.icon}"></i> ${text}</a>`;
    }).join('\n            ');
  }

  /**
   * Sosyal medya linklerini render et
   */
  renderSocialLinks() {
    if (!this.footerData.socialMedia) return '';

    return this.footerData.socialMedia.map(social => {
      const target = social.target ? `target="${social.target}"` : '';
      return `<a href="${social.url}" aria-label="${social.title}" ${target}><i class="${social.icon}"></i></a>`;
    }).join('\n            ');
  }

  /**
   * Footer kolonlarını render et
   */
  renderColumns() {
    if (!this.footerData.columns) return '';

    return this.footerData.columns.map(column => {
      const columnTitle = Utils.getLocalizedText(column.title);
      const links = column.links.map(link => {
        const linkText = Utils.getLocalizedText(link.text);
        return `<li><a href="${link.url}">${linkText}</a></li>`;
      }).join('\n            ');

      return `
        <!-- ${columnTitle} Column -->
        <div class="col-md-3 footer-column">
          <h4 class="footer-title">${columnTitle}</h4>
          <ul class="footer-links">
            ${links}
          </ul>
        </div>`;
    }).join('\n');
  }

  /**
   * Yasal linkleri render et
   */
  renderLegalLinks() {
    if (!this.footerData.legalLinks) return '';

    return this.footerData.legalLinks.map(link => {
      const linkText = Utils.getLocalizedText(link.text);
      return `<a href="${link.url}">${linkText}</a>`;
    }).join('\n            ');
  }

  /**
   * Mobil footer menüsünü render et (accordion yapısı)
   */
  renderMobileFooterMenu() {
    if (!this.footerData.columns) return '';

    return this.footerData.columns.map((column, index) => {
      const columnTitle = Utils.getLocalizedText(column.title);
      const links = column.links.map(link => {
        const linkText = Utils.getLocalizedText(link.text);
        return `
        <a href="${link.url}" class="mobile-footer-submenu-link">
          <i class="bi bi-arrow-right-short"></i>
          ${linkText}
        </a>
      `;
      }).join('');

      return `
        <div class="mobile-footer-menu-item">
          <button class="mobile-footer-menu-link" type="button">
            <span>${columnTitle}</span>
            <i class="bi bi-chevron-down mobile-footer-arrow"></i>
          </button>
          <div class="mobile-footer-submenu">
            ${links}
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Mobil footer menü kurulumu
   */
  setupMobileFooterMenu() {
    const menuBtn = document.querySelector('.mobile-footer-menu-btn');
    const menuPanel = document.querySelector('.mobile-footer-panel');
    const menuOverlay = document.querySelector('.mobile-footer-overlay');
    const menuClose = document.querySelector('.mobile-footer-close');
    const menuItems = document.querySelectorAll('.mobile-footer-menu-link');

    if (!menuBtn || !menuPanel || !menuOverlay) return;

    // Menü aç/kapat
    const toggleMenu = (open) => {
      if (open) {
        menuPanel.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        menuPanel.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    };

    // Buton tıklama
    menuBtn.addEventListener('click', () => toggleMenu(true));

    // Kapat butonu
    if (menuClose) {
      menuClose.addEventListener('click', () => toggleMenu(false));
    }

    // Overlay tıklama
    menuOverlay.addEventListener('click', () => toggleMenu(false));

    // ESC tuşu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menuPanel.classList.contains('active')) {
        toggleMenu(false);
      }
    });

    // Accordion davranışı
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const parent = item.closest('.mobile-footer-menu-item');
        const submenu = parent.querySelector('.mobile-footer-submenu');
        const arrow = item.querySelector('.mobile-footer-arrow');

        if (!submenu) return;

        const isOpen = submenu.classList.contains('active');

        // Tüm alt menüleri kapat
        document.querySelectorAll('.mobile-footer-submenu').forEach(sub => {
          sub.classList.remove('active');
        });
        document.querySelectorAll('.mobile-footer-arrow').forEach(arr => {
          arr.classList.remove('rotated');
        });

        // Eğer kapalıysa aç
        if (!isOpen) {
          submenu.classList.add('active');
          arrow.classList.add('rotated');
        }
      });
    });

    console.log('Mobile footer menu initialized');
  }

  /**
   * Aktif navigasyon öğelerini işaretle
   */
  setActiveNavigation() {
    // Desktop footer için aktiflik ayarla
    NavigationActiveManager.setActiveItems('.footer-content-wrapper', {
      skipHomepage: true,          // Anasayfada aktiflik yok
      skipExternalLinks: true,     // Dış linkler aktif olmasın
      skipLanguageSwitcher: true,  // Footer'da dil değiştirici yok
      markParentDropdown: false    // Footer'da üst menü işaretleme yok
    });

    // Mobil footer için aktiflik ayarla
    NavigationActiveManager.setActiveItems('.mobile-footer-panel', {
      skipHomepage: true,
      skipExternalLinks: true,
      skipLanguageSwitcher: true,
      markParentDropdown: true     // Mobil footer'da parent işaretle
    });

    console.log('FooterManager: Aktif navigasyon ayarlandı (Desktop + Mobile)');
  }
}

export default FooterManager;
