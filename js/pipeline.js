/**
 * pipeline.js — CI/CD Pipeline Viewer
 * ExamCloud Admin — Temporary Exam Server Generator
 */

/* ══════════════════════════════════════════════
   PIPELINE STAGE DATA
══════════════════════════════════════════════ */
const PIPELINE_STAGES = [
  {
    id: 'pull',
    icon: '⬇️',
    name: 'Pull Repository',
    status: 'success',
    duration: '12s',
    extra: null,
    logs: [
      { type: 'cmd',     text: 'git fetch --all --prune' },
      { type: 'output',  text: 'Fetching origin' },
      { type: 'output',  text: 'remote: Enumerating objects: 14, done.' },
      { type: 'output',  text: 'remote: Counting objects: 100% (14/14), done.' },
      { type: 'output',  text: 'Unpacking objects: 100% (14/14), done.' },
      { type: 'cmd',     text: 'git checkout main && git pull origin main' },
      { type: 'output',  text: 'Already on \'main\'' },
      { type: 'output',  text: 'HEAD is now at a3f8b2c — Update exam config' },
      { type: 'success', text: '✔ Repository pulled successfully in 12s' },
    ]
  },
  {
    id: 'build',
    icon: '🐳',
    name: 'Build Docker Image',
    status: 'success',
    duration: '1m 45s',
    extra: null,
    logs: [
      { type: 'cmd',    text: 'docker build -t examcloud/student-env:latest .' },
      { type: 'output', text: 'Step 1/12 : FROM ubuntu:22.04' },
      { type: 'output', text: 'Step 2/12 : RUN apt-get update && apt-get install -y python3 python3-pip' },
      { type: 'output', text: 'Step 4/12 : COPY requirements.txt .' },
      { type: 'output', text: 'Step 5/12 : RUN pip3 install -r requirements.txt' },
      { type: 'output', text: 'Step 9/12 : COPY . /exam-workspace' },
      { type: 'output', text: 'Step 12/12 : CMD ["/bin/bash"]' },
      { type: 'success', text: '✔ Image built: examcloud/student-env:latest (1m 45s)' },
      { type: 'output', text: 'Image size: 847MB · Layers: 12' },
    ]
  },
  {
    id: 'containers',
    icon: '📦',
    name: 'Create Containers',
    status: 'success',
    duration: '45s',
    extra: '50/50 containers',
    logs: [
      { type: 'cmd',    text: 'docker-compose up -d --scale student=50' },
      { type: 'output', text: 'Creating network examcloud_default ... done' },
      { type: 'output', text: 'Creating examcloud_student_1  ... done' },
      { type: 'output', text: 'Creating examcloud_student_10 ... done' },
      { type: 'output', text: 'Creating examcloud_student_25 ... done' },
      { type: 'output', text: 'Creating examcloud_student_50 ... done' },
      { type: 'success', text: '✔ 50/50 containers created successfully (45s)' },
    ]
  },
  {
    id: 'network',
    icon: '🌐',
    name: 'Configure Network',
    status: 'success',
    duration: '18s',
    extra: null,
    logs: [
      { type: 'cmd',    text: './scripts/configure-network.sh --mode=isolated' },
      { type: 'output', text: 'Setting up virtual network bridges...' },
      { type: 'output', text: 'Assigning IP range: 172.20.0.0/16' },
      { type: 'output', text', text: 'Applying iptables isolation rules...' },
      { type: 'output', text: 'Blocking inter-container traffic (exam isolation)' },
      { type: 'output', text: 'DNS configured: 172.20.0.1' },
      { type: 'success', text: '✔ Network configured: fully isolated (18s)' },
    ]
  },
  {
    id: 'health',
    icon: '💚',
    name: 'Health Check',
    status: 'success',
    duration: '22s',
    extra: 'All green',
    logs: [
      { type: 'cmd',    text: './scripts/healthcheck.sh --all-containers' },
      { type: 'output', text: '[■■■■■■■■■■] 50/50 containers checked' },
      { type: 'output', text: 'ctn-001: HTTP 200 OK — 45ms' },
      { type: 'output', text: 'ctn-002: HTTP 200 OK — 38ms' },
      { type: 'output', text: '... (48 more containers)' },
      { type: 'output', text: 'ctn-050: HTTP 200 OK — 52ms' },
      { type: 'success', text: '✔ 50/50 health checks passed — all systems green (22s)' },
    ]
  },
  {
    id: 'start',
    icon: '🚀',
    name: 'Start Exam',
    status: 'running',
    duration: '1m 23s',
    extra: null,
    logs: [
      { type: 'cmd',    text: './scripts/start-exam.sh --exam-id=PY2024B' },
      { type: 'output', text: 'Loading exam configuration: Python Lab — Batch B' },
      { type: 'output', text: 'Distributing question set to 50 containers...' },
      { type: 'output', text: 'Enabling student submission endpoints...' },
      { type: 'output', text: 'Starting exam timer: 2h 30m 00s' },
      { type: 'output', text: '→ Registering student sessions... 48/50 joined' },
      { type: 'output', text: '→ Waiting for remaining students...' },
    ]
  },
  {
    id: 'cleanup',
    icon: '🧹',
    name: 'Cleanup',
    status: 'pending',
    duration: '--',
    extra: null,
    logs: [
      { type: 'output', text: 'Waiting for exam completion before cleanup...' },
    ]
  },
];

/* ══════════════════════════════════════════════
   BUILD HISTORY DATA
══════════════════════════════════════════════ */
const BUILD_HISTORY = [
  { num: 247, exam: 'Python Lab — Batch B',   trigger: 'Manual',    status: 'running',  duration: '~4m 32s', date: '2026-05-20 09:41' },
  { num: 246, exam: 'Python Lab — Batch A',   trigger: 'Webhook',   status: 'success',  duration: '4m 18s',  date: '2026-05-20 07:00' },
  { num: 245, exam: 'Data Structures Quiz',   trigger: 'Scheduled', status: 'success',  duration: '3m 52s',  date: '2026-05-19 14:30' },
  { num: 244, exam: 'OS Lab Practical',       trigger: 'Manual',    status: 'failed',   duration: '2m 14s',  date: '2026-05-19 10:15' },
  { num: 243, exam: 'Database Midterm',       trigger: 'Webhook',   status: 'success',  duration: '4m 07s',  date: '2026-05-18 09:00' },
  { num: 242, exam: 'Algo Design Test',       trigger: 'Manual',    status: 'success',  duration: '4m 31s',  date: '2026-05-17 15:00' },
  { num: 241, exam: 'Python Lab — Batch C',   trigger: 'Scheduled', status: 'success',  duration: '4m 22s',  date: '2026-05-17 07:00' },
  { num: 240, exam: 'Networking Fundamentals',trigger: 'Webhook',   status: 'failed',   duration: '1m 05s',  date: '2026-05-16 11:30' },
  { num: 239, exam: 'Cloud Computing Quiz',   trigger: 'Manual',    status: 'success',  duration: '4m 44s',  date: '2026-05-15 13:00' },
  { num: 238, exam: 'Linux Admin Practical',  trigger: 'Scheduled', status: 'success',  duration: '5m 01s',  date: '2026-05-14 09:00' },
];

/* ══════════════════════════════════════════════
   STAGE LOGS MAPPING (fix typo in network)
══════════════════════════════════════════════ */
// Fix typo in stage data
PIPELINE_STAGES[3].logs = [
  { type: 'cmd',     text: './scripts/configure-network.sh --mode=isolated' },
  { type: 'output',  text: 'Setting up virtual network bridges...' },
  { type: 'output',  text: 'Assigning IP range: 172.20.0.0/16' },
  { type: 'output',  text: 'Applying iptables isolation rules...' },
  { type: 'output',  text: 'Blocking inter-container traffic (exam isolation)' },
  { type: 'output',  text: 'DNS configured: 172.20.0.1' },
  { type: 'success', text: '✔ Network configured: fully isolated (18s)' },
];

/* ══════════════════════════════════════════════
   RENDER PIPELINE STAGES
══════════════════════════════════════════════ */
function renderPipeline() {
  const flow = document.getElementById('pipeline-flow');
  flow.innerHTML = '';

  PIPELINE_STAGES.forEach((stage, idx) => {
    // Stage node
    const node = document.createElement('div');
    node.className = 'stage-node';
    node.id = `stage-node-${stage.id}`;
    node.onclick = () => openStageLogs(stage);

    const spinner = stage.status === 'running'
      ? `<div class="stage-spinner"></div>`
      : '';

    const extraHTML = stage.extra
      ? `<div class="stage-extra">${stage.extra}</div>`
      : '';

    node.innerHTML = `
      <div class="stage-box ${stage.status}" id="stage-box-${stage.id}">
        <div class="stage-icon-wrap">${stage.icon}</div>
        <div class="stage-name">${stage.name}</div>
        <div class="stage-status-text ${stage.status}">${stage.status.toUpperCase()}</div>
        ${spinner}
        <div class="stage-duration">${stage.duration}</div>
        ${extraHTML}
      </div>
    `;
    flow.appendChild(node);

    // Arrow between stages
    if (idx < PIPELINE_STAGES.length - 1) {
      const arrow = document.createElement('div');
      const isPending = stage.status === 'pending' ||
        PIPELINE_STAGES[idx + 1].status === 'pending';
      arrow.className = `pipeline-arrow${isPending ? ' pending' : ''}`;
      arrow.id = `arrow-${idx}`;
      arrow.innerHTML = `
        <div class="pipeline-arrow-line"></div>
        <div class="pipeline-arrow-head"></div>
      `;
      flow.appendChild(arrow);
    }
  });
}

/* ══════════════════════════════════════════════
   ANIMATE STAGES ON LOAD
══════════════════════════════════════════════ */
function animateStages(startDelay = 0) {
  const nodes = document.querySelectorAll('.stage-node');
  const arrows = document.querySelectorAll('.pipeline-arrow');

  nodes.forEach((node, idx) => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(20px)';
    node.style.transition = 'none';
  });
  arrows.forEach(a => {
    a.style.opacity = '0';
    a.style.transition = 'none';
  });

  nodes.forEach((node, idx) => {
    setTimeout(() => {
      node.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
      node.style.opacity = '1';
      node.style.transform = 'translateY(0)';
    }, startDelay + idx * 160);
  });

  arrows.forEach((arrow, idx) => {
    setTimeout(() => {
      arrow.style.transition = 'opacity 0.4s ease';
      arrow.style.opacity = '1';
    }, startDelay + idx * 160 + 100);
  });
}

/* ══════════════════════════════════════════════
   STAGE LOGS PANEL
══════════════════════════════════════════════ */
let currentOpenStage = null;

function openStageLogs(stage) {
  const panel = document.getElementById('stage-logs-panel');
  const body = document.getElementById('terminal-body');
  const title = document.getElementById('log-title');

  if (currentOpenStage === stage.id && panel.classList.contains('open')) {
    closeLogPanel();
    return;
  }

  currentOpenStage = stage.id;
  title.textContent = `${stage.icon} ${stage.name} — Logs`;
  body.innerHTML = '';
  panel.classList.add('open');

  // Typewriter-style log reveal
  stage.logs.forEach((line, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = `terminal-line`;

      if (line.type === 'cmd') {
        el.innerHTML = `<span class="terminal-prompt">$</span><span class="terminal-cmd"> ${escapeHTML(line.text)}</span>`;
      } else if (line.type === 'success') {
        el.innerHTML = `<span class="terminal-success">${escapeHTML(line.text)}</span>`;
      } else if (line.type === 'error') {
        el.innerHTML = `<span class="terminal-error">${escapeHTML(line.text)}</span>`;
      } else {
        el.innerHTML = `<span class="terminal-output">${escapeHTML(line.text)}</span>`;
      }

      body.appendChild(el);
      body.scrollTop = body.scrollHeight;

      // Add blinking cursor after last line
      if (i === stage.logs.length - 1 && stage.status === 'running') {
        const cursor = document.createElement('span');
        cursor.className = 'terminal-cursor';
        el.appendChild(cursor);
      }
    }, i * 120);
  });

  // Scroll panel into view
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeLogPanel() {
  document.getElementById('stage-logs-panel').classList.remove('open');
  currentOpenStage = null;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ══════════════════════════════════════════════
   TRIGGER NEW BUILD
══════════════════════════════════════════════ */
let buildNumber = 247;

function triggerNewBuild() {
  buildNumber++;

  // Update UI
  const btn = document.getElementById('trigger-btn');
  btn.disabled = true;
  btn.innerHTML = `<div class="spinner spinner-sm" style="border-color:rgba(0,0,0,0.2); border-top-color:#000;"></div> Building...`;

  // Update topbar
  document.querySelector('.build-number span').textContent = `#${buildNumber}`;

  // Update header badge to RUNNING
  setStatusBadge('running');

  // Close logs panel
  closeLogPanel();

  // Temporarily set all stages to pending for animation
  const prevStatuses = PIPELINE_STAGES.map(s => s.status);
  PIPELINE_STAGES.forEach(s => { s.status = 'pending'; });
  renderPipeline();
  animateStages(100);

  // Toast
  showToast('info', `🚀 Build #${buildNumber} triggered by Admin`);

  // Simulate pipeline progression
  const delays = [0, 1800, 4200, 6000, 7200, 8600, 10500];
  const finalStatuses = ['success','success','success','success','success','running','pending'];

  finalStatuses.forEach((status, idx) => {
    setTimeout(() => {
      PIPELINE_STAGES[idx].status = status;
      const box = document.getElementById(`stage-box-${PIPELINE_STAGES[idx].id}`);
      if (box) {
        box.className = `stage-box ${status}`;
        const statusEl = box.querySelector('.stage-status-text');
        if (statusEl) {
          statusEl.className = `stage-status-text ${status}`;
          statusEl.textContent = status.toUpperCase();
        }
        // Add spinner for running
        const existingSpinner = box.querySelector('.stage-spinner');
        if (existingSpinner) existingSpinner.remove();
        if (status === 'running') {
          const sp = document.createElement('div');
          sp.className = 'stage-spinner';
          statusEl.after(sp);
        }
        // Update arrows
        if (idx < PIPELINE_STAGES.length - 1) {
          const arrow = document.getElementById(`arrow-${idx}`);
          if (arrow && status === 'success') {
            arrow.classList.remove('pending');
          }
        }
      }
    }, delays[idx] + 200);
  });

  // Re-enable button and update status
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg> Trigger New Build`;

    // Add to history
    BUILD_HISTORY.unshift({
      num: buildNumber,
      exam: 'Python Lab — Batch B',
      trigger: 'Manual',
      status: 'running',
      duration: '~0m 00s',
      date: new Date().toLocaleString('en-GB', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }).replace(',','')
    });
    renderBuildHistory();
    showToast('success', `✔ Build #${buildNumber} pipeline started successfully`);
  }, 1500);
}

function setStatusBadge(status) {
  const badges = [
    document.getElementById('topbar-status-badge'),
    document.getElementById('header-status-badge')
  ];
  const map = {
    success: { text: 'SUCCESS', cls: '' },
    running: { text: 'RUNNING', cls: 'running' },
    failed:  { text: 'FAILED', cls: 'failed' },
    pending: { text: 'PENDING', cls: 'pending' },
  };
  const conf = map[status] || map.success;
  badges.forEach(b => {
    if (!b) return;
    b.className = `build-badge ${conf.cls}`;
    b.innerHTML = `<div class="dot"></div>${conf.text}`;
  });
}

/* ══════════════════════════════════════════════
   BUILD HISTORY TABLE
══════════════════════════════════════════════ */
function renderBuildHistory() {
  const tbody = document.getElementById('history-tbody');
  tbody.innerHTML = '';

  BUILD_HISTORY.slice(0, 10).forEach(build => {
    const statusMap = {
      success: { cls: 'badge-green', icon: '✔' },
      failed:  { cls: 'badge-red',   icon: '✘' },
      running: { cls: 'badge-cyan',  icon: '⟳' },
    };
    const s = statusMap[build.status] || statusMap.success;

    const triggerIcons = { Manual: '🖱️', Webhook: '🔔', Scheduled: '🕐' };

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <span style="font-family:var(--font-mono); color:var(--cyan); font-weight:700;">#${build.num}</span>
      </td>
      <td style="color:var(--text-primary); font-weight:500;">${build.exam}</td>
      <td>
        <span style="display:flex; align-items:center; gap:5px;">
          ${triggerIcons[build.trigger] || '⚙️'}
          <span style="font-size:var(--text-xs);">${build.trigger}</span>
        </span>
      </td>
      <td>
        <span class="badge ${s.cls}">${s.icon} ${build.status.toUpperCase()}</span>
      </td>
      <td style="font-family:var(--font-mono); font-size:var(--text-xs);">${build.duration}</td>
      <td style="font-family:var(--font-mono); font-size:var(--text-xs); color:var(--text-muted);">${build.date}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* ══════════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════════ */
function showToast(type, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideInToast 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderPipeline();
  animateStages(300);
  renderBuildHistory();
});
