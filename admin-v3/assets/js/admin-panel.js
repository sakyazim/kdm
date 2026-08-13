/**
 * ADMIN PANEL v3.0 - Main Application
 * Accordion-based modern JSON editor
 */

// Global state
let adminPanel = {
    currentFile: null,
    currentData: null,
    originalData: null,
    isDirty: false,
    sidebarVisible: false,
    previewVisible: false,
    previewWidth: 450,
    currentTab: 'content',
    headerVisible: true,
    autoHideTimeout: null,
    modalOpen: false,
    currentModalCard: null
};

/**
 * Initialize the admin panel
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Panel v3.0 initializing...');

    // Setup event listeners
    setupEventListeners();

    // Initialize file manager
    fileManager = new FileManager();
    fileManager.init();

    console.log('✅ Admin Panel v3.0 ready!');
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Toggle buttons
    document.getElementById('sidebarToggle').addEventListener('click', toggleSidebar);
    document.getElementById('previewToggle').addEventListener('click', togglePreview);
    document.getElementById('floatingHeaderToggle').addEventListener('click', toggleAllHeaders);

    // Header buttons
    document.getElementById('cancelBtn').addEventListener('click', cancelChanges);
    document.getElementById('saveBtn').addEventListener('click', saveChanges);

    // Resize handle
    setupResizeHandle();

    // Modal event listeners
    document.getElementById('modalCloseBtn').addEventListener('click', closeEditModal);
    document.getElementById('modalSaveBtn').addEventListener('click', saveAndCloseModal);

    // Close modal when clicking overlay background
    document.getElementById('editModalOverlay').addEventListener('click', (e) => {
        if (e.target.id === 'editModalOverlay') {
            closeEditModal();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC key - close modal
        if (e.key === 'Escape' && adminPanel.modalOpen) {
            closeEditModal();
        }
    });

    // Prevent accidental close
    window.addEventListener('beforeunload', (e) => {
        if (adminPanel.isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

/**
 * Setup resize handle for preview panel
 */
function setupResizeHandle() {
    const handle = document.getElementById('resizeHandle');
    const previewPanel = document.getElementById('previewPanel');
    const mainContainer = document.getElementById('mainContainer');
    let isResizing = false;
    let startX = 0;
    let startWidth = adminPanel.previewWidth;

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

        adminPanel.previewWidth = newWidth;
        previewPanel.style.width = newWidth + 'px';
        handle.style.right = newWidth + 'px';

        // Update grid template
        const sidebarWidth = adminPanel.sidebarVisible ? '280px' : '0px';
        mainContainer.style.gridTemplateColumns = `${sidebarWidth} 1fr ${newWidth}px`;
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

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    adminPanel.sidebarVisible = !adminPanel.sidebarVisible;
    updateLayout();
}

/**
 * Toggle preview visibility
 */
function togglePreview() {
    adminPanel.previewVisible = !adminPanel.previewVisible;
    updateLayout();
}

/**
 * Toggle all headers (admin header + editor header)
 */
function toggleAllHeaders() {
    const adminHeader = document.getElementById('adminHeader');
    const editorHeader = document.getElementById('editorHeader');
    const editorPanel = document.getElementById('editorPanel');
    const floatingBtn = document.getElementById('floatingHeaderToggle');

    // Check current state
    const headersHidden = document.body.classList.contains('headers-hidden');

    if (headersHidden) {
        // Show headers
        document.body.classList.remove('headers-hidden');
        adminHeader.classList.remove('header-hidden');
        editorHeader.classList.remove('editor-header-collapsed');
        editorPanel.classList.remove('editor-header-hidden');
        floatingBtn.classList.add('headers-visible');
        adminPanel.headerVisible = true;
    } else {
        // Hide headers
        document.body.classList.add('headers-hidden');
        adminHeader.classList.add('header-hidden');
        editorHeader.classList.add('editor-header-collapsed');
        editorPanel.classList.add('editor-header-hidden');
        floatingBtn.classList.remove('headers-visible');
        adminPanel.headerVisible = false;
    }
}

/**
 * Show header
 */
function showHeader() {
    const header = document.getElementById('adminHeader');
    header.classList.remove('header-hidden');
    document.body.classList.remove('header-hidden-mode');
    adminPanel.headerVisible = true;
}

/**
 * Hide header
 */
function hideHeader() {
    const header = document.getElementById('adminHeader');
    header.classList.add('header-hidden');
    document.body.classList.add('header-hidden-mode');
    adminPanel.headerVisible = false;
}

/**
 * Update main container layout
 */
function updateLayout() {
    const container = document.getElementById('mainContainer');
    container.classList.remove('sidebar-visible', 'preview-visible', 'both-visible');

    if (adminPanel.sidebarVisible && adminPanel.previewVisible) {
        container.classList.add('both-visible');
    } else if (adminPanel.sidebarVisible) {
        container.classList.add('sidebar-visible');
    } else if (adminPanel.previewVisible) {
        container.classList.add('preview-visible');
    }
}

/**
 * Load file list into sidebar - REMOVED (handled by FileManager)
 */

/**
 * Filter files in sidebar
 */
function filterFiles(query) {
    const items = document.querySelectorAll('.file-item');
    const lowerQuery = query.toLowerCase();

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(lowerQuery) ? 'flex' : 'none';
    });
}

// loadFile fonksiyonu artık file-manager.js'de - gereksiz duplicate kaldırıldı

/**
 * Render the editor
 */
function renderEditor() {
    if (!adminPanel.currentData) return;

    const editorHeader = document.getElementById('editorHeader');
    const editorBody = document.getElementById('editorBody');

    // Render header
    editorHeader.innerHTML = renderEditorHeader();

    // Render body with tabs
    editorBody.innerHTML = renderEditorBody();

    // Setup tab listeners
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.dataset.tab);
        });
    });

    // Setup field search
    const searchInput = editorHeader.querySelector('#fieldSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterFields(e.target.value);
        });
    }

    // Initialize date pickers
    initializeDatePickers();

    // Initialize color input listeners
    initializeColorInputs();
}

/**
 * Render editor header
 */
function renderEditorHeader() {
    const fileName = adminPanel.currentFile.id;
    const filePath = adminPanel.currentFile.path;

    // Count sections for badge
    const contentSections = getContentSections();
    const sectionCount = Object.keys(contentSections).length;

    return `
        <div class="editor-title-row">
            <div>
                <h2 class="editor-title">
                    <i class="bi bi-pencil-square"></i>
                    ${fileName}
                </h2>
                <div class="editor-file-path">${filePath}</div>
            </div>
            <div class="status-badges">
                ${renderStatusBadges()}
            </div>
        </div>

        <div class="editor-tabs">
            <button class="tab-btn active" data-tab="content">
                <i class="bi bi-card-list"></i>
                İçerik
                <span class="badge">${sectionCount}</span>
            </button>
            <button class="tab-btn" data-tab="general">
                <i class="bi bi-sliders"></i>
                Genel Ayarlar
                <span class="badge">Meta, Hero, Help</span>
            </button>
        </div>

        <div class="search-input-group">
            <i class="bi bi-search"></i>
            <input type="text" id="fieldSearch" placeholder="Alan ara... (örn: title, description)">
        </div>
    `;
}

/**
 * Render status badges
 */
function renderStatusBadges() {
    const hasTR = checkLanguageCompletion('tr');
    const hasEN = checkLanguageCompletion('en');

    return `
        <span class="status-badge ${hasTR ? 'status-complete' : 'status-incomplete'}">
            <i class="bi bi-${hasTR ? 'check' : 'exclamation'}-circle-fill"></i>
            TR ${hasTR ? 'Tamamlandı' : 'Eksik'}
        </span>
        <span class="status-badge ${hasEN ? 'status-complete' : 'status-incomplete'}">
            <i class="bi bi-${hasEN ? 'check' : 'exclamation'}-circle-fill"></i>
            EN ${hasEN ? 'Tamamlandı' : 'Eksik'}
        </span>
    `;
}

/**
 * Check if language is complete
 */
function checkLanguageCompletion(lang) {
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

    return checkObject(adminPanel.currentData);
}

/**
 * Render editor body
 */
function renderEditorBody() {
    return `
        <div id="contentTab">
            ${renderContentTab()}
        </div>
        <div id="generalTab" style="display: none;">
            ${renderGeneralTab()}
        </div>
    `;
}

/**
 * Render content tab
 */
function renderContentTab() {
    const sections = getContentSections();
    let html = '';

    for (const [key, value] of Object.entries(sections)) {
        html += renderSection(key, value);
    }

    return html || '<div class="empty-state"><i class="bi bi-inbox"></i><h5>İçerik bulunamadı</h5></div>';
}

/**
 * Render general tab
 */
function renderGeneralTab() {
    let html = '';

    if (adminPanel.currentData.meta) {
        html += renderSection('meta', adminPanel.currentData.meta);
    }
    if (adminPanel.currentData.hero) {
        html += renderSection('hero', adminPanel.currentData.hero);
    }
    if (adminPanel.currentData.help) {
        html += renderSection('help', adminPanel.currentData.help);
    }
    if (adminPanel.currentData.helpSection) {
        html += renderSection('helpSection', adminPanel.currentData.helpSection);
    }

    return html || '<div class="empty-state"><i class="bi bi-sliders"></i><h5>Genel ayarlar bulunamadı</h5></div>';
}

/**
 * Get content sections (exclude meta, hero, help, helpSection)
 */
function getContentSections() {
    const sections = {};
    const excludeKeys = ['meta', 'hero', 'help', 'helpSection'];

    for (const [key, value] of Object.entries(adminPanel.currentData)) {
        if (!excludeKeys.includes(key) && typeof value === 'object') {
            sections[key] = value;
        }
    }

    return sections;
}

/**
 * Render a section
 */
function renderSection(sectionKey, sectionData) {
    const sectionInfo = getSectionInfo(sectionKey);

    let html = `
        <div class="section-card" data-section="${sectionKey}">
            <div class="section-header">
                <div class="section-title">
                    <div class="section-icon">
                        <i class="${sectionInfo.icon}"></i>
                    </div>
                    <span>${sectionInfo.title}</span>
                </div>
            </div>
            <div class="section-body">
    `;

    // If array, render accordion cards
    if (Array.isArray(sectionData)) {
        sectionData.forEach((item, index) => {
            html += renderAccordionCard(sectionKey, item, index);
        });

        html += `
            <button class="btn-add-new" onclick="addNewCard('${sectionKey}')">
                <i class="bi bi-plus-circle-fill"></i>
                Yeni Kart Ekle
            </button>
        `;
    } else if (typeof sectionData === 'object' && sectionData !== null) {
        // Check if this object should be treated as a single card
        if (shouldRenderAsCard(sectionData)) {
            html += renderAccordionCard(sectionKey, sectionData, 0);
        } else {
            // Render simple fields
            html += renderSimpleFields(sectionKey, sectionData);
        }
    } else {
        // Render simple fields
        html += renderSimpleFields(sectionKey, sectionData);
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

/**
 * Render accordion card
 */
function renderAccordionCard(sectionKey, cardData, index) {
    const cardId = `card-${sectionKey}-${index}`;
    const cardTitle = getCardTitle(cardData);
    const cardIcon = cardData.icon || 'bi bi-card-text';

    return `
        <div class="accordion-card">
            <div class="accordion-header" onclick="toggleAccordion('${cardId}')">
                <div class="accordion-title">
                    <div class="card-number">${index + 1}</div>
                    <i class="${cardIcon}"></i>
                    <span>${cardTitle}</span>
                </div>
                <div class="accordion-actions">
                    <button class="btn-icon btn-up" onclick="event.stopPropagation(); moveCard('${sectionKey}', ${index}, 'up')">
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button class="btn-icon btn-down" onclick="event.stopPropagation(); moveCard('${sectionKey}', ${index}, 'down')">
                        <i class="bi bi-arrow-down"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="event.stopPropagation(); deleteCard('${sectionKey}', ${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                    <i class="bi bi-chevron-right chevron-icon"></i>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render card fields
 */
function renderCardFields(sectionKey, cardData, index) {
    let html = '';

    for (const [fieldKey, fieldValue] of Object.entries(cardData)) {
        const fieldPath = `${sectionKey}.${index}.${fieldKey}`;

        // Special handling for nested arrays (like components)
        if (Array.isArray(fieldValue) && fieldKey === 'components') {
            html += `
                <div class="form-group-lang">
                    <label class="form-label-main">
                        <i class="bi bi-puzzle"></i>
                        Bileşenler
                    </label>
                    <div class="nested-array-container">
                        ${renderNestedArray(fieldValue, fieldPath)}
                    </div>
                </div>
            `;
        } else {
            html += renderField(fieldKey, fieldValue, fieldPath);
        }
    }

    return html;
}

/**
 * Render nested array (for components, items, etc.)
 */
function renderNestedArray(arrayData, basePath) {
    let html = '';

    if (!arrayData || arrayData.length === 0) {
        html += '<p class="text-muted" style="font-size: 12px; padding: 8px; margin-bottom: 1rem;">Henüz öğe eklenmemiş</p>';
    } else {
        arrayData.forEach((item, idx) => {
            const itemPath = `${basePath}.${idx}`;
            const itemTitle = getNestedItemTitle(item, idx);
            html += `
                <div class="nested-item">
                    <div class="nested-item-header">
                        <div class="nested-item-title">
                            <div class="nested-item-number">${idx + 1}</div>
                            <span>${itemTitle}</span>
                        </div>
                        <div class="nested-item-actions">
                            <button class="btn-nested-action btn-nested-delete" onclick="deleteNestedItem('${basePath}', ${idx})" title="Sil">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    ${renderNestedObject(item, itemPath)}
                </div>
            `;
        });
    }

    // Add "New Item" button
    html += `
        <button class="btn-add-nested-item" onclick="addNestedItem('${basePath}')">
            <i class="bi bi-plus-circle-fill"></i>
            Yeni Öğe Ekle
        </button>
    `;

    return html;
}

/**
 * Get smart title for nested item based on its content
 */
function getNestedItemTitle(item, index) {
    // Priority 1: Check for title field
    if (item.title) {
        if (typeof item.title === 'object') {
            const title = item.title.tr || item.title.en || '';
            if (title) return truncateText(title, 40);
        } else if (typeof item.title === 'string' && item.title) {
            return truncateText(item.title, 40);
        }
    }

    // Priority 2: Check for text field
    if (item.text) {
        if (typeof item.text === 'object') {
            const text = item.text.tr || item.text.en || '';
            if (text) return truncateText(text, 40);
        } else if (typeof item.text === 'string' && item.text) {
            return truncateText(item.text, 40);
        }
    }

    // Priority 3: Check for name field
    if (item.name) {
        if (typeof item.name === 'object') {
            const name = item.name.tr || item.name.en || '';
            if (name) return truncateText(name, 40);
        } else if (typeof item.name === 'string' && item.name) {
            return truncateText(item.name, 40);
        }
    }

    // Priority 4: Check for label field
    if (item.label) {
        if (typeof item.label === 'object') {
            const label = item.label.tr || item.label.en || '';
            if (label) return truncateText(label, 40);
        } else if (typeof item.label === 'string' && item.label) {
            return truncateText(item.label, 40);
        }
    }

    // Priority 5: Check for type/variant
    if (item.type && typeof item.type === 'string') {
        return `<i class="bi bi-tag"></i> ${item.type}`;
    }
    if (item.variant && typeof item.variant === 'string') {
        return `<i class="bi bi-palette"></i> ${item.variant}`;
    }

    // Priority 6: Check for icon
    if (item.icon && typeof item.icon === 'string') {
        return `<i class="${item.icon}"></i> İkon: ${item.icon.split(' ')[1] || 'icon'}`;
    }

    // Priority 7: Try to find any string field with content
    for (const [key, value] of Object.entries(item)) {
        if (typeof value === 'string' && value.trim() && !['id', 'href', 'url', 'link', 'image'].includes(key)) {
            return truncateText(value, 40);
        }
        if (typeof value === 'object' && value !== null && (value.tr || value.en)) {
            const text = value.tr || value.en;
            if (text) return truncateText(text, 40);
        }
    }

    // Fallback: Generic title
    return `Öğe ${index + 1}`;
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    text = String(text).trim();
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Render nested object fields
 */
function renderNestedObject(obj, basePath) {
    if (typeof obj !== 'object' || obj === null) {
        return `<input type="text" class="form-control" data-field="${basePath}" value="${escapeHtml(String(obj))}" onchange="onFieldChange(this)">`;
    }

    let html = '';
    for (const [key, value] of Object.entries(obj)) {
        const fieldPath = `${basePath}.${key}`;

        // Check if it's a multilang field
        if (typeof value === 'object' && value !== null && (value.tr !== undefined || value.en !== undefined)) {
            html += renderMultilangField(getFieldInfo(key), value, fieldPath);
        }
        // Check if it's a nested object
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            html += `
                <div class="form-group-lang">
                    <label class="form-label-main">
                        <i class="bi bi-folder"></i>
                        ${getFieldInfo(key).label}
                    </label>
                    <div style="padding-left: 16px; border-left: 2px solid var(--border);">
                        ${renderNestedObject(value, fieldPath)}
                    </div>
                </div>
            `;
        }
        // Check if it's an array
        else if (Array.isArray(value)) {
            html += `
                <div class="form-group-lang">
                    <label class="form-label-main">
                        <i class="bi bi-list-ul"></i>
                        ${getFieldInfo(key).label}
                    </label>
                    <div class="nested-array-container">
                        ${renderNestedArray(value, fieldPath)}
                    </div>
                </div>
            `;
        }
        // Simple field
        else {
            html += `
                <div class="form-group-lang">
                    <label class="form-label-main">
                        <i class="${getFieldInfo(key).icon}"></i>
                        ${getFieldInfo(key).label}
                    </label>
                    <input type="text" class="form-control" data-field="${fieldPath}" value="${escapeHtml(String(value))}" onchange="onFieldChange(this)">
                </div>
            `;
        }
    }

    return html;
}

/**
 * Render simple fields (non-array sections)
 */
function renderSimpleFields(sectionKey, data) {
    let html = '';

    for (const [fieldKey, fieldValue] of Object.entries(data)) {
        if (ADMIN_CONFIG.technicalFields.includes(fieldKey)) continue;

        const fieldPath = `${sectionKey}.${fieldKey}`;
        html += renderField(fieldKey, fieldValue, fieldPath);
    }

    return html;
}

/**
 * Render a single field
 */
function renderField(fieldKey, fieldValue, fieldPath) {
    const fieldInfo = getFieldInfo(fieldKey);

    // Check if array
    if (Array.isArray(fieldValue)) {
        // Arrays should be handled by nested array renderer
        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <div class="nested-array-container">
                    ${renderNestedArray(fieldValue, fieldPath)}
                </div>
            </div>
        `;
    }

    // Check if multilang
    const isMultilang = typeof fieldValue === 'object' && fieldValue !== null &&
                       (fieldValue.tr !== undefined || fieldValue.en !== undefined);

    if (isMultilang) {
        return renderMultilangField(fieldInfo, fieldValue, fieldPath);
    } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        // Nested object - render sub-fields
        let html = '<div class="form-group-lang"><label class="form-label-main"><i class="bi bi-folder-open"></i>' + fieldInfo.label + '</label>';
        for (const [subKey, subValue] of Object.entries(fieldValue)) {
            html += renderField(subKey, subValue, `${fieldPath}.${subKey}`);
        }
        html += '</div>';
        return html;
    } else {
        return renderSingleField(fieldInfo, fieldValue, fieldPath);
    }
}

/**
 * Render multilang field
 */
function renderMultilangField(fieldInfo, value, fieldPath) {
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
                        `<textarea class="form-control" data-field="${fieldPath}.tr" onchange="onFieldChange(this)">${escapeHtml(trValue)}</textarea>` :
                        `<input type="text" class="form-control" data-field="${fieldPath}.tr" value="${escapeHtml(trValue)}" onchange="onFieldChange(this)">`
                    }
                </div>
                <div class="lang-input-group">
                    <span class="lang-badge en">🇬🇧 EN</span>
                    ${isTextarea ?
                        `<textarea class="form-control" data-field="${fieldPath}.en" onchange="onFieldChange(this)">${escapeHtml(enValue)}</textarea>` :
                        `<input type="text" class="form-control" data-field="${fieldPath}.en" value="${escapeHtml(enValue)}" onchange="onFieldChange(this)">`
                    }
                </div>
            </div>
        </div>
    `;
}

/**
 * Render single field (non-multilang)
 */
function renderSingleField(fieldInfo, value, fieldPath) {
    const stringValue = value !== null && value !== undefined ? String(value) : '';
    const fieldKey = fieldPath.split('.').pop();

    // Tarih alanları için date picker
    const isDateField = fieldKey === 'date' || fieldKey === 'publishDate' || fieldKey.toLowerCase().includes('date');

    if (isDateField) {
        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <input type="date" class="form-control date-picker" data-field="${fieldPath}" value="${escapeHtml(stringValue)}" onchange="onFieldChange(this)">
            </div>
        `;
    }

    // Renk alanları için color picker
    const isColorField = fieldKey.toLowerCase().includes('color') || fieldKey.toLowerCase().includes('colour');

    if (isColorField) {
        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <div class="color-picker-wrapper" data-field-path="${fieldPath}">
                    <div class="color-preview" style="background-color: ${escapeHtml(stringValue)}"></div>
                    <input type="text" class="form-control color-input" data-field="${fieldPath}" value="${escapeHtml(stringValue)}" onchange="onFieldChange(this)" placeholder="#1F4C8A">
                    <button type="button" class="btn-color-picker" title="Renk Seç">
                        <i class="bi bi-palette-fill"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Boolean alanları için toggle switch
    const isBooleanField = typeof value === 'boolean' ||
                          fieldKey === 'featured' ||
                          fieldKey === 'enabled' ||
                          fieldKey === 'active' ||
                          fieldKey === 'allowFullscreen' ||
                          fieldKey === 'disabled' ||
                          fieldKey === 'visible' ||
                          fieldKey === 'required' ||
                          fieldKey === 'readonly' ||
                          value === 'true' ||
                          value === 'false';

    if (isBooleanField) {
        const boolValue = value === true || value === 'true';
        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <div class="toggle-switch-wrapper">
                    <label class="toggle-switch">
                        <input type="checkbox"
                               data-field="${fieldPath}"
                               ${boolValue ? 'checked' : ''}
                               onchange="onToggleChange(this)">
                        <span class="toggle-slider"></span>
                    </label>
                    <span class="toggle-label">${boolValue ? 'Aktif' : 'Pasif'}</span>
                </div>
            </div>
        `;
    }

    // Sayısal alanlar için number input
    const isNumberField = typeof value === 'number' ||
                         fieldKey === 'id' ||
                         fieldKey === 'duration' ||
                         fieldKey === 'delay' ||
                         fieldKey === 'maxItems' ||
                         fieldKey === 'minItems' ||
                         fieldKey === 'max' ||
                         fieldKey === 'min' ||
                         fieldKey === 'count' ||
                         fieldKey === 'limit' ||
                         fieldKey === 'order' ||
                         fieldKey === 'priority' ||
                         fieldKey === 'width' ||
                         fieldKey === 'height' ||
                         fieldKey === 'size' ||
                         fieldKey === 'modalId' ||
                         (!isNaN(value) && value !== '' && value !== null);

    if (isNumberField) {
        const numValue = value !== null && value !== undefined && value !== '' ? Number(value) : '';

        // Alan tipine göre min, max, step değerleri
        let minValue = 0;
        let maxValue = 999999;
        let stepValue = 1;
        let suffix = '';

        if (fieldKey === 'duration' || fieldKey === 'delay') {
            minValue = 100;
            maxValue = 30000;
            stepValue = 100;
            suffix = ' ms';
        } else if (fieldKey === 'maxItems' || fieldKey === 'minItems' || fieldKey === 'limit') {
            minValue = 1;
            maxValue = 100;
            stepValue = 1;
        } else if (fieldKey === 'id' || fieldKey === 'modalId') {
            minValue = 1;
            maxValue = 9999;
            stepValue = 1;
        } else if (fieldKey === 'order' || fieldKey === 'priority') {
            minValue = 1;
            maxValue = 100;
            stepValue = 1;
        } else if (fieldKey === 'width' || fieldKey === 'height' || fieldKey === 'size') {
            minValue = 1;
            maxValue = 9999;
            stepValue = 1;
            suffix = ' px';
        }

        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <div class="number-input-wrapper">
                    <input type="number"
                           class="form-control number-input"
                           data-field="${fieldPath}"
                           value="${numValue}"
                           min="${minValue}"
                           max="${maxValue}"
                           step="${stepValue}"
                           onchange="onFieldChange(this)">
                    ${suffix ? `<span class="number-suffix">${suffix}</span>` : ''}
                </div>
            </div>
        `;
    }

    // URL alanları için validator
    const isUrlField = fieldKey === 'url' ||
                      fieldKey === 'href' ||
                      fieldKey === 'link' ||
                      fieldKey === 'action' ||
                      fieldKey === 'src' ||
                      fieldKey === 'website' ||
                      fieldKey.toLowerCase().includes('url') ||
                      fieldKey.toLowerCase().includes('link');

    if (isUrlField) {
        const isValidUrl = validateUrl(stringValue);
        const urlType = getUrlType(stringValue);

        return `
            <div class="form-group-lang">
                <label class="form-label-main">
                    <i class="${fieldInfo.icon}"></i>
                    ${fieldInfo.label}
                </label>
                <div class="url-input-wrapper">
                    <input type="url"
                           class="form-control url-input ${isValidUrl ? 'valid' : stringValue ? 'invalid' : ''}"
                           data-field="${fieldPath}"
                           value="${escapeHtml(stringValue)}"
                           placeholder="https://example.com"
                           oninput="onUrlInput(this)"
                           onchange="onFieldChange(this)">
                    <span class="url-indicator ${isValidUrl ? 'valid' : stringValue ? 'invalid' : 'empty'}">
                        ${isValidUrl ? '<i class="bi bi-check-circle-fill"></i>' : stringValue ? '<i class="bi bi-exclamation-circle-fill"></i>' : ''}
                    </span>
                    ${isValidUrl && urlType ? `<span class="url-type-badge">${urlType}</span>` : ''}
                </div>
            </div>
        `;
    }

    return `
        <div class="form-group-lang">
            <label class="form-label-main">
                <i class="${fieldInfo.icon}"></i>
                ${fieldInfo.label}
            </label>
            <input type="text" class="form-control" data-field="${fieldPath}" value="${escapeHtml(stringValue)}" onchange="onFieldChange(this)">
        </div>
    `;
}

/**
 * Get section info (title, icon)
 */
function getSectionInfo(sectionKey) {
    const mapping = {
        'meta': { title: 'Meta Bilgileri', icon: 'bi bi-info-circle-fill' },
        'hero': { title: 'Hero Bölümü', icon: 'bi bi-image' },
        'help': { title: 'Yardım Bölümü', icon: 'bi bi-question-circle-fill' },
        'helpSection': { title: 'Yardım Bölümü', icon: 'bi bi-question-circle-fill' },
        'content': { title: 'İçerik', icon: 'bi bi-card-list' },
        'contact': { title: 'İletişim Bilgileri', icon: 'bi bi-telephone-fill' },
        'map': { title: 'Harita', icon: 'bi bi-map-fill' },
        'cards': { title: 'Kartlar', icon: 'bi bi-grid-3x3-gap-fill' },
        'departments': { title: 'Birimler', icon: 'bi bi-building' },
        'navigation': { title: 'Navigasyon', icon: 'bi bi-compass' },
        'links': { title: 'Bağlantılar', icon: 'bi bi-link-45deg' }
    };

    return mapping[sectionKey] || {
        title: sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1),
        icon: 'bi bi-card-list'
    };
}

/**
 * Get field info (label, icon)
 */
function getFieldInfo(fieldKey) {
    const mapping = {
        'title': { label: 'Başlık', icon: 'bi bi-card-heading text-primary' },
        'description': { label: 'Açıklama', icon: 'bi bi-text-paragraph text-success' },
        'content': { label: 'İçerik', icon: 'bi bi-text-paragraph text-success' },
        'text': { label: 'Metin', icon: 'bi bi-fonts' },
        'icon': { label: 'Icon', icon: 'bi bi-star text-warning' },
        'url': { label: 'URL', icon: 'bi bi-link-45deg text-info' },
        'link': { label: 'Link', icon: 'bi bi-link-45deg text-info' },
        'href': { label: 'Link', icon: 'bi bi-link-45deg text-info' },
        'image': { label: 'Görsel', icon: 'bi bi-image' },
        'backgroundImage': { label: 'Arka Plan Görseli', icon: 'bi bi-image' },
        'type': { label: 'Tip', icon: 'bi bi-tag text-info' },
        'variant': { label: 'Varyant', icon: 'bi bi-collection text-info' },
        'data': { label: 'Veri', icon: 'bi bi-database text-success' },
        'items': { label: 'Öğeler', icon: 'bi bi-list-ul text-primary' },
        'titleIcon': { label: 'Başlık İkonu', icon: 'bi bi-star text-warning' },
        'embedUrl': { label: 'Embed URL', icon: 'bi bi-link text-info' },
        'width': { label: 'Genişlik', icon: 'bi bi-arrows-expand' },
        'height': { label: 'Yükseklik', icon: 'bi bi-arrows-expand' },
        'borderRadius': { label: 'Köşe Yuvarlama', icon: 'bi bi-bounding-box' },
        'allowFullscreen': { label: 'Tam Ekran', icon: 'bi bi-fullscreen' },
        'loading': { label: 'Yükleme', icon: 'bi bi-hourglass-split' },
        'headers': { label: 'Başlıklar', icon: 'bi bi-table' },
        'rows': { label: 'Satırlar', icon: 'bi bi-list-task' },
        'cells': { label: 'Hücreler', icon: 'bi bi-grid-3x3' },
        'highlightColumns': { label: 'Vurgulu Sütunlar', icon: 'bi bi-columns' },
        'style': { label: 'Stil', icon: 'bi bi-palette' },
        'buttons': { label: 'Butonlar', icon: 'bi bi-ui-checks text-primary' }
    };

    return mapping[fieldKey] || {
        label: fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1),
        icon: 'bi bi-pencil'
    };
}

/**
 * Check if object should be rendered as a card (has complex nested structure)
 */
function shouldRenderAsCard(obj) {
    if (!obj || typeof obj !== 'object') return false;
    
    // Always render as card if it has title or text field
    if (obj.title || obj.text || obj.name) {
        return true;
    }
    
    // Count multilang fields and nested objects/arrays
    let complexFields = 0;
    let totalFields = 0;
    
    for (const [key, value] of Object.entries(obj)) {
        totalFields++;
        
        // Skip technical fields
        if (ADMIN_CONFIG.technicalFields.includes(key)) continue;
        
        // Multilang field
        if (typeof value === 'object' && value !== null && (value.tr !== undefined || value.en !== undefined)) {
            complexFields++;
        }
        // Nested object or array
        else if (typeof value === 'object' && value !== null) {
            complexFields++;
        }
    }
    
    // If more than 2 fields total OR more than 1 complex field, render as card
    return totalFields > 2 || complexFields > 0;
}

/**
 * Get card title from card data
 */
function getCardTitle(cardData) {
    // Try title field first
    if (cardData.title) {
        if (typeof cardData.title === 'object') {
            const title = cardData.title.tr || cardData.title.en || '';
            if (title) return title;
        } else if (typeof cardData.title === 'string' && cardData.title) {
            return cardData.title;
        }
    }

    // Try text field
    if (cardData.text) {
        if (typeof cardData.text === 'object') {
            const text = cardData.text.tr || cardData.text.en || '';
            if (text) return text;
        } else if (typeof cardData.text === 'string' && cardData.text) {
            return cardData.text;
        }
    }

    // Try name field
    if (cardData.name) {
        if (typeof cardData.name === 'object') {
            const name = cardData.name.tr || cardData.name.en || '';
            if (name) return name;
        } else if (typeof cardData.name === 'string' && cardData.name) {
            return cardData.name;
        }
    }

    // Try id field as fallback (for sections like contact-info-section)
    if (cardData.id) {
        // Convert id to readable format: "contact-info-section" -> "Contact Info Section"
        // Convert to string first to handle both string and number types
        return String(cardData.id)
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    return 'Başlıksız';
}

/**
 * Get file label from category and file ID
 */
function getFileLabel(category, fileId) {
    const categoryConfig = ADMIN_CONFIG.fileCategories[category];
    if (!categoryConfig) return fileId;

    const file = categoryConfig.files.find(f => f.id === fileId);
    if (file) return file.label;

    // Check submenus
    for (const f of categoryConfig.files) {
        if (f.submenu) {
            const subfile = f.submenu.find(sf => sf.id === fileId);
            if (subfile) return subfile.label;
        }
    }

    return fileId;
}

/**
 * Escape HTML
 */
/**
 * Validate URL format
 */
function validateUrl(url) {
    if (!url || url.trim() === '' || url === '#') {
        return true; // Empty or anchor is valid
    }

    // Relative paths are valid
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return true;
    }

    // Local HTML files are valid
    if (url.endsWith('.html') && !url.includes('://')) {
        return true;
    }

    // Common protocols
    const validProtocols = [
        /^https?:\/\/.+/i,           // http://, https://
        /^mailto:[^\s@]+@[^\s@]+/i,  // mailto:
        /^tel:\+?[\d\s\-()]+/i,      // tel:
        /^ftp:\/\/.+/i,              // ftp://
        /^#[a-zA-Z0-9\-_]+$/         // anchor links
    ];

    return validProtocols.some(pattern => pattern.test(url));
}

/**
 * Get URL type for badge display
 */
function getUrlType(url) {
    if (!url || url.trim() === '') return null;

    if (url.startsWith('mailto:')) return 'Email';
    if (url.startsWith('tel:')) return 'Telefon';
    if (url.startsWith('https://')) return 'Güvenli';
    if (url.startsWith('http://')) return 'Web';
    if (url.startsWith('ftp://')) return 'FTP';
    if (url === '#') return 'Anchor';
    if (url.endsWith('.html')) return 'Sayfa';
    if (url.startsWith('/') || url.startsWith('./')) return 'Lokal';

    return null;
}

/**
 * Handle URL input changes (real-time validation)
 */
function onUrlInput(input) {
    const url = input.value.trim();
    const isValid = validateUrl(url);
    const wrapper = input.closest('.url-input-wrapper');
    const indicator = wrapper.querySelector('.url-indicator');
    const existingBadge = wrapper.querySelector('.url-type-badge');

    // Update input class
    input.classList.remove('valid', 'invalid');
    if (url) {
        input.classList.add(isValid ? 'valid' : 'invalid');
    }

    // Update indicator
    if (indicator) {
        indicator.className = `url-indicator ${isValid ? 'valid' : url ? 'invalid' : 'empty'}`;
        if (isValid && url) {
            indicator.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        } else if (url) {
            indicator.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i>';
        } else {
            indicator.innerHTML = '';
        }
    }

    // Update type badge
    const urlType = getUrlType(url);
    if (existingBadge) {
        existingBadge.remove();
    }

    if (isValid && urlType && url) {
        const badge = document.createElement('span');
        badge.className = 'url-type-badge';
        badge.textContent = urlType;
        wrapper.appendChild(badge);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Toggle accordion - NOW OPENS MODAL INSTEAD
 */
function toggleAccordion(cardId) {
    // Extract info from cardId: "card-sectionKey-index"
    const parts = cardId.split('-');
    const sectionKey = parts[1];
    const cardIndex = parseInt(parts[2]);

    // Open modal with this card's content
    openEditModal(sectionKey, cardIndex);
}

/**
 * Open edit modal
 */
function openEditModal(sectionKey, cardIndex) {
    const modal = document.getElementById('editModalOverlay');
    
    // Get card data - handle both array and single object cases
    let cardData;
    if (Array.isArray(adminPanel.currentData[sectionKey])) {
        cardData = adminPanel.currentData[sectionKey][cardIndex];
    } else {
        // Single object treated as card
        cardData = adminPanel.currentData[sectionKey];
        cardIndex = 0; // Treat as first (and only) card
    }
    
    const cardTitle = getCardTitle(cardData);

    // Store current card reference
    adminPanel.currentModalCard = {
        sectionKey: sectionKey,
        index: cardIndex,
        isArray: Array.isArray(adminPanel.currentData[sectionKey])
    };

    // Update modal header
    document.getElementById('modalCardNumber').textContent = cardIndex + 1;
    document.getElementById('modalCardTitle').textContent = cardTitle;

    // Render card fields in modal
    const modalContent = document.getElementById('modalContentArea');
    modalContent.innerHTML = renderCardFields(sectionKey, cardData, cardIndex);

    // Initialize date pickers in modal
    initializeDatePickers();

    // Initialize color inputs in modal
    initializeColorInputs();

    // Show modal
    modal.classList.add('active');
    adminPanel.modalOpen = true;
    document.body.style.overflow = 'hidden'; // Prevent body scroll

    console.log(`✅ Modal opened for: ${cardTitle}`);
}

/**
 * Close edit modal
 */
function closeEditModal() {
    const modal = document.getElementById('editModalOverlay');

    modal.classList.remove('active');
    adminPanel.modalOpen = false;
    adminPanel.currentModalCard = null;
    document.body.style.overflow = ''; // Restore body scroll

    console.log('✅ Modal closed');
}

/**
 * Save and close modal
 */
function saveAndCloseModal() {
    // Changes are already saved via onFieldChange
    // Just close the modal
    closeEditModal();

    // Re-render the editor to update accordion titles if changed
    renderEditor();
}

/**
 * Switch tab
 */
function switchTab(tab) {
    adminPanel.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    document.getElementById('contentTab').style.display = tab === 'content' ? 'block' : 'none';
    document.getElementById('generalTab').style.display = tab === 'general' ? 'block' : 'none';
}

/**
 * Filter fields by search query
 */
function filterFields(query) {
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

/**
 * On field change
 */
function onFieldChange(input) {
    const fieldPath = input.dataset.field;
    let value = input.value;

    // Convert to number if input type is number
    if (input.type === 'number') {
        value = value !== '' ? Number(value) : null;
    }

    // Update data
    setNestedValue(adminPanel.currentData, fieldPath, value);

    // Mark as dirty
    adminPanel.isDirty = true;
    updateChangesIndicator();

    // Update preview
    updatePreview();
}

/**
 * Handle toggle switch changes (boolean fields)
 */
function onToggleChange(checkbox) {
    const fieldPath = checkbox.dataset.field;
    const boolValue = checkbox.checked;

    // Update data with boolean value
    setNestedValue(adminPanel.currentData, fieldPath, boolValue);

    // Update label text
    const wrapper = checkbox.closest('.toggle-switch-wrapper');
    const label = wrapper.querySelector('.toggle-label');
    if (label) {
        label.textContent = boolValue ? 'Aktif' : 'Pasif';
    }

    // Mark as dirty
    adminPanel.isDirty = true;
    updateChangesIndicator();

    // Update preview
    updatePreview();
}

/**
 * Set nested value in object
 */
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        // Handle array indices
        if (!isNaN(key)) {
            const index = parseInt(key);
            if (!current[index]) current[index] = {};
            current = current[index];
        } else {
            if (!current[key]) {
                // Check if next key is a number (array index)
                const nextKey = keys[i + 1];
                current[key] = !isNaN(nextKey) ? [] : {};
            }
            current = current[key];
        }
    }

    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;
}

/**
 * Update changes indicator
 */
function updateChangesIndicator() {
    const indicator = document.getElementById('changesIndicator');
    indicator.style.display = adminPanel.isDirty ? 'flex' : 'none';
}

/**
 * Update preview
 */
function updatePreview() {
    if (!adminPanel.currentFile) return;

    const previewBody = document.getElementById('previewBody');
    const htmlFile = getHTMLFromJSON(adminPanel.currentFile.id);

    previewBody.innerHTML = `
        <iframe src="../${htmlFile}" class="preview-iframe"></iframe>
    `;
}

/**
 * Get HTML file from JSON file ID
 */
function getHTMLFromJSON(fileId) {
    if (fileId === 'home') return 'index.html';
    return `${fileId}.html`;
}



/**
 * Clear object values recursively
 */
function clearObjectValues(obj) {
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            clearObjectValues(obj[key]);
        } else if (typeof obj[key] === 'string') {
            obj[key] = '';
        }
    }
}

/**
 * Save changes (download JSON)
 */
function saveChanges() {
    if (!adminPanel.currentFile) {
        alert('Önce bir dosya seçin!');
        return;
    }

    try {
        const jsonString = JSON.stringify(adminPanel.currentData, null, 2);

        // Download JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${adminPanel.currentFile.id}.json`;
        a.click();
        URL.revokeObjectURL(url);

        // Reset dirty flag
        adminPanel.originalData = JSON.parse(JSON.stringify(adminPanel.currentData));
        adminPanel.isDirty = false;
        updateChangesIndicator();

        alert('✅ Dosya indirildi! FTP ile servera yükleyebilirsiniz.');
    } catch (error) {
        console.error('❌ Save error:', error);
        alert('Kaydetme hatası!');
    }
}

/**
 * Cancel changes
 */
function cancelChanges() {
    if (!adminPanel.isDirty) return;

    if (confirm('Kaydedilmemiş değişiklikleri iptal etmek istediğinize emin misiniz?')) {
        adminPanel.currentData = JSON.parse(JSON.stringify(adminPanel.originalData));
        adminPanel.isDirty = false;
        updateChangesIndicator();
        renderEditor();
    }
}

/**
 * Add new item to nested array
 */
function addNestedItem(basePath) {
    // Parse the path to get the array
    const keys = basePath.split('.');
    let current = adminPanel.currentData;

    // Navigate to the array
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!isNaN(key)) {
            current = current[parseInt(key)];
        } else {
            current = current[key];
        }
    }

    // Check if current is an array
    if (!Array.isArray(current)) {
        console.error('Target is not an array:', basePath);
        return;
    }

    // Create a template based on the first item, or a basic template
    let template;
    if (current.length > 0) {
        template = JSON.parse(JSON.stringify(current[0]));
        clearObjectValues(template);
    } else {
        // Basic template for new items
        template = {
            title: { tr: '', en: '' },
            description: { tr: '', en: '' }
        };
    }

    // Add the new item
    current.push(template);

    // Mark as dirty
    adminPanel.isDirty = true;
    updateChangesIndicator();

    // Re-render modal content if modal is open
    if (adminPanel.modalOpen && adminPanel.currentModalCard) {
        const { sectionKey, index, isArray } = adminPanel.currentModalCard;
        
        // Get card data based on whether it's array or single object
        const cardData = isArray ? 
            adminPanel.currentData[sectionKey][index] : 
            adminPanel.currentData[sectionKey];
            
        const modalContent = document.getElementById('modalContentArea');
        modalContent.innerHTML = renderCardFields(sectionKey, cardData, index);
        initializeDatePickers();
        initializeColorInputs();
    } else {
        renderEditor();
    }

    console.log(`✅ New item added to: ${basePath}`);
}

/**
 * Delete item from nested array
 */
function deleteNestedItem(basePath, itemIndex) {
    if (!confirm('Bu öğeyi silmek istediğinize emin misiniz?')) return;

    // Parse the path to get the array
    const keys = basePath.split('.');
    let current = adminPanel.currentData;

    // Navigate to the array
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!isNaN(key)) {
            current = current[parseInt(key)];
        } else {
            current = current[key];
        }
    }

    // Check if current is an array
    if (!Array.isArray(current)) {
        console.error('Target is not an array:', basePath);
        return;
    }

    // Remove the item
    current.splice(itemIndex, 1);

    // Mark as dirty
    adminPanel.isDirty = true;
    updateChangesIndicator();

    // Re-render modal content if modal is open
    if (adminPanel.modalOpen && adminPanel.currentModalCard) {
        const { sectionKey, index, isArray } = adminPanel.currentModalCard;
        
        // Get card data based on whether it's array or single object
        const cardData = isArray ? 
            adminPanel.currentData[sectionKey][index] : 
            adminPanel.currentData[sectionKey];
            
        const modalContent = document.getElementById('modalContentArea');
        modalContent.innerHTML = renderCardFields(sectionKey, cardData, index);
        initializeDatePickers();
        initializeColorInputs();
    } else {
        renderEditor();
    }

    console.log(`✅ Item deleted from: ${basePath}[${itemIndex}]`);
}

/**
 * Initialize date pickers for all date fields
 */
function initializeDatePickers() {
    const datePickers = document.querySelectorAll('input.date-picker');

    datePickers.forEach(input => {
        // Flatpickr başlat
        flatpickr(input, {
            dateFormat: 'Y-m-d',
            locale: 'tr',
            allowInput: true,
            altInput: true,
            altFormat: 'd.m.Y',
            onChange: function() {
                // Değişiklik olduğunda onFieldChange tetikle
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
    });

    console.log(`📅 ${datePickers.length} date picker initialized`);
}

/**
 * Initialize color input listeners
 */
function initializeColorInputs() {
    const colorInputs = document.querySelectorAll('input.color-input');

    colorInputs.forEach(input => {
        // Manuel renk girişi değiştiğinde önizlemeyi güncelle
        input.addEventListener('input', function(e) {
            const color = e.target.value.trim();
            const wrapper = input.closest('.color-picker-wrapper');

            // Geçerli hex renk mi kontrol et
            if (wrapper && color.match(/^#[0-9A-Fa-f]{6}$/)) {
                const preview = wrapper.querySelector('.color-preview');
                if (preview) {
                    preview.style.backgroundColor = color;
                }
            }
        });
    });

    // Color picker butonlarına event listener ekle
    const colorButtons = document.querySelectorAll('.btn-color-picker');
    colorButtons.forEach(button => {
        button.addEventListener('click', function() {
            const wrapper = button.closest('.color-picker-wrapper');
            if (wrapper) {
                const fieldPath = wrapper.dataset.fieldPath;
                const input = wrapper.querySelector('.color-input');
                const currentColor = input ? input.value : '';
                openColorPicker(fieldPath, currentColor);
            }
        });
    });

    // Color preview'lara da event listener ekle
    const colorPreviews = document.querySelectorAll('.color-preview');
    colorPreviews.forEach(preview => {
        preview.addEventListener('click', function() {
            const wrapper = preview.closest('.color-picker-wrapper');
            if (wrapper) {
                const fieldPath = wrapper.dataset.fieldPath;
                const input = wrapper.querySelector('.color-input');
                const currentColor = input ? input.value : '';
                openColorPicker(fieldPath, currentColor);
            }
        });
    });

    console.log(`🎨 ${colorInputs.length} color input initialized`);
}

// ==================== COLOR PICKER ====================

// Site renk paleti
const SITE_COLORS = [
    { name: 'Primary', color: '#1F4C8A', category: 'Ana Renkler' },
    { name: 'Primary Dark', color: '#153a6d', category: 'Ana Renkler' },
    { name: 'Primary Light', color: '#3667a6', category: 'Ana Renkler' },
    { name: 'Secondary', color: '#C03221', category: 'Ana Renkler' },
    { name: 'Secondary Light', color: '#db4a39', category: 'Ana Renkler' },
    { name: 'Accent', color: '#FFC43D', category: 'Ana Renkler' },
    { name: 'Accent Light', color: '#ffd265', category: 'Ana Renkler' },
    { name: 'Tertiary', color: '#EEF9FC', category: 'Ana Renkler' },
    { name: 'Tertiary Dark', color: '#d5eef5', category: 'Ana Renkler' },
    { name: 'Beyaz', color: '#FFFFFF', category: 'Nötr' },
    { name: 'Siyah', color: '#000000', category: 'Nötr' },
    { name: 'Gri Açık', color: '#f8f9fa', category: 'Nötr' },
    { name: 'Gri', color: '#6c757d', category: 'Nötr' },
    { name: 'Gri Koyu', color: '#212529', category: 'Nötr' }
];

let colorPickerState = {
    currentFieldPath: null,
    currentValue: null,
    selectedColor: null
};

/**
 * Open color picker modal
 */
function openColorPicker(fieldPath, currentValue) {
    colorPickerState.currentFieldPath = fieldPath;
    colorPickerState.currentValue = currentValue;
    colorPickerState.selectedColor = currentValue;

    const modal = document.getElementById('colorPickerModal');

    // Populate site colors
    populateSiteColors();

    // Populate recent colors
    populateRecentColors();

    // Set current color in custom picker
    const customColorPicker = document.getElementById('customColorPicker');
    const customColorInput = document.getElementById('customColorInput');

    if (currentValue && currentValue.match(/^#[0-9A-Fa-f]{6}$/)) {
        customColorPicker.value = currentValue;
        customColorInput.value = currentValue;
    }

    // Show modal
    modal.classList.add('active');

    // Setup custom picker listeners
    setupCustomColorPicker();

    console.log(`🎨 Color picker opened for: ${fieldPath}`);
}

/**
 * Close color picker modal
 */
function closeColorPicker() {
    const modal = document.getElementById('colorPickerModal');
    modal.classList.remove('active');
    colorPickerState = {
        currentFieldPath: null,
        currentValue: null,
        selectedColor: null
    };
}

/**
 * Populate site colors grid
 */
function populateSiteColors() {
    const grid = document.getElementById('siteColorsGrid');

    let html = '';
    SITE_COLORS.forEach(colorInfo => {
        const isSelected = colorInfo.color.toLowerCase() === colorPickerState.selectedColor?.toLowerCase();
        html += `
            <div class="color-swatch ${isSelected ? 'selected' : ''}"
                 style="background-color: ${colorInfo.color}"
                 onclick="selectColor('${colorInfo.color}')"
                 title="${colorInfo.name} - ${colorInfo.color}">
                ${isSelected ? '<i class="bi bi-check-lg"></i>' : ''}
            </div>
        `;
    });

    grid.innerHTML = html;
}

/**
 * Populate recent colors
 */
function populateRecentColors() {
    const recentColors = getRecentColors();
    const section = document.getElementById('recentColorsSection');
    const grid = document.getElementById('recentColorsGrid');

    if (recentColors.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    let html = '';
    recentColors.forEach(color => {
        const isSelected = color.toLowerCase() === colorPickerState.selectedColor?.toLowerCase();
        html += `
            <div class="color-swatch ${isSelected ? 'selected' : ''}"
                 style="background-color: ${color}"
                 onclick="selectColor('${color}')"
                 title="${color}">
                ${isSelected ? '<i class="bi bi-check-lg"></i>' : ''}
            </div>
        `;
    });

    grid.innerHTML = html;
}

/**
 * Setup custom color picker listeners
 */
function setupCustomColorPicker() {
    const customColorPicker = document.getElementById('customColorPicker');
    const customColorInput = document.getElementById('customColorInput');

    // Remove old listeners
    customColorPicker.replaceWith(customColorPicker.cloneNode(true));
    customColorInput.replaceWith(customColorInput.cloneNode(true));

    // Get fresh references
    const picker = document.getElementById('customColorPicker');
    const input = document.getElementById('customColorInput');

    // Picker change
    picker.addEventListener('input', (e) => {
        const color = e.target.value.toUpperCase();
        input.value = color;
        selectColor(color);
    });

    // Input change
    input.addEventListener('input', (e) => {
        let color = e.target.value.trim();

        // Add # if missing
        if (color && !color.startsWith('#')) {
            color = '#' + color;
        }

        // Validate hex color
        if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
            picker.value = color;
            selectColor(color.toUpperCase());
        }
    });
}

/**
 * Select a color
 */
function selectColor(color) {
    colorPickerState.selectedColor = color.toUpperCase();

    // Update visual selection
    populateSiteColors();
    populateRecentColors();

    // Update custom picker
    document.getElementById('customColorPicker').value = color;
    document.getElementById('customColorInput').value = color.toUpperCase();
}

/**
 * Apply selected color
 */
function applySelectedColor() {
    if (!colorPickerState.selectedColor || !colorPickerState.currentFieldPath) {
        console.warn('⚠️ No color or field path selected');
        closeColorPicker();
        return;
    }

    const color = colorPickerState.selectedColor;
    const fieldPath = colorPickerState.currentFieldPath;

    console.log(`🎨 Applying color: ${color} to field: ${fieldPath}`);

    // 1. Update JSON data first
    setNestedValue(adminPanel.currentData, fieldPath, color);
    adminPanel.isDirty = true;
    updateChangesIndicator();

    // 2. Find ALL input fields with this data-field and update them (modal + editor)
    const inputs = document.querySelectorAll(`input.color-input[data-field="${fieldPath}"]`);

    console.log(`🔍 Found ${inputs.length} input(s) with data-field="${fieldPath}"`);

    inputs.forEach((input, index) => {
        console.log(`📝 Updating input #${index + 1}`);

        // Update input value
        input.value = color;

        // Update color preview
        const wrapper = input.closest('.color-picker-wrapper');
        if (wrapper) {
            const preview = wrapper.querySelector('.color-preview');
            if (preview) {
                preview.style.backgroundColor = color;
                console.log(`✅ Preview #${index + 1} updated to: ${color}`);
            }
        }

        // Trigger change event to ensure any other listeners are notified
        const event = new Event('change', { bubbles: true });
        input.dispatchEvent(event);
    });

    // 3. Save to recent colors
    addToRecentColors(color);

    // 4. Update preview
    updatePreview();

    // 5. Close modal
    closeColorPicker();

    console.log(`✅ Color ${color} applied successfully to ${inputs.length} field(s)`);
}

/**
 * Get recent colors from localStorage
 */
function getRecentColors() {
    try {
        const stored = localStorage.getItem('adminPanel_recentColors');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.warn('localStorage access blocked, using fallback');
        return [];
    }
}

/**
 * Add color to recent colors
 */
function addToRecentColors(color) {
    try {
        let recentColors = getRecentColors();

        // Remove if already exists
        recentColors = recentColors.filter(c => c.toLowerCase() !== color.toLowerCase());

        // Add to beginning
        recentColors.unshift(color.toUpperCase());

        // Keep only last 10
        recentColors = recentColors.slice(0, 10);

        // Save to localStorage
        localStorage.setItem('adminPanel_recentColors', JSON.stringify(recentColors));
    } catch (e) {
        console.warn('localStorage access blocked, skipping recent colors');
    }
}

/**
 * Move card up/down - Updated for non-array sections
 */
function moveCard(sectionKey, index, direction) {
    const section = adminPanel.currentData[sectionKey];
    
    // Only works for arrays
    if (!Array.isArray(section)) {
        console.warn('Move card only works for array sections');
        return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= section.length) return;

    // Swap
    [section[index], section[newIndex]] = [section[newIndex], section[index]];

    // Mark as dirty and re-render
    adminPanel.isDirty = true;
    updateChangesIndicator();
    renderEditor();
}

/**
 * Delete card - Updated for non-array sections
 */
function deleteCard(sectionKey, index) {
    const section = adminPanel.currentData[sectionKey];
    
    // Only works for arrays
    if (!Array.isArray(section)) {
        console.warn('Delete card only works for array sections');
        return;
    }
    
    if (!confirm('Bu kartı silmek istediğinize emin misiniz?')) return;

    section.splice(index, 1);

    // Mark as dirty and re-render
    adminPanel.isDirty = true;
    updateChangesIndicator();
    renderEditor();
}

/**
 * Add new card - Updated for non-array sections
 */
function addNewCard(sectionKey) {
    const section = adminPanel.currentData[sectionKey];
    
    // Only works for arrays
    if (!Array.isArray(section)) {
        console.warn('Add new card only works for array sections');
        return;
    }

    // Create new empty card based on first card structure
    const template = section[0] ? JSON.parse(JSON.stringify(section[0])) : { title: { tr: '', en: '' } };

    // Clear all values
    clearObjectValues(template);

    section.push(template);

    // Mark as dirty and re-render
    adminPanel.isDirty = true;
    updateChangesIndicator();
    renderEditor();
}
