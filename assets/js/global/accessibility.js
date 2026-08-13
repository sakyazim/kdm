/**
 * ACCESSIBILITY WIDGET v2.1
 * With Big Widget & Active Indicator
 */

(function() {
  'use strict';

  function initWidget() {
    console.log('🚀 Accessibility Widget v2.1 initializing...');

    // Get elements
    const trigger = document.getElementById('accessibilityTrigger') || document.getElementById('accessibility-btn');
    const panel = document.getElementById('accessibilityPanel');
    const overlay = document.getElementById('accessibilityOverlay');
    const closeBtn = document.getElementById('accessibilityClose');
    const resetBtn = document.getElementById('accessibilityReset');
    const options = document.querySelectorAll('.accessibility-option');
    const langButtons = document.querySelectorAll('.lang-btn');
    const titleElement = document.getElementById('accessibilityTitle');

    if (!trigger) {
      console.error('❌ Accessibility trigger button not found!');
      return;
    }

    if (!panel) {
      console.error('❌ Accessibility panel not found!');
      return;
    }

    console.log('✅ Widget elements found');

    // State
    let currentLang = 'tr';
    let isBigWidget = false;
    let features = {
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

    // Translations
    const translations = {
      tr: {
        title: 'Erişilebilirlik Menüsü',
        subtitle: '(CTRL+U)',
        contrast: 'Kontrast +',
        highlightLinks: 'Bağlant. Vurgula',
        bigText: 'Büyük Metin',
        textSpacing: 'Metin Boşluğu',
        stopAnimations: 'Animasyonları Durdur',
        hideImages: 'Resimleri Gizle',
        dyslexiaFont: 'Disleksi Dostu',
        bigCursor: 'İmleç',
        readingGuide: 'Okuma Rehberi',
        lineHeight: 'Satır yüksekliği',
        textAlign: 'Metin hizalama',
        saturation: 'Doygunluk',
        bigWidget: 'Büyük Widget',
        reset: 'Tüm Erişilebilirlik Ayarlarını Sıfırla'
      },
      en: {
        title: 'Accessibility Menu',
        subtitle: '(CTRL+U)',
        contrast: 'Contrast +',
        highlightLinks: 'Highlight Links',
        bigText: 'Big Text',
        textSpacing: 'Text Spacing',
        stopAnimations: 'Stop Animations',
        hideImages: 'Hide Images',
        dyslexiaFont: 'Dyslexia Font',
        bigCursor: 'Cursor',
        readingGuide: 'Reading Guide',
        lineHeight: 'Line Height',
        textAlign: 'Text Align',
        saturation: 'Saturation',
        bigWidget: 'Big Widget',
        reset: 'Reset All Accessibility Settings'
      }
    };

    // Feature Map
    const featureMap = {
      'contrast': 'contrast',
      'highlight-links': 'highlightLinks',
      'big-text': 'bigText',
      'text-spacing': 'textSpacing',
      'stop-animations': 'stopAnimations',
      'hide-images': 'hideImages',
      'dyslexia-font': 'dyslexiaFont',
      'big-cursor': 'bigCursor',
      'reading-guide': 'readingGuide',
      'line-height': 'lineHeight',
      'text-align': 'textAlign',
      'saturation': 'saturation',
      'big-widget': 'bigWidget'
    };

    // Update Active Indicator
    function updateActiveIndicator() {
      let hasActive = false;

      for (let key in features) {
        if (key === 'big-text') {
          if (features[key] > 0) hasActive = true;
        } else if (features[key] === true) {
          hasActive = true;
        }
      }

      if (isBigWidget) hasActive = true;

      if (hasActive) {
        trigger.classList.add('has-active-features');
      } else {
        trigger.classList.remove('has-active-features');
      }
    }

    // Toggle Panel
    function togglePanel() {
      const isActive = panel.classList.contains('active');

      if (isActive) {
        panel.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        console.log('❌ Panel CLOSED');
      } else {
        panel.classList.add('active');
        if (overlay) overlay.classList.add('active');
        console.log('✅ Panel OPENED');
      }
    }

    function closePanel() {
      panel.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      console.log('❌ Panel CLOSED');
    }

    // Apply Feature
    function applyFeature(feature, enabled) {
      const className = 'accessibility-' + feature;

      if (enabled) {
        document.body.classList.add(className);

        if (feature === 'reading-guide') {
          activateReadingGuide();
        }
      } else {
        document.body.classList.remove(className);

        if (feature === 'reading-guide') {
          deactivateReadingGuide();
        }
      }
    }

    // Reading Guide
    let readingGuideLine = null;
    let mouseMoveHandler = null;

    function activateReadingGuide() {
      if (readingGuideLine) return;

      readingGuideLine = document.createElement('div');
      readingGuideLine.className = 'reading-guide-line';
      document.body.appendChild(readingGuideLine);

      mouseMoveHandler = function(e) {
        readingGuideLine.style.top = e.clientY + 'px';
      };

      document.addEventListener('mousemove', mouseMoveHandler);
    }

    function deactivateReadingGuide() {
      if (!readingGuideLine) return;

      readingGuideLine.remove();
      readingGuideLine = null;

      if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
      }
    }

    // Toggle Big Widget
    function toggleBigWidget() {
      isBigWidget = !isBigWidget;

      if (isBigWidget) {
        panel.classList.add('big-widget');
      } else {
        panel.classList.remove('big-widget');
      }

      updateActiveIndicator();
      saveSettings();
    }

    // Toggle Feature
    function toggleFeature(feature, optionElement) {
      if (feature === 'big-widget') {
        toggleBigWidget();
        optionElement.classList.toggle('active', isBigWidget);
        return;
      }

      if (feature === 'big-text') {
        features[feature] = (features[feature] + 1) % 3;

        document.body.classList.remove('accessibility-big-text-1', 'accessibility-big-text-2');

        if (features[feature] === 1) {
          document.body.classList.add('accessibility-big-text-1');
          optionElement.classList.add('active');
          optionElement.setAttribute('data-level', '1');
        } else if (features[feature] === 2) {
          document.body.classList.add('accessibility-big-text-2');
          optionElement.classList.add('active');
          optionElement.setAttribute('data-level', '2');
        } else {
          optionElement.classList.remove('active');
          optionElement.removeAttribute('data-level');
        }
      } else {
        features[feature] = !features[feature];

        if (features[feature]) {
          optionElement.classList.add('active');
        } else {
          optionElement.classList.remove('active');
        }

        applyFeature(feature, features[feature]);
      }

      updateActiveIndicator();
      saveSettings();
      console.log('🔧 Feature toggled:', feature, features[feature]);
    }

    // Reset All
    function resetAll() {
      Object.keys(features).forEach(function(feature) {
        if (feature === 'big-text') {
          features[feature] = 0;
          document.body.classList.remove('accessibility-big-text-1', 'accessibility-big-text-2');

          const option = document.querySelector('[data-feature="' + feature + '"]');
          if (option) {
            option.classList.remove('active');
            option.removeAttribute('data-level');
          }
        } else {
          features[feature] = false;
          applyFeature(feature, false);

          const option = document.querySelector('[data-feature="' + feature + '"]');
          if (option) {
            option.classList.remove('active');
          }
        }
      });

      // Reset big widget
      isBigWidget = false;
      panel.classList.remove('big-widget');
      const bigWidgetOption = document.querySelector('[data-feature="big-widget"]');
      if (bigWidgetOption) {
        bigWidgetOption.classList.remove('active');
      }

      updateActiveIndicator();
      saveSettings();
      console.log('🔄 All features reset');

      // Visual feedback
      const originalHTML = resetBtn.innerHTML;
      resetBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i> ' +
        (currentLang === 'tr' ? 'Sıfırlandı!' : 'Reset!');
      resetBtn.style.background = '#d4edda';

      setTimeout(function() {
        resetBtn.innerHTML = originalHTML;
        resetBtn.style.background = '';
      }, 2000);
    }

    // Update Language UI
    function updateLanguageUI() {
      const t = translations[currentLang];

      if (titleElement) {
        titleElement.innerHTML = t.title + '<br><small style="font-size: 12px; opacity: 0.9;">' + t.subtitle + '</small>';
      }

      // Update all option labels
      options.forEach(function(option) {
        const feature = option.getAttribute('data-feature');
        const translationKey = featureMap[feature];
        if (translationKey && t[translationKey]) {
          const span = option.querySelector('span');
          if (span) {
            span.textContent = t[translationKey];
          }
        }
      });

      // Update reset button
      if (resetBtn) {
        resetBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> ' + t.reset;
      }
    }

    // Change Language
    function changeLanguage(lang) {
      currentLang = lang;

      langButtons.forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      });

      updateLanguageUI();
      saveSettings();
      console.log('🌐 Language changed to:', lang);
    }

    // Save Settings
    function saveSettings() {
      try {
        localStorage.setItem('accessibility-settings', JSON.stringify({
          features: features,
          lang: currentLang,
          bigWidget: isBigWidget
        }));
      } catch (e) {
        console.error('Cannot save settings:', e);
      }
    }

    // Load Settings
    function loadSettings() {
      try {
        const saved = localStorage.getItem('accessibility-settings');
        if (saved) {
          const settings = JSON.parse(saved);
          features = Object.assign({}, features, settings.features);
          currentLang = settings.lang || 'tr';
          isBigWidget = settings.bigWidget || false;

          // Apply big widget
          if (isBigWidget) {
            panel.classList.add('big-widget');
            const bigWidgetOption = document.querySelector('[data-feature="big-widget"]');
            if (bigWidgetOption) {
              bigWidgetOption.classList.add('active');
            }
          }

          // Apply saved features
          Object.keys(features).forEach(function(feature) {
            const option = document.querySelector('[data-feature="' + feature + '"]');

            if (feature === 'big-text') {
              const level = features[feature];
              if (level > 0) {
                document.body.classList.add('accessibility-big-text-' + level);
                if (option) {
                  option.classList.add('active');
                  option.setAttribute('data-level', level);
                }
              }
            } else if (features[feature]) {
              if (option) {
                option.classList.add('active');
              }
              applyFeature(feature, true);
            }
          });

          // Update language UI
          langButtons.forEach(function(btn) {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
          });

          updateLanguageUI();
          updateActiveIndicator();
        }
      } catch (e) {
        console.error('Cannot load settings:', e);
      }
    }

    // Event Listeners
    trigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
      });
    }

    // Prevent panel clicks from closing
    panel.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Feature options
    options.forEach(function(option) {
      option.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const feature = option.getAttribute('data-feature');
        toggleFeature(feature, option);
      });
    });

    // Reset button
    if (resetBtn) {
      resetBtn.addEventListener('click', function(e) {
        e.preventDefault();
        resetAll();
      });
    }

    // Language buttons
    langButtons.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        const lang = btn.getAttribute('data-lang');
        changeLanguage(lang);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        togglePanel();
      }

      if (e.key === 'Escape' && panel.classList.contains('active')) {
        closePanel();
      }
    });

    // Load saved settings
    loadSettings();

    console.log('✅ Accessibility Widget v2.1 initialized successfully!');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

})();
