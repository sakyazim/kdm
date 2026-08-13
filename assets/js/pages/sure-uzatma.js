/**
 * Anadolu Üniversitesi Kütüphane - Ödünç Süre Uzatma Rehberi
 * Bilgilendirme ve yönlendirme sayfası
 */

import { InnerPage } from './inner.js';
import Utils from '../core/utils.js';

export class SureUzatmaPage extends InnerPage {
  constructor(app) {
    super(app, 'sure-uzatma');
  }

  async init() {
    await super.init();

    // Özel işlevler
    this.setupExternalLinks();
    this.setupStepAnimations();

    Utils.log('SureUzatmaPage fully initialized');
  }

  /**
   * Dış bağlantılara özel işaretler ve davranışlar ekle
   */
  setupExternalLinks() {
    // Sadece içerik alanındaki external linklere icon ekle (footer hariç)
    const contentArea = document.querySelector('#main-content-container');
    if (!contentArea) return;

    const externalLinks = contentArea.querySelectorAll('a[target="_blank"]');

    externalLinks.forEach(link => {
      // External link iconunu ekle (eğer yoksa)
      if (!link.querySelector('.external-icon')) {
        const icon = document.createElement('i');
        icon.className = 'bi bi-box-arrow-up-right external-icon ms-1';
        link.appendChild(icon);
      }

      // Güvenlik için rel attribute ekle
      if (!link.getAttribute('rel')) {
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  /**
   * Adım kartlarına scroll animasyonu ekle
   */
  setupStepAnimations() {
    const stepCards = document.querySelectorAll('.step-card');

    if (!stepCards.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    stepCards.forEach(card => {
      observer.observe(card);
    });
  }

  /**
   * Sayfa temizlenirken
   */
  destroy() {
    // Event listener'ları temizle
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    externalLinks.forEach(link => {
      link.replaceWith(link.cloneNode(true));
    });

    Utils.log('SureUzatmaPage destroyed');
  }
}
