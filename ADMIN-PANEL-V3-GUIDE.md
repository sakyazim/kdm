# ADMIN PANEL v3.0 - UYGULAMA KILAVUZU

**Hazırlanma Tarihi:** 2025-11-26
**Proje:** Anadolu Üniversitesi Kütüphane - Admin Panel
**Versiyon:** 3.0
**Durum:** Final Mockup Onaylandı ✅

---

## 📋 İÇİNDEKİLER

1. [Genel Bakış](#genel-bakış)
2. [Özellikler](#özellikler)
3. [Mimari ve Yapı](#mimari-ve-yapı)
4. [Dosya Yapısı](#dosya-yapısı)
5. [Uygulama Adımları](#uygulama-adımları)
6. [Detaylı Kod İmplementasyonu](#detaylı-kod-implementasyonu)
7. [Test Planı](#test-planı)
8. [Deployment](#deployment)

---

## 🎯 GENEL BAKIŞ

### Projenin Amacı
Mevcut karmaşık admin panelini daha kullanıcı dostu, modern ve etkili bir arayüze dönüştürmek.

### Temel Değişiklikler

**ESKİ SİSTEM:**
- ❌ Karmaşık JSON editor
- ❌ Bottom bar yer kaplıyor
- ❌ Sidebar ve preview her zaman açık
- ❌ Meta/Hero/Help karışıyor
- ❌ Sürükle-bırak riskli

**YENİ SİSTEM:**
- ✅ Akıllı form builder
- ✅ Header'da kompakt kontroller
- ✅ Gizlenebilir sidebar/preview
- ✅ Ayrı tab sistemi
- ✅ Accordion + ok butonları

---

## ✨ ÖZELLİKLER

### 1. **Site Renkleri Kullanımı**
```css
--primary-color: #1F4C8A;    /* Ana mavi */
--secondary-color: #C03221;  /* Kırmızı */
--tertiary-color: #EEF9FC;   /* Açık mavi */
--accent-color: #FFC43D;     /* Sarı */
```

### 2. **Responsive Layout**
- **3 Sütun Sistem:** Sidebar (280px) | Editor (flex) | Preview (450px)
- **Gizlenebilir Paneller:** Toggle butonları ile aç/kapa
- **Resize Desteği:** Preview paneli genişlik ayarı

### 3. **Akıllı Tab Sistemi**
- **Tab 1: İçerik** - Ana çalışma alanı (section'lar, kartlar)
- **Tab 2: Genel Ayarlar** - Meta, Hero, Yardım (nadiren değişir)

### 4. **Accordion Kartlar**
- Açılır/kapanır yapı
- Her kart için: ↑ Yukarı | ↓ Aşağı | 🗑️ Sil
- Sadece ihtiyaç duyulan kart açık

### 5. **Section Kartları**
- Her JSON section ayrı kart
- Otomatik başlık ve icon
- İçinde accordion kartlar

### 6. **Header Kontrolü**
- Değişiklik göstergesi (sarı badge)
- İptal ve Kaydet butonları
- Kompakt ve her zaman görünür

---

## 🏗️ MİMARİ VE YAPI

### Genel Akış

```
1. Dosya Seçimi (Sidebar)
   ↓
2. JSON Yükleme & Parse
   ↓
3. Tab Renderı (İçerik / Genel)
   ↓
4. Section Kartları Oluşturma
   ↓
5. Accordion Kartlar İçinde Form Alanları
   ↓
6. Değişiklik Takibi
   ↓
7. Kaydetme & JSON İndirme
```

### Component Hiyerarşisi

```
AdminPanelV3
├── Header
│   ├── Logo & Title
│   ├── Changes Indicator
│   └── Action Buttons (Cancel, Save)
├── Toggle Buttons
│   ├── Sidebar Toggle
│   └── Preview Toggle
├── Main Container (Grid)
│   ├── Sidebar Panel
│   │   ├── File Search
│   │   └── File List
│   ├── Editor Panel
│   │   ├── Editor Header
│   │   │   ├── File Info
│   │   │   ├── Status Badges
│   │   │   ├── Tabs (Content/General)
│   │   │   └── Search Input
│   │   └── Editor Body
│   │       ├── Section Cards
│   │       │   ├── Section Header (Title, Icon, +Add)
│   │       │   └── Section Body
│   │       │       ├── Accordion Cards
│   │       │       │   ├── Card Header (Number, Icon, Title, Actions)
│   │       │       │   └── Card Body (Form Fields)
│   │       │       └── Add New Button
│   └── Preview Panel
│       ├── Preview Header (Device toggles)
│       └── Preview Body (iframe)
└── Resize Handle
```

---

## 📁 DOSYA YAPISI

### Yeni Eklencek Dosyalar

```
d:/KDMWEB/d/
├── admin-panel-v3.html          # Ana HTML dosyası
├── assets/
│   ├── css/
│   │   └── admin-panel-v3.css   # Yeni stil dosyası
│   └── js/
│       ├── admin-panel-v3.js    # Ana uygulama sınıfı
│       ├── components/
│       │   ├── sidebar-manager.js
│       │   ├── editor-manager.js
│       │   ├── section-renderer.js
│       │   ├── accordion-card.js
│       │   ├── form-builder.js
│       │   ├── icon-picker.js
│       │   └── preview-manager.js
│       └── utils/
│           ├── json-parser.js
│           ├── change-tracker.js
│           └── validator.js
└── data/
    ├── pages/
    ├── content/
    ├── global/
    └── agreements/
```

### Mevcut Dosyalar (Dokunulmayacak)

```
✅ KORU:
- data/pages/*.json
- data/global/*.json
- assets/js/core/utils.js
- assets/css/global/variables.css

❌ KALDIRILACAK (opsiyonel):
- admin-panel.html (eski versiyon)
- assets/js/admin-panel.js (eski kod)
```

---

## 🚀 UYGULAMA ADIMLARI

### ADIM 1: HTML Yapısı (1 saat)

**Dosya:** `admin-panel-v3.html`

```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel v3.0</title>

    <!-- Bootstrap -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

    <!-- Custom CSS -->
    <link rel="stylesheet" href="assets/css/admin-panel-v3.css">
</head>
<body>
    <!-- Header -->
    <div class="admin-header" id="adminHeader"></div>

    <!-- Toggle Buttons -->
    <button class="toggle-btn toggle-sidebar" id="sidebarToggle"></button>
    <button class="toggle-btn toggle-preview" id="previewToggle"></button>

    <!-- Main Container -->
    <div class="main-container" id="mainContainer">
        <!-- Resize Handle -->
        <div class="resize-handle" id="resizeHandle"></div>

        <!-- Sidebar -->
        <div class="sidebar-panel" id="sidebarPanel"></div>

        <!-- Editor -->
        <div class="editor-panel" id="editorPanel"></div>

        <!-- Preview -->
        <div class="preview-panel" id="previewPanel"></div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>

    <!-- Custom JS (ES6 Modules) -->
    <script type="module" src="assets/js/admin-panel-v3.js"></script>
</body>
</html>
```

**Yapılacaklar:**
- [x] Mockup'tan HTML yapısını kopyala
- [x] Site renklerini CSS'e ekle
- [x] Grid layout oluştur
- [x] Resize handle ekle

---

### ADIM 2: CSS Stilleri (2 saat)

**Dosya:** `assets/css/admin-panel-v3.css`

**Bölümler:**

1. **CSS Variables** (Site renklerini kullan)
2. **Layout (Grid System)**
3. **Header & Toggle Buttons**
4. **Sidebar Panel**
5. **Editor Panel**
6. **Section Cards**
7. **Accordion Cards**
8. **Form Elements**
9. **Preview Panel**
10. **Resize Handle**
11. **Responsive**

**Örnek Kod:**

```css
:root {
    /* Site Ana Renkleri */
    --primary-color: #1F4C8A;
    --secondary-color: #C03221;
    --tertiary-color: #EEF9FC;
    --accent-color: #FFC43D;
    /* ... diğer renkler */
}

/* Grid Layout */
.main-container {
    display: grid;
    grid-template-columns: 0px 1fr 0px;
    gap: 1rem;
    padding: 1rem;
    transition: grid-template-columns 0.3s ease;
}

.main-container.sidebar-visible {
    grid-template-columns: 280px 1fr 0px;
}

.main-container.preview-visible {
    grid-template-columns: 0px 1fr 450px;
}

.main-container.both-visible {
    grid-template-columns: 280px 1fr 450px;
}

/* ... diğer stiller */
```

---

### ADIM 3: Ana Uygulama Sınıfı (3 saat)

**Dosya:** `assets/js/admin-panel-v3.js`

```javascript
import SidebarManager from './components/sidebar-manager.js';
import EditorManager from './components/editor-manager.js';
import PreviewManager from './components/preview-manager.js';
import ChangeTracker from './utils/change-tracker.js';

class AdminPanelV3 {
    constructor() {
        this.currentFile = null;
        this.currentData = null;
        this.originalData = null;

        // Component managers
        this.sidebar = new SidebarManager(this);
        this.editor = new EditorManager(this);
        this.preview = new PreviewManager(this);
        this.changeTracker = new ChangeTracker(this);

        // UI State
        this.sidebarVisible = false;
        this.previewVisible = false;
        this.previewWidth = 450;

        this.init();
    }

    async init() {
        console.log('🚀 Admin Panel v3.0 initializing...');

        // Render static UI
        this.renderHeader();
        this.setupEventListeners();

        // Load file list
        await this.sidebar.loadFileList();

        // Auto-open sidebar
        this.toggleSidebar();

        console.log('✅ Admin Panel v3.0 ready!');
    }

    renderHeader() {
        const header = document.getElementById('adminHeader');
        header.innerHTML = `
            <div class="container-fluid">
                <div class="d-flex justify-content-between align-items-center">
                    <h1>
                        <i class="bi bi-pencil-square me-2"></i>
                        Admin Panel v3.0
                    </h1>
                    <div class="header-actions">
                        <div class="changes-indicator" id="changesIndicator" style="display: none;">
                            <i class="bi bi-exclamation-circle-fill"></i>
                            <span>Kaydedilmemiş değişiklikler var</span>
                        </div>
                        <button class="btn-header" id="cancelBtn">
                            <i class="bi bi-x-lg me-1"></i>
                            İptal
                        </button>
                        <button class="btn-header btn-save" id="saveBtn">
                            <i class="bi bi-check-lg me-1"></i>
                            Kaydet ve İndir
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Toggle buttons
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('previewToggle').addEventListener('click', () => this.togglePreview());

        // Header buttons
        document.getElementById('cancelBtn').addEventListener('click', () => this.cancelChanges());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveChanges());

        // Resize handle
        this.setupResizeHandle();
    }

    toggleSidebar() {
        const container = document.getElementById('mainContainer');
        this.sidebarVisible = !this.sidebarVisible;
        this.updateLayout();
    }

    togglePreview() {
        const container = document.getElementById('mainContainer');
        this.previewVisible = !this.previewVisible;
        this.updateLayout();
    }

    updateLayout() {
        const container = document.getElementById('mainContainer');
        container.classList.remove('sidebar-visible', 'preview-visible', 'both-visible');

        if (this.sidebarVisible && this.previewVisible) {
            container.classList.add('both-visible');
        } else if (this.sidebarVisible) {
            container.classList.add('sidebar-visible');
        } else if (this.previewVisible) {
            container.classList.add('preview-visible');
        }
    }

    setupResizeHandle() {
        const handle = document.getElementById('resizeHandle');
        const previewPanel = document.getElementById('previewPanel');
        let isResizing = false;
        let startX = 0;
        let startWidth = this.previewWidth;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = previewPanel.offsetWidth;
            handle.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const diff = startX - e.clientX;
            const newWidth = Math.max(300, Math.min(800, startWidth + diff));

            this.previewWidth = newWidth;
            previewPanel.style.width = newWidth + 'px';
            handle.style.right = newWidth + 'px';

            const sidebarWidth = this.sidebarVisible ? '280px' : '0px';
            document.getElementById('mainContainer').style.gridTemplateColumns =
                `${sidebarWidth} 1fr ${newWidth}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                handle.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        });
    }

    async loadFile(filePath, fileName) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Dosya yüklenemedi');

            this.currentData = await response.json();
            this.originalData = JSON.parse(JSON.stringify(this.currentData)); // Deep clone
            this.currentFile = { path: filePath, name: fileName };

            // Render editor
            await this.editor.render(this.currentData, fileName);

            // Update preview
            this.preview.update(filePath);

            // Reset change tracker
            this.changeTracker.reset();

            // Auto-close sidebar
            if (this.sidebarVisible) {
                this.toggleSidebar();
            }

            console.log(`✅ Loaded: ${fileName}`);
        } catch (error) {
            console.error('❌ File load error:', error);
            alert('Dosya yüklenirken hata oluştu!');
        }
    }

    saveChanges() {
        if (!this.currentFile) {
            alert('Önce bir dosya seçin!');
            return;
        }

        // Validate JSON
        try {
            const jsonString = JSON.stringify(this.currentData, null, 2);

            // Download JSON
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = this.currentFile.name;
            a.click();
            URL.revokeObjectURL(url);

            // Reset tracker
            this.originalData = JSON.parse(JSON.stringify(this.currentData));
            this.changeTracker.reset();

            alert('✅ Dosya kaydedildi ve indirildi!');
        } catch (error) {
            console.error('❌ Save error:', error);
            alert('Kaydetme hatası!');
        }
    }

    cancelChanges() {
        if (!this.changeTracker.hasChanges()) {
            return;
        }

        if (confirm('Kaydedilmemiş değişiklikleri iptal etmek istediğinize emin misiniz?')) {
            this.currentData = JSON.parse(JSON.stringify(this.originalData));
            this.editor.render(this.currentData, this.currentFile.name);
            this.changeTracker.reset();
        }
    }

    onDataChange() {
        this.changeTracker.track();
        this.preview.update(this.currentFile.path);
    }
}

// Initialize
const app = new AdminPanelV3();
window.adminPanel = app; // For debugging
```

---

### ADIM 4: Sidebar Manager (1 saat)

**Dosya:** `assets/js/components/sidebar-manager.js`

```javascript
export default class SidebarManager {
    constructor(app) {
        this.app = app;
        this.files = {
            pages: [],
            content: [],
            global: [],
            agreements: []
        };
    }

    async loadFileList() {
        // Tüm JSON dosyalarının listesi (hardcoded veya API'den)
        this.files = {
            pages: [
                'home', 'iletisim', 'personel', 'veritabanlari', 'sss',
                'bilgisayar-laboratuvari', 'calisma-odalari', 'uzaktan-erisim',
                // ... diğer sayfalar
            ],
            content: ['services', 'collections', 'announcements', 'modal', 'arrivals'],
            global: ['settings', 'quickactions', 'footer', 'accessibility', 'header'],
            agreements: ['veritabanlari-kullanim-sartlari', 'uzaktan-erisim-kullanim-sartlari']
        };

        this.render();
    }

    render() {
        const sidebar = document.getElementById('sidebarPanel');
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <i class="bi bi-folder2-open me-2"></i>
                JSON Dosyaları
            </div>
            <div class="sidebar-search">
                <input type="search" class="form-control form-control-sm"
                       id="fileSearch" placeholder="Dosya ara...">
            </div>
            <div class="file-list" id="fileList">
                ${this.renderFileCategories()}
            </div>
        `;

        // Setup search
        document.getElementById('fileSearch').addEventListener('input', (e) => {
            this.filterFiles(e.target.value);
        });
    }

    renderFileCategories() {
        let html = '';

        // Pages
        html += this.renderCategory('pages', 'data/pages/', 'Sayfalar');

        // Content
        html += this.renderCategory('content', 'data/content/', 'İçerik');

        // Global
        html += this.renderCategory('global', 'data/global/', 'Global');

        // Agreements
        html += this.renderCategory('agreements', 'data/agreements/', 'Sözleşmeler');

        return html;
    }

    renderCategory(category, basePath, title) {
        let html = `<div class="file-category"><h6>${title}</h6>`;

        this.files[category].forEach(filename => {
            const filePath = `${basePath}${filename}.json`;
            const displayName = this.formatFileName(filename);

            html += `
                <div class="file-item" data-path="${filePath}" data-name="${filename}.json">
                    <span>
                        <i class="bi bi-file-earmark-code text-primary me-2"></i>
                        ${displayName}
                    </span>
                    <i class="bi bi-chevron-right"></i>
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    formatFileName(filename) {
        return filename
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    filterFiles(query) {
        const items = document.querySelectorAll('.file-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(lowerQuery) ? 'flex' : 'none';
        });
    }
}
```

---

### ADIM 5: Editor Manager (4 saat) - EN ÖNEMLİ!

**Dosya:** `assets/js/components/editor-manager.js`

```javascript
import SectionRenderer from './section-renderer.js';
import FormBuilder from './form-builder.js';

export default class EditorManager {
    constructor(app) {
        this.app = app;
        this.sectionRenderer = new SectionRenderer(app);
        this.formBuilder = new FormBuilder(app);
        this.currentTab = 'content';
    }

    async render(data, fileName) {
        const editor = document.getElementById('editorPanel');

        editor.innerHTML = `
            ${this.renderHeader(fileName)}
            ${this.renderContentTab(data)}
            ${this.renderGeneralTab(data)}
        `;

        this.setupTabListeners();
        this.setupSearchListener();
    }

    renderHeader(fileName) {
        return `
            <div class="editor-header">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="mb-1">
                            <i class="bi bi-pencil-square text-primary me-2"></i>
                            ${this.formatFileName(fileName)}
                        </h5>
                        <small class="text-muted">${fileName}</small>
                    </div>
                    <div>
                        ${this.renderStatusBadges()}
                    </div>
                </div>

                <!-- Tabs -->
                <div class="editor-tabs">
                    <button class="tab-btn active" data-tab="content">
                        <i class="bi bi-card-list"></i>
                        İçerik
                        <span class="badge">${this.countSections('content')}</span>
                    </button>
                    <button class="tab-btn" data-tab="general">
                        <i class="bi bi-sliders"></i>
                        Genel Ayarlar
                        <span class="badge">Meta, Hero, Yardım</span>
                    </button>
                </div>

                <!-- Search -->
                <div class="input-group input-group-sm mt-2">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="fieldSearch"
                           placeholder="Alan ara... (örn: title, description)">
                </div>
            </div>
        `;
    }

    renderContentTab(data) {
        let html = '<div class="editor-body" id="contentTab">';

        // Render sections (content.cards, map, departments vb.)
        const contentSections = this.getContentSections(data);

        for (const [sectionKey, sectionData] of Object.entries(contentSections)) {
            html += this.sectionRenderer.render(sectionKey, sectionData);
        }

        html += '</div>';
        return html;
    }

    renderGeneralTab(data) {
        let html = '<div class="editor-body" id="generalTab" style="display: none;">';

        // Meta section
        if (data.meta) {
            html += this.sectionRenderer.render('meta', data.meta);
        }

        // Hero section
        if (data.hero) {
            html += this.sectionRenderer.render('hero', data.hero);
        }

        // Help section
        if (data.help) {
            html += this.sectionRenderer.render('help', data.help);
        }

        html += '</div>';
        return html;
    }

    getContentSections(data) {
        const sections = {};

        // content.cards gibi yapılar
        if (data.content) {
            for (const [key, value] of Object.entries(data.content)) {
                sections[key] = value;
            }
        }

        return sections;
    }

    countSections(type) {
        // Section sayısını hesapla
        return Object.keys(this.getContentSections(this.app.currentData)).length;
    }

    renderStatusBadges() {
        // TR/EN tamamlanma durumu
        const hasTR = this.checkLanguageCompletion('tr');
        const hasEN = this.checkLanguageCompletion('en');

        return `
            <span class="status-badge ${hasTR ? 'status-complete' : 'status-incomplete'}">
                <i class="bi bi-${hasTR ? 'check' : 'exclamation'}-circle-fill me-1"></i>
                TR ${hasTR ? 'Tamamlandı' : 'Eksik'}
            </span>
            <span class="status-badge ${hasEN ? 'status-complete' : 'status-incomplete'} ms-2">
                <i class="bi bi-${hasEN ? 'check' : 'exclamation'}-circle-fill me-1"></i>
                EN ${hasEN ? 'Tamamlandı' : 'Eksik'}
            </span>
        `;
    }

    checkLanguageCompletion(lang) {
        // Recursive check için helper fonksiyon
        const checkObject = (obj) => {
            if (!obj || typeof obj !== 'object') return false;

            for (const value of Object.values(obj)) {
                if (typeof value === 'object' && value !== null) {
                    if (value[lang] !== undefined && value[lang] !== '') {
                        return true;
                    }
                    if (checkObject(value)) {
                        return true;
                    }
                }
            }
            return false;
        };

        return checkObject(this.app.currentData);
    }

    setupTabListeners() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });
    }

    switchTab(tab) {
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update content
        document.getElementById('contentTab').style.display = tab === 'content' ? 'block' : 'none';
        document.getElementById('generalTab').style.display = tab === 'general' ? 'block' : 'none';

        this.currentTab = tab;
    }

    setupSearchListener() {
        const searchInput = document.getElementById('fieldSearch');
        searchInput.addEventListener('input', (e) => {
            this.filterFields(e.target.value);
        });
    }

    filterFields(query) {
        // Form alanlarını filtrele
        const lowerQuery = query.toLowerCase();
        const labels = document.querySelectorAll('.form-label-main');

        labels.forEach(label => {
            const formGroup = label.closest('.form-group-lang');
            const text = label.textContent.toLowerCase();

            if (formGroup) {
                formGroup.style.display = text.includes(lowerQuery) ? 'block' : 'none';
            }
        });
    }

    formatFileName(filename) {
        return filename.replace('.json', '').replace(/-/g, ' ')
            .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
}
```

---

### ADIM 6: Section Renderer (2 saat)

**Dosya:** `assets/js/components/section-renderer.js`

```javascript
import AccordionCard from './accordion-card.js';

export default class SectionRenderer {
    constructor(app) {
        this.app = app;
        this.accordionCard = new AccordionCard(app);
    }

    render(sectionKey, sectionData) {
        const sectionInfo = this.getSectionInfo(sectionKey);

        let html = `
            <div class="section-card" data-section="${sectionKey}">
                ${this.renderHeader(sectionInfo, sectionKey)}
                ${this.renderBody(sectionKey, sectionData, sectionInfo)}
            </div>
        `;

        return html;
    }

    renderHeader(sectionInfo, sectionKey) {
        return `
            <div class="section-header">
                <div class="section-title">
                    <div class="section-icon">
                        <i class="${sectionInfo.icon}"></i>
                    </div>
                    <span>${sectionInfo.title}</span>
                </div>
                <div class="section-actions">
                    <button class="btn btn-sm btn-success" onclick="adminPanel.addNewCard('${sectionKey}')">
                        <i class="bi bi-plus-lg"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderBody(sectionKey, sectionData, sectionInfo) {
        let html = '<div class="section-body">';

        // Eğer array ise (cards gibi), accordion kartlar
        if (Array.isArray(sectionData)) {
            sectionData.forEach((card, index) => {
                html += this.accordionCard.render(card, index, sectionKey);
            });

            html += `
                <button class="btn-add-new" onclick="adminPanel.addNewCard('${sectionKey}')">
                    <i class="bi bi-plus-circle-fill"></i>
                    Yeni Kart Ekle
                </button>
            `;
        } else {
            // Basit form alanları (meta, hero vb.)
            html += this.renderSimpleFields(sectionKey, sectionData);
        }

        html += '</div>';
        return html;
    }

    renderSimpleFields(sectionKey, data) {
        let html = '';

        for (const [fieldKey, fieldValue] of Object.entries(data)) {
            // Skip teknik alanlar
            if (['icon', 'url', 'type', 'variant'].includes(fieldKey)) continue;

            html += this.renderField(fieldKey, fieldValue, `${sectionKey}.${fieldKey}`);
        }

        return html;
    }

    renderField(fieldKey, fieldValue, fieldPath) {
        const fieldInfo = this.getFieldInfo(fieldKey);

        // Çoklu dil mi?
        const isMultilang = typeof fieldValue === 'object' &&
                           (fieldValue.tr !== undefined || fieldValue.en !== undefined);

        if (isMultilang) {
            return this.renderMultilangField(fieldInfo, fieldValue, fieldPath);
        } else {
            return this.renderSingleField(fieldInfo, fieldValue, fieldPath);
        }
    }

    renderMultilangField(fieldInfo, value, fieldPath) {
        const trValue = value.tr || '';
        const enValue = value.en || '';
        const isTextarea = trValue.length > 100 || enValue.length > 100;

        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <div class="lang-inputs">
                    <div class="lang-input-group">
                        <span class="lang-badge">🇹🇷 TR</span>
                        ${isTextarea ?
                            `<textarea class="form-control" data-field="${fieldPath}.tr">${trValue}</textarea>` :
                            `<input type="text" class="form-control" data-field="${fieldPath}.tr" value="${trValue}">`
                        }
                    </div>
                    <div class="lang-input-group">
                        <span class="lang-badge en">🇬🇧 EN</span>
                        ${isTextarea ?
                            `<textarea class="form-control" data-field="${fieldPath}.en">${enValue}</textarea>` :
                            `<input type="text" class="form-control" data-field="${fieldPath}.en" value="${enValue}">`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderSingleField(fieldInfo, value, fieldPath) {
        // Tek dil (icon, url vb.)
        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <input type="text" class="form-control" data-field="${fieldPath}" value="${value}">
            </div>
        `;
    }

    getSectionInfo(sectionKey) {
        const mapping = {
            'meta': { title: 'Meta Bilgileri', icon: 'bi bi-info-circle-fill' },
            'hero': { title: 'Hero Bölümü', icon: 'bi bi-image' },
            'help': { title: 'Yardım Bölümü', icon: 'bi bi-question-circle-fill' },
            'contact': { title: 'İletişim Bilgileri', icon: 'bi bi-telephone-fill' },
            'map': { title: 'Harita', icon: 'bi bi-map-fill' },
            'departments': { title: 'Birimler', icon: 'bi bi-building' },
            // ... diğer section'lar
        };

        return mapping[sectionKey] || {
            title: sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1),
            icon: 'bi bi-card-list'
        };
    }

    getFieldInfo(fieldKey) {
        const mapping = {
            'title': { label: 'Başlık', icon: 'bi bi-card-heading text-primary' },
            'description': { label: 'Açıklama', icon: 'bi bi-text-paragraph text-success' },
            'content': { label: 'İçerik', icon: 'bi bi-text-paragraph text-success' },
            'icon': { label: 'Icon', icon: 'bi bi-star text-warning' },
            'url': { label: 'URL', icon: 'bi bi-link-45deg text-info' },
            // ... diğer fieldlar
        };

        return mapping[fieldKey] || {
            label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1),
            icon: 'bi bi-pencil'
        };
    }
}
```

---

### ADIM 7: Accordion Card Component (2 saat)

**Dosya:** `assets/js/components/accordion-card.js`

```javascript
export default class AccordionCard {
    constructor(app) {
        this.app = app;
    }

    render(cardData, index, sectionKey) {
        const cardId = `card-${sectionKey}-${index}`;
        const cardTitle = this.getCardTitle(cardData);
        const cardIcon = cardData.icon || 'bi bi-card-text';

        return `
            <div class="accordion-card" data-card-index="${index}" data-section="${sectionKey}">
                ${this.renderHeader(cardId, index, cardTitle, cardIcon, sectionKey)}
                ${this.renderBody(cardId, cardData, sectionKey, index)}
            </div>
        `;
    }

    renderHeader(cardId, index, title, icon, sectionKey) {
        return `
            <div class="accordion-header" onclick="adminPanel.toggleAccordion('${cardId}')">
                <div class="accordion-title">
                    <div class="card-number">${index + 1}</div>
                    <i class="${icon} text-primary"></i>
                    <span>${title}</span>
                </div>
                <div class="accordion-actions">
                    <button class="btn-icon btn-up" onclick="event.stopPropagation(); adminPanel.moveCard('${sectionKey}', ${index}, 'up')">
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button class="btn-icon btn-down" onclick="event.stopPropagation(); adminPanel.moveCard('${sectionKey}', ${index}, 'down')">
                        <i class="bi bi-arrow-down"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="event.stopPropagation(); adminPanel.deleteCard('${sectionKey}', ${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                    <i class="bi bi-chevron-down chevron-icon"></i>
                </div>
            </div>
        `;
    }

    renderBody(cardId, cardData, sectionKey, index) {
        let html = `<div class="accordion-body" id="${cardId}">`;

        // Icon picker
        if (cardData.icon !== undefined) {
            html += this.renderIconPicker(cardData.icon, `${sectionKey}.${index}.icon`);
        }

        // Form fields
        for (const [fieldKey, fieldValue] of Object.entries(cardData)) {
            if (fieldKey === 'icon') continue; // Already rendered

            html += this.renderField(fieldKey, fieldValue, `${sectionKey}.${index}.${fieldKey}`);
        }

        html += '</div>';
        return html;
    }

    renderIconPicker(currentIcon, fieldPath) {
        return `
            <div class="form-group-lang mb-3">
                <label class="form-label-main">
                    <i class="bi bi-star text-warning"></i>
                    Icon
                </label>
                <div class="icon-picker-btn" onclick="adminPanel.openIconPicker('${fieldPath}')">
                    <div class="icon-preview">
                        <i class="${currentIcon}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${currentIcon}</div>
                        <small class="text-muted">Icon seçmek için tıklayın</small>
                    </div>
                    <i class="bi bi-chevron-right text-muted"></i>
                </div>
            </div>
        `;
    }

    renderField(fieldKey, fieldValue, fieldPath) {
        // Basitleştirilmiş - SectionRenderer'dan benzer mantık
        const isMultilang = typeof fieldValue === 'object' &&
                           (fieldValue.tr !== undefined || fieldValue.en !== undefined);

        if (isMultilang) {
            return this.renderMultilangField(fieldKey, fieldValue, fieldPath);
        } else {
            return this.renderSingleField(fieldKey, fieldValue, fieldPath);
        }
    }

    renderMultilangField(fieldKey, value, fieldPath) {
        const trValue = value.tr || '';
        const enValue = value.en || '';
        const isTextarea = trValue.length > 50;

        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="bi bi-pencil text-primary"></i>
                    ${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}
                </label>
                <div class="lang-inputs">
                    <div class="lang-input-group">
                        <span class="lang-badge">🇹🇷 TR</span>
                        ${isTextarea ?
                            `<textarea class="form-control" data-field="${fieldPath}.tr" onchange="adminPanel.onFieldChange(this)">${trValue}</textarea>` :
                            `<input type="text" class="form-control" data-field="${fieldPath}.tr" value="${trValue}" onchange="adminPanel.onFieldChange(this)">`
                        }
                    </div>
                    <div class="lang-input-group">
                        <span class="lang-badge en">🇬🇧 EN</span>
                        ${isTextarea ?
                            `<textarea class="form-control" data-field="${fieldPath}.en" onchange="adminPanel.onFieldChange(this)">${enValue}</textarea>` :
                            `<input type="text" class="form-control" data-field="${fieldPath}.en" value="${enValue}" onchange="adminPanel.onFieldChange(this)">`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    renderSingleField(fieldKey, value, fieldPath) {
        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="bi bi-pencil text-secondary"></i>
                    ${fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)}
                </label>
                <input type="text" class="form-control" data-field="${fieldPath}" value="${value}" onchange="adminPanel.onFieldChange(this)">
            </div>
        `;
    }

    getCardTitle(cardData) {
        // Try to get title from TR or EN
        if (cardData.title) {
            if (typeof cardData.title === 'object') {
                return cardData.title.tr || cardData.title.en || 'Başlıksız';
            }
            return cardData.title;
        }
        return 'Başlıksız';
    }
}
```

---

### ADIM 8: Change Tracker & Utilities (1 saat)

**Dosya:** `assets/js/utils/change-tracker.js`

```javascript
export default class ChangeTracker {
    constructor(app) {
        this.app = app;
        this.hasChangesFlag = false;
    }

    track() {
        this.hasChangesFlag = true;
        this.updateUI();
    }

    reset() {
        this.hasChangesFlag = false;
        this.updateUI();
    }

    hasChanges() {
        return this.hasChangesFlag;
    }

    updateUI() {
        const indicator = document.getElementById('changesIndicator');
        if (indicator) {
            indicator.style.display = this.hasChangesFlag ? 'flex' : 'none';
        }
    }
}
```

---

### ADIM 9: Preview Manager (1 saat)

**Dosya:** `assets/js/components/preview-manager.js`

```javascript
export default class PreviewManager {
    constructor(app) {
        this.app = app;
    }

    update(filePath) {
        const preview = document.getElementById('previewPanel');
        const previewBody = preview.querySelector('.preview-body');

        // Get HTML file from JSON path
        const htmlFile = this.getHTMLFromJSON(filePath);

        previewBody.innerHTML = `
            <iframe src="${htmlFile}" class="preview-iframe"></iframe>
        `;
    }

    getHTMLFromJSON(jsonPath) {
        // data/pages/iletisim.json -> iletisim.html
        const filename = jsonPath.split('/').pop().replace('.json', '.html');
        return filename;
    }
}
```

---

## 🧪 TEST PLANI

### Manual Test Checklist

- [ ] **Header**
  - [ ] Logo ve başlık görünüyor
  - [ ] Değişiklik göstergesi çalışıyor
  - [ ] İptal butonu çalışıyor
  - [ ] Kaydet butonu JSON indiriyor

- [ ] **Sidebar**
  - [ ] Toggle butonu açıp kapatıyor
  - [ ] Dosya listesi görünüyor
  - [ ] Arama çalışıyor
  - [ ] Dosya seçimi çalışıyor

- [ ] **Editor**
  - [ ] Tab geçişleri çalışıyor
  - [ ] Section kartları render oluyor
  - [ ] Accordion açılıp kapanıyor
  - [ ] Form alanları değiştirilebiliyor
  - [ ] ↑↓ ok butonları sıralama yapıyor
  - [ ] 🗑️ sil butonu çalışıyor
  - [ ] + Yeni kart ekleme çalışıyor

- [ ] **Preview**
  - [ ] Toggle butonu açıp kapatıyor
  - [ ] Resize handle çalışıyor
  - [ ] iframe doğru sayfa yüklüyor

- [ ] **Değişiklik Takibi**
  - [ ] Input değişince tracker güncelleniyor
  - [ ] Header'da gösterge görünüyor
  - [ ] İptal butonu değişiklikleri geri alıyor

### Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Edge
- [ ] Safari

### Responsive Testing

- [ ] 1920x1080 (Full HD)
- [ ] 1366x768 (Laptop)
- [ ] 1280x720 (HD)

---

## 🚀 DEPLOYMENT

### Production Build

1. **Dosyaları Deploy Et:**
```bash
# Tüm dosyaları sunucuya yükle
- admin-panel-v3.html
- assets/css/admin-panel-v3.css
- assets/js/admin-panel-v3.js
- assets/js/components/*.js
- assets/js/utils/*.js
```

2. **Cache Busting:**
```html
<link rel="stylesheet" href="assets/css/admin-panel-v3.css?v=1.0.0">
<script src="assets/js/admin-panel-v3.js?v=1.0.0"></script>
```

3. **Test:**
- Tüm fonksiyonları test et
- JSON kaydetme/indirme test et
- Farklı tarayıcılarda test et

---

## 📝 NOTLAR

### Önemli Hatırlatmalar

1. **Değişiklik Takibi:** Her input değişiminde `app.onDataChange()` çağrılmalı
2. **Deep Clone:** JSON kopyalarken `JSON.parse(JSON.stringify())` kullan
3. **Event Delegation:** Dinamik elementler için event delegation kullan
4. **Error Handling:** Tüm async işlemlerde try-catch kullan
5. **Validation:** JSON kaydetmeden önce validate et

### Gelecekteki İyileştirmeler

- [ ] Icon Picker Modal
- [ ] Image Uploader
- [ ] Drag & Drop Sıralama (opsiyonel)
- [ ] Undo/Redo
- [ ] Auto-save (LocalStorage)
- [ ] Keyboard Shortcuts
- [ ] Dark Mode
- [ ] Multi-file Edit

---

## 🆘 SORUN GİDERME

### Sık Karşılaşılan Hatalar

**1. JSON Yüklenmiyor:**
- Fetch path'i kontrol et
- CORS hatası var mı?
- JSON syntax'ı geçerli mi?

**2. Accordion Açılmıyor:**
- Event listener doğru mu?
- onclick fonksiyonu tanımlı mı?

**3. Değişiklikler Kaydedilmiyor:**
- `data-field` attribute'ları doğru mu?
- onchange event çalışıyor mu?
- Deep clone yapıldı mı?

**4. Preview Yüklenmiyor:**
- HTML dosyası var mı?
- iframe src doğru mu?

---

## ✅ TAMAMLANMA KRİTERLERİ

Proje aşağıdaki kriterler sağlandığında tamamlanmış sayılacak:

1. ✅ Tüm mockup özellikleri implement edildi
2. ✅ JSON dosyaları yüklenip düzenlenebiliyor
3. ✅ Değişiklikler kaydedilebiliyor
4. ✅ Sidebar ve preview gizlenebiliyor
5. ✅ Resize handle çalışıyor
6. ✅ Accordion kartlar çalışıyor
7. ✅ Tab sistemi çalışıyor
8. ✅ Tüm tarayıcılarda test edildi
9. ✅ Responsive çalışıyor
10. ✅ Dokümantasyon tamamlandı

---

**📅 Son Güncelleme:** 2025-11-26
**✍️ Hazırlayan:** Claude AI
**📝 Versiyon:** 1.0
**🎯 Durum:** Kodlamaya Hazır ✅
