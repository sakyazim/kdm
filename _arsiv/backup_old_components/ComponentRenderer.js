/**
 * STANDART BİLEŞEN RENDERER SINIFI
 * Tüm sayfalarda kullanılacak standart bileşenleri render eder
 * JSON veriden HTML çıktısı üretir
 */

export class ComponentRenderer {

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
    const { title, subtitle, icon, id } = data;

    const idAttr = id ? `id="${id}"` : '';
    const iconHTML = icon ? `<i class="${icon}"></i>` : '';

    switch (variant) {
      case 'single-icon':
        return `
          <div class="component-heading single-icon" ${idAttr}>
            ${iconHTML}
            <h2>${title}</h2>
          </div>
        `;

      case 'single-plain':
        return `
          <div class="component-heading single-plain" ${idAttr}>
            <h2>${title}</h2>
          </div>
        `;

      case 'double-icon':
        return `
          <div class="component-heading double-icon" ${idAttr}>
            <div class="heading-icon">${iconHTML}</div>
            <div class="heading-text">
              <h3>${title}</h3>
              ${subtitle ? `<p>${subtitle}</p>` : ''}
            </div>
          </div>
        `;

      case 'double-plain':
        return `
          <div class="component-heading double-plain" ${idAttr}>
            <h3>${title}</h3>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
          </div>
        `;

      default:
        return '';
    }
  }

  /**
   * 2. ALERT/İKAZ KUTUSU (Alert Component)
   * Varyantlar: info, warning, success, danger
   * Stiller: single-line, multi-line, list
   */
  static renderAlert(component) {
    const { variant, style, data } = component;
    const { icon, title, content, items } = data;

    const iconHTML = icon ? `<i class="${icon}"></i>` : '';

    let contentHTML = '';

    if (style === 'list' && items && items.length > 0) {
      const listItems = items.map(item => `<li>${item}</li>`).join('');
      contentHTML = `
        <div class="alert-content">
          ${title ? `<strong>${title}</strong>` : ''}
          <ul>${listItems}</ul>
        </div>
      `;
    } else {
      contentHTML = `
        <div class="alert-content">
          ${title ? `<strong>${title}</strong>` : ''}
          ${content ? `<p>${content}</p>` : ''}
        </div>
      `;
    }

    return `
      <div class="component-alert ${variant}">
        ${iconHTML}
        ${contentHTML}
      </div>
    `;
  }

  /**
   * 3. İKONLU LİSTE BİLEŞENİ (Icon List Component)
   */
  static renderIconList(component) {
    const { variant, data } = component;
    const { title, titleIcon, items } = data;

    const titleIconHTML = titleIcon ? `<i class="${titleIcon}"></i>` : '';
    const variantClass = variant ? `${variant}-variant` : '';

    const listItemsHTML = items.map(item => `
      <div class="list-item">
        <i class="${item.icon}"></i>
        <span>${item.text}</span>
      </div>
    `).join('');

    return `
      <div class="component-icon-list ${variantClass}">
        ${title ? `
          <div class="list-title">
            ${titleIconHTML}
            ${title}
          </div>
        ` : ''}
        <div class="list-wrapper">
          ${listItemsHTML}
        </div>
      </div>
    `;
  }

  /**
   * 4. TABLO BİLEŞENİ (Table Component)
   */
  static renderTable(component) {
    const { data } = component;
    const { title, headers, rows, id } = data;

    const idAttr = id ? `id="${id}"` : '';

    // Headers
    const headersHTML = headers.map(header => `<th>${header}</th>`).join('');

    // Rows
    const rowsHTML = rows.map(row => {
      const iconHTML = row.icon ? `<i class="${row.icon}"></i>` : '';
      const cellsHTML = row.cells.map((cell, index) => {
        const highlightClass = row.highlightColumns?.includes(index) ? 'highlight' : '';
        return `<td class="${highlightClass}">${index === 0 && iconHTML ? iconHTML : ''}${cell}</td>`;
      }).join('');
      return `<tr>${cellsHTML}</tr>`;
    }).join('');

    return `
      <div class="component-table-container" ${idAttr}>
        ${title ? `<h6 class="table-title">${title}</h6>` : ''}
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
    const { steps } = data;

    const stepsHTML = steps.map((step, index) => {
      const openClass = step.defaultOpen ? 'open' : 'collapsed';
      return `
        <div class="component-step-card ${openClass}" data-step="${index}">
          <div class="step-header">
            <div class="step-number">${step.number}</div>
            <div class="step-title">${step.title}</div>
            <i class="bi bi-chevron-down step-toggle"></i>
          </div>
          <div class="step-content">
            ${step.content}
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

    const titleIconHTML = titleIcon ? `<i class="${titleIcon}"></i>` : '';
    const variantClass = variant ? variant : 'default';

    return `
      <div class="component-info-box ${variantClass}">
        <div class="info-title">
          ${titleIconHTML}
          ${title}
        </div>
        <div class="info-content">
          <p>${content}</p>
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

    const linksHTML = resources.map(resource => `
      <a href="${resource.url}" class="component-resource-link" target="_blank" rel="noopener">
        <div class="resource-icon">
          <i class="${resource.icon}"></i>
        </div>
        <div class="resource-content">
          <h6>${resource.title}</h6>
          <p>${resource.description}</p>
        </div>
      </a>
    `).join('');

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
}

export default ComponentRenderer;
