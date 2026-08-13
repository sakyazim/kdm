/* Kütüphane İçerik Yönetimi — arayüz mantığı */
"use strict";

const state = {
  files: null,
  path: null,
  schema: null,
  data: null,
  dirty: false,
};

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
  const t = $("editorTitle");
  if (!t.textContent.endsWith(" •")) t.textContent += " •";
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
    const head = document.createElement("div");
    head.className = "tree-cat-head";
    head.textContent = cat.label;
    sec.appendChild(head);
    const list = document.createElement("div");
    list.className = "tree-cat-files";
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
    sec.appendChild(list);
    tree.appendChild(sec);
  }
}

function onSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll(".tree-file").forEach((el) => {
    el.style.display = el.dataset.name.toLowerCase().includes(q) ? "" : "none";
  });
}

/* ---------- Dosya seçme / editör ---------- */

function previewHtmlFor(path) {
  if (!path) return null;
  const m = path.match(/^data\/pages\/(.+)\.json$/);
  return m ? m[1] + ".html" : null;
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
    updatePreview();
  } catch (e) {
    showBanner("Dosya yüklenemedi: " + (e.error || ""));
  }
}

function renderEditor() {
  showBanner("", "success");
  $("errorBanner").classList.add("hidden");
  const title = $("editorTitle");
  const desc = $("editorDesc");
  const meta = $("editorMeta");
  const formArea = $("formArea");
  const rawArea = $("rawArea");

  if (!state.path) {
    title.textContent = "Dosya seçin";
    desc.textContent = "Soldaki listeden bir JSON dosyası seçin.";
    formArea.innerHTML = "";
    rawArea.classList.add("hidden");
    meta.innerHTML = "";
    $("saveBtn").disabled = true;
    $("validateBtn").disabled = true;
    return;
  }

  title.textContent = state.schema ? state.schema.label : state.path.split("/").pop();
  desc.textContent = state.path + (state.schema ? " — şema tabanlı düzenleme" : " — ham JSON düzenleme (şema henüz tanımlı değil)");
  $("saveBtn").disabled = false;
  $("validateBtn").disabled = false;

  const page = previewHtmlFor(state.path);
  meta.innerHTML = page
    ? '<a href="/' + page + '" target="_blank" rel="noopener" class="btn small">Sayfayı Aç ↗</a>'
    : "";

  if (state.schema) {
    rawArea.classList.add("hidden");
    formArea.classList.remove("hidden");
    formArea.innerHTML = "";
    renderFields(formArea, state.schema.fields, state.data);
  } else {
    formArea.classList.add("hidden");
    rawArea.classList.remove("hidden");
    rawArea.value = JSON.stringify(state.data, null, 2);
  }
}

function updatePreview() {
  const page = previewHtmlFor(state.path) || "index.html";
  $("previewFrame").src = "/" + page + "?t=" + Date.now();
  $("openSiteLink").href = "/" + page;
}

function togglePreview() {
  document.body.classList.toggle("preview-hidden");
  $("previewToggle").textContent = document.body.classList.contains("preview-hidden") ? "Göster" : "Gizle";
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
  if (!fields || typeof obj !== "object") return;
  for (const f of fields) {
    if (!(f.key in obj)) obj[f.key] = defaultFor(f);
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
      const box = document.createElement("div");
      box.className = "object-box";
      if (f.description) box.title = f.description;
      if (f.fields) renderFields(box, f.fields, obj[f.key]);
      wrap.appendChild(box);
      break;
    }
    case "lang":
      wrap.appendChild(renderLang(f, obj[f.key]));
      break;
    case "array":
    case "components":
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
    default:
      wrap.appendChild(renderScalar(f, obj[f.key], (v) => { obj[f.key] = v; markDirty(); }));
  }
  return wrap;
}

function renderScalar(f, value, onchange) {
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

function renderLang(f, value) {
  if (!value || typeof value !== "object") value = { tr: "", en: "" };
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
  for (const sf of f.itemFields || []) {
    if (sf.type === "lang" && item[sf.key] && item[sf.key].tr) return item[sf.key].tr;
  }
  if (item.type) return item.type;
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
      body: JSON.stringify({ path: state.path, content, message }),
    });
    state.dirty = false;
    $("commitMessage").value = "";
    renderGit(res.git);
    showBanner(res.message || "Kaydedildi ✓", "success");
    updatePreview();
  } catch (e) {
    const list = (e.errors || []).join("\n");
    showBanner("Kaydedilemedi" + (list ? ":\n" + list : ": " + (e.error || "hata")));
  }
}

/* ---------- Başlatma ---------- */

document.addEventListener("DOMContentLoaded", () => {
  loadFiles();
  $("saveBtn").addEventListener("click", save);
  $("validateBtn").addEventListener("click", validate);
  $("previewToggle").addEventListener("click", togglePreview);
  $("fileSearch").addEventListener("input", onSearch);
  $("commitMessage").addEventListener("keydown", (e) => {
    if (e.key === "Enter") save();
  });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      save();
    }
  });
  window.addEventListener("beforeunload", (e) => {
    if (state.dirty) e.preventDefault();
  });
});
