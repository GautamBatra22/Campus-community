/* ================================================
   main.js — Shared across all pages
   ================================================ */

// ---- Sidebar toggle ----
const sidebar  = document.getElementById('sidebar');
const toggleBtn = document.getElementById('sidebarToggle');

if (toggleBtn && sidebar) {
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');
    // Update toggle button label
    const lbl = toggleBtn.querySelector('.toggle-label');
    if (lbl) lbl.textContent = sidebar.classList.contains('collapsed') ? 'Expand' : 'Collapse';
  });
}

// ---- Mark active nav link ----
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPage) link.classList.add('active');
});

// ---- Animate stat numbers on scroll ----
function animateCounter(el, target, duration = 1200) {
  let start = 0;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { start = target; clearInterval(timer); }
    el.textContent = Math.floor(start) + (el.dataset.suffix || '');
  }, 16);
}

const statNumbers = document.querySelectorAll('.stat-number[data-count]');
if (statNumbers.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCounter(el, parseInt(el.dataset.count));
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(el => observer.observe(el));
}
