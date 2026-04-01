# Nova Accountings

A professional billing tracker for Laser & CNC sheet cutting businesses.

![Nova Accountings](https://img.shields.io/badge/version-3.0.0-f0a500?style=flat-square) ![React](https://img.shields.io/badge/React-18-blue?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-5-purple?style=flat-square)

---

## Features

- **Customer Management** — Add customers, track work entries, payments, and balance
- **Laser Sheet Billing** — 13" and 16" sheets with combined entry (both sizes in one entry), dots, paper pricing
- **CNC / Zircon Billing** — Manual amount entry per job
- **Custom Entries** — Free-text description + manual amount for any other work
- **Mass Entry (Daily Work Log)** — Add 50+ jobs in a single table view with:
  - Live customer search with autocomplete
  - Inline customer creation
  - Bulk select, duplicate, delete
  - Undo/redo (up to 20 steps)
  - Auto draft save every 30 seconds
  - Keyboard navigation (Tab, Enter, Arrow keys, Ctrl+Z, Ctrl+Enter)
  - Live sidebar: customer breakdown, entry type totals
- **Expense Management** — Record business expenses by category with monthly/yearly summaries
- **Analytics** — Revenue charts, profit overview (Income − Expenses = Net Profit), customer performance
- **Invoice Generator** — Print/PDF invoices per customer, filterable by month
- **Backup & Restore** — JSON full backup + CSV/Excel export
- **Dashboard Summary Bar** — Persistent stats: Pending Payments, Money Received, Total Expenses, Net Profit
- **Mobile Responsive** — Bottom navigation, card views, touch-optimized

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/nova-accountings.git
cd nova-accountings

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder. You can deploy them to any static hosting (Vercel, Netlify, GitHub Pages, etc.)

---

## Data Storage

- **In Claude artifact / platform**: Uses `window.storage` (persistent across sessions, provided by Claude)
- **In local development / GitHub**: Automatically falls back to `localStorage` — data persists in your browser

---

## Project Structure

```
nova-accountings/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx        ← Main application (all components)
│   └── main.jsx       ← Entry point + storage polyfill
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool & dev server
- **IBM Plex Sans / Mono** — Typography (Google Fonts)
- **No external UI libraries** — All components built from scratch

---

## Default Settings

| Setting | Default |
|---|---|
| 13" Sheet Price | ₹150 |
| 16" Sheet Price | ₹180 |
| Dot Price | ₹0.07/dot |
| Paper Price | ₹30/sheet |

All prices are configurable in Settings.

---

## Delete Password

The app uses a simple password to protect deletions: **`123456`**

You can change this in `src/App.jsx` in the `PasswordModal` component.

---

## License

MIT — free to use and modify.
