# TaskFlow — Kanban Task Manager

A modern, responsive, portfolio-grade Kanban board web application built exclusively with **vanilla HTML5, CSS3, and modern JavaScript (ES6+)**. No frameworks, no build tools, and no external JS libraries.

TaskFlow provides a distraction-free, intuitive interface for managing personal and team workflows, tracking task deadlines, and maintaining focus.

---

## 🎨 Design System & Visual Highlights

- **Dual-Zone Canvas**: Tailored to fit a two-tone background with a dark navy command sidebar on the left (`#2B2C4B`) and an expansive warm cream board workspace on the right (`#EEE7CA`).
- **3D Tactile Push-Down Buttons (Uiverse by JasonMep)**:
  - Mechanical chunky 3D buttons with solid bottom bevel shadows and realistic active push-down depression (`top: 2px; box-shadow: 0px 1px 0px`).
  - Color-coded by status:
    - `+ New Task`: Warm Amber Orange (`#E67E22`)
    - Priority Filters: Royal Indigo (`All`), Crimson (`High`), Amber (`Medium`), Emerald (`Low`)
    - Column Quick-Add: Color-harmonized with each column's indicator dot (To Do = Indigo, In Progress = Amber, Done = Emerald)
    - Clear All: Deep Crimson Red (`#C0392B`)
- **Rich Imagery Integration**:
  - **Task Cover Images**: Cards support full-width visual cover banners (with quick presets for Security, Code, and Design).
  - **Assignee Avatars**: Real user profile avatars displayed on task cards and in the workspace profile badge.
- **Color Coding**:
  - High Priority: Crimson Red (`#E74C3C`)
  - Medium Priority: Warm Amber Orange (`#E67E22`)
  - Low Priority: Emerald Green (`#27AE60`)
  - Overdue: Warning Crimson with alert icon
  - Due Today: Warm Amber with clock icon
  - Due Soon (within 48 hours): Soft Blue with hourglass icon

---

## 🚀 Core Features

1. **Board & Column Workflow**: `To Do`, `In Progress`, and `Done` with dynamic task counts and quick-add shortcuts.
2. **Task Management (CRUD)**: Create, edit, and delete tasks with custom styled 3D confirmation modals.
3. **Drag and Drop**: Native HTML5 Drag & Drop with animated drop zones + mobile/touch move dropdown fallback.
4. **Smart Deadlines**: Automatic evaluation of deadlines relative to the current date (Overdue, Due Today, Due Soon).
5. **Multi-Criteria Search & Filter**: Real-time filtering across titles/descriptions combined with priority toggles.
6. **LocalStorage Persistence**: Auto-saves board state and filter preference, with 5 seeded tasks on initial launch.

---

## 📁 Project Structure

```
taskflow/
├── index.html          # Semantic HTML markup, modals, profile badge, and templates
├── assets/
│   ├── background.png  # Signature dual-zone background
│   └── sample-background.png
├── css/
│   └── style.css       # Complete CSS design system, 3D JasonMep buttons, card covers, variables
├── js/
│   ├── storage.js      # LocalStorage helpers, serialization, image/assignee data seeding
│   └── app.js          # State management, DOM rendering, image handling, drag-and-drop
└── README.md           # Documentation and architecture guide
```

---

## 💻 How to Run

No build step, `npm install`, or local server required!

1. Open [`index.html`](index.html) in any modern web browser:
   - Double-click `index.html`, OR
   - Right-click and choose **Open with > Chrome / Firefox / Edge / Safari**, OR
   - Serve using any static file server:
     ```bash
     npx serve .
     ```
