/**
 * Anadolu Üniversitesi Kütüphane - SEO Meta Yönetimi
 * Sayfa JSON'undaki `meta` alanını okuyup head'e yazar:
 * title, description, keywords, canonical, robots, Open Graph, Twitter Cards,
 * geo + marka etiketleri ve JSON-LD (WebSite+Organization, BreadcrumbList, FAQPage).
 * Dil değişimi sayfa yenilenmesiyle geldiği için her yüklemede yeniden uygulanır.
 */

import Utils from './utils.js';
import { LanguageManager } from './language-manager.js';

const BASE_URL = 'https://kdm.anadolu.edu.tr';
const SITE_NAME = 'Anadolu Üniversitesi Kütüphane';
const DEFAULT_OG_IMAGE = BASE_URL + '/assets/images/og/library-og.png';
const GEO_REGION = 'TR-26';
const GEO_PLACE = 'Eskişehir';
const GEO_POS = '39.7767;30.5206';

export class MetaManager {
  constructor(app) {
    this.app = app;
  }

  /**
   * Sayfa verisi yüklendiğinde tüm SEO etiketlerini uygula.
   * @param {Object} pageData - Sayfa JSON verisi (meta + hero + content)
   * @param {Object} pageInfo - { type, name }
   */
  apply(pageData, pageInfo) {
    // Önceki SEO JSON-LD scriptlerini temizle (tekrar uygulamalarda çiftlenmesin)
    document.querySelectorAll('script[data-seo="1"]').forEach((s) => s.remove());
    const meta = (pageData && pageData.meta) || {};
    const lang = LanguageManager.getCurrentLanguage() || 'tr';
    const pageFile = this.pageFile();
    const pageUrl = BASE_URL + pageFile;
    const isHome = pageFile === '/' || pageFile === '/index.html';

    // Dil etiketi
    document.documentElement.lang = lang;

    // Metinler (JSON meta → statik HTML fallback)
    const title = Utils.getLocalizedText(meta.title, lang) || document.title || SITE_NAME;
    const description = Utils.getLocalizedText(meta.description, lang)
      || this.staticMeta('description') || '';
    const keywords = Utils.getLocalizedText(meta.keywords, lang)
      || this.staticMeta('keywords') || '';

    // Başlığa site adını ekle (iç sayfalar için)
    const finalTitle = isHome || title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    const lastModified = pageData?.lastModified || meta.lastModified || this.app.data?.homeSettings?.lastModified;

    this.setTitle(finalTitle);
    this.setMeta('description', description);
    if (keywords) this.setMeta('keywords', keywords);
    this.setCanonical(pageUrl);
    this.setRobots();
    this.setOG({ title: finalTitle, description, pageUrl, meta, lang, isHome, lastModified });
    this.setTwitter({ title: finalTitle, description, pageUrl, meta });
    this.setGeo();
    this.setBrandTags();
    this.setJSONLD({ pageData, pageUrl, pageFile, isHome, lang });
  }

  /* ---------- yardımcılar ---------- */

  localized(value, lang) {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return Utils.getLocalizedText(value, lang) || '';
    return String(value);
  }

  pageFile() {
    const p = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
    return p === '/' ? '/' : p;
  }

  staticMeta(name) {
    const el = document.querySelector(`meta[name="${name}"]`);
    return el ? el.getAttribute('content') || '' : '';
  }

  ensureMeta(attr, name, content) {
    let el = document.querySelector(`meta[${attr}="${name}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  }

  setTitle(title) {
    document.title = title;
  }

  setMeta(name, content) {
    if (!content) return;
    this.ensureMeta('name', name, content);
  }

  setProperty(name, content) {
    if (!content) return;
    this.ensureMeta('property', name, content);
  }

  ensureLink(rel, href) {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) {
      el = document.createElement('link');
      el.setAttribute('rel', rel);
      document.head.appendChild(el);
    }
    el.setAttribute('href', href);
  }

  setCanonical(pageUrl) {
    this.ensureLink('canonical', pageUrl);
  }

  setRobots() {
    this.setMeta('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    this.setMeta('googlebot', 'index, follow');
  }

  setOG({ title, description, pageUrl, meta, lang, isHome, lastModified }) {
    this.setProperty('og:type', Utils.getLocalizedText(meta.ogType, lang) || (isHome ? 'website' : 'article'));
    this.setProperty('og:site_name', SITE_NAME);
    this.setProperty('og:title', title);
    this.setProperty('og:description', description);
    this.setProperty('og:url', pageUrl);
    const ogImage = Utils.getLocalizedText(meta.ogImage, lang) || DEFAULT_OG_IMAGE;
    this.setProperty('og:image', ogImage.startsWith('http') ? ogImage : BASE_URL + ogImage);
    this.setProperty('og:image:width', '1200');
    this.setProperty('og:image:height', '630');
    this.setProperty('og:locale', lang === 'en' ? 'en_US' : 'tr_TR');
    this.setProperty('og:locale:alternate', lang === 'en' ? 'tr_TR' : 'en_US');
    if (lastModified) this.setProperty('og:updated_time', lastModified);
    // article etiketleri (iç sayfalar)
    if (!isHome) {
      if (meta.publishedTime) this.setProperty('article:published_time', meta.publishedTime);
      if (lastModified) this.setProperty('article:modified_time', lastModified);
      if (meta.section) this.setProperty('article:section', this.localized(meta.section, lang));
      const author = Utils.getLocalizedText(meta.author, lang) || 'Anadolu Üniversitesi Kütüphane';
      this.setProperty('article:author', author);
      const tags = Array.isArray(meta.tags) ? meta.tags : [];
      tags.forEach(t => this.setProperty('article:tag', this.localized(t, lang)));
    }
  }

  setTwitter({ title, description, pageUrl, meta }) {
    this.setMeta('twitter:card', 'summary_large_image');
    this.setMeta('twitter:title', title);
    if (description) this.setMeta('twitter:description', description);
    this.setMeta('twitter:url', pageUrl);
    const ogImage = Utils.getLocalizedText(meta.ogImage) || DEFAULT_OG_IMAGE;
    this.setMeta('twitter:image', ogImage.startsWith('http') ? ogImage : BASE_URL + ogImage);
  }

  setGeo() {
    this.setMeta('geo.region', GEO_REGION);
    this.setMeta('geo.placename', GEO_PLACE);
    this.setMeta('geo.position', GEO_POS);
    this.setMeta('ICBM', GEO_POS);
  }

  setBrandTags() {
    this.setMeta('theme-color', '#1F4C8A');
    this.setMeta('author', 'Anadolu Üniversitesi Kütüphane ve Dokümantasyon Daire Başkanlığı');
    this.setMeta('application-name', SITE_NAME);
    this.setMeta('apple-mobile-web-app-title', 'AU Kütüphane');
    this.setMeta('apple-mobile-web-app-capable', 'yes');
    this.setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
  }

  /* ---------- JSON-LD ---------- */

  addJSONLD(obj) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', '1');
    script.textContent = JSON.stringify(obj);
    document.head.appendChild(script);
  }

  setJSONLD({ pageData, pageUrl, pageFile, isHome, lang }) {
    const meta = (pageData && pageData.meta) || {};

    if (isHome) {
      this.addJSONLD(this.websiteSchema(pageData, pageUrl));
      this.addJSONLD(this.organizationSchema(pageData));
      return;
    }

    // BreadcrumbList (JSON'daki hero.breadcrumb'dan; yoksa basit Ana Sayfa > Sayfa)
    this.addJSONLD(this.breadcrumbSchema(pageData, pageFile, lang));

    // FAQPage (sss sayfası — accordion bileşenlerinden)
    const faq = this.faqSchema(pageData, lang);
    if (faq) this.addJSONLD(faq);
  }

  websiteSchema(pageData, pageUrl) {
    const title = Utils.getLocalizedText(pageData?.meta?.title) || SITE_NAME;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: title,
      url: pageUrl,
      inLanguage: ['tr', 'en'],
    };
    // Sitelinks arama kutusu — katalog araması (home.json meta.searchUrlTemplate'dan, varsayılan libra)
    const searchUrl = pageData?.meta?.searchUrlTemplate
      || 'https://libra.anadolu.edu.tr/libra.aspx?keyword={search_term_string}';
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: searchUrl },
      'query-input': 'required name=search_term_string',
    };
    return schema;
  }

  organizationSchema(pageData) {
    const title = Utils.getLocalizedText(pageData?.meta?.title) || SITE_NAME;
    const description = Utils.getLocalizedText(pageData?.meta?.description) || '';
    const logo = Utils.getLocalizedText(pageData?.meta?.logo) || BASE_URL + '/assets/images/au-logo.png';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Library',
      name: title,
      alternateName: 'Anadolu Üniversitesi Kütüphane ve Dokümantasyon Daire Başkanlığı',
      url: BASE_URL + '/',
      description,
      logo,
      image: Utils.getLocalizedText(pageData?.meta?.ogImage) || DEFAULT_OG_IMAGE,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TR',
        addressRegion: 'Eskişehir',
        addressLocality: 'Eskişehir',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 39.7767, longitude: 30.5206 },
      sameAs: ['https://x.com/anadoluuni'],
    };
    // Yapılandırılmış açılış saatleri (home.json meta.openingHours) — Google çalışma saatleri gösterir
    const hours = Array.isArray(pageData?.meta?.openingHours) ? pageData.meta.openingHours : [];
    if (hours.length) schema.openingHoursSpecification = hours;
    return schema;
  }

  breadcrumbSchema(pageData, pageFile, lang) {
    const raw = pageData?.hero?.breadcrumb;
    const items = [];
    const push = (name, url) => {
      items.push({ '@type': 'ListItem', position: items.length + 1, name, item: BASE_URL + '/' + (url || '').replace(/^\//, '') });
    };
    if (Array.isArray(raw) && raw.length) {
      raw.forEach((b) => {
        if (!b || !b.text) return;
        const name = Utils.getLocalizedText(b.text, lang);
        const url = b.url === '#' ? '' : b.url;
        if (name) push(name, url || pageFile);
      });
    } else {
      // Fallback: JSON meta.title varsa onu kullan ("Sss" yerine düzgün ad), yoksa dosya adı
      const metaTitle = Utils.getLocalizedText(pageData?.meta?.title, lang);
      const pageName = pageFile.split('/').pop().replace('.html', '');
      const fallbackName = (metaTitle && metaTitle.length <= 50)
        ? metaTitle
        : pageName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      push('Ana Sayfa', 'index.html');
      push(fallbackName, pageFile);
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };
  }

  faqSchema(pageData, lang) {
    if (!pageData?.content) return null;
    const questions = [];
    const stripMd = (t) => String(t || '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')   // linkler
      .replace(/\*\*/g, '').replace(/\*/g, '')   // kalın/italik
      .replace(/^[-•]\s*/gm, '')                  // liste işaretleri
      .replace(/\s+/g, ' ').trim();
    const blockText = (blocks) => {
      if (typeof blocks === 'string') return stripMd(blocks);
      if (!Array.isArray(blocks)) return '';
      return blocks.map((b) => {
        const d = b?.data || {};
        if (b?.type === 'table' && Array.isArray(d.headers)) {
          const hd = d.headers.map((h) => (typeof h === 'object' ? (h.tr || h.en || '') : h)).join(' · ');
          const rows = (d.rows || []).map((r) => (r.cells || []).map((c) => (typeof c === 'object' ? (c.tr || c.en || '') : c)).join(' · ')).join(' ');
          return (hd + ' ' + rows).trim();
        }
        if (Array.isArray(d.items)) {
          return d.items.map((it) => {
            if (typeof it === 'string') return it;
            if (it && typeof it === 'object') {
              return [it.text, it.title, it.description, it.content, it.subtitle].filter(Boolean).join(' ');
            }
            return '';
          }).join(' ');
        }
        return [d.content, d.text, d.title, d.description].filter(Boolean).join(' ');
      }).map(stripMd).filter(Boolean).join(' ');
    };
    const walk = (node) => {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (!node || typeof node !== 'object') return;
      if (node.type === 'accordion' && Array.isArray(node.data?.items)) {
        node.data.items.forEach((it) => {
          const q = Utils.getLocalizedText(it.question, lang);
          const a = blockText(it.answer?.[lang] || it.answer);
          if (q && a) questions.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
        });
      }
      for (const v of Object.values(node)) walk(v);
    };
    walk(pageData.content);
    if (!questions.length) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: questions.slice(0, 30),
    };
  }
}

export default MetaManager;
