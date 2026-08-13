/**
 * Anadolu Üniversitesi Kütüphane - Home Page
 * Ana sayfa özel mantık ve bileşenler
 */

import AppConfig from '../core/config.js';
import Utils from '../core/utils.js';
import { AnnouncementsComponent } from '../components/announcements.js';

export class HomePage {
  constructor(app) {
    this.app = app;
    this.data = app.data;
    this.config = app.config;

    // Slider state
    this.currentSlide = 0;
    this.slideInterval = null;
    this.progressInterval = null;

    // Bileşenler
    this.announcementsComponent = new AnnouncementsComponent(app);

    // Collections state
    this._activeFormSet = false;

    // Translations
    this.translations = null;
  }
  /**
   * Ana sayfayı başlat
   */
  async init() {
    Utils.log('HomePage initializing...');

    // Translations'ı yükle
    this.loadTranslations();

    // Section başlıklarını güncelle
    this.updateSectionTitles();

    // Koleksiyonlar verisi yoksa varsayılan verileri yükle
    if (!this.data.collections) {
      this.loadFallbackCollections();
    }

    this.loadCollections();
    this.loadServices();
    this.loadNews();

    // Duyurular bileşenini başlat (duyurular.json'dan featured olanları)
    await this.loadAnnouncements();

    this.loadArrivals();

    this.setupCollectionCards();
    this.initializeSliders();
    this.setupArrivalsInteraction();
    this.setupAutoModal();
    this.setupCopyCallNumber();
    this.updateViewAllLinks();

    Utils.log('HomePage initialized');
  }

  /**
   * "Tümünü Gör" linklerini güncelle
   */
  updateViewAllLinks() {
    const viewAllText = this.translations?.viewAll || 'View All';
    const viewAllTextElements = document.querySelectorAll('.view-all-text');

    viewAllTextElements.forEach(element => {
      element.textContent = viewAllText;
    });
  }

  /**
   * Translations'ı yükle
   */
  loadTranslations() {
    const homeSettings = this.data.homeSettings;
    if (homeSettings && homeSettings.translations) {
      this.translations = Utils.localizeObject(homeSettings.translations);
    } else {
      // Fallback translations
      this.translations = {
        searchButton: 'Search',
        detailsButton: 'View Details',
        viewAll: 'View All',
        copyNotification: 'Copied!',
        arrivals: {
          location: 'Location:',
          callNumber: 'Call Number:',
          copy: 'Copy'
        }
      };
    }
  }

  /**
   * Section başlıklarını home.json'dan çoklu dil ile güncelle
   */
  updateSectionTitles() {
    const homeSettings = this.data.homeSettings;
    if (!homeSettings || !homeSettings.sections) return;

    const sections = homeSettings.sections;

    // Kütüphane Hizmetleri başlığını güncelle
    if (sections.services && sections.services.title) {
      const servicesTitle = document.querySelector('#services-title');
      if (servicesTitle) {
        servicesTitle.textContent = Utils.getLocalizedText(sections.services.title);
      }
    }

    // Güncel Haberler başlığını güncelle
    if (sections.news && sections.news.title) {
      const newsTitle = document.querySelector('.slider-header .section-title');
      if (newsTitle) {
        newsTitle.textContent = Utils.getLocalizedText(sections.news.title);
      }
    }

    // Duyurular başlığını güncelle
    if (sections.announcements && sections.announcements.title) {
      const announcementsTitle = document.querySelector('.announcements-header .section-title');
      if (announcementsTitle) {
        announcementsTitle.textContent = Utils.getLocalizedText(sections.announcements.title);
      }
    }

    // Yeni Gelenler başlığını güncelle
    if (sections.arrivals && sections.arrivals.title) {
      const arrivalsTitle = document.querySelector('#arrivals-title');
      if (arrivalsTitle) {
        arrivalsTitle.textContent = Utils.getLocalizedText(sections.arrivals.title);
      }
    }

    // Haberler ve Duyurular section başlığını güncelle
    const newsAnnouncementsTitle = document.querySelector('#news-announcements-title');
    if (newsAnnouncementsTitle && this.translations?.sections?.newsAndAnnouncements) {
      newsAnnouncementsTitle.textContent = Utils.getLocalizedText(this.translations.sections.newsAndAnnouncements);
    }

    // Slider kontrol button'ları
    const prevBtn = document.querySelector('.slider-controls .prev-btn');
    const nextBtn = document.querySelector('.slider-controls .next-btn');
    if (prevBtn && this.translations?.slider?.prev) {
      prevBtn.setAttribute('aria-label', Utils.getLocalizedText(this.translations.slider.prev));
    }
    if (nextBtn && this.translations?.slider?.next) {
      nextBtn.setAttribute('aria-label', Utils.getLocalizedText(this.translations.slider.next));
    }

    // Mobile collection selector
    const mobileSelect = document.querySelector('#mobile-collection-selector');
    if (mobileSelect && this.translations?.mobileCollection?.ariaLabel) {
      mobileSelect.setAttribute('aria-label', Utils.getLocalizedText(this.translations.mobileCollection.ariaLabel));
    }

    // Modal elementi
    this.updateModalTranslations();

    // Copy notification
    this.updateCopyNotificationTranslation();
  }

  /**
   * Modal çevirilerini güncelle
   */
  updateModalTranslations() {
    if (!this.translations?.modal) return;

    // Modal close button
    const modalCloseBtn = document.querySelector('#autoModal .modal-close');
    if (modalCloseBtn) {
      modalCloseBtn.setAttribute('aria-label', Utils.getLocalizedText(this.translations.modal.close));
    }

    // Modal title (varsayılan değer - her zaman güncelle)
    const modalTitle = document.querySelector('#modalTitle');
    if (modalTitle && !modalTitle.textContent.trim()) {
      modalTitle.textContent = Utils.getLocalizedText(this.translations.modal.defaultTitle);
    }

    // Modal description (varsayılan değer - her zaman güncelle)
    const modalDesc = document.querySelector('#modalDescription');
    if (modalDesc && !modalDesc.textContent.trim()) {
      modalDesc.textContent = Utils.getLocalizedText(this.translations.modal.defaultDescription);
    }

    // Modal button (varsayılan değer - her zaman güncelle)
    const modalBtn = document.querySelector('#modalButton');
    if (modalBtn && !modalBtn.textContent.trim()) {
      modalBtn.textContent = Utils.getLocalizedText(this.translations.modal.detailButton);
    }

    // Don't show again checkbox
    const dontShowLabel = document.querySelector('.modal-dont-show-text');
    if (dontShowLabel) {
      dontShowLabel.textContent = Utils.getLocalizedText(this.translations.modal.dontShowAgain);
    }
  }

  /**
   * Copy notification çevirisini güncelle
   */
  updateCopyNotificationTranslation() {
    const notification = document.querySelector('.copy-notification-text');
    if (notification && this.translations?.copyNotification) {
      notification.textContent = Utils.getLocalizedText(this.translations.copyNotification);
    }
  }

  /**
   * Yer numarası kopyalama fonksiyonunu kur
   */
  setupCopyCallNumber() {
    window.copyCallNumber = (callNumber, event) => {
      event.stopPropagation();

      const scrollY = window.scrollY;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(callNumber).then(() => {
          this.showCopyNotification();
          window.scrollTo(0, scrollY);
        }).catch(() => {
          // Fallback kopyalama
          this.fallbackCopy(callNumber);
          window.scrollTo(0, scrollY);
        });
      }
    };
  }

  /**
   * Kopyalama bildirimini göster
   */
  showCopyNotification() {
    const notification = document.getElementById('copy-notification');
    if (notification) {
      // Update notification text with translation
      const notificationText = this.translations?.copyNotification || 'Copied!';
      const textSpan = notification.querySelector('span');
      if (textSpan) {
        textSpan.textContent = notificationText;
      }

      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
      }, 2000);
    }
  }

  /**
   * Fallback kopyalama metodu
   */
  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showCopyNotification();
    } catch (err) {
      console.error('Kopyalama başarısız:', err);
    }

    document.body.removeChild(textArea);
  }

  /**
   * Varsayılan koleksiyon verilerini yükle
   */
  loadFallbackCollections() {
    this.data.collections = [
      {
        id: "eds",
        title: {
          tr: "Bütünleşik Arama",
          en: "Integrated Search"
        },
        icon: "bi-search",
        description: {
          tr: "Tüm elektronik kaynaklarda arama yapın",
          en: "Search all electronic resources"
        },
        active: true,
        formAction: "https://research.ebsco.com/c/o47xhr/search/results",
        formMethod: "GET",
        placeholder: {
          tr: "Makale, kitap, dergi ve daha fazlasını arayın",
          en: "Search for articles, books, journals and more"
        },
        ariaLabel: {
          tr: "arama kutusu",
          en: "search box"
        },
        searchParam: "q",
        hiddenFields: [
          { name: "limiters", value: "FT1:Y" },
          { name: "acr_values", value: "ip,guest" },
          { name: "autocorrect", value: "y" },
          { name: "locale", value: "tr" }
        ]
      },
      {
        id: "catalog",
        title: {
          tr: "Katalog",
          en: "Catalog"
        },
        icon: "bi-journal-bookmark",
        description: {
          tr: "Kütüphane kataloğunda arama yapın",
          en: "Search the library catalog"
        },
        active: false,
        formAction: "https://libra.anadolu.edu.tr/libra.aspx",
        formMethod: "GET",
        placeholder: {
          tr: "Kütüphane kataloğundaki basılı kaynakları ve eKitapları tarayınız",
          en: "Browse print resources and eBooks in the library catalog"
        },
        ariaLabel: {
          tr: "arama kutusu",
          en: "search box"
        },
        searchParam: "SR",
        hiddenFields: [
          { name: "IS", value: "TARA" },
          { name: "KT", value: "TP" },
          { name: "DZ", value: "12" },
          { name: "IL", value: "1" }
        ]
      },
      {
        id: "ejournals",
        title: {
          tr: "e-Dergiler",
          en: "e-Journals"
        },
        icon: "bi-journal",
        description: {
          tr: "e-Dergi koleksiyonunda arama yapın",
          en: "Search the e-journal collection"
        },
        active: false,
        formAction: "https://publications.ebsco.com/c/35vval",
        formMethod: "GET",
        placeholder: {
          tr: "eDergi Koleksiyonumuzu tarayınız",
          en: "Browse our e-journal collection"
        },
        ariaLabel: {
          tr: "arama kutusu",
          en: "search box"
        },
        searchParam: "search",
        hiddenFields: [
          { name: "highlightTag", value: "mark" },
          { name: "resourceTypeOptionSelected", value: "1" }
        ]
      },
      {
        id: "openaccess",
        title: {
          tr: "Açık Erişim",
          en: "Open Access"
        },
        icon: "bi-unlock",
        description: {
          tr: "Akademik arşivde arama yapın",
          en: "Search the academic archive"
        },
        active: false,
        formAction: "https://earsiv.anadolu.edu.tr/xmlui/discover",
        formMethod: "GET",
        placeholder: {
          tr: "Akademik arşivde arama yapın...",
          en: "Search the academic archive..."
        },
        ariaLabel: {
          tr: "arama kutusu",
          en: "search box"
        },
        searchParam: "query",
        hiddenFields: []
      },
      {
        id: "tokat",
        title: {
          tr: "TO-KAT",
          en: "TO-KAT"
        },
        icon: "bi-search",
        description: {
          tr: "Ulusal Toplu Katalog üzerinde tarama yapın",
          en: "Search the National Union Catalog"
        },
        active: false,
        formAction: "https://www.toplukatalog.gov.tr/",
        formMethod: "GET",
        placeholder: {
          tr: "Ulusal Toplu Katalog üzerinde tarama yapınız",
          en: "Search the National Union Catalog"
        },
        ariaLabel: {
          tr: "arama kutusu",
          en: "search box"
        },
        searchParam: "keyword",
        hiddenFields: [
          { name: "tokat_search_field", value: "1" }
        ]
      }
    ];
  }
  /**
   * Collection kartlarını yükle
   */
  loadCollections() {
    if (!this.data.collections) return;

    const desktopCards = document.querySelector('.collection-cards');
    if (desktopCards) {
      desktopCards.innerHTML = this.data.collections.map((collection, index) => {
        const title = Utils.getLocalizedText(collection.title);
        const description = Utils.getLocalizedText(collection.description);

        return `
        <div class="collection-card${collection.active ? ' active-blue' : ''}"
             data-collection="${collection.id}"
             data-color="blue">
          <div class="icon-circle icon-blue">
            <i class="${collection.icon}"></i>
          </div>
          <h3 class="card-title">${title}</h3>
          <p class="card-description">${description}</p>
        </div>
      `;
      }).join('');
    }

    const mobileSelect = document.getElementById('mobile-collection-selector');
    if (mobileSelect) {
      mobileSelect.innerHTML = this.data.collections.map(collection => {
        const title = Utils.getLocalizedText(collection.title);

        return `
        <option value="${collection.id}"${collection.active ? ' selected' : ''}>
          ${title}
        </option>
      `;
      }).join('');
    }

    this.buildCollectionForms();
  }

  /**
   * Collection form'larını oluştur
   */
  buildCollectionForms() {
    const formContainer = document.querySelector('.collection-form-container');
    if (!formContainer) return;

    this._activeFormSet = false;
    const formsHTML = this.data.collections.map((collection, idx) => {
      const isActive = collection.active && !this._activeFormSet;
      if (isActive) this._activeFormSet = true;

      const hiddenFields = collection.hiddenFields ?
        collection.hiddenFields.map(field =>
          `<input type="hidden" name="${field.name}" value="${field.value}">`
        ).join('') : '';

      // Localize texts
      const placeholder = Utils.getLocalizedText(collection.placeholder);
      const title = Utils.getLocalizedText(collection.title);
      const ariaLabel = Utils.getLocalizedText(collection.ariaLabel);
      const searchButtonLabel = this.translations?.searchButton || 'Search';

      // Form içeriği
      let formContent;

      // Özel kod varsa kullan
      if (collection.customCode) {
        formContent = collection.customCode;
      } else {
        // Standart form yapısı
        formContent = `
          <div class="mb-3 form-search-wrapper">
            <input type="text"
                   class="form-control form-search-input"
                   name="${collection.searchParam}"
                   placeholder="${placeholder}"
                   aria-label="${title} ${ariaLabel}">
            ${hiddenFields}
            <button type="submit" class="btn btn-primary form-search-button" aria-label="${searchButtonLabel}">
              <i class="bi bi-search"></i>
            </button>
          </div>
        `;
      }

      return `
        <div id="${collection.id}-form" class="collection-form${isActive ? ' active' : ''}">
          <form action="${collection.formAction}" method="${collection.formMethod}" target="_blank">
            ${formContent}
          </form>
        </div>
      `;
    }).join('');

    formContainer.innerHTML = formsHTML;
  }

  /**
   * Hizmetleri yükle
   */
  loadServices() {
    // Yeni format: services.json içinde { services: [...] } yapısı var
    const servicesData = this.data.services?.services || this.data.services;
    if (!servicesData || servicesData.length === 0) return;

    const activeServices = servicesData
      .filter(service => service.active !== false)
      .slice(0, this.config.maxServices);

    const servicesGrid = document.querySelector('.quick-services-grid');
    if (!servicesGrid) return;

    servicesGrid.innerHTML = activeServices.map(service => {
      // Çoklu dil desteği
      const title = Utils.getLocalizedText(service.title);
      const description = Utils.getLocalizedText(service.description);

      // URL varsa ve '#' ile başlamıyorsa tıklanabilir link yap
      if (service.url && service.url !== '#' && !service.url.startsWith('#')) {
        return `
          <a href="${service.url}" class="quick-service-item" data-tooltip="${description || title}">
            <div class="service-icon">
              <i class="${service.icon}"></i>
            </div>
            <div class="service-title">${title}</div>
          </a>
        `;
      } else {
        // URL yoksa veya '#' ise div olarak göster
        return `
          <div class="quick-service-item" data-tooltip="${description || title}">
            <div class="service-icon">
              <i class="${service.icon}"></i>
            </div>
            <div class="service-title">${title}</div>
          </div>
        `;
      }
    }).join('');

    // Tooltip'leri yeniden başlat
    this.app.tooltipManager.reinit('.quick-service-item');
  }

  /**
   * Action type'a göre URL oluştur
   * @param {Object} item - Haber/duyuru item'ı
   * @param {string} basePage - Temel sayfa (guncel-haberler.html veya duyurular.html)
   * @returns {string} URL
   */
  getActionUrl(item, basePage) {
    // ActionType yoksa eski sistemi kullan (default: modal)
    if (!item.actionType) {
      return `${basePage}?id=${item.id}`;
    }

    switch (item.actionType) {
      case 'page':
        // Direkt sayfa linki (örn: calisma-saatleri.html)
        return item.url || '#';

      case 'modal':
        // Modal açma linki (duyurular/haberler sayfasına git ve modal aç)
        return `${basePage}?id=${item.modalId || item.id}`;

      case 'external':
        // Dış link (örn: veritabanı sitesi)
        return item.url || '#';

      default:
        // Default olarak modal aç
        return `${basePage}?id=${item.id}`;
    }
  }

  /**
   * Haberleri yükle
   */
  loadNews() {
    if (!this.data.news || this.data.news.length === 0) return;

    // Sadece featured haberleri al
    const featuredNews = this.data.news.filter(news => news.featured === true);
    if (featuredNews.length === 0) return;

    const sliderContainer = document.querySelector('.slider-items-container');
    const indicatorsContainer = document.querySelector('.slider-indicators');

    if (!sliderContainer || !indicatorsContainer) return;

    // Çoklu dil desteği için button text
    const detailsButtonText = this.translations?.detailsButton || 'View Details';

    sliderContainer.innerHTML = featuredNews.map((news, index) => {
      const newsTitle = Utils.getLocalizedText(news.title);
      const newsSummary = Utils.getLocalizedText(news.summary);
      const newsCategory = Utils.getLocalizedText(news.category);

      // Action type'a göre link oluştur
      const actionUrl = this.getActionUrl(news, 'guncel-haberler.html');
      const actionTarget = news.actionType === 'external' ? '_blank' : '_self';

      return `
      <div class="news-slide${index === 0 ? ' active' : ''}">
        <div class="slide-image">
          <img src="${news.image || 'assets/images/nopic.jpeg'}" alt="${newsTitle}" loading="lazy">
          <div class="category-badge" style="background-color: ${news.categoryColor}">
            ${newsCategory}
          </div>
        </div>
        <div class="slide-content">
          <h3 class="slide-title">${newsTitle}</h3>
          <p class="slide-description">${newsSummary}</p>
          <div class="slide-footer">
            <span class="slide-date">${Utils.formatDate(news.date)}</span>
            <a href="${actionUrl}" target="${actionTarget}" class="slide-button" style="background-color: ${news.categoryColor}; color: white;">
              ${detailsButtonText}
            </a>
          </div>
        </div>
      </div>
      `;
    }).join('');

    indicatorsContainer.innerHTML = featuredNews.map((_, index) => `
      <button class="slide-indicator${index === 0 ? ' active' : ''}"
              data-slide="${index}"
              aria-label="Slide ${index + 1}"></button>
    `).join('');
  }

  /**
   * Duyuruları yükle (duyurular.json'dan featured olanları)
   */
  async loadAnnouncements() {
    try {
      const response = await fetch('data/pages/duyurular.json');
      if (!response.ok) {
        console.warn('Duyurular verisi yüklenemedi');
        return;
      }

      const data = await response.json();
      const announcementItems = data.announcementItems || [];

      // Sadece featured olanları filtrele
      const featuredAnnouncements = announcementItems.filter(item => item.featured === true);

      // Announcements component'ine gönder
      this.announcementsComponent.init(featuredAnnouncements);

      Utils.log(`${featuredAnnouncements.length} featured duyuru yüklendi`);
    } catch (error) {
      console.error('Duyurular yüklenirken hata:', error);
    }
  }

  /**
   * Yeni gelenleri yükle
   */
  loadArrivals() {
    // Yeni format: arrivals.json içinde { arrivals: [...], translations: {...} } yapısı var
    const arrivalsData = this.data.arrivals;
    if (!arrivalsData) return;

    // arrivals array'ini al (yeni format: arrivalsData.arrivals, eski format: arrivalsData)
    const arrivalsArray = arrivalsData.arrivals || arrivalsData;
    if (!arrivalsArray || arrivalsArray.length === 0) return;

    const activeArrivals = arrivalsArray
      .filter(arrival => arrival.active !== false)
      .slice(0, this.config.maxArrivals);

    const arrivalsContainer = document.querySelector('.arrival-items');
    if (!arrivalsContainer) return;

    // Translations (arrivals.json'dan gelecek)
    const arrivalsTranslations = arrivalsData.translations;
    const location = Utils.getLocalizedText(arrivalsTranslations?.location) || 'Location:';
    const callNumber = Utils.getLocalizedText(arrivalsTranslations?.callNumber) || 'Call Number:';
    const copy = Utils.getLocalizedText(arrivalsTranslations?.copy) || 'Copy';

    // "Tümünü Gör" butonu ekle (home.json'dan gelecek)
    const homeSettings = this.data.homeSettings;
    const arrivalsSection = homeSettings?.sections?.arrivals;
    const viewAllBtn = arrivalsSection?.viewAllButton;

    if (viewAllBtn && viewAllBtn.enabled) {
      const buttonText = Utils.getLocalizedText(viewAllBtn.text);
      const buttonUrl = viewAllBtn.url;
      const buttonTarget = viewAllBtn.target || '_self';
      const buttonIcon = viewAllBtn.icon || 'bi bi-arrow-right';

      const arrivalsContainerParent = arrivalsContainer.parentElement;
      let existingButton = arrivalsContainerParent.querySelector('.arrivals-view-all-btn');

      if (!existingButton) {
        const buttonHtml = `
          <div class="text-center mt-4 arrivals-view-all-wrapper">
            <a href="${buttonUrl}"
               target="${buttonTarget}"
               rel="noopener noreferrer"
               class="btn btn-primary btn-lg arrivals-view-all-btn">
              <i class="${buttonIcon}"></i>
              ${buttonText}
            </a>
          </div>
        `;
        arrivalsContainerParent.insertAdjacentHTML('beforeend', buttonHtml);
      }
    }

    arrivalsContainer.innerHTML = activeArrivals.map(book => {
      // Çoklu dil desteği
      const title = Utils.getLocalizedText(book.title);
      const author = Utils.getLocalizedText(book.author);
      const floor = Utils.getLocalizedText(book.floor);

      const imageUrl = book.image || 'assets/images/nopic.jpeg';
      const jpgFallback = imageUrl.replace('.webp', '.jpg');
      const pngFallback = imageUrl.replace('.webp', '.png');

      return `
      <div class="arrival-item">
        <a href="#" class="arrival-card" onclick="event.preventDefault();">
          <div class="arrival-cover">
            <picture>
              <source srcset="${imageUrl}" type="image/webp">
              <source srcset="${jpgFallback}" type="image/jpeg">
              <img src="${jpgFallback}"
                   alt="${title}"
                   loading="lazy"
                   onerror="this.onerror=null; this.src='${pngFallback}'; if(this.error) this.src='assets/images/nopic.jpeg';">
            </picture>
          </div>
          <div class="arrival-details">
            <h4 class="arrival-title">${title}</h4>
            <p class="arrival-author">${author}</p>
            <div class="arrival-location-info">
              <span class="arrival-floor">${location} ${floor}</span>
              <span class="arrival-call-number">${callNumber} ${book.callNumber}</span>
            </div>
          </div>
          <div class="book-tooltip">
            <div class="tooltip-title">${title}</div>
            <div class="tooltip-collection">${location} ${floor}</div>
            <div class="tooltip-callnumber">${book.callNumber}</div>
            <button class="copy-btn" onclick="window.copyCallNumber('${book.callNumber}', event)">
              <i class="bi bi-copy"></i> ${copy}
            </button>
          </div>
        </a>
      </div>
      `;
    }).join('');
  }

  /**
   * Collection kartları kurulumu
   */
  setupCollectionCards() {
    document.querySelectorAll('.collection-card').forEach(card => {
      card.addEventListener('click', () => {
        const collectionId = card.dataset.collection;
        this.switchCollection(collectionId);
      });
    });

    const mobileSelector = document.getElementById('mobile-collection-selector');
    if (mobileSelector) {
      mobileSelector.addEventListener('change', (e) => {
        this.switchCollection(e.target.value);
        this.updateMobileIcon(e.target.value);
      });
    }
  }

  /**
   * Collection değiştir
   */
  switchCollection(collectionId) {
    document.querySelectorAll('.collection-card').forEach(card => {
      card.classList.remove('active-blue');
    });
    document.querySelector(`[data-collection="${collectionId}"]`)?.classList.add('active-blue');

    document.querySelectorAll('.collection-form').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(`${collectionId}-form`)?.classList.add('active');

    this.updateMobileIcon(collectionId);
  }

  /**
   * Mobil icon güncelle
   */
  updateMobileIcon(collectionId) {
    const collections = this.data.collections || [];
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      const iconElement = document.getElementById('mobile-selected-icon');
      if (iconElement) {
        iconElement.innerHTML = `<i class="${collection.icon}"></i>`;
      }
    }
  }

  /**
   * Slider'ları başlat
   */
  initializeSliders() {
    this.setupNewsSlider();
    this.setupArrivalsCarousel();
  }

  /**
   * Haber slider'ı
   */
  setupNewsSlider() {
    if (!this.data.news || this.data.news.length <= 1) return;

    const slides = document.querySelectorAll('.news-slide');
    const indicators = document.querySelectorAll('.slide-indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const progressFill = document.querySelector('.slider-progress-fill');

    // Slider elementleri yoksa işlemi durdur
    if (!slides || slides.length === 0) {
      console.warn('News slider elements not found in DOM');
      return;
    }

    // Slider otomatik geçiş süresi
    const autoSlideInterval = this.config.sliderInterval || 5000;

    // Slider'ı başlat
    this.startSlider(slides, indicators, progressFill, autoSlideInterval);

    // Gösterge düğmelerine tıklama olayları
    if (indicators && indicators.length > 0) {
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          this.goToSlide(index, slides, indicators, progressFill);
        });
      });
    }

    // İleri-geri düğmelerine tıklama olayları
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.prevSlide(slides, indicators, progressFill);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.nextSlide(slides, indicators, progressFill);
      });
    }
  }
  
  /**
   * Slider'ı başlat
   */
  startSlider(slides, indicators, progressFill, interval) {
    // Önceki zamanlayıcıları temizle
    if (this.slideInterval) clearInterval(this.slideInterval);
    if (this.progressInterval) clearInterval(this.progressInterval);
    
    // Otomatik geçiş için zamanlayıcı
    this.slideInterval = setInterval(() => {
      this.nextSlide(slides, indicators, progressFill);
    }, interval);
    
    // İlerleme çubuğu için zamanlayıcı
    if (progressFill) {
      progressFill.style.width = '0%';
      const stepTime = 50; // 50ms'de bir güncelle
      const steps = interval / stepTime;
      let currentStep = 0;
      
      this.progressInterval = setInterval(() => {
        currentStep++;
        const progress = (currentStep / steps) * 100;
        progressFill.style.width = `${progress}%`;
        
        if (currentStep >= steps) {
          currentStep = 0;
          progressFill.style.width = '0%';
        }
      }, stepTime);
    }
  }
  
  /**
   * Belirli bir slide'a git
   */
  goToSlide(index, slides, indicators, progressFill) {
    // Elementlerin varlığını kontrol et
    if (!slides || slides.length === 0 || !slides[index]) {
      console.warn('Slides not available or invalid index:', index);
      return;
    }

    // Geçerli slide'ı güncelle
    this.currentSlide = index;

    // Tüm slide'ları gizle ve göstergeleri pasif yap
    slides.forEach(slide => slide.classList.remove('active'));
    if (indicators && indicators.length > 0) {
      indicators.forEach(indicator => indicator.classList.remove('active'));
    }

    // Seçilen slide'ı göster ve göstergeyi aktif yap
    slides[index].classList.add('active');
    if (indicators && indicators[index]) {
      indicators[index].classList.add('active');
    }

    // Zamanlayıcıyı yeniden başlat
    const interval = this.config.sliderInterval || 5000;
    this.startSlider(slides, indicators, progressFill, interval);
  }
  
  /**
   * Sonraki slide'a geç
   */
  nextSlide(slides, indicators, progressFill) {
    if (!slides || slides.length === 0) {
      console.warn('Slides not available for nextSlide');
      return;
    }
    let nextIndex = this.currentSlide + 1;
    if (nextIndex >= slides.length) nextIndex = 0;
    this.goToSlide(nextIndex, slides, indicators, progressFill);
  }

  /**
   * Önceki slide'a geç
   */
  prevSlide(slides, indicators, progressFill) {
    if (!slides || slides.length === 0) {
      console.warn('Slides not available for prevSlide');
      return;
    }
    let prevIndex = this.currentSlide - 1;
    if (prevIndex < 0) prevIndex = slides.length - 1;
    this.goToSlide(prevIndex, slides, indicators, progressFill);
  }

  /**
   * Yeni gelenler carousel'i
   */
  setupArrivalsCarousel() {
    const container = document.querySelector('.arrival-items');
    if (!container || !this.data.arrivals || this.data.arrivals.length === 0) return;

    // Mobil otomatik kaydırma
    if (window.innerWidth <= 575.98) {
      let currentIndex = 0;
      const items = container.querySelectorAll('.arrival-item');
      const totalItems = items.length;

      if (totalItems <= 1) return;

      // Otomatik kaydırma fonksiyonu
      const autoScroll = () => {
        currentIndex = (currentIndex + 1) % totalItems;
        const scrollPosition = items[currentIndex].offsetLeft - container.offsetLeft;
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      };

      // 4 saniyede bir otomatik kaydır
      const autoScrollInterval = setInterval(autoScroll, 4000);

      // Kullanıcı manuel kaydırırsa otomatik kaydırmayı geçici durdur
      let userScrolling = false;
      let userScrollTimeout;

      container.addEventListener('scroll', () => {
        userScrolling = true;
        clearTimeout(userScrollTimeout);

        userScrollTimeout = setTimeout(() => {
          userScrolling = false;
        }, 1000);
      });

      // Cleanup için interval'i sakla
      this.arrivalsAutoScrollInterval = autoScrollInterval;
    }
  }

  /**
   * Yeni gelenler etkileşimi
   */
  setupArrivalsInteraction() {
    // Kitap kartları üzerine gelindiğinde tooltip göster
    document.querySelectorAll('.arrival-card').forEach(card => {
      const tooltip = card.querySelector('.book-tooltip');
      
      card.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
      });
      
      card.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    });
  }

  /**
   * Otomatik açılan modal kurulumu
   */
  async setupAutoModal() {
    // Modal verisini modal.json'dan yükle
    try {
      const response = await fetch('data/content/modal.json');
      if (!response.ok) {
        console.warn('modal.json could not be loaded');
        return;
      }

      const modalConfig = await response.json();

      // Modal etkin mi kontrol et
      if (!modalConfig.enabled || !modalConfig.modals?.length) {
        return;
      }

      // Aktif modalı bul
      const activeModal = this.findActiveModal(modalConfig);
      if (!activeModal) return;

      // Tarih ve gösterim kontrolü
      if (!this.shouldShowModal(activeModal)) return;

      // Modal'ı başlat
      this.initModal(activeModal);
    } catch (error) {
      console.error('Error loading modal:', error);
    }
  }

  /**
   * Aktif modalı bul
   * 1. activeModal ID'si verilmişse o modalı bul (ve active kontrolü yap)
   * 2. activeModal yoksa, active: true olan ilk modalı bul
   */
  findActiveModal(modalConfig) {
    const { activeModal: activeId, modals } = modalConfig;

    // activeModal ID'si verilmişse
    if (typeof activeId === 'string' && activeId !== '') {
      const modal = modals.find(m => m.id === activeId);
      // Modal bulundu VE active ise döndür
      if (modal && modal.active !== false) {
        return modal;
      }
      // Modal bulunamadı veya active: false ise null döndür
      return null;
    }

    // activeModal yoksa, active: true olan ilk modalı bul
    return modals.find(m => m.active === true);
  }

  /**
   * Modal gösterilmeli mi kontrol et
   */
  shouldShowModal(modal) {
    // Tarih kontrolü
    const now = new Date();
    const start = modal.startDate ? new Date(modal.startDate) : null;
    const end = modal.endDate ? new Date(modal.endDate) : null;

    if ((start && now < start) || (end && now > end)) {
      return false;
    }

    // Bir kez göster kontrolü
    if (modal.showOnce) {
      const storageKey = `modal_${modal.id}_shown`;
      if (localStorage.getItem(storageKey) === 'true') {
        return false;
      }
    }

    return true;
  }

  /**
   * Modal'ı başlat
   */
  initModal(modalData) {
    const modal = document.getElementById('autoModal');
    if (!modal) return;

    // Modal içeriğini doldur
    this.populateModal(modal, modalData);

    // Event listener'ları ekle
    this.setupModalEvents(modal, modalData);

    // Modal'ı göster
    setTimeout(() => this.showModal(modal), 800);
  }

  /**
   * Modal içeriğini doldur (çoklu dil desteği ile)
   */
  populateModal(modal, data) {
    // Başlık (çoklu dil)
    const title = modal.querySelector('#modalTitle');
    if (title) {
      const titleText = Utils.getLocalizedText(data.title);
      title.textContent = titleText;
    }

    // Açıklama (çoklu dil)
    const description = modal.querySelector('#modalDescription');
    if (description) {
      const descText = Utils.getLocalizedText(data.description);
      description.textContent = descText;
    }

    // Resim (çoklu dil - farklı dillerde farklı görseller)
    const image = modal.querySelector('#modalImage');
    const imageWrapper = modal.querySelector('.modal-image-wrapper');
    const loader = modal.querySelector('.modal-image-loader');

    if (data.image && image) {
      // Resmi gizle ve loader göster
      image.style.display = 'none';
      if (loader) loader.style.display = 'flex';

      image.onload = () => {
        if (loader) loader.style.display = 'none';
        image.style.display = 'block';
      };

      image.onerror = () => {
        if (loader) loader.style.display = 'none';
        if (imageWrapper) imageWrapper.style.display = 'none';
      };

      // Resim yolu çoklu dil destekli (TR/EN için farklı görseller olabilir)
      const imagePath = Utils.getLocalizedText(data.image);
      image.src = imagePath;

      const titleText = Utils.getLocalizedText(data.title);
      image.alt = titleText;
    } else if (imageWrapper) {
      imageWrapper.style.display = 'none';
    }

    // Buton (çoklu dil)
    const button = modal.querySelector('#modalButton');
    if (button) {
      const buttonText = Utils.getLocalizedText(data.buttonText) || Utils.getLocalizedText({ tr: 'Detaylı Bilgi', en: 'Detailed Information' });
      button.textContent = buttonText;
      button.href = data.buttonUrl || '#';
    }

    // Kategori sınıfı
    if (data.category) {
      modal.classList.add(`modal-category-${data.category}`);
    }
  }

  /**
   * Modal event listener'larını kur
   */
  setupModalEvents(modal, data) {
    // Kapat butonları
    const closeButtons = modal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => this.closeModal(modal, data));
    });

    // Checkbox
    const checkbox = modal.querySelector('#modalDontShow');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          localStorage.setItem(`modal_${data.id}_shown`, 'true');
        }
      });
    }

    // ESC tuşu ile kapatma
    const handleEscape = (e) => {
      if (e.key === 'Escape' && modal.classList.contains('modal-open')) {
        this.closeModal(modal, data);
        document.removeEventListener('keydown', handleEscape);
      }
    };

    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Modal'ı göster
   */
  showModal(modal) {
    modal.classList.add('modal-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-active');

    // Focus trap
    const firstFocusable = modal.querySelector('button, a, input');
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }

  /**
   * Modal'ı kapat
   */
  closeModal(modal, data) {
    // Checkbox kontrolü
    const checkbox = modal.querySelector('#modalDontShow');
    if (checkbox?.checked) {
      localStorage.setItem(`modal_${data.id}_shown`, 'true');
    }

    // Modal'ı gizle
    modal.classList.remove('modal-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-active');

    // Kategori sınıfını kaldır
    if (data.category) {
      modal.classList.remove(`modal-category-${data.category}`);
    }
  }
}