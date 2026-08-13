/**
 * Accessibility Widget Manager (v3.3)
 * Responsive & Accessible Edition
 *
 * Changes in v3.3 (2025-11-06):
 * - Fixed: Grid always 3 columns (no horizontal scroll)
 * - Fixed: Buttons scale with panel width instead of adding columns
 * - Panel width: 340px (default), 380px (1600px+), 420px (big mode)
 * - Compact boxes: 70px min-height, scale up on larger screens
 * - Modern gradient active state
 * - Enhanced keyboard navigation (Arrow keys, Enter, Space)
 * - Better scrollbar styling (blue theme)
 * - CTRL+U subtitle on single line
 * - Optimized for all screen sizes (480px - 1920px+)
 */

import { LanguageManager } from '../core/language-manager.js';

export class AccessibilityManager {
  constructor() {
    this.widgetData = null;
    this.currentLang = 'tr';
    this.isBigWidget = false;
    this.features = {
      contrast: false,
      'highlight-links': false,
      'big-text': 0,
      'text-spacing': false,
      'stop-animations': false,
      'hide-images': false,
      'dyslexia-font': false,
      'big-cursor': false,
      'reading-guide': false,
      'line-height': false,
      'text-align': false,
      saturation: false
    };
    this.trigger = null;
    this.panel = null;
    this.overlay = null;
    this.readingGuideLine = null;
    this.mouseMoveHandler = null;
  }

  /**
   * Initialize the accessibility widget
   */
  async init(widgetData = null) {
    // Get current language from global LanguageManager
    this.currentLang = LanguageManager.getCurrentLanguage();

    // Load data from JSON or use provided data
    if (widgetData) {
      this.widgetData = widgetData;
    } else {
      await this.loadWidgetData();
    }

    if (!this.widgetData || !this.widgetData.enabled) {
      console.log('Accessibility widget disabled or no data');
      return;
    }

    // Render HTML structure
    this.renderHTML();

    // Get DOM elements
    this.trigger = document.getElementById('accessibilityTrigger');
    this.panel = document.getElementById('accessibilityPanel');
    this.overlay = document.getElementById('accessibilityOverlay');

    if (!this.trigger || !this.panel) {
      console.error('Accessibility widget elements not found');
      return;
    }

    // Load saved settings
    this.loadSettings();

    // Setup event listeners
    this.setupEventListeners();

    console.log('✅ Accessibility Widget v3.3 initialized (Fixed Grid, No Scroll)');
  }

  /**
   * Load widget data from JSON
   */
  async loadWidgetData() {
    try {
      const response = await fetch('/data/global/accessibility.json');
      if (!response.ok) throw new Error('Failed to load accessibility data');
      this.widgetData = await response.json();
    } catch (error) {
      console.error('Error loading accessibility data:', error);
      this.widgetData = { enabled: false };
    }
  }

  /**
   * Render complete HTML structure
   */
  renderHTML() {
    const { keyboardShortcut, translations, features } = this.widgetData;
    const t = translations[this.currentLang];

    // Create overlay
    let overlayEl = document.getElementById('accessibilityOverlay');
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.className = 'accessibility-overlay';
      overlayEl.id = 'accessibilityOverlay';
      document.body.appendChild(overlayEl);
    }

    // Create widget container
    let widgetEl = document.getElementById('accessibilityWidget');
    if (!widgetEl) {
      widgetEl = document.createElement('div');
      widgetEl.className = 'accessibility-widget';
      widgetEl.id = 'accessibilityWidget';
      document.body.appendChild(widgetEl);
    }

    widgetEl.innerHTML = `
      <button class="accessibility-trigger" id="accessibilityTrigger" aria-label="${t.title} (${keyboardShortcut})">
        <i class="bi bi-universal-access"></i>
      </button>
      <div class="accessibility-panel" id="accessibilityPanel">
        <div class="accessibility-header">
          <h5 id="accessibilityTitle">${t.title} <small style="font-size: 14px; opacity: 0.8;">${t.subtitle}</small></h5>
          <button class="accessibility-close" id="accessibilityClose" aria-label="${t.closeLabel}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="accessibility-content">
          <div class="accessibility-grid">
            ${features.filter(f => f.enabled).map(feature => this.renderFeatureButton(feature)).join('')}
          </div>

          <!-- Reset Button -->
          <button class="accessibility-reset" id="accessibilityReset">
            <i class="bi bi-arrow-clockwise"></i>
            ${t.resetButton}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render individual feature button
   */
  renderFeatureButton(feature) {
    const t = this.widgetData.translations[this.currentLang];
    const featureName = this.camelCase(feature.id);
    const label = t.features[featureName] || feature.id;
    const ariaLabel = feature.ariaLabel[this.currentLang] || label;

    let iconHTML = '';
    if (feature.iconHtml) {
      iconHTML = feature.iconHtml;
    } else if (feature.icon) {
      iconHTML = `<i class="${feature.icon}"></i>`;
    }

    return `
      <button class="accessibility-option" data-feature="${feature.id}" aria-label="${ariaLabel}">
        <div class="option-icon">
          ${iconHTML}
        </div>
        <span>${label}</span>
      </button>
    `;
  }

  /**
   * Convert kebab-case to camelCase
   */
  camelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    const closeBtn = document.getElementById('accessibilityClose');
    const resetBtn = document.getElementById('accessibilityReset');
    const options = document.querySelectorAll('.accessibility-option');

    // Toggle panel
    this.trigger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePanel();
    });

    // Close button
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closePanel();
      });
    }

    // Overlay click
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closePanel();
      });
    }

    // Prevent panel clicks from closing
    this.panel.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Feature options - Click
    options.forEach((option) => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const feature = option.getAttribute('data-feature');
        this.toggleFeature(feature, option);
      });

      // Make keyboard accessible
      option.setAttribute('tabindex', '0');
      option.setAttribute('role', 'button');
    });

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetAll(resetBtn);
      });
    }

    // Keyboard navigation for options
    this.panel.addEventListener('keydown', (e) => {
      const optionsArray = Array.from(document.querySelectorAll('.accessibility-option'));
      const currentIndex = optionsArray.findIndex(opt => opt === document.activeElement);

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % optionsArray.length;
        optionsArray[nextIndex].focus();
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + optionsArray.length) % optionsArray.length;
        optionsArray[prevIndex].focus();
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (currentIndex >= 0) {
          const feature = optionsArray[currentIndex].getAttribute('data-feature');
          this.toggleFeature(feature, optionsArray[currentIndex]);
        }
      }
    });

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        this.togglePanel();
      }

      if (e.key === 'Escape' && this.panel.classList.contains('active')) {
        this.closePanel();
      }
    });
  }

  /**
   * Toggle panel open/close
   */
  togglePanel() {
    const isActive = this.panel.classList.contains('active');

    if (isActive) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  /**
   * Open panel
   */
  openPanel() {
    this.panel.classList.add('active');
    if (this.overlay) this.overlay.classList.add('active');
  }

  /**
   * Close panel
   */
  closePanel() {
    this.panel.classList.remove('active');
    if (this.overlay) this.overlay.classList.remove('active');
  }

  /**
   * Toggle feature on/off
   */
  toggleFeature(feature, optionElement) {
    if (feature === 'big-widget') {
      this.toggleBigWidget();
      optionElement.classList.toggle('active', this.isBigWidget);
      return;
    }

    if (feature === 'big-text') {
      this.features[feature] = (this.features[feature] + 1) % 3;

      document.body.classList.remove('accessibility-big-text-1', 'accessibility-big-text-2');

      if (this.features[feature] === 1) {
        document.body.classList.add('accessibility-big-text-1');
        optionElement.classList.add('active');
        optionElement.setAttribute('data-level', '1');
      } else if (this.features[feature] === 2) {
        document.body.classList.add('accessibility-big-text-2');
        optionElement.classList.add('active');
        optionElement.setAttribute('data-level', '2');
      } else {
        optionElement.classList.remove('active');
        optionElement.removeAttribute('data-level');
      }
    } else {
      this.features[feature] = !this.features[feature];

      if (this.features[feature]) {
        optionElement.classList.add('active');
      } else {
        optionElement.classList.remove('active');
      }

      this.applyFeature(feature, this.features[feature]);
    }

    this.updateActiveIndicator();
    this.saveSettings();
  }

  /**
   * Apply feature to body
   */
  applyFeature(feature, enabled) {
    const className = 'accessibility-' + feature;

    if (enabled) {
      document.body.classList.add(className);

      if (feature === 'reading-guide') {
        this.activateReadingGuide();
      }
    } else {
      document.body.classList.remove(className);

      if (feature === 'reading-guide') {
        this.deactivateReadingGuide();
      }
    }
  }

  /**
   * Activate reading guide
   */
  activateReadingGuide() {
    if (this.readingGuideLine) return;

    this.readingGuideLine = document.createElement('div');
    this.readingGuideLine.className = 'reading-guide-line';
    document.body.appendChild(this.readingGuideLine);

    this.mouseMoveHandler = (e) => {
      this.readingGuideLine.style.top = e.clientY + 'px';
    };

    document.addEventListener('mousemove', this.mouseMoveHandler);
  }

  /**
   * Deactivate reading guide
   */
  deactivateReadingGuide() {
    if (!this.readingGuideLine) return;

    this.readingGuideLine.remove();
    this.readingGuideLine = null;

    if (this.mouseMoveHandler) {
      document.removeEventListener('mousemove', this.mouseMoveHandler);
      this.mouseMoveHandler = null;
    }
  }

  /**
   * Toggle big widget
   */
  toggleBigWidget() {
    this.isBigWidget = !this.isBigWidget;

    if (this.isBigWidget) {
      this.panel.classList.add('big-widget');
    } else {
      this.panel.classList.remove('big-widget');
    }

    this.updateActiveIndicator();
    this.saveSettings();
  }

  /**
   * Update active indicator on trigger button
   */
  updateActiveIndicator() {
    let hasActive = false;

    for (let key in this.features) {
      if (key === 'big-text') {
        if (this.features[key] > 0) hasActive = true;
      } else if (this.features[key] === true) {
        hasActive = true;
      }
    }

    if (this.isBigWidget) hasActive = true;

    if (hasActive) {
      this.trigger.classList.add('has-active-features');
    } else {
      this.trigger.classList.remove('has-active-features');
    }
  }

  /**
   * Reset all features
   */
  resetAll(resetBtn) {
    Object.keys(this.features).forEach((feature) => {
      if (feature === 'big-text') {
        this.features[feature] = 0;
        document.body.classList.remove('accessibility-big-text-1', 'accessibility-big-text-2');

        const option = document.querySelector('[data-feature="' + feature + '"]');
        if (option) {
          option.classList.remove('active');
          option.removeAttribute('data-level');
        }
      } else {
        this.features[feature] = false;
        this.applyFeature(feature, false);

        const option = document.querySelector('[data-feature="' + feature + '"]');
        if (option) {
          option.classList.remove('active');
        }
      }
    });

    // Reset big widget
    this.isBigWidget = false;
    this.panel.classList.remove('big-widget');
    const bigWidgetOption = document.querySelector('[data-feature="big-widget"]');
    if (bigWidgetOption) {
      bigWidgetOption.classList.remove('active');
    }

    this.updateActiveIndicator();
    this.saveSettings();

    // Visual feedback
    const t = this.widgetData.translations[this.currentLang];
    const originalHTML = resetBtn.innerHTML;
    resetBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> ' + t.resetSuccess;
    resetBtn.style.background = '#d4edda';

    setTimeout(() => {
      resetBtn.innerHTML = originalHTML;
      resetBtn.style.background = '';
    }, 2000);
  }


  /**
   * Save settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify({
        features: this.features,
        lang: this.currentLang,
        bigWidget: this.isBigWidget
      }));
    } catch (e) {
      console.error('Cannot save settings:', e);
    }
  }

  /**
   * Load settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.features = Object.assign({}, this.features, settings.features);
        this.isBigWidget = settings.bigWidget || false;

        // Apply big widget
        if (this.isBigWidget) {
          this.panel.classList.add('big-widget');
          const bigWidgetOption = document.querySelector('[data-feature="big-widget"]');
          if (bigWidgetOption) {
            bigWidgetOption.classList.add('active');
          }
        }

        // Apply saved features
        Object.keys(this.features).forEach((feature) => {
          const option = document.querySelector('[data-feature="' + feature + '"]');

          if (feature === 'big-text') {
            const level = this.features[feature];
            if (level > 0) {
              document.body.classList.add('accessibility-big-text-' + level);
              if (option) {
                option.classList.add('active');
                option.setAttribute('data-level', level);
              }
            }
          } else if (this.features[feature]) {
            if (option) {
              option.classList.add('active');
            }
            this.applyFeature(feature, true);
          }
        });

        this.updateActiveIndicator();
      }
    } catch (e) {
      console.error('Cannot load settings:', e);
    }
  }
}

export default AccessibilityManager;
