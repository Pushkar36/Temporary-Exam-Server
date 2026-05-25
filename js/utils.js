/**
 * ============================================================
 * utils.js — Shared Utilities for Temporary Exam Server UI
 * Temporary Exam Server Generator | v1.0.0
 * ============================================================
 */

'use strict';

/* ============================================================
   1. TOAST NOTIFICATION SYSTEM
   ============================================================ */

/**
 * Shows a toast notification on screen.
 * @param {string} message - The message to display
 * @param {'success'|'error'|'warning'|'info'} type - Toast type
 * @param {number} [duration=4000] - Duration in ms before auto-dismiss
 */
function showToast(message, type = 'info', duration = 4000) {
  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colors = {
    success: { bg: 'rgba(0,212,127,0.12)', border: '#00d47f', text: '#00d47f' },
    error:   { bg: 'rgba(255,65,65,0.12)',  border: '#ff4141', text: '#ff6b6b' },
    warning: { bg: 'rgba(255,170,0,0.12)',  border: '#ffaa00', text: '#ffcc44' },
    info:    { bg: 'rgba(0,212,255,0.12)',  border: '#00d4ff', text: '#00d4ff' },
  };

  const c = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: ${c.bg};
    border: 1px solid ${c.border};
    border-radius: 10px;
    color: ${c.text};
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    min-width: 280px;
    max-width: 420px;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.4), 0 0 12px ${c.border}33;
    pointer-events: all;
    cursor: pointer;
    opacity: 0;
    transform: translateX(40px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  `;

  const icon = document.createElement('span');
  icon.style.fontSize = '18px';
  icon.textContent = icons[type] || icons.info;

  const text = document.createElement('span');
  text.style.flex = '1';
  text.textContent = message;

  const closeBtn = document.createElement('span');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    font-size: 20px;
    line-height: 1;
    opacity: 0.6;
    margin-left: 8px;
    transition: opacity 0.2s;
  `;
  closeBtn.addEventListener('mouseover', () => (closeBtn.style.opacity = '1'));
  closeBtn.addEventListener('mouseout',  () => (closeBtn.style.opacity = '0.6'));

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
  });

  const dismiss = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    setTimeout(() => toast.remove(), 350);
  };

  toast.addEventListener('click', dismiss);
  const timer = setTimeout(dismiss, duration);

  // Cancel auto-dismiss on hover
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', () => setTimeout(dismiss, 1500));
}


/* ============================================================
   2. MODAL HELPERS
   ============================================================ */

/**
 * Opens a modal by its ID.
 * @param {string} id - The modal element's ID
 */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) {
    console.warn(`[openModal] Modal with id "${id}" not found.`);
    return;
  }
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(id);
  }, { once: true });

  // Close on Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(id);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Animate in
  requestAnimationFrame(() => {
    modal.style.opacity = '1';
    const inner = modal.querySelector('.modal-inner, .modal-content');
    if (inner) {
      inner.style.transform = 'scale(1) translateY(0)';
      inner.style.opacity = '1';
    }
  });
}

/**
 * Closes a modal by its ID.
 * @param {string} id - The modal element's ID
 */
function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  const inner = modal.querySelector('.modal-inner, .modal-content');
  if (inner) {
    inner.style.transform = 'scale(0.95) translateY(-20px)';
    inner.style.opacity = '0';
  }
  modal.style.opacity = '0';

  setTimeout(() => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }, 250);
}


/* ============================================================
   3. FORMAT FUNCTIONS
   ============================================================ */

/**
 * Formats seconds into a human-readable time string.
 * @param {number} seconds
 * @returns {string} e.g. "1h 23m 45s" or "45:30"
 */
function formatTime(seconds, style = 'clock') {
  if (isNaN(seconds) || seconds < 0) return '00:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (style === 'human') {
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  }

  // Default: clock style
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Formats bytes into a human-readable size string.
 * @param {number} bytes
 * @param {number} [decimals=2]
 * @returns {string} e.g. "1.45 MB"
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  if (isNaN(bytes)) return 'N/A';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats a Date object or timestamp into a readable string.
 * @param {Date|string|number} date
 * @param {'short'|'long'|'relative'|'datetime'} [style='datetime']
 * @returns {string}
 */
function formatDate(date, style = 'datetime') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  if (style === 'relative') {
    const now = Date.now();
    const diff = now - d.getTime();
    const abs = Math.abs(diff);
    const future = diff < 0;

    const units = [
      { label: 'year',   ms: 31536000000 },
      { label: 'month',  ms: 2592000000  },
      { label: 'week',   ms: 604800000   },
      { label: 'day',    ms: 86400000    },
      { label: 'hour',   ms: 3600000     },
      { label: 'minute', ms: 60000       },
      { label: 'second', ms: 1000        },
    ];

    for (const unit of units) {
      const count = Math.floor(abs / unit.ms);
      if (count >= 1) {
        const label = `${count} ${unit.label}${count > 1 ? 's' : ''}`;
        return future ? `in ${label}` : `${label} ago`;
      }
    }
    return 'just now';
  }

  const opts = {
    short:    { month: 'short', day: 'numeric', year: 'numeric' },
    long:     { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    datetime: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  return d.toLocaleDateString('en-IN', opts[style] || opts.datetime);
}


/* ============================================================
   4. COUNTER ANIMATION
   ============================================================ */

/**
 * Animates a numeric counter from one value to another.
 * @param {HTMLElement} element - The DOM element to update
 * @param {number} from - Start value
 * @param {number} to - End value
 * @param {number} [duration=1200] - Animation duration in ms
 * @param {Function} [formatter] - Optional formatter function
 */
function animateCounter(element, from, to, duration = 1200, formatter = null) {
  if (!element) return;

  const startTime = performance.now();
  const diff = to - from;

  // Easing function: easeOutExpo
  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutExpo(progress);
    const current = Math.round(from + diff * eased);

    element.textContent = formatter ? formatter(current) : formatNumberWithCommas(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = formatter ? formatter(to) : formatNumberWithCommas(to);
    }
  };

  requestAnimationFrame(update);
}


/* ============================================================
   5. DROPDOWN TOGGLE HELPER
   ============================================================ */

/**
 * Toggles a dropdown menu.
 * @param {string|HTMLElement} triggerOrId - Trigger element or its ID
 * @param {string|HTMLElement} menuOrId - Menu element or its ID
 */
function toggleDropdown(triggerOrId, menuOrId) {
  const trigger = typeof triggerOrId === 'string'
    ? document.getElementById(triggerOrId)
    : triggerOrId;
  const menu = typeof menuOrId === 'string'
    ? document.getElementById(menuOrId)
    : menuOrId;

  if (!trigger || !menu) return;

  const isOpen = menu.classList.contains('open');

  // Close all other open dropdowns
  document.querySelectorAll('.dropdown-menu.open').forEach((m) => {
    if (m !== menu) m.classList.remove('open');
  });

  menu.classList.toggle('open', !isOpen);

  if (!isOpen) {
    // Close when clicking outside
    const outsideClick = (e) => {
      if (!trigger.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
        document.removeEventListener('click', outsideClick);
      }
    };
    setTimeout(() => document.addEventListener('click', outsideClick), 10);
  }
}

/**
 * Initializes all elements with [data-dropdown-trigger] attribute automatically.
 */
function initDropdowns() {
  document.querySelectorAll('[data-dropdown-trigger]').forEach((trigger) => {
    const menuId = trigger.getAttribute('data-dropdown-trigger');
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(trigger, menuId);
    });
  });
}


/* ============================================================
   6. LOCAL STORAGE HELPERS
   ============================================================ */

const Storage = {
  /**
   * Sets a value in localStorage with optional expiry.
   * @param {string} key
   * @param {*} value
   * @param {number} [ttlMs] - Time-to-live in milliseconds
   */
  set(key, value, ttlMs = null) {
    try {
      const item = { value };
      if (ttlMs) item.expiry = Date.now() + ttlMs;
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.error('[Storage.set] Error:', e);
    }
  },

  /**
   * Gets a value from localStorage, returns null if expired or missing.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const item = JSON.parse(raw);
      if (item.expiry && Date.now() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return item.value;
    } catch (e) {
      console.error('[Storage.get] Error:', e);
      return null;
    }
  },

  /**
   * Removes an item from localStorage.
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[Storage.remove] Error:', e);
    }
  },

  /**
   * Clears all localStorage entries with a given prefix.
   * @param {string} [prefix='exam_']
   */
  clearByPrefix(prefix = 'exam_') {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(prefix))
        .forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.error('[Storage.clearByPrefix] Error:', e);
    }
  },

  /**
   * Returns all keys matching a prefix.
   * @param {string} prefix
   * @returns {string[]}
   */
  keysByPrefix(prefix) {
    return Object.keys(localStorage).filter((k) => k.startsWith(prefix));
  },
};


/* ============================================================
   7. DEBOUNCE FUNCTION
   ============================================================ */

/**
 * Returns a debounced version of the given function.
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=300] - Delay in ms
 * @param {boolean} [leading=false] - Whether to trigger on leading edge
 * @returns {Function}
 */
function debounce(fn, delay = 300, leading = false) {
  let timer = null;
  return function (...args) {
    const context = this;
    const callNow = leading && !timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!leading) fn.apply(context, args);
    }, delay);
    if (callNow) fn.apply(context, args);
  };
}

/**
 * Returns a throttled version of the given function.
 * @param {Function} fn
 * @param {number} [limit=200]
 * @returns {Function}
 */
function throttle(fn, limit = 200) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}


/* ============================================================
   8. RANDOM INT GENERATOR
   ============================================================ */

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random float between min and max.
 * @param {number} min
 * @param {number} max
 * @param {number} [decimals=2]
 * @returns {number}
 */
function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

/**
 * Picks a random element from an array.
 * @param {Array} arr
 * @returns {*}
 */
function randomFrom(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * Shuffles an array in-place using Fisher-Yates.
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


/* ============================================================
   9. INDIAN STUDENT NAME GENERATOR
   ============================================================ */

const _INDIAN_FIRST_NAMES = [
  'Aarav', 'Aditya', 'Akash', 'Amit', 'Ananya', 'Anjali', 'Arjun', 'Aryan',
  'Deepa', 'Deepak', 'Divya', 'Gaurav', 'Harshita', 'Ishaan', 'Jatin',
  'Karan', 'Kavya', 'Kritika', 'Kunal', 'Lakshmi', 'Manish', 'Meera',
  'Mohit', 'Nandini', 'Neha', 'Nikhil', 'Nisha', 'Palak', 'Pankaj',
  'Pooja', 'Prateek', 'Priya', 'Rahul', 'Raj', 'Ravi', 'Ritesh', 'Rohit',
  'Sachin', 'Sandeep', 'Sanjay', 'Sanya', 'Shreya', 'Shubham', 'Simran',
  'Sneha', 'Sonam', 'Suresh', 'Tanvi', 'Uday', 'Varun', 'Vikram', 'Vikas',
  'Vishal', 'Vivek', 'Yash', 'Yogesh', 'Zara', 'Zia',
];

const _INDIAN_LAST_NAMES = [
  'Agarwal', 'Bose', 'Chandra', 'Chauhan', 'Chopra', 'Das', 'Desai',
  'Dubey', 'Dutta', 'Gandhi', 'Ghosh', 'Goswami', 'Gupta', 'Iyer',
  'Jain', 'Joshi', 'Kapoor', 'Kaur', 'Khan', 'Kumar', 'Malhotra',
  'Mehta', 'Menon', 'Mishra', 'Mukherjee', 'Nair', 'Patel', 'Pillai',
  'Rao', 'Reddy', 'Saxena', 'Seth', 'Sharma', 'Shukla', 'Singh',
  'Sinha', 'Srivastava', 'Tiwari', 'Trivedi', 'Varma', 'Verma', 'Yadav',
];

/**
 * Generates a random Indian student name.
 * @param {boolean} [withRollNumber=false] - Append a roll number
 * @returns {string|{name: string, rollNumber: string}}
 */
function generateStudentName(withRollNumber = false) {
  const first = randomFrom(_INDIAN_FIRST_NAMES);
  const last  = randomFrom(_INDIAN_LAST_NAMES);
  const name  = `${first} ${last}`;

  if (withRollNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    const roll = `${year}CS${String(randomInt(1001, 9999)).padStart(4, '0')}`;
    return { name, rollNumber: roll };
  }

  return name;
}

/**
 * Generates a list of unique student names.
 * @param {number} count
 * @returns {Array<{id: number, name: string, rollNumber: string}>}
 */
function generateStudentList(count) {
  const names = new Set();
  const result = [];

  while (result.length < count) {
    const { name, rollNumber } = generateStudentName(true);
    if (!names.has(name)) {
      names.add(name);
      result.push({ id: result.length + 1, name, rollNumber });
    }
  }

  return result;
}


/* ============================================================
   10. FORMAT NUMBERS WITH COMMAS (Indian/International)
   ============================================================ */

/**
 * Formats a number with commas (International style).
 * @param {number|string} num
 * @returns {string} e.g. "1,234,567"
 */
function formatNumberWithCommas(num) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-US');
}

/**
 * Formats a number using Indian numbering system (lakhs, crores).
 * @param {number} num
 * @returns {string} e.g. "12,34,567"
 */
function formatIndianNumber(num) {
  if (isNaN(num)) return '0';
  return Number(num).toLocaleString('en-IN');
}

/**
 * Abbreviates large numbers to short form.
 * @param {number} num
 * @returns {string} e.g. 1500 -> "1.5K", 1200000 -> "1.2M"
 */
function abbreviateNumber(num) {
  if (num >= 1e9)  return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6)  return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3)  return `${(num / 1e3).toFixed(1)}K`;
  return String(num);
}


/* ============================================================
   11. MISC DOM HELPERS
   ============================================================ */

/**
 * Copies text to clipboard and shows a toast notification.
 * @param {string} text
 * @param {string} [label='Text']
 */
async function copyToClipboard(text, label = 'Text') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success', 2000);
  } catch {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(`${label} copied!`, 'success', 2000);
  }
}

/**
 * Adds a CSS class temporarily (useful for animations).
 * @param {HTMLElement} el
 * @param {string} cls
 * @param {number} [duration=1000]
 */
function flashClass(el, cls, duration = 1000) {
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}

/**
 * Generates a UUID v4.
 * @returns {string}
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Generates a short readable exam ID (e.g. EXAM-2026-A3F7).
 * @returns {string}
 */
function generateExamId() {
  const year  = new Date().getFullYear();
  const part  = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EXAM-${year}-${part}`;
}

/**
 * Deep clones a JSON-serializable object.
 * @param {*} obj
 * @returns {*}
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a value is empty (null, undefined, '', [], {}).
 * @param {*} val
 * @returns {boolean}
 */
function isEmpty(val) {
  if (val === null || val === undefined) return true;
  if (typeof val === 'string') return val.trim() === '';
  if (Array.isArray(val)) return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

/**
 * Polls a condition function until it returns true or timeout is reached.
 * @param {Function} conditionFn - Should return true when ready
 * @param {number} [interval=500] - Polling interval in ms
 * @param {number} [timeout=30000] - Max wait time in ms
 * @returns {Promise<boolean>}
 */
function pollUntil(conditionFn, interval = 500, timeout = 30000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = setInterval(() => {
      if (conditionFn()) {
        clearInterval(check);
        resolve(true);
      } else if (Date.now() - start >= timeout) {
        clearInterval(check);
        resolve(false);
      }
    }, interval);
  });
}


/* ============================================================
   EXPORTS (for module environments / Node.js testing)
   ============================================================ */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showToast,
    openModal,
    closeModal,
    formatTime,
    formatBytes,
    formatDate,
    animateCounter,
    toggleDropdown,
    initDropdowns,
    Storage,
    debounce,
    throttle,
    randomInt,
    randomFloat,
    randomFrom,
    shuffleArray,
    generateStudentName,
    generateStudentList,
    formatNumberWithCommas,
    formatIndianNumber,
    abbreviateNumber,
    copyToClipboard,
    flashClass,
    generateUUID,
    generateExamId,
    deepClone,
    isEmpty,
    pollUntil,
  };
}
