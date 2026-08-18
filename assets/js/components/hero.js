/**
 * Anadolu Üniversitesi Kütüphane - Hero Manager
 * 3 katmanlı hero: global (settings.json) > sayfa override > CSS fallback.
 * Breadcrumb: auto (menüden türetilir) / manual (sayfa dizisi) / hidden.
 */
import Utils from '../core/utils.js';

export class HeroManager {
  constructor() {
    this.container = null;
    this._cache = { settings: null, header: null };
  }

  /**
   * Hero section'ı başlat
   * @param {Object} heroData - Hero verisi (title, description, breadcrumb, icon vb.)
   */
  async init(heroData) {
    this.container = document.getElementById('hero-container');

    if (!this.container) {
      console.warn('Hero container not found');
      return;
    }

    await this._loadGlobals();

    if (!heroData) {
      // Hero verisi yok → gizli kabul et, global boşluk ayarını uygula
      const g = (this._cache.settings && this._cache.settings.hero) || {};
      const rem = (v) => (v !== '' && v != null && !isNaN(Number(v)) ? `${Number(v)}rem` : '');
      const gap = rem(g.hiddenSpacing);
      this.container.innerHTML = gap
        ? `<div class="hero-hidden-spacer" style="height:${gap};"></div>`
        : '<div class="hero-hidden-spacer"></div>';
      this.container.style.display = '';
      return;
    }

    this.render(heroData);
  }

  /**
   * Global verileri bir kez yükle (önbellekli): settings.json + header.json
   */
  async _loadGlobals() {
    if (!this._cache.settings) {
      try {
        const r = await fetch('data/global/settings.json');
        this._cache.settings = await r.json();
      } catch (e) {
        this._cache.settings = {};
      }
    }
    if (!this._cache.header) {
      try {
        const r = await fetch('data/global/header.json');
        this._cache.header = await r.json();
      } catch (e) {
        this._cache.header = {};
      }
    }
  }

  /**
   * Global varsayılan + sayfa override birleştir (global > sayfa)
   */
  mergeConfig(heroData) {
    const g = (this._cache.settings && this._cache.settings.hero) || {};
    const d = heroData || {};
    return {
      showBreadcrumb: d.showBreadcrumb ?? g.showBreadcrumb ?? false,
      breadcrumbMode: d.breadcrumbMode || g.breadcrumbMode || 'auto',
      showIcon: d.showIcon ?? g.showIcon ?? false,
      iconPosition: d.iconPosition || g.iconPosition || 'top',
      textAlign: d.textAlign || g.textAlign || '',
      layout: d.layout || g.layout || 'stack',
      enabled: this._resolveEnabled(d.enabled, g.enabled),
      boxPaddingTop: d.boxPaddingTop ?? g.boxPaddingTop ?? '',
      boxPaddingBottom: d.boxPaddingBottom ?? g.boxPaddingBottom ?? '',
      boxMarginTop: d.boxMarginTop ?? g.boxMarginTop ?? '',
      boxMarginBottom: d.boxMarginBottom ?? g.boxMarginBottom ?? '',
      hiddenSpacing: d.hiddenSpacing ?? g.hiddenSpacing ?? '',
      backgroundColor: d.backgroundColor || g.backgroundColor || '',
      boxColor: d.boxColor || g.boxColor || '',
      borderColor: d.borderColor || g.borderColor || '',
      iconColor: d.iconColor || g.iconColor || '',
      titleColor: d.titleColor || g.titleColor || '',
      textColor: d.textColor || g.textColor || ''
    };
  }

  /**
   * Hero section'ı render et
   * @param {Object} heroData - Hero verisi
   */
  render(heroData) {
    const cfg = this.mergeConfig(heroData);
    const rem = (v) => (v !== '' && v != null && !isNaN(Number(v)) ? `${Number(v)}rem` : '');

    // Hero tamamen kapalıysa (global veya sayfa bazlı): ayarlanabilir üst boşluk bırak.
    // Böylece içerik header'ın dibine yapışmaz; boşluk miktarı hiddenSpacing (rem) ile
    // kontrol edilir — boşsa CSS varsayılanı (2rem) kullanılır.
    if (cfg.enabled === false) {
      const gap = rem(cfg.hiddenSpacing);
      this.container.innerHTML = gap
        ? `<div class="hero-hidden-spacer" style="height:${gap};"></div>`
        : '<div class="hero-hidden-spacer"></div>';
      this.container.style.display = '';
      return;
    }
    this.container.style.display = '';

    const title = Utils.getLocalizedText(heroData.title);
    const description = heroData.description ? Utils.getLocalizedText(heroData.description) : '';
    const icon = heroData.icon || '';

    // Breadcrumb öğeleri — moda göre
    let crumbs = [];
    if (cfg.showBreadcrumb && cfg.breadcrumbMode !== 'hidden') {
      if (cfg.breadcrumbMode === 'manual' && Array.isArray(heroData.breadcrumb) && heroData.breadcrumb.length) {
        crumbs = heroData.breadcrumb;
      } else if (cfg.breadcrumbMode === 'auto') {
        crumbs = this.getAutoBreadcrumb(heroData, title);
      }
    }

    // İkon konumu + yerleşim düzeni CSS sınıfları
    const posClass = 'page-hero-icon-' + cfg.iconPosition;
    const layoutClass = 'page-hero-layout-' + cfg.layout;

    // Metin hizalaması. Split düzenlerde (metin solda / breadcrumb sağda vb.)
    // metin otomatik olarak o kenara hizalanır — textAlign'e bakılmaz.
    // Stack düzeninde textAlign geçerlidir; boşsa orta.
    const isSplit = cfg.layout && cfg.layout.startsWith('split');
    const splitSide = cfg.layout === 'split-right' ? 'right' : 'left';
    const align = isSplit ? splitSide : (cfg.textAlign || 'center');
    const alignStyle = `style="text-align:${align};"`;

    // Renkler + kutu boşlukları — inline style, boşsa CSS fallback
    const bgStyle = cfg.backgroundColor ? ` style="background:${cfg.backgroundColor};"` : '';
    let contentCss = '';
    if (cfg.boxColor) contentCss += `background:${cfg.boxColor};`;
    if (cfg.borderColor) contentCss += `border-top-color:${cfg.borderColor};`;
    // Kutucuk alt/üst padding + margin (rem) — boşsa CSS/global varsayılan
    const pt = rem(cfg.boxPaddingTop), pb = rem(cfg.boxPaddingBottom);
    const mt = rem(cfg.boxMarginTop), mb = rem(cfg.boxMarginBottom);
    if (pt) contentCss += `padding-top:${pt};`;
    if (pb) contentCss += `padding-bottom:${pb};`;
    if (mt) contentCss += `margin-top:${mt};`;
    if (mb) contentCss += `margin-bottom:${mb};`;
    const boxStyle = contentCss ? ` style="${contentCss}"` : '';
    const iconStyle = cfg.iconColor ? ` style="color:${cfg.iconColor};"` : '';
    const titleStyle = cfg.titleColor ? ` style="color:${cfg.titleColor};"` : '';
    const descStyle = cfg.textColor ? ` style="color:${cfg.textColor};"` : '';

    const heroHTML = `
      <div class="page-hero ${posClass} ${layoutClass}"${bgStyle}>
        <div class="container">
          <div class="page-hero-content"${boxStyle}>
            ${cfg.showIcon && icon ? `<div class="page-hero-icon"${iconStyle}><i class="${icon}"></i></div>` : ''}
            <div class="page-hero-text"${alignStyle}>
              <h1 class="page-title"${titleStyle}>${title}</h1>
              ${description ? `<p class="page-description"${descStyle}>${description}</p>` : ''}
            </div>
            ${crumbs.length ? this.renderBreadcrumb(crumbs) : ''}
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = heroHTML;
  }

  /**
   * enabled değerini çöz: "" / null → global (varsayılan true),
   * true/"true" → açık, false/"false" → kapalı. Manager'daki 3 durumlu
   * select "" (Global'i Kullan) / "true" (Göster) / "false" (Gizle) yazar.
   */
  _resolveEnabled(pageVal, globalVal) {
    const norm = (v) => (v === true || v === 'true');
    if (pageVal === '' || pageVal === null || pageVal === undefined) {
      return (globalVal === '' || globalVal === null || globalVal === undefined) ? true : norm(globalVal);
    }
    return norm(pageVal);
  }

  /**
   * Auto breadcrumb: header.json menüsünden türet.
   * Zincir: Ana Sayfa → menü yolu → sayfanın kendi başlığı (son kırıntı).
   * @returns {Array} breadcrumb öğeleri
   */
  getAutoBreadcrumb(heroData, pageTitle) {
    const nav = (this._cache.header && this._cache.header.navigation) || [];
    const pageFile = location.pathname.split('/').pop() || 'index.html';
    const found = this._findMenuPath(nav, pageFile);

    const crumbs = [];
    if (found && found.length) {
      // Ana Sayfa her zaman başta
      crumbs.push({ text: { tr: 'Ana Sayfa', en: 'Home' }, url: 'index.html' });
      // Üst zincir (son öğe sayfanın kendisi — atlanır)
      for (const item of found.slice(0, -1)) {
        crumbs.push({ text: this._titleCaseItem(item.title), url: item.url || '#' });
      }
      // Son kırıntı: sayfanın kendi başlığı
      crumbs.push({ text: pageTitle, url: '' });
      return crumbs;
    }

    // Sayfa menüde yoksa → sayfanın kendi breadcrumb verisi (varsa)
    if (Array.isArray(heroData.breadcrumb) && heroData.breadcrumb.length) {
      return heroData.breadcrumb;
    }
    return [];
  }

  /**
   * Menü ağacında sayfa dosyasını bul, üst zincirle döndür
   */
  _findMenuPath(items, pageFile, trail = []) {
    for (const it of items) {
      if (it.url && it.url.split('/').pop() === pageFile) {
        return [...trail, it];
      }
      if (it.dropdown && Array.isArray(it.dropdown)) {
        const res = this._findMenuPath(it.dropdown, pageFile, [...trail, it]);
        if (res) return res;
      }
    }
    return null;
  }

  /**
   * Menü başlığını {tr,en} olarak başlık biçimine çevir.
   * Dil, başlığın tamamından tespit edilir: İ/Ğ/Ü/Ş/Ö/Ç içeren başlık Türkçe,
   * saf ASCII başlık İngilizce kabul edilir. Böylece 'ARACI' → 'Aracı' (tr) ve
   * 'INTEGRATED' → 'Integrated' (en) doğru çevrilir — tek başına belirsiz olan
   * ASCII 'I' bu şekilde bağlamdan çözülür.
   */
  _titleCaseItem(t) {
    const out = {};
    for (const lang of ['tr', 'en']) {
      const src = t && typeof t === 'object' ? t[lang] : t;
      const title = src || '';
      const loc = /[İĞÜŞÖÇ]/.test(title) ? 'tr-TR' : 'en-US';
      out[lang] = this._titleCase(title, loc);
    }
    return out;
  }

  /**
   * BÜYÜK HARF metni başlık biçimine çevir.
   * Kelime kelime işlenir; 2-3 harfli kısaltmalar korunur (APC, ILL, SSS);
   * tireli kelimeler ayrı işlenir.
   */
  _titleCase(str, loc) {
    if (!str) return '';
    const parts = String(str).split(/([ \t]+|-)/);
    return parts.map((w) => {
      if (!w || w.trim() === '' || w === '-') return w;
      const letters = w.replace(/[^a-zA-ZğüşöçıİĞÜŞÖÇ]/g, '');
      if (letters.length <= 3) return w; // kısaltma koru
      const lower = w.toLocaleLowerCase(loc);
      // İlk HARFİ büyüt (parantez/karakter öncesi olabilir: "(mendeley)" → "(Mendeley)")
      const m = lower.match(/[a-zA-ZğüşöçıİĞÜŞÖÇ]/);
      if (!m) return lower;
      const idx = m.index;
      return lower.slice(0, idx) + lower[idx].toLocaleUpperCase(loc) + lower.slice(idx + 1);
    }).join('');
  }

  /**
   * Breadcrumb render et
   * @param {Array} items - Breadcrumb öğeleri
   * @returns {string} Breadcrumb HTML
   */
  renderBreadcrumb(items) {
    if (!items || items.length === 0) return '';

    const lis = items.map((item, index) => {
      const isLast = index === items.length - 1;
      const localizedText = Utils.getLocalizedText(item.text);

      if (isLast) {
        return `<li class="breadcrumb-item active" aria-current="page">${localizedText}</li>`;
      }
      return `<li class="breadcrumb-item"><a href="${item.url}">${localizedText}</a></li>`;
    }).join('');

    return `
      <nav class="hero-breadcrumb" aria-label="breadcrumb">
        <ol class="breadcrumb">
          ${lis}
        </ol>
      </nav>
    `;
  }

  /**
   * Hero içeriğini güncelle
   */
  update(newData) {
    this.render(newData);
  }
}

export default HeroManager;
