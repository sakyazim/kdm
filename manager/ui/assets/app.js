/* Kütüphane İçerik Yönetimi — arayüz mantığı */
"use strict";

const state = {
  files: null,
  path: null,
  schema: null,
  data: null,
  dirty: false,
};

const SID = (document.cookie.match(/(?:^|; )preview_session=([^;]+)/) || [])[1] || "anon";
const $ = (id) => document.getElementById(id);

async function api(url, opts) {
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
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
  if (!state.path) return;
  state.dirty = true;
  $("previewBadge").classList.remove("hidden");
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
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

/* ---------- Dosya listesi ---------- */

async function loadFiles() {
  try {
    const res = await api("/api/files");
    state.files = res.categories;
    renderTree();
    renderGit(res.git);
  } catch (e) {
    showBanner("Dosya listesi yüklenemedi: " + (e.error || "bilinmeyen hata"));
  }
}

function renderTree() {
  const tree = $("fileTree");
  tree.innerHTML = "";
  for (const cat of state.files) {
    const sec = document.createElement("div");
    sec.className = "tree-cat";
    const head = document.createElement("button");
    head.className = "tree-cat-head";
    const chev = document.createElement("span");
    chev.className = "chev";
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
      item.className = "tree-file" + (f.path === state.path ? " active" : "");
      item.dataset.name = f.name;
      item.innerHTML = '<span class="dot ' + (f.hasSchema ? "schema" : "raw") + '"></span>';
      item.appendChild(document.createTextNode(f.name));
      item.title = f.hasSchema ? "Şema tabanlı editör" : "Ham JSON editörü";
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
  if (state.dirty && !confirm("Kaydedilmemiş değişiklikler var. Yine de geçilsin mi?")) return;
  try {
    const res = await api("/api/file?path=" + encodeURIComponent(path));
    state.path = path;
    state.schema = res.schema || null;
    state.data = res.content;
    state.dirty = false;
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

  if (!state.path) {
    title.textContent = "Dosya seçin";
    desc.textContent = "Soldaki listeden bir JSON dosyası seçin.";
    formArea.innerHTML = "";
    rawArea.classList.add("hidden");
    tocBar.classList.add("hidden");
    meta.innerHTML = "";
    $("saveBtn").disabled = true;
    $("validateBtn").disabled = true;
    return;
  }

  title.textContent = state.schema ? state.schema.label : state.path.split("/").pop();
  let mode = "— ham JSON düzenleme";
  if (state.schema) mode = state.schema.dynamic ? "— otomatik şema (elle şema yazılınca iyileşir)" : "— şema tabanlı düzenleme";
  desc.textContent = state.path + " " + mode;
  $("saveBtn").disabled = false;
  $("validateBtn").disabled = false;

  const page = previewHtmlFor(state.path);
  meta.innerHTML = [
    '<button id="rawToggleBtn" class="btn small" title="Form / ham JSON görünümü arasında geçiş">' + (state.rawMode ? "Form Görünümü" : "Ham JSON") + "</button>",
    '<button id="historyBtn" class="btn small" title="Bu dosyanın sürüm geçmişi">Geçmiş</button>',
    page ? '<a href="/' + page + '" target="_blank" rel="noopener" class="btn small">Sayfayı Aç ↗</a>' : "",
  ].join("");

  if (state.schema && !state.rawMode) {
    rawArea.classList.add("hidden");
    formArea.classList.remove("hidden");
    formArea.innerHTML = "";
    const fields = state.schema.fields || [];
    const startCollapsed = defaultSectionsCollapsed(fields.length);
    const secs = fields.map((f) => renderSection(f, state.data, startCollapsed));
    secs.forEach((s) => formArea.appendChild(s));
    renderToc(secs, fields);
  } else {
    formArea.classList.add("hidden");
    rawArea.classList.remove("hidden");
    tocBar.classList.add("hidden");
    rawArea.value = JSON.stringify(state.data, null, 2);
  }
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

function renderSection(f, obj, startCollapsed) {
  const sec = document.createElement("div");
  sec.className = "form-section" + (startCollapsed ? " collapsed" : "");
  const head = document.createElement("button");
  head.className = "form-section-head" + (startCollapsed ? "" : " open");
  const chev = document.createElement("span");
  chev.className = "chev";
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
  body.appendChild(renderField(f, obj));
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
    chip.textContent = (f.label || f.key) + " (" + sectionCount(f, state.data) + ")";
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
    case "day-multiselect": return [];
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

function renderFields(container, fields, obj) {
  ensureDefaults(fields, obj);
  for (const f of fields) container.appendChild(renderField(f, obj));
}

function renderField(f, obj) {
  const wrap = document.createElement("div");
  wrap.className = "field";
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
      if (f.fields) renderFields(box, f.fields, obj[f.key]);
      wrap.appendChild(box);
      break;
    }
    case "lang":
      wrap.appendChild(renderLang(f, obj));
      break;
    case "array":
    case "components":
      if (!Array.isArray(obj[f.key])) obj[f.key] = [];
      wrap.appendChild(renderArray(f, obj[f.key]));
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

function renderArray(f, arr) {
  const holder = document.createElement("div");
  holder.className = "array-widget";
  const list = document.createElement("div");
  list.className = "array-list";
  const renderAll = () => {
    list.innerHTML = "";
    arr.forEach((item, i) => list.appendChild(renderArrayItem(f, arr, i, renderAll)));
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

function renderArrayItem(f, arr, i, rerender) {
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
    if (compDef && compDef.fields) renderFields(body, compDef.fields, comp.data);
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
    renderFields(body, f.itemFields, arr[i]);
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
  if (!state.path) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    let content;
    try {
      content = currentContent();
    } catch {
      return;
    }
    try {
      await api("/api/preview/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: SID, path: state.path, content }),
      });
      if (!document.body.classList.contains("preview-hidden")) reloadPreview();
    } catch (e) {
      /* sessiz */
    }
  }, 300);
}

function reloadPreview() {
  const frame = $("previewFrame");
  let y = 0;
  try {
    y = frame.contentWindow.scrollY || 0;
  } catch (e) { /* yoksay */ }
  const page = previewHtmlFor(state.path) || "index.html";
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

/* ---------- Kaydet / Doğrula ---------- */

function currentContent() {
  if (state.schema) return state.data;
  return JSON.parse($("rawArea").value);
}

async function validate() {
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
      body: JSON.stringify({ path: state.path, content }),
    });
    if (res.ok) showBanner("Doğrulama başarılı ✓", "success");
    else showBanner("Doğrulama hataları:\n" + res.errors.join("\n"));
  } catch (e) {
    showBanner("Doğrulama yapılamadı: " + (e.error || ""));
  }
}

async function save() {
  if (!state.path) return;
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
      body: JSON.stringify({ path: state.path, content, message, session: SID }),
    });
    state.dirty = false;
    $("commitMessage").value = "";
    $("previewBadge").classList.add("hidden");
    renderGit(res.git);
    showBanner(res.message || "Kaydedildi ✓", "success");
    reloadPreview();
  } catch (e) {
    const list = (e.errors || []).join("\n");
    showBanner("Kaydedilemedi" + (list ? ":\n" + list : ": " + (e.error || "hata")));
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

/* ---------- Başlatma ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
  if (localStorage.getItem("mgr_sidebar") === "1") document.body.classList.add("sidebar-hidden");

  $("saveBtn").addEventListener("click", save);
  $("validateBtn").addEventListener("click", validate);
  $("sidebarToggle").addEventListener("click", () => {
    setSidebar(!document.body.classList.contains("sidebar-hidden"));
  });
  $("previewToggle").addEventListener("click", () => {
    const isHidden = document.body.classList.toggle("preview-hidden");
    $("previewToggle").textContent = isHidden ? "Önizleme: Göster" : "Önizleme: Gizle";
    if (!isHidden) reloadPreview();
  });
  $("fileSearch").addEventListener("input", onSearch);
  $("rawArea").addEventListener("input", markDirty);
  $("commitMessage").addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
  });
  $("syncBtn").addEventListener("click", doSync);
  $("publishBtn").addEventListener("click", openPublishModal);
  $("editModeBtn").addEventListener("click", () => setEditMode(!editMode));
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      save();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) e.preventDefault();
  });

  // Editor başlığındaki dinamik butonlar
  document.addEventListener("click", (e) => {
    if (e.target && e.target.id === "historyBtn") openHistoryModal();
    if (e.target && e.target.id === "rawToggleBtn") {
      state.rawMode = !state.rawMode;
      renderEditor();
    }
  });
});

/* ---------- Geçmiş modalı ---------- */

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

async function openHistoryModal() {
  if (!state.path) return;
  try {
    const res = await api("/api/history?path=" + encodeURIComponent(state.path));
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
      '<div class="modal-head"><h3>Geçmiş — ' + escapeHtml(state.path) + '</h3><button id="histClose" class="icon-btn">✕</button></div>' +
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
            body: JSON.stringify({ path: state.path, from: selected, to: "HEAD" }),
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
          body: JSON.stringify({ path: state.path, commit: selected }),
        });
        if (r.ok) {
          showBanner("Sürüm geri alındı: " + r.message, "success");
          closeModal();
          await selectFile(state.path);
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
