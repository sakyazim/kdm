/* Kütüphane İçerik Yönetimi v2 — arayüz mantığı */
"use strict";

/* ---------- Durum ---------- */

// Modal Üretici açıkken önizleme otomatik gizlendiğinde işaret (kullanıcının manuel tercihini bozmamak için)
let builderPreviewForced = false;

const state = {
  files: null,
  dirtyPaths: [],
  locks: {},         // path -> {locked, reason}
  tabs: [],          // {path, schema, data, dirty, rawMode}
  activeIdx: -1,
};

const SID = (document.cookie.match(/(?:^|; )preview_session=([^;]+)/) || [])[1] || "anon";
const $ = (id) => document.getElementById(id);
const activeTab = () => (state.activeIdx >= 0 ? state.tabs[state.activeIdx] : null);

async function api(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

/* ---------- Tema ---------- */

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  $("themeToggle").textContent = theme === "dark" ? "☀️" : "🌙";
  $("themeToggle").title = theme === "dark" ? "Aydınlık temaya geç (Ctrl+Shift+D)" : "Koyu temaya geç (Ctrl+Shift+D)";
}

function toggleTheme() {
  const next = document.body.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("mgr_theme", next);
  applyTheme(next);
}

function initTheme() {
  const saved = localStorage.getItem("mgr_theme");
  const theme = saved || (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(theme);
}

/* ---------- Önizleme dili ---------- */

function previewLang() {
  try {
    return localStorage.getItem("library_language") || "tr";
  } catch (e) {
    return "tr";
  }
}

function setPreviewLang(lang) {
  try {
    localStorage.setItem("library_language", lang);
  } catch (e) { /* yoksay */ }
  $("langTr").classList.toggle("active", lang === "tr");
  $("langEn").classList.toggle("active", lang === "en");
  reloadPreview();
}

/* ---------- Genel yardımcılar ---------- */

function showBanner(msg, kind) {
  const b = $("errorBanner");
  b.textContent = msg;
  b.className = "error-banner" + (kind === "success" ? " success" : "");
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => b.classList.add("hidden"), 8000);
}

function markDirty() {
  const tab = activeTab();
  if (!tab) return;
  tab.dirty = true;
  $("previewBadge").classList.remove("hidden");
  renderTabs();
  pushPreview();
}

function renderGit(g) {
  const el = $("gitStatus");
  if (!g || !g.isRepo) {
    el.textContent = "git yok";
    el.className = "git-status";
    return;
  }
  el.textContent = g.branch + " • " + (g.dirty ? "değişiklik var" : "temiz") + " • " + g.lastCommit.split(" ")[0];
  el.className = "git-status" + (g.dirty ? " dirty" : "");
  el.title = "Son commit: " + g.lastCommit;
}

/* ---------- Modal ---------- */

function openModal(html) {
  $("modalBox").innerHTML = html;
  $("modalOverlay").classList.remove("hidden");
}
function closeModal() {
  $("modalOverlay").classList.add("hidden");
}
$("modalOverlay").addEventListener("click", (e) => {
  if (e.target === $("modalOverlay")) closeModal();
});

/* ---------- Sekmeler ---------- */

function renderTabs() {
  const bar = $("tabBar");
  if (!state.tabs.length) {
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");
  bar.innerHTML = "";
  state.tabs.forEach((tab, i) => {
    const btn = document.createElement("button");
    btn.className = "tab" + (i === state.activeIdx ? " active" : "");
    btn.title = tab.path + (tab.dirty ? " (kaydedilmemiş)" : "");
    const name = document.createElement("span");
    name.className = "tab-name";
    name.textContent = tab.path.split("/").pop().replace(/\.json$/, "");
    btn.appendChild(name);
    if (tab.dirty) {
      const d = document.createElement("span");
      d.className = "tab-dirty";
      d.textContent = "•";
      btn.appendChild(d);
    }
    const x = document.createElement("button");
    x.className = "tab-close";
    x.textContent = "✕";
    x.title = "Kapat (Ctrl+W)";
    x.addEventListener("click", (e) => {
      e.stopPropagation();
      closeTab(i);
    });
    btn.appendChild(x);
    btn.addEventListener("click", () => switchTab(i));
    bar.appendChild(btn);
  });
}

function switchTab(i) {
  if (i < 0 || i >= state.tabs.length || i === state.activeIdx) return;
  state.activeIdx = i;
  renderTabs();
  renderEditor();
  renderTree();
  reloadPreview();
}

function closeTab(i) {
  const tab = state.tabs[i];
  if (tab && tab.dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?")) return;
  state.tabs.splice(i, 1);
  if (state.tabs.length === 0) {
    state.activeIdx = -1;
  } else if (state.activeIdx >= state.tabs.length) {
    state.activeIdx = state.tabs.length - 1;
  } else if (state.activeIdx > i) {
    state.activeIdx -= 1;
  }
  renderTabs();
  renderEditor();
  renderTree();
  reloadPreview();
}

/* ---------- Komut paleti ---------- */

const PALETTE_COMMANDS = [
  { icon: "💾", label: "Kaydet ve Commit Et", hint: "Ctrl+S", run: () => save() },
  { icon: "✅", label: "Doğrula", hint: "aktif dosya", run: () => validate() },
  { icon: "🕘", label: "Sürüm Geçmişi", hint: "aktif dosya", run: () => openHistoryModal() },
  { icon: "📦", label: "Yayımla (ZIP / SFTP)", hint: "", run: () => openPublishModal() },
  { icon: "🔄", label: "Senkronize Et", hint: "uzak repo", run: () => doSync() },
  { icon: "🌙", label: "Tema Değiştir", hint: "Ctrl+Shift+D", run: () => toggleTheme() },
  { icon: "👁", label: "Önizlemeyi Aç/Kapat", hint: "Ctrl+B", run: () => togglePreview() },
  { icon: "📂", label: "Sol Panel Aç/Kapat", hint: "☰", run: () => setSidebar(!document.body.classList.contains("sidebar-hidden")) },
  { icon: "🔍", label: "Alan Ara", hint: "Ctrl+F", run: () => openPalette("field:") },
  { icon: "⛶", label: "Tüm Bölümleri Aç", hint: "", run: () => setAllSections(true) },
  { icon: "🗜", label: "Tüm Bölümleri Kapat", hint: "", run: () => setAllSections(false) },
  { icon: "{}", label: "Form / Ham JSON Görünümü", hint: "aktif dosya", run: () => { if (activeTab()) { activeTab().rawMode = !activeTab().rawMode; renderEditor(); } } },
];

function openPalette(initial) {
  const overlay = $("paletteOverlay");
  overlay.classList.remove("hidden");
  const inp = $("paletteInput");
  inp.value = initial || "";
  inp.focus();
  renderPalette();
  const move = (d) => {
    const items = Array.from(document.querySelectorAll(".palette-result"));
    if (!items.length) return;
    const cur = items.findIndex((el) => el.classList.contains("selected"));
    const next = (cur === -1 ? (d > 0 ? -1 : 0) : cur + d + items.length) % items.length;
    items.forEach((el, i) => el.classList.toggle("selected", i === next));
    items[next] && items[next].scrollIntoView({ block: "nearest" });
  };
  overlay._move = move;
  $("paletteInput").addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") {
      const sel = document.querySelector(".palette-result.selected");
      const any = sel || document.querySelector(".palette-result");
      if (any) any.click();
    }
  }, { once: true });
}

function closePalette() {
  $("paletteOverlay").classList.add("hidden");
}

function renderPalette() {
  const q = $("paletteInput").value.trim().toLowerCase();
  const results = $("paletteResults");
  results.innerHTML = "";
  const flat = [];
  for (const cat of state.files || []) {
    for (const f of cat.files) flat.push({ ...f, category: cat.label });
  }
  const isFieldMode = q.startsWith("field:");
  const fieldQuery = q.slice(6).trim().toLowerCase();

  if (isFieldMode) {
    const fields = collectFormFields();
    const list = fields.filter((f) => !fieldQuery || f.label.toLowerCase().includes(fieldQuery) || f.path.includes(fieldQuery));
    const gl = document.createElement("div");
    gl.className = "palette-group-label";
    gl.textContent = "Form Alanları (" + list.length + ")";
    results.appendChild(gl);
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "palette-group-label";
      empty.textContent = "Alan bulunamadı (önce bir dosya açın).";
      results.appendChild(empty);
    }
    list.forEach((f, i) => {
      const b = document.createElement("button");
      b.className = "palette-result" + (i === 0 ? " selected" : "");
      const ic = document.createElement("span");
      ic.className = "pr-icon";
      ic.textContent = "⤷";
      const name = document.createElement("span");
      const idx = f.label.toLowerCase().indexOf(fieldQuery);
      if (fieldQuery && idx >= 0) {
        name.innerHTML = escapeHtml(f.label.slice(0, idx)) +
          '<span class="pr-hl">' + escapeHtml(f.label.slice(idx, idx + fieldQuery.length)) + "</span>" +
          escapeHtml(f.label.slice(idx + fieldQuery.length));
      } else {
        name.textContent = f.label;
      }
      const p = document.createElement("span");
      p.className = "pr-path";
      p.textContent = f.path;
      b.appendChild(ic);
      b.appendChild(name);
      b.appendChild(p);
      b.addEventListener("click", () => {
        closePalette();
        locateFieldByPath(f.path);
      });
      results.appendChild(b);
    });
    return;
  }

  const onlyCommands = q.startsWith(">");
  const onlyFiles = q.startsWith("/");
  const query = q.replace(/^[>/]/, "").trim();

  if (!onlyFiles) {
    const cmds = PALETTE_COMMANDS.filter((c) => !query || c.label.toLowerCase().includes(query));
    if (cmds.length) {
      const gl = document.createElement("div");
      gl.className = "palette-group-label";
      gl.textContent = "Komutlar";
      results.appendChild(gl);
      cmds.forEach((c, i) => {
        const b = document.createElement("button");
        b.className = "palette-result" + (i === 0 && !onlyCommands ? " selected" : "");
        const ic = document.createElement("span");
        ic.className = "pr-icon";
        ic.textContent = c.icon;
        const name = document.createElement("span");
        name.textContent = c.label;
        const k = document.createElement("span");
        k.className = "pr-kbd";
        k.textContent = c.hint;
        b.appendChild(ic);
        b.appendChild(name);
        b.appendChild(k);
        b.addEventListener("click", () => { closePalette(); c.run(); });
        results.appendChild(b);
      });
    }
  }

  if (!onlyCommands) {
    const files = flat.filter((f) => !query || f.name.toLowerCase().includes(query) || f.path.includes(query));
    if (files.length) {
      const gl = document.createElement("div");
      gl.className = "palette-group-label";
      gl.textContent = "Dosyalar (" + files.length + ")";
      results.appendChild(gl);
      files.forEach((f, i) => {
        const b = document.createElement("button");
        b.className = "palette-result" + (i === 0 && onlyCommands ? " selected" : "");
        const ic = document.createElement("span");
        ic.className = "pr-icon";
        ic.textContent = f.dirty ? "●" : "📄";
        const name = document.createElement("span");
        name.textContent = f.name;
        const p = document.createElement("span");
        p.className = "pr-path";
        p.textContent = f.category + " · " + f.path;
        b.appendChild(ic);
        b.appendChild(name);
        b.appendChild(p);
        b.addEventListener("click", () => {
          closePalette();
          selectFile(f.path);
        });
        results.appendChild(b);
      });
    }
  }

  if (!results.children.length) {
    const empty = document.createElement("div");
    empty.className = "palette-group-label";
    empty.textContent = "Sonuç yok.";
    results.appendChild(empty);
  }
}

$("paletteOverlay").addEventListener("click", (e) => {
  if (e.target === $("paletteOverlay")) closePalette();
});
$("paletteInput").addEventListener("input", () => {
  document.querySelectorAll(".palette-result").forEach((el, i) => el.classList.toggle("selected", i === 0));
  renderPalette();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("paletteOverlay").classList.contains("hidden")) {
    closePalette();
  }
});

/* ---------- Alan arama (form içinde) ---------- */

function collectFormFields() {
  const fields = [];
  document.querySelectorAll("#formArea .field[data-path]").forEach((el) => {
    const label = el.querySelector(".field-label");
    fields.push({
      path: el.dataset.path,
      label: label ? label.textContent.trim().replace(/\s*\*$/, "") : el.dataset.path,
    });
  });
  return fields;
}

function locateFieldByPath(path) {
  const el = document.querySelector('.field[data-path="' + CSS.escape(path) + '"]');
  if (!el) return;
  // İçinde olduğu kapalı bölümleri aç
  let sec = el.closest(".form-section");
  while (sec) {
    sec.classList.remove("collapsed");
    const head = sec.querySelector(".form-section-head");
    if (head) head.classList.add("open");
    sec = sec.parentElement ? sec.parentElement.closest(".form-section") : null;
  }
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("mgr-flash");
  setTimeout(() => el.classList.remove("mgr-flash"), 1500);
  const inp = el.querySelector("input, textarea, select");
  if (inp) inp.focus({ preventScroll: true });
}

/* ---------- Dosya listesi ---------- */

async function loadFiles() {
  try {
    const res = await api("/api/files");
    state.files = res.categories;
    state.dirtyPaths = res.dirty || [];
    try {
      const lres = await api("/api/locks");
      state.locks = lres.locks || {};
    } catch { /* kilit bilgisi alınamadı — kilit yok sayılır */ }
    renderTree();
    renderGit(res.git);
  } catch (e) {
    showBanner("Dosya listesi yüklenemedi: " + (e.error || "bilinmeyen hata"));
  }
}

function renderTree() {
  const tree = $("fileTree");
  tree.innerHTML = "";
  for (const cat of state.files || []) {
    const sec = document.createElement("div");
    sec.className = "tree-cat";
    const head = document.createElement("button");
    head.className = "tree-cat-head";
    const chev = document.createElement("span");
    chev.className = "chev";
    chev.textContent = "▶";
    const lbl = document.createElement("span");
    lbl.textContent = cat.label;
    head.appendChild(chev);
    head.appendChild(lbl);
    const list = document.createElement("div");
    list.className = "tree-cat-files";
    const saved = localStorage.getItem("mgr_cat_" + cat.key);
    const open = saved === null ? cat.key === "pages" : saved === "1";
    list.hidden = !open;
    head.classList.toggle("open", open);
    head.addEventListener("click", () => {
      list.hidden = !list.hidden;
      head.classList.toggle("open", !list.hidden);
      localStorage.setItem("mgr_cat_" + cat.key, list.hidden ? "0" : "1");
    });
    for (const f of cat.files) {
      const item = document.createElement("button");
      const isActive = state.activeIdx >= 0 && state.tabs[state.activeIdx].path === f.path;
      item.className = "tree-file" + (isActive ? " active" : "");
      item.dataset.name = f.name;
      item.innerHTML = '<span class="dot ' + (f.hasSchema ? "schema" : "raw") + '"></span>';
      const nm = document.createElement("span");
      nm.textContent = f.name;
      nm.className = "tree-file-name";
      item.appendChild(nm);
      if (f.dirty) {
        const d = document.createElement("span");
        d.className = "tab-dirty";
        d.title = "Kaydedilmemiş değişiklik";
        d.textContent = "•";
        item.appendChild(d);
      }
      if (f.locked) {
        const lk = document.createElement("span");
        lk.className = "tree-lock";
        lk.title = "🔒 Kilitli — kayıt engellendi";
        lk.textContent = "🔒";
        item.appendChild(lk);
      }
      item.title = (f.hasSchema ? "Şema tabanlı editör" : "Ham JSON editörü") + (f.dirty ? " — kaydedilmemiş değişiklik" : "") + (f.locked ? " — KİLİTLİ" : "");
      item.addEventListener("click", () => selectFile(f.path));
      list.appendChild(item);
    }
    sec.appendChild(head);
    sec.appendChild(list);
    tree.appendChild(sec);
  }
}

function onSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  if (!q) {
    renderTree();
    return;
  }
  document.querySelectorAll(".tree-cat").forEach((sec) => {
    const list = sec.querySelector(".tree-cat-files");
    const head = sec.querySelector(".tree-cat-head");
    list.hidden = false;
    head.classList.add("open");
    let any = false;
    list.querySelectorAll(".tree-file").forEach((el) => {
      const hit = el.dataset.name.toLowerCase().includes(q);
      el.style.display = hit ? "" : "none";
      if (hit) any = true;
    });
    sec.style.display = any ? "" : "none";
  });
}

function setSidebar(hidden) {
  document.body.classList.toggle("sidebar-hidden", hidden);
  localStorage.setItem("mgr_sidebar", hidden ? "1" : "0");
}

function togglePreview() {
  const isHidden = document.body.classList.toggle("preview-hidden");
  $("previewToggle").textContent = isHidden ? "Önizleme: Göster" : "Önizleme: Gizle";
  if (!isHidden) reloadPreview();
}

/* ---------- Dosya seçme / editör ---------- */

// JSON dosyası adı -> önizleme HTML sayfası (site adlandırma farklılıkları)
const PAGE_OVERRIDES = {
  home: "index.html",
  "kutuphane-kurallari": "kurallar.html",
  databases: "veritabanlari.html",
  "anadolu-arastirma": "anadolu-universitesi-arastirma-birimleri.html",
  "component-showcase.old": null, // gerçek site sayfası yok
};

function previewHtmlFor(path) {
  if (!path) return null;
  const m = path.match(/^data\/pages\/(.+)\.json$/);
  if (!m) return null;
  const name = m[1];
  if (name in PAGE_OVERRIDES) return PAGE_OVERRIDES[name];
  return name + ".html";
}

async function selectFile(path) {
  // Açık tab varsa ona geç
  const existing = state.tabs.findIndex((t) => t.path === path);
  if (existing >= 0) {
    state.activeIdx = existing;
    renderTabs();
    renderEditor();
    renderTree();
    reloadPreview();
    setSidebar(true);
    return;
  }
  try {
    const res = await api("/api/file?path=" + encodeURIComponent(path));
    state.tabs.push({
      path,
      schema: res.schema || null,
      data: res.content,
      original: JSON.parse(JSON.stringify(res.content)), // kayıt öncesi temizlikte karşılaştırma için
      dirty: false,
      rawMode: false,
    });
    state.activeIdx = state.tabs.length - 1;
    renderTabs();
    renderEditor();
    renderTree();
    renderGit(res.git);
    reloadPreview();
    setSidebar(true);
  } catch (e) {
    showBanner("Dosya yüklenemedi: " + (e.error || ""));
  }
}

function renderEditor() {
  showBanner("", "success");
  $("errorBanner").classList.add("hidden");
  $("previewBadge").classList.add("hidden");
  const title = $("editorTitle");
  const desc = $("editorDesc");
  const meta = $("editorMeta");
  const formArea = $("formArea");
  const rawArea = $("rawArea");
  const tocBar = $("tocBar");
  const tab = activeTab();

  if (!tab) {
    document.body.classList.remove("builder-open");
    title.textContent = "Dosya seçin";
    desc.textContent = "Soldaki listeden bir JSON dosyası seçin (Ctrl+K ile de açabilirsiniz).";
    formArea.innerHTML = "";
    rawArea.classList.add("hidden");
    tocBar.classList.add("hidden");
    meta.innerHTML = "";
    $("saveBtn").disabled = true;
    $("validateBtn").disabled = true;
    $("errorCount").classList.add("hidden");
    return;
  }
  // Modal Üretici (modals.json) açıkken sağdaki site önizlemesi otomatik gizlenir — "Önizleme: Gizle" butonuyla aynı iş
  const isBuilder = tab.schema && tab.schema.id === "modal-builder";
  if (isBuilder) {
    if (!document.body.classList.contains("preview-hidden")) {
      document.body.classList.add("preview-hidden");
      builderPreviewForced = true;
    }
  } else if (builderPreviewForced) {
    document.body.classList.remove("preview-hidden");
    builderPreviewForced = false;
  }
  $("previewToggle").textContent = document.body.classList.contains("preview-hidden") ? "Önizleme: Göster" : "Önizleme: Gizle";

  title.textContent = tab.schema ? tab.schema.label : tab.path.split("/").pop();
  let mode = "— ham JSON düzenleme";
  if (tab.schema) mode = tab.schema.dynamic ? "— otomatik şema (elle şema yazılınca iyileşir)" : "— şema tabanlı düzenleme";
  desc.textContent = tab.path + " " + mode;
  $("saveBtn").disabled = false;
  $("validateBtn").disabled = false;
  $("errorCount").classList.add("hidden");

  const page = previewHtmlFor(tab.path);
  meta.innerHTML = [
    '<button id="diffBtn" class="btn small' + (tab.dirty ? "" : " hidden") + '" title="Kaydedilmemiş değişikliklerin özeti">Değişiklikler</button>',
    '<button id="rawToggleBtn" class="btn small" title="Form / ham JSON görünümü arasında geçiş">' + (tab.rawMode ? "Form Görünümü" : "Ham JSON") + "</button>",
    '<button id="historyBtn" class="btn small" title="Bu dosyanın sürüm geçmişi">Geçmiş</button>',
    page ? '<a href="/' + page + '" target="_blank" rel="noopener" class="btn small">Sayfayı Aç ↗</a>' : "",
    lockMetaBtn(tab),
  ].join("");

  if (tab.schema && !tab.rawMode) {
    rawArea.classList.add("hidden");
    formArea.classList.remove("hidden");
    formArea.innerHTML = "";
    // Kök dizi şeması (root: "array" — örn. collections.json)
    if (tab.schema.id === "modal-builder") {
      rawArea.classList.add("hidden");
      formArea.classList.remove("hidden");
      formArea.innerHTML = "";
      tocBar.classList.add("hidden");
      formArea.appendChild(renderModalBuilder(tab));
      return;
    }
    if (tab.schema.root === "array" && Array.isArray(tab.data)) {
      if (tab.schema.description) {
        const note = document.createElement("div");
        note.className = "root-array-note";
        note.textContent = tab.schema.description;
        formArea.appendChild(note);
      }
      const f = {
        type: "array",
        key: "",
        label: tab.schema.itemLabel || "Öğe",
        itemLabel: tab.schema.itemLabel || "Öğe",
        itemFields: tab.schema.itemFields || [],
        components: tab.schema.components,
      };
      formArea.appendChild(renderArray(f, tab.data, "$"));
      tocBar.classList.add("hidden");
      return;
    }
    const fields = tab.schema.fields || [];
    const startCollapsed = defaultSectionsCollapsed(fields.length);
    const secs = fields.map((f) => renderSection(f, tab.data, startCollapsed, "$." + f.key));
    secs.forEach((s) => formArea.appendChild(s));
    renderToc(secs, fields);
  } else {
    formArea.classList.add("hidden");
    rawArea.classList.remove("hidden");
    tocBar.classList.add("hidden");
    rawArea.value = JSON.stringify(tab.data, null, 2);
  }
}

function setAllSections(open) {
  document.querySelectorAll(".form-section").forEach((sec) => {
    sec.classList.toggle("collapsed", !open);
    const head = sec.querySelector(".form-section-head");
    if (head) head.classList.toggle("open", open);
  });
  localStorage.setItem("mgr_sections", open ? "open" : "collapsed");
}

/* ================= Modal Üretici — blok tabanlı görsel düzenleyici ================= */

/* Tuval paletindeki parça türleri */
const BLOCK_TYPES = [
  { type: "title", label: "Başlık" },
  { type: "lead", label: "Paragraf" },
  { type: "note", label: "Not (HTML)" },
  { type: "image", label: "Görsel (Resim)" },
  { type: "banner", label: "Banner (Renkli Şerit)" },
  { type: "alert", label: "Uyarı Kutusu" },
  { type: "features", label: "Özellikler" },
  { type: "list", label: "Liste" },
  { type: "steps", label: "Adımlar" },
  { type: "button", label: "Buton" },
  { type: "form", label: "Form" },
  { type: "rating", label: "Değerlendirme" },
  { type: "divider", label: "Ayırıcı" },
  { type: "raw", label: "Ham HTML" },
];

/* Kategori renkleri — kartları ayırt etmek için */
const CATEGORY_COLORS = {
  help: "#1f4c8a",
  anasayfa: "#198754",
  duyurular: "#d97706",
  genel: "#64748b",
  veritabanlari: "#2563eb",
  etkinlik: "#7c3aed",
};
function categoryColor(c) { return CATEGORY_COLORS[c] || "#64748b"; }

/* Gerçek site modallarından türetilmiş şablonlar (blok listesi olarak) */
const MODAL_TEMPLATES = {
  anasayfa: {
    label: "🏠 Anasayfa Duyurusu",
    blocks: {
      tr: [
        { type: "title", data: { text: "Yeni Dönem Kütüphane Hizmetleri" } },
        { type: "banner", data: { icon: "bi bi-stars", text: "📚 Yeni Dönem • Kütüphane" } },
        { type: "lead", data: { text: "Sevgili öğrenciler ve akademisyenler, yeni dönemle birlikte kütüphane hizmetlerimizde birçok yenilik sizi bekliyor. Tüm detaylar için duyurular sayfamızı ziyaret edin." } },
        { type: "features", data: { items: [
          { icon: "bi bi-book", title: "Uzatılmış çalışma saatleri", text: "Dönem boyunca daha uzun hizmet" },
          { icon: "bi bi-pc-display", title: "Yeni veritabanları", text: "Erişime açılan kaynaklar" },
          { icon: "bi bi-people", title: "Rezervasyon imkânı", text: "Çalışma odaları" },
        ] } },
        { type: "button", data: { text: "Detaylı Bilgi", url: "duyurular.html", variant: "primary" } },
      ],
      en: [
        { type: "title", data: { text: "New Semester Library Services" } },
        { type: "banner", data: { icon: "bi bi-stars", text: "📚 New Semester • Library" } },
        { type: "lead", data: { text: "Dear students and academics, many new services await you this semester. Visit our announcements page for all details." } },
        { type: "features", data: { items: [
          { icon: "bi bi-book", title: "Extended opening hours", text: "Longer service during the term" },
          { icon: "bi bi-pc-display", title: "New databases", text: "Newly available resources" },
          { icon: "bi bi-people", title: "Reservation options", text: "Study rooms" },
        ] } },
        { type: "button", data: { text: "Details", url: "duyurular.html", variant: "primary" } },
      ],
    },
  },
  duyurular: {
    label: "📢 Duyuru / Sistem Bildirimi",
    blocks: {
      tr: [
        { type: "alert", data: { icon: "bi bi-exclamation-triangle", title: "Sistem Bakımı Duyurusu", text: "Kütüphane sistemimizde planlı bakım çalışması yapılacaktır. Bu süre zarfında bazı hizmetlerde kesinti yaşanabilir.", variant: "warning" } },
        { type: "list", data: { items: [
          { icon: "bi bi-clock", text: "Tarih: Cumartesi 22:00 – Pazar 02:00" },
          { icon: "bi bi-plug", text: "Etkilenen: Katalog arama, e-kaynak erişimi" },
          { icon: "bi bi-check-circle", text: "Etkilenmeyen: Ödünç/iade, çalışma alanları" },
        ] } },
        { type: "button", data: { text: "Ayrıntılar", url: "duyurular.html", variant: "primary" } },
      ],
      en: [
        { type: "alert", data: { icon: "bi bi-exclamation-triangle", title: "System Maintenance Notice", text: "Planned maintenance will be carried out on our library system. Some services may be interrupted during this period.", variant: "warning" } },
        { type: "list", data: { items: [
          { icon: "bi bi-clock", text: "When: Saturday 22:00 – Sunday 02:00" },
          { icon: "bi bi-plug", text: "Affected: Catalog search, e-resource access" },
          { icon: "bi bi-check-circle", text: "Unaffected: Loans/returns, study areas" },
        ] } },
        { type: "button", data: { text: "Details", url: "duyurular.html", variant: "primary" } },
      ],
    },
  },
  veritabanlari: {
    label: "🗄️ Veritabanı Tanıtımı",
    blocks: {
      tr: [
        { type: "title", data: { text: "Yeni Veritabanı: Academic Research Plus" } },
        { type: "image", data: { src: "assets/images/nopic.jpeg", alt: "Veritabanı" } },
        { type: "lead", data: { text: "Kütüphanemize yeni eklenen veritabanı ile 5000'den fazla akademik dergiye ve 40.000 e-kitaba erişebilirsiniz." } },
        { type: "list", data: { items: [
          { icon: "bi bi-journal", text: "5.000+ hakemli dergi" },
          { icon: "bi bi-search", text: "Gelişmiş arama araçları" },
          { icon: "bi bi-download", text: "PDF tam metin indirme" },
        ] } },
        { type: "button", data: { text: "Veritabanına Git", url: "veritabanlari.html", variant: "primary" } },
      ],
      en: [
        { type: "title", data: { text: "New Database: Academic Research Plus" } },
        { type: "image", data: { src: "assets/images/nopic.jpeg", alt: "Database" } },
        { type: "lead", data: { text: "Access more than 5,000 academic journals and 40,000 e-books with our new database." } },
        { type: "list", data: { items: [
          { icon: "bi bi-journal", text: "5,000+ peer-reviewed journals" },
          { icon: "bi bi-search", text: "Advanced search tools" },
          { icon: "bi bi-download", text: "PDF full-text download" },
        ] } },
        { type: "button", data: { text: "Go to Database", url: "veritabanlari.html", variant: "primary" } },
      ],
    },
  },
  "uzaktan-erisim": {
    label: "🔑 Uzaktan Erişim Rehberi",
    blocks: {
      tr: [
        { type: "title", data: { text: "Uzaktan Erişim Nasıl Çalışır?" } },
        { type: "lead", data: { text: "Kampüs dışından veritabanlarına erişim için 3 adım:" } },
        { type: "steps", data: { items: ["Kütüphane web sitesine giriş yapın", "Veritabanları sayfasından kaynağı seçin", "Anadolu Üniversitesi kullanıcı adınızla bağlanın"] } },
        { type: "button", data: { text: "Rehberi Aç", url: "uzaktan-erisim.html", variant: "primary" } },
      ],
      en: [
        { type: "title", data: { text: "How Does Remote Access Work?" } },
        { type: "lead", data: { text: "3 steps to access databases off-campus:" } },
        { type: "steps", data: { items: ["Sign in to the library website", "Choose the resource from Databases", "Connect with your Anadolu University account"] } },
        { type: "button", data: { text: "Open Guide", url: "uzaktan-erisim.html", variant: "primary" } },
      ],
    },
  },
};

/* Önizleme + tuval için siteye benzer stiller */
const MODAL_PREVIEW_CSS =
  ".modal-template{font-size:14px}" +
  ".modal-tpl-title{font-size:18px;font-weight:700;color:#0d2341;margin:0 0 10px}" +
  ".modal-tpl-title.hm-title{background:linear-gradient(135deg,#0d2341,#1f4c8a);color:#fff;padding:14px 16px;border-radius:8px;text-align:center;margin-bottom:12px}" +
  ".modal-tpl-title.ta-center{text-align:center}.modal-tpl-title.ta-right{text-align:right}" +
  ".modal-lead.ta-center{text-align:center}.modal-lead.ta-right{text-align:right}" +
  ".modal-tpl-img{width:100%;max-height:200px;object-fit:cover;border-radius:8px;margin:0 0 12px}" +
  ".modal-tpl-banner{background:linear-gradient(135deg,#0d2341,#1f4c8a);color:#fff;padding:14px;border-radius:8px;font-size:15px;font-weight:700;margin:0 0 12px;text-align:center}" +
  ".modal-tpl-banner.banner-blue{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}" +
  ".modal-tpl-banner.banner-green{background:linear-gradient(135deg,#15803d,#22c55e)}" +
  ".modal-tpl-banner.banner-orange{background:linear-gradient(135deg,#c2410c,#f97316)}" +
  ".modal-tpl-banner.banner-red{background:linear-gradient(135deg,#b91c1c,#ef4444)}" +
  ".modal-tpl-banner i{margin-right:6px}" +
  ".modal-tpl-steps{display:grid;gap:8px;margin-bottom:12px}" +
  ".modal-tpl-step{display:flex;gap:10px;align-items:center;background:#f1f5f9;padding:8px 12px;border-radius:8px;font-size:13px}" +
  ".modal-tpl-step-n{background:#1f4c8a;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:none}" +
  ".modal-tpl-divider{border:none;border-top:1px dashed #cbd5e1;margin:12px 0}" +
  ".modal-tpl-divider.divider-solid{border-top-style:solid}" +
  ".modal-tpl-divider.divider-dotted{border-top-style:dotted}" +
  ".modal-tpl-divider.divider-color-blue{border-top-color:#3b82f6}" +
  ".modal-tpl-divider.divider-color-orange{border-top-color:#f97316}" +
  ".modal-tpl-divider.divider-color-red{border-top-color:#ef4444}" +
  ".modal-lead{margin:0 0 12px;color:#475569;line-height:1.6}" +
  ".modal-note{margin:12px 0 0;font-size:13px;color:#64748b}" +
  ".modal-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px}" +
  ".modal-feature-grid.cols-2{grid-template-columns:repeat(2,1fr)}" +
  ".modal-feature-grid.cols-4{grid-template-columns:repeat(4,1fr)}" +
  ".modal-feature{background:#f1f5f9;border-radius:10px;padding:12px;text-align:center}" +
  ".modal-feature i{font-size:20px;color:#1f4c8a}" +
  ".modal-feature h4{margin:6px 0 4px;font-size:13px}" +
  ".modal-feature p{margin:0;font-size:12px;color:#475569}" +
  ".modal-alert{display:flex;gap:10px;align-items:flex-start;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin-bottom:12px;position:relative}" +
  ".modal-alert i{font-size:18px;color:#f97316}" +
  ".modal-alert strong{display:block;margin-bottom:2px}" +
  ".modal-alert p{margin:0;font-size:13px}" +
  ".modal-alert-close{position:absolute;top:6px;right:8px;background:none;border:none;font-size:13px;cursor:pointer;color:#94a3b8;padding:2px 6px;border-radius:4px}" +
  ".modal-alert-close:hover{background:#e2e8f0;color:#334155}" +
  ".modal-alert.modal-alert-danger{background:#fef2f2;border-color:#fecaca}.modal-alert.modal-alert-danger i{color:#dc2626}" +
  ".modal-alert.modal-alert-success{background:#f0fdf4;border-color:#bbf7d0}.modal-alert.modal-alert-success i{color:#16a34a}" +
  ".modal-alert.modal-alert-info{background:#eff6ff;border-color:#bfdbfe}.modal-alert.modal-alert-info i{color:#2563eb}" +
  ".modal-list{list-style:none;margin:0 0 12px;padding:0}" +
  ".modal-list li{display:flex;gap:8px;align-items:flex-start;padding:6px 0;font-size:13px;border-bottom:1px dashed #e2e8f0}" +
  ".modal-list li:last-child{border-bottom:none}" +
  ".modal-list i{color:#1f4c8a}" +
  ".modal-list-ordered{counter-reset:ml}.modal-list-ordered li{counter-increment:ml}.modal-list-ordered li::before{content:counter(ml) \".\";font-weight:700;color:#1f4c8a}" +
  ".modal-form{display:flex;flex-direction:column;gap:10px;margin-bottom:12px}" +
  ".form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}" +
  ".form-group label{font-weight:600;font-size:13px;display:block;margin-bottom:4px}" +
  ".form-group input,.form-group textarea,.form-group select{width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:13px;box-sizing:border-box}" +
  ".modal-form-btn{align-self:flex-start;margin-top:2px}" +
  ".star-rating{display:inline-flex;gap:2px;font-size:22px;color:#cbd5e1;cursor:pointer}" +
  ".star-rating span:hover,.star-rating span.active,.star-rating span.hover{color:#f59e0b}" +
  ".modal-hero{text-align:center;margin-bottom:12px}" +
  ".btn{display:inline-block;padding:9px 18px;border-radius:6px;text-decoration:none;font-size:14px;border:none;cursor:pointer}" +
  ".btn-primary{background:#1f4c8a;color:#fff}" +
  ".btn-outline-primary{border:1px solid #1f4c8a;color:#1f4c8a;background:#fff}" +
  ".btn-sm{padding:6px 12px;font-size:12.5px}.btn-lg{padding:12px 22px;font-size:15px}";

function applyModalPreview(el, html) {
  let style = el.querySelector("style.mb-preview-style");
  if (!style) {
    style = document.createElement("style");
    style.className = "mb-preview-style";
    el.prepend(style);
  }
  style.textContent = MODAL_PREVIEW_CSS;
  el.innerHTML = "<div class='mb-preview-scope'>" + (html || "<p style='color:#94a3b8'>İçerik boş — şablon seçin veya tuvalden parça ekleyin.</p>") + "</div>";
}

/* ---------- Blok modeli ---------- */

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stripTags(s) {
  return String(s ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function defaultBlockData(type, tr) {
  switch (type) {
    case "title": return { text: tr ? "Yeni Başlık" : "New Title", level: "h3", align: "left", cls: "" };
    case "lead": return { text: tr ? "Açıklama metni…" : "Description text…", align: "left" };
    case "note": return { html: tr ? "<strong>Not:</strong> açıklama metni" : "<strong>Note:</strong> description" };
    case "image": return { src: "assets/images/nopic.jpeg", alt: tr ? "Görsel" : "Image", width: 100 };
    case "banner": return { icon: "bi bi-stars", text: tr ? "Görsel alanı" : "Image area", variant: "navy" };
    case "alert": return { icon: "bi bi-exclamation-triangle", title: tr ? "Önemli duyuru" : "Important notice", text: tr ? "Açıklama metni." : "Description text.", variant: "warning", dismissible: false };
    case "features": return { items: [{ icon: "bi bi-check", title: tr ? "Özellik" : "Feature", text: tr ? "Açıklama" : "Description" }], cols: 3 };
    case "list": return { items: [{ icon: "bi bi-check", text: tr ? "Liste öğesi" : "List item" }], ordered: false };
    case "steps": return { items: [tr ? "İlk adım" : "First step", tr ? "İkinci adım" : "Second step"] };
    case "button": return { text: tr ? "Devamı" : "Read More", url: "duyurular.html", variant: "primary", icon: "", size: "", blank: false };
    case "form": return { fields: [
      { kind: "text", label: tr ? "Adınız Soyadınız" : "Full Name", placeholder: tr ? "Ad Soyad" : "First Last", required: true, options: [], name: "", sameRow: false },
      { kind: "email", label: "E-posta", placeholder: "ornek@anadolu.edu.tr", required: true, options: [], name: "", sameRow: true },
    ], submitText: tr ? "Gönder" : "Send", action: "", method: "post", submitVariant: "primary" };
    case "rating": return { question: tr ? "Genel Memnuniyet" : "Overall Satisfaction", max: 5 };
    case "divider": return { variant: "dashed", color: "slate" };
    case "raw": return { html: tr ? "<p>Ham HTML</p>" : "<p>Raw HTML</p>" };
    default: return {};
  }
}

function blockToHtml(b) {
  const d = b.data || {};
  switch (b.type) {
    case "title": {
      const lvl = ["h2", "h3", "h4"].includes(d.level) ? d.level : "h3";
      return "<" + lvl + ' class="modal-tpl-title' + (d.cls ? " " + d.cls : "") + (d.align && d.align !== "left" ? " ta-" + d.align : "") + '">' + (d.text || "") + "</" + lvl + ">";
    }
    case "lead": return '<p class="modal-lead' + (d.align && d.align !== "left" ? " ta-" + d.align : "") + '">' + (d.text || "") + "</p>";
    case "note": return '<div class="modal-note">' + (d.html || "") + "</div>";
    case "image": {
      const w = Math.max(10, Math.min(100, parseInt(d.width, 10) || 100));
      return '<img class="modal-tpl-img" src="' + esc(d.src) + '" alt="' + esc(d.alt) + '" style="width:' + w + '%" onerror="this.style.display=\'none\'">';
    }
    case "banner": return '<div class="modal-hero"><div class="modal-tpl-banner banner-' + esc(d.variant || "navy") + '">' + (d.icon ? '<i class="' + esc(d.icon) + '"></i> ' : "") + (d.text || "") + "</div></div>";
    case "alert": return '<div class="modal-alert modal-alert-' + esc(d.variant || "warning") + '"><i class="' + esc(d.icon || "bi bi-exclamation-triangle") + '"></i><div><strong>' + (d.title || "") + "</strong><p>" + (d.text || "") + "</p></div>" + (d.dismissible ? '<button type="button" class="modal-alert-close" aria-label="Kapat">✕</button>' : "") + "</div>";
    case "features": return '<div class="modal-feature-grid cols-' + (d.cols || 3) + '">\n' + (d.items || []).map((it) => '  <div class="modal-feature"><i class="' + esc(it.icon || "bi bi-check") + '"></i><h4>' + (it.title || "") + "</h4><p>" + (it.text || "") + "</p></div>").join("\n") + "\n</div>";
    case "list": {
      const tag = d.ordered ? "ol" : "ul";
      return "<" + tag + ' class="modal-list' + (d.ordered ? " modal-list-ordered" : "") + '">\n' + (d.items || []).map((it) => '  <li><i class="' + esc(it.icon || "bi bi-check") + '"></i> ' + (it.text || "") + "</li>").join("\n") + "\n</" + tag + ">";
    }
    case "steps": return '<div class="modal-tpl-steps">\n' + (d.items || []).map((t, i) => '  <div class="modal-tpl-step"><span class="modal-tpl-step-n">' + (i + 1) + "</span> " + (t || "") + "</div>").join("\n") + "\n</div>";
    case "button": {
      const cls = d.variant === "outline" ? "btn-outline-primary" : "btn-primary";
      const sz = d.size ? " btn-" + d.size : "";
      const target = d.blank ? ' target="_blank" rel="noopener"' : "";
      return '<a class="btn ' + cls + sz + '" href="' + esc(d.url || "#") + '"' + target + ">" + (d.icon ? '<i class="' + esc(d.icon) + '"></i> ' : "") + (d.text || "Devamı") + "</a>";
    }
    case "form": {
      const out = [];
      let pending = null;
      (d.fields || []).forEach((f) => {
        const fhtml = formFieldToHtml(f);
        if (f.sameRow) {
          // "Yan yana" işaretli alan bir ÖNCEKİ alanla aynı satıra girer
          if (pending) {
            out.push('<div class="form-row">\n' + pending + "\n" + fhtml + "\n</div>");
            pending = null;
          } else {
            out.push(fhtml);
          }
        } else {
          if (pending) out.push(pending);
          pending = fhtml;
        }
      });
      if (pending) out.push(pending);
      const action = d.action ? ' action="' + esc(d.action) + '"' : "";
      const method = d.method ? ' method="' + esc(d.method) + '"' : "";
      const submit = '<button type="submit" class="modal-form-btn btn ' + (d.submitVariant === "outline" ? "btn-outline-primary" : "btn-primary") + '">' + (d.submitText || "Gönder") + "</button>";
      const prevent = d.action ? "" : ' onsubmit="return false;"';
      return '<form class="modal-form"' + prevent + action + method + ">\n" + out.join("\n") + "\n" + submit + "\n</form>";
    }
    case "rating": {
      const max = d.max === 10 ? 10 : 5;
      return '<div class="form-group"><label>' + (d.question || "Değerlendirin") + '</label><div class="star-rating">' + Array.from({ length: max }, () => "<span>★</span>").join("") + "</div></div>";
    }
    case "divider": return '<hr class="modal-tpl-divider divider-' + esc(d.variant || "dashed") + " divider-color-" + esc(d.color || "slate") + '">';
    case "raw": return d.html || "";
    default: return "";
  }
}

function formFieldToHtml(f) {
  const req = f.required ? " *" : "";
  const label = "<label>" + (f.label || "") + req + "</label>";
  const name = f.name ? ' name="' + esc(f.name) + '"' : "";
  if (f.kind === "select") {
    const opts = (f.options || []).map((o) => "<option>" + esc(o) + "</option>").join("");
    return '<div class="form-group">' + label + '<select' + name + (f.required ? " required" : "") + '><option value="">' + esc(f.placeholder || "Seçin…") + "</option>" + opts + "</select></div>";
  }
  if (f.kind === "textarea") return '<div class="form-group">' + label + '<textarea' + name + ' placeholder="' + esc(f.placeholder || "") + '"' + (f.required ? " required" : "") + "></textarea></div>";
  if (f.kind === "rating") return '<div class="form-group">' + label + '<div class="star-rating"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div></div>';
  if (f.kind === "checkbox") return '<div class="form-group"><label><input type="checkbox"' + name + "> " + (f.label || "") + "</label></div>";
  const type = f.kind === "email" ? "email" : f.kind === "number" ? "number" : f.kind === "tel" ? "tel" : f.kind === "url" ? "url" : f.kind === "date" ? "date" : "text";
  return '<div class="form-group">' + label + '<input type="' + type + '"' + name + ' placeholder="' + esc(f.placeholder || "") + '"' + (f.required ? " required" : "") + "></div>";
}

function blocksToHtml(blocks) {
  return (blocks || []).map(blockToHtml).join("\n");
}

/* Mevcut HTML'i blok listesine çevirir (site modal sınıflarına göre) */
function htmlToBlocks(html) {
  const s = (html || "").trim();
  if (!s) return [];
  const found = [];
  const add = (m, block, openOnly) => { if (m && m.index >= 0) found.push({ pos: m.index, len: openOnly ? 0 : m[0].length, block }); };

  let m = s.match(/<div class="modal-feature-grid(?: cols-(\d+))?">/);
  if (m) {
    const items = [];
    const re = /<div class="modal-feature">\s*<i class="([^"]*)"><\/i><h4>([\s\S]*?)<\/h4><p>([\s\S]*?)<\/p><\/div>/g;
    let x;
    while ((x = re.exec(s))) items.push({ icon: x[1], title: stripTags(x[2]), text: stripTags(x[3]) });
    add(m, { type: "features", data: { items, cols: parseInt(m[1], 10) || 3 } }, true);
  }
  m = s.match(/<div class="modal-alert(?: modal-alert-(\w+))?">\s*<i class="([^"]*)"><\/i><div><strong>([\s\S]*?)<\/strong><p>([\s\S]*?)<\/p><\/div>(<button type="button" class="modal-alert-close"[^>]*>✕<\/button>)?<\/div>/);
  if (m) add(m, { type: "alert", data: { icon: m[2], title: stripTags(m[3]), text: stripTags(m[4]), variant: m[1] || "warning", dismissible: !!m[5] } });
  m = s.match(/<div class="modal-hero">([\s\S]*?)<\/div>/);
  if (m && !m[1].includes("modal-tpl-banner")) {
    const h4 = m[1].match(/<h4>([\s\S]*?)<\/h4>/);
    add(m, { type: "banner", data: { icon: "bi bi-stars", text: h4 ? stripTags(h4[1]) : "Görsel" } });
  }
  m = s.match(/<img class="modal-tpl-img" src="([^"]*)" alt="([^"]*)"([^>]*)>/);
  if (m) {
    const w = (m[3].match(/width:(\d+)%/) || [])[1];
    add(m, { type: "image", data: { src: m[1], alt: m[2], width: w ? parseInt(w, 10) : 100 } });
  }
  m = s.match(/<(ul|ol) class="modal-list(?: modal-list-ordered)?">([\s\S]*?)<\/(?:ul|ol)>/);
  if (m) {
    const items = [];
    const re = /<li>\s*<i class="([^"]*)"><\/i>([\s\S]*?)<\/li>/g;
    let x;
    while ((x = re.exec(m[2]))) items.push({ icon: x[1], text: stripTags(x[2]) });
    add(m, { type: "list", data: { items, ordered: m[1] === "ol" } });
  }
  m = s.match(/<p class="modal-lead(?: ta-(\w+))?">([\s\S]*?)<\/p>/);
  if (m) add(m, { type: "lead", data: { text: m[2], align: m[1] || "left" } });
  m = s.match(/<(?:p|div) class="modal-note">([\s\S]*?)<\/(?:p|div)>/);
  if (m) add(m, { type: "note", data: { html: m[1] } });
  m = s.match(/<h([234]) class="modal-tpl-title([^"]*)">([\s\S]*?)<\/h\1>/);
  if (m) add(m, { type: "title", data: { text: m[3], level: "h" + m[1], align: (m[2].match(/ta-(\w+)/) || [])[1] || "left", cls: m[2].includes("hm-title") ? "hm-title" : "" } });
  m = s.match(/<div class="modal-hero">\s*<div class="modal-tpl-banner(?: banner-(\w+))?">(?:<i class="([^"]*)"><\/i>\s*)?([\s\S]*?)<\/div>\s*<\/div>|<div class="modal-tpl-banner(?: banner-(\w+))?">(?:<i class="([^"]*)"><\/i>\s*)?([\s\S]*?)<\/div>/);
  if (m) add(m, { type: "banner", data: { icon: m[2] || m[5] || "", text: stripTags(m[3] || m[6] || ""), variant: m[1] || m[4] || "navy" } });
  m = s.match(/<div class="modal-tpl-steps">/);
  if (m) {
    const items = [];
    const re = /modal-tpl-step-n">\d+<\/span>([\s\S]*?)<\/div>/g;
    let x;
    while ((x = re.exec(s))) items.push(stripTags(x[1]));
    add(m, { type: "steps", data: { items } }, true);
  }
  m = s.match(/<form class="modal-form"([\s\S]*?)>([\s\S]*?)<\/form>/);
  if (m) {
    const attrs = m[1];
    const body = m[2];
    const action = (attrs.match(/action="([^"]*)"/) || [])[1] || "";
    const method = (attrs.match(/method="([^"]*)"/) || [])[1] || "";
    const parseGroup = (g, sameRow) => {
      const label = (g.match(/<label>([\s\S]*?)<\/label>/) || [])[1] || "";
      let kind = "text", placeholder = "", options = [];
      if (/<select/.test(g)) kind = "select";
      else if (/<textarea/.test(g)) kind = "textarea";
      else if (/class="star-rating"/.test(g)) kind = "rating";
      else if (/type="email"/.test(g)) kind = "email";
      else if (/type="tel"/.test(g)) kind = "tel";
      else if (/type="url"/.test(g)) kind = "url";
      else if (/type="date"/.test(g)) kind = "date";
      else if (/type="number"/.test(g)) kind = "number";
      const ph = (g.match(/placeholder="([^"]*)"/) || [])[1] || "";
      const name = (g.match(/name="([^"]*)"/) || [])[1] || "";
      if (kind === "select") options = Array.from(g.matchAll(/<option>([\s\S]*?)<\/option>/g)).map((y) => y[1]);
      return { kind, label: stripTags(label).replace(/\s*\*$/, ""), placeholder: ph, required: /required/.test(g), options, name, sameRow: !!sameRow };
    };
    const fields = [];
    const rowRe = /<div class="form-row">\s*(<div class="form-group">[\s\S]*?<\/div>)\s*(<div class="form-group">[\s\S]*?<\/div>)\s*<\/div>/g;
    let x;
    while ((x = rowRe.exec(body))) {
      fields.push(parseGroup(x[1], false));
      fields.push(parseGroup(x[2], true));
    }
    const rest = body.replace(rowRe, "");
    const re = /<div class="form-group">([\s\S]*?)<\/div>/g;
    while ((x = re.exec(rest))) fields.push(parseGroup(x[1], false));
    const subM = rest.match(/class="modal-form-btn([^"]*)"([^>]*)>([\s\S]*?)<\/button>/);
    const sub = (subM || [])[3] || "";
    const submitVariant = subM && (subM[1] + subM[2]).includes("outline") ? "outline" : "primary";
    add(m, { type: "form", data: { fields, submitText: stripTags(sub) || undefined, action, method, submitVariant } });
  }
  m = s.match(/<div class="form-group"><label>([^<]*)<\/label>\s*<div class="star-rating">((?:<span[^>]*>★<\/span>)+)<\/div><\/div>/);
  if (m) {
    const inForm = s.lastIndexOf("<form", m.index) > s.lastIndexOf("</form>", m.index);
    if (!inForm) add(m, { type: "rating", data: { question: m[1].replace(/\s*\*$/, ""), max: (m[2].match(/★/g) || []).length > 5 ? 10 : 5 } });
  }
  m = s.match(/<a class="btn ([^"]*)" href="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/);
  if (m) {
    const cls = m[1];
    const icon = (m[4].match(/<i class="([^"]*)"><\/i>/) || [])[1] || "";
    add(m, { type: "button", data: { text: stripTags(m[4]), url: m[2], variant: cls.includes("outline") ? "outline" : "primary", icon, size: (cls.match(/btn-(sm|lg)/) || [])[1] || "", blank: /target="_blank"/.test(m[3]) } });
  }
  m = s.match(/<hr class="modal-tpl-divider(?: divider-(\w+))?(?: divider-color-(\w+))?">/);
  if (m) add(m, { type: "divider", data: { variant: m[1] || "dashed", color: m[2] || "slate" } });

  found.sort((a, b) => a.pos - b.pos);
  const blocks = [];
  let cursor = 0;
  for (let i = 0; i < found.length; i++) {
    const f = found[i];
    const end = f.len ? f.pos + f.len : (i + 1 < found.length ? found[i + 1].pos : s.length);
    if (f.pos > cursor) {
      const gap = s.slice(cursor, f.pos).trim();
      if (gap) blocks.push({ type: "raw", data: { html: gap } });
    }
    blocks.push(f.block);
    cursor = Math.max(cursor, end);
  }
  if (cursor < s.length) {
    const tail = s.slice(cursor).trim();
    if (tail) blocks.push({ type: "raw", data: { html: tail } });
  }
  if (!blocks.length) blocks.push({ type: "raw", data: { html: s } });
  return blocks;
}

function syncHtml(m) {
  m.html.tr = blocksToHtml(m.blocks.tr);
  m.html.en = blocksToHtml(m.blocks.en);
  markDirty();
}

/* Denetçi alanları için global onDataAll — html senkronu + seçili bloğun tuval görünümü */
function globalOnDataAll(m, idx) {
  m.html.tr = blocksToHtml(m.blocks.tr);
  m.html.en = blocksToHtml(m.blocks.en);
  markDirty();
  const openBody = document.querySelector(".mb-card-body:not(.collapsed)");
  const bodyEl = openBody ? openBody.querySelector(".mb-vblock.selected .mb-vblock-body") : null;
  if (bodyEl && m.blocks[m._lang] && m.blocks[m._lang][idx]) bodyEl.innerHTML = blockToHtml(m.blocks[m._lang][idx]);
}

/* TR bloğu varsa EN bloğunu da aynı tiple hazırlar (ikisi birlikte düzenlenir) */
function pairBlock(m, idx) {
  const trB = m.blocks.tr[idx];
  if (!trB) return null;
  let enB = m.blocks.en[idx];
  if (!enB || enB.type !== trB.type) {
    enB = { type: trB.type, data: JSON.parse(JSON.stringify(trB.data)) };
    m.blocks.en[idx] = enB;
  }
  return [trB, enB];
}

/* ---------- Zengin metin araç çubuğu (B/I/U/bağlantı) ---------- */

function wrapSel(ta, pre, post) {
  const s = ta.selectionStart ?? ta.value.length;
  const e = ta.selectionEnd ?? s;
  const v = ta.value;
  ta.value = v.slice(0, s) + pre + v.slice(s, e) + post + v.slice(e);
  ta.focus();
  ta.selectionStart = s + pre.length;
  ta.selectionEnd = e + pre.length;
  ta.dispatchEvent(new Event("input"));
}

function richToolbar(ta) {
  const bar = document.createElement("div");
  bar.className = "mb-rich-bar";
  const mk = (t, title, pre, post) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = t;
    b.title = title;
    b.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); wrapSel(ta, pre, post); });
    bar.appendChild(b);
  };
  mk("B", "Kalın", "<strong>", "</strong>");
  mk("I", "İtalik", "<em>", "</em>");
  mk("U", "Altı çizili", "<u>", "</u>");
  mk("🔗", "Bağlantı ekle", '<a href="https://">', "</a>");
  const clear = document.createElement("button");
  clear.type = "button";
  clear.textContent = "⌫";
  clear.title = "Etiketleri temizle";
  clear.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); ta.value = ta.value.replace(/<[^>]+>/g, ""); ta.dispatchEvent(new Event("input")); });
  bar.appendChild(clear);
  return bar;
}

/* ---------- Alan yardımcıları ---------- */

function fieldWrap(label) {
  const w = document.createElement("div");
  w.className = "mb-insp-field";
  const l = document.createElement("label");
  l.textContent = label;
  w.appendChild(l);
  return w;
}

/* TR/EN çift metin alanı (zengin metin desteğiyle) */
function langText(m, idx, key, label, opts, onDataAll) {
  const pair = pairBlock(m, idx);
  if (!pair) return document.createElement("div");
  const od = onDataAll || globalOnDataAll;
  const wrap = fieldWrap(label);
  const grid = document.createElement("div");
  grid.className = "mb-lang-pair";
  for (const [lang, blk] of [["TR", pair[0]], ["EN", pair[1]]]) {
    const cell = document.createElement("div");
    cell.className = "mb-lang-cell-mini";
    const tag = document.createElement("span");
    tag.className = "mb-lang-tag";
    tag.textContent = lang;
    cell.appendChild(tag);
    const ta = document.createElement(opts && opts.rows ? "textarea" : "input");
    if (opts && opts.rows) ta.rows = opts.rows; else ta.type = "text";
    ta.value = blk.data[key] ?? "";
    ta.addEventListener("input", () => { blk.data[key] = ta.value; od(m, idx); });
    if (opts && opts.rich) cell.appendChild(richToolbar(ta));
    cell.appendChild(ta);
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);
  return wrap;
}

/* Tek değerli alan (her iki dile de yazılır) */
function langSingle(m, idx, key, label, build, onDataAll) {
  const pair = pairBlock(m, idx);
  if (!pair) return document.createElement("div");
  const od = onDataAll || globalOnDataAll;
  const wrap = fieldWrap(label);
  const holder = document.createElement("div");
  holder.className = "mb-single";
  const commit = (v) => { pair[0].data[key] = v; pair[1].data[key] = v; od(m, idx); };
  build(holder, pair[0].data[key] ?? "", commit);
  wrap.appendChild(holder);
  return wrap;
}

/* Tek değerli açılır liste (TR/EN'e birlikte yazılır) */
function langSelect(m, idx, key, label, options) {
  return langSingle(m, idx, key, label, (holder, value, commit) => {
    const v = document.createElement("select");
    for (const [val, lbl] of options) { const o = document.createElement("option"); o.value = val; o.textContent = lbl; v.appendChild(o); }
    v.value = options.some(([val]) => val === value) ? value : (options[0] ? options[0][0] : "");
    v.addEventListener("change", () => commit(v.value));
    holder.appendChild(v);
  });
}

/* Tek değerli onay kutusu (TR/EN'e birlikte yazılır) */
function langCheck(m, idx, key, label) {
  return langSingle(m, idx, key, label, (holder, value, commit) => {
    const l = document.createElement("label");
    l.className = "mb-insp-req";
    l.textContent = label;
    const c = document.createElement("input");
    c.type = "checkbox";
    c.checked = !!value;
    c.addEventListener("change", () => commit(c.checked));
    l.prepend(c);
    holder.appendChild(l);
  });
}

/* İkon alanı (galeriyle) */
function langIcon(m, idx, key, label, onDataAll) {
  return langSingle(m, idx, key, label || "İkon", (holder, value, commit) => {
    const row = document.createElement("div");
    row.className = "mb-icon-row";
    const preview = document.createElement("span");
    preview.className = "icon-preview";
    preview.innerHTML = '<i class="' + iconCls(value || "") + '"></i>';
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = value || "";
    inp.placeholder = "bi bi-…";
    inp.addEventListener("input", () => { commit(inp.value); preview.innerHTML = '<i class="' + iconCls(inp.value) + '"></i>'; });
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small";
    btn.textContent = "Galeri";
    btn.addEventListener("click", () => openIconGallery((icon) => { commit(icon); inp.value = icon; preview.innerHTML = '<i class="' + iconCls(icon) + '"></i>'; }));
    row.appendChild(preview);
    row.appendChild(inp);
    row.appendChild(btn);
    holder.appendChild(row);
  });
}

/* Resim alanı (galeriyle) */
function langImage(m, idx, key, label, onDataAll) {
  return langSingle(m, idx, key, label || "Resim Yolu", (holder, value, commit) => {
    const row = document.createElement("div");
    row.className = "mb-img-row";
    const preview = document.createElement("img");
    preview.className = "mb-img-thumb";
    if (value) { preview.src = value; preview.onerror = () => { preview.style.opacity = "0.2"; }; }
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = value || "";
    inp.placeholder = "assets/images/…";
    inp.addEventListener("input", () => { commit(inp.value); preview.src = inp.value; preview.style.opacity = "1"; });
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small";
    btn.textContent = "Galeri";
    btn.addEventListener("click", () => openImageGallery((src) => { commit(src); inp.value = src; preview.src = src; preview.style.opacity = "1"; }));
    row.appendChild(preview);
    row.appendChild(inp);
    row.appendChild(btn);
    holder.appendChild(row);
  });
}

/* Resim galerisi (assets/images altından) */
async function openImageGallery(onPick) {
  let imgs = [];
  try { imgs = ((await api("/api/images")).images) || []; } catch (e) { imgs = []; }
  const grid = document.createElement("div");
  grid.className = "mb-img-grid";
  if (!imgs.length) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = "Görsel bulunamadı — assets/images klasörüne ekleyin.";
    grid.appendChild(h);
  }
  for (const src of imgs) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "mb-img-cell";
    const img = document.createElement("img");
    img.src = "/" + src;
    img.loading = "lazy";
    img.onerror = () => { b.style.display = "none"; };
    const cap = document.createElement("span");
    cap.textContent = src.replace("assets/images/", "");
    b.appendChild(img);
    b.appendChild(cap);
    b.addEventListener("click", () => { onPick(src); closeModal(); });
    grid.appendChild(b);
  }
  openModal(
    '<div class="modal-head"><h3>🖼 Görsel Galerisi</h3><button id="imgClose" class="icon-btn">✕</button></div>' +
    '<div class="mb-img-grid-wrap"></div>'
  );
  $("modalBox").querySelector(".mb-img-grid-wrap").appendChild(grid);
  $("imgClose").addEventListener("click", closeModal);
}

/* ---------- Öğe listeleri (TR/EN ayrı ama yan yana) ---------- */

function itemsEditorLang(m, idx, key, specs, addDefault, label, onDataAll) {
  const pair = pairBlock(m, idx);
  if (!pair) return document.createElement("div");
  const wrap = fieldWrap(label);
  const cols = document.createElement("div");
  cols.className = "mb-items-cols";
  for (const [lang, blk] of [["TR", pair[0]], ["EN", pair[1]]]) {
    const col = document.createElement("div");
    col.className = "mb-items-col";
    const head = document.createElement("div");
    head.className = "mb-items-col-head";
    const tag = document.createElement("span");
    tag.className = "mb-lang-tag";
    tag.textContent = lang;
    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn small";
    addBtn.textContent = "+ Öğe Ekle";
    addBtn.addEventListener("click", () => {
      (blk.data[key] || (blk.data[key] = [])).push(JSON.parse(JSON.stringify(addDefault())));
      syncHtml(m);
      rerender();
    });
    head.appendChild(tag);
    head.appendChild(addBtn);
    col.appendChild(head);
    const items = blk.data[key] || (blk.data[key] = []);
    items.forEach((it, i) => {
      const row = document.createElement("div");
      row.className = "mb-insp-item-row";
      const num = document.createElement("span");
      num.className = "mb-item-num";
      num.textContent = String(i + 1);
      row.appendChild(num);
      for (const spec of specs) {
        const cell = document.createElement("div");
        cell.className = "mb-item-cell";
        const lab = document.createElement("label");
        lab.textContent = spec.label;
        cell.appendChild(lab);
        if (spec.kind === "icon") {
          const ctl = document.createElement("div");
          ctl.className = "mb-icon-row";
          const pv = document.createElement("span");
          pv.className = "icon-preview";
          pv.innerHTML = '<i class="' + iconCls(it[spec.key] || "") + '"></i>';
          const inp = document.createElement("input");
          inp.type = "text";
          inp.value = it[spec.key] || "";
          inp.addEventListener("input", () => { it[spec.key] = inp.value; pv.innerHTML = '<i class="' + iconCls(inp.value) + '"></i>'; onDataAll(m, idx); });
          const gb = document.createElement("button");
          gb.type = "button";
          gb.className = "btn small";
          gb.textContent = "Galeri";
          gb.addEventListener("click", () => openIconGallery((icon) => { it[spec.key] = icon; inp.value = icon; pv.innerHTML = '<i class="' + iconCls(icon) + '"></i>'; onDataAll(m, idx); }));
          ctl.appendChild(pv);
          ctl.appendChild(inp);
          ctl.appendChild(gb);
          cell.appendChild(ctl);
        } else {
          const inp = document.createElement(spec.rows ? "textarea" : "input");
          if (spec.rows) inp.rows = spec.rows; else inp.type = "text";
          inp.value = it[spec.key] || "";
          inp.addEventListener("input", () => { it[spec.key] = inp.value; onDataAll(m, idx); });
          if (spec.rich) cell.appendChild(richToolbar(inp));
          cell.appendChild(inp);
        }
        row.appendChild(cell);
      }
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "btn small danger";
      rm.textContent = "✕";
      rm.addEventListener("click", () => { items.splice(i, 1); syncHtml(m); rerender(); });
      row.appendChild(rm);
      col.appendChild(row);
    });
    cols.appendChild(col);
  }
  wrap.appendChild(cols);
  return wrap;
}

/* ---------- Modal Üretici ---------- */

function renderModalBuilder(tab) {
  const root = document.createElement("div");
  root.className = "modal-builder";
  const data = tab.data;
  if (!Array.isArray(data.modals)) data.modals = [];
  if (!Array.isArray(data.categories)) data.categories = ["help", "anasayfa", "duyurular", "genel"];

  const rerender = () => {
    const formArea = $("formArea");
    formArea.innerHTML = "";
    formArea.appendChild(renderModalBuilder(tab));
  };

  const head = document.createElement("div");
  head.className = "mb-head";
  const h = document.createElement("h3");
  h.textContent = "🧩 Modal Üretici";
  const hsub = document.createElement("p");
  hsub.className = "mb-sub";
  hsub.textContent = "Görsel düzenleyici: parçaları tuvalin içine sürükleyin, parçaya tıklayınca sağda TR/EN birlikte düzenlenir. HTML otomatik üretilir, sayfalarda id ile referans verilir.";
  head.appendChild(h);
  head.appendChild(hsub);
  const addBtn = document.createElement("button");
  addBtn.className = "btn";
  addBtn.textContent = "+ Yeni Modal";
  addBtn.addEventListener("click", () => {
    const n = data.modals.length + 1;
    data.modals.push({ id: "modal-" + Date.now().toString(36), category: "genel", label: { tr: "Yeni Modal " + n, en: "New Modal " + n }, html: { tr: "", en: "" }, blocks: { tr: [], en: [] } });
    markDirty();
    rerender();
  });
  head.appendChild(addBtn);
  root.appendChild(head);

  data.modals.forEach((m, mi) => {
    if (!m.html || typeof m.html !== "object") m.html = { tr: "", en: "" };
    if (!m.label || typeof m.label !== "object") m.label = { tr: "", en: "" };
    if (!m.blocks || typeof m.blocks !== "object") m.blocks = { tr: htmlToBlocks(m.html.tr), en: htmlToBlocks(m.html.en) };
    if (!m._lang) m._lang = "tr";
    if (!m._mode) m._mode = "visual";
    if (typeof m._sel !== "number") m._sel = -1;
    if (typeof m._open !== "boolean") m._open = mi === 0;
    const cColor = categoryColor(m.category);

    const card = document.createElement("div");
    card.className = "mb-card" + (m._open ? "" : " collapsed");
    card.style.borderLeft = "4px solid " + cColor;

    const cardHead = document.createElement("div");
    cardHead.className = "mb-card-head";
    const chevron = document.createElement("button");
    chevron.type = "button";
    chevron.className = "mb-collapse";
    chevron.textContent = m._open ? "▾" : "▸";
    chevron.title = m._open ? "Bu modalın editörünü kapat" : "Bu modalın editörünü aç";
    chevron.addEventListener("click", () => {
      data.modals.forEach((o) => { o._open = o === m ? !o._open : false; });
      rerender();
    });
    const title = document.createElement("input");
    title.className = "mb-title-input";
    title.value = m.label.tr || "";
    title.placeholder = "Modal adı (TR)";
    title.addEventListener("input", () => { m.label.tr = title.value; markDirty(); });
    const idSpan = document.createElement("code");
    idSpan.className = "mb-id";
    idSpan.textContent = m.id || "(id yok)";
    const catSel = document.createElement("select");
    catSel.className = "mb-cat";
    for (const c of data.categories) { const o = document.createElement("option"); o.value = c; o.textContent = c; catSel.appendChild(o); }
    catSel.value = m.category || "genel";
    catSel.addEventListener("change", () => { m.category = catSel.value; markDirty(); rerender(); });
    const catChip = document.createElement("span");
    catChip.className = "mb-cat-chip";
    catChip.textContent = (m.category || "genel").toUpperCase();
    catChip.style.background = cColor;
    catChip.title = "Kategori rengi — karta da uygulanır";

    const langWrap = document.createElement("div");
    langWrap.className = "mb-lang-switch";
    for (const l of ["tr", "en"]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn small" + (m._lang === l ? " active" : "");
      b.textContent = l.toUpperCase();
      b.title = "Tuvalde gösterilecek dil (düzenleme TR/EN birlikte)";
      b.addEventListener("click", () => { m._lang = l; m._sel = -1; rerender(); });
      langWrap.appendChild(b);
    }
    const modeWrap = document.createElement("div");
    modeWrap.className = "mb-mode-switch";
    for (const [key, label] of [["visual", "👁 Görsel"], ["html", "</> HTML"]]) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn small" + (m._mode === key ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        if (key === "visual" && m._mode === "html") { m.blocks.tr = htmlToBlocks(m.html.tr); m.blocks.en = htmlToBlocks(m.html.en); }
        if (key === "html" && m._mode === "visual") syncHtml(m);
        m._mode = key;
        m._sel = -1;
        rerender();
      });
      modeWrap.appendChild(b);
    }
    const prevBtn = document.createElement("button");
    prevBtn.className = "btn small mb-prev-btn";
    prevBtn.textContent = "👁";
    prevBtn.title = "Bu modalı sitedeki gibi önizle";
    prevBtn.addEventListener("click", () => openModalPreview(m));
    const delBtn = document.createElement("button");
    delBtn.className = "btn small danger";
    delBtn.textContent = "🗑";
    delBtn.title = "Bu modalı sil";
    delBtn.addEventListener("click", async () => {
      if (await confirmDialog("“" + (m.label.tr || m.id) + "” silinsin mi? Referans veren sayfalar boş kalır.")) {
        data.modals.splice(mi, 1);
        markDirty();
        rerender();
      }
    });
    cardHead.append(chevron, title, idSpan, catSel, catChip, langWrap, modeWrap, prevBtn, delBtn);
    card.appendChild(cardHead);

    const cardBody = document.createElement("div");
    cardBody.className = "mb-card-body" + (m._open ? "" : " collapsed");

    const tplRow = document.createElement("div");
    tplRow.className = "mb-tpl-row";
    const tplSel = document.createElement("select");
    tplSel.className = "mb-tpl-sel";
    const tplEmpty = document.createElement("option");
    tplEmpty.value = "";
    tplEmpty.textContent = "— Şablon seç (TR+EN blokları doldurur) —";
    tplSel.appendChild(tplEmpty);
    for (const [k, t] of Object.entries(MODAL_TEMPLATES)) {
      const o = document.createElement("option");
      o.value = k;
      o.textContent = t.label;
      tplSel.appendChild(o);
    }
    tplSel.addEventListener("change", async () => {
      const t = MODAL_TEMPLATES[tplSel.value];
      if (!t) return;
      if (await confirmDialog("“" + t.label + "” şablonu bu modalın TR ve EN içeriğini değiştirecek. Devam?")) {
        m.blocks = { tr: JSON.parse(JSON.stringify(t.blocks.tr)), en: JSON.parse(JSON.stringify(t.blocks.en)) };
        m.html = { tr: blocksToHtml(m.blocks.tr), en: blocksToHtml(m.blocks.en) };
        m._sel = -1;
        markDirty();
        rerender();
      } else {
        tplSel.value = "";
      }
    });
    tplRow.appendChild(tplSel);
    cardBody.appendChild(tplRow);

    if (m._mode === "visual") {
      cardBody.appendChild(renderVisualEditor(m, rerender));
    } else {
      cardBody.appendChild(renderHtmlMode(m));
    }
    card.appendChild(cardBody);
    root.appendChild(card);
  });
  return root;
}

/* HTML modu: TR/EN textarea + canlı önizleme */
function renderHtmlMode(m) {
  const cols = document.createElement("div");
  cols.className = "mb-cols";
  const left = document.createElement("div");
  left.className = "mb-left";
  const right = document.createElement("div");
  right.className = "mb-right";
  const preTitle = document.createElement("div");
  preTitle.className = "mb-preview-title";
  preTitle.textContent = "👁 Önizleme (" + m._lang.toUpperCase() + ")";
  const pv = document.createElement("div");
  pv.className = "mb-preview-frame mb-preview-div";
  applyModalPreview(pv, m.html[m._lang] || "");
  right.appendChild(preTitle);
  right.appendChild(pv);
  for (const lang of ["tr", "en"]) {
    const cell = document.createElement("div");
    cell.className = "mb-lang-cell";
    const lbl = document.createElement("label");
    lbl.className = "mb-lang-label";
    lbl.textContent = "HTML (" + lang.toUpperCase() + ")";
    const ta = document.createElement("textarea");
    ta.className = "code-ta mb-ta";
    ta.rows = 14;
    ta.spellcheck = false;
    ta.value = m.html[lang] || "";
    ta.addEventListener("input", () => {
      m.html[lang] = ta.value;
      markDirty();
      checkHtmlBalance(ta);
      if (lang === m._lang) applyModalPreview(pv, m.html[lang] || "");
    });
    cell.appendChild(lbl);
    cell.appendChild(ta);
    left.appendChild(cell);
  }
  cols.appendChild(left);
  cols.appendChild(right);
  return cols;
}

/* Görsel mod: palet + tuval + denetçi */
function renderVisualEditor(m, rerender) {
  const wrap = document.createElement("div");
  wrap.className = "mb-vis";
  const lang = m._lang;
  if (!Array.isArray(m.blocks.tr)) m.blocks.tr = [];
  if (!Array.isArray(m.blocks.en)) m.blocks.en = [];
  const blocks = m.blocks[lang];
  const sel = m._sel;

  const onDataAll = (idx) => {
    m.html.tr = blocksToHtml(m.blocks.tr);
    m.html.en = blocksToHtml(m.blocks.en);
    markDirty();
    const bodyEl = wrap.querySelector('.mb-vblock[data-idx="' + idx + '"] .mb-vblock-body');
    if (bodyEl && m.blocks[lang][idx]) bodyEl.innerHTML = blockToHtml(m.blocks[lang][idx]);
  };

  const palette = document.createElement("div");
  palette.className = "mb-vis-palette";
  const pHint = document.createElement("div");
  pHint.className = "mb-vis-hint";
  pHint.textContent = "Parçayı sürükleyip tuvalin içine bırak:";
  palette.appendChild(pHint);
  for (const bt of BLOCK_TYPES) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn small mb-palette-item";
    b.textContent = "+ " + bt.label;
    b.draggable = true;
    b.dataset.type = bt.type;
    b.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("application/x-mb-type", bt.type);
      e.dataTransfer.effectAllowed = "copy";
    });
    palette.appendChild(b);
  }
  wrap.appendChild(palette);

  const body = document.createElement("div");
  body.className = "mb-vis-body";
  const canvas = document.createElement("div");
  canvas.className = "mb-canvas";
  canvas.dataset.dropIdx = String(blocks.length);
  const dropMarker = document.createElement("div");
  dropMarker.className = "mb-drop-marker";
  canvas.appendChild(dropMarker);

  const drawCanvas = () => {
    canvas.querySelectorAll(".mb-vblock").forEach((n) => n.remove());
    canvas.querySelectorAll(".mb-canvas-empty").forEach((n) => n.remove());
    if (!blocks.length) {
      const empty = document.createElement("div");
      empty.className = "mb-canvas-empty";
      empty.textContent = "Tuval boş — yukarıdan bir parça sürükleyin veya şablon seçin.";
      canvas.insertBefore(empty, dropMarker);
    }
    blocks.forEach((b, idx) => {
      const el = document.createElement("div");
      el.className = "mb-vblock" + (idx === sel ? " selected" : "");
      el.dataset.idx = String(idx);
      el.draggable = true;
      const label = document.createElement("div");
      label.className = "mb-vblock-label";
      label.textContent = ((BLOCK_TYPES.find((x) => x.type === b.type) || {}).label || b.type).toUpperCase();
      const bodyEl = document.createElement("div");
      bodyEl.className = "mb-vblock-body";
      bodyEl.innerHTML = blockToHtml(b);
      el.appendChild(label);
      el.appendChild(bodyEl);
      el.addEventListener("click", () => { m._sel = idx; rerender(); });
      el.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("application/x-mb-type", "__reorder:" + idx);
        e.dataTransfer.effectAllowed = "move";
      });
      canvas.insertBefore(el, dropMarker);
    });
  };
  drawCanvas();

  const computeDropIdx = (e) => {
    const items = Array.from(canvas.querySelectorAll(".mb-vblock"));
    if (!items.length) return 0;
    const y = e.clientY;
    for (let i = 0; i < items.length; i++) {
      const r = items[i].getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return items.length;
  };
  canvas.addEventListener("dragover", (e) => {
    e.preventDefault();
    const idx = computeDropIdx(e);
    canvas.dataset.dropIdx = String(idx);
    canvas.querySelectorAll(".mb-vblock").forEach((el, i) => el.classList.toggle("drop-target", i === idx));
  });
  canvas.addEventListener("dragleave", (e) => {
    if (!canvas.contains(e.relatedTarget)) canvas.querySelectorAll(".mb-vblock").forEach((el) => el.classList.remove("drop-target"));
  });
  canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    const idx = parseInt(canvas.dataset.dropIdx || "0", 10);
    const type = e.dataTransfer.getData("application/x-mb-type");
    canvas.querySelectorAll(".mb-vblock").forEach((el) => el.classList.remove("drop-target"));
    if (!type) return;
    if (type.startsWith("__reorder:")) {
      const from = parseInt(type.split(":")[1], 10);
      if (from === idx) return;
      const item = blocks.splice(from, 1)[0];
      blocks.splice(idx > from ? idx - 1 : idx, 0, item);
      // EN tarafını da senkron tut (yeni blok yoksa eşle)
      if (m.blocks.en[from] && m.blocks.en[from].type === item.type) {
        const eitem = m.blocks.en.splice(from, 1)[0];
        m.blocks.en.splice(idx > from ? idx - 1 : idx, 0, eitem);
      }
    } else {
      blocks.splice(idx, 0, { type, data: defaultBlockData(type, lang === "tr") });
      // EN'e de aynı bloğu ekle (TR/EN eşleşsin)
      if (lang === "tr") m.blocks.en.splice(idx, 0, { type, data: defaultBlockData(type, false) });
      else m.blocks.tr.splice(idx, 0, { type, data: defaultBlockData(type, true) });
    }
    m.html.tr = blocksToHtml(m.blocks.tr);
    m.html.en = blocksToHtml(m.blocks.en);
    markDirty();
    m._sel = -1;
    rerender();
  });

  body.appendChild(canvas);

  const inspector = document.createElement("div");
  inspector.className = "mb-inspector";
  if (sel >= 0 && blocks[sel]) {
    inspector.appendChild(renderInspector(m, sel, onDataAll, rerender));
  } else {
    const hint = document.createElement("div");
    hint.className = "mb-inspector-hint";
    hint.textContent = "Tuvale parça ekleyin, sonra düzenlemek için bir parçaya tıklayın. Metinler TR/EN birlikte düzenlenir.";
    inspector.appendChild(hint);
  }
  body.appendChild(inspector);
  wrap.appendChild(body);
  return wrap;
}

/* Seçili bloğun denetçi paneli */
function renderInspector(m, idx, onDataAll, rerender) {
  const lang = m._lang;
  const b = m.blocks[lang][idx];
  const box = document.createElement("div");
  box.className = "mb-inspector-box";
  const head = document.createElement("div");
  head.className = "mb-inspector-head";
  head.textContent = ((BLOCK_TYPES.find((x) => x.type === b.type) || {}).label || b.type) + " — Düzenle";

  const tools = document.createElement("div");
  tools.className = "mb-inspector-tools";
  const up = document.createElement("button");
  up.type = "button"; up.className = "btn small"; up.textContent = "↑";
  up.disabled = idx === 0;
  up.addEventListener("click", () => {
    for (const l of ["tr", "en"]) {
      const arr = m.blocks[l];
      if (arr[idx]) { const it = arr.splice(idx, 1)[0]; arr.splice(idx - 1, 0, it); }
    }
    m._sel = idx - 1;
    syncHtml(m);
    rerender();
  });
  const down = document.createElement("button");
  down.type = "button"; down.className = "btn small"; down.textContent = "↓";
  down.disabled = idx >= m.blocks[lang].length - 1;
  down.addEventListener("click", () => {
    for (const l of ["tr", "en"]) {
      const arr = m.blocks[l];
      if (arr[idx]) { const it = arr.splice(idx, 1)[0]; arr.splice(idx + 1, 0, it); }
    }
    m._sel = idx + 1;
    syncHtml(m);
    rerender();
  });
  const del = document.createElement("button");
  del.type = "button"; del.className = "btn small danger"; del.textContent = "✕";
  del.addEventListener("click", () => {
    for (const l of ["tr", "en"]) m.blocks[l].splice(idx, 1);
    m._sel = -1;
    syncHtml(m);
    rerender();
  });
  tools.append(up, down, del);
  head.appendChild(tools);
  box.appendChild(head);

  switch (b.type) {
    case "title":
      box.appendChild(langText(m, idx, "text", "Metin", { rich: true, rows: 2 }));
      box.appendChild(langSelect(m, idx, "level", "Başlık Boyutu", [["h2", "H2 — büyük"], ["h3", "H3 — orta"], ["h4", "H4 — küçük"]]));
      box.appendChild(langSelect(m, idx, "align", "Hizalama", [["left", "Sol"], ["center", "Orta"], ["right", "Sağ"]]));
      box.appendChild(langSingle(m, idx, "cls", "Başlık Bandı (gradient)", (holder, value, commit) => {
        const l = document.createElement("label");
        l.className = "mb-insp-req";
        l.textContent = "Gradient bant (anasayfa modalı görünümü)";
        const c = document.createElement("input");
        c.type = "checkbox";
        c.checked = value === "hm-title";
        c.addEventListener("change", () => commit(c.checked ? "hm-title" : ""));
        l.prepend(c);
        holder.appendChild(l);
      }));
      break;
    case "lead":
      box.appendChild(langText(m, idx, "text", "Paragraf", { rich: true, rows: 3 }));
      box.appendChild(langSelect(m, idx, "align", "Hizalama", [["left", "Sol"], ["center", "Orta"], ["right", "Sağ"]]));
      break;
    case "note":
    case "raw":
      box.appendChild(langText(m, idx, "html", "HTML (serbest — B/I/U destekler)", { rich: true, rows: 6 }));
      break;
    case "image":
      box.appendChild(langImage(m, idx, "src", "Resim Yolu"));
      box.appendChild(langText(m, idx, "alt", "Açıklama (alt metin)"));
      box.appendChild(langSingle(m, idx, "width", "Genişlik", (holder, value, commit) => {
        const row = document.createElement("div");
        row.className = "mb-range-row";
        const r = document.createElement("input");
        r.type = "range";
        r.min = 25; r.max = 100; r.step = 5;
        r.value = value || 100;
        const out = document.createElement("span");
        out.className = "mb-range-out";
        out.textContent = (value || 100) + "%";
        r.addEventListener("input", () => { out.textContent = r.value + "%"; commit(parseInt(r.value, 10)); });
        row.appendChild(r);
        row.appendChild(out);
        holder.appendChild(row);
      }));
      break;
    case "banner":
      box.appendChild(langIcon(m, idx, "icon", "İkon"));
      box.appendChild(langText(m, idx, "text", "Metin", { rich: true }));
      box.appendChild(langSelect(m, idx, "variant", "Renk", [["navy", "Lacivert (varsayılan)"], ["blue", "Mavi"], ["green", "Yeşil"], ["orange", "Turuncu"], ["red", "Kırmızı"]]));
      break;
    case "alert":
      box.appendChild(langSingle(m, idx, "variant", "Renk / Tip", (holder, value, commit) => {
        const v = document.createElement("select");
        for (const [val, lbl] of [["warning", "⚠ Uyarı (turuncu)"], ["danger", "✕ Tehlike (kırmızı)"], ["success", "✓ Başarı (yeşil)"], ["info", "ℹ Bilgi (mavi)"]]) {
          const o = document.createElement("option");
          o.value = val;
          o.textContent = lbl;
          v.appendChild(o);
        }
        v.value = value || "warning";
        v.addEventListener("change", () => commit(v.value));
        holder.appendChild(v);
      }));
      box.appendChild(langCheck(m, idx, "dismissible", "Kapatılabilir (✕)"));
      box.appendChild(langIcon(m, idx, "icon", "İkon"));
      box.appendChild(langText(m, idx, "title", "Başlık", { rich: true }));
      box.appendChild(langText(m, idx, "text", "Metin", { rich: true, rows: 2 }));
      break;
    case "button":
      box.appendChild(langText(m, idx, "text", "Buton Metni", { rich: true }));
      box.appendChild(langSingle(m, idx, "url", "Link (iç sayfa / dış adres / #)", (holder, value, commit) => {
        const inp = document.createElement("input");
        inp.type = "text";
        inp.value = value || "";
        inp.placeholder = "duyurular.html / https://…";
        inp.addEventListener("input", () => commit(inp.value));
        holder.appendChild(inp);
      }));
      box.appendChild(langSingle(m, idx, "variant", "Görünüm", (holder, value, commit) => {
        const v = document.createElement("select");
        for (const [val, lbl] of [["primary", "Dolu (primary)"], ["outline", "Çerçeve (outline)"]]) {
          const o = document.createElement("option");
          o.value = val;
          o.textContent = lbl;
          v.appendChild(o);
        }
        v.value = value || "primary";
        v.addEventListener("change", () => commit(v.value));
        holder.appendChild(v);
      }));
      box.appendChild(langIcon(m, idx, "icon", "İkon (isteğe bağlı)"));
      box.appendChild(langSelect(m, idx, "size", "Boyut", [["", "Normal"], ["sm", "Küçük"], ["lg", "Büyük"]]));
      box.appendChild(langCheck(m, idx, "blank", "Yeni sekmede aç"));
      break;
    case "features":
      box.appendChild(itemsEditorLang(m, idx, "items", [
        { key: "icon", label: "İkon", kind: "icon" },
        { key: "title", label: "Başlık", rich: true },
        { key: "text", label: "Açıklama", rich: true },
      ], () => ({ icon: "bi bi-check", title: "Yeni", text: "" }), "Özellikler (TR / EN)", onDataAll));
      box.appendChild(langSelect(m, idx, "cols", "Sütun Sayısı", [["2", "2 sütun"], ["3", "3 sütun"], ["4", "4 sütun"]]));
      break;
    case "list":
      box.appendChild(itemsEditorLang(m, idx, "items", [
        { key: "icon", label: "İkon", kind: "icon" },
        { key: "text", label: "Metin", rich: true },
      ], () => ({ icon: "bi bi-check", text: "Yeni öğe" }), "Liste (TR / EN)", onDataAll));
      box.appendChild(langCheck(m, idx, "ordered", "Numaralı liste (1. 2. 3.)"));
      break;
    case "steps":
      box.appendChild(itemsEditorLang(m, idx, "items", [
        { key: "_", label: "Adım", rich: true, string: true },
      ], () => "Yeni adım", "Adımlar (TR / EN)", onDataAll));
      break;
    case "divider":
      box.appendChild(langSingle(m, idx, "variant", "Çizgi Tipi", (holder, value, commit) => {
        const v = document.createElement("select");
        for (const [val, lbl] of [["dashed", "Kesik çizgi (---)"], ["solid", "Düz çizgi (───)"], ["dotted", "Noktalı (···)"]]) {
          const o = document.createElement("option");
          o.value = val;
          o.textContent = lbl;
          v.appendChild(o);
        }
        v.value = value || "dashed";
        v.addEventListener("change", () => commit(v.value));
        holder.appendChild(v);
      }));
      box.appendChild(langSelect(m, idx, "color", "Renk", [["slate", "Gri"], ["blue", "Mavi"], ["orange", "Turuncu"], ["red", "Kırmızı"]]));
      break;
    case "form":
      box.appendChild(renderFormInspector(m, idx, onDataAll, rerender));
      break;
    case "rating":
      box.appendChild(langText(m, idx, "question", "Soru", { rich: true }));
      box.appendChild(langSelect(m, idx, "max", "Yıldız Sayısı", [["5", "5 yıldız"], ["10", "10 yıldız"]]));
      break;
    default:
      break;
  }
  return box;
}

/* Form bloğu denetçisi: alanlar (TR/EN etiket) + form ayarları */
function renderFormInspector(m, idx, onDataAll, rerender) {
  const pair = pairBlock(m, idx);
  const wrap = document.createElement("div");
  wrap.className = "mb-insp-fields";
  if (!pair) return wrap;
  const trB = pair[0], enB = pair[1];
  const fields = trB.data.fields || (trB.data.fields = []);
  if (!Array.isArray(enB.data.fields)) enB.data.fields = [];
  const enFields = enB.data.fields;
  while (enFields.length < fields.length) enFields.push({ kind: "text", label: "", placeholder: "", required: false, options: [], name: "", sameRow: false });
  while (enFields.length > fields.length) enFields.pop();

  const secTitle = document.createElement("div");
  secTitle.className = "mb-insp-sec";
  secTitle.textContent = "Alanlar";
  wrap.appendChild(secTitle);

  fields.forEach((f, fi) => {
    const ef = enFields[fi];
    const row = document.createElement("div");
    row.className = "mb-insp-field-row";
    const top = document.createElement("div");
    top.className = "mb-field-top";
    const kindSel = document.createElement("select");
    for (const [val, lbl] of [["text", "Metin"], ["email", "E-posta"], ["tel", "Telefon"], ["url", "Web adresi"], ["date", "Tarih"], ["number", "Sayı"], ["textarea", "Uzun metin"], ["select", "Açılır liste"], ["rating", "Yıldız"], ["checkbox", "Onay kutusu"]]) {
      const o = document.createElement("option");
      o.value = val;
      o.textContent = lbl;
      kindSel.appendChild(o);
    }
    kindSel.value = f.kind || "text";
    kindSel.addEventListener("change", () => { f.kind = kindSel.value; ef.kind = kindSel.value; syncHtml(m); rerender(); });
    const nameInp = document.createElement("input");
    nameInp.type = "text";
    nameInp.value = f.name || "";
    nameInp.placeholder = "name (backend)";
    nameInp.title = "PHP vb. backend için alan adı";
    nameInp.addEventListener("input", () => { f.name = nameInp.value; ef.name = nameInp.value; onDataAll(idx); });
    top.appendChild(kindSel);
    top.appendChild(nameInp);
    const reqLab = document.createElement("label");
    reqLab.className = "mb-insp-req";
    reqLab.textContent = "Zorunlu";
    const reqChk = document.createElement("input");
    reqChk.type = "checkbox";
    reqChk.checked = !!f.required;
    reqChk.addEventListener("change", () => { f.required = reqChk.checked; ef.required = reqChk.checked; onDataAll(idx); });
    reqLab.appendChild(reqChk);
    top.appendChild(reqLab);
    if (fi > 0) {
      const srLab = document.createElement("label");
      srLab.className = "mb-insp-req";
      srLab.textContent = "Yan yana";
      const srChk = document.createElement("input");
      srChk.type = "checkbox";
      srChk.checked = !!f.sameRow;
      srChk.addEventListener("change", () => { f.sameRow = srChk.checked; ef.sameRow = srChk.checked; onDataAll(idx); });
      srLab.appendChild(srChk);
      top.appendChild(srLab);
    }
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "btn small danger";
    rm.textContent = "✕";
    rm.addEventListener("click", () => { fields.splice(fi, 1); enFields.splice(fi, 1); syncHtml(m); rerender(); });
    top.appendChild(rm);
    row.appendChild(top);

    const langs = document.createElement("div");
    langs.className = "mb-lang-pair";
    for (const [tag, blk] of [["TR", f], ["EN", ef]]) {
      const cell = document.createElement("div");
      cell.className = "mb-lang-cell-mini";
      const t = document.createElement("span");
      t.className = "mb-lang-tag";
      t.textContent = tag;
      cell.appendChild(t);
      const lbl = document.createElement("input");
      lbl.type = "text";
      lbl.value = blk.label || "";
      lbl.placeholder = "Etiket";
      lbl.addEventListener("input", () => { blk.label = lbl.value; onDataAll(idx); });
      const ph = document.createElement("input");
      ph.type = "text";
      ph.value = blk.placeholder || "";
      ph.placeholder = "Yer tutucu";
      ph.addEventListener("input", () => { blk.placeholder = ph.value; onDataAll(idx); });
      cell.appendChild(lbl);
      cell.appendChild(ph);
      langs.appendChild(cell);
    }
    row.appendChild(langs);
    if (f.kind === "select") {
      const opts = document.createElement("input");
      opts.type = "text";
      opts.value = (f.options || []).join(", ");
      opts.placeholder = "Seçenekler (virgülle)";
      opts.addEventListener("input", () => {
        f.options = opts.value.split(",").map((s) => s.trim()).filter(Boolean);
        ef.options = f.options.slice();
        onDataAll(idx);
      });
      const optsWrap = document.createElement("div");
      optsWrap.className = "mb-field-opt";
      optsWrap.appendChild(opts);
      row.appendChild(optsWrap);
    }
    wrap.appendChild(row);
  });

  const add = document.createElement("button");
  add.type = "button";
  add.className = "btn small";
  add.textContent = "+ Alan Ekle";
  add.addEventListener("click", () => {
    fields.push({ kind: "text", label: "Yeni Alan", placeholder: "", required: false, options: [], name: "", sameRow: false });
    enFields.push({ kind: "text", label: "New Field", placeholder: "", required: false, options: [], name: "", sameRow: false });
    syncHtml(m);
    rerender();
  });
  wrap.appendChild(add);

  const sec2 = document.createElement("div");
  sec2.className = "mb-insp-sec";
  sec2.textContent = "Form Ayarları";
  wrap.appendChild(sec2);

  const stWrap = langText(m, idx, "submitText", "Gönder Butonu Metni");
  wrap.appendChild(stWrap);
  wrap.appendChild(langSelect(m, idx, "submitVariant", "Gönder Butonu Görünümü", [["primary", "Dolu"], ["outline", "Çerçeve"]]));
  wrap.appendChild(langSingle(m, idx, "action", "Formun gönderileceği adres (PHP vb. backend)", (holder, value, commit) => {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = value || "";
    inp.placeholder = "ornek.php / https://… (boşsa form gönderilmez)";
    inp.addEventListener("input", () => commit(inp.value));
    holder.appendChild(inp);
  }));
  wrap.appendChild(langSingle(m, idx, "method", "Gönderim Yöntemi", (holder, value, commit) => {
    const v = document.createElement("select");
    for (const [val, lbl] of [["post", "POST (form gönderimi)"], ["get", "GET (URL parametreleri)"]]) {
      const o = document.createElement("option");
      o.value = val;
      o.textContent = lbl;
      v.appendChild(o);
    }
    v.value = value || "post";
    v.addEventListener("change", () => commit(v.value));
    holder.appendChild(v);
  }));
  return wrap;
}

/* Modalı sitedeki gibi popup olarak önizle */
function openModalPreview(m) {
  const lang = m._lang || "tr";
  const html = m.html[lang] || "";
  let ov = document.getElementById("mgrModalPreview");
  if (!ov) {
    ov = document.createElement("div");
    ov.id = "mgrModalPreview";
    ov.className = "mgr-modal-preview-overlay";
    ov.innerHTML =
      '<div class="mgr-modal-preview-pop">' +
      '<div class="mgr-modal-preview-head"><span>👁 Modal Önizleme</span><button type="button" class="btn small" id="mgrModalPreviewClose">✕ Kapat</button></div>' +
      '<div class="mgr-modal-preview-body"></div></div>';
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
    ov.querySelector("#mgrModalPreviewClose").addEventListener("click", () => ov.classList.remove("open"));
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { ov.classList.remove("open"); document.removeEventListener("keydown", esc); } });
    document.body.appendChild(ov);
  }
  const body = ov.querySelector(".mgr-modal-preview-body");
  let style = ov.querySelector("style.mb-preview-style");
  if (!style) {
    style = document.createElement("style");
    style.className = "mb-preview-style";
    ov.querySelector(".mgr-modal-preview-pop").prepend(style);
  }
  style.textContent = MODAL_PREVIEW_CSS + ".mgr-modal-preview-body{padding:18px;font-size:14px}";
  body.innerHTML = html || "<p style='color:#94a3b8'>İçerik boş — tuvalden parça ekleyin veya şablon seçin.</p>";
  ov.querySelector(".mgr-modal-preview-head span").textContent = "👁 Modal Önizleme (" + lang.toUpperCase() + ") — " + (m.label.tr || m.id || "");
  ov.classList.add("open");
}
/* ---------- Form bölümleri (akordeon) + TOC ---------- */

function defaultSectionsCollapsed(fieldCount) {
  if (fieldCount <= 1) return false;
  return localStorage.getItem("mgr_sections") !== "open";
}

function sectionCount(f, obj) {
  const v = obj[f.key];
  if (f.type === "array" || f.type === "components") return Array.isArray(v) ? v.length : 0;
  if (f.type === "object") return (f.fields || []).length;
  return 1;
}

function renderSection(f, obj, startCollapsed, path) {
  const sec = document.createElement("div");
  sec.className = "form-section" + (startCollapsed ? " collapsed" : "");
  const head = document.createElement("button");
  head.className = "form-section-head" + (startCollapsed ? "" : " open");
  const chev = document.createElement("span");
  chev.className = "chev";
  chev.textContent = "▶";
  const label = document.createElement("span");
  label.className = "form-section-label";
  label.textContent = f.label || f.key;
  if (f.required) {
    const star = document.createElement("span");
    star.className = "req";
    star.textContent = " *";
    label.appendChild(star);
  }
  const count = document.createElement("span");
  count.className = "form-section-count";
  count.textContent = sectionCount(f, obj);
  head.appendChild(chev);
  head.appendChild(label);
  head.appendChild(count);
  const body = document.createElement("div");
  body.className = "form-section-body";
  body.appendChild(renderField(f, obj, path));
  sec.appendChild(head);
  sec.appendChild(body);
  head.addEventListener("click", () => {
    sec.classList.toggle("collapsed");
    head.classList.toggle("open", !sec.classList.contains("collapsed"));
  });
  return sec;
}

function renderToc(secs, fields) {
  const tocBar = $("tocBar");
  tocBar.innerHTML = "";
  if (fields.length <= 1) {
    tocBar.classList.add("hidden");
    return;
  }
  tocBar.classList.remove("hidden");
  const wrap = document.createElement("div");
  wrap.className = "toc-chips";
  const anyCollapsed = secs.some((s) => s.classList.contains("collapsed"));
  const toggleAll = document.createElement("button");
  toggleAll.className = "btn small";
  toggleAll.textContent = anyCollapsed ? "Tümünü Aç" : "Tümünü Kapat";
  toggleAll.addEventListener("click", () => {
    const open = anyCollapsed;
    secs.forEach((s) => {
      s.classList.toggle("collapsed", !open);
      s.querySelector(".form-section-head").classList.toggle("open", open);
    });
    localStorage.setItem("mgr_sections", open ? "open" : "collapsed");
    renderToc(secs, fields);
  });
  wrap.appendChild(toggleAll);
  secs.forEach((s, i) => {
    const chip = document.createElement("button");
    chip.className = "toc-chip";
    const f = fields[i];
    chip.textContent = (f.label || f.key) + " (" + sectionCount(f, activeTab().data) + ")";
    chip.addEventListener("click", () => {
      s.classList.remove("collapsed");
      s.querySelector(".form-section-head").classList.add("open");
      s.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    wrap.appendChild(chip);
  });
  tocBar.appendChild(wrap);
}

/* ---------- Şema tabanlı form ---------- */

function defaultFor(f) {
  if ("default" in f) return JSON.parse(JSON.stringify(f.default));
  switch (f.type) {
    case "lang": return { tr: "", en: "" };
    case "object": return {};
    case "array":
    case "components":
    case "day-multiselect": return [];
    case "number": return 0;
    case "boolean": return false;
    default: return "";
  }
}

function defaultItem(f) {
  if (f.type === "components") {
    const types = Object.keys(f.components || {});
    const first = types[0] || "";
    return { type: first, data: componentDefaults((f.components || {})[first]) };
  }
  if (f.itemType) return f.itemType === "number" ? 0 : "";
  if (f.itemFields && f.itemFields.length === 1 && f.itemFields[0].type === "lang") {
    return { tr: "", en: "" }; // lang öğeli dizi — öğe doğrudan {tr,en}
  }
  const item = {};
  if (f.itemFields) for (const sf of f.itemFields) {
    if (sf.type === "transfer") continue; // sanal buton alanı — veriye yazılmaz
    if (sf.key === "id" && sf.auto) {
      item[sf.key] = autoId(f.itemLabel || sf.label || "item"); // otomatik benzersiz id
      continue;
    }
    item[sf.key] = defaultFor(sf);
  }
  return item;
}

function autoId(label) {
  // modal-20260815-1020 gibi benzersiz slug — başlıktan temizlenir
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const base = String(label || "item").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 20) || "item";
  return base + "-" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

function componentDefaults(comp) {
  const d = {};
  for (const sf of (comp && comp.fields) || []) d[sf.key] = defaultFor(sf);
  return d;
}

function ensureDefaults(fields, obj) {
  if (!fields || typeof obj !== "object" || obj === null) return;
  for (const f of fields) {
    if (f.key in obj) continue;
    if (f.type === "object" || f.type === "array" || f.type === "components" || f.type === "lang") {
      obj[f.key] = defaultFor(f);
    }
  }
}

function renderFields(container, fields, obj, path) {
  ensureDefaults(fields, obj);
  for (const f of fields) {
    container.appendChild(renderField(f, obj, path ? path + "." + f.key : f.key));
  }
  applyVisibleWhen(container, fields);
}

/**
 * Koşullu görünürlük: visibleWhen: { key: "breadcrumbMode", value: "manual" }
 * Kaynak alan değişince hedef alan gösterilir/gizlenir. value dizi olabilir.
 */
function applyVisibleWhen(container, fields) {
  for (const f of fields) {
    if (!f.visibleWhen) continue;
    const target = container.querySelector(`.field[data-key="${f.key}"]`);
    if (!target) continue;
    const vw = f.visibleWhen;
    const srcEl = container.querySelector(`.field[data-key="${vw.key}"]`);
    const input = srcEl ? srcEl.querySelector("select, input[type=checkbox], input[type=text], input[type=number], input[type=color], input[type=date], input[type=time], input:not([type]), textarea") : null;
    const update = () => {
      let val = null;
      if (input) val = input.type === "checkbox" ? input.checked : input.value;
      const match = Array.isArray(vw.value)
        ? vw.value.includes(val)
        : String(val) === String(vw.value);
      target.style.display = match ? "" : "none";
    };
    if (input) input.addEventListener("change", update);
    update();
  }
}

function renderField(f, obj, path) {
  // Saf görsel grup başlığı — veriye yazılmaz
  if (f.type === "group") {
    const g = document.createElement("div");
    g.className = "field-group";
    if (f.label) {
      const t = document.createElement("div");
      t.className = "field-group-title";
      t.textContent = f.label;
      g.appendChild(t);
    }
    if (f.hint) {
      const h = document.createElement("div");
      h.className = "hint";
      h.textContent = f.hint;
      g.appendChild(h);
    }
    return g;
  }
  const wrap = document.createElement("div");
  wrap.className = "field";
  if (path) wrap.dataset.path = path;
  wrap.dataset.key = f.key || "";
  const label = document.createElement("label");
  label.className = "field-label";
  label.textContent = f.label || f.key;
  if (f.required) {
    const star = document.createElement("span");
    star.className = "req";
    star.textContent = " *";
    label.appendChild(star);
  }
  wrap.appendChild(label);

  switch (f.type) {
    case "object": {
      if (typeof obj[f.key] !== "object" || obj[f.key] === null) obj[f.key] = {};
      const box = document.createElement("div");
      box.className = "object-box";
      if (f.description) box.title = f.description;
      if (f.fields) renderFields(box, f.fields, obj[f.key], path);
      wrap.appendChild(box);
      break;
    }
    case "lang":
      wrap.appendChild(renderLang(f, obj));
      break;
    case "array":
    case "components":
      if (!Array.isArray(obj[f.key])) obj[f.key] = [];
      wrap.appendChild(renderArray(f, obj[f.key], path));
      break;
    case "raw":
      wrap.appendChild(renderRaw(f, obj));
      break;
    case "jsonfile":
      wrap.appendChild(renderJsonFileField(f, obj[f.key], (v) => { obj[f.key] = v; markDirty(); }));
      break;
    case "globallink": {
      // Başka bir JSON dosyasını editörde açan buton (örn. sayfa hero'sundan settings.json)
      const holder = document.createElement("div");
      holder.className = "control";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn small globallink-btn";
      btn.textContent = f.buttonText || "⚙ Global Ayarları Aç";
      btn.title = "Global ayar dosyasını ayrı sekmede aç";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectFile(f.path || "settings.json");
      });
      holder.appendChild(btn);
      if (f.hint) {
        const h = document.createElement("div");
        h.className = "hint";
        h.textContent = f.hint;
        holder.appendChild(h);
      }
      wrap.appendChild(holder);
      break;
    }
    case "boolean": {
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!obj[f.key];
      cb.addEventListener("change", () => { obj[f.key] = cb.checked; markDirty(); });
      const holder = document.createElement("div");
      holder.className = "control";
      holder.appendChild(cb);
      if (f.hint) {
        const h = document.createElement("div");
        h.className = "hint";
        h.textContent = f.hint;
        holder.appendChild(h);
      }
      wrap.appendChild(holder);
      break;
    }
    case "day-multiselect": {
      if (!Array.isArray(obj[f.key])) obj[f.key] = [];
      const holder = document.createElement("div");
      holder.className = "day-multiselect";
      const days = [["1", "Pzt"], ["2", "Sal"], ["3", "Çar"], ["4", "Per"], ["5", "Cum"], ["6", "Cmt"], ["0", "Paz"]];
      for (const [num, label] of days) {
        const lab = document.createElement("label");
        lab.className = "day-chip";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = obj[f.key].includes(Number(num));
        cb.addEventListener("change", () => {
          const n = Number(num);
          if (cb.checked) { if (!obj[f.key].includes(n)) obj[f.key].push(n); }
          else obj[f.key] = obj[f.key].filter((v) => v !== n);
          markDirty();
        });
        const span = document.createElement("span");
        span.textContent = label;
        lab.appendChild(cb);
        lab.appendChild(span);
        holder.appendChild(lab);
      }
      if (f.hint) {
        const h = document.createElement("div");
        h.className = "hint";
        h.textContent = f.hint;
        holder.appendChild(h);
      }
      wrap.appendChild(holder);
      break;
    }
    default:
      wrap.appendChild(renderScalar(f, obj[f.key], (v) => { obj[f.key] = v; markDirty(); }));
  }

  wrap.addEventListener("focusin", () => {
    const v = obj[f.key];
    if (f.type === "lang" && v && typeof v === "object") findInPreview([v.tr, v.en]);
    else if (typeof v === "string" && v.trim()) findInPreview([v]);
    else if (typeof v === "number") findInPreview([String(v)]);
  });
  return wrap;
}

function renderJsonFileField(f, value, onchange) {
  const holder = document.createElement("div");
  holder.className = "control";
  const row = document.createElement("div");
  row.className = "jsonfile-row";
  const st = { unlocked: false };
  function build() {
    row.innerHTML = "";
    if (st.unlocked) {
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = value ?? "";
      inp.addEventListener("input", () => { value = inp.value; onchange(value); });
      const lockBtn = document.createElement("button");
      lockBtn.type = "button";
      lockBtn.className = "btn tiny";
      lockBtn.title = "Kilitle";
      lockBtn.textContent = "🔒";
      lockBtn.addEventListener("click", () => { st.unlocked = false; build(); });
      row.appendChild(inp);
      row.appendChild(lockBtn);
    } else {
      const lock = document.createElement("span");
      lock.className = "lock-ic";
      lock.textContent = "🔒";
      row.appendChild(lock);
      const val = (value || "").trim();
      if (/^data\/.*\.json$/.test(val)) {
        const a = document.createElement("a");
        a.className = "json-link";
        a.textContent = val;
        a.title = "Bu JSON dosyasını editörde aç";
        a.href = "#";
        a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); selectFile(val); });
        row.appendChild(a);
      } else {
        const span = document.createElement("span");
        span.className = "json-path-text";
        span.textContent = val || "—";
        row.appendChild(span);
      }
      const unlockBtn = document.createElement("button");
      unlockBtn.type = "button";
      unlockBtn.className = "btn tiny";
      unlockBtn.title = "Düzenlemek için kilidi aç";
      unlockBtn.textContent = "✏️";
      unlockBtn.addEventListener("click", () => { st.unlocked = true; build(); });
      row.appendChild(unlockBtn);
    }
  }
  build();
  holder.appendChild(row);
  if (f.hint) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = f.hint;
    holder.appendChild(h);
  }
  return holder;
}

const VOID_TAGS = new Set(["br", "img", "input", "hr", "meta", "link", "area", "base", "col", "embed", "source", "track", "wbr"]);

function checkHtmlBalance(ta) {
  const code = ta.value || "";
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s[^<>]*?)?)\/?>/g;
  let m, issues = [];
  while ((m = re.exec(code))) {
    const full = m[0], tag = m[1].toLowerCase();
    if (full.startsWith("</")) {
      if (VOID_TAGS.has(tag)) continue;
      const idx = stack.lastIndexOf(tag);
      if (idx === -1) issues.push("</" + tag + "> için açılış yok");
      else stack.splice(idx, 1);
    } else if (!full.endsWith("/>") && !VOID_TAGS.has(tag)) {
      stack.push(tag);
    }
  }
  if (stack.length) issues.push("Kapanmamış: " + stack.join(", "));
  let warn = ta.parentElement.querySelector(".code-warn");
  if (!warn) {
    warn = document.createElement("div");
    warn.className = "code-warn";
    ta.parentElement.appendChild(warn);
  }
  if (issues.length) {
    warn.textContent = "⚠ " + issues.slice(0, 3).join(" · ");
    warn.style.display = "";
  } else {
    warn.style.display = "none";
  }
}

/* Onay diyaloğu — native confirm() ana thread'i bloke ediyor (özellikle önizleme ortamında). */
function confirmDialog(msg, okText) {
  return new Promise((resolve) => {
    let dlg = document.getElementById("mgrConfirmDlg");
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.id = "mgrConfirmDlg";
      dlg.className = "mgr-confirm-dlg";
      dlg.innerHTML =
        '<div class="mgr-confirm-panel">' +
        '<p class="mgr-confirm-msg"></p>' +
        '<div class="mgr-confirm-btns">' +
        '<button type="button" class="btn" id="mgrConfirmOk">Onayla</button>' +
        '<button type="button" class="btn small" id="mgrConfirmCancel">Vazgeç</button>' +
        '</div></div>';
      dlg.querySelector("#mgrConfirmOk").addEventListener("click", () => { dlg.classList.remove("open"); resolve(true); });
      dlg.querySelector("#mgrConfirmCancel").addEventListener("click", () => { dlg.classList.remove("open"); resolve(false); });
      dlg.addEventListener("click", (e) => { if (e.target === dlg) { dlg.classList.remove("open"); resolve(false); } });
      document.body.appendChild(dlg);
    }
    dlg.querySelector(".mgr-confirm-msg").textContent = msg;
    dlg.querySelector("#mgrConfirmOk").textContent = okText || "Onayla";
    dlg.classList.add("open");
  });
}

/* HTML kod alanı önizlemesi: div içinde gerçek render (iframe bu ortamda ana thread'i kilitliyor) */
function previewHtmlCode(html) {
  let dlg = document.getElementById("htmlPreviewDlg");
  if (!dlg) {
    dlg = document.createElement("div");
    dlg.id = "htmlPreviewDlg";
    dlg.className = "html-preview-dlg";
    dlg.innerHTML =
      '<div class="html-preview-panel">' +
      '<div class="html-preview-head"><span>👁 HTML Önizleme</span><button type="button" class="btn small" id="htmlPreviewClose">✕ Kapat</button></div>' +
      '<div class="html-preview-body"></div></div>';
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.classList.remove("open"); });
    dlg.querySelector("#htmlPreviewClose").addEventListener("click", () => dlg.classList.remove("open"));
    document.body.appendChild(dlg);
  }
  const body = dlg.querySelector(".html-preview-body");
  let style = dlg.querySelector("style.mb-preview-style");
  if (!style) {
    style = document.createElement("style");
    style.className = "mb-preview-style";
    dlg.querySelector(".html-preview-panel").prepend(style);
  }
  style.textContent = MODAL_PREVIEW_CSS + "body{font-family:system-ui,sans-serif;padding:16px;color:#1e293b}";
  body.innerHTML = html || "<p style='color:#94a3b8'>Boş içerik</p>";
  dlg.classList.add("open");
}

function renderScalar(f, value, onchange) {
  if (f.type === "icon") return renderIconField(f, value, onchange);
  if (f.type === "image") return renderImageField(f, value, onchange);
  const holder = document.createElement("div");
  holder.className = "control";
  let ctl;
  if (f.readonly) {
    const disp = document.createElement("div");
    disp.className = "locked-value";
    const lock = document.createElement("span");
    lock.className = "lock-ic";
    lock.textContent = "🔒";
    disp.appendChild(lock);
    const span = document.createElement("span");
    span.textContent = value ?? "";
    disp.appendChild(span);
    holder.appendChild(disp);
    if (f.hint) {
      const h = document.createElement("div");
      h.className = "hint";
      h.textContent = f.hint;
      holder.appendChild(h);
    }
    return holder;
  }
  switch (f.type) {
    case "code": {
      const row = document.createElement("div");
      row.className = "code-row";
      const ta = document.createElement("textarea");
      ta.rows = 6;
      ta.spellcheck = false;
      ta.className = "code-ta";
      ta.placeholder = f.placeholder || "<form>…</form>";
      ta.value = value ?? "";
      ta.addEventListener("input", () => { onchange(ta.value); checkHtmlBalance(ta); });
      ctl = ta;
      const pv = document.createElement("button");
      pv.type = "button";
      pv.className = "btn small html-preview-btn";
      pv.textContent = "👁 Önizle";
      pv.title = "Bu HTML'i canlı önizle";
      pv.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); previewHtmlCode(ta.value); });
      row.appendChild(ta);
      row.appendChild(pv);
      ctl = row; // switch sonrası wrap'e eklenir
      break;
    }
    case "textarea": {
      const ta = document.createElement("textarea");
      ta.rows = 4;
      ta.value = value ?? "";
      ta.addEventListener("input", () => onchange(ta.value));
      ctl = ta;
      break;
    }
    case "select": {
      const sel = document.createElement("select");
      for (const opt of f.options || []) {
        const o = document.createElement("option");
        o.value = typeof opt === "object" ? opt.value : opt;
        o.textContent = typeof opt === "object" ? opt.label : opt;
        sel.appendChild(o);
      }
      sel.value = value ?? "";
      sel.addEventListener("change", () => onchange(sel.value));
      ctl = sel;
      break;
    }
    case "modalref": {
      // Genel modal kütüphanesinden beslenen select (id + kategori + etiket)
      const sel = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = "— Modal seçin —";
      sel.appendChild(empty);
      api("/api/modals").then((res) => {
        if (!res || !res.ok) return;
        for (const m of res.modals || []) {
          const o = document.createElement("option");
          o.value = m.id || "";
          const lbl = (m.label && (m.label.tr || m.label.en)) || m.id;
          o.textContent = (m.category ? m.category + " · " : "") + lbl;
          sel.appendChild(o);
        }
        if (value && !Array.from(sel.options).some((o) => o.value === value)) {
          const o = document.createElement("option");
          o.value = value;
          o.textContent = value + " (kütüphanede yok)";
          sel.appendChild(o);
        }
        sel.value = value ?? "";
      });
      sel.addEventListener("change", () => onchange(sel.value));
      ctl = sel;
      break;
    }
    case "number": {
      const inp = document.createElement("input");
      inp.type = "number";
      inp.step = "any";
      inp.value = value ?? 0;
      inp.addEventListener("input", () => onchange(inp.value === "" ? 0 : Number(inp.value)));
      ctl = inp;
      break;
    }
    case "color": {
      // Boş değer siyah gibi görünmesin diye nötr gri + "Global" rozeti gösterilir.
      // Sayfa değeri boşken settings.json'daki global renk geçerlidir.
      // Ayrıca sitenin ana renkleri (variables.css) hazır swatch olarak sunulur.
      const PLACEHOLDER = "#d9d9d9";
      const PALETTE = [
        { name: "Sarı (accent)", value: "#FFC43D" },
        { name: "Mavi (primary)", value: "#1F4C8A" },
        { name: "Koyu Mavi (primary-dark)", value: "#153a6d" },
        { name: "Açık Mavi (tertiary)", value: "#EEF9FC" },
        { name: "Açık Mavi koyu (tertiary-dark)", value: "#d5eef5" },
        { name: "Beyaz", value: "#ffffff" },
        { name: "Kırmızı (secondary)", value: "#C03221" }
      ];
      let current = value || "";
      const badge = document.createElement("span");
      badge.className = "color-global-badge";
      const inp = document.createElement("input");
      inp.type = "color";
      inp.value = current || PLACEHOLDER;
      const syncBadge = () => {
        badge.textContent = "Global";
        badge.style.display = current ? "none" : "";
        inp.title = current ? "" : "Boş — global ayar (settings.json) geçerli";
      };
      inp.addEventListener("input", () => {
        current = inp.value;
        onchange(current);
        syncBadge();
      });
      // Sıfırla: değeri temizler → global ayar (settings.json) geçerli olur
      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "btn tiny color-reset";
      resetBtn.textContent = "✕";
      resetBtn.title = "Sıfırla — global ayar kullanılsın (kayıtta boş yazılır, global renk geçerli olur)";
      resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        current = "";
        inp.value = PLACEHOLDER;
        onchange("");
        syncBadge();
      });
      // Hazır palet — sitenin ana renkleri, tek tıkla seç
      const palette = document.createElement("div");
      palette.className = "color-palette";
      PALETTE.forEach((p) => {
        const sw = document.createElement("button");
        sw.type = "button";
        sw.className = "color-swatch";
        sw.style.background = p.value;
        sw.title = p.name + " " + p.value;
        sw.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          current = p.value;
          inp.value = p.value;
          onchange(p.value);
          syncBadge();
        });
        palette.appendChild(sw);
      });
      const row = document.createElement("div");
      row.className = "color-row";
      row.appendChild(inp);
      row.appendChild(resetBtn);
      row.appendChild(badge);
      row.appendChild(palette);
      ctl = row;
      syncBadge();
      break;
    }
    case "date": {
      const inp = document.createElement("input");
      inp.type = "date";
      inp.value = value || "";
      inp.addEventListener("change", () => onchange(inp.value));
      ctl = inp;
      break;
    }
    case "time": {
      const inp = document.createElement("input");
      inp.type = "time";
      inp.value = value || "";
      inp.addEventListener("change", () => onchange(inp.value));
      ctl = inp;
      break;
    }
    default: {
      const inp = document.createElement("input");
      inp.type = f.type === "url" ? "url" : "text";
      inp.value = value ?? "";
      inp.placeholder = f.placeholder || "";
      inp.addEventListener("input", () => onchange(inp.value));
      ctl = inp;
      break;
    }
  }
  holder.appendChild(ctl);
  if (f.hint) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = f.hint;
    holder.appendChild(h);
  }
  return holder;
}

function renderLang(f, obj) {
  let value = obj[f.key];
  if (typeof value === "string") {
    const holder = document.createElement("div");
    holder.className = "control";
    const inp = document.createElement("input");
    inp.type = "text";
    inp.value = value;
    inp.placeholder = f.placeholder || "";
    inp.addEventListener("input", () => { obj[f.key] = inp.value; markDirty(); });
    holder.appendChild(inp);
    return holder;
  }
  if (!value || typeof value !== "object") value = obj[f.key] = { tr: "", en: "" };
  const holder = document.createElement("div");
  holder.className = "lang-pair";
  for (const lang of ["tr", "en"]) {
    const cell = document.createElement("div");
    cell.className = "lang-cell";
    const badge = document.createElement("span");
    badge.className = "lang-badge " + lang;
    badge.textContent = lang.toUpperCase();
    const ta = document.createElement("textarea");
    ta.rows = 1;
    ta.value = value[lang] ?? "";
    ta.placeholder = f.placeholder || "";
    ta.addEventListener("input", () => {
      value[lang] = ta.value;
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
      markDirty();
    });
    ta.style.height = "auto";
    ta.style.height = ta.scrollHeight + "px";
    cell.appendChild(badge);
    cell.appendChild(ta);
    holder.appendChild(cell);
  }
  return holder;
}

/* ---------- İkon alanı + galeri ---------- */

function iconCls(v) {
  return v && v.startsWith("bi-") ? "bi " + v : v;
}

let ICONS = null;

function renderIconField(f, value, onchange) {
  const holder = document.createElement("div");
  holder.className = "control icon-control";
  const preview = document.createElement("span");
  preview.className = "icon-preview";
  preview.innerHTML = '<i class="' + iconCls(value || "") + '"></i>';
  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = value ?? "";
  inp.placeholder = f.placeholder || "fas fa-…";
  inp.addEventListener("input", () => {
    onchange(inp.value);
    preview.innerHTML = '<i class="' + iconCls(inp.value) + '"></i>';
  });
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn small";
  btn.textContent = "Galeri";
  btn.addEventListener("click", () => openIconGallery((icon) => {
    onchange(icon);
    inp.value = icon;
    preview.innerHTML = '<i class="' + iconCls(icon) + '"></i>';
  }));
  holder.appendChild(preview);
  holder.appendChild(inp);
  holder.appendChild(btn);
  return holder;
}

/* ---------- Görsel alanı + dosya seçtirici galeri ---------- */

function renderImageField(f, value, onchange) {
  const holder = document.createElement("div");
  holder.className = "control img-control";
  const row = document.createElement("div");
  row.className = "img-pick-row";
  const inp = document.createElement("input");
  inp.type = "text";
  inp.value = value ?? "";
  inp.placeholder = f.placeholder || "assets/images/...";
  inp.addEventListener("input", () => onchange(inp.value));
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn small";
  btn.textContent = "🖼 Seç";
  btn.title = "assets/images klasöründen dosya seç — yolu sistem yazar";
  btn.addEventListener("click", () => openImageGallery((src) => {
    onchange(src);
    inp.value = src;
  }));
  row.appendChild(inp);
  row.appendChild(btn);
  holder.appendChild(row);
  if (f.hint) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = f.hint;
    holder.appendChild(h);
  }
  return holder;
}

async function openIconGallery(onPick) {
  if (!ICONS) {
    try {
      ICONS = (await api("/api/icons")).icons || [];
    } catch {
      ICONS = [];
    }
  }
  const grid = document.createElement("div");
  grid.className = "icon-grid";
  const render = (q) => {
    grid.innerHTML = "";
    const list = ICONS.filter((i) => !q || i.includes(q));
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "hint";
      empty.textContent = "Sonuç yok — serbest yazma alanını kullanın.";
      grid.appendChild(empty);
      return;
    }
    for (const icon of list) {
      const b = document.createElement("button");
      b.className = "icon-cell";
      const label = icon.replace(/^fa[srb]? /, "");
      b.innerHTML = '<i class="' + iconCls(icon) + '"></i><span>' + label + "</span>";
      b.addEventListener("click", () => { onPick(icon); closeModal(); });
      grid.appendChild(b);
    }
  };
  openModal(
    '<div class="modal-head"><h3>İkon Seç</h3><button id="iconClose" class="icon-btn">✕</button></div>' +
    '<input id="iconSearch" type="text" class="commit-msg modal-search" placeholder="İkon ara… (örn: envelope, phone)">' +
    '<div class="icon-grid-wrap"></div>'
  );
  const wrap = $("modalBox").querySelector(".icon-grid-wrap");
  wrap.appendChild(grid);
  render("");
  $("iconClose").addEventListener("click", closeModal);
  $("iconSearch").addEventListener("input", (e) => render(e.target.value.trim().toLowerCase()));
}

/* ---------- Diziler ---------- */

function move(arr, i, d) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return;
  const t = arr[i];
  arr[i] = arr[j];
  arr[j] = t;
}

function iconBtn(text, title, onClick) {
  const b = document.createElement("button");
  b.className = "icon-btn";
  b.textContent = text;
  b.title = title;
  b.addEventListener("click", onClick);
  return b;
}

function itemTitle(f, item) {
  if (!item || typeof item !== "object") return String(item ?? "");
  const val = (v) => {
    if (typeof v === "string" && v.trim()) return v;
    if (v && typeof v === "object" && "tr" in v && v.tr) return v.tr;
    return "";
  };
  // 1) Başlık benzeri alan öncelikli (title / başlık / name / isim)
  for (const sf of f.itemFields || []) {
    if (/title|başlık|name|isim|baslik/i.test(sf.key)) {
      const t = val(item[sf.key]);
      if (t) return t;
    }
  }
  // 2) İlk çoklu dil (lang) alanı
  for (const sf of f.itemFields || []) {
    if (sf.type === "lang") {
      if (!sf.key) {
        // lang öğeli dizi — öğenin kendisi {tr,en}
        const t = val(item);
        if (t) return t;
        break;
      }
      const t = val(item[sf.key]);
      if (t) return t;
    }
  }
  // 3) Bileşen tipi
  if (item.type) return item.type;
  // 4) Kısa metin alanı (tr/en gibi; id/url/logo benzeri atlanır)
  for (const sf of f.itemFields || []) {
    if (/^(id|url|link|logo|icon|image|img|anchor)$/i.test(sf.key)) continue;
    const v = item[sf.key];
    if (typeof v === "string" && v.trim() && v.trim().length <= 60) return v.trim();
  }
  return item.id || "Öğe";
}

function renderArray(f, arr, path) {
  const holder = document.createElement("div");
  holder.className = "array-widget";
  const list = document.createElement("div");
  list.className = "array-list";
  const renderAll = () => {
    list.innerHTML = "";
    arr.forEach((item, i) => list.appendChild(renderArrayItem(f, arr, i, renderAll, path)));
  };
  renderAll();
  holder.appendChild(list);
  const addBtn = document.createElement("button");
  addBtn.className = "btn small add-btn";
  addBtn.textContent = "+ " + (f.itemLabel || "Öğe Ekle");
  addBtn.addEventListener("click", () => {
    arr.push(defaultItem(f));
    renderAll();
    markDirty();
  });
  holder.appendChild(addBtn);
  return holder;
}

function renderArrayItem(f, arr, i, rerender, path) {
  const itemPath = path ? path + "[" + i + "]" : "";
  const card = document.createElement("div");
  card.className = "array-card";
  card.draggable = true;

  const head = document.createElement("div");
  head.className = "card-head";
  head.title = "Aç/kapat";
  const chev = document.createElement("span");
  chev.className = "card-chev";
  chev.textContent = "▸";
  const idx = document.createElement("span");
  idx.className = "card-index";
  idx.textContent = "#" + (i + 1);
  const title = document.createElement("span");
  title.className = "card-title";
  title.textContent = itemTitle(f, arr[i]);
  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.appendChild(iconBtn("↑", "Yukarı taşı", () => { move(arr, i, -1); rerender(); markDirty(); }));
  actions.appendChild(iconBtn("↓", "Aşağı taşı", () => { move(arr, i, 1); rerender(); markDirty(); }));
  actions.appendChild(iconBtn("✕", "Sil", () => { arr.splice(i, 1); rerender(); markDirty(); }));
  head.appendChild(chev);
  head.appendChild(idx);
  head.appendChild(title);
  head.appendChild(actions);
  for (const b of statusBadges(f, arr[i])) {
    const sp = document.createElement("span");
    sp.className = "badge " + b.cls;
    sp.textContent = b.text;
    head.insertBefore(sp, actions);
  }
  card.appendChild(head);

  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", String(i));
    e.dataTransfer.effectAllowed = "move";
    card.classList.add("dragging");
  });
  card.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    card.classList.add("drop-target");
  });
  card.addEventListener("dragleave", () => card.classList.remove("drop-target"));
  card.addEventListener("drop", (e) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    card.classList.remove("drop-target");
    if (!Number.isFinite(from) || from === i) return;
    const [item] = arr.splice(from, 1);
    arr.splice(i, 0, item);
    rerender();
    markDirty();
  });
  card.addEventListener("dragend", () => {
    document.querySelectorAll(".array-card").forEach((c) => c.classList.remove("dragging", "drop-target"));
  });

  const body = document.createElement("div");
  body.className = "card-body";
  // Çok öğeli dizilerde kartlar kapalı gelir (karışıklığı önler); başlığa tıklayınca açılır
  const startCollapsed = arr.length > 2;
  body.hidden = startCollapsed;
  if (startCollapsed) card.classList.add("collapsed");
  head.addEventListener("click", (e) => {
    if (e.target.closest(".card-actions")) return;
    body.hidden = !body.hidden;
    card.classList.toggle("collapsed", body.hidden);
  });

  if (f.type === "components") {
    const comp = arr[i];
    const types = Object.keys(f.components || {});
    const row = document.createElement("div");
    row.className = "component-type-row";
    const lab = document.createElement("span");
    lab.className = "field-label";
    lab.textContent = "Bileşen Tipi";
    const sel = document.createElement("select");
    sel.className = "component-type";
    for (const t of types) {
      const o = document.createElement("option");
      o.value = t;
      o.textContent = (f.components[t] && f.components[t].label) || t;
      sel.appendChild(o);
    }
    sel.value = comp.type || types[0] || "";
    sel.addEventListener("change", () => {
      comp.type = sel.value;
      comp.data = componentDefaults(f.components[sel.value]);
      rerender();
      markDirty();
    });
    row.appendChild(lab);
    row.appendChild(sel);
    body.appendChild(row);
    const compDef = f.components[comp.type];
    if (compDef && compDef.fields) renderFields(body, compDef.fields, comp.data, itemPath + ".data");
  } else if (f.itemType) {
    const inp = document.createElement("input");
    inp.type = f.itemType === "number" ? "number" : (f.itemType === "date" ? "date" : "text");
    inp.value = arr[i];
    inp.addEventListener("input", () => {
      arr[i] = f.itemType === "number" ? (inp.value === "" ? 0 : Number(inp.value)) : inp.value;
      markDirty();
    });
    body.appendChild(inp);
  } else if (f.itemFields && f.itemFields.length === 1 && f.itemFields[0].type === "lang") {
    // Lang öğeli dizi — öğe ya {tr,en} nesnesi ya da düz metin (örn. konu listeleri, tablo hücreleri)
    const langField = f.itemFields[0];
    const holder = document.createElement("div");
    holder.className = "lang-pair";
    const isStr = typeof arr[i] === "string";
    if (isStr) {
      // Düz metin öğe — tek alan, tip korunur (veri bozulmaz)
      const cell = document.createElement("div");
      cell.className = "lang-cell";
      const badge = document.createElement("span");
      badge.className = "lang-badge tr";
      badge.textContent = "TEXT";
      const inp = document.createElement("input");
      inp.type = "text";
      inp.value = arr[i];
      inp.addEventListener("input", () => {
        arr[i] = inp.value;
        markDirty();
      });
      cell.appendChild(badge);
      cell.appendChild(inp);
      holder.appendChild(cell);
    } else {
      let value = arr[i];
      if (!value || typeof value !== "object") value = arr[i] = { tr: "", en: "" };
      for (const lang of ["tr", "en"]) {
        const cell = document.createElement("div");
        cell.className = "lang-cell";
        const badge = document.createElement("span");
        badge.className = "lang-badge " + lang;
        badge.textContent = lang.toUpperCase();
        const ta = document.createElement("textarea");
        ta.rows = 1;
        ta.value = value[lang] ?? "";
        ta.placeholder = langField.placeholder || "";
        ta.addEventListener("input", () => {
          value[lang] = ta.value;
          ta.style.height = "auto";
          ta.style.height = ta.scrollHeight + "px";
          markDirty();
        });
        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";
        cell.appendChild(badge);
        cell.appendChild(ta);
        holder.appendChild(cell);
      }
    }
    body.appendChild(holder);
  } else if (Array.isArray(arr[i]) && f.itemFields) {
    // Dizi öğesi (örn. karşılaştırma tablosu satırı): itemFields sırayla hücrelerle eşleşir
    f.itemFields.forEach((sf, idx) => {
      const wrap = document.createElement("div");
      wrap.className = "field-group";
      const lab = document.createElement("span");
      lab.className = "field-label";
      lab.textContent = sf.label || ("Sütun " + (idx + 1));
      wrap.appendChild(lab);
      if (sf.type === "lang") {
        // tr/en ikili — hücreyi doğrudan mutasyona uğrat
        let val = arr[i][idx];
        if (!val || typeof val !== "object") val = arr[i][idx] = { tr: "", en: "" };
        const holder = document.createElement("div");
        holder.className = "lang-pair";
        for (const lang of ["tr", "en"]) {
          const cell = document.createElement("div");
          cell.className = "lang-cell";
          const badge = document.createElement("span");
          badge.className = "lang-badge " + lang;
          badge.textContent = lang.toUpperCase();
          const ta = document.createElement("textarea");
          ta.rows = 1;
          ta.value = val[lang] ?? "";
          ta.addEventListener("input", () => { val[lang] = ta.value; markDirty(); });
          cell.appendChild(badge);
          cell.appendChild(ta);
          holder.appendChild(cell);
        }
        wrap.appendChild(holder);
      } else {
        wrap.appendChild(renderScalar(sf, arr[i][idx], (v) => { arr[i][idx] = v; markDirty(); }));
      }
      body.appendChild(wrap);
    });
  } else if (f.itemFields) {
    const realFields = f.itemFields.filter((sf) => sf.type !== "transfer");
    const exFields = realFields.filter((sf) => sf.exclusive); // tek seçimli alanlar (örn. aktif)
    const normalFields = realFields.filter((sf) => !sf.exclusive);
    renderFields(body, normalFields, arr[i], itemPath);
    for (const xf of exFields) body.appendChild(renderExclusiveField(xf, arr, i, itemPath, f));
    const tsf = f.itemFields.find((sf) => sf.type === "transfer");
    if (tsf) body.appendChild(renderTransferButton(tsf, arr[i]));
  }

  card.appendChild(body);
  return card;
}

/** Kart durum rozetleri: süresi doldu / aktif / pasif (itemFields'taki date + boolean alanlardan). */
function statusBadges(f, item) {
  const badges = [];
  if (!item || typeof item !== "object") return badges;
  const fields = f.itemFields || [];
  const endF = fields.find((sf) => /^endDate$/i.test(sf.key));
  const activeF = fields.find((sf) => sf.key === "active" && sf.type === "boolean");
  if (endF && typeof item[endF.key] === "string" && item[endF.key]) {
    const end = new Date(item[endF.key] + "T23:59:59");
    if (!isNaN(end) && new Date() > end) {
      badges.push({ text: "⏰ Süresi doldu", cls: "badge-expired" });
    }
  }
  if (activeF) {
    badges.push({ text: item[activeF.key] ? "Aktif" : "Pasif", cls: item[activeF.key] ? "badge-active" : "badge-inactive" });
  }
  return badges;
}

/* ---------- Modal → duyuru aktarma ---------- */

const TRANSFER_CATEGORIES = [
  { value: "Genel Duyuru", color: "#1F4C8A" },
  { value: "Acil Duyuru", color: "#C03221" },
  { value: "Sistem Bildirimi", color: "#6c757d" },
  { value: "Tatil/Kapanış", color: "#fd7e14" },
  { value: "Etkinlik Duyurusu", color: "#198754" },
];

function renderExclusiveField(f, arr, i, path, arrayF) {
  // Tek seçimli alan: biri açılınca dizideki diğerleri otomatik kapanır (örn. modallarda "Aktif")
  const wrap = document.createElement("div");
  wrap.className = "field";
  if (path) wrap.dataset.path = path + "." + f.key;
  const label = document.createElement("label");
  label.className = "field-label";
  label.textContent = f.label || f.key;
  wrap.appendChild(label);
  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.checked = !!arr[i][f.key];
  const refreshBadges = () => {
    // Kart başlıklarındaki rozetleri kaydetmeden canlı güncelle (Aktif/Pasif/⏰ Süresi doldu).
    // Exclusive bir alan değişince TÜM kartların rozeti yenilenir — biri kapanırken diğeri
    // eski halde kalmamalı (örn. iki kart birden "Aktif" görünmemeli).
    if (!arrayF) return;
    const widget = wrap.closest(".array-widget");
    const cards = widget ? Array.from(widget.querySelectorAll(".array-card")) : [wrap.closest(".array-card")].filter(Boolean);
    cards.forEach((card) => {
      const head = card.querySelector(".card-head");
      const actions = head && head.querySelector(".card-actions");
      if (!head) return;
      // Bu kart hangi dizi öğesi? başlık sırasıyla eşleştir
      const idx = Array.from(cards).indexOf(card);
      const item = arr[idx] || arr[i];
      head.querySelectorAll(".badge").forEach((b) => b.remove());
      for (const b of statusBadges(arrayF, item)) {
        const sp = document.createElement("span");
        sp.className = "badge " + b.cls;
        sp.textContent = b.text;
        if (actions) head.insertBefore(sp, actions);
        else head.appendChild(sp);
      }
    });
  };
  cb.addEventListener("change", () => {
    arr.forEach((o, j) => { if (o[f.key] === true || j === i) o[f.key] = (j === i) && cb.checked; });
    markDirty();
    refreshBadges(); // kaydetmeden rozet anında güncellensin
  });
  const holder = document.createElement("div");
  holder.className = "control";
  holder.appendChild(cb);
  if (f.hint) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = f.hint;
    holder.appendChild(h);
  }
  wrap.appendChild(holder);
  return wrap;
}

function renderTransferButton(tsf, item) {
  const holder = document.createElement("div");
  holder.className = "control transfer-row";
  const btn = document.createElement("button");
  btn.className = "btn small transfer-btn";
  btn.textContent = "📤 Duyuruya Aktar";
  btn.title = "Bu modalı duyurular bölümüne taşı (modal pasifleşir, bağlantı kurulur)";
  btn.addEventListener("click", () => openTransferDialog(tsf, item));
  holder.appendChild(btn);
  if (tsf.hint) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = tsf.hint;
    holder.appendChild(h);
  }
  return holder;
}

function openTransferDialog(tsf, item) {
  const title = itemTitle({ itemFields: [{ key: "title", type: "lang" }, { key: "id", type: "text" }] }, item) || item.id || "Bu modal";
  const opts = TRANSFER_CATEGORIES.map(
    (c) => `<option value="${c.value}" data-color="${c.color}">${c.value}</option>`
  ).join("");
  openModal(`
    <div class="dialog">
      <h3>📤 Duyuruya Aktar</h3>
      <p class="dialog-note"><strong>${escapeHtml(title)}</strong> modalı duyurular bölümüne aktarılacak.</p>
      <p class="dialog-note">Aktarınca: duyuru listesine yeni kayıt eklenir, modal <strong>pasifleşir</strong> ve bağlantı kurulur (silinmez — geri dönüş kalır).</p>
      <label class="field-label">Duyuru Kategorisi</label>
      <select id="transferCategory">${opts}</select>
      <div class="dialog-actions">
        <button class="btn" id="transferCancel">Vazgeç</button>
        <button class="btn primary" id="transferConfirm">Aktar</button>
      </div>
    </div>
  `);
  const catSel = $("transferCategory");
  const colorOf = () => {
    const opt = catSel.selectedOptions[0];
    return (opt && opt.dataset.color) || "#1F4C8A";
  };
  $("transferCancel").addEventListener("click", closeModal);
  $("transferConfirm").addEventListener("click", async () => {
    const confirmBtn = $("transferConfirm");
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Aktarılıyor…";
    try {
      const res = await api("/api/modal/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modalId: item.id, category: catSel.value, categoryColor: colorOf() }),
      });
      closeModal();
      // Sunucudaki güncel veriyi al, formu ve ağacı yenile
      const tab = activeTab();
      if (tab) {
        try {
          const data = await api("/api/file?path=" + encodeURIComponent(tab.path));
          tab.data = data.content;
          tab.original = JSON.parse(JSON.stringify(data.content));
          tab.dirty = false;
          renderEditor();
          renderTabs();
        } catch (e) { /* form yenilenemezse ağaç yeter */ }
      }
      loadFiles();
      reloadPreview();
      showBanner(res.message || "Aktarıldı.", "success");
    } catch (e) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Aktar";
      showBanner((e.errors && e.errors.join("\n")) || "Aktarma başarısız.", "error");
    }
  });
}

function renderRaw(f, obj) {
  const holder = document.createElement("div");
  holder.className = "control";
  const ta = document.createElement("textarea");
  ta.className = "raw-json";
  ta.rows = 3;
  ta.spellcheck = false;
  ta.value = JSON.stringify(obj[f.key] ?? null, null, 2);
  ta.addEventListener("input", () => {
    try {
      obj[f.key] = JSON.parse(ta.value);
      ta.classList.remove("err");
    } catch {
      ta.classList.add("err");
    }
    markDirty();
  });
  holder.appendChild(ta);
  if (f.hint) {
    const h = document.createElement("div");
    h.className = "hint";
    h.textContent = f.hint;
    holder.appendChild(h);
  }
  return holder;
}

/* ---------- Canlı önizleme ---------- */

let pushTimer = null;

function pushPreview() {
  const tab = activeTab();
  if (!tab) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    let content;
    try {
      content = currentContent();
    } catch {
      return;
    }
    try {
      const res = await api("/api/preview/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: SID, path: tab.path, content }),
      });
      applyErrors(res.errors || []);
      if (!document.body.classList.contains("preview-hidden")) reloadPreview();
    } catch (e) {
      /* sessiz */
    }
  }, 300);
}

function reloadPreview() {
  const frame = $("previewFrame");
  const tab = activeTab();
  let y = 0;
  try {
    y = frame.contentWindow.scrollY || 0;
  } catch (e) { /* yoksay */ }
  const page = previewHtmlFor(tab && tab.path) || "manager/no-preview.html";
  const onLoad = () => {
    setTimeout(() => {
      try {
        frame.contentWindow.scrollTo(0, y);
      } catch (e) { /* yoksay */ }
    }, 60);
    ensurePreviewInjection();
  };
  frame.removeEventListener("load", onLoad);
  frame.addEventListener("load", onLoad);
  frame.src = "/" + page + "?t=" + Date.now();
}

let editMode = false;

function setEditMode(v) {
  editMode = v;
  $("editModeBtn").classList.toggle("active", v);
  $("editModeBtn").textContent = v ? "Düzenleme: Açık" : "Düzenleme: Kapalı";
  ensurePreviewInjection();
}

function ensurePreviewInjection() {
  const frame = $("previewFrame");
  let doc;
  try {
    doc = frame.contentDocument;
  } catch (e) {
    return;
  }
  if (!doc || !doc.head) return;
  if (!doc.getElementById("mgr-base-style")) {
    const st = doc.createElement("style");
    st.id = "mgr-base-style";
    st.textContent = ".mgr-highlight{outline:3px solid #ff9800 !important;outline-offset:2px;background:rgba(255,152,0,.18) !important;transition:outline .15s;}";
    doc.head.appendChild(st);
  }
  if (editMode && !doc.getElementById("mgr-pick-css")) {
    const st = doc.createElement("style");
    st.id = "mgr-pick-css";
    st.textContent = "body.mgr-editmode *{cursor:crosshair !important;} body.mgr-editmode :hover{outline:2px dashed #1a5fb4 !important;outline-offset:1px;}";
    doc.head.appendChild(st);
    doc.documentElement.classList.add("mgr-editmode");
    doc.addEventListener("click", (ev) => {
      const t = ev.target;
      const el = t && t.closest ? t.closest("h1,h2,h3,h4,h5,h6,p,li,td,strong,a,span,button,div") : null;
      if (!el) return;
      const txt = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (txt && txt.length > 1) locateFormField(txt);
    });
  } else if (!editMode) {
    const st = doc.getElementById("mgr-pick-css");
    if (st) st.remove();
    if (doc.documentElement) doc.documentElement.classList.remove("mgr-editmode");
  }
}

function findInPreview(texts) {
  const frame = $("previewFrame");
  let doc;
  try {
    doc = frame.contentDocument;
  } catch (e) {
    return;
  }
  if (!doc || !doc.body) return;
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const targets = texts.map(norm).filter(Boolean);
  if (!targets.length) return;
  let best = null;
  let bestScore = -1;
  const els = doc.body.querySelectorAll("*");
  for (const el of els) {
    const t = norm(el.textContent);
    for (const target of targets) {
      if (t === target && t.length > 0) {
        best = el;
        bestScore = 1e9;
        break;
      }
    }
    if (bestScore >= 1e9) break;
    if (t.length > 4) {
      for (const target of targets) {
        const idx = t.indexOf(target);
        if (idx >= 0 && target.length > bestScore) {
          best = el;
          bestScore = target.length;
        }
      }
    }
  }
  if (best) {
    ensurePreviewInjection();
    best.scrollIntoView({ behavior: "smooth", block: "center" });
    best.classList.add("mgr-highlight");
    setTimeout(() => best.classList.remove("mgr-highlight"), 2000);
  }
}

function locateFormField(text) {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const t = norm(text);
  if (!t) return;
  const inputs = document.querySelectorAll("#formArea input, #formArea textarea");
  let found = null;
  for (const inp of inputs) {
    if (norm(inp.value) === t) {
      found = inp;
      break;
    }
  }
  if (!found) {
    for (const inp of inputs) {
      if (norm(inp.value).includes(t) && t.length >= 5) {
        found = inp;
        break;
      }
    }
  }
  if (found) {
    found.scrollIntoView({ behavior: "smooth", block: "center" });
    found.focus();
    found.classList.add("mgr-flash");
    setTimeout(() => found.classList.remove("mgr-flash"), 1500);
  }
}

/* ---------- Inline doğrulama ---------- */

function clearFieldErrors() {
  document.querySelectorAll(".field.has-error, .field.has-valid").forEach((el) => {
    el.classList.remove("has-error", "has-valid");
    const err = el.querySelector(".field-error");
    if (err) err.remove();
  });
  $("errorCount").classList.add("hidden");
}

function applyErrors(errors) {
  clearFieldErrors();
  if (!errors || !errors.length) return;
  const count = $("errorCount");
  count.textContent = errors.length + " hata";
  count.classList.remove("hidden");
  for (const msg of errors) {
    const m = msg.match(/^(\$[^:]*):\s*([\s\S]*)$/);
    if (!m) continue;
    const path = m[1];
    const detail = m[2].trim();
    const el = matchFieldByPath(path);
    if (el) {
      el.classList.add("has-error");
      let err = el.querySelector(".field-error");
      if (!err) {
        err = document.createElement("div");
        err.className = "field-error";
        el.appendChild(err);
      }
      err.textContent = (err.textContent ? err.textContent + "\n" : "") + detail;
    }
  }
}

function matchFieldByPath(path) {
  // En uzun eşleşen alanı bul (bileşen içi hatalarda üst alana düşer)
  let p = path;
  while (p) {
    const el = document.querySelector('.field[data-path="' + CSS.escape(p) + '"]');
    if (el) return el;
    p = p.replace(/(\.[^.\[\]]+)?(\[\d+\])?$/, "");
  }
  return null;
}

/* ---------- Kaydet / Doğrula / Diff ---------- */

function currentContent() {
  const tab = activeTab();
  if (!tab) return null;
  if (tab.schema) return tab.data;
  return JSON.parse($("rawArea").value);
}

async function validate() {
  const tab = activeTab();
  if (!tab) return;
  let content;
  try {
    content = currentContent();
  } catch {
    showBanner("JSON geçersiz — ayrıştırılamıyor.");
    return;
  }
  try {
    const res = await api("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: tab.path, content }),
    });
    applyErrors(res.errors || []);
    if (res.ok) showBanner("Doğrulama başarılı ✓", "success");
    else showBanner("Doğrulama hataları:\n" + res.errors.join("\n"));
  } catch (e) {
    showBanner("Doğrulama yapılamadı: " + (e.error || ""));
  }
}

/* Kayıtta dokunulmamış boş varsayılanları temizle: şema render'ı sırasında eklenen
   boş nesne/dizi/lang alanları (örn. boş statusBadge) orijinalde yoksa disk'e yazılmaz. */
function isUntouchedDefault(f, value) {
  if (f.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const sfs = f.fields || [];
    for (const sf of sfs) {
      if (!(sf.key in value)) return false;
      if (!isUntouchedDefault(sf, value[sf.key])) return false;
    }
    const known = new Set(sfs.map((sf) => sf.key));
    return Object.keys(value).every((k) => known.has(k));
  }
  if (f.type === "array" || f.type === "components") return Array.isArray(value) && value.length === 0;
  if (f.type === "lang") return !!value && typeof value === "object" && value.tr === "" && value.en === "" && Object.keys(value).length === 2;
  return JSON.stringify(defaultFor(f)) === JSON.stringify(value);
}

function stripUntouchedDefaults(data, schema, original) {
  const clone = JSON.parse(JSON.stringify(data));
  const walk = (node, fields, orig) => {
    if (!fields || !node || typeof node !== "object") return;
    for (const f of fields) {
      const key = f.key;
      if (!key || !(key in node)) continue;
      const inOrig = orig && typeof orig === "object" && key in orig;
      if (!inOrig && isUntouchedDefault(f, node[key])) {
        delete node[key];
        continue;
      }
      const sub = node[key];
      if (f.type === "object" && sub && typeof sub === "object" && !Array.isArray(sub)) {
        walk(sub, f.fields, orig && typeof orig === "object" ? orig[key] : undefined);
      } else if (f.type === "array" && Array.isArray(sub) && f.itemFields) {
        const origArr = orig && Array.isArray(orig[key]) ? orig[key] : [];
        sub.forEach((item, i) => {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            walk(item, f.itemFields, origArr[i]);
          }
        });
      } else if (f.type === "components" && Array.isArray(sub)) {
        const comps = f.components || {};
        const origArr = orig && Array.isArray(orig[key]) ? orig[key] : [];
        sub.forEach((comp, i) => {
          const def = comps[comp && comp.type];
          if (comp && comp.data && def && def.fields) {
            walk(comp.data, def.fields, origArr[i] && origArr[i].data);
          }
        });
      }
    }
  };
  walk(clone, schema && schema.fields, original);
  return clone;
}

async function save() {
  const tab = activeTab();
  if (!tab) return;
  if (document.querySelectorAll(".raw-json.err").length) {
    showBanner("Ham JSON alanlarında ayrıştırma hataları var. Kırmızı alanları düzeltin.");
    return;
  }
  let content;
  try {
    content = stripUntouchedDefaults(currentContent(), tab.schema, tab.original);
  } catch {
    showBanner("JSON geçersiz — ayrıştırılamıyor.");
    return;
  }
  const message = $("commitMessage").value;
  try {
    const res = await api("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: tab.path, content, message, session: SID }),
    });
    tab.original = JSON.parse(JSON.stringify(content)); // temizlenmiş hali orijinal olarak sakla
    tab.dirty = false;
    $("commitMessage").value = "";
    $("previewBadge").classList.add("hidden");
    clearFieldErrors();
    renderTabs();
    renderTree();
    renderGit(res.git);
    refreshDiffBtn();
    showBanner(res.message || "Kaydedildi ✓", "success");
    reloadPreview();
  } catch (e) {
    const list = (e.errors || []).join("\n");
    applyErrors(e.errors || []);
    showBanner("Kaydedilemedi" + (list ? ":\n" + list : ": " + (e.error || "hata")));
  }
}

function refreshDiffBtn() {
  const btn = document.getElementById("diffBtn");
  if (!btn) return;
  btn.classList.toggle("hidden", !activeTab() || !activeTab().dirty);
}

function lockMetaBtn(tab) {
  const info = state.locks?.[tab.path];
  if (info && info.locked) {
    const reason = info.reason ? " (" + info.reason + ")" : "";
    return '<button id="unlockBtn" class="btn small warn" title="Bu dosya kilitli' + escapeHtml(reason) + ' — düzenlemek için kilidi açın">🔓 Kilidi Aç</button>';
  }
  return '<button id="lockBtn" class="btn small" title="Riskli dosya — diğer kullanıcılar yanlışlıkla bozmasın diye kilitler">🔒 Kilitle</button>';
}

async function toggleLock() {
  const tab = activeTab();
  if (!tab) return;
  const info = state.locks?.[tab.path];
  const willLock = !(info && info.locked);
  const reason = tab.schema ? tab.schema.label : tab.path.split("/").pop();
  if (willLock) {
    if (!confirm("Bu dosyayı kilitlemek istediğinize emin misiniz?\n\nKilitliyken hiçbir kayıt yapılamaz (sunucu engeller) ve ağaçta 🔒 rozeti görünür. Kilit data/global/_locks.json içinde tutulur, git ile ekiple paylaşılır.")) return;
  } else if (!confirm("Kilidi açıyorsunuz — dosya artık kaydedilebilir. Devam edilsin mi?")) return;
  try {
    await api("/api/locks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: tab.path, locked: willLock, reason: willLock ? reason + " — riskli dosya" : "" }),
    });
    if (willLock) state.locks[tab.path] = { locked: true, reason: reason + " — riskli dosya" };
    else delete state.locks[tab.path];
    renderEditor();
    await loadFiles();  // ağaçtaki 🔒 rozetini sunucudan tazele
    showBanner(willLock ? "Dosya kilitlendi 🔒" : "Kilit açıldı 🔓", "success");
  } catch (e) {
    showBanner("Kilit işlemi başarısız: " + ((e.errors || []).join(" ") || e.error || "hata"));
  }
}

function parseDiffSummary(diff) {
  // git diff'ten insan okur satır değişikliği listesi çıkar
  const rows = [];
  if (!diff) return rows;
  const lines = diff.split("\n");
  let cur = null;
  for (const line of lines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      if (cur && cur.old !== null && !cur.done) {
        cur.new = line.slice(1);
        cur.done = true;
        rows.push(cur);
        cur = null;
      } else {
        cur = { old: null, new: line.slice(1), done: true };
        rows.push(cur);
        cur = null;
      }
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      cur = { old: line.slice(1), new: null, done: false };
    } else {
      if (cur && cur.old !== null && !cur.done) {
        cur.done = true;
        rows.push(cur);
        cur = null;
      }
    }
  }
  if (cur && cur.old !== null && !cur.done) rows.push(cur);
  return rows;
}

async function openDiffModal() {
  const tab = activeTab();
  if (!tab) return;
  try {
    const res = await api("/api/diff?path=" + encodeURIComponent(tab.path));
    const rows = parseDiffSummary(res.diff || "");
    const html = rows.map((r) => {
      if (r.old !== null && r.new !== null) {
        return '<li><span class="diff-del">− ' + escapeHtml(r.old) + "</span> → <span class=\"diff-add\">+ " + escapeHtml(r.new) + "</span></li>";
      }
      if (r.old !== null) return '<li><span class="diff-del">− ' + escapeHtml(r.old) + "</span></li>";
      return '<li><span class="diff-add">+ ' + escapeHtml(r.new) + "</span></li>";
    }).join("");
    openModal(
      '<div class="modal-head"><h3>Değişiklik Özeti — ' + escapeHtml(tab.path) + '</h3><button id="diffClose" class="icon-btn">✕</button></div>' +
      '<div class="modal-body">' +
      (rows.length
        ? '<p class="muted">Kaydedilmemiş değişiklikler (' + rows.length + " satır):</p><ul class=\"diff-summary\">" + html + "</ul>"
        : '<p class="muted">Kaydedilmemiş değişiklik yok.</p>') +
      "</div>" +
      '<div class="modal-actions"><button id="diffSave" class="btn primary">Kaydet ve Commit Et</button></div>'
    );
    $("diffClose").addEventListener("click", closeModal);
    const saveBtn = document.getElementById("diffSave");
    if (saveBtn) saveBtn.addEventListener("click", () => { closeModal(); save(); });
  } catch (e) {
    showBanner("Değişiklik özeti alınamadı: " + (e.error || ""));
  }
}

/* ---------- Senkronize / Yayımla / Geçmiş ---------- */

async function doSync() {
  try {
    const res = await api("/api/git/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.ok) showBanner(res.message || "Senkronize edildi ✓", "success");
    else showBanner(res.message || res.error || "Senkronizasyon yapılamadı.");
    if (res.git) renderGit(res.git);
    await loadFiles();
  } catch (e) {
    showBanner("Senkronizasyon hatası: " + (e.error || ""));
  }
}

async function openPublishModal() {
  try {
    const res = await api("/api/publish/info");
    openModal(
      '<div class="modal-head"><h3>Yayımla</h3><button id="pubClose" class="icon-btn">✕</button></div>' +
      '<div class="modal-body" id="pubBody"><p class="muted">Yükleniyor…</p></div>'
    );
    $("pubClose").addEventListener("click", closeModal);
    const body = $("pubBody");
    const list = res.files.map((f) =>
      '<label class="pub-row"><input type="checkbox" value="' + f.path + '" checked>' +
      '<span>' + f.path + '</span>' + (f.dirty ? ' <em class="pub-dirty">değişti</em>' : "") + "</label>"
    ).join("");
    body.innerHTML =
      '<p class="muted">Yayımlanacak dosyaları seçin. SFTP tanımlı değilse ZIP indirerek FTP akışını koruyabilirsiniz.</p>' +
      '<div class="pub-list">' + list + "</div>" +
      '<div class="modal-actions">' +
      '<button id="pubZip" class="btn">ZIP İndir</button>' +
      '<button id="pubSftp" class="btn primary"' + (res.sftpConfigured ? "" : " disabled title='manager/config.json içinde SFTP tanımlayın'") + '>SFTP ile Yayımla</button>' +
      "</div>";
    $("pubZip").addEventListener("click", () => {
      window.location.href = "/api/export";
    });
    if (res.sftpConfigured) {
      $("pubSftp").addEventListener("click", async () => {
        const paths = Array.from(body.querySelectorAll(".pub-row input:checked")).map((c) => c.value);
        const r = await api("/api/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paths }),
        });
        showBanner(r.message || (r.ok ? "Yayımlandı ✓" : "Yayımlanamadı"), r.ok ? "success" : "");
      });
    }
  } catch (e) {
    showBanner("Yayımlama bilgisi alınamadı: " + (e.error || ""));
  }
}

async function openHistoryModal() {
  const tab = activeTab();
  if (!tab) return;
  try {
    const res = await api("/api/history?path=" + encodeURIComponent(tab.path));
    const commits = res.commits || [];
    if (!commits.length) {
      openModal('<div class="modal-head"><h3>Geçmiş</h3><button id="histClose" class="icon-btn">✕</button></div><div class="modal-body"><p class="muted">Henüz commit yok.</p></div>');
      const c = document.getElementById("histClose");
      if (c) c.addEventListener("click", closeModal);
      return;
    }
    const list = commits.map((c, i) =>
      '<div class="history-item' + (i === 0 ? " current" : "") + '">' +
      '<span class="h-date">' + c.date + "</span>" +
      '<span class="h-msg">' + escapeHtml(c.message) + "</span>" +
      '<span class="h-hash">' + c.short + "</span>" +
      '<button class="btn small" data-hash="' + c.hash + '">Fark</button>' +
      "</div>"
    ).join("");
    openModal(
      '<div class="modal-head"><h3>Geçmiş — ' + escapeHtml(tab.path) + '</h3><button id="histClose" class="icon-btn">✕</button></div>' +
      '<div class="modal-body">' +
      '<div class="history-list">' + list + "</div>" +
      '<pre id="histDiff" class="history-diff hidden"></pre>' +
      '<div class="modal-actions"><button id="histRestore" class="btn primary" disabled>Bu Sürüme Dön</button></div>' +
      "</div>"
    );
    const c = document.getElementById("histClose");
    if (c) c.addEventListener("click", closeModal);
    const diffEl = document.getElementById("histDiff");
    const restoreBtn = document.getElementById("histRestore");
    let selected = null;
    document.querySelectorAll(".history-item button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        selected = btn.dataset.hash;
        restoreBtn.disabled = false;
        try {
          const r = await api("/api/history/diff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: tab.path, from: selected, to: "HEAD" }),
          });
          diffEl.classList.remove("hidden");
          diffEl.textContent = r.diff || "(bu sürümle HEAD arasında fark yok)";
        } catch (e) {
          diffEl.classList.remove("hidden");
          diffEl.textContent = "Fark alınamadı: " + (e.error || "");
        }
      });
    });
    restoreBtn.addEventListener("click", async () => {
      if (!selected) return;
      if (!confirm("Bu sürüme geri dönülecek ve yeni bir commit atılacak. Devam edilsin mi?")) return;
      try {
        const r = await api("/api/history/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: tab.path, commit: selected }),
        });
        if (r.ok) {
          showBanner("Sürüm geri alındı: " + r.message, "success");
          closeModal();
          await selectFile(tab.path);
        } else {
          showBanner("Geri alınamadı:\n" + (r.errors || []).join("\n"));
        }
      } catch (e) {
        showBanner("Geri alınamadı: " + (e.error || ""));
      }
    });
  } catch (e) {
    showBanner("Geçmiş alınamadı: " + (e.error || ""));
  }
}

/* ---------- Başlatma ---------- */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setPreviewLang(previewLang());
  loadFiles();
  if (localStorage.getItem("mgr_sidebar") === "1") document.body.classList.add("sidebar-hidden");

  $("saveBtn").addEventListener("click", save);
  $("validateBtn").addEventListener("click", validate);
  $("errorCount").addEventListener("click", () => {
    const errs = Array.from(document.querySelectorAll(".field-error")).map((e) => e.textContent);
    if (errs.length) showBanner(errs.join("\n"));
  });
  $("sidebarToggle").addEventListener("click", () => {
    setSidebar(!document.body.classList.contains("sidebar-hidden"));
  });
  $("previewToggle").addEventListener("click", togglePreview);
  $("themeToggle").addEventListener("click", toggleTheme);
  $("paletteBtn").addEventListener("click", () => openPalette(""));
  $("fileSearch").addEventListener("input", onSearch);
  $("rawArea").addEventListener("input", markDirty);
  $("commitMessage").addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
  });
  $("syncBtn").addEventListener("click", doSync);
  $("publishBtn").addEventListener("click", openPublishModal);
  $("editModeBtn").addEventListener("click", () => setEditMode(!editMode));
  $("langTr").addEventListener("click", () => setPreviewLang("tr"));
  $("langEn").addEventListener("click", () => setPreviewLang("en"));

  document.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const k = e.key.toLowerCase();
    if (mod && k === "s") { e.preventDefault(); save(); }
    else if (mod && k === "k") { e.preventDefault(); openPalette(""); }
    else if (mod && k === "f") { e.preventDefault(); openPalette("field:"); }
    else if (mod && k === "b") { e.preventDefault(); togglePreview(); }
    else if (mod && e.shiftKey && k === "d") { e.preventDefault(); toggleTheme(); }
    else if (mod && k === "w" && !$("paletteOverlay").classList.contains("hidden")) {
      e.preventDefault();
      closePalette();
    } else if (mod && k === "w" && state.activeIdx >= 0) {
      e.preventDefault();
      closeTab(state.activeIdx);
    } else if (mod && k >= "1" && k <= "9" && state.tabs.length) {
      const idx = Number(k) - 1;
      if (idx < state.tabs.length) { e.preventDefault(); switchTab(idx); }
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (activeTab() && activeTab().dirty) e.preventDefault();
  });

  // Editor başlığındaki dinamik butonlar
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "historyBtn") openHistoryModal();
    if (e.target && e.target.id === "diffBtn") openDiffModal();
    if (e.target && e.target.id === "rawToggleBtn") {
      const tab = activeTab();
      if (tab) {
        tab.rawMode = !tab.rawMode;
        renderEditor();
      }
    }
    if (e.target && (e.target.id === "lockBtn" || e.target.id === "unlockBtn")) toggleLock();
  });
});
