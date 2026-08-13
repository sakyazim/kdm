/**
 * FILE MANAGER
 * Handles file loading, saving, and management
 */

class FileManager {
  constructor() {
    this.currentCategory = 'pages';
    this.currentFile = null;
    this.currentData = null;
    this.isDirty = false;
  }

  /**
   * Initialize file list
   */
  init() {
    this.renderFileList();
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search
    document.getElementById('fileSearch').addEventListener('input', (e) => {
      this.filterFiles(e.target.value);
    });
  }

  /**
   * Render file list
   */
  renderFileList() {
    const fileListEl = document.getElementById('fileList');
    const categories = ADMIN_CONFIG.fileCategories;

    if (!categories || categories.length === 0) {
      fileListEl.innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: 20px;">Kategori bulunamadı</p>';
      return;
    }

    let html = '';

    categories.forEach(category => {
      // File group with header
      html += `
        <div class="file-group ${category.collapsed ? 'collapsed' : ''}">
          <button class="file-group-header" onclick="toggleFileGroup(this)">
            <i class="${category.icon}"></i>
            <span>${category.label}</span>
            <i class="bi bi-chevron-down chevron"></i>
          </button>
          <div class="file-group-content ${category.collapsed ? 'hidden' : ''}">
            ${category.files.map(file => {
              // Tam dosya yolunu oluştur
              const fullPath = `../data/${file.path}${file.id}.json`;
              return `
                <div class="file-item" data-path="${fullPath}" onclick="fileManager.loadFile('${fullPath}')">
                  <i class="bi bi-file-earmark-text"></i>
                  <span>${file.label}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    });

    fileListEl.innerHTML = html;
  }

  /**
   * Filter files by search query
   */
  filterFiles(query) {
    const items = document.querySelectorAll('.file-item');
    const lowerQuery = query.toLowerCase();

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      const match = text.includes(lowerQuery);
      item.style.display = match ? 'flex' : 'none';
    });

    // Show/hide groups
    document.querySelectorAll('.file-group').forEach(group => {
      const visibleItems = group.querySelectorAll('.file-item[style*="display: flex"], .file-item:not([style*="display: none"])');
      group.style.display = visibleItems.length > 0 ? 'block' : 'none';
    });
  }

  /**
   * Load file - BASIT VE DİREKT
   */
  async loadFile(fullPath) {
    console.log(`📂 Loading file: ${fullPath}`);

    try {
      const response = await fetch(fullPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract file ID from path
      const fileId = fullPath.split('/').pop().replace('.json', '');

      // Admin panel state'ini güncelle
      adminPanel.currentFile = {
        id: fileId,
        path: fullPath
      };
      adminPanel.currentData = data;
      adminPanel.originalData = JSON.parse(JSON.stringify(data));
      adminPanel.isDirty = false;

      // UI'ı güncelle
      updateChangesIndicator();
      renderEditor();

      // Welcome screen gizle, editor göster
      document.getElementById('welcomeScreen').style.display = 'none';
      document.getElementById('editorHeader').style.display = 'block';
      document.getElementById('editorBody').style.display = 'block';

      // Active class ekle
      document.querySelectorAll('.file-item').forEach(item => {
        item.classList.toggle('active', item.dataset.path === fullPath);
      });

      console.log(`✅ Loaded: ${fileId}`);

    } catch (error) {
      console.error('❌ Error:', error);
      alert(`Dosya yüklenemedi!\n\nYol: ${fullPath}\nHata: ${error.message}`);
    }
  }

  /**
   * Update file UI (active state, info box)
   */
  updateFileUI() {
    // Update active state
    document.querySelectorAll('.file-item').forEach(item => {
      item.classList.toggle('active', item.dataset.file === this.currentFile);
    });

    // Update editor title
    const fileLabel = this.getFileLabel(this.currentFile);
    if (document.getElementById('editorFileName')) {
      document.getElementById('editorFileName').textContent = fileLabel;
    }

    // Update breadcrumb
    const categories = ADMIN_CONFIG.fileCategories;
    const category = categories.find(cat => cat.files.some(f => f.id === this.currentFile));
    if (category && document.getElementById('editorBreadcrumb')) {
      document.getElementById('editorBreadcrumb').textContent = `${category.label} / ${fileLabel}`;
    }
  }

  /**
   * Get file label from ID
   */
  getFileLabel(fileId) {
    const categories = ADMIN_CONFIG.fileCategories;

    for (const category of categories) {
      const file = category.files.find(f => f.id === fileId);
      if (file) return file.label;
    }

    return fileId;
  }

  /**
   * Save file (downloads JSON)
   */
  downloadFile() {
    if (!this.currentFile || !this.currentData) {
      alert('Uyarı: Kaydedilecek dosya yok');
      return;
    }

    try {
      // Validate JSON
      const jsonString = JSON.stringify(this.currentData, null, 2);

      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.currentFile}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update UI
      this.isDirty = false;
      const now = new Date().toLocaleTimeString('tr-TR');
      if (document.getElementById('lastSaveTime')) {
        document.getElementById('lastSaveTime').textContent = now;
      }
      if (document.getElementById('unsavedIndicator')) {
        document.getElementById('unsavedIndicator').style.display = 'none';
      }

      console.log(`✅ ${this.currentFile}.json downloaded successfully`);
      alert(`Başarılı! ${this.currentFile}.json dosyası indirildi`);

    } catch (error) {
      console.error('Error saving file:', error);
      alert(`Hata! Dosya kaydedilirken hata oluştu: ${error.message}`);
    }
  }

  /**
   * Mark as dirty (unsaved changes)
   */
  markDirty() {
    this.isDirty = true;
    document.getElementById('unsavedIndicator').style.display = 'flex';
  }

  /**
   * Update data
   */
  updateData(newData) {
    this.currentData = newData;
    this.markDirty();
  }

  /**
   * Get current data
   */
  getData() {
    return this.currentData;
  }

  /**
   * Reset to original
   */
  reset() {
    if (!this.currentFile) return;

    const confirm = window.confirm('Tüm değişiklikleri geri almak istediğinize emin misiniz?');
    if (!confirm) return;

    this.loadFile(this.currentFile);
  }
}

/**
 * Toggle file group
 */
function toggleFileGroup(btn) {
  btn.classList.toggle('collapsed');
  const content = btn.nextElementSibling;
  content.classList.toggle('hidden');
}

/**
 * Quick select (from welcome screen)
 */
function quickSelect(fileId, filePath) {
  if (window.fileManager) {
    // Tam yolu oluştur ve yükle
    const fullPath = `../data/${filePath}${fileId}.json`;
    fileManager.loadFile(fullPath);
  }
}

// Global instance
let fileManager;
