/**
 * JSON Editor Enhancements
 * Daha görsel ve kullanıcı dostu JSON düzenleme deneyimi sağlar
 */

// JSON Düzenleyici Geliştirmeleri
const JSONEditorEnhancements = {
    // Düzenlenen JSON verisi
    currentJsonData: null,
    // Aktif düzenleme yolu (path)
    activePath: '',
    // Vurgulama zamanı (ms)
    highlightDuration: 2000,
    // Vurgulama rengi
    highlightColor: 'rgba(255, 193, 7, 0.3)',
    // Vurgulama geçiş rengi
    highlightTransition: 'background-color 0.5s ease',

    /**
     * Editörü başlat
     */
    init: function() {
        // Ağaç görünümü oluşturma butonunu ekle
        this.addTreeViewToggle();
        // Yol göstergesini ekle
        this.addPathIndicator();
        // Vurgulama butonunu ekle
        this.addHighlightButton();
        // Düzenleme alanlarını geliştir
        this.enhanceFormFields();
    },

    /**
     * Ağaç görünümü geçiş düğmesini ekle
     */
    addTreeViewToggle: function() {
        const editorHeader = document.querySelector('#editorColumn .card-header .btn-group');
        
        if (editorHeader) {
            const treeViewBtn = document.createElement('button');
            treeViewBtn.className = 'btn btn-sm btn-outline-secondary';
            treeViewBtn.id = 'treeViewToggle';
            treeViewBtn.title = 'Ağaç Görünümü';
            treeViewBtn.innerHTML = '<i class="bi bi-diagram-3"></i>';
            treeViewBtn.addEventListener('click', this.toggleTreeView.bind(this));
            
            editorHeader.prepend(treeViewBtn);
        }
    },

    /**
     * Yol göstergesini ekle
     */
    addPathIndicator: function() {
        const editorForm = document.getElementById('editorForm');
        
        if (editorForm) {
            const pathIndicator = document.createElement('div');
            pathIndicator.className = 'path-indicator alert alert-light mb-3 p-2 d-flex align-items-center';
            pathIndicator.id = 'jsonPathIndicator';
            pathIndicator.innerHTML = '<i class="bi bi-diagram-2 me-2"></i><span>Root</span>';
            
            editorForm.prepend(pathIndicator);
        }
    },

    /**
     * Vurgulama butonunu ekle
     */
    addHighlightButton: function() {
        const formFields = document.getElementById('formFields');
        
        if (formFields) {
            // MutationObserver ile form alanlarını izle
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        this.addHighlightButtonsToFields();
                    }
                });
            });
            
            observer.observe(formFields, { childList: true, subtree: true });
        }
    },

    /**
     * Form alanlarına vurgulama butonları ekle
     */
    addHighlightButtonsToFields: function() {
        const formGroups = document.querySelectorAll('.form-group');
        
        formGroups.forEach(group => {
            if (!group.querySelector('.highlight-btn') && group.querySelector('label')) {
                const fieldId = group.querySelector('input, textarea, select')?.id;
                if (!fieldId) return;
                
                const path = this.getPathFromFieldId(fieldId);
                const highlightBtn = document.createElement('button');
                highlightBtn.type = 'button';
                highlightBtn.className = 'highlight-btn btn btn-sm btn-outline-warning ms-2';
                highlightBtn.innerHTML = '<i class="bi bi-lightbulb"></i>';
                highlightBtn.title = 'Önizlemede Göster';
                highlightBtn.setAttribute('data-path', path);
                highlightBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.highlightElementInPreview(path);
                });
                
                const label = group.querySelector('label');
                label.appendChild(highlightBtn);
            }
        });
    },

    /**
     * Alan ID'sinden yol bilgisini çıkar
     */
    getPathFromFieldId: function(fieldId) {
        // Alan ID'si genellikle "field_path_to_property" formatındadır
        return fieldId.replace('field_', '').replace(/_/g, '.');
    },

    /**
     * Önizlemede elementi vurgula
     */
    highlightElementInPreview: function(path) {
        this.activePath = path;
        
        // Path göstergesini güncelle
        const pathIndicator = document.getElementById('jsonPathIndicator');
        if (pathIndicator) {
            pathIndicator.querySelector('span').textContent = path || 'Root';
        }
        
        // Önizleme iframe'ine erişim
        const iframe = document.getElementById('livePreviewIframe');
        if (!iframe || !iframe.contentWindow) return;
        
        // Path'e göre elementi bul ve vurgula
        const iframeDoc = iframe.contentWindow.document;
        
        // Path'i parçalara ayır
        const pathParts = path.split('.');
        
        // Vurgulanacak elementi bulmak için selector oluştur
        // Bu kısım, önizleme sayfasının yapısına göre özelleştirilmelidir
        let selector = '';
        
        // Örnek: "sections.0.title" -> "[data-section='0'] .title"
        if (pathParts.includes('sections')) {
            const sectionIndex = pathParts[pathParts.indexOf('sections') + 1];
            if (!isNaN(sectionIndex)) {
                selector = `[data-section='${sectionIndex}']`;
                
                // Alt özellikler için
                if (pathParts.length > pathParts.indexOf('sections') + 2) {
                    const property = pathParts[pathParts.indexOf('sections') + 2];
                    selector += ` .${property}`;
                }
            }
        } else if (pathParts.includes('header')) {
            selector = '.page-header';
            
            // Alt özellikler için
            if (pathParts.length > pathParts.indexOf('header') + 1) {
                const property = pathParts[pathParts.indexOf('header') + 1];
                selector += ` .${property}`;
            }
        } else if (pathParts.includes('footer')) {
            selector = '.page-footer';
        } else if (pathParts.includes('meta')) {
            // Meta alanları genellikle görünmez, sayfa başlığını vurgulayalım
            selector = 'title';
        }
        
        // Elementi bul
        if (selector) {
            try {
                const element = iframeDoc.querySelector(selector);
                if (element) {
                    // Eski vurgulamaları temizle
                    const highlighted = iframeDoc.querySelectorAll('.json-editor-highlight');
                    highlighted.forEach(el => {
                        el.classList.remove('json-editor-highlight');
                        el.style.backgroundColor = '';
                        el.style.transition = '';
                    });
                    
                    // Yeni elementi vurgula
                    element.classList.add('json-editor-highlight');
                    element.style.backgroundColor = this.highlightColor;
                    element.style.transition = this.highlightTransition;
                    
                    // Görünüm alanına kaydır
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Belirli bir süre sonra vurgulamayı kaldır
                    setTimeout(() => {
                        element.style.backgroundColor = 'transparent';
                        setTimeout(() => {
                            element.classList.remove('json-editor-highlight');
                            element.style.transition = '';
                        }, 500);
                    }, this.highlightDuration);
                }
            } catch (error) {
                console.error('Vurgulama hatası:', error);
            }
        }
    },

    /**
     * Ağaç görünümünü aç/kapat
     */
    toggleTreeView: function() {
        const formFields = document.getElementById('formFields');
        const treeViewBtn = document.getElementById('treeViewToggle');
        
        if (!this.currentJsonData) {
            // Mevcut JSON verisini al
            try {
                const formData = this.collectFormData();
                this.currentJsonData = formData;
            } catch (error) {
                console.error('JSON verisi alınamadı:', error);
                return;
            }
        }
        
        if (formFields.classList.contains('tree-view-active')) {
            // Ağaç görünümünden normal forma geç
            formFields.classList.remove('tree-view-active');
            formFields.innerHTML = ''; // İçeriği temizle
            
            // Normal form alanlarını yeniden oluştur
            // Bu kısım admin-panel.js'deki orijinal form oluşturma mantığına bağlıdır
            if (window.renderJsonEditor) {
                window.renderJsonEditor(this.currentJsonData);
            }
            
            if (treeViewBtn) {
                treeViewBtn.innerHTML = '<i class="bi bi-diagram-3"></i>';
                treeViewBtn.title = 'Ağaç Görünümü';
            }
        } else {
            // Normal formdan ağaç görünümüne geç
            formFields.classList.add('tree-view-active');
            
            // Ağaç görünümünü oluştur
            this.renderTreeView(formFields, this.currentJsonData);
            
            if (treeViewBtn) {
                treeViewBtn.innerHTML = '<i class="bi bi-list-ul"></i>';
                treeViewBtn.title = 'Form Görünümü';
            }
        }
    },

    /**
     * Form verilerini topla
     */
    collectFormData: function() {
        // Bu fonksiyon admin-panel.js'deki form verisi toplama mantığına bağlıdır
        // Eğer orada global bir fonksiyon varsa onu kullanabiliriz
        if (window.getFormData) {
            return window.getFormData();
        }
        
        // Yoksa basit bir form verisi toplama işlemi yapalım
        const formData = {};
        const inputs = document.querySelectorAll('#editorForm input, #editorForm textarea, #editorForm select');
        
        inputs.forEach(input => {
            const id = input.id;
            if (id && id.startsWith('field_')) {
                const path = id.replace('field_', '').replace(/_/g, '.');
                const pathParts = path.split('.');
                
                let current = formData;
                for (let i = 0; i < pathParts.length - 1; i++) {
                    const part = pathParts[i];
                    if (!current[part]) {
                        current[part] = {};
                    }
                    current = current[part];
                }
                
                const lastPart = pathParts[pathParts.length - 1];
                current[lastPart] = input.value;
            }
        });
        
        return formData;
    },

    /**
     * Ağaç görünümünü oluştur
     */
    renderTreeView: function(container, data, path = '') {
        container.innerHTML = '';
        
        const treeContainer = document.createElement('div');
        treeContainer.className = 'json-tree-container';
        
        // Ağaç başlığı
        const treeHeader = document.createElement('div');
        treeHeader.className = 'json-tree-header mb-3';
        treeHeader.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                <strong>Ağaç Görünümü Modu</strong> - JSON yapısını hiyerarşik olarak görüntüleyin.
                <button class="btn btn-sm btn-outline-primary float-end" id="expandAllBtn">Tümünü Genişlet</button>
            </div>
        `;
        treeContainer.appendChild(treeHeader);
        
        // Ağaç içeriği
        const treeContent = document.createElement('div');
        treeContent.className = 'json-tree-content';
        
        this.buildTreeNodes(treeContent, data, path);
        treeContainer.appendChild(treeContent);
        
        container.appendChild(treeContainer);
        
        // Tümünü genişlet butonu işlevselliği
        document.getElementById('expandAllBtn').addEventListener('click', () => {
            const collapsedItems = container.querySelectorAll('.json-tree-collapsed');
            collapsedItems.forEach(item => {
                item.classList.remove('json-tree-collapsed');
            });
        });
    },

    /**
     * Ağaç düğümlerini oluştur
     */
    buildTreeNodes: function(container, data, path = '') {
        if (!data || typeof data !== 'object') return;
        
        const list = document.createElement('ul');
        list.className = 'json-tree-list';
        
        Object.keys(data).forEach(key => {
            const value = data[key];
            const nodePath = path ? `${path}.${key}` : key;
            const item = document.createElement('li');
            item.className = 'json-tree-item';
            
            const isObject = value && typeof value === 'object';
            
            // Düğüm içeriği
            const nodeContent = document.createElement('div');
            nodeContent.className = 'json-tree-node';
            nodeContent.innerHTML = `
                <span class="json-tree-key">
                    ${isObject ? '<i class="bi bi-caret-down-fill json-tree-caret"></i>' : ''}
                    <strong>${key}</strong>
                </span>
                ${!isObject ? `<span class="json-tree-value">${this.formatValue(value)}</span>` : ''}
                <div class="json-tree-actions">
                    <button class="btn btn-sm btn-outline-warning highlight-btn" title="Önizlemede Göster">
                        <i class="bi bi-lightbulb"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-primary edit-btn" title="Düzenle">
                        <i class="bi bi-pencil"></i>
                    </button>
                </div>
            `;
            
            // Vurgulama butonu işlevselliği
            const highlightBtn = nodeContent.querySelector('.highlight-btn');
            highlightBtn.addEventListener('click', () => {
                this.highlightElementInPreview(nodePath);
            });
            
            // Düzenleme butonu işlevselliği
            const editBtn = nodeContent.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => {
                // Form görünümüne geç ve ilgili alanı bul
                this.toggleTreeView();
                setTimeout(() => {
                    const fieldId = `field_${nodePath.replace(/\./g, '_')}`;
                    const field = document.getElementById(fieldId);
                    if (field) {
                        field.focus();
                        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        field.style.backgroundColor = '#fff3cd';
                        setTimeout(() => {
                            field.style.backgroundColor = '';
                            field.style.transition = 'background-color 0.5s ease';
                        }, 1500);
                    }
                }, 300);
            });
            
            item.appendChild(nodeContent);
            
            // Alt düğümler
            if (isObject) {
                const childContainer = document.createElement('div');
                childContainer.className = 'json-tree-children';
                this.buildTreeNodes(childContainer, value, nodePath);
                item.appendChild(childContainer);
                
                // Genişletme/daraltma işlevselliği
                nodeContent.querySelector('.json-tree-key').addEventListener('click', () => {
                    item.classList.toggle('json-tree-collapsed');
                    const caret = nodeContent.querySelector('.json-tree-caret');
                    if (caret) {
                        caret.classList.toggle('bi-caret-down-fill');
                        caret.classList.toggle('bi-caret-right-fill');
                    }
                });
            }
            
            list.appendChild(item);
        });
        
        container.appendChild(list);
    },

    /**
     * Değeri formatla
     */
    formatValue: function(value) {
        if (value === null) return '<em class="text-muted">null</em>';
        if (value === undefined) return '<em class="text-muted">undefined</em>';
        if (value === '') return '<em class="text-muted">empty string</em>';
        
        if (typeof value === 'string') {
            // URL kontrolü
            if (value.match(/^https?:\/\//)) {
                return `<a href="${value}" target="_blank" class="text-primary">${value}</a>`;
            }
            // Resim URL kontrolü
            if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                return `<span class="text-success">${value}</span> <i class="bi bi-image text-muted"></i>`;
            }
            return `<span class="text-success">"${value}"</span>`;
        }
        
        if (typeof value === 'number') return `<span class="text-primary">${value}</span>`;
        if (typeof value === 'boolean') return `<span class="text-danger">${value}</span>`;
        
        return String(value);
    },

    /**
     * Form alanlarını geliştir
     */
    enhanceFormFields: function() {
        // MutationObserver ile form alanlarını izle
        const formFields = document.getElementById('formFields');
        
        if (formFields) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        this.addFieldEnhancements();
                    }
                });
            });
            
            observer.observe(formFields, { childList: true, subtree: true });
        }
    },

    /**
     * Form alanlarına geliştirmeler ekle
     */
    addFieldEnhancements: function() {
        // Metin alanları için zengin metin düzenleyici
        const textareas = document.querySelectorAll('textarea[data-field-type="longtext"]');
        textareas.forEach(textarea => {
            if (!textarea.classList.contains('enhanced')) {
                textarea.classList.add('enhanced');
                
                // Araç çubuğu ekle
                const toolbar = document.createElement('div');
                toolbar.className = 'btn-toolbar mb-2';
                toolbar.innerHTML = `
                    <div class="btn-group me-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="bold" title="Kalın">
                            <i class="bi bi-type-bold"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="italic" title="İtalik">
                            <i class="bi bi-type-italic"></i>
                        </button>
                    </div>
                    <div class="btn-group me-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="link" title="Link">
                            <i class="bi bi-link"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="image" title="Resim">
                            <i class="bi bi-image"></i>
                        </button>
                    </div>
                `;
                
                // Butonlara işlevsellik ekle
                toolbar.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        const action = button.getAttribute('data-action');
                        this.applyTextAction(textarea, action);
                    });
                });
                
                // Araç çubuğunu textarea'dan önce ekle
                textarea.parentNode.insertBefore(toolbar, textarea);
            }
        });
        
        // Resim URL'leri için önizleme
        const imageInputs = document.querySelectorAll('input[type="text"][id*="image"], input[type="text"][id*="logo"], input[type="text"][id*="icon"]');
        imageInputs.forEach(input => {
            if (!input.nextElementSibling?.classList.contains('image-preview')) {
                const previewContainer = document.createElement('div');
                previewContainer.className = 'image-preview mt-2';
                previewContainer.style.display = 'none';
                
                const previewImage = document.createElement('img');
                previewImage.className = 'img-thumbnail';
                previewImage.style.maxHeight = '100px';
                previewContainer.appendChild(previewImage);
                
                input.parentNode.insertBefore(previewContainer, input.nextSibling);
                
                // URL değiştiğinde önizlemeyi güncelle
                input.addEventListener('input', () => {
                    const url = input.value.trim();
                    if (url && (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || url.startsWith('http'))) {
                        previewImage.src = url;
                        previewImage.onload = () => {
                            previewContainer.style.display = 'block';
                        };
                        previewImage.onerror = () => {
                            previewContainer.style.display = 'none';
                        };
                    } else {
                        previewContainer.style.display = 'none';
                    }
                });
                
                // Mevcut değer için önizleme göster
                if (input.value) {
                    input.dispatchEvent(new Event('input'));
                }
            }
        });
        
        // Renk seçiciler
        const colorInputs = document.querySelectorAll('input[type="text"][id*="color"], input[type="text"][id*="background"]');
        colorInputs.forEach(input => {
            if (!input.classList.contains('enhanced')) {
                input.classList.add('enhanced');
                
                // Renk seçici oluştur
                const colorPicker = document.createElement('input');
                colorPicker.type = 'color';
                colorPicker.className = 'form-control-color ms-2';
                colorPicker.value = input.value.startsWith('#') ? input.value : '#ffffff';
                
                // Renk seçici değiştiğinde metin alanını güncelle
                colorPicker.addEventListener('input', () => {
                    input.value = colorPicker.value;
                    input.style.borderLeft = `10px solid ${colorPicker.value}`;
                });
                
                // Metin alanı değiştiğinde renk seçiciyi güncelle
                input.addEventListener('input', () => {
                    if (input.value.startsWith('#')) {
                        colorPicker.value = input.value;
                        input.style.borderLeft = `10px solid ${input.value}`;
                    }
                });
                
                // Renk seçiciyi metin alanının yanına ekle
                input.parentNode.insertBefore(colorPicker, input.nextSibling);
                
                // Mevcut değer için stil uygula
                if (input.value.startsWith('#')) {
                    input.style.borderLeft = `10px solid ${input.value}`;
                }
            }
        });
    },

    /**
     * Metin alanına eylem uygula
     */
    applyTextAction: function(textarea, action) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        let replacement = '';
        
        switch (action) {
            case 'bold':
                replacement = `**${selectedText}**`;
                break;
            case 'italic':
                replacement = `*${selectedText}*`;
                break;
            case 'link':
                const url = prompt('URL giriniz:', 'https://');
                if (url) {
                    replacement = `[${selectedText || 'Link'}](${url})`;
                } else {
                    return;
                }
                break;
            case 'image':
                const imageUrl = prompt('Resim URL giriniz:', 'https://');
                if (imageUrl) {
                    replacement = `![${selectedText || 'Resim'}](${imageUrl})`;
                } else {
                    return;
                }
                break;
        }
        
        if (replacement) {
            textarea.focus();
            textarea.setRangeText(replacement, start, end, 'end');
        }
    }
};

// Sayfa yüklendiğinde JSON Düzenleyici Geliştirmelerini başlat
document.addEventListener('DOMContentLoaded', function() {
    // Orijinal admin-panel.js yüklendikten sonra geliştirmeleri başlat
    setTimeout(() => {
        JSONEditorEnhancements.init();
    }, 500);
});