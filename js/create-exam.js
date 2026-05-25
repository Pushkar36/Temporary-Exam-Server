// create-exam.js — Wizard Navigation (fixed)

var currentStep = 1;
var TOTAL_STEPS = 4;

// ── Called by onclick in HTML — must be on window ──────────────
window.goNext = function() {
  if (!validateStep(currentStep)) return;
  if (currentStep < TOTAL_STEPS) {
    currentStep++;
    renderStep();
    if (currentStep === TOTAL_STEPS) populateReview();
  }
};

window.goBack = function() {
  if (currentStep > 1) {
    currentStep--;
    renderStep();
  }
};

window.changeStudentCount = function(delta) {
  var inp = document.getElementById('maxStudents');
  if (!inp) return;
  var val = (parseInt(inp.value) || 1) + delta;
  val = Math.max(1, Math.min(200, val));
  inp.value = val;
  updatePreview();
  updateCostEstimate();
};

window.triggerLaunch = async function() {
  // Save exam to database first
  var nameEl = document.getElementById('examName');
  var langEl = document.getElementById('examLang');
  var hoursEl = document.getElementById('durationHours');
  var minsEl = document.getElementById('durationMins');
  var countEl = document.getElementById('maxStudents');
  var diffRadio = document.querySelector('input[name="difficulty"]:checked');
  var instructionsEl = document.getElementById('examInstructions');
  var starterCodeEl = document.getElementById('starterCode');

  var examName = (nameEl && nameEl.value) ? nameEl.value.trim() : 'Untitled Exam';
  var language = (langEl && langEl.value) ? langEl.value : 'python';
  var hours = parseInt((hoursEl && hoursEl.value) || '2');
  var mins = parseInt((minsEl && minsEl.value) || '0');
  var durationMinutes = hours * 60 + mins;
  var maxStudents = parseInt((countEl && countEl.value) || '45');
  var difficulty = diffRadio ? diffRadio.value : 'medium';
  var instructions = instructionsEl ? instructionsEl.value.trim() : '';
  var starterCode = starterCodeEl ? starterCodeEl.value : '';

  try {
    var resp = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exam_name: examName,
        language: language,
        duration_minutes: durationMinutes,
        max_students: maxStudents,
        difficulty: difficulty,
        instructions: instructions,
        starter_code: starterCode
      })
    });
    var data = await resp.json();
    if (data.success && data.data) {
      showToast('success', '✅ Exam saved! Access Code: ' + data.data.access_code);
      // Store for reference
      localStorage.setItem('examcloud_last_exam', JSON.stringify(data.data));
    } else {
      showToast('error', data.error || 'Failed to save exam');
    }
  } catch (err) {
    showToast('warning', '⚠ Could not save to server: ' + err.message);
  }

  // Proceed with launch animation
  var overlay = document.getElementById('launchOverlay');
  if (overlay) overlay.classList.add('visible');

  var stages = [
    { id: 'stage-0', delay: 0,    dur: 700  },
    { id: 'stage-1', delay: 700,  dur: 1200 },
    { id: 'stage-2', delay: 1900, dur: 1500 },
    { id: 'stage-3', delay: 3400, dur: 800  },
    { id: 'stage-4', delay: 4200, dur: 600  },
    { id: 'stage-5', delay: 4800, dur: 500  }
  ];

  var fill = document.getElementById('launchProgressFill');
  var text = document.getElementById('launchProgressText');

  stages.forEach(function(s, idx) {
    setTimeout(function() {
      var el = document.getElementById(s.id);
      if (!el) return;
      el.classList.add('running');
      var icon = el.querySelector('.stage-status-icon');
      if (icon) icon.innerHTML = '<div class="launch-stage-spinner"></div>';
      var pct = Math.round((idx / stages.length) * 100);
      if (fill) fill.style.width = pct + '%';
      if (text) text.textContent = pct + '% — Running...';
    }, s.delay);

    setTimeout(function() {
      var el = document.getElementById(s.id);
      if (!el) return;
      el.classList.remove('running');
      el.classList.add('done');
      var icon = el.querySelector('.stage-status-icon');
      if (icon) icon.innerHTML = '&#10003;';
      var pct = Math.round(((idx + 1) / stages.length) * 100);
      if (fill) fill.style.width = pct + '%';
      if (text) text.textContent = pct + '% complete';
    }, s.delay + s.dur);
  });

  setTimeout(function() {
    window.location.href = 'monitor.html';
  }, 6500);
};

window.copyComposeYaml = function() {
  var el = document.getElementById('composePreview');
  if (!el) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(el.innerText).then(function() {
      showToast('success', 'YAML copied to clipboard!');
    });
  }
};

// ── RENDER STEP ────────────────────────────────────────────────
function renderStep() {
  // Show/hide panels
  document.querySelectorAll('.step-panel').forEach(function(panel, idx) {
    if (idx + 1 === currentStep) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update tracker items
  document.querySelectorAll('.step-item').forEach(function(item, idx) {
    var stepNum = idx + 1;
    item.classList.remove('active', 'completed');
    if (stepNum === currentStep) item.classList.add('active');
    if (stepNum < currentStep)   item.classList.add('completed');

    var numEl = item.querySelector('.step-num');
    if (numEl) {
      if (stepNum < currentStep) {
        numEl.innerHTML = '&#10003;';
      } else {
        numEl.textContent = String(stepNum);
      }
    }
  });

  // Nav footer
  var navSpan = document.getElementById('navCurrentStep');
  if (navSpan) navSpan.textContent = String(currentStep);

  var btnBack = document.getElementById('btnBack');
  var btnNext = document.getElementById('btnNext');

  if (btnBack) {
    btnBack.style.display = currentStep > 1 ? 'inline-flex' : 'none';
  }
  if (btnNext) {
    btnNext.style.display = currentStep === TOTAL_STEPS ? 'none' : 'inline-flex';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── VALIDATE STEP ──────────────────────────────────────────────
function validateStep(step) {
  if (step === 1) {
    var examName = document.getElementById('examName');
    var examLang = document.getElementById('examLang');
    var valid = true;

    if (!examName || !examName.value.trim()) {
      if (examName) examName.classList.add('error');
      var errEl = document.getElementById('examNameError');
      if (errEl) errEl.classList.remove('hidden');
      showToast('error', 'Exam name is required.');
      valid = false;
    } else {
      if (examName) examName.classList.remove('error');
      var errEl2 = document.getElementById('examNameError');
      if (errEl2) errEl2.classList.add('hidden');
    }

    if (!examLang || !examLang.value) {
      if (examLang) examLang.classList.add('error');
      if (valid) showToast('error', 'Please select a programming language.');
      valid = false;
    } else {
      if (examLang) examLang.classList.remove('error');
    }

    return valid;
  }
  return true;
}

// ── TOAST ──────────────────────────────────────────────────────
function showToast(type, message) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
  }, 3500);
}

// ── LIVE PREVIEW ───────────────────────────────────────────────
function updatePreview() {
  var nameEl  = document.getElementById('examName');
  var langEl  = document.getElementById('examLang');
  var hoursEl = document.getElementById('durationHours');
  var minsEl  = document.getElementById('durationMins');
  var countEl = document.getElementById('maxStudents');

  var prevTitle    = document.getElementById('prevTitle');
  var prevDuration = document.getElementById('prevDuration');
  var prevStudents = document.getElementById('prevStudents');
  var prevLang     = document.getElementById('prevLang');

  if (prevTitle && nameEl)
    prevTitle.textContent = nameEl.value.trim() || 'Your Exam Title\u2026';

  if (prevDuration && hoursEl && minsEl) {
    var h = parseInt(hoursEl.value) || 0;
    var m = parseInt(minsEl.value)  || 0;
    prevDuration.textContent = (h || m) ? h + 'h ' + m + 'm' : '\u2014 h \u2014 min';
  }

  if (prevStudents && countEl)
    prevStudents.textContent = (countEl.value || '0') + ' students';

  var langNames = {
    python: 'Python 3.11', java: 'Java 17',
    cpp: 'C++ (GCC)', nodejs: 'Node.js 18',
    ruby: 'Ruby', go: 'Go'
  };
  if (prevLang && langEl)
    prevLang.textContent = langNames[langEl.value] || '\u2014 language \u2014';

  // Container dots
  var viz   = document.getElementById('containerViz');
  var count = parseInt((countEl && countEl.value) || '0');
  if (viz) {
    viz.innerHTML = '';
    var show = Math.min(count, 60);
    for (var i = 0; i < show; i++) {
      var dot = document.createElement('div');
      dot.className = 'container-dot';
      viz.appendChild(dot);
    }
  }
  var labelEl = document.getElementById('containerVizLabel');
  if (labelEl) labelEl.textContent = String(count);
}

// ── COST ESTIMATE ──────────────────────────────────────────────
function updateCostEstimate() {
  var count   = parseInt((document.getElementById('maxStudents')   || {}).value)   || 45;
  var ramMB   = parseInt((document.getElementById('ramSlider')     || {}).value)   || 1024;
  var cpuRaw  = parseInt((document.getElementById('cpuSlider')     || {}).value)   || 2;
  var storage = parseInt((document.getElementById('storageSlider') || {}).value)   || 5;
  var ramGB   = ramMB / 1024;
  var cpuVal  = cpuRaw * 0.5;

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  setText('ramVal',          ramGB < 1 ? ramMB + ' MB' : ramGB + ' GB');
  setText('cpuVal',          String(cpuVal));
  setText('storageVal',      storage + ' GB');
  setText('costContainers',  String(count));
  setText('costRam',         ramGB < 1 ? ramMB + ' MB' : ramGB + ' GB');
  setText('costCpu',         cpuVal + ' cores');
  setText('costStorage',     storage + ' GB');
  setText('costTotalRam',    (count * ramGB).toFixed(1) + ' GB');
  setText('costTotalStorage', (count * storage) + ' GB');

  var net = document.getElementById('networkToggle');
  setText('costNetwork', (net && net.checked) ? 'Enabled' : 'Disabled');

  function setBar(barId, valId, pct, txt) {
    var b = document.getElementById(barId);
    if (b) b.style.width = pct + '%';
    var v = document.getElementById(valId);
    if (v) v.textContent = txt;
  }
  setBar('ramBar',     'ramBarVal',     (ramGB / 4) * 100,    ramGB < 1 ? ramMB + 'MB' : ramGB + 'GB');
  setBar('cpuBar',     'cpuBarVal',     (cpuVal / 4) * 100,   String(cpuVal));
  setBar('storageBar', 'storageBarVal', (storage / 20) * 100, storage + 'GB');
}

// ── LANGUAGE BADGE ─────────────────────────────────────────────
function updateLangBadge() {
  var langEl = document.getElementById('examLang');
  var badge  = document.getElementById('langBadgePreview');
  if (!langEl || !badge) return;

  var colors = {
    python: { bg: 'rgba(59,130,246,0.15)',  color: '#60a5fa', label: '\uD83D\uDC0D Python 3.11' },
    java:   { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24', label: '\u2615 Java 17' },
    cpp:    { bg: 'rgba(124,58,237,0.15)',  color: '#a78bfa', label: '\u2699\uFE0F C++ GCC' },
    nodejs: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: '\uD83D\uDFE2 Node.js 18' },
    ruby:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', label: '\uD83D\uDC8E Ruby' },
    go:     { bg: 'rgba(0,212,255,0.15)',  color: '#00d4ff', label: '\uD83D\uDD35 Go' }
  };

  var cfg = colors[langEl.value];
  if (cfg) {
    badge.style.cssText = 'background:' + cfg.bg + ';color:' + cfg.color + ';border:1px solid ' + cfg.color + '40;padding:4px 12px;border-radius:999px;font-size:0.75rem;font-weight:600;';
    badge.textContent = cfg.label;
  } else {
    badge.innerHTML = '<span class="badge badge-ghost">\u2014 none \u2014</span>';
  }

  var editorBadge = document.getElementById('editorLangBadge');
  if (editorBadge && cfg) editorBadge.textContent = cfg.label;

  updatePreview();
}

// ── PACKAGE TAGS ───────────────────────────────────────────────
function initPackageTags() {
  var input     = document.getElementById('pkgInput');
  var container = document.getElementById('tagContainer');
  if (!input || !container) return;

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      var val = input.value.trim().replace(/,$/, '');
      if (val) addTag(val);
      input.value = '';
    }
    if (e.key === 'Backspace' && !input.value) {
      var last = container.querySelector('.pkg-tag:last-of-type');
      if (last) last.remove();
    }
  });

  container.addEventListener('click', function(e) {
    if (e.target.classList.contains('tag-remove')) {
      e.target.closest('.pkg-tag').remove();
    }
    input.focus();
  });
}

function addTag(name) {
  var container = document.getElementById('tagContainer');
  var input     = document.getElementById('pkgInput');
  if (!container || !input) return;
  var tag = document.createElement('span');
  tag.className = 'pkg-tag';
  tag.innerHTML = name + '<button type="button" class="tag-remove">\u00D7</button>';
  container.insertBefore(tag, input);
}

// ── DROP ZONE ──────────────────────────────────────────────────
function initDropZone() {
  var zone = document.getElementById('csvDropZone');
  if (!zone) return;
  zone.addEventListener('dragover',  function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', function()  { zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    zone.classList.remove('drag-over');
    var file = e.dataTransfer.files[0];
    if (file) handleCsvFile(file);
  });
  var fi = zone.querySelector('input[type="file"]');
  if (fi) fi.addEventListener('change', function(e) {
    if (e.target.files[0]) handleCsvFile(e.target.files[0]);
  });
}

function handleCsvFile(file) {
  var fb = document.getElementById('uploadFeedback');
  var fn = document.getElementById('uploadFilename');
  if (fb) fb.classList.add('visible');
  if (fn) fn.textContent = file.name;
  showToast('success', '"' + file.name + '" uploaded successfully!');
}

// ── REVIEW PAGE ────────────────────────────────────────────────
function populateReview() {
  function getVal(id) {
    var el = document.getElementById(id);
    return el ? el.value : '';
  }
  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  var langMap = { python: 'Python 3.11', java: 'Java 17', cpp: 'C++ (GCC)', nodejs: 'Node.js 18', ruby: 'Ruby', go: 'Go' };
  var h       = parseInt(getVal('durationHours')) || 0;
  var m       = parseInt(getVal('durationMins'))  || 0;
  var ramMB   = parseInt(getVal('ramSlider'))     || 1024;
  var cpuRaw  = parseInt(getVal('cpuSlider'))     || 2;
  var storage = parseInt(getVal('storageSlider')) || 5;
  var count   = parseInt(getVal('maxStudents'))   || 45;
  var ramGB   = ramMB / 1024;
  var cpuVal  = cpuRaw * 0.5;

  var diffRadio = document.querySelector('input[name="difficulty"]:checked');
  var uploadEl  = document.getElementById('allowUpload');
  var solutionEl = document.getElementById('showSolution');

  setText('rev-name',         getVal('examName') || '\u2014');
  setText('rev-lang',         langMap[getVal('examLang')] || '\u2014');
  setText('rev-duration',     h + 'h ' + m + 'm');
  setText('rev-students',     count + ' students');
  setText('rev-difficulty',   diffRadio ? diffRadio.value : '\u2014');
  setText('rev-start',        getVal('schedStart') || 'Not scheduled');
  setText('rev-upload',       (uploadEl && uploadEl.checked) ? 'Enabled' : 'Disabled');
  setText('rev-solution',     (solutionEl && solutionEl.checked) ? 'Enabled' : 'Disabled');
  setText('rev-image',        getVal('baseImage') || 'python:3.11-slim');
  setText('rev-ram',          ramGB < 1 ? ramMB + ' MB' : ramGB + ' GB');
  setText('rev-cpu',          cpuVal + ' cores');
  setText('rev-storage',      storage + ' GB');
  setText('rev-network',      (document.getElementById('networkToggle') || {}).checked ? 'Enabled' : 'Disabled');
  setText('rev-totalram',     (count * ramGB).toFixed(1) + ' GB');
  setText('rev-totalstorage', (count * storage) + ' GB');

  var tags = document.querySelectorAll('.pkg-tag');
  var pkgs = [];
  tags.forEach(function(t) { pkgs.push(t.textContent.replace('\u00D7', '').trim()); });
  setText('rev-packages', pkgs.length ? pkgs.join(', ') : 'None');

  // Mini containers
  var mini  = document.getElementById('miniContainers');
  var names = ['Rahul Sharma', 'Priya Patel', 'Arjun Singh'];
  if (mini) {
    var html = '';
    names.forEach(function(n, i) {
      html += '<div class="mini-container-card">'
            + '<div class="mini-container-name">' + n + '</div>'
            + '<div class="mini-container-id">ctn-' + String(i + 1).padStart(3, '0') + '</div>'
            + '<div class="mini-container-status"><div class="status-pulse"></div> Ready</div>'
            + '</div>';
    });
    mini.innerHTML = html;
  }

  var totalEl = document.getElementById('containerTotalCount');
  if (totalEl) totalEl.textContent = String(count);

  // YAML preview (plain text, no template literals with HTML)
  var composeEl = document.getElementById('composePreview');
  var lang      = getVal('examLang') || 'python';
  var imgMap    = { python: 'python:3.11-slim', java: 'openjdk:17', cpp: 'gcc:latest', nodejs: 'node:18-alpine', ruby: 'ruby:3.2-slim', go: 'golang:1.21-alpine' };
  var img       = imgMap[lang] || 'python:3.11-slim';
  var examName  = getVal('examName') || 'Exam';

  if (composeEl) {
    var yaml = '';
    yaml += '<span class="tc-comment"># docker-compose.yml for "' + examName + '"</span>\n';
    yaml += '<span class="tc-comment"># Students: ' + count + ' | ' + (langMap[lang] || 'Python') + '</span>\n\n';
    yaml += '<span class="tc-key">version:</span> <span class="tc-str">\'3.8\'</span>\n';
    yaml += '<span class="tc-key">services:</span>\n';
    yaml += '  <span class="tc-key">student-1:</span>\n';
    yaml += '    <span class="tc-key">image:</span> <span class="tc-str">' + img + '</span>\n';
    yaml += '    <span class="tc-key">container_name:</span> <span class="tc-str">ctn-001</span>\n';
    yaml += '    <span class="tc-key">ports:</span>\n';
    yaml += '      - <span class="tc-str">"8001:8080"</span>\n';
    yaml += '    <span class="tc-key">environment:</span>\n';
    yaml += '      - <span class="tc-str">STUDENT_ID=STU001</span>\n';
    yaml += '      - <span class="tc-str">EXAM_ID=EXAM_001</span>\n';
    yaml += '    <span class="tc-key">deploy:</span>\n';
    yaml += '      <span class="tc-key">resources:</span>\n';
    yaml += '        <span class="tc-key">limits:</span>\n';
    yaml += '          <span class="tc-key">cpus:</span> <span class="tc-str">\'' + cpuVal + '\'</span>\n';
    yaml += '          <span class="tc-key">memory:</span> <span class="tc-str">' + ramMB + 'M</span>\n';
    yaml += '    <span class="tc-key">networks:</span>\n';
    yaml += '      - <span class="tc-str">exam-net</span>\n';
    yaml += '  <span class="tc-comment"># ... ' + (count - 1) + ' more containers auto-generated</span>\n\n';
    yaml += '<span class="tc-key">networks:</span>\n';
    yaml += '  <span class="tc-key">exam-net:</span>\n';
    yaml += '    <span class="tc-key">driver:</span> <span class="tc-str">bridge</span>';
    composeEl.innerHTML = yaml;
  }
}

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  renderStep();
  updatePreview();
  initPackageTags();
  initDropZone();
  updateLangBadge();
  updateCostEstimate();

  // Stepper +/- buttons
  var up   = document.getElementById('studentsUp');
  var down = document.getElementById('studentsDown');
  if (up)   up.addEventListener('click',   function() { window.changeStudentCount(1); });
  if (down) down.addEventListener('click', function() { window.changeStudentCount(-1); });

  // Live preview
  ['examName', 'examLang', 'durationHours', 'durationMins', 'maxStudents', 'schedStart'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener('input',  updatePreview);
      el.addEventListener('change', updatePreview);
    }
  });

  // Language badge
  var langEl = document.getElementById('examLang');
  if (langEl) langEl.addEventListener('change', updateLangBadge);

  // Sliders
  ['ramSlider', 'cpuSlider', 'storageSlider'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCostEstimate);
  });
  var netToggle = document.getElementById('networkToggle');
  if (netToggle) netToggle.addEventListener('change', updateCostEstimate);

  // Difficulty radios
  document.querySelectorAll('input[name="difficulty"]').forEach(function(r) {
    r.addEventListener('change', updatePreview);
  });

  // Clear errors on input
  var nameEl2 = document.getElementById('examName');
  if (nameEl2) nameEl2.addEventListener('input', function(e) {
    if (e.target.value.trim()) {
      e.target.classList.remove('error');
      var errEl = document.getElementById('examNameError');
      if (errEl) errEl.classList.add('hidden');
    }
  });
  var langEl2 = document.getElementById('examLang');
  if (langEl2) langEl2.addEventListener('change', function(e) {
    if (e.target.value) e.target.classList.remove('error');
  });
});
