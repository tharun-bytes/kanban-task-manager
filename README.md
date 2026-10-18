# TaskFlow — Kanban Task Manager

<p align="center">
  <strong>A modern, responsive, portfolio-grade Kanban Task Manager built exclusively with vanilla web technologies.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/JavaScript_ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript ES6+" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-success?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License: MIT" />
</p>

---

## 🌟 Overview

**TaskFlow** is an interactive, distraction-free Kanban board web application designed to help individuals and teams organize daily priorities, visualize workflow bottlenecks, and track task deadlines in real time.

Built **without frameworks, compilers, or external JavaScript libraries**, TaskFlow demonstrates how modern, high-performance web applications can be constructed using pure **vanilla HTML5, CSS3, and JavaScript (ES6+)**.

---

## 🎨 Visual Design & Architectural Highlights

### 1. Dual-Zone Canvas Architecture
The application layout is custom-tailored to a signature two-tone background:
- **Left Dark Navy Zone (`#2B2C4B`, ~22.7% width)**: Serves as the application command center, hosting the brand identity, user profile badge, primary `+ New Task` action, priority filters, productivity statistics, and reset controls.
- **Right Warm Cream Zone (`#EEE7CA`, ~77.3% width)**: Serves as the expansive workspace, providing ample breathing room for the 3 Kanban columns without horizontal clipping or overflow.
- **Open Canvas Aesthetic**: Cards and column lanes flow directly on the background surface without heavy, boxed-in containers.

### 2. 3D Tactile Push-Down Buttons (Inspired by Uiverse by JasonMep)
- Mechanical 3D push-down buttons featuring solid bevel drop shadows and active depression states (`top: 2px; box-shadow: 0px 1px 0px`).
- **Status-Aware Color Palette**:
  - **Primary Action (`+ New Task`)**: Warm Amber Orange (`#E67E22`) with `#D35400` 3D shadow.
  - **All Tasks Filter**: Royal Indigo (`#5C60F5`) with `#4347D9` 3D shadow.
  - **High Priority Filter**: Crimson Red (`#E74C3C`) with `#C0392B` 3D shadow.
  - **Medium Priority Filter**: Amber Orange (`#E67E22`) with `#D35400` 3D shadow.
  - **Low Priority Filter**: Emerald Green (`#27AE60`) with `#1E8449` 3D shadow.
  - **To Do Quick-Add (`+`)**: Royal Indigo (`#5C60F5`).
  - **In Progress Quick-Add (`+`)**: Amber Orange (`#E67E22`).
  - **Done Quick-Add (`+`)**: Emerald Green (`#27AE60`).
  - **Destructive Actions (`Clear All`)**: Deep Crimson (`#C0392B`) with safety confirmation.

### 3. Rich Media Integration
- **Cover Image Banners**: Task cards support full-width visual cover banners (via custom URL or one-click presets: *🔒 Security*, *💻 Code*, *🎨 Design*).
- **Assignee Avatars**: Circular profile avatars displayed on cards and in the user profile chip (`Alex M. • Lead`).

---

## 🚀 Key Features

### 📋 Board & Column Workflow
- **Three Core Stages**: `To Do`, `In Progress`, and `Done`.
- **Dynamic Counters**: Live count badges display active task quantities in each column.
- **Quick-Add Actions**: Each column header includes a 3D `+` button that automatically presets the target status in the creation modal.

### ⚡ Full Task Management (CRUD)
- **Create**: Add tasks with Title, Description, Cover Image URL, Priority, Deadline date, and initial column status. Inline validation prevents empty titles.
- **Edit**: Edit any task seamlessly; all existing parameters are pre-filled in the modal.
- **Delete**: Remove individual tasks with a custom-styled 3D confirmation dialog.
- **Clear All**: Reset the entire board with a confirmation guard.

### 🔄 HTML5 Drag & Drop + Mobile Fallback
- **Native Drag & Drop**: Uses native HTML5 Drag and Drop events (`dragstart`, `dragover`, `drop`, `dragend`) with animated dashed drop zone highlights.
- **Mobile/Touch Fallback**: Each card contains a direct "Move..." dropdown menu allowing effortless column transfers on touchscreens without drag gestures.

### ⏰ Smart Deadline Tracking
Evaluates dates dynamically against the user's current date:
- 🚨 **Overdue**: Highlighted in red with warning icon (active only for unfinished tasks).
- ⏳ **Due Today**: Highlighted in warm amber with clock icon.
- 🕒 **Due Soon**: Highlighted in soft blue for deadlines within 48 hours.
- 📅 **Normal / Completed**: Displays formatted date (e.g., `Oct 22`).

### 🔍 Live Multi-Criteria Search & Filtering
- **Priority Filtering**: Toggle between `All`, `High`, `Medium`, and `Low` with live count badges.
- **Real-Time Search**: Instant filtering across titles and descriptions with a one-click clear button (`✖`).
- **Cohesive Filtering**: Search query and priority filter work together simultaneously (`AND` condition).
- **Empty States**: Friendly empty-state illustrations when no tasks match the filter criteria.

### 💾 LocalStorage Persistence & Auto-Seeding
- All tasks are saved automatically under the `taskflow_tasks` localStorage key upon any create, edit, delete, or move action.
- The active priority filter is saved under `taskflow_filter`.
- Safe `try/catch` JSON parsing ensures resilience against corrupt data.
- Automatically seeds 5 realistic sample tasks complete with cover images and assignees on first launch.

---

## 📁 Project Structure

```
kanban-task-manager/
├── .gitignore               # Ignored files (OS, IDE, temporary artifacts)
├── index.html               # Root redirect forwarder
├── README.md                # Comprehensive project documentation
└── taskflow/
    ├── index.html           # Main semantic HTML structure & modal dialogs
    ├── assets/
    │   ├── background.png   # Signature dual-zone background image
    │   └── sample-background.png
    ├── css/
    │   └── style.css        # Modular CSS design system & 3D button animations
    ├── js/
    │   ├── storage.js       # LocalStorage helpers & initial sample data seeding
    │   └── app.js           # State management, DOM rendering & event delegation
    └── README.md            # App-level documentation
```

---

## 📊 Data Model

Each task is represented as a structured JavaScript object:

```javascript
{
  id: "task-1729267200000-abc123",    // Unique identifier
  title: "Implement Dark Mode",       // Required string (1-120 chars)
  description: "Refactor CSS custom properties...", // Optional text
  priority: "high",                   // "high" | "medium" | "low"
  deadline: "2026-10-25",             // "YYYY-MM-DD" or ""
  status: "todo",                     // "todo" | "inprogress" | "done"
  image: "https://images.unsplash.com/...", // Optional cover URL
  assignee: {
    name: "Alex Morgan",
    avatar: "https://images.unsplash.com/..."
  },
  createdAt: "2026-10-18T16:00:00.000Z" // ISO timestamp
}
```

---

## 💻 How to Run Locally

TaskFlow requires **no build tools**, **no bundlers**, and **no dependencies**.

### Option 1: Direct Browser Launch
Simply double-click [`taskflow/index.html`](taskflow/index.html) or open it with any browser (Chrome, Edge, Firefox, Safari, Brave).

### Option 2: Live Server (VS Code)
Right-click `taskflow/index.html` in VS Code and select **Open with Live Server**.

### Option 3: Local HTTP Server (CLI)
```bash
# Using Node npx
npx serve taskflow

# Using Python 3
python -m http.server 8000 --directory taskflow
```
Visit `http://localhost:8000` or `http://localhost:3000` in your browser.

---

## ♿ Accessibility & Code Quality

- **Semantic HTML5**: Structured with `<aside>`, `<main>`, `<header>`, `<section>`, and `<article>`.
- **Keyboard Navigation**: Modal can be closed with the <kbd>Esc</kbd> key; buttons and form controls feature visible focus rings (`:focus-visible`).
- **ARIA Standards**: Icon buttons feature descriptive `aria-label` tags; modal dialogs carry `aria-modal="true"`; progress tracks implement `role="progressbar"`.
- **XSS Prevention**: User input is securely rendered into the DOM using `textContent` to prevent injection attacks.
- **Modular Codebase**: Clear separation of concerns between `storage.js` (data layer) and `app.js` (UI and state management).

---

## 🔮 Future Improvements

- [ ] Export & Import board data as JSON.
- [ ] Dark / Light mode toggle.
- [ ] Checklist / Subtasks inside cards.
- [ ] Customizable board columns (add/rename/delete columns).
- [ ] Due date calendar picker view.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute it for personal and commercial projects.
