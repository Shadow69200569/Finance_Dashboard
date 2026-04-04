# 💸 Vertex — Personal Finance Dashboard

> A sleek, modern, **Progressive Web App (PWA)** for tracking personal expenses. Fully offline-capable, installable on any device, and stores all data locally — no server required.

![Version](https://img.shields.io/badge/version-1.0.0-brightgreen)
![PWA](https://img.shields.io/badge/PWA-ready-blue)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
  - [Authentication Flow](#1-authentication-flow)
  - [Dashboard](#2-dashboard)
  - [Add Expense](#3-add-expense)
  - [History](#4-history)
  - [Settings](#5-settings)
  - [Core Logic (app.js)](#6-core-logic-appjs)
  - [PWA & Service Worker](#7-pwa--service-worker)
- [Data Storage Architecture](#-data-storage-architecture)
- [Technology Stack](#-technology-stack)
- [Design System](#-design-system)
- [Getting Started](#-getting-started)
- [LocalStorage Keys Reference](#-localstorage-keys-reference)

---

## 🌟 Overview

**Vertex** is a zero-backend personal expense tracker. Everything runs in the browser — all data is persisted using the browser's `localStorage`. There is no account server, no cloud sync, and no external database. This makes the app extremely fast, private, and available offline.

The app is fully **responsive**, with two distinct layouts:
- **Mobile**: A fixed bottom navigation bar.
- **Desktop (md+)**: A persistent sidebar navigation.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Login / Sign Up | Local username + password authentication, stored in `localStorage` |
| 🏠 Dashboard | Financial summary with balance, income, expenses & a weekly spending bar chart |
| ➕ Add Expense | Form to log expenses with amount, category, date, and a note |
| 📜 History | Full chronological list of all transactions with delete support |
| ⚙️ Settings | Currency selector, dark mode toggle, monthly income editor, data export & reset |
| 📤 Export to Excel | Downloads all expense data as a `.xls` file |
| 🌙 Dark / Light Mode | Persistent theme preference saved to `localStorage` |
| 💰 Multi-Currency | Supports USD, EUR, GBP, INR, JPY, CAD, AUD |
| 📱 PWA | Installable on mobile/desktop, works fully offline via Service Worker |

---

## 📁 Project Structure

```
Expence_Tracker/
│
├── login.html          # Entry point — Login & Sign Up page
├── dashboard.html      # Main screen — Financial overview & chart
├── add_expense.html    # Form to log a new expense
├── history.html        # Full list of all past transactions
├── settings.html       # App preferences and account settings
│
├── js/
│   └── app.js          # Shared core logic: auth, data, formatters, export
│
├── sw.js               # Service Worker for PWA offline caching
├── manifest.json       # PWA Web App Manifest (icons, name, theme)
├── vertex_app_icon.png # App icon used for PWA install prompt & header
└── README.md           # This file
```

---

## 🔍 How It Works

### 1. Authentication Flow

**File:** `login.html` + `js/app.js`

The login page is the app's entry point. It handles both **Sign In** and **Sign Up** in a single form by toggling the UI state.

#### Sign Up (First Time Use)
1. User enters a name and password.
2. If no password exists in `localStorage`, it's treated as **registration**.
3. The name is saved to `localStorage` under `Vertex_user`.
4. The password is saved to `localStorage` under `Vertex_password`.
5. A session is created and the user is redirected to `dashboard.html`.

#### Sign In (Returning User)
1. User enters their name and password.
2. The entered password is compared against the stored `Vertex_password`.
3. If they match → session is created → redirect to `dashboard.html`.
4. If they don't match → the password field shakes and turns red.

#### "Remember Me" Checkbox
- **Checked**: Session flag (`Vertex_session = 'true'`) is stored in `localStorage` (persists after browser close).
- **Unchecked**: Session flag is stored in `sessionStorage` (cleared when tab is closed).

#### Forgot Password
- Offers to **reset all data** since passwords cannot be recovered (no server).
- Calls `localStorage.clear()` and switches to Sign Up mode.

#### Auto-redirect
- On page load, `checkAuth()` runs. If a valid session exists, the user is immediately redirected to `dashboard.html`, skipping the login screen.

---

### 2. Dashboard

**File:** `dashboard.html`

The dashboard is the main screen after login. It dynamically renders:

#### Balance Card
- **Total Balance** = Monthly Income − Total Expenses
- **Income**: Read from `Vertex_income` in `localStorage` (set in Settings)
- **Expense**: Sum of all stored expense amounts

#### Weekly Spending Bar Chart
- Aggregates expenses by **day of week** (Sun–Sat)
- Bars are rendered as HTML `div` elements scaled by percentage of the max daily spend
- **Today's bar** is highlighted in neon green (`#13ec13`)
- Hovering over a bar reveals a tooltip with the exact amount

#### Recent Transactions
- Shows the **5 most recent expenses**, sorted by date descending
- Each item displays: category icon (colored), title, formatted date, and amount
- Category-to-icon mapping: `Food→restaurant`, `Transport→directions_bus`, `Shopping→shopping_bag`, `Home→home`, `Other→more_horiz`

---

### 3. Add Expense

**File:** `add_expense.html`

A clean form for logging a new expense:

| Field | Details |
|---|---|
| **Amount** | Large numeric input, auto-focuses on load. Currency symbol shown dynamically from settings. |
| **Category** | Pill-style radio buttons: Food, Transport, Home, Shopping, Other |
| **Date** | Custom-styled date picker (hidden native `<input type="date">` overlaid) |
| **Note** | Optional free-text textarea. Used as the expense title; falls back to category name if empty. |

#### Submit Flow
1. An expense object is created: `{ id: Date.now(), amount, category, title, date }`.
2. Saved to the `Vertex_expenses` array in `localStorage` via `saveExpense()`.
3. A green success toast notification animates briefly.
4. User is redirected to `dashboard.html` after 1 second.

---

### 4. History

**File:** `history.html`

Displays the **complete, reverse-chronological list** of all expenses.

- Each row shows: category icon, title, formatted date, amount, and a **Delete** button (appears on hover).
- Clicking **Delete** triggers a confirmation dialog, then calls `deleteExpense(id)` and re-renders the list.
- Shows an empty-state illustration when no expenses exist.

---

### 5. Settings

**File:** `settings.html`

Divided into multiple sections:

#### Profile
- Displays the logged-in username from `localStorage`.

#### Preferences
- **Currency**: A hidden `<select>` overlaid on a custom-styled row. Changing it saves to `Vertex_currency` and updates the display throughout the app via `Intl.NumberFormat`.
- **Dark Mode**: A toggle switch. Adds/removes `dark` class on `<html>`. Preference saved to `Vertex_theme`.

#### Financial Goals
- **Monthly Income**: Clicking the row opens a `prompt()` dialog. The entered value is saved to `Vertex_income`. The dashboard uses this to calculate the balance.

#### Data & Privacy
- **Reset All Data**: Clears `Vertex_expenses` from `localStorage`. Theme and currency are preserved.
- **Export Data (CSV)**: Calls `exportExpensesToExcel()` which generates an HTML-table-based `.xls` file and triggers a browser download.

#### Logout
- Calls `logout()` which removes the session keys from both `localStorage` and `sessionStorage`, then redirects to `login.html`.

---

### 6. Core Logic (`app.js`)

**File:** `js/app.js`

This shared script is loaded on every page. It provides all common functions:

```
Authentication
├── checkAuth()          → Returns true if a valid session exists
├── attemptLogin()       → Registers (first time) or authenticates (returning)
├── createSession()      → Writes session flag to local or session storage
├── logout()             → Clears session and redirects to login
├── getUser()            → Returns stored username
└── isRegistered()       → Returns true if a password has been saved

Data Management
├── getExpenses()        → Parses and returns the expenses array from localStorage
├── saveExpense()        → Appends a new expense object and saves
└── deleteExpense(id)    → Filters out the expense with the matching id

Currency
├── getCurrency()        → Returns stored currency code (default: USD)
├── setCurrency(code)    → Saves currency preference
├── getCurrencySymbol()  → Extracts the symbol (e.g., '$', '₹') using Intl API
└── formatCurrency(amt)  → Formats a number as currency string (e.g., '$1,234.00')

Income
├── getIncome()          → Returns stored monthly income (default: 0)
└── setIncome(amount)    → Saves monthly income

Utilities
├── formatDate(dateStr)  → Formats ISO date to 'Jan 5, 02:30 PM' style
└── exportExpensesToExcel() → Generates and downloads an .xls file

PWA
└── Service Worker registration runs on every page load
```

#### Global Auth Guard
At the bottom of `app.js`, a guard runs on every page **except** `login.html`:
```js
if (!window.location.pathname.includes('login.html')) {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
}
```
This prevents unauthenticated access to any page.

---

### 7. PWA & Service Worker

**Files:** `sw.js`, `manifest.json`

#### manifest.json
Defines the app's identity for installation:
- `name`: "Vertex Expense Tracker"
- `short_name`: "Vertex"
- `start_url`: `login.html`
- `display`: `standalone` (hides browser UI when installed)
- `theme_color` / `background_color`: Metallic Black `#050505`

#### sw.js (Service Worker)
Uses a **Cache-First** strategy:

1. **Install**: Caches all core app assets (HTML files, JS, fonts, icon, Tailwind CDN).
2. **Fetch**: For every network request, checks the cache first. If found, serves from cache without hitting the network (offline support). If not cached, falls back to the network.
3. **Activate**: Deletes any old caches from previous versions (cache key: `Vertex-v6`).

This means after the first load, the entire app works **completely offline**.

---

## 🗄️ Data Storage Architecture

All data lives in the browser's `localStorage` (except the session-only flag). Here's the full reference:

| Key | Type | Description |
|---|---|---|
| `Vertex_user` | `string` | Registered username |
| `Vertex_password` | `string` | Registered password (plain text) |
| `Vertex_session` | `'true'` | Persistent login flag (localStorage) |
| `Vertex_session` | `'true'` | Temporary login flag (sessionStorage) |
| `Vertex_expenses` | `JSON string` | Array of expense objects |
| `Vertex_income` | `string` | Monthly income amount |
| `Vertex_currency` | `string` | Currency code (e.g., `'INR'`) |
| `Vertex_theme` | `'dark'` / `'light'` | UI theme preference |

#### Expense Object Shape
```json
{
  "id": 1712230400000,
  "amount": 45.50,
  "category": "Food",
  "title": "Lunch at cafe",
  "date": "2026-04-04T08:00:00.000Z"
}
```

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Page structure and semantics |
| **Tailwind CSS v3** (CDN) | Utility-first styling framework |
| **Vanilla JavaScript** | All logic, DOM manipulation, data management |
| **Google Fonts — Manrope** | Display typography |
| **Google Material Symbols** | Icon library (outlined & filled variants) |
| **Web Storage API** | `localStorage` + `sessionStorage` for persistence |
| **Service Worker API** | Offline caching and PWA support |
| **Intl API** | Locale-aware currency and date formatting |

---

## 🎨 Design System

The app uses a custom Tailwind config with a consistent design language:

```
Colors
├── primary:           #13ec13  (Neon Green — accents, buttons, active states)
├── primary-dark:      #0a8a0a  (Darker green for hover states)
├── background-light:  #f6f8f6  (Off-white page background)
├── background-dark:   #050505  (Metallic black page background)
├── surface-light:     #ffffff  (White cards)
└── surface-dark:      #121212  (Dark gray cards)

Typography
└── Manrope (200–800 weight range) — modern, geometric sans-serif

Animations
├── .animate-enter — Fade + slide up entrance animation for pages
└── nav-item hover — Subtle translateY(-2px) lift on nav items
```

---

## 🚀 Getting Started

No build tools or installations required. Just open the app:

### Option 1: Open directly in browser
```
Double-click login.html to open it in your default browser.
```

### Option 2: Serve with a local server (recommended for PWA features)

Using Python:
```sh
python -m http.server 8000
# Then open http://localhost:8000/login.html
```

Using Node.js / npx:
```sh
npx serve .
# Then open the provided localhost URL
```

> **Note:** Service Workers require a secure context (`https://` or `localhost`). The PWA install prompt and offline caching will only work when served via a local server or HTTPS, not by opening the HTML file directly (`file://`).

### First-time Setup
1. Open the app — you'll see the **Sign In** screen.
2. Click **"Sign Up"** to switch to registration mode.
3. Enter your name and a password (anything you like — it's stored locally).
4. You're in! Go to **Settings** to set your monthly income and preferred currency.

---

## 🔑 LocalStorage Keys Reference

Quick cheat-sheet for developers inspecting the browser's DevTools → Application → Local Storage:

```
Vertex_user       → "John Doe"
Vertex_password   → "mypassword"
Vertex_session    → "true"
Vertex_income     → "4000"
Vertex_currency   → "USD"
Vertex_theme      → "dark"
Vertex_expenses   → "[{...}, {...}]"  ← JSON array of expense objects
```

---

> Built with ❤️ — No backend, no tracking, no fuss. Your data stays on your device.
