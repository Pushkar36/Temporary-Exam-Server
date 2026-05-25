/**
 * ExamCloud Admin Dashboard — dashboard.js
 * Temporary Exam Server Generator
 */

'use strict';

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
let pieChartInstance = null;

const state = {
  containers: 0,
  students: 0,
  submissions: 0,
  exams: 0,
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
async function checkActiveExamsTime() {
  try {
    const resp = await fetch('/api/exams');
    const data = await resp.json();
    if (data.success && data.data) {
      const activeExam = data.data.find(e => e.status === 'active');
      if (activeExam) {
        const isoStr = activeExam.created_at.includes('T') ? activeExam.created_at : activeExam.created_at.replace(' ', 'T') + 'Z';
        const createdTime = new Date(isoStr).getTime();
        const durationMs = activeExam.duration_minutes * 60 * 1000;
        const endTime = createdTime + durationMs;
        const remainingMs = endTime - Date.now();
        const remainingMins = Math.floor(remainingMs / 60000);
        
        if (remainingMins > 0 && remainingMins < 15) {
          setTimeout(() => {
            showToast('warning', 'Exam Ending Soon', `"${activeExam.exam_name}" has less than ${remainingMins} minutes remaining.`);
          }, 3000);
        }
      }
    }
  } catch (err) {
    console.error('Failed to check active exams for warning toast:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPieChart();
  initCounters();
  loadRealActivityFeed();
  initHealthBars();
  initProgressBars();
  initTimers();
  initUptimeClock();
  startAutoRefresh();
  closeDropdownsOnOutsideClick();
  initSearchShortcut();

  // Welcome toast
  setTimeout(() => {
    showToast('success', 'Dashboard Loaded', 'All systems operational. Welcome back, Prof. Sharma!');
  }, 800);

  // Check if any live exams are ending soon
  checkActiveExamsTime();
});

/* ─────────────────────────────────────────
   ANIMATED COUNTERS
───────────────────────────────────────── */
async function initCounters() {
  await fetchAndRefreshStats(true);
}

function updateValueWithFlash(id, value, useComma = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const currentVal = useComma ? value.toLocaleString() : value;
  if (el.textContent !== String(currentVal)) {
    el.textContent = currentVal;
    flashElement(el);
  }
}

function setHealthBarClass(barEl, valEl, value) {
  barEl.classList.remove('green', 'yellow', 'red');
  if (value < 50) {
    barEl.classList.add('green');
    valEl.style.color = 'var(--green)';
  } else if (value < 80) {
    barEl.classList.add('yellow');
    valEl.style.color = 'var(--yellow)';
  } else {
    barEl.classList.add('red');
    valEl.style.color = 'var(--red)';
  }
}

function updateSystemHealth(activeContainers) {
  const cpuVal = Math.max(5, Math.min(95, 15 + activeContainers * 5 + Math.floor(Math.random() * 5) - 2));
  const ramVal = Math.max(10, Math.min(90, 20 + activeContainers * 3 + Math.floor(Math.random() * 3) - 1));
  const diskVal = Math.max(15, Math.min(80, 23 + Math.min(10, activeContainers * 1)));
  const nioVal = (80 + activeContainers * 4.2 + Math.random() * 8 - 4).toFixed(1);

  const cpuValEl = document.getElementById('cpu-val');
  const cpuBarEl = document.getElementById('cpu-bar');
  if (cpuValEl && cpuBarEl) {
    cpuValEl.textContent = `${cpuVal}%`;
    cpuBarEl.style.width = `${cpuVal}%`;
    setHealthBarClass(cpuBarEl, cpuValEl, cpuVal);
  }

  const ramValEl = document.getElementById('ram-val');
  const ramBarEl = document.getElementById('ram-bar');
  if (ramValEl && ramBarEl) {
    ramValEl.textContent = `${ramVal}%`;
    ramBarEl.style.width = `${ramVal}%`;
    setHealthBarClass(ramBarEl, ramValEl, ramVal);
  }

  const diskValEl = document.getElementById('disk-val');
  const diskBarEl = document.getElementById('disk-bar');
  if (diskValEl && diskBarEl) {
    diskValEl.textContent = `${diskVal}%`;
    diskBarEl.style.width = `${diskVal}%`;
    setHealthBarClass(diskBarEl, diskValEl, diskVal);
  }

  const nioEl = document.getElementById('network-io');
  if (nioEl) {
    nioEl.textContent = `${nioVal} MB/s`;
  }
}

async function fetchAndRefreshStats(isInitial = false) {
  try {
    const [statsResp, containersResp] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/containers')
    ]);

    const statsData = await statsResp.json();
    const containersData = await containersResp.json();

    if (statsData.success && statsData.data && containersData.success && containersData.data) {
      const stats = statsData.data;
      const containersList = containersData.data;

      let activeCount = 0;
      let idleCount = 0;
      let stoppedCount = 0;

      containersList.forEach(c => {
        if (c.status === 'active') activeCount++;
        else if (c.status === 'idle') idleCount++;
        else stoppedCount++;
      });

      const totalContainers = containersList.length;

      const prevContainers = state.containers;
      const prevExams = state.exams;
      const prevStudents = state.students;
      const prevSubmissions = state.submissions;

      state.containers = totalContainers;
      state.exams = stats.activeExams;
      state.students = activeCount;
      state.submissions = stats.totalSubmissions;

      const dC = state.containers - prevContainers;
      const dS = state.students - prevStudents;

      if (isInitial) {
        animateCounter('stat-containers', 0, state.containers, 1200);
        animateCounter('stat-exams', 0, state.exams, 900);
        animateCounter('stat-students', 0, state.students, 1400);
        animateCounter('stat-submissions', 0, state.submissions, 1800, true);
      } else {
        updateValueWithFlash('stat-containers', state.containers);
        updateValueWithFlash('stat-exams', state.exams);
        updateValueWithFlash('stat-students', state.students);
        updateValueWithFlash('stat-submissions', state.submissions, true);

        const dEl = document.getElementById('stat-containers-delta');
        if (dEl) {
          dEl.textContent = dC >= 0 ? `+${dC} this refresh` : `${dC} this refresh`;
        }
        const sDelta = document.getElementById('stat-students-delta');
        if (sDelta) {
          sDelta.textContent = dS >= 0 ? `↑ ${dS} joined` : `↓ ${Math.abs(dS)} left`;
        }
      }

      if (pieChartInstance) {
        pieChartInstance.data.datasets[0].data = [activeCount, idleCount, stoppedCount];
        pieChartInstance.update();
      }

      const legendVals = document.querySelectorAll('.chart-legend .legend-val');
      if (legendVals.length === 3) {
        legendVals[0].textContent = activeCount;
        legendVals[1].textContent = idleCount;
        legendVals[2].textContent = stoppedCount;
      }
      
      const totalVal = document.querySelector('.chart-center-val');
      if (totalVal) {
        totalVal.textContent = totalContainers;
      }

      updateSystemHealth(activeCount);
    }
  } catch (err) {
    console.error('Failed to sync metrics from database:', err);
  }
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

  pieChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Active', 'Idle', 'Stopped'],
      datasets: [{
        data: [0, 0, 0],
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
    fetchAndRefreshStats(false);
    loadRealActivityFeed();
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

async function refreshContainers() {
  const btn = document.querySelector('button[onclick="refreshContainers()"]') || (event && event.currentTarget);
  if (btn) {
    btn.textContent = '🔄 Refreshing…';
    btn.disabled = true;
  }
  
  showToast('info', 'Refreshing...', 'Fetching latest container status from Docker daemon.');
  
  try {
    await Promise.all([
      fetchAndRefreshStats(),
      loadRealActivityFeed()
    ]);
    showToast('success', 'Containers Updated', `Found ${state.containers} active containers.`);
  } catch (err) {
    showToast('error', 'Refresh Failed', err.message);
  } finally {
    if (btn) {
      btn.textContent = '🔄 Refresh Containers';
      btn.disabled = false;
    }
  }
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
function parseSqlDate(sqlDateStr) {
  if (!sqlDateStr) return new Date();
  const isoStr = sqlDateStr.includes('T') ? sqlDateStr : sqlDateStr.replace(' ', 'T') + 'Z';
  const d = new Date(isoStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function getRelativeTime(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

async function loadRealActivityFeed() {
  try {
    const [examsResp, submissionsResp, containersResp] = await Promise.all([
      fetch('/api/exams'),
      fetch('/api/submissions'),
      fetch('/api/containers')
    ]);

    const examsData = await examsResp.json();
    const submissionsData = await submissionsResp.json();
    const containersData = await containersResp.json();

    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;

    let events = [];

    // 1. Process Exams
    if (examsData.success && examsData.data) {
      examsData.data.forEach(exam => {
        const createdDate = parseSqlDate(exam.created_at);
        events.push({
          icon: '📋',
          text: `Exam <code style="color:var(--cyan);font-size:11px">${exam.exam_name}</code> created (${exam.language.toUpperCase()})`,
          time: createdDate,
          timeStr: getRelativeTime(createdDate),
          type: 'info'
        });

        if (exam.status === 'completed') {
          const completedDate = new Date(createdDate.getTime() + exam.duration_minutes * 60000);
          const finalDate = completedDate < new Date() ? completedDate : new Date();
          events.push({
            icon: '✅',
            text: `Exam <code style="color:var(--green);font-size:11px">${exam.exam_name}</code> completed`,
            time: finalDate,
            timeStr: getRelativeTime(finalDate),
            type: 'success'
          });
        }
      });
    }

    // 2. Process Submissions
    if (submissionsData.success && submissionsData.data) {
      submissionsData.data.forEach(sub => {
        const submittedDate = parseSqlDate(sub.submitted_at);
        events.push({
          icon: '💾',
          text: `Student <span style="font-family:'JetBrains Mono',monospace;color:var(--cyan);font-weight:600;">${sub.student_id}</span> submitted <code style="font-size:11px">${sub.exam_name}</code> (Score: ${sub.score}%)`,
          time: submittedDate,
          timeStr: getRelativeTime(submittedDate),
          type: 'success'
        });
      });
    }

    // 3. Process Containers
    if (containersData.success && containersData.data) {
      containersData.data.forEach(ctn => {
        events.push({
          icon: '🐳',
          text: `Container <code style="color:var(--cyan);font-size:11px">${ctn.container_id}</code> is active for <span style="font-weight:600;">${ctn.student_name || ctn.student_id}</span>`,
          time: new Date(),
          timeStr: 'Active now',
          type: 'info'
        });
      });
    }

    // Sort by date descending
    events.sort((a, b) => b.time - a.time);

    // Keep top 10 events
    events = events.slice(0, 10);

    // Render events to DOM
    timeline.innerHTML = events.map(e => `
      <div class="timeline-item" style="animation: fadeInUp 0.4s ease both;">
        <div class="timeline-icon ${e.type}">${e.icon}</div>
        <div class="timeline-content">
          <div class="timeline-text${e.type === 'danger' ? ' danger-text' : ''}">${e.text}</div>
          <div class="timeline-time">${e.timeStr}</div>
        </div>
      </div>
    `).join('');

  } catch (err) {
    console.error('Failed to load real activity feed:', err);
  }
}
