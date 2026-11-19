
import { useEffect, useState } from "react";
import ExpenseList from "./components/ExpenseList";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [page, setPage] = useState("login");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);

  const monthlyBudget = 10000;

  // Fetch expenses for Dashboard and Reports
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
        }
      } catch (err) {
        console.error("Unable to fetch expenses:", err);
      }
    }

    fetchExpenses();
  }, [token]);

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
    setPage("login");

    setForm({
      name: "",
      username: "",
      email: "",
      password: "",
    });
  }

  // Update expenses after Add, Edit or Delete
  function updateExpenses(updatedExpenses) {
    setExpenses(updatedExpenses);
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

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const remainingBudget = monthlyBudget - totalExpenses;

  // Reports: calculate category-wise spending
  const categoryTotals = expenses.reduce((totals, expense) => {
    const category = expense.category || "Others";
    totals[category] =
      (totals[category] || 0) + Number(expense.amount || 0);
    return totals;
  }, {});

  const categoryEntries = Object.entries(categoryTotals);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 className="sidebar-logo">SpendMonitor</h1>

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
          className={page === "profile" ? "nav-link active" : "nav-link"}
          onClick={() => setPage("profile")}
        >
          <span>◉</span> Profile
        </button>

        <div className="sidebar-bottom">
          <p>Logged in as</p>
          <strong>{user?.name || user?.username}</strong>

          <button className="sidebar-logout" onClick={handleLogout}>
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

        {page === "dashboard" && (
          <section className="page-content">
            <div className="welcome-banner">
              <div>
                <h2>Good to see you!</h2>
                <p>Here is your monthly spending overview.</p>
              </div>
              <span className="welcome-icon">₹</span>
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

        {page === "expenses" && (
          <section className="page-content">
            <div className="page-intro">
              <h2>Manage Your Expenses</h2>
              <p>Add, edit and delete your daily expenses.</p>
            </div>

            <ExpenseList onExpensesChange={updateExpenses} />
          </section>
        )}

        {page === "reports" && (
          <section className="page-content">
            <div className="page-intro">
              <h2>Your Spending Analysis</h2>
              <p>Understand where your money is going.</p>
            </div>

            <div className="report-total">
              <p>Total Spending</p>
              <h2>₹{totalExpenses.toLocaleString("en-IN")}</h2>
              <span>{expenses.length} expenses recorded</span>
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

        {page === "profile" && (
          <section className="page-content">
            <div className="profile-card">
              <div className="profile-avatar">
                {(user?.name || user?.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

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

              <button className="profile-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;

