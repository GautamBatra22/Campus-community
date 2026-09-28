/* ================================================
   labels.js — Campus Community Labels System
   Stores labels in localStorage (backend sync later)
   Include this on every page after main.js
   ================================================ */

/* ---- Label Colors ---- */
const LABEL_COLORS = [
  '#00d4ff', '#a855f7', '#22c55e', '#f97316',
  '#ec4899', '#eab308', '#3b82f6', '#ef4444'
];

/* ---- LabelsManager ---- */
const LabelsManager = {
  _key: 'campus_labels',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this._key) || '[]'); }
    catch { return []; }
  },

  save(labels) {
    localStorage.setItem(this._key, JSON.stringify(labels));
  },

  create(name, color) {
    const labels = this.getAll();
    const existing = labels.find(l => l.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const label = {
      id: 'lbl_' + Date.now(),
      name: name.trim(),
      color: color || LABEL_COLORS[labels.length % LABEL_COLORS.length],
      items: []
    };
    labels.push(label);
    this.save(labels);
    renderSidebarLabels();
    return label;
  },

  delete(id) {
    const labels = this.getAll().filter(l => l.id !== id);
    this.save(labels);
    renderSidebarLabels();
  },

  rename(id, newName) {
    const labels = this.getAll();
    const label = labels.find(l => l.id === id);
    if (label) { label.name = newName.trim(); this.save(labels); renderSidebarLabels(); }
  },

  addItem(labelId, item) {
    // item = { type: 'announcement'|'event'|'resource', itemId: string, title: string }
    const labels = this.getAll();
    const label  = labels.find(l => l.id === labelId);
    if (!label) return;
    const already = label.items.find(i => i.type === item.type && i.itemId === item.itemId);
    if (!already) label.items.push(item);
    this.save(labels);
  },

  removeItem(labelId, type, itemId) {
    const labels = this.getAll();
    const label  = labels.find(l => l.id === labelId);
    if (!label) return;
    label.items = label.items.filter(i => !(i.type === type && i.itemId === itemId));
    this.save(labels);
  },

  isInLabel(labelId, type, itemId) {
    const label = this.getAll().find(l => l.id === labelId);
    return label ? label.items.some(i => i.type === type && i.itemId === itemId) : false;
  },

  getLabelsForItem(type, itemId) {
    return this.getAll().filter(l => l.items.some(i => i.type === type && i.itemId === itemId));
  }
};

/* ---- Render Sidebar Labels ---- */
function renderSidebarLabels() {
  const container = document.getElementById('sidebarLabels');
  if (!container) return;

  const labels = LabelsManager.getAll();
  container.innerHTML = '';

  labels.forEach(label => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a href="labels.html?id=${label.id}" style="display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:6px;color:var(--text-secondary);text-decoration:none;font-size:13px;font-weight:500;white-space:nowrap;transition:all 0.25s;">
        <span style="width:9px;height:9px;border-radius:50%;background:${label.color};flex-shrink:0;display:inline-block;"></span>
        <span class="nav-label">${label.name}</span>
        <span class="nav-label" style="margin-left:auto;font-size:11px;color:var(--text-muted);">${label.items.length}</span>
      </a>`;
    li.querySelector('a').addEventListener('mouseenter', function(){ this.style.background='var(--cyan-dim)'; this.style.color='var(--text-primary)'; });
    li.querySelector('a').addEventListener('mouseleave', function(){ this.style.background=''; this.style.color='var(--text-secondary)'; });
    container.appendChild(li);
  });

  // "Manage Labels" link always at bottom
  const li = document.createElement('li');
  li.innerHTML = `
    <a href="labels.html" style="display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:6px;color:var(--text-muted);text-decoration:none;font-size:12px;white-space:nowrap;transition:all 0.25s;">
      <span class="nav-icon" style="font-size:14px;">🏷️</span>
      <span class="nav-label">Manage Labels</span>
    </a>`;
  container.appendChild(li);
}

/* ================================================
   LABEL POPUP
   ================================================ */
let _popupTarget = null; // { type, itemId, title }

function openLabelPopup(btnEl, type, itemId, title) {
  _popupTarget = { type, itemId, title };
  const popup  = document.getElementById('labelPopup');
  if (!popup) return;

  renderPopupContent();
  popup.style.display = 'block';

  // Position near button
  const rect = btnEl.getBoundingClientRect();
  let top  = rect.bottom + 8;
  let left = rect.left;
  if (left + 255 > window.innerWidth) left = rect.right - 255;
  if (top + 340 > window.innerHeight) top = rect.top - 340;
  popup.style.top  = top  + 'px';
  popup.style.left = left + 'px';

  // Update btn appearance
  const labeled = LabelsManager.getLabelsForItem(type, itemId).length > 0;
  btnEl.classList.toggle('has-label', labeled);
}

function renderPopupContent() {
  const popup  = document.getElementById('labelPopup');
  const labels = LabelsManager.getAll();
  const { type, itemId, title } = _popupTarget;

  let labelsHtml = '';
  if (labels.length === 0) {
    labelsHtml = '<p class="popup-empty">No labels yet. Create one below.</p>';
  } else {
    labelsHtml = labels.map(label => {
      const checked = LabelsManager.isInLabel(label.id, type, itemId);
      return `
        <label class="popup-label-item">
          <input type="checkbox" ${checked ? 'checked' : ''} onchange="toggleItemInLabel('${label.id}', this.checked)">
          <span style="width:10px;height:10px;border-radius:50%;background:${label.color};flex-shrink:0;display:inline-block;"></span>
          <span>${label.name}</span>
        </label>`;
    }).join('');
  }

  // Color picker
  const colorPicker = LABEL_COLORS.map((c, i) =>
    `<span class="color-dot-pick ${i === 0 ? 'selected' : ''}" style="background:${c}" onclick="selectLabelColor(this, '${c}')"></span>`
  ).join('');

  popup.innerHTML = `
    <h4>
      <span>🏷️ Add to Label</span>
      <button onclick="closeLabelPopup()">✕</button>
    </h4>
    ${labelsHtml}
    <hr class="popup-divider">
    <p class="popup-new-label">CREATE NEW LABEL</p>
    <div class="popup-color-row">${colorPicker}</div>
    <div class="popup-create-row">
      <input class="popup-label-input" id="newLabelInput" placeholder="Label name..." onkeydown="if(event.key==='Enter') createLabelFromPopup()">
      <button class="popup-create-btn" onclick="createLabelFromPopup()">+ Add</button>
    </div>`;
}

function toggleItemInLabel(labelId, add) {
  if (!_popupTarget) return;
  const { type, itemId, title } = _popupTarget;
  if (add) LabelsManager.addItem(labelId, { type, itemId, title });
  else     LabelsManager.removeItem(labelId, type, itemId);
  renderSidebarLabels();
  // update btn glow
  updateLabelBtnState(type, itemId);
}

let _selectedColor = LABEL_COLORS[0];

function selectLabelColor(el, color) {
  _selectedColor = color;
  document.querySelectorAll('.color-dot-pick').forEach(d => d.classList.remove('selected'));
  el.classList.add('selected');
}

function createLabelFromPopup() {
  const input = document.getElementById('newLabelInput');
  const name  = input ? input.value.trim() : '';
  if (!name) { if(input) input.focus(); return; }
  const label = LabelsManager.create(name, _selectedColor);
  if (_popupTarget) {
    LabelsManager.addItem(label.id, _popupTarget);
    updateLabelBtnState(_popupTarget.type, _popupTarget.itemId);
  }
  renderPopupContent();
  renderSidebarLabels();
}

function closeLabelPopup() {
  const popup = document.getElementById('labelPopup');
  if (popup) popup.style.display = 'none';
  _popupTarget = null;
}

function updateLabelBtnState(type, itemId) {
  const labeled = LabelsManager.getLabelsForItem(type, itemId).length > 0;
  document.querySelectorAll(`.label-btn[data-type="${type}"][data-id="${itemId}"]`).forEach(btn => {
    btn.classList.toggle('has-label', labeled);
  });
}

// Close popup when clicking outside
document.addEventListener('click', function(e) {
  const popup = document.getElementById('labelPopup');
  if (!popup || popup.style.display === 'none') return;
  if (!popup.contains(e.target) && !e.target.classList.contains('label-btn')) {
    closeLabelPopup();
  }
});

/* ================================================
   AUTO-INJECT LABEL BUTTONS ON CARDS
   ================================================ */
document.addEventListener('DOMContentLoaded', function () {
  renderSidebarLabels();
  injectLabelButtons();
  injectLabelPopupDOM();
});

function injectLabelPopupDOM() {
  if (document.getElementById('labelPopup')) return;
  const div = document.createElement('div');
  div.id = 'labelPopup';
  document.body.appendChild(div);
}

function makeLabelBtn(type, itemId, title) {
  const labeled = LabelsManager.getLabelsForItem(type, itemId).length > 0;
  const btn = document.createElement('button');
  btn.className = 'label-btn' + (labeled ? ' has-label' : '');
  btn.title = 'Add to label';
  btn.dataset.type = type;
  btn.dataset.id   = itemId;
  btn.textContent  = '🏷️';
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    openLabelPopup(this, type, itemId, title);
  });
  return btn;
}

function injectLabelButtons() {
  // Announcement cards (grid view)
  document.querySelectorAll('.announcement-card').forEach((card, i) => {
    if (card.querySelector('.label-btn')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Item ' + i;
    const id    = 'ann_' + i;

    // Wrap tag + label btn in top row
    const tag  = card.querySelector('.tag');
    const wrap = document.createElement('div');
    wrap.className = 'card-top-row';
    if (tag) { tag.parentNode.insertBefore(wrap, tag); wrap.appendChild(tag); }
    else     { card.prepend(wrap); }
    wrap.appendChild(makeLabelBtn('announcement', id, title));
  });

  // Announcement list cards (list view)
  document.querySelectorAll('.announcement-list-card').forEach((card, i) => {
    if (card.querySelector('.label-btn')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Item ' + i;
    const id    = 'annl_' + i;
    const action = card.querySelector('.alc-action');
    if (action) action.prepend(makeLabelBtn('announcement', id, title));
  });

  // Club cards
  document.querySelectorAll('.club-card').forEach((card, i) => {
    if (card.querySelector('.label-btn')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Club ' + i;
    const id    = 'club_' + i;
    const tag   = card.querySelector('.tag');
    const wrap  = document.createElement('div');
    wrap.className = 'card-top-row';
    if (tag) { tag.parentNode.insertBefore(wrap, tag); wrap.appendChild(tag); }
    else     { const icon = card.querySelector('.club-icon'); if(icon) card.insertBefore(wrap, icon.nextSibling); else card.prepend(wrap); }
    wrap.appendChild(makeLabelBtn('club', id, title));
  });

  // Event cards
  document.querySelectorAll('.event-card').forEach((card, i) => {
    if (card.querySelector('.label-btn')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Event ' + i;
    const id    = 'evt_' + i;
    const body  = card.querySelector('.event-body');
    if (body) {
      const wrap = document.createElement('div');
      wrap.className = 'card-top-row';
      wrap.style.marginBottom = '8px';
      const tag = body.querySelector('.tag');
      if (tag) { body.insertBefore(wrap, tag); wrap.appendChild(tag); }
      else     { body.prepend(wrap); }
      wrap.appendChild(makeLabelBtn('event', id, title));
    }
  });

  // Resource cards
  document.querySelectorAll('.resource-card').forEach((card, i) => {
    if (card.querySelector('.label-btn')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Resource ' + i;
    const id    = 'res_' + i;
    const tag   = card.querySelector('.tag');
    const wrap  = document.createElement('div');
    wrap.className = 'card-top-row';
    if (tag) { tag.parentNode.insertBefore(wrap, tag); wrap.appendChild(tag); }
    else     { card.prepend(wrap); }
    wrap.appendChild(makeLabelBtn('resource', id, title));
  });

  // Dashboard cards
  document.querySelectorAll('.dashboard-card').forEach((card, i) => {
    if (card.querySelector('.label-btn')) return;
    const h2    = card.querySelector('h2');
    const title = h2 ? h2.textContent.trim() : 'Item ' + i;
    const id    = 'dash_' + i;
    const wrap  = document.createElement('div');
    wrap.className = 'card-top-row';
    wrap.style.justifyContent = 'flex-end';
    card.prepend(wrap);
    wrap.appendChild(makeLabelBtn('resource', id, title));
  });
}
