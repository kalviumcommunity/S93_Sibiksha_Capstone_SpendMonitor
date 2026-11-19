
import { useEffect, useState } from "react";

const API_URL = "http://localhost:5000/api/expenses";

function ExpenseList({ onExpensesChange }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // JWT Authorization headers
  function getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
  }

  // Fetch expenses from backend
  useEffect(() => {
    async function loadExpenses() {
      try {
        setError("");

        const response = await fetch(API_URL, {
          headers: getAuthHeaders(),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load expenses");
        }

        setExpenses(result.data);
        onExpensesChange(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadExpenses();
  }, []);

  // Add expense
  async function handleAddExpense(event) {
    event.preventDefault();

    if (!title.trim() || !amount || !category.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category: category.trim(),
          date: new Date().toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to add expense");
      }

      const updatedExpenses = [result.data, ...expenses];

      setExpenses(updatedExpenses);
      onExpensesChange(updatedExpenses);

      setTitle("");
      setAmount("");
      setCategory("");
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Start editing an expense
  function handleEdit(expense) {
    setEditingId(expense._id);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setError("");
  }

  // Update expense
  async function handleUpdate(id) {
    if (!editTitle.trim() || !editAmount || !editCategory.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (
      !Number.isFinite(Number(editAmount)) ||
      Number(editAmount) <= 0
    ) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: editTitle.trim(),
          amount: Number(editAmount),
          category: editCategory.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update expense");
      }

      const updatedExpenses = expenses.map((expense) =>
        expense._id === id ? result.data : expense
      );

      setExpenses(updatedExpenses);
      onExpensesChange(updatedExpenses);
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Delete expense
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to delete expense");
      }

      const updatedExpenses = expenses.filter(
        (expense) => expense._id !== id
      );

      setExpenses(updatedExpenses);
      onExpensesChange(updatedExpenses);

      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <section className="expense-section">
        Loading expenses...
      </section>
    );
  }

  return (
    <section className="expense-section">
      <div className="expense-heading">
        <h2>Recent Expenses</h2>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ Add Expense"}
        </button>
      </div>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {showForm && (
        <form className="expense-form" onSubmit={handleAddExpense}>
          <input
            type="text"
            placeholder="Expense title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount (₹)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Others">Others</option>
          </select>

          <button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Save Expense"}
          </button>
        </form>
      )}

      {expenses.length === 0 ? (
        <p>No expenses added yet. Click Add Expense to get started.</p>
      ) : (
        expenses.map((expense) => (
          <div className="expense-item" key={expense._id}>
            {editingId === expense._id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Expense title"
                />

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="Amount"
                />

                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  placeholder="Category"
                />

                <button
                  onClick={() => handleUpdate(expense._id)}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>

                <button
                  onClick={() => setEditingId(null)}
                  disabled={saving}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span>{expense.title}</span>

                <span>
                  ₹{Number(expense.amount).toLocaleString("en-IN")}
                </span>

                <span>{expense.category}</span>

                <button onClick={() => handleEdit(expense)}>
                  Edit
                </button>

                <button onClick={() => handleDelete(expense._id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        ))
      )}
    </section>
  );
}

export default ExpenseList;

