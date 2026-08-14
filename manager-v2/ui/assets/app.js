/* Kütüphane İçerik Yönetimi v2 — arayüz mantığı */
"use strict";

/* ---------- Durum ---------- */

const state = {
  files: null,
  dirtyPaths: [],
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
      item.title = (f.hasSchema ? "Şema tabanlı editör" : "Ham JSON editörü") + (f.dirty ? " — kaydedilmemiş değişiklik" : "");
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
  ].join("");

  if (tab.schema && !tab.rawMode) {
    rawArea.classList.add("hidden");
    formArea.classList.remove("hidden");
    formArea.innerHTML = "";
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
    case "components": return [];
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
  const item = {};
  if (f.itemFields) for (const sf of f.itemFields) item[sf.key] = defaultFor(sf);
  return item;
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
}

function renderField(f, obj, path) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  if (path) wrap.dataset.path = path;
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

function renderScalar(f, value, onchange) {
  if (f.type === "icon") return renderIconField(f, value, onchange);
  const holder = document.createElement("div");
  holder.className = "control";
  let ctl;
  switch (f.type) {
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
      const inp = document.createElement("input");
      inp.type = "color";
      inp.value = value || "#000000";
      inp.addEventListener("input", () => onchange(inp.value));
      ctl = inp;
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
  head.appendChild(idx);
  head.appendChild(title);
  head.appendChild(actions);
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
    inp.type = f.itemType === "number" ? "number" : "text";
    inp.value = arr[i];
    inp.addEventListener("input", () => {
      arr[i] = f.itemType === "number" ? (inp.value === "" ? 0 : Number(inp.value)) : inp.value;
      markDirty();
    });
    body.appendChild(inp);
  } else if (f.itemFields) {
    renderFields(body, f.itemFields, arr[i], itemPath);
  }

  card.appendChild(body);
  return card;
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

async function save() {
  const tab = activeTab();
  if (!tab) return;
  if (document.querySelectorAll(".raw-json.err").length) {
    showBanner("Ham JSON alanlarında ayrıştırma hataları var. Kırmızı alanları düzeltin.");
    return;
  }
  let content;
  try {
    content = currentContent();
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
  });
});
