
const form = document.getElementById("transaction-form");
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const filterInput = document.getElementById("filter");
const transactionList = document.getElementById("transaction-list");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");
const todayElement = document.getElementById("today");

const STORAGE_KEY = "expenseTrackTransactions";

let transactions = [];

try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = savedData ? JSON.parse(savedData) : [];

    if (Array.isArray(parsedData)) {
        transactions = parsedData.filter(item =>
            item &&
            typeof item.id === "string" &&
            typeof item.description === "string" &&
            typeof item.amount === "number" &&
            Number.isFinite(item.amount) &&
            item.amount > 0 &&
            ["income", "expense"].includes(item.type) &&
            typeof item.category === "string" &&
            typeof item.date === "string"
        );
    }
} catch (error) {
    transactions = [];
}

const currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
});

function formatMoney(amount) {
    return currency.format(amount);
}

function getLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
    const parts = dateString.split("-");

    if (parts.length !== 3) {
        return dateString;
    }

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

todayElement.textContent = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
});

dateInput.value = getLocalDate();

function saveTransactions() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(transactions)
        );
    } catch (error) {
        alert("Unable to save data in this browser. Please check storage settings.");
    }
}

function updateSummary() {
    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    balanceElement.textContent = formatMoney(
        totalIncome - totalExpenses
    );

    incomeElement.textContent = formatMoney(totalIncome);
    expensesElement.textContent = formatMoney(totalExpenses);
}

function getCategoryIcon(category) {
    const icons = {
        Food: "🍔",
        Travel: "🚌",
        Education: "📚",
        Shopping: "🛍️",
        Bills: "🧾",
        Salary: "💰",
        Other: "📌"
    };

    return icons[category] || "💳";
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function renderTransactions() {
    const selectedFilter = filterInput.value;

    const filteredTransactions = transactions
        .filter(item =>
            selectedFilter === "all" ||
            item.type === selectedFilter
        )
        .sort((a, b) => {
            const dateOrder = b.date.localeCompare(a.date);

            return dateOrder || b.id.localeCompare(a.id);
        });

    transactionList.replaceChildren();

    if (filteredTransactions.length === 0) {
        const message = selectedFilter === "all"
            ? "No transactions yet. Add your first one!"
            : `No ${selectedFilter} transactions found.`;

        transactionList.appendChild(
            createElement("p", "empty-state", message)
        );

        return;
    }

    filteredTransactions.forEach(item => {
        const row = createElement("div", "transaction-item");
        const info = createElement("div", "transaction-info");

        const icon = createElement(
            "div",
            "transaction-icon",
            getCategoryIcon(item.category)
        );

        const details = createElement("div");
        const title = createElement("h3", "", item.description);

        const subtitle = createElement(
            "p",
            "",
            `${item.category} · ${formatDate(item.date)}`
        );

        details.append(title, subtitle);
        info.append(icon, details);

        const right = createElement("div", "transaction-right");

        const isIncome = item.type === "income";

        const amount = createElement(
            "p",
            `transaction-amount ${isIncome ? "positive" : "negative"}`,
            `${isIncome ? "+" : "−"}${formatMoney(item.amount)}`
        );

        const deleteButton = createElement(
            "button",
            "delete-btn",
            "Delete"
        );

        deleteButton.type = "button";
        deleteButton.setAttribute(
            "aria-label",
            `Delete transaction: ${item.description}`
        );

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete "${item.description}"?`
            );

            if (!confirmed) {
                return;
            }

            transactions = transactions.filter(
                transaction => transaction.id !== item.id
            );

            saveTransactions();
            updateSummary();
            renderTransactions();
        });

        right.append(amount, deleteButton);
        row.append(info, right);
        transactionList.appendChild(row);
    });
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (!description) {
        alert("Please enter a description.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter an amount greater than zero.");
        return;
    }

    if (!["income", "expense"].includes(type)) {
        alert("Please select a valid transaction type.");
        return;
    }

    if (!date || date > getLocalDate()) {
        alert("Please enter a valid date that is not in the future.");
        return;
    }

    const transaction = {
        id: crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description,
        amount,
        type,
        category,
        date
    };

    transactions.push(transaction);

    saveTransactions();
    updateSummary();
    renderTransactions();

    form.reset();
    dateInput.value = getLocalDate();
    typeInput.value = "expense";
    categoryInput.value = "Food";
    descriptionInput.focus();
});

filterInput.addEventListener("change", renderTransactions);

function renderMonthlyChart() {
    const chart = document.getElementById("monthly-chart");

    if (!chart) return;

    chart.replaceChildren();

    const now = new Date();
    const months = [];

    // Build the current month and the previous five months.
    for (let i = 5; i >= 0; i--) {
        const date = new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
        );

        const year = date.getFullYear();
        const month = date.getMonth();

        months.push({
            year,
            month,
            key: `${year}-${String(month + 1).padStart(2, "0")}`,
            label: date.toLocaleDateString("en-IN", {
                month: "short"
            })
        });
    }

    const totals = months.map(month => {
        return transactions
            .filter(item =>
                item.type === "expense" &&
                item.date.slice(0, 7) === month.key
            )
            .reduce((sum, item) => sum + item.amount, 0);
    });

    const maxExpense = Math.max(...totals, 0);

    months.forEach((month, index) => {
        const column = createElement("div", "chart-column");
        const total = totals[index];

        const value = createElement(
            "span",
            "chart-value",
            total === 0 ? "₹0" : formatCompactMoney(total)
        );

        const barArea = createElement("div", "chart-bar-area");
        const bar = createElement(
            "div",
            `chart-bar ${index === 5 ? "current-month" : ""}`
        );

        const height = maxExpense > 0
            ? (total / maxExpense) * 100
            : 0;

        bar.style.height = `${height}%`;

        bar.setAttribute(
            "aria-label",
            `${month.label}: ${formatMoney(total)} in expenses`
        );

        bar.title = `${month.label}: ${formatMoney(total)}`;

        barArea.appendChild(bar);

        const label = createElement(
            "span",
            "chart-month",
            month.label
        );

        column.append(value, barArea, label);
        chart.appendChild(column);
    });

    chart.setAttribute(
        "aria-label",
        "Monthly expenses for the last six months, in chronological order"
    );
}

function formatCompactMoney(amount) {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    }

    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}k`;
    }

    return `₹${Math.round(amount)}`;
}

// Display saved data when the page opens.
updateSummary();
renderTransactions();
