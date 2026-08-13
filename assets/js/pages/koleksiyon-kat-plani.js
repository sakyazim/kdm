/**
 * Koleksiyon & Kat Planı Sayfası
 * İnteraktif kat planı yönetimi
 */

import Utils from '../core/utils.js';

class FloorPlanManager {
  constructor() {
    this.data = null;
    this.currentFloorId = null;
    this.elements = {
      floorNavList: document.getElementById('floorNavList'),
      floorContentHeader: document.getElementById('floorContentHeader'),
      floorSections: document.getElementById('floorSections')
    };

    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.renderFloorNavigation();
      // İlk katı otomatik olarak göster
      if (this.data.floors && this.data.floors.length > 0) {
        this.showFloor(this.data.floors[0].id);
      }
    } catch (error) {
      console.error('Kat planı yüklenirken hata:', error);
      this.showError();
    }
  }

  async loadData() {
    try {
      const response = await fetch('data/pages/koleksiyon-kat-plani.json');
      if (!response.ok) {
        throw new Error('Veri yüklenemedi');
      }
      this.data = await response.json();
    } catch (error) {
      console.error('JSON yükleme hatası:', error);
      throw error;
    }
  }

  renderFloorNavigation() {
    if (!this.elements.floorNavList || !this.data.floors) return;

    this.elements.floorNavList.innerHTML = this.data.floors.map(floor => {
      const floorName = Utils.getLocalizedText(floor.name);
      return `
        <button
          class="floor-nav-item"
          data-floor-id="${floor.id}"
          aria-label="${floor.number}. Kat - ${floorName}"
        >
          <div class="floor-number-badge">${floor.number}</div>
          <div class="floor-nav-item-text">
            <span class="floor-nav-item-name">${floorName}</span>
            <span class="floor-nav-item-count">${floor.sections.length} bölüm</span>
          </div>
        </button>
      `;
    }).join('');

    // Event listeners ekle
    this.attachNavigationListeners();
  }

  attachNavigationListeners() {
    const navItems = this.elements.floorNavList.querySelectorAll('.floor-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const floorId = e.currentTarget.getAttribute('data-floor-id');
        this.showFloor(floorId);
      });
    });
  }

  showFloor(floorId) {
    const floor = this.data.floors.find(f => f.id === floorId);
    if (!floor) return;

    this.currentFloorId = floorId;
    this.updateActiveNavigation(floorId);
    this.renderFloorHeader(floor);
    this.renderFloorSections(floor);

    // Accessibility: Focus yönetimi
    this.elements.floorContentHeader.focus();
  }

  updateActiveNavigation(floorId) {
    const navItems = this.elements.floorNavList.querySelectorAll('.floor-nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-floor-id') === floorId) {
        item.classList.add('active');
        item.setAttribute('aria-current', 'page');
      } else {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
      }
    });
  }

  renderFloorHeader(floor) {
    if (!this.elements.floorContentHeader) return;

    const floorName = Utils.getLocalizedText(floor.name);
    const floorDescription = Utils.getLocalizedText(floor.description);

    this.elements.floorContentHeader.innerHTML = `
      <div class="floor-header-content">
        <div class="floor-header-top">
          <div class="floor-number-large">${floor.number}</div>
          <h2 class="floor-title">${floorName}</h2>
        </div>
        <p class="floor-description">${floorDescription}</p>
      </div>
    `;
  }

  renderFloorSections(floor) {
    if (!this.elements.floorSections) return;

    this.elements.floorSections.innerHTML = floor.sections.map(section => {
      const sectionTitle = Utils.getLocalizedText(section.title);
      const sectionDescription = Utils.getLocalizedText(section.description);

      return `
        <div class="section-card" tabindex="0" role="article">
          <div class="section-icon">
            <i class="${section.icon}"></i>
          </div>
          <h3 class="section-title">${sectionTitle}</h3>
          <p class="section-description">${sectionDescription}</p>
          ${this.renderSectionDetails(section.details)}
        </div>
      `;
    }).join('');
  }

  renderSectionDetails(details) {
    if (!details || details.length === 0) return '';

    return `
      <div class="section-details">
        <ul>
          ${details.map(detail => {
            const detailText = Utils.getLocalizedText(detail);
            return `<li>${detailText}</li>`;
          }).join('')}
        </ul>
      </div>
    `;
  }

  showError() {
    if (this.elements.floorSections) {
      this.elements.floorSections.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>Hata:</strong> Kat planı verileri yüklenemedi. Lütfen daha sonra tekrar deneyin.
        </div>
      `;
    }
  }
}

// Export class
export default FloorPlanManager;

// Sayfa yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
  new FloorPlanManager();
});
