# Tracker — Minimalist Daily Expense Tracker

A production-ready, ultra-clean personal daily expense tracker web application built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, fully optimized for frictionless daily micro-logging in Philippine Pesos (PHP) and immediate one-click deployment to Vercel.

![Theme](https://img.shields.io/badge/Aesthetic-Linear%20%2F%20Cron-09090b?style=flat-square)
![Stack](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Deployment](https://img.shields.io/badge/Vercel-Zero%20Config-black?style=flat-square&logo=vercel)

---

## ✨ Design & Aesthetic Philosophy
- **Linear & Cron Inspired Vibe:** Ultra-clean monochrome zinc/slate palette (`bg-zinc-950`), crisp borders (`border-zinc-800`), sleek tabular figures (`font-mono tabular-nums`), and smooth hover/active transitions.
- **Sleek Dark Mode by Default:** High-contrast subtle accents (emerald, violet, sky, amber, rose) for category badges and metric visualizations.
- **Mobile-First UX:** Tailored for effortless on-the-go logging during commutes or quick meals, while expanding into an intuitive two-column command center on desktop.

---

## ⚡ Core Features

### 1. Real-Time Financial Dashboard (KPI Cards)
- **Monthly Total Spent:** Dynamic sum of all expenses in the active month formatted in Philippine Pesos (`₱X,XXX.XX`).
- **Today's Total:** Instant glance at active day spending.
- **Average Daily Spend:** Aggregates spending across active transaction days and elapsed calendar days.
- **Calendar Weekly Subtotals:** Monday-to-Sunday weekly interval bars showing rolling weekly subtotals and item counts without placeholder rows.
- **Month Switcher:** Seamlessly navigate between months or jump back to the current month.

### 2. Frictionless Quick-Add Bar & Presets
- **Single-Line Rapid Input:** Description, Amount (₱), Date (defaults to today), and Category selector.
- **One-Tap Quick Presets:** Instant shortcut buttons for frequent micro-transactions:
  - `+₱40 Tricycle` (Transportation)
  - `+₱80 Lunch` (Food)
  - `+₱150 Grab` (Transportation)
  - `+₱180 Chagee` (Food)
  - `+₱25 Jeepney` (Transportation)
  - `+₱350 Groceries` (Shopping)
- **Preset Customization:** Add, remove, or reset shortcuts to fit your personal spending patterns.
- **Keyboard-Friendly Navigation:** Press `Enter` to log instantly, returning focus for rapid multi-logging.

### 3. Itemized Expense Ledger & Calendar Views
- **Reverse Chronological Grouping:** Grouped cleanly by Date with daily subtotal badges.
- **Search & Filter:** Real-time search by description, amount, or category.
- **Sorting:** Sort by newest, oldest, highest amount, or lowest amount.
- **Inline Edit & Delete:** Modify entries with instant validation or delete with a safe confirmation dialog.

### 4. Visual Category Breakdown
- **Stacked Proportional Distribution Bar:** Canvas-free, pure CSS/Tailwind visualization showing relative spending shares across categories.
- **Per-Category Progress Bars:** Breakdown with item counts, total spend, and percentage share.

### 5. Data Management & Portability
- **Export to CSV:** Downloadable file formatted as `Date,Description,Category,Amount` with standard quote/comma escaping.
- **Export to JSON:** Full structured backup of all transactions and timestamps.
- **Import CSV / JSON:** File drag/drop or picker with validation and preview modal supporting both "Merge" and "Replace" modes.
- **Seed Mock Data:** Includes realistic November 2026 transactions (Tricycle, Lunch, Grab, Photocards, Chagee) on first launch so the dashboard is immediately populated.
- **Wipe Database:** Safe reset option with confirmation modal.

---

## 📐 Schema & Precision

```typescript
export interface Expense {
  id: string;
  date: string; // ISO format: YYYY-MM-DD
  description: string;
  category: 'Food' | 'Transportation' | 'Shopping' | 'Entertainment' | 'Utilities' | 'Other';
  amount: number; // Stored in Philippine Pesos (PHP)
  createdAt: number;
}
```

All calculations utilize floating-point precision rounding:
```typescript
Math.round((amount + Number.EPSILON) * 100) / 100
```
And are formatted using the official Philippine locale:
```typescript
new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build Verification
To ensure zero build warnings and full TypeScript compliance:
```bash
npm run build
```

---

## ☁️ One-Click Deployment to Vercel

This application is **100% local-first** using browser `localStorage` with zero server-side state or external database dependencies:

1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy**.

> **Note:** Zero environment variables or database connection strings are required. The app deploys immediately on the first commit.

---

## 📂 Project Architecture

```
├── app/
│   ├── globals.css          # Tailwind CSS styles & sleek dark theme tokens
│   ├── layout.tsx           # Root HTML layout, viewport, and Geist typography
│   └── page.tsx             # Main client page container & state orchestrator
├── components/
│   ├── DashboardMetrics.tsx # KPI summary cards & calendar weekly subtotals
│   ├── ExpenseForm.tsx      # Quick-add bar & customizable one-tap presets
│   ├── ExpenseList.tsx      # Reverse chronological ledger, search, edit & delete
│   ├── CategoryBreakdown.tsx# Proportional distribution bar & category progress
│   └── DataExportImport.tsx # CSV/JSON export, file import & data reset
├── lib/
│   ├── types.ts             # TypeScript interfaces and category definitions
│   └── utils.ts             # Precision math, currency formatters, dates, & CSV parser
├── public/                  # Static assets & icons
└── package.json             # Scripts & dependencies
```

---

## 📄 License
MIT
