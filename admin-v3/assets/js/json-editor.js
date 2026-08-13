/**
 * JSON EDITOR
 * Visual editor for multi-language JSON files
 */

class JSONEditor {
  constructor() {
    this.data = null;
    this.fileName = null;
    this.currentMode = 'visual';
  }

  /**
   * Initialize editor with data
   */
  init(data, fileName) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone
    this.fileName = fileName;
    this.render();
  }

  /**
   * Render editor based on current mode
   */
  render() {
    if (this.currentMode === 'visual') {
      this.renderVisualEditor();
    } else if (this.currentMode === 'code') {
      this.renderCodeEditor();
    }
  }

  /**
   * Render visual editor
   */
  renderVisualEditor() {
    const container = document.getElementById('visualEditorContent');
    if (!this.data) {
      container.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 40px;">Veri yüklenmedi</p>';
      return;
    }

    let html = '';

    // Meta section
    if (this.data.meta) {
      html += this.renderSection('meta', 'Meta Bilgileri', 'fas fa-tags', this.data.meta);
    }

    // Hero section
    if (this.data.hero) {
      html += this.renderSection('hero', 'Hero Bölümü', 'fas fa-image', this.data.hero);
    }

    // Content section
    if (this.data.content) {
      html += this.renderSection('content', 'İçerik', 'fas fa-file-alt', this.data.content);
    }

    // Help section
    if (this.data.help) {
      html += this.renderSection('help', 'Yardım Bölümü', 'fas fa-question-circle', this.data.help);
    }

    // Additional sections
    for (const key in this.data) {
      if (!['meta', 'hero', 'content', 'help'].includes(key)) {
        html += this.renderSection(key, this.humanizeKey(key), 'fas fa-cube', this.data[key]);
      }
    }

    container.innerHTML = html;
  }

  /**
   * Render a section
   */
  renderSection(key, title, icon, data) {
    return `
      <div class="form-section" data-section="${key}">
        <div class="section-header">
          <div class="section-title">
            <i class="${icon}"></i>
            ${title}
          </div>
          <button class="btn btn-sm btn-secondary" onclick="jsonEditor.collapseSection(this)">
            <i class="fas fa-chevron-up"></i>
          </button>
        </div>
        <div class="section-content">
          ${this.renderObject(data, key)}
        </div>
      </div>
    `;
  }

  /**
   * Render object recursively
   */
  renderObject(obj, path) {
    // Debug logging
    if (path && path.includes('buttons')) {
      console.log('renderObject called with path:', path, 'isArray:', Array.isArray(obj), 'value:', obj);
    }

    if (!obj || typeof obj !== 'object') {
      return this.renderField(obj, path);
    }

    // Check if this is a multi-language field
    if (this.isMultilangField(obj)) {
      return this.renderMultilangField(obj, path);
    }

    // Array
    if (Array.isArray(obj)) {
      console.log('Rendering array at path:', path, 'length:', obj.length);
      return this.renderArray(obj, path);
    }

    // Object
    let html = '';
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fieldPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        html += `
          <div class="field-group">
            <label class="field-label">${this.humanizeKey(key)}</label>
            ${this.renderObject(value, fieldPath)}
          </div>
        `;
      }
    }
    return html;
  }

  /**
   * Check if field is multi-language
   */
  isMultilangField(obj) {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return false;
    const keys = Object.keys(obj);
    return keys.length === 2 && keys.includes('tr') && keys.includes('en');
  }

  /**
   * Render multi-language field
   */
  renderMultilangField(obj, path) {
    const trValue = obj.tr || '';
    const enValue = obj.en || '';
    const isTextarea = (typeof trValue === 'string' && trValue.length > 50) ||
                       (typeof enValue === 'string' && enValue.length > 50);

    return `
      <div class="lang-inputs">
        <div class="lang-input">
          <span class="lang-badge">TR</span>
          ${isTextarea ?
            `<textarea class="field-input" data-path="${path}.tr" data-lang="tr" oninput="jsonEditor.updateValue(this)">${this.escapeHtml(trValue)}</textarea>` :
            `<input type="text" class="field-input" data-path="${path}.tr" data-lang="tr" value="${this.escapeHtml(trValue)}" oninput="jsonEditor.updateValue(this)">`
          }
        </div>
        <div class="lang-input">
          <span class="lang-badge en">EN</span>
          ${isTextarea ?
            `<textarea class="field-input" data-path="${path}.en" data-lang="en" oninput="jsonEditor.updateValue(this)">${this.escapeHtml(enValue)}</textarea>` :
            `<input type="text" class="field-input" data-path="${path}.en" data-lang="en" value="${this.escapeHtml(enValue)}" oninput="jsonEditor.updateValue(this)">`
          }
        </div>
      </div>
      <div class="translation-status">
        <span class="status-badge ${trValue ? 'status-complete' : 'status-missing'}">TR ${trValue ? '✓' : '✗'}</span>
        <span class="status-badge ${enValue ? 'status-complete' : 'status-missing'}">EN ${enValue ? '✓' : '✗'}</span>
      </div>
    `;
  }

  /**
   * Render array
   */
  renderArray(arr, path) {
    if (arr.length === 0) {
      return '<p style="color: var(--text-tertiary); font-size: 12px;">Boş array</p>';
    }

    let html = '<div class="array-container" style="padding-left: 20px; border-left: 2px solid var(--border);">';
    arr.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;

      // For primitive values
      if (typeof item !== 'object' || item === null) {
        html += `
          <div class="field-group" style="margin-bottom: 16px;">
            <label class="field-label">Öğe ${index + 1}</label>
            ${this.renderField(item, itemPath)}
          </div>
        `;
      }
      // For objects
      else {
        html += `
          <div class="array-item" style="margin-bottom: 20px; padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
            <div class="field-label" style="margin-bottom: 12px; font-weight: 600;">Öğe ${index + 1}</div>
            ${this.renderObjectFields(item, itemPath)}
          </div>
        `;
      }
    });
    html += '</div>';
    return html;
  }

  /**
   * Render object fields without wrapping in field-group
   */
  renderObjectFields(obj, path) {
    let html = '';

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fieldPath = `${path}.${key}`;
        const value = obj[key];

        html += `
          <div class="field-group" style="margin-bottom: 12px;">
            <label class="field-label">${this.humanizeKey(key)}</label>
            ${this.renderObject(value, fieldPath)}
          </div>
        `;
      }
    }

    return html;
  }

  /**
   * Render simple field (primitive values only)
   */
  renderField(value, path) {
    // Convert value to string safely
    let displayValue = '';
    if (value === null || value === undefined) {
      displayValue = '';
    } else if (typeof value === 'string') {
      displayValue = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      displayValue = String(value);
    } else {
      // Objects/Arrays shouldn't reach here, but handle gracefully
      console.warn('renderField received non-primitive value:', value, 'at path:', path);
      displayValue = JSON.stringify(value);
    }

    // Technical fields - don't translate
    const pathParts = path.split('.');
    const fieldName = pathParts[pathParts.length - 1];
    if (ADMIN_CONFIG.technicalFields.includes(fieldName)) {
      return `
        <input type="text" class="field-input" data-path="${path}" value="${this.escapeHtml(displayValue)}" oninput="jsonEditor.updateValue(this)">
        <p class="field-description" style="color: var(--text-tertiary); font-size: 11px; margin-top: 4px;">
          <i class="fas fa-info-circle"></i> Teknik alan (çevrilmez)
        </p>
      `;
    }

    return `<input type="text" class="field-input" data-path="${path}" value="${this.escapeHtml(displayValue)}" oninput="jsonEditor.updateValue(this)">`;
  }

  /**
   * Update value in data
   */
  updateValue(input) {
    const path = input.dataset.path;
    const value = input.value;

    // Navigate to the correct location in data
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let obj = this.data;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;

    // Mark as dirty
    if (window.fileManager) {
      fileManager.updateData(this.data);
    }

    // Update translation status
    if (input.dataset.lang) {
      this.updateTranslationStatus(input);
    }

    // Update code editor if visible
    if (this.currentMode === 'code') {
      document.getElementById('codeEditorTextarea').value = JSON.stringify(this.data, null, 2);
    }
  }

  /**
   * Update translation status badge
   */
  updateTranslationStatus(input) {
    const langInput = input.closest('.lang-input');
    if (!langInput) return;

    const langInputs = langInput.parentElement;
    const statusDiv = langInputs.nextElementSibling;
    if (!statusDiv || !statusDiv.classList.contains('translation-status')) return;

    const lang = input.dataset.lang;
    const hasTr = langInputs.querySelector('[data-lang="tr"]').value.trim() !== '';
    const hasEn = langInputs.querySelector('[data-lang="en"]').value.trim() !== '';

    const badges = statusDiv.querySelectorAll('.status-badge');
    badges[0].className = `status-badge ${hasTr ? 'status-complete' : 'status-missing'}`;
    badges[0].textContent = `TR ${hasTr ? '✓' : '✗'}`;
    badges[1].className = `status-badge ${hasEn ? 'status-complete' : 'status-missing'}`;
    badges[1].textContent = `EN ${hasEn ? '✓' : '✗'}`;
  }

  /**
   * Render code editor
   */
  renderCodeEditor() {
    const textarea = document.getElementById('codeEditorTextarea');
    textarea.value = JSON.stringify(this.data, null, 2);
  }

  /**
   * Update data from code editor
   */
  updateFromCodeEditor() {
    const textarea = document.getElementById('codeEditorTextarea');
    try {
      this.data = JSON.parse(textarea.value);
      if (window.fileManager) {
        fileManager.updateData(this.data);
      }
      showToast('success', 'Başarılı', 'Kod güncellendi');
    } catch (error) {
      showToast('error', 'Hata!', `Geçersiz JSON: ${error.message}`);
    }
  }

  /**
   * Show missing translations
   */
  showMissingTranslations() {
    const missing = this.findMissingTranslations(this.data);
    const modal = document.getElementById('missingTranslationsModal');
    const list = document.getElementById('missingTranslationsList');

    if (missing.length === 0) {
      list.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <div>
            <strong>Harika!</strong><br>
            Tüm çeviriler tamamlanmış.
          </div>
        </div>
      `;
    } else {
      let html = `
        <div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle"></i>
          <div>
            <strong>Uyarı!</strong><br>
            ${missing.length} alanda çeviri eksik.
          </div>
        </div>
        <ul style="list-style: none; padding: 0;">
      `;

      missing.forEach(item => {
        html += `
          <li style="padding: 8px 0; border-bottom: 1px solid var(--border);">
            <strong>${item.path}</strong><br>
            <small style="color: var(--text-tertiary);">Eksik: ${item.missingLangs.join(', ')}</small>
          </li>
        `;
      });

      html += '</ul>';
      list.innerHTML = html;
    }

    openModal('missingTranslationsModal');
  }

  /**
   * Find missing translations recursively
   */
  findMissingTranslations(obj, path = '', results = []) {
    if (this.isMultilangField(obj)) {
      const missingLangs = [];
      if (!obj.tr || obj.tr.trim() === '') missingLangs.push('TR');
      if (!obj.en || obj.en.trim() === '') missingLangs.push('EN');

      if (missingLangs.length > 0) {
        results.push({ path, missingLangs });
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.findMissingTranslations(item, `${path}[${index}]`, results);
      });
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newPath = path ? `${path}.${key}` : key;
          this.findMissingTranslations(obj[key], newPath, results);
        }
      }
    }

    return results;
  }

  /**
   * Validate data
   */
  validate() {
    const errors = [];

    // Check required fields based on file type
    const requiredFields = ADMIN_CONFIG.requiredFields.page || [];
    requiredFields.forEach(field => {
      if (!this.data[field]) {
        errors.push(`"${field}" alanı eksik`);
      }
    });

    // Check meta required fields
    if (this.data.meta) {
      if (!this.data.meta.title) errors.push('Meta title eksik');
      if (!this.data.meta.description) errors.push('Meta description eksik');
    }

    // Display results
    const modal = document.getElementById('validationModal');
    const results = document.getElementById('validationResults');

    if (errors.length === 0) {
      results.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          <div>
            <strong>Başarılı!</strong><br>
            Tüm doğrulama kontrolleri geçti.
          </div>
        </div>
      `;
    } else {
      let html = `
        <div class="alert alert-danger">
          <i class="fas fa-times-circle"></i>
          <div>
            <strong>Hata!</strong><br>
            ${errors.length} alanda sorun var.
          </div>
        </div>
        <ul style="list-style: none; padding: 0;">
      `;

      errors.forEach(error => {
        html += `<li style="padding: 8px 0; border-bottom: 1px solid var(--border);">⚠️ ${error}</li>`;
      });

      html += '</ul>';
      results.innerHTML = html;
    }

    openModal('validationModal');
  }

  /**
   * Collapse/expand section
   */
  collapseSection(btn) {
    const section = btn.closest('.form-section');
    const content = section.querySelector('.section-content');
    const icon = btn.querySelector('i');

    content.style.display = content.style.display === 'none' ? 'block' : 'none';
    icon.classList.toggle('fa-chevron-up');
    icon.classList.toggle('fa-chevron-down');
  }

  /**
   * Humanize key
   */
  humanizeKey(key) {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ')
      .trim();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Global instance
let jsonEditor;
