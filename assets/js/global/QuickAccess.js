/**
 * QuickAccess - Unified Quick Navigation Component
 * Adaptive Responsive System: Container-aware breakpoints
 * Modes: Floating Overlay, Fixed Sidebar
 *
 * @version 3.0.0
 * @author Anadolu University Library
 */

import Utils from '../core/utils.js';

export class QuickAccess {
  constructor(config = {}) {
    // Configuration
    this.config = {
      // Mode: 'adaptive' (auto-detect), 'floating', or 'sidebar'
      mode: config.mode || 'adaptive',

      // Container ID (for sidebar mode)
      containerId: config.containerId || null,

      // Main content container ID (for fixed sidebar margin adjustment)
      contentContainerId: config.contentContainerId || 'main-content-container',

      // Data structure
      data: config.data || null,

      // Floating mode options
      initialState: config.initialState || 'expanded', // 'expanded' or 'collapsed'
      title: config.title || 'Hızlı Erişim',
      collapseText: config.collapseText || 'Gizle',
      expandText: config.expandText || 'Göster',
      highlightVisibleSections: config.highlightVisibleSections !== false,
      autoHideOnHelp: config.autoHideOnHelp !== false,

      // Sidebar mode options
      icon: config.icon || 'bi bi-list-ul',

      // Adaptive breakpoints (container-based)
      breakpoints: {
        tablet: config.breakpoints?.tablet || 1100,     // < 1100px
        desktop: config.breakpoints?.desktop || 1100    // >= 1100px
      },

      // Shared options
      categories: config.categories !== false
    };

    // State
    this.element = null;
    this.isInitialized = false;
    this.sectionElements = [];
    this.activeCategory = null;
    this.helpSectionElement = null;
    this.wasAutoCollapsed = false;
    this.pulseAnimationInterval = null;
    this.currentAdaptiveMode = null;
    this.resizeObserver = null;
    this.mainContentContainer = null;
    this.scrollHandlerSetup = false;

    // Bind methods
    this.toggle = this.toggle.bind(this);
    this.handleScroll = this.handleScroll.bind(this);
    this.updateActiveSections = this.updateActiveSections.bind(this);
    this.checkHelpSectionVisibility = this.checkHelpSectionVisibility.bind(this);
    this.startPulseAnimation = this.startPulseAnimation.bind(this);
    this.stopPulseAnimation = this.stopPulseAnimation.bind(this);
    this.handleAdaptiveMode = this.handleAdaptiveMode.bind(this);
    this.updateMainContentMargin = this.updateMainContentMargin.bind(this);
  }

  /**
   * Initialize QuickAccess
   * @param {Object} data - Navigation data
   */
  init(data = null) {
    if (data) {
      this.config.data = data;
    }

    if (!this.config.data || this.isInitialized) return;

    // Auto-detect mode from data if not explicitly set
    if (this.config.mode === 'adaptive' && this.config.data.mode) {
      this.config.mode = this.config.data.mode === 'floating' ? 'adaptive' : this.config.data.mode;
    }

    // Get main content container reference
    this.mainContentContainer = document.getElementById(this.config.contentContainerId);

    // Create the component
    this.createElement();
    this.render();
    this.setupEventListeners();
    this.cacheSectionElements();

    // Setup adaptive mode if enabled
    if (this.config.mode === 'adaptive') {
      this.setupAdaptiveMode();
    }

    this.isInitialized = true;

    // Help section reference
    this.helpSectionElement = document.getElementById('help-container');

    // Initial scroll check
    this.handleScroll();

    // Start pulse animation if collapsed
    if (this.currentAdaptiveMode === 'floating' && this.element.classList.contains('collapsed')) {
      this.startPulseAnimation();
    }
  }

  /**
   * Create the main element
   */
  createElement() {
    // Create element
    this.element = document.createElement('div');

    // For adaptive mode, always append to body (will position based on detected mode)
    // For fixed sidebar mode, append to container
    if (this.config.mode === 'sidebar') {
      const container = document.getElementById(this.config.containerId);
      if (!container) {
        console.error(`QuickAccess: Container #${this.config.containerId} not found`);
        return;
      }
      container.appendChild(this.element);
    } else {
      // Adaptive or floating: append to body
      document.body.appendChild(this.element);
    }

    // Add base class - actual mode class will be set by adaptive system or directly
    this.element.className = `quick-access`;

    // Initial mode class (will be updated by adaptive system)
    if (this.config.mode === 'adaptive') {
      // Adaptive mode will set the class in setupAdaptiveMode
      this.element.classList.add('mode-floating'); // Temporary, will be updated immediately
    } else {
      this.element.classList.add(`mode-${this.config.mode}`);

      // Add collapsed class for floating mode if needed
      if (this.config.mode === 'floating' && this.config.initialState === 'collapsed') {
        this.element.classList.add('collapsed');
      }
    }
  }

  /**
   * Render the component HTML
   */
  render() {
    const data = this.config.data;
    // Use currentAdaptiveMode if set, otherwise use config.mode (but map 'adaptive' to 'floating' as fallback)
    let effectiveMode = this.currentAdaptiveMode || this.config.mode;
    if (effectiveMode === 'adaptive') {
      effectiveMode = 'floating'; // Fallback for initial render before adaptive system kicks in
    }
    let html = '';

    // FLOATING MODE: Icon + Header + Toggle + Nav
    if (effectiveMode === 'floating') {
      html += `
        <div class="quick-access-icon">
          <i class="bi bi-list"></i>
        </div>
        <div class="quick-access-header">
          <h6>${Utils.getLocalizedText(data.title || this.config.title)}</h6>
          <button class="quick-access-toggle" aria-label="${this.config.collapseText}">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <nav class="quick-access-nav"><ul>
      `;

      // Render links with categories
      if (data.groups && this.config.categories) {
        data.groups.forEach(group => {
          html += `
            <li class="quick-access-category" data-category="${Utils.getLocalizedText(group.title)}">
              ${Utils.getLocalizedText(group.title)}
            </li>
          `;
          group.items.forEach(item => {
            html += this.renderLink(item, Utils.getLocalizedText(group.title));
          });
        });
      } else if (data.items) {
        data.items.forEach(item => {
          html += this.renderLink(item);
        });
      }

      html += `</ul></nav>`;
    }
    // SIDEBAR MODE: Header + Nav (no toggle, no icon)
    else if (effectiveMode === 'sidebar') {
      html += `
        <div class="quick-access-header">            <h5>
              <i class="${this.config.icon}"></i>
              ${Utils.getLocalizedText(data.title || this.config.title)}
            </h5>
        </div>
        <nav class="quick-access-nav"><ul>
      `;

      // Render flat links (no categories in sidebar)
      if (data.groups) {
        data.groups.forEach(group => {
          group.items.forEach(item => {
            html += this.renderLink(item);
          });
        });
      } else if (data.items) {
        data.items.forEach(item => {
          html += this.renderLink(item);
        });
      }

      html += `</ul></nav>`;
    }

    this.element.innerHTML = html;
  }

  /**
   * Render a single link
   * @param {Object} item - Link data
   * @param {String} category - Category name (optional)
   */
  renderLink(item, category = null) {
    const iconHtml = item.icon ? `<span class="nav-icon">${item.icon}</span>` : '';
    const dataCategory = category ? `data-category="${category}"` : '';

    return `
      <li>
        <a href="#${item.anchor}"
           class="quick-access-link"
           data-anchor="${item.anchor}"
           ${dataCategory}>
          ${iconHtml}
          <span class="nav-text">${Utils.getLocalizedText(item.text)}</span>
        </a>
      </li>
    `;
  }

  /**
   * Cache section elements for scroll tracking
   */
  cacheSectionElements() {
    this.sectionElements = [];
    const data = this.config.data;

    // Collect all sections
    const items = data.groups
      ? data.groups.flatMap(group => group.items.map(item => ({ ...item, category: Utils.getLocalizedText(group.title) })))
      : data.items.map(item => ({ ...item, category: null }));

    items.forEach(item => {
      const element = document.getElementById(item.anchor);
      if (element) {
        this.sectionElements.push({
          element,
          anchor: item.anchor,
          category: item.category
        });
      }
    });

    // Sort by position (top to bottom)
    this.sectionElements.sort((a, b) => {
      return a.element.offsetTop - b.element.offsetTop;
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    let effectiveMode = this.currentAdaptiveMode || this.config.mode;
    if (effectiveMode === 'adaptive') {
      effectiveMode = 'floating'; // Fallback for initial setup
    }

    // Toggle button (floating mode only)
    if (effectiveMode === 'floating') {
      const toggleBtn = this.element.querySelector('.quick-access-toggle');
      const icon = this.element.querySelector('.quick-access-icon');

      if (toggleBtn) {
        toggleBtn.removeEventListener('click', this.toggle);
        toggleBtn.addEventListener('click', this.toggle);
      }
      if (icon) {
        icon.removeEventListener('click', this.toggle);
        icon.addEventListener('click', this.toggle);
      }
    }

    // Scroll event - only setup once during init (not on mode switch)
    if (!this.scrollHandlerSetup) {
      let ticking = false;
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
      this.scrollHandlerSetup = true;
    }

    // Smooth scroll on link click
    this.element.querySelectorAll('.quick-access-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const anchor = link.getAttribute('data-anchor');
        const targetElement = document.getElementById(anchor);

        if (targetElement) {
          // Scroll to target
          const headerHeight = this.config.mode === 'sidebar' ? 100 : 80;
          const targetPosition = targetElement.offsetTop - headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });

          // Update URL
          history.pushState(null, null, `#${anchor}`);
        }
      });
    });

    // Resize event - recalculate positions
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.cacheSectionElements();
        this.handleScroll();
      }, 250);
    });

    // Sidebar mode: Sticky behavior
    if (this.config.mode === 'sidebar') {
      this.initStickyBehavior();
    }
  }

  /**
   * Toggle collapsed state (floating mode only)
   */
  toggle() {
    if (this.config.mode !== 'floating') return;

    this.element.classList.toggle('collapsed');

    // Update aria label
    const toggleBtn = this.element.querySelector('.quick-access-toggle');
    const isCollapsed = this.element.classList.contains('collapsed');

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label',
        isCollapsed ? this.config.expandText : this.config.collapseText
      );

      // Update icon
      const toggleIcon = toggleBtn.querySelector('i');
      if (toggleIcon) {
        toggleIcon.className = isCollapsed ? 'bi bi-list' : 'bi bi-x-lg';
      }
    }

    // Pulse animation
    if (isCollapsed) {
      this.startPulseAnimation();
    } else {
      this.stopPulseAnimation();
    }
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Check if at bottom
    const isAtBottom = (scrollPosition + windowHeight) >= documentHeight - 50;

    // Auto-hide on help section (floating mode)
    if (this.config.mode === 'floating' && this.config.autoHideOnHelp && this.helpSectionElement) {
      this.checkHelpSectionVisibility();
    }

    // Update active sections
    this.updateActiveSections(scrollPosition, windowHeight, isAtBottom);
  }

  /**
   * Check help section visibility and auto-hide if needed
   */
  checkHelpSectionVisibility() {
    if (!this.helpSectionElement) return;

    const helpRect = this.helpSectionElement.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Is help section visible?
    const isHelpVisible = helpRect.top < windowHeight && helpRect.bottom > 0;

    if (isHelpVisible && !this.element.classList.contains('collapsed')) {
      // Hide QuickAccess
      this.element.classList.add('collapsed');
      this.wasAutoCollapsed = true;
      this.startPulseAnimation();
    } else if (!isHelpVisible && this.wasAutoCollapsed) {
      // Show QuickAccess
      this.element.classList.remove('collapsed');
      this.wasAutoCollapsed = false;
      this.stopPulseAnimation();
    }
  }

  /**
   * Update active sections based on scroll position
   */
  updateActiveSections(scrollPosition, windowHeight, isAtBottom) {
    const visibleSections = [];
    let activeSection = null;
    let activeCategory = null;

    // If at bottom, activate last section
    if (isAtBottom && this.sectionElements.length > 0) {
      const lastSection = this.sectionElements[this.sectionElements.length - 1];
      activeSection = lastSection.anchor;
      activeCategory = lastSection.category;

      // Mark all sections in last category as visible
      this.sectionElements
        .filter(section => section.category === activeCategory)
        .forEach(section => visibleSections.push(section.anchor));
    } else {
      // Find visible sections
      const buffer = 100;

      this.sectionElements.forEach(section => {
        const rect = section.element.getBoundingClientRect();

        // Is element visible in viewport?
        if (rect.top < windowHeight && rect.bottom > 0) {
          visibleSections.push(section.anchor);
        }

        // Active section: closest to top of viewport
        if (rect.top <= buffer && (activeSection === null || rect.top > document.getElementById(activeSection).getBoundingClientRect().top)) {
          activeSection = section.anchor;
          activeCategory = section.category;
        }
      });
    }

    // If no active section found, use first one
    if (activeSection === null && this.sectionElements.length > 0) {
      activeSection = this.sectionElements[0].anchor;
      activeCategory = this.sectionElements[0].category;
    }

    // Update active states in UI
    this.element.querySelectorAll('.quick-access-link').forEach(link => {
      const anchor = link.getAttribute('data-anchor');

      // Remove/add active class
      link.classList.remove('active');
      if (anchor === activeSection) {
        link.classList.add('active');

        // Auto-scroll to active link if not visible
        if (!this.isElementInViewport(link, this.element)) {
          link.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
      }

      // Visible class (if enabled)
      if (this.config.highlightVisibleSections) {
        link.classList.remove('visible');
        if (visibleSections.includes(anchor)) {
          link.classList.add('visible');
        }
      }
    });

    // Update category headers (if categories enabled)
    if (this.config.categories && activeCategory) {
      this.element.querySelectorAll('.quick-access-category').forEach(category => {
        category.classList.remove('active');
      });

      const activeCategoryEl = this.element.querySelector(`.quick-access-category[data-category="${activeCategory}"]`);
      if (activeCategoryEl) {
        activeCategoryEl.classList.add('active');
      }
    }
  }

  /**
   * Check if element is in viewport
   */
  isElementInViewport(element, container) {
    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return (
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom
    );
  }

  /**
   * Start pulse animation (floating mode)
   */
  startPulseAnimation() {
    if (this.config.mode !== 'floating') return;

    this.stopPulseAnimation();

    const iconElement = this.element.querySelector('.quick-access-icon');
    if (!iconElement) return;

    iconElement.classList.add('pulse-animation');

    // Refresh animation every 5 seconds
    this.pulseAnimationInterval = setInterval(() => {
      iconElement.classList.remove('pulse-animation');

      setTimeout(() => {
        if (this.element.classList.contains('collapsed')) {
          iconElement.classList.add('pulse-animation');
        }
      }, 100);
    }, 5000);
  }

  /**
   * Stop pulse animation
   */
  stopPulseAnimation() {
    if (this.pulseAnimationInterval) {
      clearInterval(this.pulseAnimationInterval);
      this.pulseAnimationInterval = null;
    }

    const iconElement = this.element.querySelector('.quick-access-icon');
    if (iconElement) {
      iconElement.classList.remove('pulse-animation');
    }
  }

  /**
   * Initialize sticky behavior (sidebar mode)
   */
  initStickyBehavior() {
    if (this.config.mode !== 'sidebar') return;
    if (!this.element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 1) {
          this.element.classList.add('is-stuck');
        } else {
          this.element.classList.remove('is-stuck');
        }
      },
      { threshold: [1], rootMargin: '-100px 0px 0px 0px' }
    );

    observer.observe(this.element);
  }

  /**
   * Setup adaptive mode with ResizeObserver
   */
  setupAdaptiveMode() {
    if (!this.mainContentContainer) {
      console.warn('QuickAccess: Main content container not found, falling back to window-based detection');
    }

    // Initial mode detection
    this.handleAdaptiveMode();

    // Setup ResizeObserver for container-based detection
    if (this.mainContentContainer && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleAdaptiveMode();
      });
      this.resizeObserver.observe(this.mainContentContainer);
    }

    // Fallback to window resize
    window.addEventListener('resize', this.handleAdaptiveMode);
  }

  /**
   * Handle adaptive mode changes based on container width
   */
  handleAdaptiveMode() {
    const viewportWidth = window.innerWidth;
    let containerWidth = viewportWidth;

    // Get container width if available
    if (this.mainContentContainer) {
      containerWidth = this.mainContentContainer.offsetWidth;
    }

    // Determine mode based on breakpoints
    let newMode = 'floating';

    // Desktop fixed sidebar mode: container >= 1100px
    if (containerWidth >= this.config.breakpoints.desktop) {
      newMode = 'sidebar';
    }
    // Floating overlay mode: < 1100px
    else {
      newMode = 'floating';
    }

    // Only update if mode changed
    if (newMode !== this.currentAdaptiveMode) {
      this.currentAdaptiveMode = newMode;
      this.switchMode(newMode);
    }
  }

  /**
   * Switch between modes
   * @param {String} newMode - 'floating' or 'sidebar'
   */
  switchMode(newMode) {
    if (!this.element) return;

    const previousMode = this.currentAdaptiveMode;

    // Remove all mode classes
    this.element.classList.remove('mode-floating', 'mode-sidebar', 'collapsed');

    // Add new mode class
    this.element.className = `quick-access mode-${newMode}`;

    // Always re-render when switching modes (structure differs between modes)
    this.render();

    // Re-setup event listeners (different for each mode)
    this.setupEventListeners();

    // Update main content margin for sidebar mode
    this.updateMainContentMargin(newMode);

    // Stop animations when switching modes
    this.stopPulseAnimation();

    // Log mode change for debugging
    console.log(`QuickAccess: Switched from ${previousMode || 'initial'} to ${newMode} mode`);
  }

  /**
   * Update main content container margin for fixed sidebar mode
   * @param {String} mode - Current mode
   */
  updateMainContentMargin(mode) {
    if (!this.mainContentContainer) return;

    if (mode === 'sidebar' && this.element) {
      // Calculate sidebar width + gap
      const sidebarWidth = this.element.offsetWidth || 280;
      const gap = 24; // Standard gap
      this.mainContentContainer.style.marginRight = `${sidebarWidth + gap}px`;
      this.mainContentContainer.style.transition = 'margin-right 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      // Reset margin for other modes
      this.mainContentContainer.style.marginRight = '';
    }
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (!this.isInitialized) return;

    this.stopPulseAnimation();

    // Disconnect ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove window resize listener
    window.removeEventListener('resize', this.handleAdaptiveMode);

    // Reset main content margin
    if (this.mainContentContainer) {
      this.mainContentContainer.style.marginRight = '';
    }

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.isInitialized = false;
  }
}

// Global export
export default QuickAccess;
