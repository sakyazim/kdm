/**
 * Anadolu Üniversitesi Kütüphane - Help Section Manager
 * Sayfa yardım bölümü yönetimi
 */

import Utils from '../core/utils.js';

export class HelpSectionManager {
  constructor() {
    this.container = null;
  }

  /**
   * Help section'ı başlat
   * @param {Object} helpData - Help section verisi
   */
  async init(helpData) {
    this.container = document.getElementById('help-container');

    if (!this.container) {
      console.warn('Help container not found');
      return;
    }

    if (!helpData) {
      console.warn('Help data is empty');
      return;
    }

    this.render(helpData);
  }

  /**
   * Help section'ı render et
   * @param {Object} helpData - Help section verisi
   */
  render(helpData) {
    const { title, description, cards, buttons, variant = 'default' } = helpData;

    // Çoklu dil desteği
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';
    const localizedDescription = description ? Utils.getLocalizedText(description) : '';

    const helpHTML = `
      <div class="help-section help-section-${variant}">
        <div class="container">
          <div class="help-header">
            ${localizedTitle ? `<h3><i class="fas fa-headset"></i> ${localizedTitle}</h3>` : ''}
            ${localizedDescription ? `<p>${localizedDescription}</p>` : ''}
          </div>
          ${buttons && buttons.length > 0 ? this.renderButtons(buttons) : ''}
          ${cards && cards.length > 0 ? this.renderCards(cards) : ''}
        </div>
      </div>
    `;

    this.container.innerHTML = helpHTML;
  }

  /**
   * Help butonlarını render et
   * @param {Array} buttons - Buton verileri
   * @returns {string} Butonlar HTML
   */
  renderButtons(buttons) {
    const buttonsHTML = buttons.map(btn => {
      const buttonClass = btn.class || 'btn-outline-primary';

      // Çoklu dil desteği
      const localizedText = Utils.getLocalizedText(btn.text || 'Bilgi');

      return `
        <a href="${btn.link || btn.url || '#'}" class="btn ${buttonClass}">
          <i class="${btn.icon || 'bi bi-info-circle'}"></i>
          <span>${localizedText}</span>
        </a>
      `;
    }).join('');

    return `
      <div class="help-actions">
        ${buttonsHTML}
      </div>
    `;
  }

  /**
   * Help kartlarını render et
   * @param {Array} cards - Kart verileri
   * @returns {string} Kartlar HTML
   */
  renderCards(cards) {
    const cardsHTML = cards.map(card => this.renderCard(card)).join('');

    return `
      <div class="help-actions">
        ${cardsHTML}
      </div>
    `;
  }

  /**
   * Tek bir help kartı render et
   * @param {Object} card - Kart verisi
   * @returns {string} Kart HTML
   */
  renderCard(card) {
    const {
      icon,
      title,
      description,
      link,
      linkText = 'Detaylı Bilgi',
      variant = 'primary',
      iconBg = ''
    } = card;

    // Çoklu dil desteği
    const localizedLinkText = Utils.getLocalizedText(linkText);
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';

    const iconClass = icon || 'bi bi-info-circle';

    return `
      <a href="${link || '#'}" class="btn btn-${variant}">
        <i class="${iconClass}"></i>
        <span>${localizedLinkText || localizedTitle}</span>
      </a>
    `;
  }

  /**
   * Help section içeriğini güncelle
   * @param {Object} newData - Yeni help section verisi
   */
  update(newData) {
    this.render(newData);
  }

  /**
   * Help section'ı temizle
   */
  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

export default HelpSectionManager;
