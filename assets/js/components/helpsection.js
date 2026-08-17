/**
 * Anadolu Üniversitesi Kütüphane - Help Section Manager
 * Sayfa yardım bölümü yönetimi
 */

import Utils from '../core/utils.js';

export class HelpSectionManager {
  constructor() {
    this.container = null;
    this.modalLibrary = null; // data/global/modals.json önbelleği
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
    this.bindModalTriggers();
  }

  /**
   * Varyant adını Bootstrap buton sınıfına çevir
   */
  variantClass(variant) {
    const map = {
      'primary': 'btn-primary',
      'secondary': 'btn-secondary',
      'outline': 'btn-outline-primary',
      'outline-secondary': 'btn-outline-secondary',
      'outline-danger': 'btn-outline-danger',
      'default': 'btn-outline-primary',
    };
    return map[variant] || 'btn-outline-primary';
  }

  /**
   * Help butonlarını render et
   * @param {Array} buttons - Buton verileri
   * @returns {string} Butonlar HTML
   */
  renderButtons(buttons) {
    const buttonsHTML = buttons.map(btn => {
      const buttonClass = btn.class || this.variantClass(btn.variant);

      // Çoklu dil desteği
      const localizedText = Utils.getLocalizedText(btn.text || 'Bilgi');

      // Modal butonu: btn.modal içeriği VEYA btn.modalId (kütüphaneden) ile modal açılır
      if (btn.type === 'modal' || btn.modal || btn.modalId) {
        const modalTitle = Utils.getLocalizedText((btn.modal && btn.modal.title) || btn.text);
        const modalBody = Utils.getLocalizedText((btn.modal && btn.modal.body) || '');
        return `
          <button type="button" class="btn ${buttonClass} help-modal-trigger" data-modal-id="${this.escapeAttr(btn.modalId || '')}" data-modal-title="${this.escapeAttr(modalTitle)}" data-modal-body="${this.escapeAttr(modalBody)}">
            <i class="${btn.icon || 'bi bi-info-circle'}"></i>
            <span>${localizedText}</span>
          </button>
        `;
      }

      // Normal bağlantı butonu: link || url || action (eski/uyumluluk)
      const href = btn.link || btn.url || btn.action || '#';
      const isExternal = /^(https?:|mailto:|tel:)/.test(href);
      return `
        <a href="${href}" class="btn ${buttonClass}" ${isExternal ? 'target="_blank" rel="noopener"' : ''}>
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
   * HTML attribute güvenli metin (tırnak/XSS koruması)
   */
  escapeAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Modal butonlarına tıklama dinleyicisi ekle
   */
  bindModalTriggers() {
    this.container.querySelectorAll('.help-modal-trigger').forEach(btn => {
      btn.addEventListener('click', async () => {
        // Öncelik: kütüphaneden modalId ile HTML yükle; yoksa doğrudan gövde kullan
        if (btn.dataset.modalId) {
          const html = await this.loadLibraryModal(btn.dataset.modalId);
          if (html !== null) {
            const lib = this.modalLibrary || { modals: [] };
            const m = (lib.modals || []).find(x => x.id === btn.dataset.modalId);
            const title = Utils.getLocalizedText((m && m.label) || btn.dataset.modalTitle);
            this.openHelpModal(title, html);
            return;
          }
        }
        this.openHelpModal(btn.dataset.modalTitle, btn.dataset.modalBody);
      });
    });
  }

  /**
   * Genel modal kütüphanesinden (data/global/modals.json) modal HTML'ini yükler
   * @param {string} id - Kütüphanedeki modal id'si
   * @returns {Promise<string|null>} HTML içeriği (TR/EN dile göre) veya null
   */
  async loadLibraryModal(id) {
    try {
      if (!this.modalLibrary) {
        const res = await fetch('data/global/modals.json', { cache: 'no-store' });
        this.modalLibrary = await res.json();
      }
      const m = (this.modalLibrary.modals || []).find(x => x.id === id);
      if (!m || !m.html) return null;
      const html = Utils.getLocalizedText(m.html);
      return html || null;
    } catch (e) {
      console.warn('Modal kütüphanesi yüklenemedi:', e);
      return null;
    }
  }

  /**
   * Help modalı aç (değerlendirme / sorun bildir gibi içerikler için)
   */
  openHelpModal(title, bodyHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'help-modal-overlay';
    overlay.innerHTML = `
      <div class="help-modal" role="dialog" aria-modal="true">
        <button type="button" class="help-modal-close" aria-label="Kapat">&times;</button>
        <h3>${title}</h3>
        <div class="help-modal-body">${bodyHtml}</div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('.help-modal-close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    this.initStarRating(overlay);
    overlay.querySelectorAll('.modal-alert-close').forEach((btn) => {
      btn.addEventListener('click', () => { btn.closest('.modal-alert').remove(); });
    });
  }

  /**
   * Yıldız değerlendirme: tıklanınca seçimi işaretle ve (form içindeyse) gizli input'a yaz
   */
  initStarRating(root) {
    root.querySelectorAll('.star-rating').forEach(rating => {
      const stars = Array.from(rating.querySelectorAll('span'));
      if (!stars.length) return;
      // Backend'e değer taşıyabilmesi için gizli input ekle
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'rating';
      hidden.value = '';
      rating.appendChild(hidden);
      const apply = (n) => {
        stars.forEach((s, i) => s.classList.toggle('active', i < n));
        hidden.value = String(n);
        rating.setAttribute('data-value', String(n));
      };
      stars.forEach((s, i) => {
        s.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          apply(i + 1);
        });
      });
    });
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
