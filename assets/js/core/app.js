/**
 * Anadolu Üniversitesi Kütüphane - Main Application
 * Ana uygulama sınıfı - tüm bileşenleri yönetir
 */

import AppConfig from './config.js';
import Utils from './utils.js';
import { LanguageManager } from './language-manager.js';
import MetaManager from './seo.js';
import { ThemeManager } from '../components/theme.js';
import { TooltipManager } from '../components/tooltip.js';
import { HeaderManager } from '../components/header.js';
import { FooterManager } from '../components/footer.js';
import { QuickActionsManager } from '../components/quickactions.js';
import { AccessibilityManager } from '../components/accessibility.js';
import { BackToTopManager } from '../components/backtotop.js';
import { AgreementModalManager } from '../components/agreement-modal.js';
import { MobileBottomBar } from '../components/mobile-bottom-bar.js';
import { QuickAccess } from '../global/QuickAccess.js';
import { HomePage } from '../pages/home.js';
import { SSSPage } from '../pages/sss.js';
import { VeritabanlariPage } from '../pages/veritabanlari.js';
import { TarihceGenelBilgilerPage } from '../pages/tarihce-genel-bilgiler.js';
import { BilgisayarLaboratuvariPage } from '../pages/bilgisayar-laboratuvari.js';
import { CalismaOdalariPage } from '../pages/calisma-odalari.js';
import { PersonelPage } from '../pages/personel.js';
import { ILLPage } from '../pages/ill.js';
import { KutuphaneKurallariPage } from '../pages/kutuphane-kurallari.js';
import { MakaleIslemUcretleriPage } from '../pages/makale-islem-ucretleri.js';
import { MendeleyReferansYonetimAraciPage } from '../pages/mendeley-referans-yonetim-araci.js';
import { ArastirmaciProfiliOlusturmaPage } from '../pages/arastirmaci-profili-olusturma.js';
import { UyelikOduncIslemleriPage } from '../pages/uyelik-odunc-islemleri.js';
import {
  ArastirmaBirimleriPage,
  ArastirmaMevzuatiPage,
  ArastirmaDuyurulariPage,
  ArastirmalardenHaberlerPage
} from '../pages/anadolu-arastirma.js';
import { EgitimProgramlariPage } from '../pages/egitim-programlari.js';
import { CalismaSaatleriPage } from '../pages/calisma-saatleri.js';
import { KimeSormaliyimPage } from '../pages/kime-sormaliyim.js';
import { IletisimPage } from '../pages/iletisim.js';
import { OrganizasyonSemasiPage } from '../pages/organizasyon-semasi.js';
import { GuncelHaberlerPage } from '../pages/guncel-haberler.js';
import { DuyurularPage } from '../pages/duyurular.js';
import { UzaktanErisimPage } from '../pages/uzaktan-erisim.js';
import { SureUzatmaPage } from '../pages/sure-uzatma.js';
import { InnerPage } from '../pages/inner.js';
import { IstatistiklerVeRaporlarPage } from '../pages/istatistikler-ve-raporlar.js';

export class LibraryApp {
  constructor() {
    this.config = AppConfig;
    this.data = {
      header: null,
      collections: null,
      services: null,
      news: null,
      announcements: null,
      arrivals: null,
      footer: null,
      modal: null,
      settings: null,
      quickActions: null,
      accessibility: null
    };

    // Component managers
    this.themeManager = null;
    this.tooltipManager = null;
    this.headerManager = null;
    this.footerManager = null;
    this.quickActionsManager = null;
    this.accessibilityManager = null;
    this.agreementModalManager = null;
    this.mobileBottomBar = null;
    this.quickAccess = null;    // Page instance
    this.currentPage = null;

    // SEO meta yönetimi
    this.seo = new MetaManager(this);
    

    // Page info
    this.pageInfo = Utils.getPageInfo();
    
    this.init();
  }

  /**
   * Uygulamayı başlat
   */
  async init() {
    try {
      console.log('LibraryApp initializing...', this.pageInfo);
      
      // Global verileri yükle
      await this.loadGlobalData();
      
      // DOM hazır mı kontrol et
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.setupApp());
      } else {
        this.setupApp();
      }
    } catch (error) {
      console.error('LibraryApp initialization failed:', error);
      this.loadFallbackData();
      this.setupApp();
    }
  }

  /**
   * Global verileri yükle (her sayfada kullanılan)
   * YENİ YAKLASIM: Dil uzantısız dosyayı yükle (içinde çoklu dil var)
   */
  async loadGlobalData() {
    const globalFiles = ['header', 'footer', 'settings', 'quickActions', 'accessibility'];

    const loadPromises = globalFiles.map(async (key) => {
      try {
        const fileName = this.config.dataFiles[key];

        // YENİ: Dil uzantısız dosyayı yükle (içinde çoklu dil var)
        const response = await fetch(`${this.config.jsonPath}global/${fileName}`);
        if (response.ok) {
          this.data[key] = await response.json();
          console.log(`${fileName} loaded successfully (multi-lang)`);
        } else {
          console.warn(`${fileName} could not be loaded (${response.status})`);
        }
      } catch (error) {
        console.warn(`Error loading ${key}.json:`, error.message);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Sayfa özel verileri yükle
   * YENİ YAKLASIM: Dil uzantısız dosyayı yükle (içinde çoklu dil var)
   * @param {string} pageName - Sayfa adı
   * @returns {Promise<Object>} Sayfa verisi
   */
  async loadPageData(pageName) {
    try {
      // ÖZEL DURUM: anadolu-universitesi-arastirma* sayfaları için tek JSON dosyası
      let fileName = `${pageName}.json`;
      let sectionKey = null;

      // Mapping: HTML page name → JSON section key
      const pageToSection = {
        'anadolu-universitesi-arastirma-birimleri': 'arastirma_birimleri',
        'anadolu-universitesi-arastirma-mevzuati': 'arastirma_mevzuati',
        'anadolu-universitesi-arastirma-duyurulari': 'arastirma_duyurulari',
        'anadolu-universitesi-arastirmalardan-haberler': 'arastirmalardan_haberler'
      };

      if (pageToSection[pageName]) {
        sectionKey = pageToSection[pageName];
        fileName = 'anadolu-arastirma.json'; // Hepsi için tek dosya
      }

      // YENİ: Dil uzantısız dosyayı yükle (içinde çoklu dil var)
      const response = await fetch(`${this.config.jsonPath}pages/${fileName}`);

      if (response.ok) {
        let pageData = await response.json();

        // Eğer section key varsa, o section'ı al
        if (sectionKey && pageData[sectionKey]) {
          pageData = pageData[sectionKey];
          console.log(`${fileName} → [${sectionKey}] loaded successfully (multi-lang)`, pageData);
        } else {
          console.log(`${fileName} loaded successfully (multi-lang)`, pageData);
        }

        // SEO meta etiketlerini sayfa verisinden uygula (title, OG, canonical, JSON-LD...)
        try {
          this.seo.apply(pageData, this.pageInfo);
        } catch (e) {
          console.warn('SEO meta uygulanamadı:', e.message);
        }

        // QuickAccess otomatik başlatma
        this.initQuickAccess(pageData);

        return pageData;
      } else {
        console.warn(`${fileName} could not be loaded (${response.status})`);
        return null;
      }
    } catch (error) {
      console.warn(`Error loading ${pageName}.json:`, error.message);
      return null;
    }
  }

  /**
   * QuickAccess bileşenini başlat (varsa)
   * @param {Object} pageData - Sayfa verisi
   */
  initQuickAccess(pageData) {
    // Eğer sayfa verisinde quickNav varsa
    if (pageData && pageData.quickNav) {
      console.log('🚀 QuickAccess initializing...', pageData.quickNav);

      // Mevcut instance'ı temizle
      if (this.quickAccess) {
        this.quickAccess.destroy();
      }

      // Determine mode: use 'adaptive' for floating, keep others as-is
      const mode = pageData.quickNav.mode === 'floating' ? 'adaptive' : pageData.quickNav.mode;

      // Yeni instance oluştur
      this.quickAccess = new QuickAccess({
        data: pageData.quickNav,
        mode: mode,
        containerId: pageData.quickNav.containerId || 'quick-access-container',
        contentContainerId: 'main-content-container', // For fixed sidebar margin adjustment
        title: pageData.quickNav.title || 'Hızlı Erişim',
        categories: pageData.quickNav.mode === 'floating',
        breakpoints: {
          mobile: 700,   // < 700px container or < 768px viewport → mobile
          tablet: 1100,  // 700-1099px → floating
          desktop: 1100  // >= 1100px → fixed sidebar
        }
      });

      // Başlat
      this.quickAccess.init();

      console.log('✅ QuickAccess initialized successfully');
    }
  }

  /**
   * İçerik verilerini yükle (news, announcements, arrivals vs.)
   * @param {Array<string>} contentTypes - Yüklenecek içerik tipleri
   */
  async loadContentData(contentTypes) {
    const loadPromises = contentTypes.map(async (key) => {
      try {
        // home.json sections.<key>.dataSource ayarı varsa onu kullan, yoksa config fallback
        const dataSource = this.data.homeSettings?.sections?.[key]?.dataSource
          || `${this.config.jsonPath}content/${this.config.dataFiles[key]}`;
        const response = await fetch(dataSource);
        if (response.ok) {
          this.data[key] = await response.json();
          console.log(`${key}.json loaded successfully`);
        } else {
          console.warn(`${key}.json yüklenemedi (${dataSource}): ${response.status}`);
        }
      } catch (error) {
        console.warn(`Error loading ${key}.json:`, error.message);
      }
    });

    await Promise.all(loadPromises);
  }

  /**
   * Fallback verilerini yükle
   */
  loadFallbackData() {
    // Minimal fallback data
    this.data.header = { navigation: [] };
    this.data.footer = { columns: [] };
    this.data.settings = { theme: 'light' };
  }

  /**
   * Uygulamayı kur
   */
  async setupApp() {
    try {
      // Component managers
      this.themeManager = new ThemeManager();
      this.tooltipManager = new TooltipManager();
      this.headerManager = new HeaderManager();
      this.footerManager = new FooterManager();
      this.quickActionsManager = new QuickActionsManager(this);
      this.accessibilityManager = new AccessibilityManager();
  this.backToTopManager = new BackToTopManager();

      // Header ve Footer'ı başlat
      await this.headerManager.init(this.data.header);
      await this.footerManager.init(this.data.footer);

      // Mobile Bottom Bar'ı başlat (footer data'yı kullanır)
      this.mobileBottomBar = new MobileBottomBar();
      await this.mobileBottomBar.init(this.data.footer);

      // Tooltip'leri başlat
      this.tooltipManager.init();

      // Quick Actions'ı başlat
      console.log('🔍 Quick Actions data before init:', this.data.quickActions);
      this.quickActionsManager.init(this.data.quickActions);

      // Accessibility Widget'ı başlat
      await this.accessibilityManager.init(this.data.accessibility);

      // Agreement Modal System'i başlat (if page requires it)
      this.agreementModalManager = new AgreementModalManager();
      await this.agreementModalManager.init();

  // Ensure back-to-top button exists before scroll features wire up
  this.backToTopManager.init();

      // Scroll features (back to top + footer detection)
      this.setupScrollFeatures();

      // Sayfa tipine göre route et
      await this.routePage();

      console.log('LibraryApp setup completed');
    } catch (error) {
      console.error('LibraryApp setup failed:', error);
    }
  }

  /**
   * Sayfa routing mantığı
   */
  async routePage() {
    const pageType = this.pageInfo.type;
    const pageName = this.pageInfo.name;

    console.log(`Routing page: ${pageType}/${pageName}`);

    switch (pageType) {
      case 'home':
        await this.initHomePage();
        break;

      case 'inner':
        await this.initInnerPage(pageName);
        break;

      default:
        console.warn(`Unknown page type: ${pageType}`);
        break;
    }

    // SEO: sayfa verisi yüklendikten sonra meta etiketlerini uygula (title, OG, JSON-LD...)
    try {
      const pd = pageType === 'home' ? this.data.homeSettings : (this.currentPage?.pageData || null);
      if (pd) this.seo.apply(pd, this.pageInfo);
    } catch (e) {
      console.warn('SEO meta uygulanamadı:', e.message);
    }
  }

  /**
   * Ana sayfayı başlat
   */
  async initHomePage() {
    // home.json'u yükle (section başlıkları ve ayarlar için)
    const homeData = await this.loadPageData('home');
    if (homeData) {
      this.data.homeSettings = homeData;
    }

    // Ana sayfa için gereken içerikleri yükle (announcements'ı kaldırdık, duyurular.json'dan yüklenecek)
    await this.loadContentData(['collections', 'services', 'arrivals', 'modal']);

    // Haberler için özel yükleme (güncel-haberler.json'dan newsItems)
    await this.loadNewsFromGuncelHaberler();

    // Duyurular HomePage tarafından featured filtresiyle yüklenir
    // (eski loadAnnouncementsFromDuyurular: showInSlider alanı veride yoktu,
    // her zaman 0 kayıt dönüyordu ve duyurular.json iki kez çekiliyordu — kaldırıldı)

    // HomePage instance oluştur ve başlat
    this.currentPage = new HomePage(this);
    await this.currentPage.init();
  }

  /**
   * Güncel haberler sayfasından haber verilerini yükle
   */
  async loadNewsFromGuncelHaberler() {
    try {
      // Veri kaynağını home.json'dan al (sections.news.dataSource), fallback: varsayılan
      const dataSource = this.data.homeSettings?.sections?.news?.dataSource
        || 'data/pages/guncel-haberler.json';
      const response = await fetch(dataSource);
      if (response.ok) {
        const data = await response.json();
        this.data.news = data.newsItems || [];
        // Kategori tanımları da saklanır — renkler tek kaynaktan (kategori rengi) türetilir
        this.data.newsCategories = data.content?.[0]?.components?.[0]?.data?.categories || [];
        console.log('News loaded from guncel-haberler.json successfully');
      }
    } catch (error) {
      console.warn('Error loading news from guncel-haberler.json:', error.message);
      this.data.news = [];
    }
  }

  /**
   * İç sayfaları başlat
   */
  async initInnerPage(pageName) {
    // Sayfa tipine göre özel sınıf kullan
    switch (pageName) {
      case 'sss':
        this.currentPage = new SSSPage(this);
        break;

      case 'tarihce-genel-bilgiler':
        this.currentPage = new TarihceGenelBilgilerPage(this);
        break;

      case 'veritabanlari':
        this.currentPage = new VeritabanlariPage(this);
        break;

      case 'bilgisayar-laboratuvari':
        this.currentPage = new BilgisayarLaboratuvariPage(this);
        break;

      case 'calisma-odalari':
        this.currentPage = new CalismaOdalariPage(this);
        break;

      case 'personel':
        this.currentPage = new PersonelPage(this);
        break;

      case 'ill':
        this.currentPage = new ILLPage(this);
        break;

      case 'kutuphane-kurallari':
        this.currentPage = new KutuphaneKurallariPage(this);
        break;

      case 'makale-islem-ucretleri':
        this.currentPage = new MakaleIslemUcretleriPage(this);
        break;

      case 'mendeley-referans-yonetim-araci':
        this.currentPage = new MendeleyReferansYonetimAraciPage(this);
        break;

      case 'arastirmaci-profili-olusturma':
        this.currentPage = new ArastirmaciProfiliOlusturmaPage(this);
        break;

      case 'uyelik-odunc-islemleri':
        this.currentPage = new UyelikOduncIslemleriPage(this);
        break;

      case 'anadolu-universitesi-arastirma-mevzuati':
        this.currentPage = new ArastirmaMevzuatiPage(this);
        break;

      case 'anadolu-universitesi-arastirma-birimleri':
        this.currentPage = new ArastirmaBirimleriPage(this);
        break;

      case 'anadolu-universitesi-arastirma-duyurulari':
        this.currentPage = new ArastirmaDuyurulariPage(this);
        break;

      case 'anadolu-universitesi-arastirmalardan-haberler':
        this.currentPage = new ArastirmalardenHaberlerPage(this);
        break;

      case 'egitim-programlari':
        this.currentPage = new EgitimProgramlariPage(this);
        break;

      case 'calisma-saatleri':
        this.currentPage = new CalismaSaatleriPage(this);
        break;

      case 'kime-sormaliyim':
        this.currentPage = new KimeSormaliyimPage(this);
        break;

      case 'iletisim':
        this.currentPage = new IletisimPage(this);
        break;

      case 'istatistikler-ve-raporlar':
        this.currentPage = new IstatistiklerVeRaporlarPage(this);
        break;

      case 'organizasyon-semasi':
        this.currentPage = new OrganizasyonSemasiPage(this);
        break;

      case 'guncel-haberler':
        this.currentPage = new GuncelHaberlerPage(this);
        break;

      case 'duyurular':
        this.currentPage = new DuyurularPage(this);
        break;

      case 'uzaktan-erisim':
        this.currentPage = new UzaktanErisimPage(this);
        break;

      case 'sure-uzatma':
        this.currentPage = new SureUzatmaPage(this);
        break;

      default:
        // Genel inner page mantığı
        this.currentPage = new InnerPage(this, pageName);
        break;
    }

    await this.currentPage.init();
  }

  /**
   * Scroll özellikleri (back to top + footer detection)
   */
  setupScrollFeatures() {
    const backToTopButton = document.getElementById('backToTop');
    const quickActionsBtn = document.querySelector('.quick-actions-btn');

    if (!backToTopButton) return;

    // Progress circle setup
    const progressCircle = backToTopButton.querySelector('.progress-ring__circle');
    const radius = progressCircle ? progressCircle.r.baseVal.value : 24;
    const circumference = radius * 2 * Math.PI;

    if (progressCircle) {
      progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      progressCircle.style.strokeDashoffset = circumference;
    }

    // Use requestAnimationFrame to throttle scroll updates
    let ticking = false;

    const update = () => {
      const scrolled = window.scrollY;

      // Show/hide back to top button
      if (scrolled > 300) {
        backToTopButton.classList.add('show');
      } else {
        backToTopButton.classList.remove('show');
      }

      // Update progress circle
      if (progressCircle) {
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const progress = scrollHeight > 0 ? scrolled / scrollHeight : 0;
        const offset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = offset;
      }

      // Footer detection for both buttons
      const footer = document.querySelector('.footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const isOverFooter = footerRect.top < window.innerHeight;

        if (isOverFooter) {
          backToTopButton.classList.add('on-footer');
          if (quickActionsBtn) quickActionsBtn.classList.add('on-footer');
        } else {
          backToTopButton.classList.remove('on-footer');
          if (quickActionsBtn) quickActionsBtn.classList.remove('on-footer');
        }
      }

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    // Click event - scroll to top
    backToTopButton.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Switch language
   * @param {string} languageCode - Language code to switch to
   */
  switchLanguage(languageCode) {
    console.log(`Switching language to: ${languageCode}`);
    LanguageManager.setLanguage(languageCode, true); // true = reload page
  }
}

export default LibraryApp;