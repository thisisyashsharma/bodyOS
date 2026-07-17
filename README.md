# BodyOS 🧬

BodyOS is a local-first, biological health systems dashboard designed to track individual body systems instead of arbitrary habits or streaks. It visualizes the current status and trends of your body's systems through an interactive anatomical map and detailed biometrics logging.

The app operates on local privacy, storing all events, vitals, habits, and target goals directly in the browser's `localStorage`.

---

## 🌟 Key Features

### 1. Interactive Anatomical Map
- **Visual Centerpiece**: A custom, symmetrical vector silhouette representing the human body.
- **Dynamic Highlights**: Actively tracked systems glow with their respective color gradients.
- **Untracked Parameters**: Inactive parameters appear with a muted, dashed stroke. Clicking them reveals a quick CTA panel to activate tracking.
- **Interactive Tooltips**: Hovering over any organ instantly displays its live score or tracking status.

### 2. Dual Tracking Modes (Per System)
- **Daily Status (Subjective)**:
  - Simple 1-10 rating selection grids.
  - Replaces complex parameters with a subjective "How does it feel today?" slider-first input form.
  - Optional details (headline, checkup category, notes) are collapsible to maintain a clean layout.
- **Precision Vitals (Clinical)**:
  - Log custom biometric metrics (e.g. Resting Heart Rate in `bpm`, Blood Pressure in `mmHg`, Oxygen Saturation in `%`).
  - Set specific goals (e.g. Target Param: `Systolic BP < 120 mmHg`).
  - Track protective habits and supplementation protocols (e.g. CoQ10, resistance training) with an adherence percentage slider (40% weight).
  - Deducts points dynamically for active symptoms logged in the last 14 days.

### 3. Google Fit-Style Bubble Calendar Grid
- Rebuilt status trend charts to support an interactive **Month** bubble view.
- Days with logged checkups display circular bubbles whose sizes correspond to their rating values (1-10).
- Days without checkups show simple, clean numbers (no circles), mirroring the Google Fit dashboard layout.
- Period averaging is computed dynamically for Day, Week, Month, and Year tabs with smooth spring animations.

### 4. Divided System Index & Directory
- **Cognitive Load Reduction**: The dashboard is divided into **Live Tracking** (e.g. Respiratory, Nervous & Sleep, and Integumentary active by default) and **Add Systems to Track**.
- **Sidebar Navigation Sync**: The desktop sidebar showcases only live active parameters, placing untracked systems in a collapsable adder menu.
- **Archived Legend Badges**: Inactive systems containing historical logs show an `Archived` tag, differentiating legacy logs from brand-new parameters.
- **Dashboard Stats Sync**: Overall Bio-Score, adherence, and active symptoms count only compute values from active tracking systems.

### 5. Safe Data Wiping & Archive Controls
- **Archive Track**: Move active systems back to inactive tracking. All historical events and biometric logs are preserved silently.
- **Conscious Deletion Safeguard**: Wiping a system's historical data requires the user to consciously type their profile username (`wwwYa`) into a secure warning overlay, preventing accidental data erasure.

### 6. Responsive Android-Style UI
- Hidden desktop sidebars on mobile screens.
- Replaced by a floating, glassmorphic bottom navigation pill bar that mimics the feel of a native Android application.

---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (Modern HSL system, dark mode, glassmorphism, responsive utilities)
- **Icons**: Lucide React
- **Build System**: Rolldown / Vite bundler (fully type-checked builds via `tsc`)

---

## 📂 Project Structure

```bash
src/
├── components/
│   ├── EventModal.tsx         # Universal modal for checkups & symptoms
│   ├── InteractiveBodyMap.tsx # Symmetrical SVG body silhouette
│   └── MetricsChart.tsx       # Google Fit bubble calendar and bar chart
├── context/
│   └── DashboardContext.tsx   # Recalculates scores, seeds 30D events, and manages localStorage
├── pages/
│   ├── Dashboard.tsx          # Divided systems index and quick ratings widget
│   ├── ReportGenerator.tsx    # Generates printable clinical summary reports
│   ├── SystemDetail.tsx       # Detailed log views, goals tracker, and slider-first form
│   └── TimelineView.tsx       # Unified timeline scroll of all wellness events
├── App.tsx                    # Layout wrapper with desktop sidebar & mobile floating pill nav
├── main.tsx                   # React root entry
├── index.css                  # Core CSS variables, animations, and Tailwind v4 imports
└── types.ts                   # Core TypeScript interfaces (BodySystem, MedicalEvent, etc.)
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd "d:\Dev Projects\2026\July\BodyOS"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5176](http://localhost:5176) to view it in the browser.

4. Build the production application bundle:
   ```bash
   npm run build
   ```
   Compiles optimized production assets to the `dist/` directory.

---

## 🔒 Privacy & Safety

BodyOS is a static client-side application. No health information or biometrics data leaves your machine. Wiping data from the app deletes browser database logs irreversibly.
