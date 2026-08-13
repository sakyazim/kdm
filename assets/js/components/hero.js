/**
 * Anadolu Üniversitesi Kütüphane - Hero Manager
 * Sayfa hero section yönetimi
 */

import Utils from '../core/utils.js';

export class HeroManager {
  constructor() {
    this.container = null;

    // Hero özelliklerini tek yerden açıp kapatma
    this.config = {
      showBreadcrumb: false,  // true yaparsanız breadcrumb görünür
      showIcon: false,        // true yaparsanız icon görünür
      showBackground: false    // false yaparsanız background image devre dışı
    };
  }

  /**
   * Hero section'ı başlat
   * @param {Object} heroData - Hero verisi (title, description, breadcrumb vb.)
   */
  async init(heroData) {
    this.container = document.getElementById('hero-container');

    if (!this.container) {
      console.warn('Hero container not found');
      return;
    }

    if (!heroData) {
      console.warn('Hero data is empty');
      return;
    }

    this.render(heroData);
  }

  /**
   * Hero section'ı render et
   * @param {Object} heroData - Hero verisi
   */
  render(heroData) {
    const { title, description, breadcrumb, background, icon } = heroData;

    // Çoklu dil desteği
    const localizedTitle = Utils.getLocalizedText(title);
    const localizedDescription = description ? Utils.getLocalizedText(description) : '';

    // Background kontrolü - config'e göre
    const bgClass = (background && this.config.showBackground) ? ' page-hero-bg' : '';
    const bgStyle = (background && this.config.showBackground) ? ` style="background-image: url('${background}')"` : '';

    const heroHTML = `
      <div class="page-hero${bgClass}"${bgStyle}>
        <div class="container">
          ${this.config.showBreadcrumb && breadcrumb ? this.renderBreadcrumb(breadcrumb) : ''}
          <div class="page-hero-content">
            ${this.config.showIcon && icon ? `<div class="page-hero-icon"><i class="${icon}"></i></div>` : ''}
            <h1 class="page-title">${localizedTitle}</h1>
            ${localizedDescription ? `<p class="page-description">${localizedDescription}</p>` : ''}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = heroHTML;
  }

  /**
   * Breadcrumb render et
   * @param {Array} breadcrumbItems - Breadcrumb öğeleri
   * @returns {string} Breadcrumb HTML
   */
  renderBreadcrumb(breadcrumbItems) {
    if (!breadcrumbItems || breadcrumbItems.length === 0) return '';

    const items = breadcrumbItems.map((item, index) => {
      const isLast = index === breadcrumbItems.length - 1;

      // Çoklu dil desteği
      const localizedText = Utils.getLocalizedText(item.text);

      if (isLast) {
        return `<li class="breadcrumb-item active" aria-current="page">${localizedText}</li>`;
      }

      return `<li class="breadcrumb-item"><a href="${item.url}">${localizedText}</a></li>`;
    }).join('');

    return `
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          ${items}
        </ol>
      </nav>
    `;
  }

  /**
   * Hero içeriğini güncelle
   * @param {Object} newData - Yeni hero verisi
   */
  update(newData) {
    this.render(newData);
  }
}

export default HeroManager;
