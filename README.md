# DayFlow — Personal Productivity Dashboard

A warm, calm, editorial productivity dashboard built with pure HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no external dependencies. Open `index.html` and go.

---

## Features

### Greeting & Live Clock
- Displays the current time updated every second
- Shows the current date in a readable long format
- Personalises the greeting based on time of day (morning / afternoon / evening / night)
- Editable display name — click the ✎ pencil icon in the header to customise it

### To-Do List
- Add tasks with a prominent input form
- Inline edit any task by clicking ✎
- Mark tasks complete or incomplete with a checkbox
- Delete tasks with ✕
- **Duplicate prevention** — submitting a name that already exists (case-insensitive, whitespace-trimmed) shows a friendly warning instead of adding a duplicate
- Sort tasks by: added order, A→Z, Z→A, pending first, done first
- Visual distinction between pending and completed tasks
- Helpful empty state when the list is clear
- All tasks persist across browser refreshes via localStorage

### Focus Timer
- 25-minute Pomodoro countdown by default
- Circular SVG progress ring shows time remaining at a glance
- Duration picker: 5 / 15 / 25 / 30 / 45 / 50 minutes
- Start, Pause/Resume, and Reset controls
- Wall-clock accuracy — uses `performance.now()` timestamps so the timer stays precise even if the browser throttles JavaScript in inactive tabs
- Completion message when the session ends
- Duration preference saved to localStorage

### Quick Links
- Save favourite URLs as compact link chips
- Click any chip to open the URL in a new tab (safe `rel="noopener noreferrer"`)
- URL validation — only `http://` and `https://` links accepted
- Delete links individually
- Links persist across refreshes via localStorage

### Light / Dark Mode
- Theme toggle in the sidebar footer
- Automatically detects the operating system colour-scheme preference on first visit
- Preference saved to localStorage for subsequent visits

---

## Project Structure

```
DayFlow/
├── index.html              # Single-page application entry point
├── css/
│   └── style.css           # All styles (one file only)
├── js/
│   └── script.js           # All behaviour (one file only)
├── .kiro/
│   └── steering/
│       └── project.md      # Kiro AI guidance for this project
└── README.md               # This file
```

---

## Running the Project

1. Clone or download this repository.
2. Open `index.html` in any modern browser.
3. No build step, no npm install, no server required.

### GitHub Pages deployment

1. Push to a GitHub repository.
2. Go to **Settings → Pages**.
3. Set **Source** to `Deploy from a branch` → `main` → `/ (root)`.
4. GitHub Pages will serve `index.html` directly.

---

## Browser Support

Tested in Chrome, Firefox, Edge, and Safari (latest versions). Requires ES6+ and the `localStorage` API.

---

## localStorage Keys

| Key | Description |
|---|---|
| `df_theme` | `"light"` or `"dark"` |
| `df_name` | Custom greeting display name |
| `df_tasks` | Array of task objects (`id`, `text`, `done`, `createdAt`) |
| `df_links` | Array of link objects (`id`, `name`, `url`) |
| `df_timer_duration` | Last selected focus duration (minutes as string) |

---

## Manual Testing Checklist

### Greeting & Clock
- [ ] Clock updates every second
- [ ] Date displays correctly
- [ ] Greeting changes depending on time of day
- [ ] Clicking ✎ opens the name editor
- [ ] Saving a name updates the greeting and persists after refresh
- [ ] Clicking Cancel closes the editor without changes
- [ ] Pressing Escape closes the editor

### To-Do List
- [ ] Add a task — appears in list immediately
- [ ] Submit an empty task — shows error message, no item added
- [ ] Add a task with the same name (different case) — shows duplicate warning
- [ ] Check a task — strikethrough applied, completion count updates
- [ ] Uncheck a task — reverses the above
- [ ] Edit a task — inline input appears; save with ✓ or Enter
- [ ] Edit to an empty name — shows error, does not save
- [ ] Edit to a duplicate name — shows warning, does not save
- [ ] Delete a task — removed from list and localStorage
- [ ] Change sort order — list re-orders without data loss
- [ ] Refresh the page — all tasks restored

### Focus Timer
- [ ] Default shows 25:00 and "Ready to focus"
- [ ] Start — countdown begins, ring shrinks, status updates
- [ ] Pause — countdown freezes, button shows "Resume"
- [ ] Resume — countdown continues from paused value
- [ ] Reset — returns to selected duration, ring full
- [ ] Switch tab and return — timer has not lost significant time
- [ ] Timer reaches 00:00 — stops, completion message appears
- [ ] Change duration via picker — reflects in timer display
- [ ] Duration preference saved after refresh

### Quick Links
- [ ] Click "Add link" — form appears
- [ ] Submit with empty name — error shown
- [ ] Submit with invalid URL (no https://) — error shown
- [ ] Add a valid link — chip appears in list
- [ ] Click a link chip — opens in new tab
- [ ] Delete a link — removed from list and localStorage
- [ ] Refresh — saved links restored

### Theme
- [ ] Click theme toggle — switches between light and dark
- [ ] Preference saved — correct theme on next page load

### Accessibility & Responsive
- [ ] All interactive elements reachable by Tab key
- [ ] Focus ring visible on keyboard focus
- [ ] Mobile layout (≤ 680 px): sidebar becomes collapsible top nav
- [ ] Mobile: hamburger menu opens/closes nav
- [ ] No horizontal scroll on narrow viewports

---

## Challenges Implemented

1. **Light/Dark Mode** — full theme toggle with OS preference detection and localStorage persistence
2. **Custom Name in Greeting** — editable display name with inline form, save/cancel, and persistence
3. **Prevent Duplicate Tasks** — case-insensitive, whitespace-trimmed duplicate detection with a friendly warning message

---

## License

MIT — free to use and modify.
