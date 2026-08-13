import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import Utils from '../core/utils.js';

/**
 * Anadolu Üniversitesi Araştırma Sayfaları
 * Tek sınıf 4 farklı sayfa için kullanılıyor:
 * - Araştırma Birimleri
 * - Araştırma Mevzuatı
 * - Araştırma Duyuruları
 * - Araştırmalardan Haberler
 */
export class AnadoluArastirmaPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
    this.pageName = null;
  }

  async init() {
    // Sayfa adını al
    this.pageName = document.body.getAttribute('data-page-name');

    // Sayfa verisini yükle
    this.pageData = await this.app.loadPageData(this.pageName);

    if (!this.pageData) {
      console.error(`${this.pageName} page data could not be loaded.`);
      this.renderEmptyState();
      return;
    }

    // Hero ve Help section'ları render et
    await this.heroManager.init(this.pageData.hero);
    await this.helpSectionManager.init(this.pageData.help);

    // İçeriği render et
    this.renderContent(this.pageData.content);
  }

  renderContent(content) {
    const container = document.getElementById('lab-content');
    if (!container) {
      console.error('#lab-content container not found');
      return;
    }

    console.log('🔍 [AnadoluArastirma] renderContent called:', {
      pageName: this.pageName,
      hasContent: !!content,
      hasCards: !!(content && content.cards),
      cardsLength: content && content.cards ? content.cards.length : 0,
      firstCardContent: content && content.cards && content.cards[0] ? content.cards[0].content : null
    });

    // İçerik kontrolü
    if (!content || !content.cards || content.cards.length === 0) {
      console.warn('⚠️ [AnadoluArastirma] Empty content: no cards found');
      this.renderEmptyState();
      return;
    }

    // İlk card'ın içeriği boş mu kontrol et
    const firstCard = content.cards[0];
    if (!firstCard.content || (Array.isArray(firstCard.content) && firstCard.content.length === 0)) {
      console.warn('⚠️ [AnadoluArastirma] Empty content: first card has no content');
      this.renderEmptyState();
      return;
    }

    // Normal render
    console.log('✅ [AnadoluArastirma] Rendering content with', content.cards.length, 'cards');
    let html = '';
    content.cards.forEach(card => {
      html += this.renderCard(card);
    });
    container.innerHTML = html;
  }

  renderCard(card) {
    const title = Utils.getLocalizedText(card.title);

    let contentHtml = '';
    // card.content direkt olarak işle, Utils.getLocalizedText kullanma (çünkü içinde objeler var)
    if (Array.isArray(card.content)) {
      contentHtml = '<div class="component-icon-list"><div class="list-wrapper">';
      card.content.forEach(item => {
        // item can be either a string or an object with {text: "", link: ""}
        if (typeof item === 'string') {
          const itemText = Utils.getLocalizedText(item);
          contentHtml += `<div class="list-item"><i class="bi bi-check-circle-fill"></i><span>${itemText}</span></div>`;
        } else if (item.text) {
          const itemText = Utils.getLocalizedText(item.text);
          if (item.link) {
            contentHtml += `<div class="list-item"><i class="bi bi-link-45deg"></i><span><a href="${item.link}" target="_blank" rel="noopener">${itemText}</a></span></div>`;
          } else {
            contentHtml += `<div class="list-item"><i class="bi bi-check-circle-fill"></i><span>${itemText}</span></div>`;
          }
        }
      });
      contentHtml += '</div></div>';
    } else if (card.content) {
      const content = Utils.getLocalizedText(card.content);
      contentHtml = `<p>${content}</p>`;
    }

    // Handle subtitle
    let subtitleHtml = '';
    if (card.subtitle) {
      const subtitle = Utils.getLocalizedText(card.subtitle);
      subtitleHtml = `<div class="card-subtitle">${subtitle}</div>`;
    }

    return `
      <div class="col-md-12 mb-4">
        <div class="section-card">
          <div class="component-heading single-icon">
            <i class="bi bi-list-ul"></i>
            <h2>${title}</h2>
          </div>
          <div class="section-card-body">
            ${subtitleHtml}
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Boş içerik durumu için uyarı mesajı göster
   */
  renderEmptyState() {
    const container = document.getElementById('lab-content');
    if (!container) return;

    const emptyMessage = {
      tr: 'Bu sayfa için henüz içerik girilmemiştir. Lütfen daha sonra tekrar kontrol ediniz.',
      en: 'No content has been entered for this page yet. Please check back later.'
    };

    container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info" role="alert">
          <i class="fas fa-info-circle me-2"></i>
          ${Utils.getLocalizedText(emptyMessage)}
        </div>
      </div>
    `;
  }
}

// Export edilebilecek tüm sınıf isimleri (geriye dönük uyumluluk için)
export const ArastirmaBirimleriPage = AnadoluArastirmaPage;
export const ArastirmaMevzuatiPage = AnadoluArastirmaPage;
export const ArastirmaDuyurulariPage = AnadoluArastirmaPage;
export const ArastirmalardenHaberlerPage = AnadoluArastirmaPage;
