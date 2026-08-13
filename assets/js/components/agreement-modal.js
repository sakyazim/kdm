/**
 * Global Agreement Modal System
 * Handles user acceptance requirements for specific pages
 * Usage: Add data-requires-agreement="agreement-key" to body tag
 */

import Utils from '../core/utils.js';
import { LanguageManager } from '../core/language-manager.js';

export class AgreementModalManager {
  constructor() {
    this.agreementKey = null;
    this.agreementData = null;
    this.overlay = null;
    this.isAccepted = false;
  }

  /**
   * Initialize the agreement modal system
   * Automatically checks if the page requires agreement
   */
  async init() {
    // Check if page requires agreement
    const bodyElement = document.body;
    this.agreementKey = bodyElement.getAttribute('data-requires-agreement');

    // If no agreement required, exit
    if (!this.agreementKey) {
      return;
    }

    // Check if already accepted
    const storageKey = `${this.agreementKey}-accepted`;
    this.isAccepted = localStorage.getItem(storageKey) === 'true';

    if (this.isAccepted) {
      console.log(`Agreement already accepted: ${this.agreementKey}`);
      return;
    }

    // Load agreement data
    await this.loadAgreementData();

    // Create and show modal
    this.createModal();
    this.setupEventListeners();

    // Show modal after a short delay
    setTimeout(() => {
      this.showModal();
    }, 500);
  }

  /**
   * Load agreement data from JSON file
   */
  async loadAgreementData() {
    try {
      const response = await fetch(`data/agreements/${this.agreementKey}.json`);
      if (!response.ok) {
        throw new Error(`Agreement data not found: ${this.agreementKey}`);
      }
      this.agreementData = await response.json();
      console.log('Agreement data loaded:', this.agreementData);
    } catch (error) {
      console.error('Error loading agreement data:', error);
      // Fallback to allow access if data cannot be loaded
      this.isAccepted = true;
    }
  }

  /**
   * Create the modal HTML structure
   */
  createModal() {
    if (!this.agreementData) {
      console.error('No agreement data available');
      return;
    }

    // Check if overlay already exists
    let overlay = document.getElementById('terms-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'terms-overlay';
      overlay.className = 'terms-overlay hidden';
      document.body.appendChild(overlay);
    } else {
      // Ensure existing overlay has hidden class
      if (!overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
      }
    }

    this.overlay = overlay;

    // Get localized texts
    const title = Utils.getLocalizedText(this.agreementData.title);
    const paragraphs = this.agreementData.paragraphs.map(p => Utils.getLocalizedText(p));
    const acceptButtonText = Utils.getLocalizedText(this.agreementData.acceptButton.text);
    const declineButtonText = Utils.getLocalizedText(this.agreementData.declineButton.text);

    // Build paragraphs HTML
    const paragraphsHtml = paragraphs
      .map(p => `<p class="terms-text">${p}</p>`)
      .join('');

    // Build optional link (if exists)
    let linkHtml = '';
    if (this.agreementData.link) {
      const linkText = Utils.getLocalizedText(this.agreementData.link.text);
      linkHtml = `
        <a href="${this.agreementData.link.url}" target="_blank" class="tubitak-link">
          <i class="${this.agreementData.link.icon}"></i>
          <strong>${linkText}</strong>
        </a>
      `;
    }

    // Render modal content
    overlay.innerHTML = `
      <div class="terms-overlay-content">
        <div class="terms-header">
          <i class="${this.agreementData.icon} terms-icon"></i>
          <h2 class="terms-title">${title}</h2>
        </div>
        <div class="terms-body">
          ${paragraphsHtml}
          ${linkHtml}
        </div>
        <div class="terms-actions">
          <button type="button" class="terms-accept-btn" id="accept-terms">
            <i class="${this.agreementData.acceptButton.icon}"></i>
            ${acceptButtonText}
          </button>
          <button type="button" class="terms-decline-btn" id="decline-terms">
            <i class="${this.agreementData.declineButton.icon}"></i>
            ${declineButtonText}
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for modal interactions
   */
  setupEventListeners() {
    if (!this.overlay) return;

    const termsContent = this.overlay.querySelector('.terms-overlay-content');
    const acceptBtn = document.getElementById('accept-terms');
    const declineBtn = document.getElementById('decline-terms');

    // Click outside handler - show warning toast and glow modal
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && termsContent) {
        // Glow effect on modal (no reflow)
        if (!termsContent.classList.contains('pulse')) {
          termsContent.classList.add('pulse');
          termsContent.addEventListener('animationend', function handler() {
            termsContent.classList.remove('pulse');
            termsContent.removeEventListener('animationend', handler);
          });
        }
        
        // Show warning toast
        this.showWarningToast();
      }
    });

    // Accept button handler
    if (acceptBtn) {
      acceptBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.acceptAgreement();
      }, { once: true });
    }

    // Decline button handler
    if (declineBtn) {
      declineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.declineAgreement();
      }, { once: true });
    }
  }

  /**
   * Show the modal
   */
  showModal() {
    if (this.overlay) {
      this.overlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide the modal
   */
  hideModal() {
    if (this.overlay) {
      this.overlay.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  /**
   * Handle agreement acceptance
   */
  acceptAgreement() {
    const storageKey = `${this.agreementKey}-accepted`;
    const version = this.agreementData?.version || '1.0';

    // Store acceptance in localStorage with version
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(`${storageKey}-version`, version);
    localStorage.setItem(`${storageKey}-date`, new Date().toISOString());

    this.isAccepted = true;
    this.hideModal();

    console.log(`Agreement accepted: ${this.agreementKey} v${version}`);

    // Add accepted class to body
    document.body.classList.add('terms-accepted');

    // Trigger custom event for other components
    const event = new CustomEvent('agreementAccepted', {
      detail: {
        agreementKey: this.agreementKey,
        version: version
      }
    });
    document.dispatchEvent(event);
  }

  /**
   * Handle agreement decline
   */
  declineAgreement() {
    console.log(`Agreement declined: ${this.agreementKey}`);

    // Trigger custom event before redirect
    const event = new CustomEvent('agreementDeclined', {
      detail: {
        agreementKey: this.agreementKey
      }
    });
    document.dispatchEvent(event);

    // Redirect to homepage or configured decline URL
    const declineUrl = this.agreementData?.declineUrl || 'index.html';
    window.location.href = declineUrl;
  }

  /**
   * Check if agreement is accepted
   */
  isAgreementAccepted() {
    return this.isAccepted;
  }

  /**
   * Clear agreement acceptance (for testing or version updates)
   */
  clearAgreement() {
    if (this.agreementKey) {
      const storageKey = `${this.agreementKey}-accepted`;
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}-version`);
      localStorage.removeItem(`${storageKey}-date`);
      this.isAccepted = false;
      console.log(`Agreement cleared: ${this.agreementKey}`);
    }
  }

  /**
   * Static method to check if a specific agreement is accepted
   */
  static isAccepted(agreementKey) {
    return localStorage.getItem(`${agreementKey}-accepted`) === 'true';
  }

  /**
   * Static method to get agreement acceptance date
   */
  static getAcceptanceDate(agreementKey) {
    return localStorage.getItem(`${agreementKey}-accepted-date`);
  }

  /**
   * Static method to get agreement version
   */
  static getAcceptedVersion(agreementKey) {
    return localStorage.getItem(`${agreementKey}-accepted-version`);
  }

  /**
   * Show warning toast when user tries to close modal
   */
  showWarningToast() {
    // Remove existing toast if any
    const existingToast = document.querySelector('.agreement-warning-toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast element with progress bar
    const toast = document.createElement('div');
    toast.className = 'agreement-warning-toast';
    toast.innerHTML = `
      <i class="bi bi-exclamation-triangle-fill"></i>
      <span>Sayfayı kullanmak için lütfen kullanım şartlarını kabul ediniz</span>
      <div class="toast-progress"></div>
    `;

    document.body.appendChild(toast);

    // Force reflow and show toast
    toast.offsetHeight;
    toast.classList.add('show');

    // Auto hide after 4 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 4000);
  }
}

// Export for use in other modules
export default AgreementModalManager;
