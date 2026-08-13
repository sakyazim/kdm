/**
 * Duyurular Bileşeni - Görseldeki Tasarım
 * 3 duyuru/sayfa, otomatik pagination
 */

import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

export class AnnouncementsComponent {
  constructor(appInstance) {
    this.app = appInstance;
    this.data = null;
    this.currentPage = 1;
    this.itemsPerPage = this.getItemsPerPage(); // Responsive: 3 desktop, 2 mobil
    this.totalPages = 0;

    // Resize listener
    window.addEventListener('resize', () => {
      const newItemsPerPage = this.getItemsPerPage();
      if (newItemsPerPage !== this.itemsPerPage) {
        this.itemsPerPage = newItemsPerPage;
        if (this.data) {
          this.currentPage = 1;
          this.init(this.data);
        }
      }
    });
  }

  /**
   * Ekran boyutuna göre duyuru sayısı
   */
  getItemsPerPage() {
    return window.innerWidth <= 767.98 ? 2 : 3;
  }

  /**
   * Başlat
   */
  init(data) {
    this.data = data;
    
    if (!this.data || this.data.length === 0) {
      console.warn('Duyuru verisi yok');
      this.renderEmpty();
      return;
    }
    
    this.totalPages = Math.ceil(this.data.length / this.itemsPerPage);
    this.render();
    this.setupPagination();
    
    console.log(`✅ ${this.data.length} duyuru, ${this.totalPages} sayfa yüklendi`);
  }

  /**
   * Render
   */
  render() {
    const wrapper = document.querySelector('.announcements-wrapper');
    if (!wrapper) return;

    // 3'er 3'er sayfalara böl
    const pages = [];
    for (let i = 0; i < this.data.length; i += this.itemsPerPage) {
      pages.push(this.data.slice(i, i + this.itemsPerPage));
    }

    wrapper.innerHTML = pages.map((page, idx) => `
      <ul class="announcements-list${idx === 0 ? ' active' : ''}" data-page="${idx + 1}">
        ${page.map(item => this.renderItem(item)).join('')}
      </ul>
    `).join('');
  }

  /**
   * Tek duyuru
   */
  renderItem(item) {
    const date = new Date(item.date);
    const day = date.getDate();
    const month = this.getMonthShort(date);

    // Çoklu dil desteği
    const title = Utils.getLocalizedText(item.title);
    const summary = Utils.getLocalizedText(item.summary);
    const readMoreText = Utils.getLocalizedText({ tr: 'Devamını Oku', en: 'Read More' });

    // Action type'a göre URL oluştur
    const actionUrl = this.getActionUrl(item);
    const actionTarget = item.actionType === 'external' ? '_blank' : '_self';

    return `
      <li class="announcement-item">
        <a href="${actionUrl}" target="${actionTarget}" class="announcement-link">
          <div class="announcement-date">
            <div class="date-day">${day}</div>
            <div class="date-month">${month}</div>
          </div>
          <div class="announcement-content">
            <h4 class="announcement-title">${this.escape(title)}</h4>
            <p class="announcement-description">${this.escape(summary)}</p>
            <span class="read-more">${readMoreText}</span>
          </div>
        </a>
      </li>
    `;
  }

  /**
   * Action type'a göre URL oluştur
   * @param {Object} item - Duyuru item'ı
   * @returns {string} URL
   */
  getActionUrl(item) {
    // ActionType yoksa eski sistemi kullan (default: modal)
    if (!item.actionType) {
      return `duyurular.html?id=${item.id}`;
    }

    switch (item.actionType) {
      case 'page':
        // Direkt sayfa linki (örn: calisma-saatleri.html)
        return item.url || '#';

      case 'modal':
        // Modal açma linki (duyurular sayfasına git ve modal aç)
        return `duyurular.html?id=${item.modalId || item.id}`;

      case 'external':
        // Dış link (örn: veritabanı sitesi)
        return item.url || '#';

      default:
        // Default olarak modal aç
        return `duyurular.html?id=${item.id}`;
    }
  }

  /**
   * Boş durum
   */
  renderEmpty() {
    const wrapper = document.querySelector('.announcements-wrapper');
    if (!wrapper) return;

    const emptyMessage = Utils.getLocalizedText({
      tr: 'Şu anda duyuru bulunmuyor.',
      en: 'No announcements available at the moment.'
    });

    wrapper.innerHTML = `
      <div style="padding: 3rem; text-align: center; color: #6c757d;">
        <p>${emptyMessage}</p>
      </div>
    `;
  }

  /**
   * Pagination
   */
  setupPagination() {
    const container = document.querySelector('.announcements-pagination');
    if (!container) return;

    // Tek sayfa varsa gizle
    if (this.totalPages <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = '';

    // Önceki
    const prev = this.createBtn('‹', 'prev');
    prev.disabled = this.currentPage === 1;
    container.appendChild(prev);

    // Sayfa numaraları
    for (let i = 1; i <= this.totalPages; i++) {
      const btn = this.createBtn(i, i);
      if (i === this.currentPage) btn.classList.add('active');
      container.appendChild(btn);
    }

    // Sonraki
    const next = this.createBtn('›', 'next');
    next.disabled = this.currentPage === this.totalPages;
    container.appendChild(next);
  }

  /**
   * Buton oluştur
   */
  createBtn(text, value) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    btn.textContent = text;
    btn.dataset.page = value;
    
    if (value === 'prev' || value === 'next') {
      btn.classList.add(`pagination-${value}`);
    }
    
    btn.addEventListener('click', () => this.handleClick(value));
    return btn;
  }

  /**
   * Tıklama
   */
  handleClick(value) {
    let newPage = this.currentPage;
    
    if (value === 'prev') {
      newPage = Math.max(1, this.currentPage - 1);
    } else if (value === 'next') {
      newPage = Math.min(this.totalPages, this.currentPage + 1);
    } else {
      newPage = parseInt(value);
    }
    
    if (newPage !== this.currentPage) {
      this.goToPage(newPage);
    }
  }

  /**
   * Sayfaya git
   */
  goToPage(page) {
    // Mevcut gizle
    document.querySelector(`.announcements-list[data-page="${this.currentPage}"]`)
      ?.classList.remove('active');
    
    // Yeni göster
    document.querySelector(`.announcements-list[data-page="${page}"]`)
      ?.classList.add('active');
    
    this.currentPage = page;
    this.updatePagination();
  }

  /**
   * Pagination güncelle
   */
  updatePagination() {
    document.querySelectorAll('.pagination-btn').forEach(btn => {
      const page = btn.dataset.page;
      
      if (page == this.currentPage) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
      
      if (page === 'prev') {
        btn.disabled = this.currentPage === 1;
      } else if (page === 'next') {
        btn.disabled = this.currentPage === this.totalPages;
      }
    });
  }

  /**
   * Ay kısaltması (OCA, ŞUB vb) - Çoklu dil desteği
   */
  getMonthShort(date) {
    const currentLang = LanguageManager.getCurrentLanguage();

    const months = {
      tr: ['OCA', 'ŞUB', 'MAR', 'NİS', 'MAY', 'HAZ', 'TEM', 'AĞU', 'EYL', 'EKİ', 'KAS', 'ARA'],
      en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    };

    return months[currentLang][date.getMonth()] || months.tr[date.getMonth()];
  }

  /**
   * HTML escape
   */
  escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Yenile
   */
  refresh(newData) {
    this.data = newData;
    this.currentPage = 1;
    this.init(newData);
  }

  /**
   * Temizle
   */
  destroy() {
    document.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
  }
}

export default AnnouncementsComponent;