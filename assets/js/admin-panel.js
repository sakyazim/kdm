/**
 * Admin Panel Dashboard
 * Tüm JSON dosyalarını görsel olarak düzenlemek için kapsamlı araç
 */

class AdminPanelDashboard {
    constructor() {
        this.files = {
            pages: [],
            content: [],
            global: [],
            agreements: []
        };
        this.currentFile = null;
        this.currentData = null;
        this.uploadModal = null;
        this.fullscreenModal = null;
        this.sidebarCollapsed = false;
        this.previewCollapsed = false;

        this.init();
    }

    async init() {
        await this.loadFileList();
        this.setupEventListeners();
        this.renderFileLists();
        this.uploadModal = new bootstrap.Modal(document.getElementById('uploadModal'));
        this.fullscreenModal = new bootstrap.Modal(document.getElementById('fullscreenJsonModal'));
        this.loadSidebarState();
        this.loadPreviewState();
    }

    async loadFileList() {
        // Tüm JSON dosyalarının listesi
        this.files = {
            pages: [
                'home', 'guncel-haberler', 'duyurular', 'databases', 'veritabanlari',
                'bilgisayar-laboratuvari', 'calisma-odalari', 'anadolu-arastirma',
                'koleksiyon-kat-plani', 'arastirmaci-profili-olusturma', 'makale-islem-ucretleri',
                'mendeley-referans-yonetim-araci', 'ill', 'uyelik-odunc-islemleri',
                'kime-sormaliyim', 'sss', 'egitim-programlari', 'personel',
                'tarihce-genel-bilgiler', 'kutuphane-kurallari', 'gizlilik',
                'kosullar', 'erisilebilirlik', 'formlar', 'organizasyon-semasi',
                'calisma-saatleri', 'iletisim', 'uzaktan-erisim'
            ],
            content: [
                'services', 'collections', 'announcements', 'modal', 'arrivals'
            ],
            global: [
                'settings', 'quickactions', 'footer', 'accessibility', 'header'
            ],
            agreements: [
                'veritabanlari-kullanim-sartlari', 'uzaktan-erisim-kullanim-sartlari'
            ]
        };

        // Dosya sayılarını güncelle
        document.getElementById('pagesCount').textContent = this.files.pages.length;
        document.getElementById('contentCount').textContent = this.files.content.length;
        document.getElementById('globalCount').textContent = this.files.global.length;
        document.getElementById('agreementsCount').textContent = this.files.agreements.length;

        const total = this.files.pages.length + this.files.content.length +
                      this.files.global.length + this.files.agreements.length;
        document.getElementById('fileCounter').textContent = `${total} Dosya`;
    }

    renderFileLists() {
        this.renderFileCategory('pages', 'pagesList', 'data/pages/');
        this.renderFileCategory('content', 'contentList', 'data/content/');
        this.renderFileCategory('global', 'globalList', 'data/global/');
        this.renderFileCategory('agreements', 'agreementsList', 'data/agreements/');
    }

    renderFileCategory(category, listId, basePath) {
        const listElement = document.getElementById(listId);
        listElement.innerHTML = '';

        this.files[category].forEach(filename => {
            const filePath = `${basePath}${filename}.json`;
            const displayName = this.formatFileName(filename);

            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <i class="bi bi-file-earmark-code-fill me-2 text-muted"></i>
                        ${displayName}
                    </span>
                    <i class="bi bi-chevron-right text-muted"></i>
                </div>
            `;

            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadFile(filePath, displayName);

                // Active state
                document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
            });

            listElement.appendChild(item);
        });
    }

    formatFileName(filename) {
        return filename
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async loadFile(filePath, displayName) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Dosya yüklenemedi');

            this.currentData = await response.json();
            this.currentFile = filePath;

            // UI güncellemeleri
            document.getElementById('currentFileName').innerHTML = `
                <i class="bi bi-file-earmark-code me-2"></i>${displayName}
            `;
            document.getElementById('currentFilePath').textContent = filePath;
            document.getElementById('welcomeScreen').style.display = 'none';
            document.getElementById('downloadJsonBtn').disabled = false;
            document.getElementById('uploadJsonBtn').disabled = false;
            document.getElementById('showJsonPreviewBtn').disabled = false;

            // Enable quick action buttons in header
            document.getElementById('quickDownloadBtn').disabled = false;
            document.getElementById('quickPreviewBtn').disabled = false;

            // Set live preview iframe source
            const livePreviewIframe = document.getElementById('livePreviewIframe');
            const htmlFileName = filePath.split('/').pop().replace('.json', '.html');
            livePreviewIframe.src = htmlFileName;

            // Check if this is a Content file - use Master-Detail layout
            const isContentFile = filePath.includes('data/content/');

            if (isContentFile && this.currentData.cards && Array.isArray(this.currentData.cards)) {
                // Use Master-Detail layout for Content files with cards
                this.renderMasterDetail();
            } else {
                // Use standard form layout for other files
                document.getElementById('editorForm').style.display = 'block';
                document.getElementById('masterDetailContainer').style.display = 'none';
                this.renderForm();
            }

        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            alert('JSON dosyası yüklenirken bir hata oluştu!');
        }
    }

    renderForm() {
        // Show enhanced UI elements
        document.getElementById('breadcrumbContainer').style.display = 'block';
        document.getElementById('fieldSearchContainer').style.display = 'block';
        document.getElementById('sectionTabsContainer').style.display = 'block';

        // Render tabs for main JSON sections
        this.renderSectionTabs();
    }

    renderSectionTabs() {
        const tabsContainer = document.getElementById('sectionTabs');
        const tabContentContainer = document.getElementById('sectionTabContent');

        tabsContainer.innerHTML = '';
        tabContentContainer.innerHTML = '';

        const sections = Object.keys(this.currentData);

        sections.forEach((section, index) => {
            const sectionData = this.currentData[section];
            const isActive = index === 0;

            // Count fields in section
            const fieldCount = this.countFields(sectionData);

            // Get icon for section
            const icon = this.getSectionIcon(section);

            // Create tab
            const tabLi = document.createElement('li');
            tabLi.className = 'nav-item';
            tabLi.innerHTML = `
                <a class="nav-link ${isActive ? 'active' : ''}"
                   id="${section}-tab"
                   data-bs-toggle="tab"
                   href="#${section}-content"
                   role="tab"
                   data-section-name="${section}">
                    <i class="${icon}"></i>
                    ${this.formatLabel(section)}
                    <span class="section-count">${fieldCount}</span>
                </a>
            `;

            // Tab'a tıklandığında önizlemede ilgili section'a scroll
            const tabLink = tabLi.querySelector('.nav-link');
            tabLink.addEventListener('shown.bs.tab', () => {
                this.scrollPreviewToSection(section);
            });

            tabsContainer.appendChild(tabLi);

            // Create tab content
            const tabPane = document.createElement('div');
            tabPane.className = `tab-pane fade ${isActive ? 'show active' : ''}`;
            tabPane.id = `${section}-content`;
            tabPane.role = 'tabpanel';

            // Render section content with collapsible structure
            this.renderSectionContent(sectionData, section, tabPane);

            tabContentContainer.appendChild(tabPane);
        });
    }

    scrollPreviewToSection(sectionName) {
        const livePreviewIframe = document.getElementById('livePreviewIframe');
        if (!livePreviewIframe || !livePreviewIframe.contentWindow) return;

        try {
            const iframeDoc = livePreviewIframe.contentWindow.document;

            // Farklı section adlarına göre selector'lar
            const selectorMap = {
                'meta': 'head, meta, title',
                'hero': '[class*="hero"], .hero-section, #hero',
                'content': 'main, .content, #content, [class*="content-section"]',
                'help': '[class*="help"], .help-section, #help-section',
                'footer': 'footer, .footer',
                'header': 'header, .header, nav',
                'cards': '[class*="card"], .cards-section',
                'buttons': '[class*="button"], .buttons-section',
            };

            const selector = selectorMap[sectionName.toLowerCase()] || `#${sectionName}, .${sectionName}`;
            const element = iframeDoc.querySelector(selector);

            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });

                // Geçici vurgulama efekti
                element.style.outline = '3px solid #ffc107';
                element.style.outlineOffset = '5px';
                setTimeout(() => {
                    element.style.outline = '';
                    element.style.outlineOffset = '';
                }, 2000);
            }
        } catch (error) {
            console.log('Önizleme scroll hatası (cross-origin olabilir):', error.message);
        }
    }

    renderSectionContent(data, sectionName, container) {
        if (Array.isArray(data)) {
            this.renderArray(data, sectionName, sectionName, container, 0);
        } else if (typeof data === 'object' && data !== null) {
            // Render each property as a collapsible section
            Object.keys(data).forEach((key, index) => {
                const value = data[key];
                const fullPath = `${sectionName}.${key}`;
                const isFirstItem = index === 0;

                this.renderCollapsibleSection(key, value, fullPath, container, 0, isFirstItem);
            });
        } else {
            this.renderField(sectionName, data, sectionName, container, 0);
        }
    }

    renderCollapsibleSection(label, value, path, container, level, isExpanded = false) {
        const section = document.createElement('div');
        section.className = 'collapsible-section';
        section.dataset.path = path;

        const header = document.createElement('div');
        header.className = `collapsible-header ${isExpanded ? '' : 'collapsed'}`;

        const typeIcon = this.getTypeIcon(value);
        const typeBadge = this.getTypeBadge(value);

        header.innerHTML = `
            <div class="collapsible-title">
                <i class="${typeIcon}"></i>
                <span>${this.formatLabel(label)}</span>
                ${typeBadge}
            </div>
            <i class="bi bi-chevron-right collapsible-icon"></i>
        `;

        const content = document.createElement('div');
        content.className = 'collapsible-content';
        content.style.display = isExpanded ? 'block' : 'none';

        const body = document.createElement('div');
        body.className = 'collapsible-body';

        // Render content based on type
        if (Array.isArray(value)) {
            this.renderArray(value, path, label, body, level + 1);
        } else if (typeof value === 'object' && value !== null) {
            this.renderObject(value, path, body, level + 1);
        } else {
            this.renderField(label, value, path, body, level + 1);
        }

        content.appendChild(body);
        section.appendChild(header);
        section.appendChild(content);
        container.appendChild(section);

        // Toggle functionality
        header.addEventListener('click', () => {
            const isCollapsed = header.classList.contains('collapsed');
            header.classList.toggle('collapsed');

            // Smooth toggle animation
            if (isCollapsed) {
                content.style.display = 'block';
                requestAnimationFrame(() => {
                    content.style.opacity = '0';
                    content.style.maxHeight = '0';
                    requestAnimationFrame(() => {
                        content.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
                        content.style.opacity = '1';
                        content.style.maxHeight = '5000px';
                    });
                });
            } else {
                content.style.opacity = '0';
                content.style.maxHeight = '0';
                setTimeout(() => {
                    content.style.display = 'none';
                }, 300);
            }

            this.updateBreadcrumb(path);
        });
    }

    getTypeIcon(value) {
        if (Array.isArray(value)) return 'bi bi-list-ul';
        if (typeof value === 'object' && value !== null) return 'bi bi-braces';
        if (typeof value === 'boolean') return 'bi bi-toggle-on';
        if (typeof value === 'number') return 'bi bi-hash';
        return 'bi bi-fonts';
    }

    getTypeBadge(value) {
        let type = 'string';
        if (Array.isArray(value)) type = 'array';
        else if (typeof value === 'object' && value !== null) type = 'object';
        else if (typeof value === 'boolean') type = 'boolean';
        else if (typeof value === 'number') type = 'number';

        const count = Array.isArray(value) ? value.length :
                      (typeof value === 'object' && value !== null) ? Object.keys(value).length : '';

        return `<span class="field-type-badge field-type-${type}">${type}${count ? ` (${count})` : ''}</span>`;
    }

    countFields(obj, depth = 0) {
        if (depth > 3) return 0; // Prevent deep counting

        let count = 0;
        if (Array.isArray(obj)) {
            count = obj.length;
        } else if (typeof obj === 'object' && obj !== null) {
            count = Object.keys(obj).length;
        } else {
            count = 1;
        }
        return count;
    }

    getSectionIcon(sectionName) {
        const icons = {
            meta: 'bi bi-info-circle',
            hero: 'bi bi-star',
            content: 'bi bi-file-text',
            help: 'bi bi-question-circle',
            footer: 'bi bi-layout-bottom',
            header: 'bi bi-layout-top',
            settings: 'bi bi-gear',
            cards: 'bi bi-card-list',
            buttons: 'bi bi-ui-radios',
            items: 'bi bi-grid',
            links: 'bi bi-link-45deg'
        };
        return icons[sectionName.toLowerCase()] || 'bi bi-folder';
    }

    updateBreadcrumb(path) {
        const breadcrumbNav = document.getElementById('breadcrumbNav');
        const parts = path.split('.');

        breadcrumbNav.innerHTML = '';

        parts.forEach((part, index) => {
            const li = document.createElement('li');
            li.className = `breadcrumb-item ${index === parts.length - 1 ? 'active' : ''}`;
            li.textContent = this.formatLabel(part.replace(/\[\d+\]/, ''));
            breadcrumbNav.appendChild(li);
        });
    }

    renderObject(obj, path, container, level = 0) {
        Object.keys(obj).forEach((key, index) => {
            const value = obj[key];
            const fullPath = path ? `${path}.${key}` : key;

            // Simple fields render directly
            if (!Array.isArray(value) && (typeof value !== 'object' || value === null)) {
                this.renderField(key, value, fullPath, container, level);
            }
            // Complex structures use collapsible sections
            else if (level < 3) {
                this.renderCollapsibleSection(key, value, fullPath, container, level, false);
            }
            // Deep nested items render as simple cards
            else {
                if (Array.isArray(value)) {
                    this.renderArray(value, fullPath, key, container, level);
                } else if (typeof value === 'object' && value !== null) {
                    this.renderNestedObject(value, fullPath, key, container, level);
                }
            }
        });
    }

    renderNestedObject(obj, path, label, container, level) {
        const card = document.createElement('div');
        card.className = `card mb-3 ms-${level * 3}`;
        card.innerHTML = `
            <div class="card-header bg-light">
                <strong><i class="bi bi-braces me-2"></i>${this.formatLabel(label)}</strong>
            </div>
            <div class="card-body nested-object"></div>
        `;

        container.appendChild(card);
        const nestedContainer = card.querySelector('.nested-object');
        this.renderObject(obj, path, nestedContainer, level + 1);
    }

    renderArray(arr, path, label, container, level) {
        const arrayCard = document.createElement('div');
        arrayCard.className = `card mb-3 border-primary array-item-enhanced`;
        arrayCard.dataset.arrayPath = path;
        arrayCard.innerHTML = `
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <strong><i class="bi bi-list-ul me-2"></i>${this.formatLabel(label)}</strong>
                <span class="badge bg-light text-dark me-2">${arr.length} öğe</span>
                <button type="button" class="btn btn-sm btn-light add-array-item add-array-item-top">
                    <i class="bi bi-plus-lg"></i> Ekle
                </button>
            </div>
            <div class="card-body array-container p-3"></div>
            <div class="card-footer bg-light d-flex justify-content-end">
                <button type="button" class="btn btn-sm btn-primary add-array-item add-array-item-bottom">
                    <i class="bi bi-plus-lg"></i> Ekle
                </button>
            </div>
        `;

        container.appendChild(arrayCard);
        const arrayContainer = arrayCard.querySelector('.array-container');

        // Her array item için
        arr.forEach((item, index) => {
            this.renderArrayItem(item, `${path}[${index}]`, index, arrayContainer, level, arr.length);
        });

        // Yeni item ekleme fonksiyonu (ortak kullanım için)
        const addNewItem = () => {
            let newItem;

            // Array boş değilse, son dolu öğeyi bul ve kopyala
            if (arr.length > 0) {
                // Son dolu öğeyi bul (boş string/object olmayanı)
                let templateItem = arr[arr.length - 1];
                for (let i = arr.length - 1; i >= 0; i--) {
                    const item = arr[i];
                    if (typeof item === 'string' && item.trim() !== '') {
                        templateItem = item;
                        break;
                    } else if (typeof item === 'object' && item !== null) {
                        if (Array.isArray(item) && item.length > 0) {
                            templateItem = item;
                            break;
                        } else if (!Array.isArray(item) && Object.keys(item).length > 0) {
                            templateItem = item;
                            break;
                        }
                    }
                }

                // Deep clone template item
                if (Array.isArray(templateItem)) {
                    newItem = JSON.parse(JSON.stringify(templateItem));
                } else if (typeof templateItem === 'object' && templateItem !== null) {
                    newItem = JSON.parse(JSON.stringify(templateItem));
                } else if (typeof templateItem === 'string') {
                    newItem = 'Yeni öğe'; // String array için varsayılan değer
                } else if (typeof templateItem === 'number') {
                    newItem = 0;
                } else if (typeof templateItem === 'boolean') {
                    newItem = false;
                } else {
                    newItem = '';
                }
            } else {
                // Array boşsa varsayılan değer
                newItem = '';
            }

            arr.push(newItem);

            // Sadece bu array'i yeniden render et
            arrayContainer.innerHTML = '';
            arr.forEach((item, index) => {
                this.renderArrayItem(item, `${path}[${index}]`, index, arrayContainer, level, arr.length);
            });

            // Badge güncelle
            arrayCard.querySelector('.badge').textContent = `${arr.length} öğe`;

            this.updatePreview();
        };

        // Hem üst hem alt Ekle butonlarına aynı fonksiyonu bağla
        arrayCard.querySelector('.add-array-item-top').addEventListener('click', addNewItem);
        arrayCard.querySelector('.add-array-item-bottom').addEventListener('click', addNewItem);
    }

    renderArrayItem(item, path, index, container, level, totalItems) {
        const itemCard = document.createElement('div');
        // Alternatif renkler: çift index = primary, tek index = tertiary
        const colorClass = index % 2 === 0 ? 'array-item-primary' : 'array-item-tertiary';
        itemCard.className = `card mb-3 ${colorClass}`;
        itemCard.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center py-2">
                <strong class="small"><i class="bi bi-file-earmark-fill me-2"></i>Öğe #${index + 1}</strong>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-danger delete-item" title="Sil">
                        <i class="bi bi-trash"></i>
                    </button>
                    ${index > 0 ? '<button type="button" class="btn btn-outline-secondary move-up" title="Yukarı"><i class="bi bi-arrow-up"></i></button>' : ''}
                    ${index < totalItems - 1 ? '<button type="button" class="btn btn-outline-secondary move-down" title="Aşağı"><i class="bi bi-arrow-down"></i></button>' : ''}
                </div>
            </div>
            <div class="card-body py-3 item-content"></div>
        `;

        const itemContent = itemCard.querySelector('.item-content');

        if (typeof item === 'object' && !Array.isArray(item)) {
            this.renderObject(item, path, itemContent, level + 1);
        } else if (Array.isArray(item)) {
            this.renderArray(item, path, 'items', itemContent, level + 1);
        } else {
            // String, number, boolean array item'lar için direkt path kullan
            this.renderPrimitiveArrayItem(item, path, itemContent, container, level);
        }

        // Silme işlemi
        itemCard.querySelector('.delete-item').addEventListener('click', () => {
            const pathParts = path.match(/(.+)\[(\d+)\]/);
            if (pathParts) {
                const arrayPath = pathParts[1];
                const arr = this.getValueByPath(arrayPath);
                arr.splice(parseInt(pathParts[2]), 1);

                // Sadece bu array'i yeniden render et
                const arrayCard = container.closest('.array-item-enhanced');
                if (arrayCard) {
                    const arrayContainer = arrayCard.querySelector('.array-container');
                    arrayContainer.innerHTML = '';
                    arr.forEach((item, idx) => {
                        this.renderArrayItem(item, `${arrayPath}[${idx}]`, idx, arrayContainer, level, arr.length);
                    });
                    arrayCard.querySelector('.badge').textContent = `${arr.length} öğe`;
                }

                this.updatePreview();
            }
        });

        // Move up
        const moveUpBtn = itemCard.querySelector('.move-up');
        if (moveUpBtn) {
            moveUpBtn.addEventListener('click', () => {
                const pathParts = path.match(/(.+)\[(\d+)\]/);
                if (pathParts) {
                    const arrayPath = pathParts[1];
                    const arr = this.getValueByPath(arrayPath);
                    const idx = parseInt(pathParts[2]);
                    [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]];

                    // Sadece bu array'i yeniden render et
                    const arrayCard = container.closest('.array-item-enhanced');
                    if (arrayCard) {
                        const arrayContainer = arrayCard.querySelector('.array-container');
                        arrayContainer.innerHTML = '';
                        arr.forEach((item, i) => {
                            this.renderArrayItem(item, `${arrayPath}[${i}]`, i, arrayContainer, level, arr.length);
                        });
                    }

                    this.updatePreview();
                }
            });
        }

        // Move down
        const moveDownBtn = itemCard.querySelector('.move-down');
        if (moveDownBtn) {
            moveDownBtn.addEventListener('click', () => {
                const pathParts = path.match(/(.+)\[(\d+)\]/);
                if (pathParts) {
                    const arrayPath = pathParts[1];
                    const arr = this.getValueByPath(arrayPath);
                    const idx = parseInt(pathParts[2]);
                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];

                    // Sadece bu array'i yeniden render et
                    const arrayCard = container.closest('.array-item-enhanced');
                    if (arrayCard) {
                        const arrayContainer = arrayCard.querySelector('.array-container');
                        arrayContainer.innerHTML = '';
                        arr.forEach((item, i) => {
                            this.renderArrayItem(item, `${arrayPath}[${i}]`, i, arrayContainer, level, arr.length);
                        });
                    }

                    this.updatePreview();
                }
            });
        }

        container.appendChild(itemCard);
    }

    renderPrimitiveArrayItem(value, path, itemContent, arrayContainer, level) {
        const pathParts = path.match(/(.+)\[(\d+)\]/);
        if (!pathParts) return;

        const arrayPath = pathParts[1];
        const index = parseInt(pathParts[2]);

        const formGroup = document.createElement('div');
        formGroup.className = 'mb-3';

        const label = document.createElement('label');
        label.className = 'form-label fw-bold';
        label.textContent = 'Değer';

        let input;

        // Renk değerleri için color picker
        if (typeof value === 'string' && value.match(/^#[0-9A-Fa-f]{6}$/)) {
            input = document.createElement('input');
            input.type = 'color';
            input.className = 'form-control form-control-color';
            input.value = value;
        }
        // Boolean değerler için checkbox
        else if (typeof value === 'boolean') {
            const checkWrapper = document.createElement('div');
            checkWrapper.className = 'form-check form-switch';
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.checked = value;
            const checkLabel = document.createElement('label');
            checkLabel.className = 'form-check-label';
            checkLabel.textContent = value ? 'Aktif' : 'Pasif';
            checkWrapper.appendChild(input);
            checkWrapper.appendChild(checkLabel);
            formGroup.appendChild(label);
            formGroup.appendChild(checkWrapper);
            itemContent.appendChild(formGroup);

            input.addEventListener('change', () => {
                const arr = this.getValueByPath(arrayPath);
                arr[index] = input.checked;
                checkLabel.textContent = input.checked ? 'Aktif' : 'Pasif';
                this.updatePreview();
            });
            return;
        }
        // Uzun metinler için textarea
        else if (typeof value === 'string' && value.length > 100) {
            input = document.createElement('textarea');
            input.className = 'form-control';
            input.rows = 4;
            input.value = value;
        }
        // Sayılar için number input
        else if (typeof value === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            input.value = value;
        }
        // Diğerleri için text input
        else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.value = value || '';
        }

        input.addEventListener('input', () => {
            const arr = this.getValueByPath(arrayPath);
            let newValue = input.value;
            if (input.type === 'number') {
                newValue = parseFloat(newValue);
            }
            arr[index] = newValue;
            this.updatePreview();
        });

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        itemContent.appendChild(formGroup);
    }

    renderField(key, value, path, container, level) {
        const formGroup = document.createElement('div');
        formGroup.className = `mb-3 ms-${level * 2}`;

        const label = document.createElement('label');
        label.className = 'form-label fw-bold';
        label.textContent = this.formatLabel(key);

        let input;

        // Renk değerleri için color picker
        if (typeof value === 'string' && value.match(/^#[0-9A-Fa-f]{6}$/)) {
            input = document.createElement('input');
            input.type = 'color';
            input.className = 'form-control form-control-color';
            input.value = value;
        }
        // Boolean değerler için checkbox
        else if (typeof value === 'boolean') {
            const checkWrapper = document.createElement('div');
            checkWrapper.className = 'form-check form-switch';
            input = document.createElement('input');
            input.type = 'checkbox';
            input.className = 'form-check-input';
            input.checked = value;
            const checkLabel = document.createElement('label');
            checkLabel.className = 'form-check-label';
            checkLabel.textContent = value ? 'Aktif' : 'Pasif';
            checkWrapper.appendChild(input);
            checkWrapper.appendChild(checkLabel);
            formGroup.appendChild(label);
            formGroup.appendChild(checkWrapper);
            container.appendChild(formGroup);

            input.addEventListener('change', () => {
                this.setValueByPath(path, input.checked);
                checkLabel.textContent = input.checked ? 'Aktif' : 'Pasif';
                this.updatePreview();
            });
            return;
        }
        // Uzun metinler için textarea
        else if (typeof value === 'string' && value.length > 100) {
            input = document.createElement('textarea');
            input.className = 'form-control';
            input.rows = 4;
            input.value = value;
        }
        // Sayılar için number input
        else if (typeof value === 'number') {
            input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control';
            input.value = value;
        }
        // Diğerleri için text input
        else {
            input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-control';
            input.value = value || '';
        }

        input.addEventListener('input', () => {
            let newValue = input.value;
            if (input.type === 'number') {
                newValue = parseFloat(newValue);
            }
            this.setValueByPath(path, newValue);
            this.updatePreview();
        });

        formGroup.appendChild(label);
        formGroup.appendChild(input);
        container.appendChild(formGroup);
    }

    formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/_/g, ' ')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    getValueByPath(path) {
        return path.split(/\.|[\[\]]/).filter(Boolean).reduce((obj, key) => {
            return obj ? obj[key] : undefined;
        }, this.currentData);
    }

    setValueByPath(path, value) {
        const keys = path.split(/\.|[\[\]]/).filter(Boolean);
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key], this.currentData);
        target[lastKey] = value;
    }

    updatePreview() {
        // Update preview only if elements exist (optional preview panel)
        const preview = document.getElementById('jsonPreview');
        if (preview) {
            const jsonString = JSON.stringify(this.currentData, null, 2);
            preview.innerHTML = `<code>${this.syntaxHighlight(jsonString)}</code>`;

            // Size ve status
            const jsonSize = document.getElementById('jsonSize');
            if (jsonSize) {
                jsonSize.textContent = `${jsonString.length} karakter`;
            }

            const jsonStatus = document.getElementById('jsonStatus');
            if (jsonStatus) {
                try {
                    JSON.parse(jsonString);
                    jsonStatus.className = 'badge bg-success';
                    jsonStatus.textContent = 'Geçerli';
                } catch (e) {
                    jsonStatus.className = 'badge bg-danger';
                    jsonStatus.textContent = 'Hatalı';
                }
            }
        }

        // Update live preview iframe
        const livePreviewIframe = document.getElementById('livePreviewIframe');
        if (livePreviewIframe && livePreviewIframe.src && livePreviewIframe.src !== 'about:blank') {
            // Reload iframe to show changes
            livePreviewIframe.contentWindow.location.reload();
        }
    }

    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'text-warning';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'text-info fw-bold';
                } else {
                    cls = 'text-success';
                }
            } else if (/true|false/.test(match)) {
                cls = 'text-primary';
            } else if (/null/.test(match)) {
                cls = 'text-muted';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }

    setupEventListeners() {
        // Sidebar Toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        const sidebarColumn = document.getElementById('sidebarColumn');
        const editorColumn = document.getElementById('editorColumn');

        sidebarToggle.addEventListener('click', () => {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            sidebarColumn.classList.toggle('sidebar-collapsed');

            // Update icon
            const icon = sidebarToggle.querySelector('i');
            icon.className = this.sidebarCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left';

            // Auto-adjust editor column
            if (this.sidebarCollapsed) {
                editorColumn.classList.remove('col-lg-5');
                editorColumn.classList.add('col-lg-7');
            } else {
                editorColumn.classList.remove('col-lg-7');
                editorColumn.classList.add('col-lg-5');
            }

            this.saveSidebarState();
        });

        // Preview Toggle (both buttons)
        const previewToggle = document.getElementById('previewToggle');
        const previewCollapseBtn = document.getElementById('previewCollapseBtn');
        const previewColumn = document.getElementById('livePreviewColumn');

        const togglePreview = () => {
            this.previewCollapsed = !this.previewCollapsed;
            previewColumn.classList.toggle('preview-collapsed');

            // Update toggle button icon
            const toggleIcon = previewToggle.querySelector('i');
            toggleIcon.className = this.previewCollapsed ? 'bi bi-chevron-left' : 'bi bi-chevron-right';

            // Update collapse button icon
            const collapseIcon = previewCollapseBtn.querySelector('i');
            collapseIcon.className = this.previewCollapsed ? 'bi bi-arrows-angle-expand' : 'bi bi-arrows-angle-contract';

            // Auto-adjust editor column
            if (this.previewCollapsed) {
                if (this.sidebarCollapsed) {
                    editorColumn.classList.remove('col-lg-7');
                    editorColumn.classList.add('col-lg-12');
                } else {
                    editorColumn.classList.remove('col-lg-5');
                    editorColumn.classList.add('col-lg-10');
                }
            } else {
                if (this.sidebarCollapsed) {
                    editorColumn.classList.remove('col-lg-12');
                    editorColumn.classList.add('col-lg-7');
                } else {
                    editorColumn.classList.remove('col-lg-10');
                    editorColumn.classList.add('col-lg-5');
                }
            }

            this.savePreviewState();
        };

        previewToggle.addEventListener('click', togglePreview);
        previewCollapseBtn.addEventListener('click', togglePreview);

        // Quick Action Buttons (Header)
        document.getElementById('quickDownloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        document.getElementById('quickPreviewBtn').addEventListener('click', () => {
            this.openFullscreenJson();
            this.fullscreenModal.show();
        });

        // Dark Mode Toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        darkModeToggle.addEventListener('click', () => {
            const currentTheme = document.body.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.body.setAttribute('data-bs-theme', newTheme);
            darkModeToggle.innerHTML = newTheme === 'dark'
                ? '<i class="bi bi-sun-fill"></i>'
                : '<i class="bi bi-moon-fill"></i>';
        });

        // Download JSON
        document.getElementById('downloadJsonBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        // Upload JSON
        document.getElementById('uploadJsonBtn').addEventListener('click', () => {
            this.uploadModal.show();
        });

        document.getElementById('confirmUpload').addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput.files.length > 0) {
                this.uploadJSON(fileInput.files[0]);
            }
        });

        // Copy JSON (from fullscreen modal)
        document.getElementById('fullscreenCopyBtn').addEventListener('click', () => {
            const jsonString = JSON.stringify(this.currentData, null, 2);
            navigator.clipboard.writeText(jsonString).then(() => {
                const btn = document.getElementById('fullscreenCopyBtn');
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Kopyalandı!';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 2000);
            });
        });

        // Fullscreen Download (from fullscreen modal)
        document.getElementById('fullscreenDownloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        // Show JSON Preview Button (new)
        document.getElementById('showJsonPreviewBtn').addEventListener('click', () => {
            this.openFullscreenJson();
        });

        // File Search
        document.getElementById('fileSearch').addEventListener('input', (e) => {
            this.searchFiles(e.target.value.toLowerCase());
        });

        // Field Search
        document.getElementById('fieldSearch').addEventListener('input', (e) => {
            this.searchFields(e.target.value.toLowerCase());
        });

        document.getElementById('clearFieldSearch').addEventListener('click', () => {
            document.getElementById('fieldSearch').value = '';
            this.clearFieldSearch();
        });
    }

    searchFiles(query) {
        document.querySelectorAll('.list-group-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'block' : 'none';
        });
    }

    downloadJSON() {
        const jsonString = JSON.stringify(this.currentData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Toast mesajı
        this.showToast('Dosya indirildi!', 'success');
    }

    uploadJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                this.currentData = json;
                this.renderForm();
                this.updatePreview();
                this.uploadModal.hide();
                this.showToast('Dosya yüklendi!', 'success');
            } catch (error) {
                alert('Geçersiz JSON dosyası!');
            }
        };
        reader.readAsText(file);
    }

    showToast(message, type = 'info') {
        // Basit bir toast notification
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.innerHTML = `
            <i class="bi bi-check-circle-fill me-2"></i>${message}
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    openFullscreenJson() {
        const jsonString = JSON.stringify(this.currentData, null, 2);
        const fullscreenPreview = document.getElementById('fullscreenJsonPreview');

        fullscreenPreview.innerHTML = `<code>${this.syntaxHighlight(jsonString)}</code>`;

        // Update metadata
        document.getElementById('fullscreenJsonSize').textContent = `${jsonString.length} karakter`;
        document.getElementById('fullscreenFileName').textContent = `Dosya: ${this.currentFile}`;

        // Validate JSON
        try {
            JSON.parse(jsonString);
            document.getElementById('fullscreenJsonStatus').className = 'badge bg-success';
            document.getElementById('fullscreenJsonStatus').textContent = 'Geçerli';
        } catch (e) {
            document.getElementById('fullscreenJsonStatus').className = 'badge bg-danger';
            document.getElementById('fullscreenJsonStatus').textContent = 'Hatalı';
        }
    }

    // Field Search and Highlighting
    searchFields(query) {
        this.clearFieldSearch();

        if (!query || query.length < 2) {
            document.getElementById('searchResultCount').textContent = '';
            return;
        }

        let matchCount = 0;
        const allSections = document.querySelectorAll('.collapsible-section');

        allSections.forEach(section => {
            const path = section.dataset.path || '';
            const label = section.querySelector('.collapsible-title span');

            if (label && label.textContent.toLowerCase().includes(query)) {
                matchCount++;
                section.classList.add('search-match');
                label.innerHTML = this.highlightText(label.textContent, query);

                // Expand parent sections
                this.expandSection(section);
            }
        });

        // Also search in form labels
        document.querySelectorAll('.form-label').forEach(label => {
            const text = label.textContent.toLowerCase();
            if (text.includes(query)) {
                matchCount++;
                const formGroup = label.closest('.mb-3');
                if (formGroup) {
                    formGroup.classList.add('field-highlight');
                    label.innerHTML = this.highlightText(label.textContent, query);
                }

                // Expand parent collapsible
                const parentSection = label.closest('.collapsible-section');
                if (parentSection) {
                    this.expandSection(parentSection);
                }
            }
        });

        document.getElementById('searchResultCount').textContent =
            matchCount > 0 ? `${matchCount} sonuç bulundu` : 'Sonuç bulunamadı';
    }

    clearFieldSearch() {
        // Remove highlights
        document.querySelectorAll('.search-match').forEach(el => {
            el.classList.remove('search-match');
        });

        document.querySelectorAll('.field-highlight').forEach(el => {
            el.classList.remove('field-highlight');
        });

        // Restore original text
        document.querySelectorAll('.collapsible-title span, .form-label').forEach(el => {
            if (el.querySelector('.search-highlight')) {
                el.textContent = el.textContent; // Remove HTML
            }
        });

        document.getElementById('searchResultCount').textContent = '';
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    expandSection(section) {
        const header = section.querySelector('.collapsible-header');
        const content = section.querySelector('.collapsible-content');

        if (header && content) {
            header.classList.remove('collapsed');
            content.style.display = 'block';
            content.style.opacity = '1';
            content.style.maxHeight = '5000px';
            content.style.transition = 'opacity 0.3s ease, max-height 0.3s ease';
        }

        // Recursively expand parent sections
        const parentSection = section.parentElement.closest('.collapsible-section');
        if (parentSection && parentSection !== section) {
            this.expandSection(parentSection);
        }
    }

    // Sidebar state management
    saveSidebarState() {
        try {
            localStorage.setItem('adminPanel_sidebarCollapsed', this.sidebarCollapsed);
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    loadSidebarState() {
        try {
            const saved = localStorage.getItem('adminPanel_sidebarCollapsed');
            if (saved !== null) {
                this.sidebarCollapsed = saved === 'true';
                if (this.sidebarCollapsed) {
                    const sidebarColumn = document.getElementById('sidebarColumn');
                    const editorColumn = document.getElementById('editorColumn');
                    const sidebarToggle = document.getElementById('sidebarToggle');

                    sidebarColumn.classList.add('sidebar-collapsed');
                    editorColumn.classList.remove('col-lg-5');
                    editorColumn.classList.add('col-lg-7');
                    sidebarToggle.querySelector('i').className = 'bi bi-chevron-right';
                }
            }
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    // Preview state management
    savePreviewState() {
        try {
            localStorage.setItem('adminPanel_previewCollapsed', this.previewCollapsed);
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    loadPreviewState() {
        try {
            const saved = localStorage.getItem('adminPanel_previewCollapsed');
            if (saved !== null) {
                this.previewCollapsed = saved === 'true';
                if (this.previewCollapsed) {
                    const previewColumn = document.getElementById('livePreviewColumn');
                    const editorColumn = document.getElementById('editorColumn');
                    const previewToggle = document.getElementById('previewToggle');
                    const previewCollapseBtn = document.getElementById('previewCollapseBtn');

                    previewColumn.classList.add('preview-collapsed');
                    previewToggle.querySelector('i').className = 'bi bi-chevron-left';
                    previewCollapseBtn.querySelector('i').className = 'bi bi-arrows-angle-expand';

                    if (this.sidebarCollapsed) {
                        editorColumn.classList.remove('col-lg-7');
                        editorColumn.classList.add('col-lg-12');
                    } else {
                        editorColumn.classList.remove('col-lg-5');
                        editorColumn.classList.add('col-lg-10');
                    }
                }
            }
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    // ===== MASTER-DETAIL LAYOUT METHODS (v3.0.0) =====

    renderMasterDetail() {
        // Hide standard editor, show master-detail
        document.getElementById('editorForm').style.display = 'none';
        document.getElementById('breadcrumbContainer').style.display = 'none';
        document.getElementById('fieldSearchContainer').style.display = 'none';
        document.getElementById('sectionTabsContainer').style.display = 'none';
        document.getElementById('masterDetailContainer').style.display = 'flex';

        // Initialize Master-Detail Editor
        this.masterDetailEditor = new MasterDetailEditor(this.currentData, this);
        this.masterDetailEditor.init();
    }
}

/**
 * Master-Detail Editor Class
 * Handles Content files with card arrays
 */
class MasterDetailEditor {
    constructor(data, parentDashboard) {
        this.data = data;
        this.parentDashboard = parentDashboard;
        this.selectedIndex = null;
        this.resizing = false;
        this.masterWidth = this.loadMasterWidth();
    }

    init() {
        this.renderMasterList();
        this.setupResizeHandle();
        this.setupEventListeners();
        this.applyMasterWidth();
    }

    renderMasterList() {
        const masterItems = document.getElementById('masterItems');
        const masterCardCount = document.getElementById('masterCardCount');
        const cards = this.data.cards || [];

        masterItems.innerHTML = '';
        masterCardCount.textContent = cards.length;

        if (cards.length === 0) {
            masterItems.innerHTML = `
                <div class="text-center text-muted p-4">
                    <i class="bi bi-inbox display-4 mb-3"></i>
                    <p>Henüz kart yok. "+" butonuna tıklayarak yeni kart ekleyin.</p>
                </div>
            `;
            return;
        }

        cards.forEach((card, index) => {
            const item = document.createElement('div');
            item.className = `master-item ${this.selectedIndex === index ? 'active' : ''}`;
            item.dataset.index = index;

            // Determine content type
            const contentType = Array.isArray(card.content) ? 'list' : 'text';
            const preview = this.getCardPreview(card.content);

            item.innerHTML = `
                <div class="master-item-title">
                    <i class="bi bi-${contentType === 'list' ? 'list-ul' : 'file-text'}"></i>
                    ${card.title || 'Başlıksız'}
                </div>
                <div class="master-item-preview">${preview}</div>
                <span class="master-item-type type-${contentType}">${contentType === 'list' ? 'Liste' : 'Metin'}</span>
            `;

            item.addEventListener('click', () => {
                this.selectCard(index);
            });

            masterItems.appendChild(item);
        });
    }

    getCardPreview(content) {
        if (Array.isArray(content)) {
            return `${content.length} öğe`;
        } else if (typeof content === 'string') {
            return content.substring(0, 50) + (content.length > 50 ? '...' : '');
        }
        return '';
    }

    selectCard(index) {
        this.selectedIndex = index;

        // Update active state in master list
        document.querySelectorAll('.master-item').forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });

        // Render detail panel
        this.renderDetailPanel();
    }

    renderDetailPanel() {
        const detailBody = document.getElementById('detailBody');
        const detailEmptyState = document.getElementById('detailEmptyState');
        const detailEditorForm = document.getElementById('detailEditorForm');
        const detailFooter = document.getElementById('detailFooter');
        const detailActions = document.getElementById('detailActions');
        const detailTitle = document.getElementById('detailTitle');

        if (this.selectedIndex === null) {
            detailEmptyState.style.display = 'flex';
            detailEditorForm.style.display = 'none';
            detailFooter.style.display = 'none';
            detailActions.style.display = 'none';
            return;
        }

        const card = this.data.cards[this.selectedIndex];
        const contentType = Array.isArray(card.content) ? 'list' : 'text';

        detailEmptyState.style.display = 'none';
        detailEditorForm.style.display = 'block';
        detailFooter.style.display = 'block';
        detailActions.style.display = 'flex';

        detailTitle.innerHTML = `
            <i class="bi bi-pencil-square me-2"></i>
            Kart #${this.selectedIndex + 1} Düzenle
        `;

        // Render form
        detailEditorForm.innerHTML = `
            <div class="form-group mb-3">
                <label class="form-label">
                    <i class="bi bi-card-heading"></i>
                    Başlık
                </label>
                <input type="text" class="form-control" id="cardTitle" value="${this.escapeHtml(card.title || '')}" placeholder="Kart başlığı">
            </div>

            <div class="form-group mb-3">
                <label class="form-label">
                    <i class="bi bi-type"></i>
                    İçerik Tipi
                </label>
                <div class="content-type-switcher">
                    <button type="button" class="btn btn-outline-primary ${contentType === 'text' ? 'active' : ''}" data-type="text">
                        <i class="bi bi-file-text"></i> Metin
                    </button>
                    <button type="button" class="btn btn-outline-primary ${contentType === 'list' ? 'active' : ''}" data-type="list">
                        <i class="bi bi-list-ul"></i> Liste
                    </button>
                </div>
            </div>

            <div class="form-group mb-3" id="contentEditor">
                <!-- Content editor will be rendered here -->
            </div>
        `;

        // Render content editor based on type
        this.renderContentEditor(contentType);

        // Event listeners
        const cardTitleInput = document.getElementById('cardTitle');
        if (cardTitleInput) {
            cardTitleInput.addEventListener('input', (e) => {
                this.data.cards[this.selectedIndex].title = e.target.value;
                // Update master list to show new title
                const masterItem = document.querySelector(`.master-item[data-index="${this.selectedIndex}"]`);
                if (masterItem) {
                    const titleEl = masterItem.querySelector('.master-item-title');
                    const contentType = Array.isArray(this.data.cards[this.selectedIndex].content) ? 'list' : 'text';
                    const icon = contentType === 'list' ? 'list-ul' : 'file-text';
                    titleEl.innerHTML = `<i class="bi bi-${icon}"></i> ${e.target.value || 'Başlıksız'}`;
                }
            });
        }

        // Content type switcher
        document.querySelectorAll('.content-type-switcher .btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newType = btn.dataset.type;
                this.switchContentType(newType);
            });
        });
    }

    renderContentEditor(contentType) {
        const contentEditor = document.getElementById('contentEditor');
        const card = this.data.cards[this.selectedIndex];

        if (contentType === 'text') {
            contentEditor.innerHTML = `
                <label class="form-label">
                    <i class="bi bi-file-text"></i>
                    İçerik
                </label>
                <textarea class="form-control" id="cardContent" rows="10" placeholder="İçerik giriniz...">${Array.isArray(card.content) ? card.content.join('\n') : card.content || ''}</textarea>
            `;

            const contentTextarea = document.getElementById('cardContent');
            if (contentTextarea) {
                contentTextarea.addEventListener('input', (e) => {
                    this.data.cards[this.selectedIndex].content = e.target.value;
                    this.renderMasterList();
                    const currentIndex = this.selectedIndex;
                    this.selectCard(currentIndex);
                });
            }
        } else {
            // List editor
            const items = Array.isArray(card.content) ? card.content : (card.content ? [card.content] : []);

            contentEditor.innerHTML = `
                <label class="form-label d-flex justify-content-between align-items-center">
                    <span>
                        <i class="bi bi-list-ul"></i>
                        Liste Öğeleri
                    </span>
                    <button type="button" class="btn btn-sm btn-success" id="addListItem">
                        <i class="bi bi-plus-lg"></i> Öğe Ekle
                    </button>
                </label>
                <div id="listItemsContainer">
                    <!-- List items will be rendered here -->
                </div>
            `;

            this.renderListItems(items);

            // Add list item button
            const addListItemBtn = document.getElementById('addListItem');
            if (addListItemBtn) {
                addListItemBtn.addEventListener('click', () => {
                    this.addListItem();
                });
            }
        }
    }

    renderListItems(items) {
        const container = document.getElementById('listItemsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted p-3 border rounded">
                    Liste boş. "Öğe Ekle" butonuna tıklayın.
                </div>
            `;
            return;
        }

        items.forEach((item, index) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'list-item-editor';
            itemEl.draggable = true;
            itemEl.dataset.index = index;

            itemEl.innerHTML = `
                <i class="bi bi-grip-vertical drag-handle"></i>
                <input type="text" class="form-control" value="${this.escapeHtml(item || '')}" placeholder="Liste öğesi">
                <button type="button" class="btn btn-sm btn-outline-danger" title="Sil">
                    <i class="bi bi-trash"></i>
                </button>
            `;

            // Input change event
            const input = itemEl.querySelector('input');
            input.addEventListener('input', (e) => {
                this.data.cards[this.selectedIndex].content[index] = e.target.value;
                // Update preview without re-rendering
                const masterItem = document.querySelector(`.master-item[data-index="${this.selectedIndex}"]`);
                if (masterItem) {
                    const previewEl = masterItem.querySelector('.master-item-preview');
                    previewEl.textContent = `${this.data.cards[this.selectedIndex].content.length} öğe`;
                }
            });

            // Delete button
            itemEl.querySelector('.btn-outline-danger').addEventListener('click', () => {
                this.removeListItem(index);
            });

            // Drag events
            itemEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
                itemEl.classList.add('dragging');
            });

            itemEl.addEventListener('dragend', () => {
                itemEl.classList.remove('dragging');
            });

            itemEl.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                const dragging = container.querySelector('.dragging');
                if (dragging !== itemEl) {
                    const rect = itemEl.getBoundingClientRect();
                    const midpoint = rect.top + rect.height / 2;
                    if (e.clientY < midpoint) {
                        container.insertBefore(dragging, itemEl);
                    } else {
                        container.insertBefore(dragging, itemEl.nextSibling);
                    }
                }
            });

            itemEl.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = parseInt(itemEl.dataset.index);

                if (fromIndex !== toIndex) {
                    this.reorderListItems(fromIndex, toIndex);
                }
            });

            container.appendChild(itemEl);
        });
    }

    addListItem() {
        const card = this.data.cards[this.selectedIndex];
        if (!Array.isArray(card.content)) {
            card.content = [];
        }
        card.content.push('Yeni öğe');
        this.renderContentEditor('list');
        this.renderMasterList();
        this.selectCard(this.selectedIndex);
    }

    removeListItem(index) {
        const card = this.data.cards[this.selectedIndex];
        card.content.splice(index, 1);
        this.renderContentEditor('list');
        this.renderMasterList();
        this.selectCard(this.selectedIndex);
    }

    reorderListItems(fromIndex, toIndex) {
        const card = this.data.cards[this.selectedIndex];
        const item = card.content.splice(fromIndex, 1)[0];
        card.content.splice(toIndex, 0, item);
        this.renderContentEditor('list');
        this.renderMasterList();
        this.selectCard(this.selectedIndex);
    }

    switchContentType(newType) {
        const card = this.data.cards[this.selectedIndex];
        const currentType = Array.isArray(card.content) ? 'list' : 'text';

        if (currentType === newType) return;

        if (newType === 'list') {
            // Convert text to list
            const text = card.content || '';
            card.content = text.split('\n').filter(line => line.trim() !== '');
        } else {
            // Convert list to text
            const list = Array.isArray(card.content) ? card.content : [];
            card.content = list.join('\n');
        }

        this.renderContentEditor(newType);
        this.renderMasterList();
        this.selectCard(this.selectedIndex);
    }

    setupEventListeners() {
        // Add new card button
        const addNewCardBtn = document.getElementById('addNewCardBtn');
        if (addNewCardBtn) {
            addNewCardBtn.addEventListener('click', () => {
                this.addCard();
            });
        }

        // Delete card button
        const deleteCardBtn = document.getElementById('deleteCardBtn');
        if (deleteCardBtn) {
            deleteCardBtn.addEventListener('click', () => {
                this.deleteCard();
            });
        }

        // Move card up button
        const moveCardUpBtn = document.getElementById('moveCardUpBtn');
        if (moveCardUpBtn) {
            moveCardUpBtn.addEventListener('click', () => {
                this.moveCard(-1);
            });
        }

        // Move card down button
        const moveCardDownBtn = document.getElementById('moveCardDownBtn');
        if (moveCardDownBtn) {
            moveCardDownBtn.addEventListener('click', () => {
                this.moveCard(1);
            });
        }

        // Save button
        const saveCardBtn = document.getElementById('saveCardBtn');
        if (saveCardBtn) {
            saveCardBtn.addEventListener('click', () => {
                this.saveChanges();
            });
        }

        // Cancel button
        const cancelCardBtn = document.getElementById('cancelCardBtn');
        if (cancelCardBtn) {
            cancelCardBtn.addEventListener('click', () => {
                this.cancelChanges();
            });
        }

        // Master search
        const masterSearch = document.getElementById('masterSearch');
        if (masterSearch) {
            masterSearch.addEventListener('input', (e) => {
                this.searchCards(e.target.value);
            });
        }
    }

    addCard() {
        const newCard = {
            title: 'Yeni Kart',
            content: ''
        };

        this.data.cards.push(newCard);
        this.renderMasterList();
        this.selectCard(this.data.cards.length - 1);
    }

    deleteCard() {
        if (this.selectedIndex === null) return;

        if (confirm('Bu kartı silmek istediğinize emin misiniz?')) {
            this.data.cards.splice(this.selectedIndex, 1);
            this.selectedIndex = null;
            this.renderMasterList();
            this.renderDetailPanel();
        }
    }

    moveCard(direction) {
        if (this.selectedIndex === null) return;

        const newIndex = this.selectedIndex + direction;
        if (newIndex < 0 || newIndex >= this.data.cards.length) return;

        // Swap cards
        [this.data.cards[this.selectedIndex], this.data.cards[newIndex]] =
        [this.data.cards[newIndex], this.data.cards[this.selectedIndex]];

        this.selectedIndex = newIndex;
        this.renderMasterList();
        this.selectCard(this.selectedIndex);
    }

    saveChanges() {
        this.parentDashboard.showToast('Değişiklikler kaydedildi!', 'success');
        this.parentDashboard.updatePreview();
    }

    cancelChanges() {
        // Reload the file to discard changes
        if (confirm('Değişiklikler iptal edilecek. Emin misiniz?')) {
            this.parentDashboard.loadFile(
                this.parentDashboard.currentFile,
                document.getElementById('currentFileName').textContent.trim()
            );
        }
    }

    searchCards(query) {
        const items = document.querySelectorAll('.master-item');
        items.forEach(item => {
            const title = item.querySelector('.master-item-title').textContent;
            const preview = item.querySelector('.master-item-preview').textContent;
            const matches = title.toLowerCase().includes(query.toLowerCase()) ||
                          preview.toLowerCase().includes(query.toLowerCase());
            item.style.display = matches ? 'block' : 'none';
        });
    }

    // Resize Handle
    setupResizeHandle() {
        const resizeHandle = document.getElementById('resizeHandle');
        const masterList = document.querySelector('.master-list');
        const detailPanel = document.querySelector('.detail-panel');
        const container = document.querySelector('.master-detail-container');

        let startX = 0;
        let startWidth = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            this.resizing = true;
            startX = e.clientX;
            startWidth = masterList.offsetWidth;
            resizeHandle.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.resizing) return;

            const delta = e.clientX - startX;
            const containerWidth = container.offsetWidth;
            const newWidth = startWidth + delta;
            const newWidthPercent = (newWidth / containerWidth) * 100;

            // Limit between 20% and 80%
            if (newWidthPercent >= 20 && newWidthPercent <= 80) {
                masterList.style.flex = `0 0 ${newWidthPercent}%`;
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.resizing) {
                this.resizing = false;
                resizeHandle.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save width to localStorage
                const width = masterList.offsetWidth;
                const containerWidth = container.offsetWidth;
                const widthPercent = (width / containerWidth) * 100;
                this.saveMasterWidth(widthPercent);
            }
        });
    }

    saveMasterWidth(width) {
        try {
            localStorage.setItem('adminPanel_masterWidth', width);
        } catch (e) {
            console.log('LocalStorage not available');
        }
    }

    loadMasterWidth() {
        try {
            const saved = localStorage.getItem('adminPanel_masterWidth');
            return saved ? parseFloat(saved) : 35;
        } catch (e) {
            console.log('LocalStorage not available');
            return 35;
        }
    }

    applyMasterWidth() {
        const masterList = document.querySelector('.master-list');
        if (masterList && this.masterWidth) {
            masterList.style.flex = `0 0 ${this.masterWidth}%`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminPanelDashboard();
});
