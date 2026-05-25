/* =============================================================
   MONITOR.JS — Container Monitor Dashboard
   ExamCloud — Temporary Exam Server Generator
   ============================================================= */

'use strict';

/* ── DATA ─────────────────────────────────────────────────── */

const STUDENT_NAMES = [
  'Rahul Sharma', 'Priya Patel', 'Arjun Singh', 'Sneha Gupta',
  'Vikram Mehta', 'Kavya Reddy', 'Rohan Kumar', 'Ananya Joshi',
  'Siddharth Nair', 'Divya Srivastava', 'Aditya Verma', 'Pooja Iyer',
  'Karan Malhotra', 'Swati Dubey', 'Rohit Tiwari', 'Nidhi Sharma',
  'Abhishek Yadav', 'Riya Pandey', 'Suresh Rajan', 'Meena Krishnan',
  'Aryan Chaturvedi', 'Sakshi Mishra', 'Vivek Panda', 'Amrita Bose',
  'Gaurav Jain', 'Neha Agarwal', 'Tarun Bhatt', 'Isha Chopra',
  'Manish Gupta', 'Preeti Nair', 'Deepak Kumar', 'Pallavi Singh',
  'Rajesh Sinha', 'Sunita Rao', 'Alok Bajaj', 'Sushma Pillai',
  'Nikhil Das', 'Ritika Saxena', 'Pranav Shah', 'Komal Thakur',
  'Harish Reddy', 'Vandana Soni', 'Piyush Joshi', 'Chhavi Kumar',
  'Manoj Tripathi', 'Shalini Verma', 'Devendra Agarwal', 'Nandini Patel',
  'Vineet Misra', 'Harsha Rao'
];

const LOG_EVENTS = [
  (c) => ({ type: 'cpu',    msg: `container ${c.id} CPU spike: ${rnd(80, 98)}%` }),
  (c) => ({ type: 'submit', msg: `Student ${c.name} submitted code (exit 0)` }),
  (c) => ({ type: 'warn',   msg: `container ${c.id} idle timeout warning (${rnd(5,12)}min)` }),
  (c) => ({ type: 'info',   msg: `container ${c.id} memory reclaimed: ${rnd(50,200)}MB freed` }),
  (c) => ({ type: 'info',   msg: `Student ${c.name} opened file main.c` }),
  (c) => ({ type: 'warn',   msg: `container ${c.id} disk usage: ${rnd(75,92)}%` }),
  (c) => ({ type: 'cpu',    msg: `container ${c.id} compilation started — gcc -O2 main.c` }),
  (c) => ({ type: 'submit', msg: `Student ${c.name} ran test case #${rnd(1,10)} — PASS` }),
  (c) => ({ type: 'warn',   msg: `Suspicious activity detected in ${c.id} — multiple processes` }),
  (c) => ({ type: 'info',   msg: `container ${c.id} health-check OK (200)` }),
  (c) => ({ type: 'kill',   msg: `container ${c.id} received SIGTERM from admin` }),
  (c) => ({ type: 'spawn',  msg: `container ${c.id} restarted successfully (attempt 1)` }),
  (c) => ({ type: 'submit', msg: `Student ${c.name} downloaded result.txt` }),
  (c) => ({ type: 'info',   msg: `container ${c.id} SSH session opened from 10.0.0.${rnd(1,254)}` }),
  (c) => ({ type: 'warn',   msg: `container ${c.id} network latency: ${rnd(180,450)}ms` }),
];

/* ── STATE ────────────────────────────────────────────────── */

let containers       = [];        // master data
let currentFilter    = 'all';
let autoRefresh      = true;
let refreshInterval  = null;
let logInterval      = null;
let countdownSeconds = 5025;      // 01:23:45
let countdownInterval= null;
let logEntries       = [];
let logEntryCount    = 0;
let logPanelOpen     = true;
let pendingKillId    = null;      // ID for single kill modal

/* ── UTILITY ──────────────────────────────────────────────── */

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function rndFloat(min, max, dp = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(dp)); }

function clamp(val, min, max) { return Math.min(Math.max(val, min), max); }

function nowTs() {
  const n = new Date();
  const hh = String(n.getHours()).padStart(2,'0');
  const mm = String(n.getMinutes()).padStart(2,'0');
  const ss = String(n.getSeconds()).padStart(2,'0');
  return `${hh}:${mm}:${ss}`;
}

function fmtCountdown(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
}

function loginTimeStr(index) {
  const base  = 9 * 60 + 30; // 09:30
  const offset = index * 1;   // 1 min apart
  const total  = base + offset;
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const displayH = hh > 12 ? hh - 12 : hh;
  return `${String(displayH).padStart(2,'0')}:${String(mm).padStart(2,'0')} ${suffix}`;
}

function barClass(pct) {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'mid';
  return 'low';
}

/* ── GENERATE CONTAINERS ──────────────────────────────────── */

function buildContainerStatus(index) {
  // Status distribution: 40 active, 5 idle, 3 warning, 2 offline
  if (index < 40) return 'active';
  if (index < 45) return 'idle';
  if (index < 48) return 'warning';
  return 'offline';
}

async function generateContainers() {
  try {
    const resp = await fetch('/api/containers');
    const data = await resp.json();
    if (data.success && data.data) {
      containers = data.data.map((c, i) => {
        const status = c.status || 'active';
        const cpuBase = status === 'warning' ? rnd(75,95) : status === 'idle' ? rnd(2,8) : rnd(15,65);
        const ramBase = status === 'warning' ? rnd(70,88) : status === 'idle' ? rnd(20,30) : rnd(30,75);

        return {
          id:         c.container_id,
          name:       c.student_name || `Student ${c.student_id}`,
          port:       c.port,
          status:     status,
          cpu:        cpuBase,
          ram:        ramBase,
          loginTime:  loginTimeStr(i),
          index:      i,
          alive:      status !== 'offline',
        };
      });
    } else {
      containers = [];
    }
  } catch (err) {
    console.error('Failed to load containers:', err);
    containers = [];
  }
}

/* ── RENDER ───────────────────────────────────────────────── */

function getVisibleContainers() {
  const search = document.getElementById('search-input').value.toLowerCase().trim();
  return containers.filter(c => {
    const matchFilter =
      currentFilter === 'all' ||
      c.status === currentFilter;
    const matchSearch = !search || c.name.toLowerCase().includes(search) || c.id.includes(search);
    return matchFilter && matchSearch;
  });
}

function renderGrid() {
  const grid    = document.getElementById('container-grid');
  const visible = getVisibleContainers();
  const subtitle = document.getElementById('grid-subtitle');

  subtitle.textContent = `Showing ${visible.length} of ${containers.length} containers`;

  if (visible.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🐳</div>
        <p>No containers match your filter</p>
      </div>`;
    return;
  }

  grid.innerHTML = visible.map(c => renderCard(c)).join('');
}

function renderCard(c) {
  const isWarning = c.status === 'warning';
  const isOffline = c.status === 'offline';

  const warningBanner = isWarning
    ? `<div class="warning-banner">⚠ Suspicious Activity</div>`
    : '';

  const statusDotClass = {
    active: 'online', idle: 'idle', warning: 'warning', offline: 'offline'
  }[c.status] || 'offline';

  const cpuFillClass = barClass(c.cpu);
  const ramFillClass = barClass(c.ram);

  const actionDisabled = isOffline ? 'style="opacity:0.4; pointer-events:none;"' : '';

  return `
    <div class="container-card ${c.status}" id="card-${c.id}" data-id="${c.id}" data-name="${c.name}">
      <div class="ctn-header">
        <div>
          <div class="ctn-name">${c.name}</div>
          <div class="ctn-id">${c.id}</div>
        </div>
        <div class="ctn-port">:${c.port}</div>
      </div>

      ${warningBanner}

      <div style="display:flex; align-items:center; gap:var(--space-2); margin-bottom:var(--space-2);">
        <div class="status-dot ${statusDotClass}"></div>
        <span class="ctn-badge ${c.status}">${c.status}</span>
      </div>

      <div class="ctn-metrics">
        <div class="ctn-metric-row">
          <span class="ctn-metric-label">CPU</span>
          <div class="ctn-bar">
            <div class="ctn-bar-fill ${cpuFillClass}" id="cpu-fill-${c.id}" style="width:${c.cpu}%"></div>
          </div>
          <span class="ctn-metric-val" id="cpu-val-${c.id}">${c.cpu}%</span>
        </div>
        <div class="ctn-metric-row">
          <span class="ctn-metric-label">RAM</span>
          <div class="ctn-bar">
            <div class="ctn-bar-fill ${ramFillClass}" id="ram-fill-${c.id}" style="width:${c.ram}%"></div>
          </div>
          <span class="ctn-metric-val" id="ram-val-${c.id}">${c.ram}%</span>
        </div>
      </div>

      <div class="ctn-footer">
        <span class="ctn-login-time">⏰ ${c.loginTime}</span>
        <div class="ctn-actions" ${actionDisabled}>
          <button class="ctn-btn ssh" title="SSH into container" onclick="openSSHModal('${c.id}')">⌨</button>
          <button class="ctn-btn logs" title="View logs" onclick="openLogsModal('${c.id}')">📋</button>
          <button class="ctn-btn kill" title="Kill container" onclick="openKillModal('${c.id}')">✕</button>
        </div>
      </div>
    </div>`;
}

/* ── LIVE CPU / RAM UPDATE ────────────────────────────────── */

function updateMetrics() {
  containers.forEach(c => {
    if (c.status === 'offline') return;

    // Small random drift
    const cpuDrift = rnd(-5, 5);
    const ramDrift = rnd(-3, 3);

    const cpuMin = c.status === 'idle' ? 1 : c.status === 'warning' ? 70 : 10;
    const cpuMax = c.status === 'idle' ? 12 : c.status === 'warning' ? 99 : 80;
    const ramMin = c.status === 'idle' ? 15 : 25;
    const ramMax = c.status === 'warning' ? 95 : 85;

    c.cpu = clamp(c.cpu + cpuDrift, cpuMin, cpuMax);
    c.ram = clamp(c.ram + ramDrift, ramMin, ramMax);

    // Update DOM directly (no full re-render)
    const cpuFill = document.getElementById(`cpu-fill-${c.id}`);
    const cpuVal  = document.getElementById(`cpu-val-${c.id}`);
    const ramFill = document.getElementById(`ram-fill-${c.id}`);
    const ramVal  = document.getElementById(`ram-val-${c.id}`);

    if (cpuFill) {
      cpuFill.style.width    = `${c.cpu}%`;
      cpuFill.className      = `ctn-bar-fill ${barClass(c.cpu)}`;
    }
    if (cpuVal)  cpuVal.textContent  = `${c.cpu}%`;
    if (ramFill) {
      ramFill.style.width    = `${c.ram}%`;
      ramFill.className      = `ctn-bar-fill ${barClass(c.ram)}`;
    }
    if (ramVal)  ramVal.textContent  = `${c.ram}%`;
  });

  // Update sidebar cluster metrics
  const avgCpu = Math.round(containers.filter(c=>c.alive).reduce((a,c)=>a+c.cpu,0) / containers.filter(c=>c.alive).length);
  const avgRam = Math.round(containers.filter(c=>c.alive).reduce((a,c)=>a+c.ram,0) / containers.filter(c=>c.alive).length);
  const sidebarCpu = document.getElementById('sidebar-cpu');
  const sidebarRam = document.getElementById('sidebar-ram');
  if (sidebarCpu) sidebarCpu.textContent = `${avgCpu}%`;
  if (sidebarRam) sidebarRam.textContent = `${avgRam}%`;

  // Spin refresh ring
  const ring = document.getElementById('refresh-ring');
  if (ring) {
    ring.classList.add('spinning');
    setTimeout(() => ring.classList.remove('spinning'), 600);
  }
}

/* ── SUMMARY BAR ──────────────────────────────────────────── */

function updateSummary() {
  const active  = containers.filter(c => c.status === 'active').length;
  const idle    = containers.filter(c => c.status === 'idle').length;
  const warning = containers.filter(c => c.status === 'warning').length;
  const total   = containers.length;

  document.getElementById('sum-active').textContent  = active;
  document.getElementById('sum-idle').textContent    = idle;
  document.getElementById('sum-warning').textContent = warning;
  document.getElementById('sum-total').textContent   = total;
  document.getElementById('kill-all-count').textContent = total;
  document.getElementById('nav-badge-count').textContent = total;
}

/* ── FILTER ───────────────────────────────────────────────── */

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderGrid();
}

function filterContainers() {
  renderGrid();
}

/* ── COUNTDOWN ────────────────────────────────────────────── */

function startCountdown() {
  countdownInterval = setInterval(() => {
    if (countdownSeconds > 0) {
      countdownSeconds--;
      document.getElementById('countdown').textContent = fmtCountdown(countdownSeconds);

      if (countdownSeconds <= 300) {
        document.getElementById('countdown').style.color = 'var(--red)';
      } else if (countdownSeconds <= 600) {
        document.getElementById('countdown').style.color = 'var(--yellow)';
      }
    } else {
      document.getElementById('countdown').textContent = '00:00:00';
      clearInterval(countdownInterval);
      addLog({ type: 'kill', msg: 'Exam time ended — all containers shutting down' });
    }
  }, 1000);
}

/* ── LIVE LOG PANEL ───────────────────────────────────────── */

function addLog(entry) {
  logEntryCount++;
  const ts  = nowTs();
  const type = entry.type || 'info';
  let msg  = entry.msg;

  if (!msg) {
    if (containers.length > 0) {
      const container = containers[rnd(0, containers.length - 1)];
      msg = LOG_EVENTS[rnd(0, LOG_EVENTS.length - 1)](container).msg;
    } else {
      const sysMsgs = [
        'ExamCloud daemon listening for student logins on port 3000...',
        'Docker container environment pooling active (10 hot spares ready)',
        'Jenkins pipeline scheduler running in standby mode',
        'Nginx upstream routing configuration loaded successfully',
        'SQLite connection pool healthy — data/examcloud.db loaded',
        'Syslog monitoring daemon listening on udp://127.0.0.1:514',
      ];
      msg = sysMsgs[rnd(0, sysMsgs.length - 1)];
    }
  }

  const body = document.getElementById('log-panel-body');
  if (!body) return;

  const div = document.createElement('div');
  div.className = 'log-entry new-log';
  div.innerHTML = `<span class="log-ts">[${ts}]</span> <span class="log-msg ${type}">${msg}</span>`;
  body.prepend(div);

  // Keep max 80 entries
  const all = body.querySelectorAll('.log-entry');
  if (all.length > 80) {
    for (let i = 80; i < all.length; i++) all[i].remove();
  }

  // Update count badge
  const badge = document.getElementById('log-count-badge');
  if (badge) badge.textContent = `${logEntryCount} entries`;
}

function startLogStream() {
  logInterval = setInterval(() => {
    if (!autoRefresh) return;
    const container = containers[rnd(0, containers.length - 1)];
    const eventFn   = LOG_EVENTS[rnd(0, LOG_EVENTS.length - 1)];
    const event     = eventFn(container);
    addLog(event);
  }, 2000);
}

function clearLogs() {
  const body = document.getElementById('log-panel-body');
  if (body) body.innerHTML = '';
  logEntryCount = 0;
  const badge = document.getElementById('log-count-badge');
  if (badge) badge.textContent = '0 entries';
  showToast('info', 'Logs cleared');
}

function toggleLogPanel() {
  logPanelOpen = !logPanelOpen;
  const body = document.getElementById('log-panel-body');
  const icon = document.getElementById('log-collapse-icon');
  if (body) body.classList.toggle('collapsed', !logPanelOpen);
  if (icon) icon.textContent = logPanelOpen ? '▼' : '▶';
}

/* ── AUTO-REFRESH ─────────────────────────────────────────── */

function startAutoRefresh() {
  refreshInterval = setInterval(() => {
    if (!autoRefresh) return;
    updateMetrics();
  }, 3000);
}

function toggleAutoRefresh() {
  autoRefresh = !autoRefresh;
  const sw    = document.getElementById('refresh-toggle-sw');
  const label = document.getElementById('refresh-toggle-label');
  if (sw)    sw.classList.toggle('on', autoRefresh);
  if (label) {
    label.textContent = autoRefresh ? 'ON' : 'OFF';
    label.style.color = autoRefresh ? 'var(--green)' : 'var(--text-muted)';
  }
  const liveBadge = document.getElementById('live-badge');
  if (liveBadge) {
    liveBadge.style.opacity = autoRefresh ? '1' : '0.4';
  }
  showToast(autoRefresh ? 'success' : 'warning', `Auto-refresh ${autoRefresh ? 'enabled' : 'paused'}`);
}

/* ── MODALS ───────────────────────────────────────────────── */

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});

// ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
  }
});

/* ── KILL SINGLE ──────────────────────────────────────────── */

function openKillModal(ctnId) {
  pendingKillId = ctnId;
  document.getElementById('kill-ctn-id').textContent = ctnId;
  openModal('kill-modal');
}

function confirmKillSingle() {
  if (!pendingKillId) return;
  killContainer(pendingKillId);
  closeModal('kill-modal');
  pendingKillId = null;
}

async function killContainer(ctnId) {
  try {
    const resp = await fetch(`/api/containers/${ctnId}`, { method: 'DELETE' });
    const data = await resp.json();

    if (!data.success) {
      showToast('error', data.error || 'Failed to kill container');
      return;
    }

    const card = document.getElementById(`card-${ctnId}`);
    if (card) {
      card.classList.add('card-dying');
      setTimeout(() => {
        card.remove();
        const idx = containers.findIndex(c => c.id === ctnId);
        if (idx !== -1) containers.splice(idx, 1);
        renderGrid();
        updateSummary();
        addLog({ type: 'kill', msg: `container ${ctnId} killed by admin (SIGKILL)` });
      }, 500);
    }
    showToast('error', `Container ${ctnId} killed`);
  } catch (err) {
    showToast('error', 'Server connection error: ' + err.message);
  }
}

/* ── KILL ALL ─────────────────────────────────────────────── */

function checkKillAllInput() {
  const inp = document.getElementById('kill-all-confirm-input');
  const btn = document.getElementById('kill-all-confirm-btn');
  if (inp && btn) {
    btn.disabled = inp.value.trim().toUpperCase() !== 'KILL ALL';
  }
}

async function confirmKillAll() {
  try {
    const resp = await fetch('/api/containers', { method: 'DELETE' });
    const data = await resp.json();

    if (!data.success) {
      showToast('error', data.error || 'Failed to terminate all containers');
      return;
    }

    closeModal('kill-all-modal');
    document.getElementById('kill-all-confirm-input').value = '';
    document.getElementById('kill-all-confirm-btn').disabled = true;

    // Animate all cards out with stagger
    const cards = document.querySelectorAll('.container-card');
    cards.forEach((card, i) => {
      setTimeout(() => {
        card.classList.add('card-dying');
      }, i * 30);
    });

    setTimeout(() => {
      containers = [];
      renderGrid();
      updateSummary();
      addLog({ type: 'kill', msg: 'KILL ALL executed by admin — all active database containers destroyed' });
      showToast('error', 'All containers have been destroyed');
    }, cards.length * 30 + 600);
  } catch (err) {
    showToast('error', 'Server connection error: ' + err.message);
  }
}

/* ── LOGS MODAL ───────────────────────────────────────────── */

function openLogsModal(ctnId) {
  const c = containers.find(x => x.id === ctnId);
  if (!c) return;

  document.getElementById('logs-modal-id').textContent = ctnId;
  document.getElementById('logs-terminal-title').textContent = `kubectl logs pod/${ctnId} -n exam-prod --tail=30`;

  const body = document.getElementById('logs-terminal-body');
  body.innerHTML = generateContainerLogs(c);
  openModal('logs-modal');

  // Auto-scroll to bottom
  setTimeout(() => { body.scrollTop = body.scrollHeight; }, 100);
}

function generateContainerLogs(c) {
  const lines = [];
  const base  = new Date();
  for (let i = 29; i >= 0; i--) {
    const t   = new Date(base.getTime() - i * 12000);
    const ts  = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;
    const msgs = [
      { cls: 'terminal-output',  txt: `[${ts}] Container ${c.id} health check OK` },
      { cls: 'terminal-output',  txt: `[${ts}] CPU: ${rnd(10,90)}% | RAM: ${rnd(20,80)}% | Disk: ${rnd(10,50)}%` },
      { cls: 'terminal-success', txt: `[${ts}] Student ${c.name}: compiled main.c successfully` },
      { cls: 'terminal-output',  txt: `[${ts}] SSH session active from 10.0.0.${rnd(1,200)}` },
      { cls: 'terminal-error',   txt: `[${ts}] WARN: memory usage approaching limit (${rnd(70,88)}%)` },
      { cls: 'terminal-success', txt: `[${ts}] Test case ${rnd(1,10)} passed: expected output matched` },
      { cls: 'terminal-output',  txt: `[${ts}] Port ${c.port} accepting connections` },
      { cls: 'terminal-output',  txt: `[${ts}] Process gcc started PID ${rnd(1000,9999)}` },
    ];
    const msg = msgs[rnd(0, msgs.length - 1)];
    lines.push(`<div class="${msg.cls}">${msg.txt}</div>`);
  }
  lines.push('<div class="terminal-line"><span class="terminal-prompt">$</span><span class="terminal-cursor"></span></div>');
  return lines.join('');
}

function downloadLogs() {
  showToast('info', 'Logs download started (simulated)');
}

/* ── SSH MODAL ────────────────────────────────────────────── */

function openSSHModal(ctnId) {
  const c = containers.find(x => x.id === ctnId);
  if (!c) return;

  document.getElementById('ssh-modal-id').textContent  = ctnId;
  document.getElementById('ssh-terminal-title').textContent = `ssh root@examcloud.io -p ${c.port}`;

  const body = document.getElementById('ssh-terminal-body');
  body.innerHTML = generateSSHOutput(c);
  openModal('ssh-modal');
}

function generateSSHOutput(c) {
  return `
    <div class="terminal-output">Welcome to ExamCloud Container — ${c.id}</div>
    <div class="terminal-output">Student: ${c.name} | Port: ${c.port} | Status: ${c.status.toUpperCase()}</div>
    <div class="terminal-output">────────────────────────────────────────────</div>
    <div class="terminal-output">Linux examcloud-${c.id} 5.15.0-1034-aws #38-Ubuntu</div>
    <div class="terminal-output">Last login: Today ${c.loginTime} from 10.0.0.${rnd(1,200)}</div>
    <div class="terminal-output"> </div>
    <div class="terminal-line"><span class="terminal-prompt">root@${c.id}:~#</span> <span class="terminal-cmd">ls -la /workspace</span></div>
    <div class="terminal-output">total 24</div>
    <div class="terminal-output">drwxr-xr-x 2 root root 4096 May 20 ${c.loginTime}  .</div>
    <div class="terminal-output">-rw-r--r-- 1 root root  842 May 20 ${c.loginTime}  main.c</div>
    <div class="terminal-output">-rw-r--r-- 1 root root  128 May 20 ${c.loginTime}  Makefile</div>
    <div class="terminal-success">-rwxr-xr-x 1 root root 8920 May 20 ${c.loginTime}  a.out</div>
    <div class="terminal-output"> </div>
    <div class="terminal-line"><span class="terminal-prompt">root@${c.id}:~#</span> <span class="terminal-cmd">top -bn1 | head -5</span></div>
    <div class="terminal-output">top - ${nowTs()} up 2:43, 1 user, load avg: ${rndFloat(0.1, 2.5)}, ${rndFloat(0.1,2)}, ${rndFloat(0.1,1.5)}</div>
    <div class="terminal-output">Tasks:  12 total,   1 running,  11 sleeping,   0 stopped</div>
    <div class="terminal-output">%Cpu(s): ${c.cpu}.${rnd(0,9)} us, 2.1 sy,  0.0 ni, ${100 - c.cpu}.${rnd(0,9)} id</div>
    <div class="terminal-output">MiB Mem:  2048.0 total,  ${Math.round((100-c.ram)*20.48)} free,  ${Math.round(c.ram*20.48)} used</div>
    <div class="terminal-line"><span class="terminal-prompt">root@${c.id}:~#</span><span class="terminal-cursor"></span></div>
  `;
}

/* ── SPAWN CONTAINER ──────────────────────────────────────── */

async function spawnContainer() {
  const name  = document.getElementById('spawn-name').value.trim();
  const roll  = document.getElementById('spawn-roll').value.trim();
  const port  = parseInt(document.getElementById('spawn-port').value) || (8001 + containers.length);

  if (!name) {
    showToast('error', 'Student name is required');
    return;
  }

  const studentId = roll || 'STU_' + Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const resp = await fetch('/api/containers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: studentId, name, port })
    });
    const data = await resp.json();

    if (!data.success) {
      showToast('error', data.error || 'Failed to spawn container');
      return;
    }

    const c = data.data;
    const newCtn = {
      id:        c.container_id,
      name:      name,
      port:      c.port,
      status:    'active',
      cpu:       rnd(5, 30),
      ram:       rnd(20, 45),
      loginTime: nowTs().slice(0, 5) + ' AM',
      index:     containers.length,
      alive:     true,
    };

    containers.push(newCtn);
    closeModal('spawn-modal');
    document.getElementById('spawn-name').value = '';
    document.getElementById('spawn-roll').value = '';
    document.getElementById('spawn-port').value = port + 1;

    renderGrid();
    updateSummary();
    addLog({ type: 'spawn', msg: `container ${c.container_id} spawned for student ${name} on port ${c.port}` });
    showToast('success', `Container ${c.container_id} spawned for ${name}`);
  } catch (err) {
    showToast('error', 'Server connection error: ' + err.message);
  }
}

/* ── TOAST ────────────────────────────────────────────────── */

function showToast(type, message, duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideInToast 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── INITIAL LOG SEEDING ──────────────────────────────────── */

function seedInitialLogs() {
  let seeds;
  if (containers.length > 0) {
    seeds = [
      { type: 'info',   msg: `Container Monitor started — ${containers.length} active database environments` },
      { type: 'spawn',  msg: 'Exam session initialized — dynamic sandbox pool listening' },
      { type: 'info',   msg: `container ${containers[0].id} health-check OK (200)` },
    ];
  } else {
    seeds = [
      { type: 'info',   msg: 'Container Monitor started — Listening for active student sandboxes' },
      { type: 'spawn',  msg: 'ExamCloud docker daemon pooled 10 active standby nodes' },
      { type: 'info',   msg: 'SQLite database connection pool ready' },
    ];
  }

  // Add in reverse so newest is at top
  [...seeds].reverse().forEach(s => addLog(s));
}

/* ── INIT ─────────────────────────────────────────────────── */

async function init() {
  await generateContainers();
  renderGrid();
  updateSummary();
  startCountdown();
  seedInitialLogs();
  startAutoRefresh();
  startLogStream();

  // Stagger card entrance animation
  requestAnimationFrame(() => {
    const cards = document.querySelectorAll('.container-card');
    cards.forEach((card, i) => {
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(16px)';
      card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      setTimeout(() => {
        card.style.opacity   = '1';
        card.style.transform = 'translateY(0)';
      }, i * 18);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
