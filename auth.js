/* ================================================
   auth.js — Role-Based UI System
   Campus Community | No backend needed
   ================================================

   HOW IT WORKS:
   - Login page saves role to localStorage
   - This file runs on every page and:
     * Adds 'role-admin' or 'role-student' class to <body>
     * Blocks students from accessing admin pages
     * Injects admin action buttons (Edit/Delete/Pin) on cards
     * Renders pinned content on home page
     * Updates sidebar dynamically based on role
================================================ */

/* ================================================
   AUTH STATE
================================================ */
const Auth = {
  getRole:     () => localStorage.getItem('campus_role') || null,
  getName:     () => localStorage.getItem('campus_name') || 'Student',
  getAvatar:   () => (localStorage.getItem('campus_name') || 'S')[0].toUpperCase(),
  isAdmin:     () => localStorage.getItem('campus_role') === 'admin',
  isStudent:   () => localStorage.getItem('campus_role') === 'student',
  isLoggedIn:  () => !!localStorage.getItem('campus_role'),

  login(role, name) {
    localStorage.setItem('campus_role', role);
    localStorage.setItem('campus_name', name.trim() || (role === 'admin' ? 'Admin' : 'Student'));
  },

  logout() {
    localStorage.removeItem('campus_role');
    localStorage.removeItem('campus_name');
    localStorage.removeItem('token');
    window.location.href = 'login.html';
  }
};

/* ================================================
   PINNED ITEMS (localStorage)
================================================ */
const Pins = {
  _key: 'campus_pinned',
  getAll()         { try { return JSON.parse(localStorage.getItem(this._key) || '[]'); } catch { return []; } },
  save(pins)       { localStorage.setItem(this._key, JSON.stringify(pins)); },
  isPinned(id)     { return this.getAll().some(p => p.id === id); },
  pin(item)        { const pins = this.getAll(); if (!pins.find(p => p.id === item.id)) { pins.unshift(item); this.save(pins); } },
  unpin(id)        { this.save(this.getAll().filter(p => p.id !== id)); },
  toggle(item)     { this.isPinned(item.id) ? this.unpin(item.id) : this.pin(item); }
};

/* ================================================
   APPLY ROLE TO BODY (runs immediately)
================================================ */
const _role = Auth.getRole() || 'guest';
document.body.classList.add('role-' + _role);

/* ================================================
   PROTECT ADMIN PAGES
================================================ */
const _adminPages = [
  'admin-announcements.html', 'admin-events.html',
  'admin-clubs.html', 'admin-users.html', 'admin-dashboard.html'
];
const _page = window.location.pathname.split('/').pop() || 'index.html';

if (_adminPages.includes(_page) && !Auth.isAdmin()) {
  window.location.href = Auth.isLoggedIn() ? 'student-dashboard.html' : 'login.html';
}

/* ================================================
   DOM READY — Set everything up
================================================ */
document.addEventListener('DOMContentLoaded', function () {
  setupSidebar();
  updateAccountButton();
  if (Auth.isAdmin()) injectAdminActionsOnCards();
  renderPinnedBadges();
  if (_page === 'index.html') renderPinnedSection();
  setupLogoutLinks();
});

/* ================================================
   SIDEBAR SETUP
================================================ */
function setupSidebar() {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;

  // Remove old "Account" nav section (Login/StudentDash/AdminPanel list)
  // Replace with role-aware links
  const oldAccountSection = [...sidebarNav.querySelectorAll('.nav-section-label')]
    .find(el => el.textContent.trim() === 'Account');
  if (oldAccountSection) {
    const nextUl = oldAccountSection.nextElementSibling;
    oldAccountSection.remove();
    if (nextUl && nextUl.tagName === 'UL') nextUl.remove();
  }

  if (Auth.isAdmin()) {
    // Inject Admin section
    const adminNav = document.createElement('div');
    adminNav.innerHTML = `
      <div class="nav-section-label" style="margin-top:12px;color:var(--purple);">⚙️ Admin</div>
      <ul class="nav-links">
        <li><a href="admin-dashboard.html"><span class="nav-icon">📊</span><span class="nav-label">Admin Dashboard</span></a></li>
        <li><a href="admin-announcements.html"><span class="nav-icon">📢</span><span class="nav-label">Manage Announcements</span></a></li>
        <li><a href="admin-events.html"><span class="nav-icon">📅</span><span class="nav-label">Manage Events</span></a></li>
        <li><a href="admin-clubs.html"><span class="nav-icon">👥</span><span class="nav-label">Manage Clubs</span></a></li>
        <li><a href="admin-users.html"><span class="nav-icon">👤</span><span class="nav-label">Manage Users</span></a></li>
      </ul>`;
    // Insert before My Labels section
    const labelsHeader = [...sidebarNav.querySelectorAll('.nav-section-label')]
      .find(el => el.textContent.trim() === 'My Labels');
    if (labelsHeader) sidebarNav.insertBefore(adminNav, labelsHeader);
    else sidebarNav.appendChild(adminNav);

    // Re-style active links
    adminNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('mouseenter', function() { this.style.background = 'var(--purple-dim)'; this.style.color = 'var(--purple)'; });
      link.addEventListener('mouseleave', function() {
        if (!this.classList.contains('active')) { this.style.background = ''; this.style.color = ''; }
      });
    });
  }

  if (Auth.isLoggedIn()) {
    // Add logout link to My Space section
    const mySpaceHeader = [...sidebarNav.querySelectorAll('.nav-section-label')]
      .find(el => el.textContent.trim() === 'My Space');
    if (mySpaceHeader) {
      const nextUl = mySpaceHeader.nextElementSibling;
      if (nextUl && nextUl.tagName === 'UL') {
        const logoutLi = document.createElement('li');
        logoutLi.innerHTML = `<a href="student-dashboard.html"><span class="nav-icon">🎓</span><span class="nav-label">My Dashboard</span></a>`;
        nextUl.appendChild(logoutLi);
      }
    }
  } else {
    // Guest — add login link
    const labelsHeader = [...sidebarNav.querySelectorAll('.nav-section-label')]
      .find(el => el.textContent.trim() === 'My Labels');
    const loginDiv = document.createElement('div');
    loginDiv.innerHTML = `
      <div class="nav-section-label" style="margin-top:12px;">Account</div>
      <ul class="nav-links">
        <li><a href="login.html"><span class="nav-icon">🔐</span><span class="nav-label">Login</span></a></li>
      </ul>`;
    if (labelsHeader) sidebarNav.insertBefore(loginDiv, labelsHeader);
    else sidebarNav.appendChild(loginDiv);
  }
}

/* ================================================
   ACCOUNT BUTTON IN SIDEBAR FOOTER
================================================ */
function updateAccountButton() {
  const btn = document.querySelector('.sidebar-account-btn');
  if (!btn) return;

  const avatar = document.querySelector('.account-avatar-sm');
  const label  = btn.querySelector('.sidebar-account-label');

  if (avatar) avatar.textContent = Auth.getAvatar();
  if (label) {
    if (Auth.isLoggedIn()) {
      label.textContent = Auth.getName();
    } else {
      label.textContent = 'Login';
      btn.href = 'login.html';
    }
  }

  // Role badge next to name
  if (Auth.isLoggedIn() && !btn.querySelector('.role-pill')) {
    const pill = document.createElement('span');
    pill.className = 'role-pill';
    pill.textContent = Auth.isAdmin() ? 'Admin' : 'Student';
    pill.style.cssText = `
      font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;margin-left:4px;flex-shrink:0;
      background:${Auth.isAdmin() ? 'var(--purple-dim)' : 'var(--cyan-dim)'};
      color:${Auth.isAdmin() ? 'var(--purple)' : 'var(--cyan)'};
      border:1px solid ${Auth.isAdmin() ? 'rgba(168,85,247,0.3)' : 'var(--border-cyan)'};`;
    btn.appendChild(pill);
  }
}

/* ================================================
   LOGOUT LINKS
================================================ */
function setupLogoutLinks() {
  document.querySelectorAll('a[href="login.html"]').forEach(link => {
    if (Auth.isLoggedIn() && link.textContent.trim().toLowerCase().includes('logout')) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        Auth.logout();
      });
    }
  });
}

/* ================================================
   ADMIN ACTION BUTTONS ON CARDS
================================================ */
function injectAdminActionsOnCards() {
  if (!Auth.isAdmin()) return;

  // Announcement cards (grid)
  document.querySelectorAll('.announcement-card').forEach((card, i) => {
    if (card.querySelector('.admin-actions')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Announcement';
    const id    = 'ann_' + i;
    card.appendChild(makeAdminActions(id, title, 'announcement', 'admin-announcements.html'));
  });

  // Announcement list cards
  document.querySelectorAll('.announcement-list-card').forEach((card, i) => {
    if (card.querySelector('.admin-actions')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Announcement';
    const id    = 'annl_' + i;
    const action = card.querySelector('.alc-action');
    if (action) action.prepend(makeAdminActions(id, title, 'announcement', 'admin-announcements.html', true));
  });

  // Event cards
  document.querySelectorAll('.event-card').forEach((card, i) => {
    if (card.querySelector('.admin-actions')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Event';
    const id    = 'evt_' + i;
    const body  = card.querySelector('.event-body');
    if (body) body.appendChild(makeAdminActions(id, title, 'event', 'admin-events.html'));
  });

  // Club cards
  document.querySelectorAll('.club-card').forEach((card, i) => {
    if (card.querySelector('.admin-actions')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Club';
    const id    = 'club_' + i;
    card.appendChild(makeAdminActions(id, title, 'club', 'admin-clubs.html'));
  });

  // Resource cards
  document.querySelectorAll('.resource-card').forEach((card, i) => {
    if (card.querySelector('.admin-actions')) return;
    const h3    = card.querySelector('h3');
    const title = h3 ? h3.textContent.trim() : 'Resource';
    const id    = 'res_' + i;
    card.appendChild(makeAdminActions(id, title, 'resource', 'admin-announcements.html', false, false));
  });

  // Discussion threads — delete only
  document.querySelectorAll('.announcement-list-card[data-tag]').forEach((card, i) => {
    // already handled above
  });
}

function makeAdminActions(id, title, type, editPage, compact = false, canPin = true) {
  const isPinned = Pins.isPinned(id);
  const div = document.createElement('div');
  div.className = 'admin-actions' + (compact ? ' admin-actions-compact' : '');
  div.innerHTML = `
    ${canPin ? `<button class="admin-btn pin-btn ${isPinned ? 'pinned' : ''}" title="${isPinned ? 'Unpin' : 'Pin to home'}" onclick="togglePin('${id}','${title.replace(/'/g,"\\'")}','${type}',this)">
      ${isPinned ? '📌' : '📍'}
    </button>` : ''}
    <a href="${editPage}" class="admin-btn edit-btn" title="Edit in admin panel">✏️</a>
    <button class="admin-btn delete-btn" title="Delete" onclick="adminDelete(this)">🗑️</button>`;
  return div;
}

function togglePin(id, title, type, btn) {
  const item = { id, title, type };
  Pins.toggle(item);
  const pinned = Pins.isPinned(id);
  btn.textContent = pinned ? '📌' : '📍';
  btn.classList.toggle('pinned', pinned);
  btn.title = pinned ? 'Unpin' : 'Pin to home';
  showToast(pinned ? `📌 "${title}" pinned to home!` : `Unpinned "${title}"`, pinned ? 'cyan' : 'muted');
}

function adminDelete(btn) {
  const card = btn.closest('.announcement-card, .announcement-list-card, .event-card, .club-card, .resource-card, .dashboard-card');
  if (!card) return;
  if (!confirm('Delete this item? (This is a demo — real deletion needs backend)')) return;
  card.style.transition = 'all 0.3s ease';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.95)';
  setTimeout(() => card.remove(), 300);
  showToast('🗑️ Item removed from view (real deletion needs backend)', 'muted');
}

/* ================================================
   PINNED BADGES (shown on all cards)
================================================ */
function renderPinnedBadges() {
  const pins = Pins.getAll();
  if (!pins.length) return;

  // For each pinned item, find the card and add a pinned badge
  document.querySelectorAll('.announcement-card, .event-card').forEach((card, i) => {
    const type = card.classList.contains('event-card') ? 'event' : 'announcement';
    const id = type + '_' + i;
    if (Pins.isPinned(id)) {
      if (!card.querySelector('.pinned-badge')) {
        const badge = document.createElement('span');
        badge.className = 'pinned-badge';
        badge.textContent = '📌 Pinned';
        card.prepend(badge);
      }
    }
  });
}

/* ================================================
   PINNED SECTION ON HOME PAGE
================================================ */
function renderPinnedSection() {
  const pins = Pins.getAll();
  if (!pins.length) return;

  const main = document.querySelector('.page-wrapper');
  if (!main) return;

  const section = document.createElement('div');
  section.style.marginBottom = '48px';
  section.innerHTML = `
    <div class="section-header">
      <h2 class="section-title" style="color:var(--cyan);">📌 Pinned by Admin</h2>
    </div>
    <div class="grid-3" id="pinnedGrid"></div>`;

  const grid = section.querySelector('#pinnedGrid');
  pins.forEach(pin => {
    const typeColors = { announcement: 'tag-tech', event: 'tag-sports', resource: 'tag-general', club: 'tag-culture' };
    const typeIcons  = { announcement: '📢', event: '📅', resource: '📂', club: '👥' };
    const card = document.createElement('div');
    card.className = 'announcement-card';
    card.style.borderColor = 'rgba(0,212,255,0.2)';
    card.innerHTML = `
      <div class="card-top-row">
        <span class="tag ${typeColors[pin.type] || 'tag-general'}">${typeIcons[pin.type] || '📌'} ${pin.type}</span>
        <span class="pinned-badge">📌 Pinned</span>
      </div>
      <h3>${pin.title}</h3>
      <p style="font-size:13px;color:var(--text-muted);">Pinned by Admin for all students</p>
      <a href="${pin.type === 'event' ? 'events.html' : 'announcement.html'}" class="card-link">View →</a>`;
    grid.appendChild(card);
  });

  // Insert at top of page-wrapper
  main.insertBefore(section, main.firstChild);
}

/* ================================================
   TOAST NOTIFICATION
================================================ */
function showToast(message, color = 'cyan') {
  let toast = document.getElementById('authToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'authToast';
    toast.style.cssText = `
      position:fixed;bottom:28px;right:28px;z-index:99999;
      padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;
      font-family:'Poppins',sans-serif;max-width:320px;
      box-shadow:0 8px 24px rgba(0,0,0,0.4);
      transition:all 0.3s ease;opacity:0;transform:translateY(8px);`;
    document.body.appendChild(toast);
  }

  const styles = {
    cyan:  { bg: 'rgba(0,212,255,0.15)',  border: 'rgba(0,212,255,0.4)',  text: '#00d4ff' },
    muted: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', text: '#94a3b8' },
    error: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  text: '#ef4444' },
    green: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#22c55e' },
  };
  const s = styles[color] || styles.cyan;
  toast.style.background = s.bg;
  toast.style.border = `1px solid ${s.border}`;
  toast.style.color  = s.text;
  toast.textContent  = message;

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
  }, 3500);
}
