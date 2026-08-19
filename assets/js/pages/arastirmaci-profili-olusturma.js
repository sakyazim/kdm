/**
 * Anadolu Üniversitesi Kütüphane - Araştırmacı Profili Oluşturma Sayfası
 * Ortak bileşen sistemiyle (ComponentRenderer) ve Hybrid TOC ile
 */

import Utils from '../core/utils.js';
import { HeroManager } from '../components/hero.js';
import { HelpSectionManager } from '../components/helpsection.js';
import HybridTOC from '../components/hybrid-toc.js';
import { ComponentRenderer } from '../components/inner-page-components.js';

export class ArastirmaciProfiliOlusturmaPage {
  constructor(app) {
    this.app = app;
    this.pageData = null;
    this.heroManager = new HeroManager();
    this.helpSectionManager = new HelpSectionManager();
  }

  async init() {
    Utils.log('ArastirmaciProfiliOlusturmaPage initializing...');

    this.pageData = await this.app.loadPageData('arastirmaci-profili-olusturma');

    if (this.pageData) {
      if (this.pageData.hero) {
        await this.heroManager.init(this.pageData.hero);
      }

      if (this.pageData.toc && this.pageData.toc.enabled) {
        HybridTOC.init(this.pageData.toc);
      }

      if (this.pageData.content) {
        this.renderContent(this.pageData.content);
      }

      if (this.pageData.helpSection) {
        await this.helpSectionManager.init(this.pageData.helpSection);
      }
    }

    Utils.log('ArastirmaciProfiliOlusturmaPage initialized');
  }

  renderContent(contentSections) {
    const container = document.getElementById('researcher-profile-content');
    if (!container) return;

    container.innerHTML = ComponentRenderer.buildSectionCards(contentSections);
  }

  async updateLanguage() {
    Utils.log('Updating ArastirmaciProfiliOlusturmaPage language...');

    await this.init();
  }

  destroy() {
    Utils.log('Destroying ArastirmaciProfiliOlusturmaPage...');

    if (HybridTOC) {
      HybridTOC.destroy();
    }

    const container = document.getElementById('researcher-profile-content');
    if (container) {
      container.innerHTML = '';
    }
  }
}

export default ArastirmaciProfiliOlusturmaPage;