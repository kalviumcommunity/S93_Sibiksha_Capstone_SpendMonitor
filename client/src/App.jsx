import Header from "./components/Header";
import SummaryCard from "./components/SummaryCard";
import ExpenseList from "./components/ExpenseList";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Header />

      <main className="dashboard">
        <h2>Spending Dashboard</h2>

        <div className="summary-container">
          <SummaryCard title="Monthly Budget" amount="10,000" />
          <SummaryCard title="Total Expenses" amount="3,500" />
          <SummaryCard title="Remaining Budget" amount="6,500" />
        </div>

        <ExpenseList />
      </main>
    </div>
  );
}

export default App;
