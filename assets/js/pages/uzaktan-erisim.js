/**
 * Anadolu Üniversitesi Kütüphane - Uzaktan Erişim Rehberi
 * Adım adım görsel rehber sayfası
 */

import { InnerPage } from './inner.js';
import Utils from '../core/utils.js';

export class UzaktanErisimPage extends InnerPage {
  constructor(app) {
    super(app, 'uzaktan-erisim');
  }

  async init() {
    await super.init();

    // Özel işlevler
    this.setupImageLightbox();
    this.setupStepAnimations();

    Utils.log('UzaktanErisimPage fully initialized');
  }

  /**
   * Resimlere tıklanınca büyük gösterim (lightbox efekti)
   */
  setupImageLightbox() {
    const images = document.querySelectorAll('.step-guide-image img');

    images.forEach(img => {
      // Resim yüklendiğinde loading placeholder'ı kaldır
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      });

      // Resim hata verirse placeholder göster
      img.addEventListener('error', () => {
        img.classList.add('error');
        const container = img.closest('.step-guide-image');
        if (container) {
          container.classList.add('image-error');
        }
      });

      // Tıklanınca lightbox aç
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        this.openLightbox(img.src, img.alt);
      });
    });
  }

  /**
   * Lightbox açma fonksiyonu
   */
  openLightbox(imageSrc, imageAlt) {
    // Lightbox HTML'i oluştur
    const lightbox = document.createElement('div');
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
      <div class="lightbox-overlay"></div>
      <div class="lightbox-content">
        <button class="lightbox-close" aria-label="Kapat">
          <i class="bi bi-x-lg"></i>
        </button>
        <img src="${imageSrc}" alt="${imageAlt}">
        <div class="lightbox-caption">${imageAlt}</div>
      </div>
    `;

    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    // Animasyonlu açılış
    requestAnimationFrame(() => {
      lightbox.classList.add('active');
    });

    // Kapatma event'leri
    const closeLightbox = () => {
      lightbox.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
      }, 300);
    };

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-overlay').addEventListener('click', closeLightbox);

    // ESC tuşu ile kapatma
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
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
    const images = document.querySelectorAll('.step-guide-image img');
    images.forEach(img => {
      img.replaceWith(img.cloneNode(true));
    });

    Utils.log('UzaktanErisimPage destroyed');
  }
}
