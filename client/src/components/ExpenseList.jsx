const expenses = [
  { id: 1, name: "Food", amount: 1500 },
  { id: 2, name: "Transport", amount: 800 },
  { id: 3, name: "Entertainment", amount: 1200 },
];

function ExpenseList() {
  return (
    <section className="expense-section">
      <h2>Recent Expenses</h2>

      {expenses.map((expense) => (
        <div className="expense-item" key={expense.id}>
          <span>{expense.name}</span>
          <span>₹{expense.amount}</span>
        </div>
      ))}
    </section>
  );
}

export default ExpenseList;
