# 💸 Vertex — Personal Finance Dashboard

> A sleek, high-performance, **Progressive Web App (PWA)** for tracking personal expenses. Optimized for premium desktop and mobile experiences, featuring fluid transitions, offline support, and zero-backend local persistence.

![Version](https://img.shields.io/badge/version-1.1.0-brightgreen)
![PWA](https://img.shields.io/badge/PWA-ready-blue)
![Adaptive](https://img.shields.io/badge/Layout-Adaptive-purple)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Premium Enhancements](#-premium-enhancements)
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
- [Deployment](#-deployment)
- [LocalStorage Keys Reference](#-localstorage-keys-reference)

---

## 🌟 Overview

**Vertex** is a zero-backend personal finance tool designed for modern users. Everything runs in the browser — all data is persisted using the browser's `localStorage`. This ensures maximum privacy, lightning-fast performance, and a 100% offline-first experience.

The app effectively bridges the gap between mobile PWAs and desktop productivity tools through a **Dynamic Adaptive Layout** system.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Login / Sign Up | Local authentication with secure redirects and "Remember Me" session management. |
| 📊 Dynamic Dashboard | Adaptive 2-column grid featuring high-level summaries and detailed activity feeds. |
| ✨ Smooth Transitions | Powered by the **View Transitions API** for fluid, app-like navigation between tabs. |
| ➕ Power Entry | Desktop-optimized 2-column form with Quick-Amount buttons and Category grids. |
| 📜 History | Comprehensive 2-column record view with Statistics Pane and CSV Export tools. |
| 📤 Export to CSV | RFC 4180-compliant export with UTF-8 BOM for perfect Excel/Numbers compatibility. |
| 💰 Custom Selectors | High-contrast custom modals for Currency and Income selection, fixing visibility issues. |
| ⚡ Link Prefetching | Under-the-hood optimization that loads pages on hover for instant navigation. |
| 📱 PWA Ready | Installable on any platform with full offline support via Service Worker. |

---

## 🔥 Premium Enhancements

### 🖥️ Desktop Optimization (Adaptive Grid)
Every page in Vertex is now hand-crafted for desktop power users:
- **Dashboard**: Uses a 12-column grid where the summary chart and balance occupy the primary space, and recent activity stays pinned to the right.
- **History**: Features a persistent left-column for lifetime statistics and data tools, with the main record list on the right.
- **Settings**: A spacious 3-column layout grouping Profile, Preferences, and Data Management into clean focus areas.

### 🎭 View Transitions API
We've integrated the experimental **View Transitions API** to provide native-feeling animations. When navigating between "Home", "History", and "Settings", elements transition with a fluid, hardware-accelerated cross-fade that significantly improves the perceived quality of the app.

### 🚀 Performance: Hover-to-Prefetch
Vertex utilizes a "Link Prefetching" strategy. As soon as you hover over a navigation link in the sidebar or bottom bar, the app begins loading that page's resources in the background. This results in **near-instantaneous** transitions when the user actually clicks.

---

## 📁 Project Structure

```
Finance_Dashboard/
│
├── index.html          # Entry point (formerly login.html) — Logic & Sign Up
├── dashboard.html      # Main screen — Adaptive 2-column financial overview
├── add_expense.html    # Entry form — Desktop-optimized 2-column logging
├── history.html        # Record log — 2-column search & history view
├── settings.html       # Preferences — 3-column dashboard & account tools
│
├── js/
│   └── app.js          # Shared core logic: Prefetching, View Transitions, Export
│
├── sw.js               # Service Worker for offline caching
├── manifest.json       # PWA Manifest (index.html as start_url)
├── vertex_app_icon.png # High-quality UI branding asset
└── README.md           # This file
```

---

## 🔍 How It Works

### 1. Authentication Flow
**File:** `index.html` + `js/app.js`  
The app entry point is `index.html`. It detects if a user is registered on the device. If not, it defaults to Sign Up mode. Authentication status is verified by a global guard in `app.js` that enforces security across all dashboard pages.

### 2. Dashboard
**File:** `dashboard.html`  
Leverages Tailwind's grid system to create a dashboard that feels like a professional trading platform on desktop. Includes a dynamic **Spending Progress Bar** that turns red once you hit 80% of your budget.

### 3. Core Logic (`app.js`)
The engine of the app. It handles:
- **Data persistence**: CRUD operations for `localStorage`.
- **Global Formatters**: Intelligent currency and date formatting using the `Intl` API.
- **View Transitions**: Global wrapper for smooth page swaps.
- **Prefetching**: Event listeners for hover-state optimization.

---

## 🛠️ Technology Stack

- **HTML5 / Vanilla JS**: Zero dependencies for core logic.
- **Tailwind CSS v3**: Modern utility-first styling.
- **View Transitions API**: Advanced interaction design.
- **Service Worker API**: Persistent offline accessibility.
- **Intl API**: High-precision currency and date formatting.

---

## 🚀 Deployment

Vertex is optimized for deployment on modern static hosting platforms like **Netlify**, **Vercel**, or **GitHub Pages**.

1. **Start URL**: The project uses `index.html` as the entry point for standard compatibility.
2. **PWA Support**: Ensure your hosting provider supports HTTPS to enable Service Worker and the "Install App" prompt.
3. **PWA Install**: On Desktop Chrome/Edge, look for the "Install" icon in the URL bar. On iOS Safari, use "Add to Home Screen".

---

## 🔑 LocalStorage Keys Reference

- `Vertex_user`: Registered username.
- `Vertex_password`: Local password (stored in plain text on your device).
- `Vertex_expenses`: JSON array of all transaction data.
- `Vertex_income`: Your set monthly budget.
- `Vertex_currency`: Preferred currency code (USD, GBP, etc.).
- `Vertex_theme`: Active theme (dark/light).

---

> Built with ❤️ — Your financial data never leaves your device.
