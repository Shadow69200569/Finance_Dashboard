/**
 * Vertex Expense Tracker - Shared Logic
 * Handles data persistence via LocalStorage and common utilities.
 */

// --- Service Worker Registration for PWA ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                // console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                // console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// --- Constants & State ---
const EXPENSES_KEY = 'Vertex_expenses';
const THEME_KEY = 'Vertex_theme';
// Auth Keys
const USER_KEY = 'Vertex_user';          // Stores registered Name (Permanent)
const PASSWORD_KEY = 'Vertex_password';  // Stores registered Password (Permanent)
const SESSION_KEY = 'Vertex_session';    // Stores "Active Session" flag

// --- Auth Management ---

function checkAuth() {
    // Check both Local (Persistent) and Session (Temporary) storage
    return localStorage.getItem(SESSION_KEY) === 'true' || sessionStorage.getItem(SESSION_KEY) === 'true';
}

/**
 * Handles Registration (First Time) and Login (Returning)
 */
function attemptLogin(name, password, rememberMe) {
    const storedPassword = localStorage.getItem(PASSWORD_KEY);

    if (!storedPassword) {
        // --- REGISTRATION FLOW ---
        localStorage.setItem(USER_KEY, name);
        localStorage.setItem(PASSWORD_KEY, password);
        createSession(rememberMe);
        return true;
    } else {
        // --- LOGIN FLOW ---
        if (password === storedPassword) {
            // Update name just in case
            localStorage.setItem(USER_KEY, name);
            createSession(rememberMe);
            return true;
        } else {
            return false;
        }
    }
}

function createSession(rememberMe) {
    if (rememberMe) {
        localStorage.setItem(SESSION_KEY, 'true');
    } else {
        sessionStorage.setItem(SESSION_KEY, 'true');
    }
}

function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = 'login.html';
    }
}

function getUser() {
    return localStorage.getItem(USER_KEY) || 'User';
}

function isRegistered() {
    return localStorage.getItem(PASSWORD_KEY) !== null;
}

// --- Data Management ---

function getExpenses() {
    const expensesJSON = localStorage.getItem(EXPENSES_KEY);
    return expensesJSON ? JSON.parse(expensesJSON) : [];
}

function saveExpense(expense) {
    const expenses = getExpenses();
    expenses.push(expense);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

function deleteExpense(id) {
    let expenses = getExpenses();
    expenses = expenses.filter(exp => exp.id !== id);
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// --- Currency Management ---

const CURRENCY_KEY = 'Vertex_currency';

function getCurrency() {
    return localStorage.getItem(CURRENCY_KEY) || 'USD';
}

function setCurrency(currencyCode) {
    localStorage.setItem(CURRENCY_KEY, currencyCode);
}

// --- Income Management ---

const INCOME_KEY = 'Vertex_income';

function getIncome() {
    const income = localStorage.getItem(INCOME_KEY);
    return income ? parseFloat(income) : 0.00; // Default to 0 if not set
}

function setIncome(amount) {
    localStorage.setItem(INCOME_KEY, amount);
}

// --- Formatters ---

function formatCurrency(amount) {
    const currency = getCurrency();
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        currencyDisplay: 'symbol'
    }).format(amount);
}

function getCurrencySymbol() {
    const currency = getCurrency();
    return (0).toLocaleString('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).replace(/\d/g, '').trim();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// --- Data Export ---

// --- Data Export ---

function exportExpensesToExcel() {
    const expenses = getExpenses();
    if (expenses.length === 0) {
        alert('No data to export.');
        return;
    }

    const currency = getCurrency();
    const date = new Date().toISOString().slice(0, 10);
    const filename = `Vertex_export_${date}.xls`;

    // Create an HTML Table string which Excel can open
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

    // Create Blob and Download
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// --- Mock Data Init (Removed) ---
// function initData() { ... }

// Initialize on load
// initData();

// Global Auth Check (Skip for login.html)
if (!window.location.pathname.includes('login.html')) {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
}
