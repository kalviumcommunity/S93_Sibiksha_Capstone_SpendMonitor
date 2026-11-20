
import { useEffect, useState } from "react";
import ExpenseList from "./components/ExpenseList";
import "./App.css";

const API_URL = "https://s93-sibiksha-capstone-spendmonitor.onrender.com";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getExpenseMonth(expense) {
  const dateValue = expense.date || expense.createdAt;

  if (!dateValue) return "";

  if (typeof dateValue === "string" && /^\d{4}-\d{2}/.test(dateValue)) {
    return dateValue.slice(0, 7);
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonth(month) {
  const [year, monthNumber] = month.split("-");
  const date = new Date(Number(year), Number(monthNumber) - 1);

  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function App() {
  const [page, setPage] = useState(() =>
  localStorage.getItem("token") ? "dashboard" : "login"
);

  const [token, setToken] = useState(
  () => localStorage.getItem("token") || ""
);

const [user, setUser] = useState(() => {
  const savedUser = localStorage.getItem("user");
  return savedUser ? JSON.parse(savedUser) : null;
});


  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  // Monthly budget states
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [budget, setBudget] = useState(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetMessage, setBudgetMessage] = useState("");
  const [budgetError, setBudgetError] = useState("");

  // Budget history states
  const [budgetHistory, setBudgetHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Fetch expenses
  useEffect(() => {
    async function fetchExpenses() {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/api/expenses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setExpenses(result.data);
        } else if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setToken("");
          setUser(null);
          setExpenses([]);
          setBudget(null);
          setBudgetHistory([]);
          setPage("login");
        }
      } catch (err) {
        console.error("Unable to fetch expenses:", err);
      }
    }

    fetchExpenses();
  }, [token]);

  // Fetch budget whenever selected month changes
  useEffect(() => {
    async function fetchBudget() {
      if (!token) return;

      setBudgetLoading(true);
      setBudgetError("");
      setBudgetMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/budgets/${selectedMonth}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Unable to fetch budget.");
        }

        setBudget(result.data);
        setBudgetInput(result.data ? String(result.data.amount) : "");
      } catch (err) {
        setBudget(null);
        setBudgetInput("");
        setBudgetError(err.message);
      } finally {
        setBudgetLoading(false);
      }
    }

    fetchBudget();
  }, [token, selectedMonth]);

  // Fetch monthly budget history
  useEffect(() => {
    async function fetchBudgetHistory() {
      if (!token || page !== "history") return;

      setHistoryLoading(true);
      setHistoryError("");

      try {
        const response = await fetch(
          `${API_URL}/api/budgets/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to fetch budget history."
          );
        }

        setBudgetHistory(result.data || []);
      } catch (err) {
        setHistoryError(err.message);
      } finally {
        setHistoryLoading(false);
      }
    }

    fetchBudgetHistory();
  }, [token, page]);

  // Login and Register form
  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        page === "register" ? "/api/auth/register" : "/api/auth/login";

      const body =
        page === "register"
          ? form
          : {
              username: form.username,
              password: form.password,
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      if (page === "register") {
        setPage("login");
        setForm({
          name: "",
          username: form.username,
          email: "",
          password: "",
        });
        alert("Registration successful! Please login.");
      } else {
        localStorage.setItem("token", result.token);
        localStorage.setItem("user", JSON.stringify(result.data));

        setToken(result.token);
        setUser(result.data);
        setPage("dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Logout
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken("");
    setUser(null);
    setExpenses([]);
    setBudget(null);
    setBudgetInput("");
    setBudgetHistory([]);
    setPage("login");
    setShowLogoutPopup(false);

    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
    });
  }

  function confirmLogout() {
    handleLogout();
  }

  // Update expenses after Add, Edit or Delete
  function updateExpenses(updatedExpenses) {
    setExpenses(updatedExpenses);
  }

  // Save monthly budget
  async function handleSaveBudget(event) {
    event.preventDefault();

    const amount = Number(budgetInput);

    if (!budgetInput.trim() || !Number.isFinite(amount) || amount <= 0) {
      setBudgetError("Please enter a valid budget amount greater than zero.");
      setBudgetMessage("");
      return;
    }

    setBudgetSaving(true);
    setBudgetError("");
    setBudgetMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/budgets/${selectedMonth}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to save budget.");
      }

      setBudget(result.data);
      setBudgetInput(String(result.data.amount));
      setBudgetMessage("Monthly budget saved successfully.");
    } catch (err) {
      setBudgetError(err.message);
    } finally {
      setBudgetSaving(false);
    }
  }

  // Login and Register pages
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>SpendMonitor</h1>
          <p className="subtitle">Manage your spending smartly</p>

          <h2>{page === "register" ? "Create Account" : "Welcome Back!"}</h2>

          <form onSubmit={handleSubmit}>
            {page === "register" && (
              <>
                <input
                  name="name"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </>
            )}

            <input
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              minLength={8}
              required
            />

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : page === "register"
                  ? "Register"
                  : "Login"}
            </button>
          </form>

          <p className="switch-text">
            {page === "register"
              ? "Already have an account?"
              : "Don't have an account?"}

            <button
              className="switch-btn"
              onClick={() => {
                setError("");
                setPage(page === "register" ? "login" : "register");
              }}
            >
              {page === "register" ? "Login" : "Register"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Filter expenses for selected month
  const monthlyExpenses = expenses.filter(
    (expense) => getExpenseMonth(expense) === selectedMonth
  );

  const totalExpenses = monthlyExpenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const monthlyBudget = budget ? Number(budget.amount) : 0;
  const remainingBudget = monthlyBudget - totalExpenses;

  const budgetPercentage =
    monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0;

  const progressPercentage = Math.min(budgetPercentage, 100);

  const budgetStatus =
    monthlyBudget === 0
      ? "Set a budget to track your spending."
      : budgetPercentage >= 100
        ? "You have exceeded your monthly budget!"
        : budgetPercentage >= 80
          ? "Warning! You have used 80% or more of your budget."
          : "Your spending is within the budget.";

  // Reports: category-wise spending
  const categoryTotals = monthlyExpenses.reduce((totals, expense) => {
    const category = expense.category || "Others";
    totals[category] =
      (totals[category] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});

  const categoryEntries = Object.entries(categoryTotals);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <button
  className="sidebar-logo"
  onClick={() => setPage("profile")}
  aria-label="Open Profile"
>
  <span className="logo-icon">S</span>
  <span>SpendMonitor</span>
</button>


        <p className="sidebar-label">MENU</p>

        <button
          className={page === "dashboard" ? "nav-link active" : "nav-link"}
          onClick={() => setPage("dashboard")}
        >
          <span>▦</span> Dashboard
        </button>

        <button
          className={page === "expenses" ? "nav-link active" : "nav-link"}
          onClick={() => setPage("expenses")}
        >
          <span>₹</span> Expenses
        </button>

        <button
          className={page === "reports" ? "nav-link active" : "nav-link"}
          onClick={() => setPage("reports")}
        >
          <span>▥</span> Reports
        </button>

        <button
          className={page === "history" ? "nav-link active" : "nav-link"}
          onClick={() => setPage("history")}
        >
          <span>◷</span> Budget History
        </button>

        <button
          className={page === "profile" ? "nav-link active" : "nav-link"}
          onClick={() => setPage("profile")}
        >
          <span>◉</span> Profile
        </button>

        <div className="sidebar-bottom">
          <p>Logged in as</p>
          <strong>{user?.name || user?.username}</strong>

          <button
            className="sidebar-logout"
            onClick={() => setShowLogoutPopup(true)}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>
              {page === "dashboard" && "Dashboard"}
              {page === "expenses" && "My Expenses"}
              {page === "reports" && "Spending Reports"}
              {page === "history" && "Budget History"}
              {page === "profile" && "My Profile"}
            </h2>
            <p>Welcome back, {user?.name || user?.username}!</p>
          </div>

          <div className="topbar-avatar">
            {(user?.name || user?.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
        </header>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <section className="page-content">
            <div className="welcome-banner">
              <div>
                <h2>Good to see you!</h2>
                <p>Here is your monthly spending overview.</p>
              </div>
              <span className="welcome-icon">₹</span>
            </div>

            <div className="budget-panel">
              <div className="budget-heading">
                <div>
                  <h3>Monthly Budget Management</h3>
                  <p>Set and track your monthly spending limit.</p>
                </div>

                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  aria-label="Select budget month"
                />
              </div>

              <form className="budget-form" onSubmit={handleSaveBudget}>
                <div className="budget-input-group">
                  <label htmlFor="monthly-budget">Monthly Budget (₹)</label>
                  <input
                    id="monthly-budget"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter your monthly budget"
                    value={budgetInput}
                    onChange={(event) => setBudgetInput(event.target.value)}
                    disabled={budgetLoading}
                    required
                  />
                </div>

                <button type="submit" disabled={budgetSaving || budgetLoading}>
                  {budgetSaving
                    ? "Saving..."
                    : budget
                      ? "Update Budget"
                      : "Save Budget"}
                </button>
              </form>

              {budgetLoading && (
                <p className="budget-loading">Loading budget...</p>
              )}

              {budgetMessage && (
                <p className="budget-success">{budgetMessage}</p>
              )}

              {budgetError && (
                <p className="budget-error">{budgetError}</p>
              )}

              <div className="budget-summary">
                <div>
                  <span>Budget</span>
                  <strong>
                    ₹{monthlyBudget.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Spent</span>
                  <strong>
                    ₹{totalExpenses.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong className={remainingBudget < 0 ? "over-budget" : ""}>
                    ₹{remainingBudget.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>

              <div className="budget-progress-heading">
                <span>Budget Usage</span>
                <strong>{budgetPercentage.toFixed(1)}%</strong>
              </div>

              <div className="budget-progress-track">
                <div
                  className={
                    budgetPercentage >= 100
                      ? "budget-progress-fill danger"
                      : budgetPercentage >= 80
                        ? "budget-progress-fill warning"
                        : "budget-progress-fill"
                  }
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <p
                className={
                  budgetPercentage >= 80
                    ? "budget-status warning-text"
                    : "budget-status"
                }
              >
                {budgetStatus}
              </p>
            </div>

            <div className="summary-container">
              <div className="summary-card">
                <p>Monthly Budget</p>
                <h3>₹{monthlyBudget.toLocaleString("en-IN")}</h3>
              </div>

              <div className="summary-card">
                <p>Total Expenses</p>
                <h3>₹{totalExpenses.toLocaleString("en-IN")}</h3>
              </div>

              <div className="summary-card">
                <p>Remaining Budget</p>
                <h3>₹{remainingBudget.toLocaleString("en-IN")}</h3>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="panel-heading">
                <h3>Recent Expenses</h3>
                <button onClick={() => setPage("expenses")}>
                  View All
                </button>
              </div>

              {expenses.length === 0 ? (
                <p className="empty-message">
                  No expenses yet. Add your first expense from the Expenses page.
                </p>
              ) : (
                expenses.slice(0, 5).map((expense) => (
                  <div className="recent-expense" key={expense._id}>
                    <div>
                      <strong>{expense.title}</strong>
                      <p>{expense.category}</p>
                    </div>
                    <strong>
                      ₹{Number(expense.amount).toLocaleString("en-IN")}
                    </strong>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* EXPENSES */}
        {page === "expenses" && (
          <section className="page-content">
            <div className="page-intro">
              <h2>Manage Your Expenses</h2>
              <p>Add, edit and delete your daily expenses.</p>
            </div>

            <ExpenseList onExpensesChange={updateExpenses} />
          </section>
        )}

        {/* REPORTS */}
        {page === "reports" && (
          <section className="page-content">
            <div className="page-intro">
              <h2>Your Spending Analysis</h2>
              <p>Understand where your money is going.</p>
            </div>

            <div className="report-total">
              <p>Total Spending - {selectedMonth}</p>
              <h2>₹{totalExpenses.toLocaleString("en-IN")}</h2>
              <span>{monthlyExpenses.length} expenses recorded</span>
            </div>

            <div className="dashboard-panel">
              <h3>Category-wise Expenses</h3>

              {categoryEntries.length === 0 ? (
                <p className="empty-message">
                  No expense data available to generate a report.
                </p>
              ) : (
                categoryEntries.map(([category, total]) => {
                  const percentage =
                    totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;

                  return (
                    <div className="category-report" key={category}>
                      <div className="category-info">
                        <strong>{category}</strong>
                        <span>
                          ₹{total.toLocaleString("en-IN")} (
                          {percentage.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {/* BUDGET HISTORY */}
        {page === "history" && (
          <section className="page-content">
            <div className="page-intro">
              <h2>Monthly Budget History</h2>
              <p>Track your previous monthly budgets and spending.</p>
            </div>

            {historyLoading && (
              <div className="dashboard-panel">
                <p className="empty-message">Loading budget history...</p>
              </div>
            )}

            {historyError && (
              <div className="dashboard-panel">
                <p className="budget-error">{historyError}</p>
                <button
                  onClick={() => {
                    setHistoryError("");
                    setPage("dashboard");
                    setTimeout(() => setPage("history"), 0);
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

            {!historyLoading && !historyError && budgetHistory.length === 0 && (
              <div className="dashboard-panel">
                <p className="empty-message">
                  No budget history available yet. Save a monthly budget to see
                  it here.
                </p>
                <button onClick={() => setPage("dashboard")}>
                  Go to Dashboard
                </button>
              </div>
            )}

            {!historyLoading && !historyError && budgetHistory.length > 0 && (
              <>
                <div className="history-summary">
                  <div className="summary-card">
                    <p>Months Tracked</p>
                    <h3>{budgetHistory.length}</h3>
                  </div>

                  <div className="summary-card">
                    <p>Total Budgets</p>
                    <h3>
                      ₹
                      {budgetHistory
                        .reduce((sum, item) => sum + Number(item.budget || 0), 0)
                        .toLocaleString("en-IN")}
                    </h3>
                  </div>

                  <div className="summary-card">
                    <p>Total Expenses</p>
                    <h3>
                      ₹
                      {budgetHistory
                        .reduce(
                          (sum, item) => sum + Number(item.totalExpenses || 0),
                          0
                        )
                        .toLocaleString("en-IN")}
                    </h3>
                  </div>
                </div>

                <div className="dashboard-panel history-panel">
                  <h3>Previous Months</h3>

                  <div className="history-list">
                    {budgetHistory.map((item) => (
                      <div className="history-card" key={item._id}>
                        <div className="history-card-heading">
                          <h3>{formatMonth(item.month)}</h3>

                          <span
                            className={`history-status ${
                              item.status === "Exceeded"
                                ? "status-exceeded"
                                : item.status === "Fully Used"
                                  ? "status-used"
                                  : "status-within"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>

                        <div className="history-details">
                          <div>
                            <span>Monthly Budget</span>
                            <strong>
                              ₹{Number(item.budget).toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <div>
                            <span>Total Expenses</span>
                            <strong>
                              ₹
                              {Number(item.totalExpenses).toLocaleString("en-IN")}
                            </strong>
                          </div>

                          <div>
                            <span>Remaining Balance</span>
                            <strong
                              className={
                                item.remaining < 0 ? "over-budget" : ""
                              }
                            >
                              ₹
                              {Number(item.remaining).toLocaleString("en-IN")}
                            </strong>
                          </div>

                          {item.exceededAmount > 0 && (
                            <div>
                              <span>Exceeded Amount</span>
                              <strong className="over-budget">
                                ₹
                                {Number(item.exceededAmount).toLocaleString(
                                  "en-IN"
                                )}
                              </strong>
                            </div>
                          )}
                        </div>

                        <div className="history-progress-track">
                          <div
                            className={`history-progress-fill ${
                              item.status === "Exceeded"
                                ? "danger"
                                : item.totalExpenses / item.budget >= 0.8
                                  ? "warning"
                                  : ""
                            }`}
                            style={{
                              width: `${
                                item.budget > 0
                                  ? Math.min(
                                      (item.totalExpenses / item.budget) * 100,
                                      100
                                    )
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <section className="page-content">
            <div className="profile-card">
                <button
                      className="topbar-avatar"
                      onClick={() => setPage("profile")}
                      aria-label="Open Profile"
                    >
                      {(user?.name || user?.username || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </button>

              <h2>{user?.name || "User"}</h2>
              <p className="profile-subtitle">SpendMonitor Account</p>

              <div className="profile-details">
                <div>
                  <span>Full Name</span>
                  <strong>{user?.name || "Not available"}</strong>
                </div>

                <div>
                  <span>Username</span>
                  <strong>{user?.username || "Not available"}</strong>
                </div>

                <div>
                  <span>Email Address</span>
                  <strong>{user?.email || "Not available"}</strong>
                </div>
              </div>

              <button
                className="profile-logout"
                onClick={() => setShowLogoutPopup(true)}
              >
                Logout
              </button>
            </div>
          </section>
        )}
      </main>

      {/* LOGOUT CONFIRMATION POPUP */}
      {showLogoutPopup && (
        <div className="logout-overlay">
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <div className="logout-icon">!</div>

            <h2 id="logout-title">Confirm Logout</h2>

            <p>Are you sure you want to logout from SpendMonitor?</p>

            <div className="logout-actions">
              <button
                className="cancel-logout"
                onClick={() => setShowLogoutPopup(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-logout"
                onClick={confirmLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
