/**
 * Veritabanları Sayfası JavaScript
 * Arama, filtreleme, görünüm değiştirme ve modal yönetimi
 * Global Search Filter Component kullanıyor
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class VeritabanlariPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.databases = [];
    this.filteredDatabases = [];
    // Default görünüm her zaman liste
    this.currentView = 'list';
    this.currentCategory = 'all';
    this.searchTerm = '';
    this.sortOrder = 'default'; // default, a-z, z-a
    this.currentAccessType = 'all'; // all, remote, campus
    this.translations = null; // Çoklu dil metinler

    // Component managers
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();

    this.init();
  }

  async init() {
    Utils.log('VeritabanlariPage initializing...');

    // Skeleton loading göster
    this.showSkeletonLoading();

    // Sayfa verilerini yükle
    await this.loadPageData();

    // Veritabanlarını yükle
    await this.loadDatabases();

    // Hero section'ı render et (HeroManager ile)
    await this.setupHeroSection();

    // Search Filter Section'ı render et (JSON'dan)
    this.renderContent();

    // Search Filter Manager REMOVED - sticky functionality replaced by back-to-filters button

    // Kategori sayılarını güncelle
    this.updateCategoryCounts();

    // Event listener'ları kur
    this.setupEventListeners();

    // Floating "Back to Filters" butonu ekle
    this.setupBackToFiltersButton();

    // Görünümü ayarla
    this.setInitialView();

    // Skeleton'ı gizle ve veritabanlarını render et
    this.hideSkeletonLoading();
    this.renderDatabases();

    // Help section'ı render et
    await this.setupHelpSection();

    Utils.log('VeritabanlariPage initialized');
  }

  /**
   * Hero section'ı render et
   */
  async setupHeroSection() {
    if (!this.pageData.hero) {
      console.warn('Hero data not found');
      return;
    }

    await this.heroManager.init(this.pageData.hero);
  }

  /**
   * Content section'ı render et (Search Filter)
   */
  renderContent() {
    const container = document.querySelector('.content-wrapper');
    if (!container) {
      console.error('Content wrapper not found');
      return;
    }

    if (!this.pageData.content || this.pageData.content.length === 0) {
      console.error('Content data not found');
      return;
    }

    // Container'ı temizle (duplicate render önleme)
    container.innerHTML = '';

    // Search filter section'ı render et
    this.pageData.content.forEach(section => {
      if (section.components) {
        section.components.forEach(component => {
          const componentHTML = ComponentRenderer.render(component);
          container.innerHTML += componentHTML;
        });
      }
    });

    Utils.log('Content rendered with search-filter component');
  }

  showSkeletonLoading() {
    const cardView = document.getElementById('card-view');
    const listView = document.getElementById('list-view');

    const skeletonCard = `
      <div class="database-card skeleton-card">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-logo"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-button"></div>
      </div>
    `;

    if (cardView) {
      cardView.innerHTML = skeletonCard.repeat(6);
    }
    if (listView) {
      listView.innerHTML = skeletonCard.repeat(6);
    }
  }

  hideSkeletonLoading() {
    // Skeleton'lar renderDatabases() ile değiştirilecek
  }

  async loadPageData() {
    try {
      const response = await fetch('data/pages/veritabanlari.json');
      if (response.ok) {
        this.pageData = await response.json();
        this.translations = Utils.localizeObject(this.pageData.translations || {});
        Utils.log('Veritabanları page data loaded');
      }
    } catch (error) {
      console.error('Error loading page data:', error);
    }
  }

  /**
   * Help section'ı render et
   */
  async setupHelpSection() {
    if (!this.pageData || !this.pageData.helpSection) {
      console.warn('Help section data not found');
      return;
    }

    await this.helpSectionManager.init(this.pageData.helpSection);
  }

  setInitialView() {
    // Her zaman liste görünümünü aktif yap
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const listBtn = document.querySelector('.view-toggle-btn[data-view="list"]');
    if (listBtn) listBtn.classList.add('active');

    const cardView = document.getElementById('card-view');
    const listView = document.getElementById('list-view');

    if (cardView) cardView.classList.add('d-none');
    if (listView) listView.classList.remove('d-none');
  }

  async loadDatabases() {
    try {
      const response = await fetch('data/pages/databases.json');
      if (response.ok) {
        const data = await response.json();
        this.databases = data.databases || [];
        this.filteredDatabases = [...this.databases];
        this.updateResultsCount();
        // Sayfa yüklendiğinde kategori sayılarını güncelle
        this.updateCategoryCounts();
        console.log('Databases loaded:', this.databases.length);
      }
    } catch (error) {
      console.error('Error loading databases:', error);
      this.databases = [];
      this.filteredDatabases = [];
    }
  }

  setupEventListeners() {
    // Mobile filters button (opens modal)
    const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
    if (mobileFiltersBtn) {
      mobileFiltersBtn.addEventListener('click', () => {
        this.openFilterModal();
      });
    }

    // Search functionality with debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        this.searchTerm = e.target.value.toLowerCase();

        // Show/hide clear button
        this.updateClearButton();

        debounceTimer = setTimeout(() => {
          this.filterDatabases();
        }, 300);
      });
    }

    // Clear search button
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.searchTerm = '';
          this.filterDatabases();
          this.updateClearButton();
          searchInput.focus();
        }
      });
    }

    // Sort button
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => {
        this.cycleSortOrder();
      });
    }

    // View toggle buttons
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Category filter buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        this.filterByCategory(category);
      });
    });

    // Modal events
    document.addEventListener('click', (e) => {
      // Info button
      if (e.target.closest('.info-btn')) {
        const card = e.target.closest('.database-card, .database-list-item');
        if (card) {
          const dbId = card.dataset.dbId;
          this.showDatabaseModal(dbId);
        }
      }
    });

    // Responsive view handling
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768 && this.currentView === 'card') {
        this.switchView('list');
      }
    });
  }

  updateClearButton() {
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
      if (this.searchTerm) {
        clearBtn.style.display = 'flex';
      } else {
        clearBtn.style.display = 'none';
      }
    }
  }

  cycleSortOrder() {
    const orders = ['default', 'a-z', 'z-a'];
    const currentIndex = orders.indexOf(this.sortOrder);
    this.sortOrder = orders[(currentIndex + 1) % orders.length];

    const sortBtn = document.getElementById('sort-btn');
    const sortText = sortBtn?.querySelector('.sort-text');
    const sortIcon = sortBtn?.querySelector('i');

    if (sortText && sortIcon) {
      switch(this.sortOrder) {
        case 'a-z':
          sortText.textContent = 'A-Z';
          sortIcon.className = 'bi bi-sort-alpha-down';
          break;
        case 'z-a':
          sortText.textContent = 'Z-A';
          sortIcon.className = 'bi bi-sort-alpha-up';
          break;
        default:
          sortText.textContent = this.translations?.sort || 'Sırala';
          sortIcon.className = 'bi bi-sort-down';
      }
    }

    this.filterDatabases();
  }

  filterDatabases() {
    this.filteredDatabases = this.databases.filter(db => {
      // Localize fields before filtering
      const description = Utils.getLocalizedText(db.description);
      const localizedCategories = db.categories.map(cat => Utils.getLocalizedText(cat));

      const matchesSearch = this.searchTerm === '' ||
                           db.title.toLowerCase().includes(this.searchTerm) ||
                           (description && description.toLowerCase().includes(this.searchTerm)) ||
                           localizedCategories.some(cat => cat && cat.toLowerCase().includes(this.searchTerm));

      // DÜZELTME: Kategori eşleştirme için TÜRKÇE değer kullan (ID bazlı)
      // Çünkü data-category="Genel" gibi Türkçe ID'ler kullanıyoruz
      const matchesCategory = this.currentCategory === 'all' ||
                             db.categories.some(cat => {
                               const trValue = cat.tr || cat; // Çoklu dil veya string olabilir
                               return trValue === this.currentCategory;
                             });

      // Erişim tipi filtresi
      const matchesAccessType = this.currentAccessType === 'all' ||
                                db.accessType === this.currentAccessType;

      return matchesSearch && matchesCategory && matchesAccessType;
    });

    // Apply sorting
    this.applySorting();

    // Update category counts
    this.updateCategoryCounts();

    this.updateResultsCount();
    this.renderDatabases();
  }

  applySorting() {
    // Sorting uygula
    const sortFn = (a, b) => {
      switch(this.sortOrder) {
        case 'a-z':
          return a.title.localeCompare(b.title, 'tr');
        case 'z-a':
          return b.title.localeCompare(a.title, 'tr');
        default:
          return 0;
      }
    };

    this.filteredDatabases.sort(sortFn);
  }

  updateCategoryCounts() {
    const counts = {};
    counts['all'] = this.databases.length;

    // Tüm kategorileri say
    this.databases.forEach(db => {
      db.categories.forEach(cat => {
        // DÜZELTME: Türkçe değer kullan (ID bazlı)
        const trValue = cat.tr || cat; // Çoklu dil veya string olabilir
        counts[trValue] = (counts[trValue] || 0) + 1;
      });
    });

    // Category butonlarını güncelle (yeni class: category-btn)
    document.querySelectorAll('.category-btn').forEach(btn => {
      const category = btn.dataset.category;
      const count = counts[category] || 0;
      const countBadge = btn.querySelector('.count-badge');

      if (countBadge) {
        countBadge.textContent = count;
      } else if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'count-badge';
        badge.textContent = count;
        btn.appendChild(badge);
      }
    });
  }

  filterByCategory(category) {
    this.currentCategory = category;

    // Update active category button (yeni class: category-btn)
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.category-btn[data-category="${category}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    this.filterDatabases();
  }

  switchView(view) {
    this.currentView = view;

    // Update active view toggle button
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.view-toggle-btn[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Toggle view containers
    const cardView = document.getElementById('card-view');
    const listView = document.getElementById('list-view');

    if (view === 'card') {
      if (cardView) cardView.classList.remove('d-none');
      if (listView) listView.classList.add('d-none');
    } else {
      if (cardView) cardView.classList.add('d-none');
      if (listView) listView.classList.remove('d-none');
    }

    this.renderDatabases();
  }

  renderDatabases() {
    const cardContainer = document.getElementById('card-view');
    const listContainer = document.getElementById('list-view');
    const noResults = document.getElementById('no-results');

    if (this.filteredDatabases.length === 0) {
      if (cardContainer) cardContainer.innerHTML = '';
      if (listContainer) listContainer.innerHTML = '';
      if (noResults) noResults.classList.remove('d-none');
      return;
    }

    if (noResults) noResults.classList.add('d-none');

    if (this.currentView === 'card' && cardContainer) {
      cardContainer.innerHTML = this.filteredDatabases.map(db => this.createDatabaseCard(db)).join('');
    } else if (listContainer) {
      listContainer.innerHTML = this.filteredDatabases.map(db => this.createDatabaseListItem(db)).join('');
    }

    // Initialize Bootstrap tooltips
    this.initializeTooltips();
  }

  initializeTooltips() {
    // Dispose existing tooltips first
    const existingTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    existingTooltips.forEach(element => {
      const tooltip = bootstrap.Tooltip.getInstance(element);
      if (tooltip) {
        tooltip.dispose();
      }
    });

    // Initialize new tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  createDatabaseCard(database) {
    // Localize categories and description
    const localizedCategories = database.categories.map(cat => Utils.getLocalizedText(cat));
    const categoriesHtml = localizedCategories.map(cat =>
      `<span class="category-tag">${cat}</span>`
    ).join('');
    const description = Utils.mdToHtml(Utils.getLocalizedText(database.description));

    const t = this.translations || {};
    const apcBadge = database.apcSupport ? `<span class="apc-badge" data-bs-toggle="tooltip" data-bs-placement="top" title="${t.tooltips?.apc || 'APC'}">APC</span>` : '';

    // Access type indicator
    const accessIndicator = database.accessType === 'remote' ?
      `<span class="access-indicator remote" data-bs-toggle="tooltip" data-bs-placement="top" title="${t.tooltips?.remoteAccess || 'Remote Access'}"><i class="bi bi-wifi"></i></span>` :
      `<span class="access-indicator campus" data-bs-toggle="tooltip" data-bs-placement="top" title="${t.tooltips?.campusAccess || 'Campus Access'}"><i class="bi bi-building"></i></span>`;

    // Logo placeholder with first letter
    const firstLetter = database.title.charAt(0).toUpperCase();
    const logoHtml = database.logo && database.logo !== 'assets/images/default.jpg' ?
      `<img src="${database.logo}" alt="${database.title}" class="database-logo" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div class="logo-placeholder" style="display:none;">${firstLetter}</div>` :
      `<div class="logo-placeholder">${firstLetter}</div>`;

    return `
      <div class="database-card" data-db-id="${database.id}">
        ${apcBadge}
        ${accessIndicator}
        <div class="database-title-header">
          <h3 class="database-title" title="${database.title}">${database.title}</h3>
        </div>
        <div class="database-card-header">
          ${logoHtml}
          <div class="database-categories">
            ${categoriesHtml}
          </div>
        </div>
        <div class="database-content">
          <p class="database-description">${description}</p>
        </div>
        <div class="database-actions equal-buttons">
          <a href="${database.url}" target="_blank" class="access-btn">
            <i class="bi bi-box-arrow-up-right"></i>
            ${t.accessBtn || 'Access'}
          </a>
          <button class="info-btn" title="${t.tooltips?.detailedInfo || 'Info'}">
            <i class="bi bi-info-circle"></i>
            ${t.infoBtn || 'Info'}
          </button>
        </div>
      </div>
    `;
  }

  createDatabaseListItem(database) {
    // Localize description
    const description = Utils.mdToHtml(Utils.getLocalizedText(database.description));

    const t = this.translations || {};
    const apcBadge = database.apcSupport ? `<span class="apc-badge" data-bs-toggle="tooltip" data-bs-placement="top" title="${t.tooltips?.apc || 'APC'}">APC</span>` : '';

    const accessIndicator = database.accessType === 'remote' ?
      `<span class="access-indicator remote" data-bs-toggle="tooltip" data-bs-placement="top" title="${t.tooltips?.remoteAccess || 'Remote Access'}"><i class="bi bi-wifi"></i></span>` :
      `<span class="access-indicator campus" data-bs-toggle="tooltip" data-bs-placement="top" title="${t.tooltips?.campusAccess || 'Campus Access'}"><i class="bi bi-building"></i></span>`;

    const firstLetter = database.title.charAt(0).toUpperCase();
    const logoHtml = database.logo && database.logo !== 'assets/images/default.jpg' ?
      `<img src="${database.logo}" alt="${database.title}" class="list-logo" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
       <div class="logo-placeholder list-placeholder" style="display:none;">${firstLetter}</div>` :
      `<div class="logo-placeholder list-placeholder">${firstLetter}</div>`;

    return `
      <div class="database-list-item" data-db-id="${database.id}">
        ${logoHtml}
        <div class="list-content">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
            <h3 class="list-title" style="margin: 0;">${database.title}</h3>
            ${accessIndicator}
            ${apcBadge}
          </div>
          <p class="list-description">${description}</p>
        </div>
        <div class="list-actions equal-buttons">
          <a href="${database.url}" target="_blank" class="access-btn">
            <i class="bi bi-box-arrow-up-right"></i>
            ${t.accessBtn || 'Access'}
          </a>
          <button class="info-btn" title="${t.tooltips?.detailedInfo || 'Info'}">
            <i class="bi bi-info-circle"></i>
            ${t.infoBtn || 'Info'}
          </button>
        </div>
      </div>
    `;
  }

  showDatabaseModal(dbId) {
    const database = this.databases.find(db => db.id === dbId);
    if (!database) return;

    const modal = document.getElementById('database-modal');
    const modalTitle = document.getElementById('database-modal-label');
    const modalLogo = document.getElementById('modal-logo');
    const modalCategories = document.getElementById('modal-categories');
    const modalDbTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalUrl = document.getElementById('modal-url');
    const modalUrlLabel = document.getElementById('modal-url-label');
    const modalAccessBtn = document.getElementById('modal-access-btn');
    const modalAdditionalInfo = document.getElementById('modal-additional-info');
    const modalCloseBtn = modal?.querySelector('.btn-secondary[data-bs-dismiss="modal"]');

    if (!modal) return;

    const t = this.translations || {};

    // Localize description and categories
    const description = Utils.mdToHtml(Utils.getLocalizedText(database.description));
    const localizedCategories = database.categories.map(cat => Utils.getLocalizedText(cat));

    if (modalTitle) modalTitle.textContent = database.title;
    if (modalLogo) {
      modalLogo.src = database.logo;
      modalLogo.alt = database.title;
    }
    if (modalDbTitle) modalDbTitle.textContent = database.title;
    if (modalDescription) modalDescription.innerHTML = description;
    if (modalUrl) {
      modalUrl.href = database.url;
      modalUrl.textContent = database.title;
    }
    if (modalUrlLabel) {
      // Erişim Adresi başlığını JSON'dan al
      modalUrlLabel.textContent = t.modal?.accessAddress || 'Erişim Adresi:';
    }
    if (modalAccessBtn) {
      modalAccessBtn.href = database.url;
      // JSON'dan buton metnini al
      modalAccessBtn.innerHTML = `<i class="bi bi-box-arrow-up-right me-2"></i>${t.modal?.accessBtn || 'Veritabanına Eriş'}`;
    }
    if (modalCloseBtn) {
      // JSON'dan kapat buton metnini al
      modalCloseBtn.textContent = t.modal?.closeBtn || 'Kapat';
    }

    // Categories
    if (modalCategories) {
      modalCategories.innerHTML = localizedCategories.map(cat =>
        `<span class="category-tag">${cat}</span>`
      ).join('');
    }

    // Additional info with icons
    let additionalInfo = '';
    if (database.contentList) {
      additionalInfo += `
        <div class="resource-item">
          <i class="bi bi-file-earmark-spreadsheet text-success"></i>
          <a href="${database.contentList}" target="_blank">${t.modal?.contentList || 'Content List'}</a>
        </div>`;
    }
    if (database.userGuide) {
      additionalInfo += `
        <div class="resource-item">
          <i class="bi bi-file-earmark-text text-primary"></i>
          <a href="${database.userGuide}" target="_blank">${t.modal?.userGuide || 'User Guide'}</a>
        </div>`;
    }
    if (database.mobileGuide) {
      additionalInfo += `
        <div class="resource-item">
          <i class="bi bi-phone text-info"></i>
          <a href="${database.mobileGuide}" target="_blank">${t.modal?.mobileGuide || 'Mobile Guide'}</a>
        </div>`;
    }
    if (database.videoTutorials) {
      additionalInfo += `
        <div class="resource-item">
          <i class="bi bi-play-circle text-danger"></i>
          <a href="${database.videoTutorials}" target="_blank">${t.modal?.videoTutorials || 'Video Tutorials'}</a>
        </div>`;
    }
    if (database.journalList) {
      additionalInfo += `
        <div class="resource-item">
          <i class="bi bi-journal-text text-primary"></i>
          <a href="${database.journalList}" target="_blank">${t.modal?.journalList || 'Journal List'}</a>
        </div>`;
    }
    if (database.bookList) {
      additionalInfo += `
        <div class="resource-item">
          <i class="bi bi-book text-warning"></i>
          <a href="${database.bookList}" target="_blank">${t.modal?.bookList || 'Book List'}</a>
        </div>`;
    }
    if (database.apcSupport) {
      additionalInfo += `
        <div class="alert alert-success mt-3">
          <i class="bi bi-check-circle-fill"></i>
          <strong>${t.modal?.apcSupport || 'APC Support:'}</strong> ${t.modal?.apcDescription || 'APC supported'}
        </div>`;
    }
    if (database.note) {
      const note = Utils.getLocalizedText(database.note);
      additionalInfo += `
        <div class="alert alert-warning mt-3">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <strong>${t.modal?.note || 'Note:'}</strong> ${note}
        </div>`;
    }

    if (modalAdditionalInfo) {
      modalAdditionalInfo.innerHTML = additionalInfo;
    }

    const bootstrapModal = new bootstrap.Modal(modal, {
      backdrop: 'static',
      keyboard: false
    });

    bootstrapModal.show();

    // Modal dışına tıklandığında uyarı göster ve glow efekti
    modal.addEventListener('shown.bs.modal', () => {
      const backdrop = document.querySelector('.modal-backdrop');
      const modalContent = modal.querySelector('.modal-content');
      
      if (backdrop) {
        backdrop.addEventListener('click', () => {
          // Glow effect on modal (no reflow)
          if (modalContent && !modalContent.classList.contains('pulse')) {
            modalContent.classList.add('pulse');
            modalContent.addEventListener('animationend', function handler() {
              modalContent.classList.remove('pulse');
              modalContent.removeEventListener('animationend', handler);
            });
          }
          
          this.showModalWarningToast();
        });
      }
    });

    // Modal kapandığında backdrop'ları temizle
    modal.addEventListener('hidden.bs.modal', () => {
      // Tüm backdrop'ları temizle
      document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.remove();
      });
      // Body'den modal class'larını temizle
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    });
  }

  updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
      const t = this.translations || {};
      const text = t.resultsCount || 'Total **{count}** databases found';
      resultsCount.innerHTML = Utils.mdToHtml(text.replace('{count}', this.filteredDatabases.length));
    }
  }

  /**
   * Floating "Back to Filters" butonu ekle ve yönet
   * Mobilde: Her zaman görünür, sabit bottom bar üstünde
   * Desktop: Scroll'da görünür, filtrelere scroll yapar
   */
  setupBackToFiltersButton() {
    const t = this.translations || {};
    const tooltipText = t.backToFilters || 'Filtrelere Dön';
    const mobileText = t.mobileFiltersBtn || 'Filtreler ve Arama';

    // Butonu HTML'e ekle
    const button = document.createElement('button');
    button.className = 'back-to-filters-btn';
    button.setAttribute('data-tooltip', tooltipText);
    button.setAttribute('data-mobile-text', mobileText);
    button.setAttribute('aria-label', tooltipText);
    button.innerHTML = '<i class="bi bi-funnel"></i>';
    document.body.appendChild(button);

    // Mobilde otomatik göster
    if (window.innerWidth <= 768) {
      button.classList.add('show');
    }

    // Desktop davranışı
    const searchFilterSection = document.querySelector('.search-filter-section');

    if (searchFilterSection) {
      // Scroll event listener (sadece desktop)
      let scrollTimeout;
      const handleScroll = () => {
        // Mobilde scroll kontrolü yapma
        if (window.innerWidth <= 768) return;

        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const sectionRect = searchFilterSection.getBoundingClientRect();
          const isSectionAboveViewport = sectionRect.bottom < 0;

          if (isSectionAboveViewport && window.scrollY > 300) {
            button.classList.add('show');
          } else {
            button.classList.remove('show');
          }
        }, 100);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Resize event - mobilde her zaman göster
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        button.classList.add('show');
      }
    });

    // Tıklama event listener
    button.addEventListener('click', () => {
      // Mobilde modal aç, desktop'ta scroll yap
      if (window.innerWidth <= 768) {
        this.openFilterModal();
      } else if (searchFilterSection) {
        // Desktop: scroll to filters
        const yOffset = -20;
        const y = searchFilterSection.getBoundingClientRect().top + window.pageYOffset + yOffset;

        window.scrollTo({
          top: y,
          behavior: 'smooth'
        });

        setTimeout(() => {
          const searchInput = document.getElementById('search-input');
          if (searchInput) {
            searchInput.focus();
          }
        }, 500);
      }

      // Tıklama animasyonu
      button.style.transform = 'scale(0.9)';
      setTimeout(() => {
        button.style.transform = '';
      }, 200);
    });
  }

  /**
   * Filter Modal'ı aç (mobil için)
   */
  openFilterModal() {
    const t = this.translations?.filterModal || {};
    const searchPlaceholder = this.pageData.content[0].components[0].data.search.placeholder;

    // Modal zaten varsa kaldır
    const existingModal = document.querySelector('.filter-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Kategori sayılarını al
    const categoryCounts = this.getCategoryCounts();

    const modal = document.createElement('div');
    modal.className = 'filter-modal';
    modal.innerHTML = `
      <div class="filter-modal-content">
        <div class="filter-modal-header">
          <h3><i class="bi bi-funnel"></i> ${t.title || 'Filtreler ve Arama'}</h3>
          <button class="close-btn">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="filter-modal-body">
          <!-- Arama -->
          <div class="filter-search-section">
            <div class="filter-search-input-group">
              <i class="bi bi-search search-icon"></i>
              <input
                type="text"
                id="modal-search-input"
                placeholder="${Utils.getLocalizedText(searchPlaceholder)}"
                value="${this.searchTerm}"
              >
              <button class="search-submit-btn" id="modal-search-submit">
                <i class="bi bi-search"></i>
              </button>
            </div>
          </div>

          <!-- Kategoriler (Collapsible) -->
          <div class="filter-section collapsible">
            <button class="filter-section-toggle" data-target="categories-section">
              <div class="toggle-header">
                <i class="bi bi-grid"></i>
                <span>${t.categories || 'Kategoriler'}</span>
              </div>
              <i class="bi bi-chevron-down toggle-icon"></i>
            </button>
            <div class="filter-section-content" id="categories-section">
              <div class="filter-chips">
                ${this.renderCategoryChips(categoryCounts)}
              </div>
            </div>
          </div>

          <!-- Sıralama ve Erişim Tipi (Yan Yana) -->
          <div class="filter-row">
            <div class="filter-section half">
              <label class="filter-label">
                <i class="bi bi-sort-down"></i>
                ${t.sortTitle || 'Sıralama'}
              </label>
              <select class="filter-select" id="modal-sort-select">
                <option value="default" ${this.sortOrder === 'default' ? 'selected' : ''}>${t.sortDefault || 'Varsayılan'}</option>
                <option value="a-z" ${this.sortOrder === 'a-z' ? 'selected' : ''}>${t.sortAZ || 'A-Z'}</option>
                <option value="z-a" ${this.sortOrder === 'z-a' ? 'selected' : ''}>${t.sortZA || 'Z-A'}</option>
              </select>
            </div>

            <div class="filter-section half">
              <label class="filter-label">
                <i class="bi bi-wifi"></i>
                ${t.accessType || 'Erişim Tipi'}
              </label>
              <select class="filter-select" id="modal-access-select">
                <option value="all">${t.allAccess || 'Tümü'}</option>
                <option value="remote">${t.remoteAccess || 'Uzaktan Erişim'}</option>
                <option value="campus">${t.campusOnly || 'Kampüs İçi'}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="filter-modal-footer">
          <button class="btn-clear">
            <i class="bi bi-x-circle"></i>
            ${t.clear || 'Temizle'}
          </button>
          <button class="btn-apply">
            <i class="bi bi-check-circle"></i>
            ${t.apply || 'Uygula'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    // Animasyon için kısa gecikme
    setTimeout(() => modal.classList.add('show'), 10);

    // Event listeners
    this.setupModalEventListeners(modal);
  }

  /**
   * Kategori chip'lerini render et
   */
  renderCategoryChips(counts) {
    if (!this.pageData.content || !this.pageData.content[0]) return '';

    const categories = this.pageData.content[0].components[0].data.categories || [];

    return categories.map(category => {
      const label = Utils.getLocalizedText(category.label);
      const count = counts[category.id] || 0;
      const isActive = this.currentCategory === category.id;

      return `
        <div class="filter-chip ${isActive ? 'active' : ''}" data-category="${category.id}">
          <i class="${category.icon}"></i>
          ${label}
          <span class="count-badge">${count}</span>
        </div>
      `;
    }).join('');
  }

  /**
   * Kategori sayılarını al
   */
  getCategoryCounts() {
    const counts = {};
    counts['all'] = this.databases.length;

    this.databases.forEach(db => {
      db.categories.forEach(cat => {
        const trValue = cat.tr || cat;
        counts[trValue] = (counts[trValue] || 0) + 1;
      });
    });

    return counts;
  }

  /**
   * Modal event listener'larını kur
   */
  setupModalEventListeners(modal) {
    // Close button
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => this.closeFilterModal(modal));

    // Backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeFilterModal(modal);
      }
    });

    // Search input
    const searchInput = modal.querySelector('#modal-search-input');
    const searchSubmitBtn = modal.querySelector('#modal-search-submit');

    if (searchInput) {
      // Enter tuşu ile arama
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          searchSubmitBtn.click();
        }
      });

      searchInput.focus();
    }

    // Search submit button - Hemen ara ve modal'ı kapat
    if (searchSubmitBtn) {
      searchSubmitBtn.addEventListener('click', () => {
        const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
        this.searchTerm = searchValue;

        // Update desktop search input
        const desktopSearchInput = document.getElementById('search-input');
        if (desktopSearchInput) {
          desktopSearchInput.value = searchValue;
        }

        // Re-filter and render
        this.filterDatabases();

        // Close modal
        this.closeFilterModal(modal);

        // Scroll to results
        setTimeout(() => {
          const resultsSection = document.querySelector('.databases-container-wrapper');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      });
    }

    // Collapsible sections toggle
    modal.querySelectorAll('.filter-section-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const targetId = toggle.dataset.target;
        const content = document.getElementById(targetId);
        const icon = toggle.querySelector('.toggle-icon');

        if (content) {
          content.classList.toggle('show');
          icon.classList.toggle('rotate');
        }
      });
    });

    // Category chips
    modal.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        // Remove active from all
        modal.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        // Add active to clicked
        chip.classList.add('active');
      });
    });

    // Clear button
    const clearBtn = modal.querySelector('.btn-clear');
    clearBtn.addEventListener('click', () => {
      // Reset search
      if (searchInput) {
        searchInput.value = '';
        this.searchTerm = '';
      }

      // Reset to all categories
      modal.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      modal.querySelector('.filter-chip[data-category="all"]')?.classList.add('active');

      // Reset sort
      const sortSelect = modal.querySelector('#modal-sort-select');
      if (sortSelect) sortSelect.value = 'default';

      // Reset access type
      const accessSelect = modal.querySelector('#modal-access-select');
      if (accessSelect) accessSelect.value = 'all';

      // Apply reset
      this.currentCategory = 'all';
      this.sortOrder = 'default';
      this.currentAccessType = 'all';
      this.filterDatabases();
    });

    // Apply button
    const applyBtn = modal.querySelector('.btn-apply');
    applyBtn.addEventListener('click', () => {
      // Get search term
      const searchValue = searchInput ? searchInput.value.toLowerCase() : '';
      this.searchTerm = searchValue;

      // Get selected category
      const activeChip = modal.querySelector('.filter-chip.active');
      const selectedCategory = activeChip ? activeChip.dataset.category : 'all';

      // Get sort order
      const sortSelect = modal.querySelector('#modal-sort-select');
      const selectedSort = sortSelect ? sortSelect.value : 'default';

      // Get access type
      const accessSelect = modal.querySelector('#modal-access-select');
      const selectedAccess = accessSelect ? accessSelect.value : 'all';

      // Apply filters
      this.currentCategory = selectedCategory;
      this.sortOrder = selectedSort;
      this.currentAccessType = selectedAccess;

      // Update page category buttons (eğer desktop'ta görünürse)
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      const categoryBtn = document.querySelector(`.category-btn[data-category="${selectedCategory}"]`);
      if (categoryBtn) categoryBtn.classList.add('active');

      // Update sort button (eğer desktop'ta görünürse)
      const sortBtn = document.getElementById('sort-btn');
      if (sortBtn) {
        const sortText = sortBtn.querySelector('.sort-text');
        const sortIcon = sortBtn.querySelector('i');

        if (sortText && sortIcon) {
          switch(selectedSort) {
            case 'a-z':
              sortText.textContent = 'A-Z';
              sortIcon.className = 'bi bi-sort-alpha-down';
              break;
            case 'z-a':
              sortText.textContent = 'Z-A';
              sortIcon.className = 'bi bi-sort-alpha-up';
              break;
            default:
              sortText.textContent = this.translations?.sort || 'Sırala';
              sortIcon.className = 'bi bi-sort-down';
          }
        }
      }

      // Update desktop search input (eğer varsa)
      const desktopSearchInput = document.getElementById('search-input');
      if (desktopSearchInput) {
        desktopSearchInput.value = searchValue;
      }

      // Re-filter and render
      this.filterDatabases();

      // Close modal
      this.closeFilterModal(modal);

      // Scroll to top of results
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    });
  }

  /**
   * Modal'ı kapat
   */
  closeFilterModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';

    setTimeout(() => {
      modal.remove();
    }, 300);
  }

  /**
   * Show warning toast for database modal
   */
  showModalWarningToast() {
    // Remove existing toast if any
    const existingToast = document.querySelector('.modal-warning-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const t = this.translations || {};
    const message = t.modal?.warningMessage || 'Lütfen modal penceresindeki butonları kullanarak işlem yapınız';

    // Create toast element with progress bar
    const toast = document.createElement('div');
    toast.className = 'modal-warning-toast';
    toast.innerHTML = `
      <i class="bi bi-info-circle-fill"></i>
      <span>${message}</span>
      <div class="toast-progress"></div>
    `;

    document.body.appendChild(toast);

    // Force reflow and show toast
    toast.offsetHeight;
    toast.classList.add('show');

    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3000);
  }
}

// Export edildi - app.js tarafından yönetiliyor
