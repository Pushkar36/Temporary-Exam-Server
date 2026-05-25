/**
 * ExamCloud Admin Dashboard — dashboard.js
 * Temporary Exam Server Generator
 */

'use strict';

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
const state = {
  containers: 47,
  students: 142,
  submissions: 1284,
  exams: 3,
  timers: [
    { el: 'timer-1', seconds: 4980 },   // 1:23:00
    { el: 'timer-2', seconds: 3300 },   // 0:55:00
    { el: 'timer-3', seconds: 720  },   // 0:12:00
  ],
  uptimeSeconds: 12 * 86400 + 4 * 3600 + 33 * 60,
  refreshInterval: null,
  timerInterval: null,
  uptimeInterval: null,
};

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  initHealthBars();
  initProgressBars();
  initPieChart();
  initTimers();
  initUptimeClock();
  startAutoRefresh();
  closeDropdownsOnOutsideClick();
  initSearchShortcut();

  // Welcome toast
  setTimeout(() => {
    showToast('success', 'Dashboard Loaded', 'All systems operational. Welcome back, Prof. Sharma!');
  }, 800);

  // Java OOP warning toast (it's ending soon)
  setTimeout(() => {
    showToast('warning', 'Exam Ending Soon', 'Java OOP Exam has less than 15 minutes remaining.');
  }, 3000);
});

/* ─────────────────────────────────────────
   ANIMATED COUNTERS
───────────────────────────────────────── */
async function initCounters() {
  try {
    const resp = await fetch('/api/stats');
    const data = await resp.json();
    if (data.success && data.data) {
      state.students = data.data.totalStudents;
      state.exams = data.data.totalExams;
      state.submissions = data.data.totalSubmissions;
    }
  } catch (err) {
    console.error('Failed to load database stats:', err);
  }

  animateCounter('stat-containers', 0, state.containers, 1200);
  animateCounter('stat-exams', 0, state.exams, 900);
  animateCounter('stat-students', 0, state.students, 1400);
  animateCounter('stat-submissions', 0, state.submissions, 1800, true);
}

function animateCounter(id, from, to, duration, useComma = false) {
  const el = document.getElementById(id);
  if (!el) return;

  const start = performance.now();
  const range = to - from;

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = Math.round(from + range * easeOutCubic(progress));
    el.textContent = useComma ? current.toLocaleString() : current;
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ─────────────────────────────────────────
   HEALTH BARS ANIMATION
───────────────────────────────────────── */
function initHealthBars() {
  const bars = document.querySelectorAll('.health-bar-fill[data-width]');
  bars.forEach((bar, i) => {
    setTimeout(() => {
      bar.style.width = bar.dataset.width + '%';
    }, 200 + i * 150);
  });
}

/* ─────────────────────────────────────────
   PROGRESS BARS (EXAM TABLE)
───────────────────────────────────────── */
function initProgressBars() {
  const bars = document.querySelectorAll('.progress-bar[data-width]');
  bars.forEach((bar, i) => {
    setTimeout(() => {
      bar.style.width = bar.dataset.width + '%';
    }, 400 + i * 200);
  });
}

/* ─────────────────────────────────────────
   PIE / DOUGHNUT CHART
───────────────────────────────────────── */
function initPieChart() {
  const ctx = document.getElementById('containerPieChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Idle', 'Stopped'],
      datasets: [{
        data: [47, 18, 7],
        backgroundColor: [
          'rgba(0, 212, 255, 0.85)',
          'rgba(124, 58, 237, 0.85)',
          'rgba(71, 85, 105, 0.85)',
        ],
        borderColor: [
          '#00d4ff',
          '#7c3aed',
          '#475569',
        ],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      cutout: '72%',
      animation: {
        animateRotate: true,
        duration: 1400,
        easing: 'easeInOutQuart',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} containers`,
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

/* ─────────────────────────────────────────
   EXAM COUNTDOWN TIMERS
───────────────────────────────────────── */
function initTimers() {
  function tick() {
    state.timers.forEach(t => {
      if (t.seconds > 0) t.seconds--;
      const el = document.getElementById(t.el);
      if (!el) return;
      el.textContent = formatTime(t.seconds);

      // Urgent styling if < 15 min
      if (t.seconds < 900) {
        el.classList.add('urgent');
      }
    });
  }

  state.timerInterval = setInterval(tick, 1000);
}

function formatTime(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ─────────────────────────────────────────
   UPTIME CLOCK
───────────────────────────────────────── */
function initUptimeClock() {
  function updateUptime() {
    state.uptimeSeconds++;
    const d = Math.floor(state.uptimeSeconds / 86400);
    const h = Math.floor((state.uptimeSeconds % 86400) / 3600);
    const m = Math.floor((state.uptimeSeconds % 3600) / 60);
    const el = document.getElementById('uptimeDisplay');
    if (el) el.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
  }
  state.uptimeInterval = setInterval(updateUptime, 60000);
}

/* ─────────────────────────────────────────
   AUTO-REFRESH (CONTAINERS & STUDENTS)
───────────────────────────────────────── */
function startAutoRefresh() {
  state.refreshInterval = setInterval(() => {
    // Containers: ±2
    const dC = Math.floor(Math.random() * 5) - 2;
    state.containers = Math.max(40, state.containers + dC);
    const cEl = document.getElementById('stat-containers');
    if (cEl) {
      cEl.textContent = state.containers;
      flashElement(cEl);
    }
    const dEl = document.getElementById('stat-containers-delta');
    if (dEl) {
      dEl.textContent = dC >= 0 ? `+${dC} this refresh` : `${dC} this refresh`;
    }

    // Students: ±2
    const dS = Math.floor(Math.random() * 5) - 2;
    state.students = Math.max(100, state.students + dS);
    const sEl = document.getElementById('stat-students');
    if (sEl) {
      sEl.textContent = state.students;
      flashElement(sEl);
    }
    const sDelta = document.getElementById('stat-students-delta');
    if (sDelta) {
      sDelta.textContent = dS >= 0 ? `↑ ${dS} joined` : `↓ ${Math.abs(dS)} left`;
    }

    // Network I/O fluctuate
    const nio = (80 + Math.random() * 30).toFixed(1);
    const nioEl = document.getElementById('network-io');
    if (nioEl) nioEl.textContent = `${nio} MB/s`;

  }, 5000);
}

function flashElement(el) {
  el.style.transition = 'color 0.2s';
  el.style.filter = 'brightness(1.5)';
  setTimeout(() => { el.style.filter = ''; }, 400);
}

/* ─────────────────────────────────────────
   DROPDOWN SYSTEM
───────────────────────────────────────── */
function toggleDropdown(id) {
  const target = document.getElementById(id);
  if (!target) return;

  const isOpen = target.classList.contains('open');

  // Close all
  document.querySelectorAll('.dropdown-menu.open').forEach(d => d.classList.remove('open'));

  if (!isOpen) target.classList.add('open');
}

function closeDropdownsOnOutsideClick() {
  document.addEventListener('click', e => {
    if (!e.target.closest('.dropdown-container')) {
      document.querySelectorAll('.dropdown-menu.open').forEach(d => d.classList.remove('open'));
    }
  });
}

/* ─────────────────────────────────────────
   TOAST SYSTEM
───────────────────────────────────────── */
const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

function showToast(type = 'info', title = '', message = '', duration = 4500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">✕</button>
  `;

  container.appendChild(toast);

  const timer = setTimeout(() => removeToast(toast), duration);
  toast._timer = timer;

  return toast;
}

function removeToast(toast) {
  if (!toast) return;
  clearTimeout(toast._timer);
  toast.style.animation = 'toastOut 0.3s ease forwards';
  setTimeout(() => toast.remove(), 300);
}

/* ─────────────────────────────────────────
   ACTION HANDLERS
───────────────────────────────────────── */
function stopExam(examName) {
  if (!confirm(`Are you sure you want to stop "${examName}"?\nThis will disconnect all connected students.`)) return;
  showToast('warning', 'Exam Stopped', `"${examName}" has been terminated.`);
  addActivityItem('🛑', `Exam "${examName}" stopped by Prof. Sharma`, 'just now', 'danger');
}

function refreshContainers() {
  showToast('info', 'Refreshing...', 'Fetching latest container status from Docker daemon.');
  const btn = event.currentTarget;
  btn.textContent = '🔄 Refreshing…';
  btn.disabled = true;

  setTimeout(() => {
    state.containers += Math.floor(Math.random() * 3);
    const cEl = document.getElementById('stat-containers');
    if (cEl) cEl.textContent = state.containers;
    showToast('success', 'Containers Updated', `Found ${state.containers} active containers.`);
    btn.textContent = '🔄 Refresh Containers';
    btn.disabled = false;
    addActivityItem('🐳', `Container list refreshed — ${state.containers} active`, 'just now', 'info');
  }, 1800);
}

function exportLogs() {
  showToast('info', 'Exporting Logs', 'Preparing log bundle… Download will start shortly.');
  setTimeout(() => {
    showToast('success', 'Export Ready', 'exam-logs-2026-05-20.zip is ready for download.');
  }, 2200);
}

function handleLogout() {
  if (!confirm('Are you sure you want to logout?')) return;
  showToast('info', 'Logging out…', 'Redirecting to login page.');
  setTimeout(() => {
    window.location.href = 'admin-login.html';
  }, 1200);
}

/* ─────────────────────────────────────────
   DYNAMIC ACTIVITY FEED
───────────────────────────────────────── */
function addActivityItem(icon, text, time, type = 'default') {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;

  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.style.animation = 'fadeInUp 0.4s ease both';
  item.innerHTML = `
    <div class="timeline-icon ${type}">${icon}</div>
    <div class="timeline-content">
      <div class="timeline-text${type === 'danger' ? ' danger-text' : ''}">${text}</div>
      <div class="timeline-time">${time}</div>
    </div>
  `;

  timeline.insertBefore(item, timeline.firstChild);

  // Keep max 10 items
  while (timeline.children.length > 10) {
    timeline.removeChild(timeline.lastChild);
  }
}

/* ─────────────────────────────────────────
   MOBILE SIDEBAR
───────────────────────────────────────── */
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sidebar || !overlay) return;

  const isOpen = sidebar.classList.contains('open');
  sidebar.classList.toggle('open', !isOpen);
  overlay.classList.toggle('show', !isOpen);
  document.body.style.overflow = !isOpen ? 'hidden' : '';
}

/* ─────────────────────────────────────────
   SEARCH SHORTCUT (Ctrl+K / Cmd+K)
───────────────────────────────────────── */
function initSearchShortcut() {
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.getElementById('searchInput');
      if (input) input.focus();
    }
    // ESC closes dropdowns and sidebar
    if (e.key === 'Escape') {
      document.querySelectorAll('.dropdown-menu.open').forEach(d => d.classList.remove('open'));
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebarOverlay');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
      }
    }
  });
}

/* ─────────────────────────────────────────
   SIMULATE LIVE ACTIVITY FEED
───────────────────────────────────────── */
const FAKE_EVENTS = [
  { icon: '🐳', text: 'Container <code style="color:var(--cyan);font-size:11px">student-{N}</code> spun up', type: 'info' },
  { icon: '✅', text: 'Student {N} submitted Python Lab Test', type: 'success' },
  { icon: '📶', text: 'New connection from IP 10.0.1.{N}', type: 'default' },
  { icon: '🔧', text: 'Jenkins build <code style="color:var(--cyan);font-size:11px">#{N}</code> completed', type: 'success' },
  { icon: '💾', text: 'Auto-snapshot triggered for container student-{N}', type: 'info' },
];

setInterval(() => {
  const ev = FAKE_EVENTS[Math.floor(Math.random() * FAKE_EVENTS.length)];
  const n = Math.floor(Math.random() * 50) + 1;
  addActivityItem(ev.icon, ev.text.replace(/\{N\}/g, n), 'just now', ev.type);
}, 15000);
