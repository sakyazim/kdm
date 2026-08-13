/**
 * JSON Editor Dashboard
 * Tüm JSON dosyalarını görsel olarak düzenlemek için kapsamlı araç
 */

class JsonEditorDashboard {
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
            document.getElementById('editorForm').style.display = 'block';
            document.getElementById('downloadJsonBtn').disabled = false;
            document.getElementById('uploadJsonBtn').disabled = false;
            document.getElementById('copyJsonBtn').disabled = false;
            document.getElementById('fullscreenJsonBtn').disabled = false;

            this.renderForm();
            this.updatePreview();

        } catch (error) {
            console.error('Dosya yükleme hatası:', error);
            alert('JSON dosyası yüklenirken bir hata oluştu!');
        }
    }

    renderForm() {
        const formFields = document.getElementById('formFields');
        formFields.innerHTML = '';

        this.renderObject(this.currentData, '', formFields);
    }

    renderObject(obj, path, container, level = 0) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const fullPath = path ? `${path}.${key}` : key;

            if (Array.isArray(value)) {
                this.renderArray(value, fullPath, key, container, level);
            } else if (typeof value === 'object' && value !== null) {
                this.renderNestedObject(value, fullPath, key, container, level);
            } else {
                this.renderField(key, value, fullPath, container, level);
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
        arrayCard.className = `card mb-3 ms-${level * 3} border-primary`;
        arrayCard.innerHTML = `
            <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <strong><i class="bi bi-list-ul me-2"></i>${this.formatLabel(label)}</strong>
                <button type="button" class="btn btn-sm btn-light add-array-item add-array-item-top">
                    <i class="bi bi-plus-lg"></i> Ekle
                </button>
            </div>
            <div class="card-body array-container p-2"></div>
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
            this.renderArrayItem(item, `${path}[${index}]`, index, arrayContainer, level);
        });

        // Yeni item ekleme fonksiyonu (ortak kullanım için)
        const addNewItem = () => {
            const newItem = Array.isArray(arr[0]) ? [] : (typeof arr[0] === 'object' ? {} : '');
            arr.push(newItem);
            this.renderForm();
            this.updatePreview();
        };

        // Hem üst hem alt Ekle butonlarına aynı fonksiyonu bağla
        arrayCard.querySelector('.add-array-item-top').addEventListener('click', addNewItem);
        arrayCard.querySelector('.add-array-item-bottom').addEventListener('click', addNewItem);
    }

    renderArrayItem(item, path, index, container, level) {
        const itemCard = document.createElement('div');
        itemCard.className = 'card mb-2';
        itemCard.innerHTML = `
            <div class="card-header bg-light d-flex justify-content-between align-items-center py-2">
                <strong class="small">#${index + 1}</strong>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-danger delete-item" title="Sil">
                        <i class="bi bi-trash"></i>
                    </button>
                    ${index > 0 ? '<button type="button" class="btn btn-outline-secondary move-up" title="Yukarı"><i class="bi bi-arrow-up"></i></button>' : ''}
                    ${index < container.children.length ? '<button type="button" class="btn btn-outline-secondary move-down" title="Aşağı"><i class="bi bi-arrow-down"></i></button>' : ''}
                </div>
            </div>
            <div class="card-body py-2 item-content"></div>
        `;

        const itemContent = itemCard.querySelector('.item-content');

        if (typeof item === 'object' && !Array.isArray(item)) {
            this.renderObject(item, path, itemContent, level + 1);
        } else {
            this.renderField('value', item, `${path}.value`, itemContent, level);
        }

        // Silme işlemi
        itemCard.querySelector('.delete-item').addEventListener('click', () => {
            const pathParts = path.match(/(.+)\[(\d+)\]/);
            if (pathParts) {
                const arr = this.getValueByPath(pathParts[1]);
                arr.splice(parseInt(pathParts[2]), 1);
                this.renderForm();
                this.updatePreview();
            }
        });

        container.appendChild(itemCard);
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
        return path.split(/\.|\[|\]/).filter(Boolean).reduce((obj, key) => {
            return obj ? obj[key] : undefined;
        }, this.currentData);
    }

    setValueByPath(path, value) {
        const keys = path.split(/\.|\[|\]/).filter(Boolean);
        const lastKey = keys.pop();
        const target = keys.reduce((obj, key) => obj[key], this.currentData);
        target[lastKey] = value;
    }

    updatePreview() {
        const preview = document.getElementById('jsonPreview');
        const jsonString = JSON.stringify(this.currentData, null, 2);

        preview.innerHTML = `<code>${this.syntaxHighlight(jsonString)}</code>`;

        // Size ve status
        document.getElementById('jsonSize').textContent = `${jsonString.length} karakter`;

        try {
            JSON.parse(jsonString);
            document.getElementById('jsonStatus').className = 'badge bg-success';
            document.getElementById('jsonStatus').textContent = 'Geçerli';
        } catch (e) {
            document.getElementById('jsonStatus').className = 'badge bg-danger';
            document.getElementById('jsonStatus').textContent = 'Hatalı';
        }
    }

    syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
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
            this.updateLayout();
            this.saveSidebarState();
        });

        // Preview Toggle
        const previewToggle = document.getElementById('previewToggle');
        const previewColumn = document.getElementById('previewColumn');

        previewToggle.addEventListener('click', () => {
            this.previewCollapsed = !this.previewCollapsed;
            this.updateLayout();
            this.savePreviewState();
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

        // Copy JSON
        document.getElementById('copyJsonBtn').addEventListener('click', () => {
            const jsonString = JSON.stringify(this.currentData, null, 2);
            navigator.clipboard.writeText(jsonString).then(() => {
                const btn = document.getElementById('copyJsonBtn');
                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check-lg"></i>';
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                }, 1000);
            });
        });

        // Fullscreen JSON
        document.getElementById('fullscreenJsonBtn').addEventListener('click', () => {
            this.openFullscreenJson();
        });

        // Fullscreen Copy
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

        // Fullscreen Download
        document.getElementById('fullscreenDownloadBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        // File Search
        document.getElementById('fileSearch').addEventListener('input', (e) => {
            this.searchFiles(e.target.value.toLowerCase());
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

    updateLayout() {
        const sidebarColumn = document.getElementById('sidebarColumn');
        const sidebarToggle = document.getElementById('sidebarToggle');
        const previewColumn = document.getElementById('previewColumn');
        const previewToggle = document.getElementById('previewToggle');
        const editorColumn = document.getElementById('editorColumn');

        // Sidebar durumu
        if (this.sidebarCollapsed) {
            sidebarColumn.classList.add('sidebar-collapsed');
            sidebarToggle.querySelector('i').className = 'bi bi-chevron-right';
        } else {
            sidebarColumn.classList.remove('sidebar-collapsed');
            sidebarToggle.querySelector('i').className = 'bi bi-chevron-left';
        }

        // Preview durumu
        if (this.previewCollapsed) {
            previewColumn.classList.add('preview-collapsed');
            previewToggle.querySelector('i').className = 'bi bi-chevron-left';
        } else {
            previewColumn.classList.remove('preview-collapsed');
            previewToggle.querySelector('i').className = 'bi bi-chevron-right';
        }

        // Editor column genişliğini ayarla
        editorColumn.classList.remove('col-lg-2', 'col-lg-3', 'col-lg-7', 'col-lg-9', 'col-lg-10', 'col-lg-12');
        editorColumn.classList.remove('col-md-3', 'col-md-6', 'col-md-9', 'col-md-12');

        if (this.sidebarCollapsed && this.previewCollapsed) {
            // Her ikisi de kapalı - tam ekran
            editorColumn.classList.add('col-lg-12', 'col-md-12');
        } else if (this.sidebarCollapsed) {
            // Sadece sidebar kapalı
            editorColumn.classList.add('col-lg-9', 'col-md-9');
        } else if (this.previewCollapsed) {
            // Sadece preview kapalı
            editorColumn.classList.add('col-lg-10', 'col-md-9');
        } else {
            // Her ikisi de açık - normal
            editorColumn.classList.add('col-lg-7', 'col-md-6');
        }
    }

    loadSidebarState() {
        // LocalStorage'dan sidebar durumunu yükle
        const savedSidebarState = localStorage.getItem('sidebarCollapsed');
        const savedPreviewState = localStorage.getItem('previewCollapsed');

        if (savedSidebarState === 'true') {
            this.sidebarCollapsed = true;
        }

        if (savedPreviewState === 'true') {
            this.previewCollapsed = true;
        }

        // Layout'u güncelle
        if (this.sidebarCollapsed || this.previewCollapsed) {
            this.updateLayout();
        }
    }

    saveSidebarState() {
        localStorage.setItem('sidebarCollapsed', this.sidebarCollapsed);
    }

    savePreviewState() {
        localStorage.setItem('previewCollapsed', this.previewCollapsed);
    }

    openFullscreenJson() {
        if (!this.currentData) {
            alert('Önce bir JSON dosyası yükleyin!');
            return;
        }

        // JSON'u hazırla
        const jsonString = JSON.stringify(this.currentData, null, 2);
        const preview = document.getElementById('fullscreenJsonPreview');
        preview.innerHTML = `<code>${this.syntaxHighlight(jsonString)}</code>`;

        // Dosya bilgilerini güncelle
        const fileName = this.currentFile ? this.currentFile.split('/').pop() : 'bilinmiyor.json';
        document.getElementById('fullscreenFileName').textContent = `Dosya: ${fileName}`;
        document.getElementById('fullscreenJsonSize').textContent = `${jsonString.length} karakter`;

        // Status güncelle
        try {
            JSON.parse(jsonString);
            document.getElementById('fullscreenJsonStatus').className = 'badge bg-success';
            document.getElementById('fullscreenJsonStatus').textContent = 'Geçerli';
        } catch (e) {
            document.getElementById('fullscreenJsonStatus').className = 'badge bg-danger';
            document.getElementById('fullscreenJsonStatus').textContent = 'Hatalı';
        }

        // Modal'ı aç
        this.fullscreenModal.show();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new JsonEditorDashboard();
});
