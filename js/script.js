/**
 * DayFlow — Personal Productivity Dashboard
 * js/script.js
 *
 * Sections:
 *  1. Storage helpers
 *  2. Theme
 *  3. Greeting & Clock
 *  4. Custom Name
 *  5. Tasks
 *  6. Progress Bar
 *  7. Focus Timer
 *  8. Quick Links
 *  9. Navigation
 * 10. Init
 */

'use strict';

/* ── 1. Storage Helpers ──────────────────────────────────────── */

/**
 * Safely read a JSON value from localStorage.
 * Returns defaultValue if the key is missing or JSON is invalid.
 */
function storageGet(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Safely write a JSON value to localStorage.
 * Silently ignores errors (e.g. storage quota exceeded).
 */
function storageSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Storage unavailable — degrade gracefully */
  }
}

/* ── 2. Theme ────────────────────────────────────────────────── */

const themeToggleBtn = document.getElementById('themeToggle');
const themeLabel     = themeToggleBtn.querySelector('.theme-label');

/** Apply a theme to <html> and persist it. */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  themeToggleBtn.setAttribute('aria-pressed', String(isDark));
  themeLabel.textContent = isDark ? 'Dark' : 'Light';
  storageSet('df_theme', theme);
}

/** Toggle between light and dark. */
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  const saved = storageGet('df_theme', null);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved !== null ? saved : (prefersDark ? 'dark' : 'light'));
}

themeToggleBtn.addEventListener('click', toggleTheme);

/* ── 3. Greeting & Clock ─────────────────────────────────────── */

const greetingTimeEl = document.getElementById('greetingTime');
const currentDateEl  = document.getElementById('currentDate');
const liveClockEl    = document.getElementById('liveClock');

/** Return a time-of-day greeting string. */
function getGreeting(hour) {
  if (hour < 5)  return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

/** Format a Date to "Saturday, October 17, 2026". */
function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });
}

/** Format a Date to "HH:MM:SS AM/PM". */
function formatClock(date) {
  return date.toLocaleTimeString('en-US', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Update the greeting, date, and clock. Called every second. */
function updateClock() {
  const now  = new Date();
  const hour = now.getHours();
  greetingTimeEl.textContent = getGreeting(hour);
  currentDateEl.textContent  = formatDate(now);
  liveClockEl.textContent    = formatClock(now);
}

/** Kick off the clock, aligned to the next full second. */
function initClock() {
  updateClock();
  const delay = 1000 - (Date.now() % 1000);
  setTimeout(() => {
    updateClock();
    setInterval(updateClock, 1000);
  }, delay);
}

/* ── 4. Custom Name ──────────────────────────────────────────── */

const greetingDisplay = document.getElementById('greetingDisplay');
const editNameBtn     = document.getElementById('editNameBtn');
const nameEditor      = document.getElementById('nameEditor');
const nameInput       = document.getElementById('nameInput');
const cancelNameBtn   = document.getElementById('cancelNameBtn');

/** Load and display the saved custom name (or fallback). */
function loadName() {
  const saved = storageGet('df_name', '');
  greetingDisplay.textContent = saved.trim() !== '' ? saved.trim() : 'Friend';
}

/** Show the name editor. */
function showNameEditor() {
  const current = storageGet('df_name', '');
  nameInput.value = current.trim() !== '' ? current.trim() : '';
  nameEditor.hidden = false;
  editNameBtn.hidden = true;
  nameInput.focus();
}

/** Hide the name editor. */
function hideNameEditor() {
  nameEditor.hidden = true;
  editNameBtn.hidden = false;
}

/** Save the custom name. */
function saveName(event) {
  event.preventDefault();
  const trimmed = nameInput.value.trim();
  if (trimmed.length === 0) {
    // Reset to default
    storageSet('df_name', '');
    greetingDisplay.textContent = 'Friend';
  } else {
    storageSet('df_name', trimmed);
    greetingDisplay.textContent = trimmed;
  }
  hideNameEditor();
}

editNameBtn.addEventListener('click', showNameEditor);
cancelNameBtn.addEventListener('click', hideNameEditor);
nameEditor.addEventListener('submit', saveName);

/* Escape key to cancel */
nameEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideNameEditor();
});

/* ── 5. Tasks ────────────────────────────────────────────────── */

const taskForm    = document.getElementById('taskForm');
const taskInput   = document.getElementById('taskInput');
const taskMsg     = document.getElementById('taskMsg');
const taskList    = document.getElementById('taskList');
const emptyState  = document.getElementById('emptyState');
const taskSort    = document.getElementById('taskSort');

/** @type {{ id: string, text: string, done: boolean, createdAt: number }[]} */
let tasks = [];

/** Generate a simple unique ID. */
function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Persist tasks array to localStorage. */
function saveTasks() {
  storageSet('df_tasks', tasks);
}

/** Load tasks from localStorage. */
function loadTasks() {
  tasks = storageGet('df_tasks', []);
}

/**
 * Display a validation/info message below the task input.
 * @param {string} text
 * @param {'error'|'warn'} type
 * @param {number} [duration=3000] ms before auto-hide
 */
let msgTimeout = null;
function showTaskMsg(text, type, duration = 3500) {
  clearTimeout(msgTimeout);
  taskMsg.textContent = text;
  taskMsg.className = `task-msg task-msg--${type}`;
  taskMsg.hidden = false;
  msgTimeout = setTimeout(() => { taskMsg.hidden = true; }, duration);
}

/** Return sorted copy of the tasks array based on current sort selection. */
function getSortedTasks() {
  const order = taskSort.value;
  const copy  = [...tasks];
  switch (order) {
    case 'alpha':
      return copy.sort((a, b) => a.text.localeCompare(b.text));
    case 'alpha-desc':
      return copy.sort((a, b) => b.text.localeCompare(a.text));
    case 'pending':
      return copy.sort((a, b) => Number(a.done) - Number(b.done));
    case 'done':
      return copy.sort((a, b) => Number(b.done) - Number(a.done));
    default:
      // "default" — preserve insertion order (by createdAt ascending)
      return copy.sort((a, b) => a.createdAt - b.createdAt);
  }
}

/**
 * Safely set text content — avoids innerHTML to prevent XSS.
 * @param {HTMLElement} el
 * @param {string} text
 */
function safeText(el, text) {
  el.textContent = text;
}

/** Re-render the full task list from the tasks array. */
function renderTasks() {
  taskList.innerHTML = '';

  const sorted = getSortedTasks();

  if (sorted.length === 0) {
    emptyState.hidden = false;
    emptyState.removeAttribute('aria-hidden');
  } else {
    emptyState.hidden = true;
    emptyState.setAttribute('aria-hidden', 'true');
  }

  sorted.forEach((task) => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' task-item--done' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-check';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Text span
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    safeText(textSpan, task.text);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'task-btn task-btn--edit';
    editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => startEditTask(task.id, li, textSpan, editBtn));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'task-btn task-btn--delete';
    deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actions);
    taskList.appendChild(li);
  });

  updateProgress();
}

/** Toggle a task's done state. */
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();
}

/** Delete a task by id. */
function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

/**
 * Replace the task text span with an inline edit field.
 * @param {string} id
 * @param {HTMLElement} li
 * @param {HTMLElement} textSpan
 * @param {HTMLElement} editBtn
 */
function startEditTask(id, li, textSpan, editBtn) {
  // Prevent opening multiple edit inputs at once
  const existing = taskList.querySelector('.task-edit-input');
  if (existing) return;

  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input';
  input.value = task.text;
  input.maxLength = 120;
  input.setAttribute('aria-label', 'Edit task text');

  // Save button (replaces edit icon)
  editBtn.textContent = '✓';
  editBtn.className = 'task-btn task-btn--save';
  editBtn.setAttribute('aria-label', 'Save task edit');

  li.replaceChild(input, textSpan);
  input.focus();
  input.select();

  /** Commit the edit. */
  function commitEdit() {
    const newText = input.value.trim();

    if (newText === '') {
      showTaskMsg('Task name cannot be empty.', 'error');
      input.focus();
      return;
    }

    // Duplicate check (excluding current task)
    const duplicate = tasks.some(
      (t) => t.id !== id && t.text.trim().toLowerCase() === newText.toLowerCase()
    );
    if (duplicate) {
      showTaskMsg(`"${newText}" already exists in your list.`, 'warn');
      input.focus();
      return;
    }

    task.text = newText;
    saveTasks();
    renderTasks();
  }

  editBtn.addEventListener('click', commitEdit, { once: true });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
    if (e.key === 'Escape') { renderTasks(); } // cancel
  });
}

/** Handle the Add Task form submission. */
function handleAddTask(event) {
  event.preventDefault();
  const raw     = taskInput.value;
  const trimmed = raw.trim();

  if (trimmed === '') {
    showTaskMsg('Please enter a task name.', 'error');
    taskInput.focus();
    return;
  }

  // Duplicate check (case-insensitive, trimmed)
  const duplicate = tasks.some(
    (t) => t.text.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    showTaskMsg(`"${trimmed}" is already on your list.`, 'warn');
    taskInput.focus();
    return;
  }

  tasks.push({
    id:        genId(),
    text:      trimmed,
    done:      false,
    createdAt: Date.now(),
  });

  saveTasks();
  renderTasks();
  taskInput.value = '';
  taskInput.focus();
  taskMsg.hidden = true;
}

taskForm.addEventListener('submit', handleAddTask);
taskSort.addEventListener('change', renderTasks);

/* ── 6. Progress Bar ─────────────────────────────────────────── */

const progressBarFill = document.getElementById('progressBarFill');
const progressBarWrap = document.getElementById('progressBarWrap');
const progressText    = document.getElementById('progressText');

function updateProgress() {
  const total     = tasks.length;
  const completed = tasks.filter((t) => t.done).length;
  const pct       = total === 0 ? 0 : Math.round((completed / total) * 100);

  progressBarFill.style.width = `${pct}%`;
  progressBarWrap.setAttribute('aria-valuenow', String(pct));
  progressText.textContent = `${completed} of ${total} task${total !== 1 ? 's' : ''} done`;
}

/* ── 7. Focus Timer ──────────────────────────────────────────── */

const timerTimeEl   = document.getElementById('timerTime');
const timerStatus   = document.getElementById('timerStatus');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerRing     = document.getElementById('timerRing');
const timerDuration = document.getElementById('timerDuration');

/* SVG circumference for radius 52: 2 * π * 52 ≈ 326.73 */
const CIRCUMFERENCE = 2 * Math.PI * 52;

let timerState = {
  totalSeconds:   25 * 60,
  remaining:      25 * 60,
  running:        false,
  intervalId:     null,
  startTimestamp: null,  // performance.now() when last resumed
  elapsedAtStart: 0,     // seconds elapsed before the current run segment
};

/** Convert seconds to "MM:SS" string. */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Update the SVG ring and time display. */
function renderTimer() {
  timerTimeEl.textContent = formatTime(timerState.remaining);

  const fraction = timerState.totalSeconds > 0
    ? timerState.remaining / timerState.totalSeconds
    : 1;
  const offset = CIRCUMFERENCE * (1 - fraction);
  timerRing.style.strokeDashoffset = offset.toFixed(2);

  // Ring color classes
  timerRing.classList.remove('timer-ring--idle', 'timer-ring--running', 'timer-ring--done');
  if (timerState.remaining === 0) {
    timerRing.classList.add('timer-ring--done');
  } else if (timerState.running) {
    timerRing.classList.add('timer-ring--running');
  } else {
    timerRing.classList.add('timer-ring--idle');
  }
}

/** Tick handler: recalculates remaining from wall time to avoid drift. */
function timerTick() {
  const elapsed = timerState.elapsedAtStart +
    Math.round((performance.now() - timerState.startTimestamp) / 1000);

  timerState.remaining = Math.max(0, timerState.totalSeconds - elapsed);
  renderTimer();

  if (timerState.remaining === 0) {
    stopTimer();
    timerStatus.textContent = '🎉 Session complete! Take a break.';
    timerStartBtn.textContent = 'Start';
  }
}

/** Start or resume the countdown. */
function startTimer() {
  if (timerState.running) return;          // Already running — guard against duplicates
  if (timerState.remaining === 0) return;  // Nothing to run

  timerState.running = true;
  timerState.elapsedAtStart = timerState.totalSeconds - timerState.remaining;
  timerState.startTimestamp = performance.now();

  // Clear any stale interval (defensive)
  if (timerState.intervalId !== null) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }

  timerState.intervalId = setInterval(timerTick, 500);

  timerStartBtn.textContent = 'Pause';
  timerStatus.textContent   = 'Stay focused ✦';
  renderTimer();
}

/** Pause the countdown. */
function pauseTimer() {
  if (!timerState.running) return;
  timerState.running = false;

  // Freeze the remaining value before clearing the interval
  const elapsed = timerState.elapsedAtStart +
    Math.round((performance.now() - timerState.startTimestamp) / 1000);
  timerState.remaining = Math.max(0, timerState.totalSeconds - elapsed);

  clearInterval(timerState.intervalId);
  timerState.intervalId = null;

  timerStartBtn.textContent = 'Resume';
  timerStatus.textContent   = 'Paused';
  renderTimer();
}

/** Stop (halt) without resetting. Used internally on completion. */
function stopTimer() {
  timerState.running = false;
  if (timerState.intervalId !== null) {
    clearInterval(timerState.intervalId);
    timerState.intervalId = null;
  }
}

/** Reset to the selected duration. */
function resetTimer() {
  stopTimer();
  const mins = parseInt(timerDuration.value, 10) || 25;
  timerState.totalSeconds = mins * 60;
  timerState.remaining    = timerState.totalSeconds;
  timerState.elapsedAtStart = 0;
  timerState.startTimestamp = null;

  timerStartBtn.textContent = 'Start';
  timerStatus.textContent   = 'Ready to focus';
  renderTimer();
  storageSet('df_timer_duration', timerDuration.value);
}

timerStartBtn.addEventListener('click', () => {
  if (timerState.running) {
    pauseTimer();
  } else {
    startTimer();
  }
});

timerResetBtn.addEventListener('click', resetTimer);

timerDuration.addEventListener('change', () => {
  // Only apply a duration change if the timer is idle (not running/paused mid-session)
  if (!timerState.running && timerState.remaining === timerState.totalSeconds) {
    resetTimer();
  } else if (!timerState.running) {
    // Paused mid-session — just save preference; let user reset manually
    storageSet('df_timer_duration', timerDuration.value);
  }
});

function initTimer() {
  const savedDur = storageGet('df_timer_duration', '25');
  if (timerDuration.querySelector(`option[value="${savedDur}"]`)) {
    timerDuration.value = savedDur;
  }
  const mins = parseInt(timerDuration.value, 10) || 25;
  timerState.totalSeconds = mins * 60;
  timerState.remaining    = timerState.totalSeconds;
  timerRing.style.strokeDasharray = `${CIRCUMFERENCE}`;
  renderTimer();
}

/* Handle tab visibility change to keep timer accurate. */
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !timerState.running) return;
  // When the tab becomes visible again, timerTick() will auto-correct
  // because it recalculates from startTimestamp (wall time).
});

/* ── 8. Quick Links ──────────────────────────────────────────── */

const addLinkToggleBtn = document.getElementById('addLinkToggleBtn');
const linkForm         = document.getElementById('linkForm');
const linkNameInput    = document.getElementById('linkName');
const linkUrlInput     = document.getElementById('linkUrl');
const linkMsg          = document.getElementById('linkMsg');
const linkList         = document.getElementById('linkList');
const linksEmpty       = document.getElementById('linksEmpty');
const cancelLinkBtn    = document.getElementById('cancelLinkBtn');

/** @type {{ id: string, name: string, url: string }[]} */
let links = [];

function saveLinks() {
  storageSet('df_links', links);
}

function loadLinks() {
  links = storageGet('df_links', []);
}

/**
 * Validate a URL — must start with http:// or https://.
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

let linkMsgTimeout = null;
function showLinkMsg(text, type) {
  clearTimeout(linkMsgTimeout);
  linkMsg.textContent = text;
  linkMsg.className = `task-msg task-msg--${type}`;
  linkMsg.hidden = false;
  linkMsgTimeout = setTimeout(() => { linkMsg.hidden = true; }, 3500);
}

/** Render the quick links list. */
function renderLinks() {
  linkList.innerHTML = '';
  linksEmpty.hidden = links.length > 0;

  links.forEach((link) => {
    const li = document.createElement('li');
    li.className = 'link-item';
    li.dataset.id = link.id;

    // Favicon via Google S2 — safe, no PII exposed; fallback to a generic icon
    const favicon = document.createElement('img');
    favicon.className = 'link-favicon';
    const origin = (() => {
      try { return new URL(link.url).origin; } catch { return ''; }
    })();
    favicon.src = origin
      ? `https://www.google.com/s2/favicons?sz=16&domain_url=${encodeURIComponent(origin)}`
      : '';
    favicon.alt = '';
    favicon.setAttribute('aria-hidden', 'true');
    favicon.onerror = () => { favicon.style.display = 'none'; };

    const anchor = document.createElement('a');
    anchor.className = 'link-anchor';
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    safeText(anchor, link.name);
    anchor.title = link.url;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'link-delete-btn';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.name}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => deleteLink(link.id));

    li.appendChild(favicon);
    li.appendChild(anchor);
    li.appendChild(deleteBtn);
    linkList.appendChild(li);
  });
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
}

/** Handle the Add Link form submission. */
function handleAddLink(event) {
  event.preventDefault();

  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (name === '') {
    showLinkMsg('Please enter a name for the link.', 'error');
    linkNameInput.focus();
    return;
  }

  if (!isValidUrl(url)) {
    showLinkMsg('Please enter a valid URL starting with https:// or http://', 'error');
    linkUrlInput.focus();
    return;
  }

  links.push({ id: genId(), name, url });
  saveLinks();
  renderLinks();

  linkNameInput.value = '';
  linkUrlInput.value  = '';
  hideLinkForm();
}

function showLinkForm() {
  linkForm.hidden = false;
  addLinkToggleBtn.setAttribute('aria-expanded', 'true');
  linkNameInput.focus();
}

function hideLinkForm() {
  linkForm.hidden = true;
  addLinkToggleBtn.setAttribute('aria-expanded', 'false');
  linkMsg.hidden = true;
}

addLinkToggleBtn.addEventListener('click', () => {
  if (linkForm.hidden) { showLinkForm(); } else { hideLinkForm(); }
});
cancelLinkBtn.addEventListener('click', hideLinkForm);
linkForm.addEventListener('submit', handleAddLink);

/* ── 9. Navigation ───────────────────────────────────────────── */

const navLinks     = document.querySelectorAll('.nav-link');
const menuToggle   = document.getElementById('menuToggle');
const sidebar      = document.getElementById('sidebar');
const sidebarNav   = document.getElementById('sidebarNav');

/** Update the highlighted nav item without page reload. */
function updateNavActive(targetSection) {
  navLinks.forEach((link) => {
    const isActive = link.dataset.section === targetSection;
    link.classList.toggle('active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/** Smooth-scroll to a section and close mobile menu. */
navLinks.forEach((link) => {
  link.addEventListener('click', (e) => {
    const section = link.dataset.section;
    updateNavActive(section);
    closeMobileMenu();
    // Let the href handle scroll
  });
});

/** Mobile menu toggle. */
function openMobileMenu() {
  sidebar.classList.add('is-open');
  menuToggle.setAttribute('aria-expanded', 'true');
}

function closeMobileMenu() {
  sidebar.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
}

menuToggle.addEventListener('click', () => {
  if (sidebar.classList.contains('is-open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});

/* Close mobile menu when clicking outside the sidebar. */
document.addEventListener('click', (e) => {
  if (
    sidebar.classList.contains('is-open') &&
    !sidebar.contains(e.target)
  ) {
    closeMobileMenu();
  }
});

/* Use IntersectionObserver to auto-highlight nav on scroll. */
function initScrollSpy() {
  const sections = [
    { id: 'section-overview', key: 'overview' },
    { id: 'section-tasks',    key: 'tasks'    },
    { id: 'section-timer',    key: 'timer'    },
    { id: 'section-links',    key: 'links'    },
  ];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const section = sections.find((s) => s.id === entry.target.id);
          if (section) updateNavActive(section.key);
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
  );

  sections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}

/* ── 10. Init ────────────────────────────────────────────────── */

function init() {
  initTheme();
  initClock();
  loadName();
  loadTasks();
  renderTasks();
  initTimer();
  loadLinks();
  renderLinks();
  initScrollSpy();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
