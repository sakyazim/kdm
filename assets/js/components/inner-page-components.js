/**
 * İÇ SAYFA BİLEŞEN RENDERER SINIFI
 * Inner Page Component Renderer Class
 *
 * Tüm iç sayfalarda kullanılacak standart bileşenleri render eder
 * JSON veriden HTML çıktısı üretir
 */

import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

export class ComponentRenderer {

  /**
   * Sayfa verisi (Açık/Kapalı rozetinin tatil takvimini okuması için).
   * Sayfa JS'i renderContent öncesi registerPageData ile doldurur.
   */
  static pageData = null;

  static registerPageData(data) {
    ComponentRenderer.pageData = data;
  }

  /**
   * Ana render metodu - Component type'a göre ilgili renderer'ı çağırır
   * @param {Object} component - Render edilecek bileşen
   * @returns {string} - HTML string
   */
  static render(component) {
    if (!component || !component.type) {
      console.warn('Invalid component:', component);
      return '';
    }

    switch (component.type) {
      case 'heading':
        return this.renderHeading(component);
      case 'alert':
        return this.renderAlert(component);
      case 'icon-list':
        return this.renderIconList(component);
      case 'icon-list-grid':
        return this.renderIconListGrid(component);
      case 'table':
        return this.renderTable(component);
      case 'step-cards':
        return this.renderStepCards(component);
      case 'info-box':
        return this.renderInfoBox(component);
      case 'resource-links':
        return this.renderResourceLinks(component);
      case 'search':
        return this.renderSearch(component);
      case 'divider':
        return this.renderDivider(component);
      case 'custom-html':
        return this.renderCustomHTML(component);
      case 'status-badge':
        return this.renderStatusBadge(component);
      case 'staff-list':
        return this.renderStaffList(component);
      case 'content':
        return this.renderContent(component);
      case 'stat-cards':
        return this.renderStatCards(component);
      case 'contact-box':
        return this.renderContactBox(component);
      case 'contact-buttons':
        return this.renderContactButtons(component);
      case 'map-embed':
        return this.renderMapEmbed(component);
      case 'news-display':
        return this.renderNewsDisplay(component);
      case 'step-guide':
        return this.renderStepGuide(component);
      case 'accordion':
        return this.renderAccordion(component);
      case 'collapsible-section':
        return this.renderCollapsibleSection(component);
      case 'link-cards':
        return this.renderLinkCards(component);
      case 'search-filter':
        return this.renderSearchFilter(component);
      case 'search-with-controls':
        return this.renderSearchWithControls(component);
      case 'circular-progress':
        return this.renderCircularProgress(component);
      default:
        console.warn('Unknown component type:', component.type);
        return '';
    }
  }

  /**
   * 1. BAŞLIK BİLEŞENİ (Heading Component)
   * Varyantlar: single-icon, single-plain, double-icon, double-plain
   */
  static renderHeading(component) {
    const { variant, data } = component;
    const v = variant || 'single-icon';
    const { title, subtitle, icon, id, statusBadge } = data;

    // Çoklu dil desteği
    const localizedTitle = Utils.getLocalizedText(title);
    const localizedSubtitle = subtitle ? Utils.getLocalizedText(subtitle) : '';

    const idAttr = id ? `id="${id}"` : '';
    const iconHTML = icon ? `<i class="${icon}"></i>` : '';

    // Status Badge varsa render et (from-table dahil tüm alanlar geçirilir)
    let statusBadgeHTML = '';
    if (statusBadge) {
      statusBadgeHTML = this.renderStatusBadge(statusBadge);
    }

    switch (v) {
      case 'single-icon':
        return `
          <div class="component-heading single-icon" ${idAttr}>
            ${iconHTML}
            <h2>${localizedTitle}</h2>
            ${statusBadgeHTML}
          </div>
        `;

      case 'single-plain':
        return `
          <div class="component-heading single-plain" ${idAttr}>
            <h2>${localizedTitle}</h2>
            ${statusBadgeHTML}
          </div>
        `;

      case 'double-icon':
        return `
          <div class="component-heading double-icon" ${idAttr}>
            <div class="heading-icon">${iconHTML}</div>
            <div class="heading-text">
              <h3>${localizedTitle}</h3>
              ${localizedSubtitle ? `<p>${localizedSubtitle}</p>` : ''}
            </div>
            ${statusBadgeHTML}
          </div>
        `;

      case 'double-plain':
        return `
          <div class="component-heading double-plain" ${idAttr}>
            <h3>${localizedTitle}</h3>
            ${localizedSubtitle ? `<p>${localizedSubtitle}</p>` : ''}
            ${statusBadgeHTML}
          </div>
        `;

      default:
        return '';
    }
  }

  /**
   * 2. ALERT/İKAZ KUTUSU (Alert Component)
   * Varyantlar: info, warning, success, danger, primary
   * Stiller: single-line, multi-line, list
   */
  static renderAlert(component) {
    const { variant, style, data } = component;
    const v = variant || (data && data.style) || 'default';
    const { icon, title, content, items, link, linkText, linkIcon } = data;

    // Çoklu dil desteği
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';
    const localizedContent = content ? Utils.mdToHtml(Utils.getLocalizedText(content)) : '';
    const localizedLinkText = linkText ? Utils.getLocalizedText(linkText) : '';

    const iconHTML = icon ? `<i class="${icon}"></i>` : '';

    let contentHTML = '';

    if (style === 'list' && items && items.length > 0) {
      const localizedItems = Utils.getLocalizedText(items);
      const listItems = localizedItems.map(item => `<li>${Utils.mdToHtml(item)}</li>`).join('');
      contentHTML = `
        <div class="alert-content">
          ${localizedTitle ? `<strong>${Utils.mdToHtml(localizedTitle)}</strong>` : ''}
          <ul>${listItems}</ul>
        </div>
      `;
    } else {
      contentHTML = `
        <div class="alert-content">
          ${localizedTitle ? `<strong>${Utils.mdToHtml(localizedTitle)}</strong>` : ''}
          ${localizedContent}
        </div>
      `;
    }

    // Link varsa ekle (çoklu dil desteği)
    let linkHTML = '';
    if (link && localizedLinkText) {
      const localizedLink = Utils.getLocalizedText(link); // Link de çoklu dil destekli olabilir
      const linkIconHTML = linkIcon ? `<i class="${linkIcon}"></i>` : '';
      linkHTML = `
        <a href="${localizedLink}" class="alert-link" target="_blank" rel="noopener">
          ${linkIconHTML}
          ${localizedLinkText}
        </a>
      `;
    }

    return `
      <div class="component-alert ${v}">
        ${iconHTML}
        ${contentHTML}
        ${linkHTML}
      </div>
    `;
  }

  /**
   * 3. İKONLU LİSTE BİLEŞENİ (Icon List Component)
   */
  static renderIconList(component) {
    const { variant, data } = component;
    const { title, titleIcon, items } = data;

    // Çoklu dil desteği
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';

    const titleIconHTML = titleIcon ? `<i class="${titleIcon}"></i>` : '';
    const variantClass = variant ? `${variant}-variant` : '';

    const listItemsHTML = items.map(item => {
      // text, title veya description kullanımını destekle - HER BİRİNİ AYRI AYRI LOCALİZE ET
      let itemTitle = '';
      let itemDescription = '';

      // Title'ı localize et
      if (item.title) {
        itemTitle = Utils.getLocalizedText(item.title);
      } else if (item.text) {
        itemTitle = Utils.getLocalizedText(item.text);
      }

      // Description'ı localize et
      if (item.description) {
        itemDescription = Utils.getLocalizedText(item.description);
      }

      // Eğer sadece title varsa (eski format), tek satır göster
      if (itemTitle && !itemDescription) {
        return `
          <div class="list-item">
            <i class="${item.icon}"></i>
            <span>${Utils.mdToHtml(itemTitle)}</span>
          </div>
        `;
      }

      // Title + Description formatı
      return `
        <div class="list-item">
          <i class="${item.icon}"></i>
          <div class="list-item-content">
            <strong>${Utils.mdToHtml(itemTitle)}</strong>
            <p>${Utils.mdToHtml(itemDescription)}</p>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="component-icon-list ${variantClass}">
        ${localizedTitle ? `
          <div class="list-title">
            ${titleIconHTML}
            ${localizedTitle}
          </div>
        ` : ''}
        <div class="list-wrapper">
          ${listItemsHTML}
        </div>
      </div>
    `;
  }

  /**
   * 3B. İKONLU LİSTE GRİD BİLEŞENİ (Icon List Grid Component)
   * İki veya daha fazla icon-list'i yan yana grid layout ile gösterir
   */
  static renderIconListGrid(component) {
    const { variant, data } = component;
    const { columns, gap } = data;

    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      console.warn('icon-list-grid: columns array is required');
      return '';
    }

    const gapClass = gap ? `gap-${gap}` : 'gap-md';
    const variantClass = variant ? `${variant}-variant` : '';
    const colCount = columns.length;
    const gridClass = `grid-cols-${colCount}`;

    // Her bir kolonu renderIconList kullanarak oluştur
    const columnsHTML = columns.map(columnData => {
      // Her kolon aslında bir icon-list component'i
      const iconListHTML = this.renderIconList({
        type: 'icon-list',
        variant: columnData.variant || variant || 'default',
        data: columnData
      });

      return `
        <div class="grid-column">
          ${iconListHTML}
        </div>
      `;
    }).join('');

    return `
      <div class="component-icon-list-grid ${variantClass} ${gridClass} ${gapClass}">
        ${columnsHTML}
      </div>
    `;
  }

  /**
   * 4. TABLO BİLEŞENİ (Table Component)
   */
  static renderTable(component) {
    const { data } = component;
    const { title, headers, rows, id } = data;

    // Çoklu dil desteği
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';

    const idAttr = id ? `id="${id}"` : '';

    // Headers - çoklu dil desteği
    const headersHTML = headers.map(header => {
      const localizedHeader = Utils.getLocalizedText(header);
      return `<th>${Utils.mdToHtml(localizedHeader)}</th>`;
    }).join('');

    // Rows - çoklu dil desteği
    const rowsHTML = rows.map(row => {
      const iconHTML = row.icon ? `<i class="${row.icon}"></i>` : '';
      const cellsHTML = row.cells.map((cell, index) => {
        const highlightClass = row.highlightColumns?.includes(index) ? 'highlight' : '';
        const localizedCell = Utils.getLocalizedText(cell);
        return `<td class="${highlightClass}">${index === 0 && iconHTML ? iconHTML : ''}${Utils.mdToHtml(localizedCell)}</td>`;
      }).join('');
      return `<tr>${cellsHTML}</tr>`;
    }).join('');

    return `
      <div class="component-table-container" ${idAttr}>
        ${localizedTitle ? `<h6 class="table-title">${localizedTitle}</h6>` : ''}
        <div class="table-responsive">
          <table class="component-table">
            <thead>
              <tr>${headersHTML}</tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * 5. STEP CARD BİLEŞENİ (Step Cards Component)
   */
  static renderStepCards(component) {
    const { data } = component;
    const { steps, items } = data;

    // steps veya items kullanımını destekle
    const stepItems = steps || items;

    if (!stepItems) {
      console.error('Step cards data is missing steps or items array');
      return '';
    }

    const stepsHTML = stepItems.map((step, index) => {
      const openClass = step.defaultOpen ? 'open' : 'collapsed';

      // Çoklu dil desteği
      const localizedTitle = Utils.getLocalizedText(step.title);
      const localizedContent = Utils.mdToHtml(Utils.getLocalizedText(step.content));

      return `
        <div class="component-step-card ${openClass}" data-step="${index}">
          <div class="step-header">
            <div class="step-number">${step.number}</div>
            <div class="step-title">${localizedTitle}</div>
            <i class="bi bi-chevron-down step-toggle"></i>
          </div>
          <div class="step-content">
            ${localizedContent}
          </div>
        </div>
      `;
    }).join('');

    // Event listener'ları ekle (bir kere)
    setTimeout(() => {
      this.initStepCards();
    }, 100);

    return `<div class="component-step-cards">${stepsHTML}</div>`;
  }

  /**
   * Step Cards için accordion işlevselliği
   */
  static initStepCards() {
    const stepCards = document.querySelectorAll('.component-step-card .step-header');

    stepCards.forEach(header => {
      // Önceden eklenmiş listener'ı kontrol et
      if (header.dataset.listenerAdded) return;
      header.dataset.listenerAdded = 'true';

      header.addEventListener('click', function() {
        const card = this.closest('.component-step-card');
        const wasOpen = card.classList.contains('open');

        // Toggle
        if (wasOpen) {
          card.classList.remove('open');
          card.classList.add('collapsed');
        } else {
          card.classList.remove('collapsed');
          card.classList.add('open');
        }
      });
    });
  }

  /**
   * 6. INFO BOX BİLEŞENİ (Info Box Component)
   * Varyantlar: single-icon, single-plain, double-icon, double-plain, warning-single
   */
  static renderInfoBox(component) {
    const { variant, data } = component;
    const { title, titleIcon, content } = data;

    // Çoklu dil desteği
    const localizedTitle = Utils.getLocalizedText(title);
    const localizedContent = Utils.mdToHtml(Utils.getLocalizedText(content));

    const titleIconHTML = titleIcon ? `<i class="${titleIcon}"></i>` : '';
    const variantClass = variant ? variant : 'default';

    return `
      <div class="component-info-box ${variantClass}">
        <div class="info-title">
          ${titleIconHTML}
          ${localizedTitle}
        </div>
        <div class="info-content">
          ${localizedContent}
        </div>
      </div>
    `;
  }

  /**
   * 7. RESOURCE LINKS BİLEŞENİ (Resource Links Component)
   */
  static renderResourceLinks(component) {
    const { data } = component;
    const { resources } = data;

    const linksHTML = resources.map(resource => {
      // Çoklu dil desteği
      const localizedTitle = Utils.getLocalizedText(resource.title);
      const localizedDescription = Utils.mdToHtml(Utils.getLocalizedText(resource.description));

      return `
        <a href="${resource.url}" class="component-resource-link" target="_blank" rel="noopener">
          <div class="resource-icon">
            <i class="${resource.icon}"></i>
          </div>
          <div class="resource-content">
            <h6>${localizedTitle}</h6>
            <p>${localizedDescription}</p>
          </div>
        </a>
      `;
    }).join('');

    return `<div class="component-resource-links">${linksHTML}</div>`;
  }

  /**
   * 8. ARAMA BİLEŞENİ (Search Component)
   */
  static renderSearch(component) {
    const { variant, data } = component;
    const { placeholder, showClearButton, id } = data;

    const idAttr = id ? `id="${id}"` : '';
    const inputId = id ? `${id}-input` : 'search-input';
    const clearBtnId = id ? `${id}-clear` : 'search-clear';

    const clearButtonHTML = showClearButton ? `
      <button type="button" class="clear-btn" id="${clearBtnId}" style="display:none;">
        <i class="bi bi-x-lg"></i>
      </button>
    ` : '';

    const html = `
      <div class="component-search-section" ${idAttr}>
        <div class="component-search-wrapper">
          <div class="component-search-input-group">
            <i class="fas fa-search search-icon"></i>
            <input
              type="text"
              id="${inputId}"
              class="search-input"
              placeholder="${placeholder}"
            >
            ${clearButtonHTML}
          </div>
        </div>
      </div>
    `;

    // Clear button işlevselliği ekle
    if (showClearButton) {
      setTimeout(() => {
        this.initSearchClear(inputId, clearBtnId);
      }, 100);
    }

    return html;
  }

  /**
   * Arama + kategoriler + kontroller (search-with-controls)
   * duyurular / guncel-haberler sayfalarının işlevsel render'ına paralel statik çıktı.
   * Davranış (arama/filtre olayları) sayfa JS'ine aittir; başka sayfada görsel yerleşim sağlar.
   */
  static renderSearchWithControls(component) {
    const { data } = component;
    if (!data) return '';

    const noResults = data.noResults || {};
    const categoriesHTML = (data.categories || []).map(cat => `
      <button class="category-btn ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
        ${cat.icon ? `<i class="${cat.icon}"></i>` : ''}
        ${Utils.getLocalizedText(cat.label)}
      </button>
    `).join('');

    const sortCfg = (data.controls || {}).sort || {};
    const sortControl = sortCfg.enabled ? `
      <button class="control-btn" id="sort-btn" title="Sıralama">
        <i class="${(sortCfg.icon || {}).desc || 'bi bi-sort-down-alt'}"></i>
        <span class="sort-text">${Utils.getLocalizedText((sortCfg.text || {}).desc)}</span>
      </button>
    ` : '';

    const viewCfg = (data.controls || {}).viewToggle || {};
    const viewToggleHTML = viewCfg.enabled ? `
      <div class="view-toggle-group">
        ${(viewCfg.options || []).map(option => `
          <button class="view-toggle-btn ${option.id === viewCfg.defaultView ? 'active' : ''}"
                  data-view="${option.id}"
                  title="${Utils.getLocalizedText(option.label)}">
            <i class="${option.icon}"></i>
          </button>
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="search-section">
        <div class="search-and-controls">
          <div class="search-wrapper">
            <div class="search-input-group">
              <i class="${data.icon || 'bi bi-search'} search-icon"></i>
              <input type="text" id="news-search" class="search-input" placeholder="${Utils.getLocalizedText(data.placeholder)}">
              <button type="button" id="clear-search" class="clear-search-btn" style="display:none;">
                <i class="${data.clearButtonIcon || 'bi bi-x-lg'}"></i>
              </button>
            </div>
          </div>
          ${sortControl}
          ${viewToggleHTML}
        </div>
        <div class="category-filters">
          ${categoriesHTML}
        </div>
      </div>
    `;
  }

  /**
   * Arama temizleme butonu işlevselliği
   */
  static initSearchClear(inputId, clearBtnId) {
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(clearBtnId);

    if (!input || !clearBtn) return;

    // Input değişikliğinde clear button'u göster/gizle
    input.addEventListener('input', function() {
      clearBtn.style.display = this.value ? 'flex' : 'none';
    });

    // Clear button'a tıklandığında
    clearBtn.addEventListener('click', function() {
      input.value = '';
      this.style.display = 'none';
      input.focus();

      // Custom event dispatch et (diğer komponentler için)
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  /**
   * 9. AYIRICI BİLEŞENİ (Divider Component)
   */
  static renderDivider(component) {
    const { variant } = component;
    const variantClass = variant || 'default';

    return `<div class="component-divider ${variantClass}"></div>`;
  }

  /**
   * 10. CUSTOM HTML BİLEŞENİ (Custom HTML Component)
   * Özel HTML içeriği direkt olarak render eder
   */
  static renderCustomHTML(component) {
    const { data } = component;
    const { html, className } = data;

    if (!html) {
      console.warn('Custom HTML component has no html content');
      return '';
    }

    const wrapperClass = className ? `component-custom-html ${className}` : 'component-custom-html';

    return `<div class="${wrapperClass}">${html}</div>`;
  }

  /**
   * 11. STATUS BADGE BİLEŞENİ (Status Badge Component)
   * Açık/Kapalı durumu gösteren dinamik rozet
   * Variant: auto (saat listesinden otomatik hesaplama), manual (manuel durum)
   */
  static renderStatusBadge(component) {
    const { variant, data } = component;

    const { hours, status, statusText, icon } = data || {};

    const localizedStatusText = statusText ? Utils.getLocalizedText(statusText) : '';
    const hasHours = Array.isArray(hours) && hours.length > 0;
    const hasManualData = status || localizedStatusText;

    // Anlamlı veri yoksa rozet çizme (boş statusBadge nesneleri için)
    if (!hasHours && !hasManualData) return '';

    let isOpen = false;
    let displayText = localizedStatusText;

    if (variant === 'auto' && hasHours) {
      // Otomatik durum hesaplama
      const now = new Date();

      // Tatil kontrolü: sayfa geneli (scheduleConfig.holidays) + rozet bazlı
      const holidays = ComponentRenderer.allHolidays(data);
      const isHoliday = Array.isArray(holidays) && holidays.includes(ComponentRenderer.dayKey(now));

      if (isHoliday) {
        displayText = LanguageManager.t('closed');
      } else {
        const currentDay = now.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Dakika cinsinden

        // Bugünkü çalışma saatini bul
        const todaySchedule = hours.find(h => h.dayNumbers && h.dayNumbers.includes(currentDay));

        if (todaySchedule && todaySchedule.openTime && todaySchedule.closeTime) {
          const openTime = ComponentRenderer.timeToMinutes(todaySchedule.openTime);
          const closeTime = ComponentRenderer.timeToMinutes(todaySchedule.closeTime);

          if (openTime !== null && closeTime !== null && currentTime >= openTime && currentTime < closeTime) {
            isOpen = true;
            displayText = LanguageManager.t('open');
          } else {
            displayText = LanguageManager.t('closed');
          }
        } else {
          displayText = LanguageManager.t('closed');
        }
      }
    } else if (variant === 'manual') {
      // Manuel durum
      isOpen = status === 'open';
      // Eğer statusText varsa ve çoklu dil formatındaysa, çevir
      if (localizedStatusText) {
        displayText = localizedStatusText;
      }
    }

    // Durum metni boşsa kapalı göster (varsayılan)
    if (!displayText) displayText = LanguageManager.t('closed');

    const statusClass = isOpen ? 'open' : 'closed';
    const iconHTML = icon ? `<i class="${icon}"></i>` : '<i class="bi bi-circle-fill"></i>';

    return `
      <div class="component-status-badge ${statusClass}">
        ${iconHTML}
        <span>${displayText}</span>
      </div>
    `;
  }

  /* -------------------------------------------------------
   * AÇIK/KAPALI ROZETİ — yardımcılar (auto mod)
   * ------------------------------------------------------- */

  /**
   * 'HH:MM' metnini dakikaya çevirir (24:00 → 1440 desteklenir)
   */
  static timeToMinutes(t) {
    if (!t) return null;
    const parts = String(t).split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1] || 0);
    if (Number.isNaN(h)) return null;
    return h * 60 + (Number.isNaN(m) ? 0 : m);
  }

  /** Bugünün 'YYYY-MM-DD' anahtarı (tatil eşleştirmesi için) */
  static dayKey(now) {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Sayfa geneli (scheduleConfig) tatillerini birleştirir */
  static allHolidays(table) {
    const pd = ComponentRenderer.pageData;
    const pageH = (pd && pd.scheduleConfig && pd.scheduleConfig.holidays) || [];
    const tableH = (table && table.holidays) || [];
    return [...pageH, ...tableH];
  }


  /**
   * 12. CONTENT BİLEŞENİ (Content Component)
   * Basit metin içeriği - alert componentindeki gibi
   */
  static renderContent(component) {
    const { data } = component;
    const { content } = data;

    if (!content) {
      console.warn('Content component has no content');
      return '';
    }

    // Çoklu dil desteği
    const localizedContent = Utils.mdToHtml(Utils.getLocalizedText(content));

    return `
      <div class="component-content">
        ${localizedContent}
      </div>
    `;
  }

  /**
   * 13. STAT CARDS BİLEŞENİ (Stat Cards Component)
   * İstatistik kartları - responsive grid layout
   */
  static renderStatCards(component) {
    const { data } = component;
    const { items } = data;

    if (!items || items.length === 0) {
      console.warn('Stat cards component has no items');
      return '';
    }

    const cardsHTML = items.map(item => {
      // Çoklu dil desteği
      const localizedLabel = Utils.getLocalizedText(item.label);
      const localizedValue = Utils.getLocalizedText(item.value);

      return `
        <div class="stat-card">
          <div class="stat-icon">
            <i class="${item.icon}"></i>
          </div>
          <div class="stat-content">
            <div class="stat-label">${localizedLabel}</div>
            <div class="stat-value">${localizedValue}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="stats-grid">
        ${cardsHTML}
      </div>
    `;
  }

  /**
   * 14. CONTACT BOX BİLEŞENİ (Contact Box Component)
   * İletişim kutusu - başlık, açıklama ve linkler
   * Varyantlar: default (tertiary-color arka plan), help-section-style (transparent, border-only)
   */
  static renderContactBox(component) {
    const { variant, data } = component;
    const { icon, title, text, links } = data;

    if (!links || links.length === 0) {
      console.warn('Contact box has no links');
      return '';
    }

    // Çoklu dil desteği
    const localizedTitle = Utils.getLocalizedText(title);
    const localizedText = text ? Utils.getLocalizedText(text) : '';

    const variantClass = variant ? `${variant}-variant` : '';
    const iconHTML = icon ? `<i class="${icon}"></i>` : '';

    const linksHTML = links.map(link => {
      const linkIcon = link.icon ? `<i class="${link.icon}"></i>` : '';
      const onclickAttr = link.onclick ? `onclick="${link.onclick}"` : '';
      const localizedLinkText = Utils.getLocalizedText(link.text);

      return `
        <a href="${link.url}" class="contact-link" ${onclickAttr}>
          ${linkIcon}
          ${localizedLinkText}
        </a>
      `;
    }).join('');

    return `
      <div class="component-contact-box ${variantClass}">
        <h5>
          ${iconHTML}
          ${localizedTitle}
        </h5>
        ${localizedText ? `<p class="mb-3">${localizedText}</p>` : ''}
        <div class="contact-links">
          ${linksHTML}
        </div>
      </div>
    `;
  }

  /**
   * 15. STAFF LIST BİLEŞENİ (Staff List Component)
   * Personel listesi - grid layout ile personel kartları
   */
  static renderStaffList(component) {
    const { data } = component;
    const { staff } = data;

    if (!staff || staff.length === 0) {
      return '<p>Personel bilgisi bulunamadı.</p>';
    }

    const staffCardsHTML = staff.map(person => {
      let cardContent = '';

      // İsim
      if (person.showName !== false) {
        cardContent += `<h4 class="staff-name">${person.name}</h4>`;
      }

      // Ünvan - çoklu dil desteği
      if (person.showTitle && person.title) {
        const localizedTitle = Utils.getLocalizedText(person.title);
        cardContent += `<p class="staff-title">${localizedTitle}</p>`;
      }

      // Email
      if (person.showEmail && person.email) {
        const emailDisplay = person.email.replace('[at]', '@');
        cardContent += `
          <div class="staff-contact-item">
            <i class="bi bi-envelope-fill"></i>
            <a href="mailto:${emailDisplay}">${person.email}</a>
          </div>
        `;
      }

      // Telefon
      if (person.phone) {
        cardContent += `
          <div class="staff-contact-item">
            <i class="bi bi-telephone-fill"></i>
            <span>${person.phone}</span>
          </div>
        `;
      }

      return `
        <div class="staff-card">
          <div class="staff-icon">
            <i class="bi bi-person-circle"></i>
          </div>
          <div class="staff-info">
            ${cardContent}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="staff-list">
        ${staffCardsHTML}
      </div>
    `;
  }

  /**
   * 16. CONTACT BUTTONS BİLEŞENİ (Contact Buttons Component)
   * İletişim butonları - telefon ve email butonları
   */
  static renderContactButtons(component) {
    const { data } = component;
    const { buttons, layout, gap, justify } = data;

    if (!buttons || buttons.length === 0) {
      console.warn('Contact buttons component has no buttons');
      return '';
    }

    const layoutStyle = layout || 'flex';
    const gapStyle = gap || '1rem';
    const justifyStyle = justify || 'center';

    const buttonsHTML = buttons.map(button => {
      const iconHTML = button.icon ? `<i class="${button.icon}"></i>` : '';
      return `
        <a href="${button.href}" class="btn-contact">
          ${iconHTML}
          ${button.text}
        </a>
      `;
    }).join('');

    return `
      <div style="display: ${layoutStyle}; gap: ${gapStyle}; justify-content: ${justifyStyle}; flex-wrap: wrap; margin-top: 1rem;">
        ${buttonsHTML}
      </div>
    `;
  }

  /**
   * 17. MAP EMBED BİLEŞENİ (Map Embed Component)
   * Google Maps veya diğer harita embed'leri için
   */
  static renderMapEmbed(component) {
    const { data } = component;
    const { embedUrl, width, height, borderRadius, allowFullscreen, loading } = data;

    if (!embedUrl) {
      console.warn('Map embed component has no embedUrl');
      return '';
    }

    const widthAttr = width || '100%';
    const heightAttr = height || '450px';
    const borderRadiusStyle = borderRadius || '12px';
    const allowFullscreenAttr = allowFullscreen !== false ? 'allowfullscreen=""' : '';
    const loadingAttr = loading || 'lazy';

    return `
      <div class="map-container" style="position: relative; width: 100%; height: ${heightAttr}; border-radius: ${borderRadiusStyle}; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 2rem;">
        <iframe
          src="${embedUrl}"
          width="${widthAttr}"
          height="100%"
          style="border:0;"
          ${allowFullscreenAttr}
          loading="${loadingAttr}"
          referrerpolicy="no-referrer-when-downgrade">
        </iframe>
      </div>
    `;
  }

  /**
   * 18. NEWS DISPLAY BİLEŞENİ (News Display Component)
   * Haberler için kontrol paneli ve grid görünümü
   */
  static renderNewsDisplay(component) {
    const { data } = component;
    const { containerId, defaultView, defaultSort, features } = data;

    const gridId = containerId || 'news-grid';
    const viewClass = defaultView === 'list' ? 'active' : '';
    const gridViewClass = defaultView === 'grid' ? 'active' : '';
    const sortIconClass = defaultSort === 'desc' ? 'bi bi-sort-down-alt' : 'bi bi-sort-up-alt';
    const sortText = defaultSort === 'desc' ? 'En Yeni' : 'En Eski';

    let html = '<div class="news-controls-wrapper">';

    // Top row with action buttons
    if (features.viewToggle || features.sorting) {
      html += '<div class="news-top-row"><div class="news-action-buttons">';

      if (features.sorting) {
        html += `
          <button class="news-sort-btn" id="sort-btn" data-sort="${defaultSort}" title="Tarihe Göre Sırala">
            <i class="${sortIconClass}"></i> ${sortText}
          </button>
        `;
      }

      if (features.viewToggle) {
        html += `
          <button class="view-toggle-btn ${gridViewClass}" data-view="grid" title="Kart Görünümü">
            <i class="bi bi-grid-3x3-gap"></i>
          </button>
          <button class="view-toggle-btn ${viewClass}" data-view="list" title="Liste Görünümü">
            <i class="bi bi-list-ul"></i>
          </button>
        `;
      }

      html += '</div></div>';
    }

    // Filter row
    if (features.filters) {
      html += `
        <div class="news-filter-row">
          <div class="news-filter-buttons" id="news-filters"></div>
        </div>
      `;
    }

    html += '</div>';

    // News grid
    html += `<div class="news-grid" id="${gridId}"></div>`;

    // No results message
    html += `
      <div class="no-results" id="no-results" style="display: none;">
        <div class="alert alert-info">
          <i class="bi bi-info-circle me-2"></i>
          Arama kriterlerinize uygun haber bulunamadı.
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Birden fazla bileşeni render et
   * @param {Array} components - Bileşenler dizisi
   * @returns {string} - Birleştirilmiş HTML string
   */
  static renderMultiple(components) {
    if (!Array.isArray(components)) {
      console.warn('renderMultiple expects an array');
      return '';
    }

    return components.map(component => this.render(component)).join('');
  }

  /**
   * İçerik bölümünü (section) section-card yapısında render et
   * İlk heading bileşeni kartın üstünde, diğer bileşenler section-card-body içinde render edilir.
   * @param {Object} section - { id, layout, className, components[] }
   * @returns {string} - Section HTML
   */
  static buildSectionCard(section) {
    if (!section || !Array.isArray(section.components) || section.components.length === 0) {
      return '';
    }

    const sectionId = section.id || '';
    const sectionClass = section.className || '';
    const layoutClass = section.layout ? ' layout-' + section.layout : '';

    let headingComponent = null;
    const otherComponents = [];

    section.components.forEach(comp => {
      if (comp.type === 'heading' && !headingComponent) {
        headingComponent = comp;
      } else {
        otherComponents.push(comp);
      }
    });

    return `
      <section class="section-card ${sectionClass}" ${sectionId ? `id="${sectionId}"` : ''}>
        ${headingComponent ? this.render(headingComponent) : ''}
        ${otherComponents.length > 0 ? `
          <div class="section-card-body${layoutClass}">
            ${this.renderMultiple(otherComponents)}
          </div>
        ` : ''}
      </section>
    `;
  }

  /**
   * Birden fazla içerik bölümünü section-card yapısında render et
   * @param {Array} sections - Bölümler dizisi
   * @returns {string} - Birleştirilmiş section HTML
   */
  static buildSectionCards(sections) {
    if (!Array.isArray(sections)) {
      console.warn('buildSectionCards expects an array');
      return '';
    }

    return sections.map(section => this.buildSectionCard(section)).join('');
  }

  /**
   * Bileşeni container'a render et
   * @param {string} containerId - Container ID
   * @param {Object|Array} component - Tek bileşen veya bileşen dizisi
   */
  static renderTo(containerId, component) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container not found: ${containerId}`);
      return;
    }

    if (Array.isArray(component)) {
      container.innerHTML = this.renderMultiple(component);
    } else {
      container.innerHTML = this.render(component);
    }
  }

  /**
   * Bileşeni container'a ekle (mevcut içeriği silmez)
   * @param {string} containerId - Container ID
   * @param {Object|Array} component - Tek bileşen veya bileşen dizisi
   */
  static appendTo(containerId, component) {
    const container = document.getElementById(containerId);

    if (!container) {
      console.error(`Container not found: ${containerId}`);
      return;
    }

    const html = Array.isArray(component)
      ? this.renderMultiple(component)
      : this.render(component);

    container.insertAdjacentHTML('beforeend', html);
  }

  /**
   * STEP GUIDE BİLEŞENİ - Adım adım görsel rehber
   * Uzaktan Erişim sayfası için
   */
  static renderStepGuide(component) {
    const { data } = component;
    const { steps } = data;

    if (!steps || !Array.isArray(steps)) {
      return '<p class="text-muted">Adım bilgisi bulunamadı.</p>';
    }

    let html = '<div class="step-guide-container">';

    steps.forEach((step, index) => {
      const isLast = index === steps.length - 1;

      // Çoklu dil desteği
      const localizedTitle = Utils.getLocalizedText(step.title);
      const localizedDescription = Utils.mdToHtml(Utils.getLocalizedText(step.description));
      const localizedImageAlt = Utils.getLocalizedText(step.imageAlt || step.title);
      const localizedNote = step.note ? Utils.mdToHtml(Utils.getLocalizedText(step.note)) : '';

      // Resim için çoklu dil desteği (yeni!)
      const localizedImage = step.image ? Utils.getLocalizedText(step.image) : '';

      html += `
        <div class="step-card" data-step="${step.id}">
          <div class="step-number">
            <span>${step.id}</span>
          </div>
          <div class="step-content">
            <h3 class="step-title">${localizedTitle}</h3>
            <div class="step-description">${localizedDescription}</div>
            ${localizedImage ? `
              <div class="step-guide-image">
                <img src="${localizedImage}" alt="${localizedImageAlt}" loading="lazy">
                <div class="image-placeholder">
                  <i class="bi bi-image"></i>
                  <span>Görsel yükleniyor...</span>
                </div>
              </div>
            ` : ''}
            ${localizedNote ? `
              <div class="step-note">
                <i class="bi bi-lightbulb"></i>
                <span>${localizedNote}</span>
              </div>
            ` : ''}
          </div>
          ${!isLast ? '<div class="step-connector"></div>' : ''}
        </div>
      `;
    });

    html += '</div>';

    return html;
  }

  /**
   * ACCORDION BİLEŞENİ - Sık Karşılaşılan Sorunlar için
   */
  static renderAccordion(component) {
    const { data } = component;
    const { id, title, items } = data;

    if (!items || !Array.isArray(items)) {
      return '<p class="text-muted">Soru bulunamadı.</p>';
    }

    // Çoklu dil desteği
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';

    let html = `
      <div class="accordion-section">
        ${localizedTitle ? `<h3 class="accordion-title">${localizedTitle}</h3>` : ''}
        <div class="accordion" id="${id}">
    `;

    items.forEach((item, index) => {
      const itemId = `${id}-item-${index}`;
      const isFirst = index === 0;

      // Çoklu dil desteği
      const localizedItemTitle = Utils.getLocalizedText(item.title);
      const localizedItemContent = Utils.mdToHtml(Utils.getLocalizedText(item.content));

      html += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button
              class="accordion-button ${isFirst ? '' : 'collapsed'}"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#${itemId}"
              aria-expanded="${isFirst ? 'true' : 'false'}"
              aria-controls="${itemId}">
              ${item.icon ? `<i class="${item.icon} me-2"></i>` : ''}
              ${localizedItemTitle}
            </button>
          </h2>
          <div
            id="${itemId}"
            class="accordion-collapse collapse ${isFirst ? 'show' : ''}"
            data-bs-parent="#${id}">
            <div class="accordion-body">
              ${localizedItemContent}
            </div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * COLLAPSIBLE SECTION BİLEŞENİ - Alternatif yöntem gibi isteğe bağlı içerik
   */
  static renderCollapsibleSection(component) {
    const { data } = component;
    const { id, title, icon, expanded, content } = data;

    // Çoklu dil desteği
    const localizedTitle = Utils.getLocalizedText(title);

    let contentHtml = '';

    if (Array.isArray(content)) {
      content.forEach(item => {
        switch (item.type) {
          case 'paragraph':
            const localizedText = Utils.mdToHtml(Utils.getLocalizedText(item.text));
            contentHtml += localizedText;
            break;
          case 'ordered-list':
            contentHtml += '<ol>';
            item.items.forEach(li => {
              const localizedLi = Utils.mdToHtml(Utils.getLocalizedText(li));
              contentHtml += `<li>${localizedLi}</li>`;
            });
            contentHtml += '</ol>';
            break;
          case 'unordered-list':
            contentHtml += '<ul>';
            item.items.forEach(li => {
              const localizedLi = Utils.mdToHtml(Utils.getLocalizedText(li));
              contentHtml += `<li>${localizedLi}</li>`;
            });
            contentHtml += '</ul>';
            break;
          case 'image':
            const localizedAlt = Utils.getLocalizedText(item.alt);
            const localizedImageSrc = Utils.getLocalizedText(item.src);
            contentHtml += `
              <div class="collapsible-image">
                <img src="${localizedImageSrc}" alt="${localizedAlt}" class="img-fluid">
              </div>
            `;
            break;
          case 'video':
            const localizedVideoTitle = Utils.getLocalizedText(item.title);
            const localizedVideoSrc = Utils.getLocalizedText(item.src);
            const localizedNote = item.note ? Utils.getLocalizedText(item.note) : '';
            contentHtml += `
              <div class="ratio ratio-16x9">
                <iframe src="${localizedVideoSrc}" title="${localizedVideoTitle}" allowfullscreen></iframe>
              </div>
              ${localizedNote ? `<p class="text-muted small mt-2">${localizedNote}</p>` : ''}
            `;
            break;
        }
      });
    } else {
      contentHtml = Utils.getLocalizedText(content);
    }

    return `
      <div class="collapsible-section">
        <button
          class="collapsible-toggle ${expanded ? 'active' : ''}"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#${id}"
          aria-expanded="${expanded ? 'true' : 'false'}"
          aria-controls="${id}">
          ${icon ? `<i class="${icon}"></i>` : ''}
          <span>${localizedTitle}</span>
          <i class="bi bi-chevron-down toggle-icon"></i>
        </button>
        <div
          id="${id}"
          class="collapse ${expanded ? 'show' : ''}">
          <div class="collapsible-content">
            ${contentHtml}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * LINK CARDS BİLEŞENİ - İlgili sayfalar için
   */
  static renderLinkCards(component) {
    const { data } = component;
    const { title, cards } = data;

    if (!cards || !Array.isArray(cards)) {
      return '';
    }

    // Çoklu dil desteği
    const localizedTitle = title ? Utils.getLocalizedText(title) : '';

    let html = `
      <div class="link-cards-section">
        ${localizedTitle ? `<h3 class="link-cards-title">${localizedTitle}</h3>` : ''}
        <div class="row g-3">
    `;

    cards.forEach(card => {
      // Çoklu dil desteği
      const localizedCardTitle = Utils.getLocalizedText(card.title);
      const localizedCardDescription = Utils.getLocalizedText(card.description);

      html += `
        <div class="col-12 col-sm-6 col-lg-3">
          <a href="${card.url}" class="link-card" style="--card-color: ${card.color}">
            <div class="link-card-icon">
              <i class="${card.icon}"></i>
            </div>
            <h4 class="link-card-title">${localizedCardTitle}</h4>
            <p class="link-card-description">${localizedCardDescription}</p>
            <span class="link-card-arrow">
              <i class="bi bi-arrow-right"></i>
            </span>
          </a>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * SEARCH FILTER BİLEŞENİ - Global arama ve filtreleme
   * Kullanım: Haberler, Duyurular, Veritabanları, SSS, Kime Sormalıyım
   *
   * @param {Object} component - Component data
   * @param {string} component.data.mode - 'normal' veya 'compact'
   * @param {boolean} component.data.sticky - Sticky davranış aktif mi
   * @param {Object} component.data.search - Arama kutusu ayarları
   * @param {Object} component.data.sort - Sıralama ayarları
   * @param {Object} component.data.viewToggle - Görünüm değiştirme ayarları
   * @param {Array} component.data.categories - Kategori filtreleri
   */
  static renderSearchFilter(component) {
    const { data } = component;
    const {
      mode = 'normal',
      sticky = true,
      search = {},
      sort = {},
      viewToggle = {},
      categories = [],
      noResults = {},
      mobileFiltersText = {}
    } = data;

    // CSS class'ları
    const modeClass = mode === 'compact' ? 'compact' : '';
    const stickyClass = sticky ? 'sticky-enabled' : '';

    // Arama kutusu
    const searchPlaceholder = Utils.getLocalizedText(search.placeholder) || 'Ara...';
    const searchIcon = search.icon || 'bi bi-search';
    const clearIcon = search.clearIcon || 'bi bi-x-circle';

    // Sıralama butonu (varsayılan durum — component verisindeki default metin/ikon)
    let sortButtonHTML = '';
    if (sort.enabled) {
      const sortIcon = sort.icon?.default || sort.icon?.desc || 'bi bi-sort-down';
      const sortText = Utils.getLocalizedText(sort.text?.default) || Utils.getLocalizedText(sort.text?.desc) || 'Sırala';

      sortButtonHTML = `
        <button class="control-btn" id="sort-btn" title="${sortText}">
          <i class="${sortIcon}"></i>
          <span class="sort-text">${sortText}</span>
        </button>
      `;
    }

    // Görünüm değiştirme butonları
    let viewToggleHTML = '';
    if (viewToggle.enabled && viewToggle.options) {
      const viewButtons = viewToggle.options.map(option => {
        const isActive = option.id === viewToggle.defaultView ? 'active' : '';
        const label = Utils.getLocalizedText(option.label);
        return `
          <button class="view-toggle-btn ${isActive}"
                  data-view="${option.id}"
                  title="${label}">
            <i class="${option.icon}"></i>
          </button>
        `;
      }).join('');

      viewToggleHTML = `
        <div class="view-toggle-group">
          ${viewButtons}
        </div>
      `;
    }

    // Kategori filtreleri
    let categoriesHTML = '';
    if (categories && categories.length > 0) {
      categoriesHTML = categories.map(cat => {
        const isActive = cat.id === 'all' ? 'active' : '';
        const label = Utils.getLocalizedText(cat.label);
        const icon = cat.icon ? `<i class="${cat.icon}"></i>` : '';
        const count = cat.count ? `<span class="count-badge">${cat.count}</span>` : '';

        return `
          <button class="category-btn ${isActive}" data-category="${cat.id}">
            ${icon}
            ${label}
            ${count}
          </button>
        `;
      }).join('');
    }

    // No results mesajı
    const noResultsTitle = Utils.getLocalizedText(noResults.title) || 'Sonuç bulunamadı';
    const noResultsDesc = Utils.getLocalizedText(noResults.description) || 'Arama kriterlerinize uygun sonuç bulunamadı.';
    const noResultsIcon = noResults.icon || 'bi bi-search';

    // Mobil filtreler butonu (sadece mobilde görünür)
    const mobileFiltersBtnText = Utils.getLocalizedText(mobileFiltersText) || 'Filtreler';
    const mobileFiltersBtn = categories && categories.length > 0 ? `
      <button class="mobile-filters-btn" id="mobile-filters-btn">
        <i class="bi bi-funnel"></i>
        <span>${mobileFiltersBtnText}</span>
      </button>
    ` : '';

    // HTML render
    return `
      <div class="search-filter-section ${modeClass} ${stickyClass}">
        <div class="search-and-controls">
          <div class="search-wrapper">
            <div class="search-input-group">
              <i class="${searchIcon} search-icon"></i>
              <input type="text"
                     id="search-input"
                     class="search-input"
                     placeholder="${searchPlaceholder}"
                     autocomplete="off">
              <button type="button" id="clear-search" class="clear-search-btn" style="display:none;">
                <i class="${clearIcon}"></i>
              </button>
            </div>
          </div>
          ${sortButtonHTML}
          ${viewToggleHTML}
        </div>
        ${mobileFiltersBtn}
        ${categoriesHTML ? `
          <div class="category-filters">
            ${categoriesHTML}
          </div>
        ` : ''}
      </div>
      <div class="no-results" id="no-results" style="display: none;">
        <i class="${noResultsIcon}"></i>
        <div class="no-results-content">
          <h4>${noResultsTitle}</h4>
          <p>${noResultsDesc}</p>
        </div>
      </div>
    `;
  }

  /**
   * 18. DAİRESEL PROGRESS BİLEŞENİ (Circular Progress Component)
   * Faaliyet raporundan uyarlanan circular progress kartları
   *
   * Kullanım:
   * {
   *   "type": "circular-progress",
   *   "data": {
   *     "items": [
   *       {
   *         "percentage": 85,
   *         "label": { "tr": "E-Kitap", "en": "E-Book" },
   *         "title": { "tr": "E-Kitap Koleksiyonu", "en": "E-Book Collection" },
   *         "description": { "tr": "1.781.823 dijital kitap", "en": "1,781,823 digital books" },
   *         "color": "primary" // primary, secondary, accent
   *       }
   *     ]
   *   }
   * }
   */
  static renderCircularProgress(component) {
    const { data } = component;
    const { items } = data;

    if (!items || items.length === 0) {
      return '';
    }

    // Renk mapping - CSS değişkenlerine göre
    const colorMap = {
      'primary': 'var(--primary-color)',
      'secondary': 'var(--secondary-color)',
      'accent': 'var(--accent-color)',
      'tertiary': 'var(--tertiary-color)'
    };

    const itemsHTML = items.map((item, index) => {
      const percentage = item.percentage || 0;
      const label = Utils.getLocalizedText(item.label);
      const title = Utils.getLocalizedText(item.title);
      const description = Utils.getLocalizedText(item.description);
      const colorKey = item.color || 'primary';
      const color = colorMap[colorKey] || colorMap['primary'];

      // SVG circle parametreleri
      const radius = 70;
      const circumference = 2 * Math.PI * radius;

      return `
        <div class="circular-progress-card">
          <div class="circular-progress-wrapper">
            <svg class="circular-progress-svg">
              <circle class="progress-bg" cx="75" cy="75" r="${radius}"></circle>
              <circle
                class="progress-bar-circular"
                cx="75"
                cy="75"
                r="${radius}"
                data-percent="${percentage}"
                data-circumference="${circumference}"
                style="stroke: ${color}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${circumference};">
              </circle>
            </svg>
            <div class="progress-center">
              <div class="progress-number" style="color: ${color};">${percentage}%</div>
              <div class="progress-label-small">${label}</div>
            </div>
          </div>
          <h4 class="circular-card-title">${title}</h4>
          <p class="circular-card-description">${description}</p>
        </div>
      `;
    }).join('');

    return `
      <div class="circular-progress-grid">
        ${itemsHTML}
      </div>
    `;
  }
}

export default ComponentRenderer;
