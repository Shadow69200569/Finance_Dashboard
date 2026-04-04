/**
 * ============================================================
 *  Vertex Expense Tracker — Shared Core Logic (app.js)
 * ============================================================
 *  This file is loaded on EVERY page. It provides:
 *    - PWA Service Worker registration
 *    - Authentication helpers (login, logout, session)
 *    - Data management (CRUD for expenses)
 *    - Currency & income helpers
 *    - Formatting utilities (currency, date)
 *    - Excel export
 *    - Global auth guard (redirect to login if not authenticated)
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  PWA: Register Service Worker for Offline Support
//  The SW caches all app assets on first load so the app
//  works completely offline on subsequent visits.
// ─────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                // Registration successful — scope logged here if needed
                // console.log('SW registered, scope:', registration.scope);
            })
            .catch(err => {
                // Registration failed — app still works, just not offline
                // console.error('SW registration failed:', err);
            });
    });
}

// ─────────────────────────────────────────────────────────────
//  LocalStorage Key Constants
//  Centralised here so no magic strings are scattered around.
// ─────────────────────────────────────────────────────────────
const EXPENSES_KEY = 'Vertex_expenses';   // JSON array of expense objects
const THEME_KEY    = 'Vertex_theme';      // 'dark' | 'light'
const USER_KEY     = 'Vertex_user';       // Stores the registered username (permanent)
const PASSWORD_KEY = 'Vertex_password';   // Stores the registered password (permanent)
const SESSION_KEY  = 'Vertex_session';    // 'true' when a session is active


// ═══════════════════════════════════════════════════════════════
//  AUTHENTICATION
// ═══════════════════════════════════════════════════════════════

/**
 * checkAuth()
 * ───────────
 * Returns true if the user has an active session.
 * Checks BOTH localStorage (persistent "Remember Me" session)
 * and sessionStorage (tab-only session without "Remember Me").
 */
function checkAuth() {
    return (
        localStorage.getItem(SESSION_KEY) === 'true' ||
        sessionStorage.getItem(SESSION_KEY) === 'true'
    );
}

/**
 * attemptLogin(name, password, rememberMe)
 * ─────────────────────────────────────────
 * Dual-purpose: handles REGISTRATION on first use, and LOGIN on repeat visits.
 *
 *  First time (no password saved) → Registers the user.
 *  Returning user                 → Validates the password.
 *
 * @param {string}  name       - The username entered by the user.
 * @param {string}  password   - The password entered by the user.
 * @param {boolean} rememberMe - If true, session persists across browser restarts.
 * @returns {boolean} true = success, false = wrong password.
 */
function attemptLogin(name, password, rememberMe) {
    const storedPassword = localStorage.getItem(PASSWORD_KEY);

    if (!storedPassword) {
        // ── REGISTRATION FLOW (no account exists yet) ──
        localStorage.setItem(USER_KEY, name);         // Save username
        localStorage.setItem(PASSWORD_KEY, password); // Save password
        createSession(rememberMe);                    // Create session
        return true;
    } else {
        // ── LOGIN FLOW (account already exists) ──
        if (password === storedPassword) {
            // Correct password — also update name in case it changed
            localStorage.setItem(USER_KEY, name);
            createSession(rememberMe);
            return true;
        } else {
            // Wrong password
            return false;
        }
    }
}

/**
 * createSession(rememberMe)
 * ─────────────────────────
 * Writes the session flag to the appropriate storage:
 *  - localStorage  → Survives browser restarts ("Remember Me")
 *  - sessionStorage → Cleared when the tab/browser is closed
 *
 * @param {boolean} rememberMe
 */
function createSession(rememberMe) {
    if (rememberMe) {
        localStorage.setItem(SESSION_KEY, 'true');
    } else {
        sessionStorage.setItem(SESSION_KEY, 'true');
    }
}

/**
 * logout()
 * ────────
 * Asks for confirmation, then clears the session from both storages
 * and redirects to the login page.
 */
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }
}

/**
 * getUser()
 * ─────────
 * Returns the stored username. Falls back to 'User' if none found.
 * @returns {string}
 */
function getUser() {
    return localStorage.getItem(USER_KEY) || 'User';
}

/**
 * isRegistered()
 * ──────────────
 * Returns true if a password entry exists, meaning the user has
 * previously created an account on this device.
 * @returns {boolean}
 */
function isRegistered() {
    return localStorage.getItem(PASSWORD_KEY) !== null;
}


// ═══════════════════════════════════════════════════════════════
//  EXPENSE DATA MANAGEMENT
//  Expenses are stored as a JSON array in localStorage.
//  Each expense object: { id, amount, category, title, date }
// ═══════════════════════════════════════════════════════════════

/**
 * getExpenses()
 * ─────────────
 * Reads and parses the expenses array from localStorage.
 * Returns an empty array if no expenses have been saved yet.
 * @returns {Array} Array of expense objects.
 */
function getExpenses() {
    const expensesJSON = localStorage.getItem(EXPENSES_KEY);
    return expensesJSON ? JSON.parse(expensesJSON) : [];
}

/**
 * saveExpense(expense)
 * ────────────────────
 * Appends a new expense object to the existing array and saves it back.
 * @param {Object} expense - The new expense object to add.
 */
function saveExpense(expense) {
    const expenses = getExpenses(); // Load current list
    expenses.push(expense);         // Append the new expense
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)); // Save updated list
}

/**
 * deleteExpense(id)
 * ─────────────────
 * Removes the expense with the given id from localStorage.
 * Uses the timestamp-based id (Date.now()) set when the expense was created.
 * @param {number} id - The unique ID of the expense to delete.
 */
function deleteExpense(id) {
    let expenses = getExpenses();
    // Filter out the expense whose id matches — all others stay
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}


// ═══════════════════════════════════════════════════════════════
//  CURRENCY MANAGEMENT
//  The currency code (e.g., 'USD', 'INR') is stored in localStorage.
//  The Intl.NumberFormat API handles all formatting and symbol extraction.
// ═══════════════════════════════════════════════════════════════

const CURRENCY_KEY = 'Vertex_currency';

/**
 * getCurrency()
 * ─────────────
 * Returns the user's selected currency code. Defaults to 'USD'.
 * @returns {string} ISO 4217 currency code, e.g. 'USD', 'INR'.
 */
function getCurrency() {
    return localStorage.getItem(CURRENCY_KEY) || 'USD';
}

/**
 * setCurrency(currencyCode)
 * ─────────────────────────
 * Saves the selected currency code to localStorage.
 * @param {string} currencyCode - e.g. 'EUR', 'GBP'.
 */
function setCurrency(currencyCode) {
    localStorage.setItem(CURRENCY_KEY, currencyCode);
}


// ═══════════════════════════════════════════════════════════════
//  INCOME MANAGEMENT
//  The monthly income is stored as a plain number string.
//  It is used on the dashboard to calculate the remaining balance.
// ═══════════════════════════════════════════════════════════════

const INCOME_KEY = 'Vertex_income';

/**
 * getIncome()
 * ───────────
 * Returns the user's saved monthly income as a float.
 * Defaults to 0 if not set.
 * @returns {number}
 */
function getIncome() {
    const income = localStorage.getItem(INCOME_KEY);
    return income ? parseFloat(income) : 0.00;
}

/**
 * setIncome(amount)
 * ─────────────────
 * Saves the user's monthly income to localStorage.
 * @param {number|string} amount - The income value to save.
 */
function setIncome(amount) {
    localStorage.setItem(INCOME_KEY, amount);
}


// ═══════════════════════════════════════════════════════════════
//  FORMATTING UTILITIES
//  Uses the built-in Intl API for locale-aware formatting.
// ═══════════════════════════════════════════════════════════════

/**
 * formatCurrency(amount)
 * ──────────────────────
 * Formats a number into a locale-aware currency string.
 * Example: formatCurrency(1234.5) → '$1,234.50' (for USD)
 *
 * @param {number} amount - The numeric value to format.
 * @returns {string} Formatted currency string.
 */
function formatCurrency(amount) {
    const currency = getCurrency();
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol'
    }).format(amount);
}

/**
 * getCurrencySymbol()
 * ───────────────────
 * Extracts just the currency symbol (e.g. '$', '₹', '€')
 * by formatting zero and stripping all digits.
 * Used to preview the symbol in the amount input on add_expense.html.
 *
 * @returns {string} The currency symbol character(s).
 */
function getCurrencySymbol() {
    const currency = getCurrency();
    return (0).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/\d/g, '').trim(); // Remove '0', keep only the symbol
}

/**
 * formatDate(dateString)
 * ──────────────────────
 * Formats an ISO date string to a human-readable short form.
 * Example: '2026-04-04T08:00:00.000Z' → 'Apr 4, 08:00 AM'
 *
 * @param {string} dateString - An ISO 8601 date string.
 * @returns {string} Formatted date + time string.
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}


// ═══════════════════════════════════════════════════════════════
//  DATA EXPORT
//  Generates an HTML-table-based .xls file and triggers download.
//  Excel can open HTML files with the .xls extension natively.
// ═══════════════════════════════════════════════════════════════

/**
 * exportExpensesToExcel()
 * ───────────────────────
 * Creates an XLS-compatible HTML table string from all stored expenses,
 * wraps it in a Blob, and triggers a browser file download.
 * The file is named: Vertex_export_YYYY-MM-DD.xls
 */
function exportExpensesToExcel() {
    const expenses = getExpenses();

    // Guard: don't export if there's nothing to export
    if (expenses.length === 0) {
        alert('No data to export.');
        return;
    }

    const currency = getCurrency();
    const date = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
    const filename = `Vertex_export_${date}.xls`;

    // Build the HTML table string — Excel reads this format
    let table = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Expenses</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        </head>
        <body>
            <table border="1">
                <thead>
                    <!-- Header row styled with Vertex's neon green brand color -->
                    <tr style="background-color: #13ec13; color: white; font-weight: bold;">
                        <th>ID</th>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Currency</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Add one row per expense
    expenses.forEach(exp => {
        table += `
            <tr>
                <td>${exp.id}</td>
                <td>${new Date(exp.date).toLocaleDateString()}</td>
                <td>${exp.title}</td>
                <td>${exp.category}</td>
                <td>${exp.amount}</td>
                <td>${currency}</td>
            </tr>
        `;
    });

    table += `
                </tbody>
            </table>
        </body>
        </html>
    `;

    // Create a Blob from the HTML string, create a temporary link, and click it
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();                        // Trigger download
    document.body.removeChild(link);     // Clean up the DOM
    URL.revokeObjectURL(url);            // Free memory
}


// ═══════════════════════════════════════════════════════════════
//  GLOBAL AUTH GUARD
//  Runs on every page EXCEPT login.html.
//  If no valid session is found, redirect to the login page.
//  This prevents direct URL access to protected pages.
// ═══════════════════════════════════════════════════════════════
if (!window.location.pathname.includes('login.html')) {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
}
