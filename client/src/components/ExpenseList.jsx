import { useEffect, useState } from "react"; 

const API_URL = "http://localhost:5000/api/expenses";

function ExpenseList() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch expenses from the backend
  
useEffect(() => {
  let ignore = false;

  async function loadExpenses() {
    try {
      setError("");

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch expenses");
      }

      if (!ignore) {
        setExpenses(result.data);
      }
    } catch (err) {
      if (!ignore) {
        setError(err.message || "Unable to connect to the server.");
      }
    } finally {
      if (!ignore) {
        setLoading(false);
      }
    }
  }

  loadExpenses();

  return () => {
    ignore = true;
  };
}, []);


  // Start editing an expense
  function handleEdit(expense) {
    setEditingId(expense._id);
    setEditTitle(expense.title);
    setEditAmount(String(expense.amount));
    setEditCategory(expense.category);
    setError("");
  }

  // Update an expense in the database
  async function handleUpdate(id) {
    if (!editTitle.trim() || !editCategory.trim() || editAmount === "") {
      setError("Please fill in all required fields.");
      return;
    }

    if (!Number.isFinite(Number(editAmount)) || Number(editAmount) < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          amount: Number(editAmount),
          category: editCategory.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update expense");
      }

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense._id === id ? result.data : expense
        )
      );

      setEditingId(null);
    } catch (err) {
      setError(err.message || "Unable to update expense.");
    } finally {
      setSaving(false);
    }
  }

  // Delete an expense from the database
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?"
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to delete expense");
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense._id !== id)
      );

      if (editingId === id) {
        setEditingId(null);
      }
    } catch (err) {
      setError(err.message || "Unable to delete expense.");
    }
  }

  if (loading) {
    return <section className="expense-section">Loading expenses...</section>;
  }

  return (
    <section className="expense-section">
      <h2>Recent Expenses</h2>

      {error && <p role="alert">{error}</p>}

      {expenses.length === 0 ? (
        <p>No expenses available. Add an expense using the backend API first.</p>
      ) : (
        expenses.map((expense) => (
          <div className="expense-item" key={expense._id}>
            {editingId === expense._id ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(event) => setEditTitle(event.target.value)}
                  placeholder="Expense title"
                  aria-label="Expense title"
                />

                <input
                  type="number"
                  min="0"
                  value={editAmount}
                  onChange={(event) => setEditAmount(event.target.value)}
                  placeholder="Amount"
                  aria-label="Expense amount"
                />

                <input
                  type="text"
                  value={editCategory}
                  onChange={(event) => setEditCategory(event.target.value)}
                  placeholder="Category"
                  aria-label="Expense category"
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
                <span>₹{expense.amount}</span>
                <span>{expense.category}</span>

                <button onClick={() => handleEdit(expense)}>Edit</button>

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
