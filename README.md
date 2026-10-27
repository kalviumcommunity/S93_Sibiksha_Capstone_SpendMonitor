# SpendWise – Spending Pattern Analysis System

## Project Overview

Many households exceed their monthly budgets because they do not track their discretionary spending on entertainment, dining, and subscriptions. SpendWise is a spending pattern analysis system that helps families understand their expenses, identify unnecessary spending, and improve monthly budget planning.

## Problem Statement

Families often struggle to manage their monthly budgets because small and frequent expenses go unnoticed. Without proper expense tracking and analysis, it becomes difficult to identify financial leakages and control spending.

## Project Objectives

- Track and categorize household expenses.
- Analyze spending patterns across different categories.
- Identify categories with high or unnecessary spending.
- Compare actual expenses with the monthly budget.
- Provide insights to help families make better financial decisions.

## Proposed Features

1. Expense entry and expense categorization.
2. Monthly spending summary.
3. Category-wise expense analysis.
4. Budget versus actual spending comparison.
5. Visual charts and spending insights.
6. Suggestions for better budget management.

## Mock UX Design

**Figma Link:** https://www.figma.com/proto/neUXwpcDutF862vkarNttS/SpendWise---Mock-UX-Design?node-id=1-3&p=f&t=my4Wc4lrSjmAqGAY-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1

s## Day-by-Day Capstone Plan

**Day 1:** Define the problem statement, project objectives, target users, and requirements.

**Day 2:** Research similar applications and finalize the project features.

**Day 3:** Design the user interface and plan the application workflow.

**Day 4:** Plan the database structure and expense categorization logic.

**Day 5:** Develop the initial expense entry and categorization functionality.

**Day 6:** Implement spending analysis and monthly budget comparison.

**Day 7:** Add charts, summaries, and spending insights.

**Day 8:** Test the application, identify errors, and improve usability.

**Day 9:** Prepare sample expense data, verify results, and update documentation.

**Day 10:** Review the completed work, plan future improvements, and prepare the final demonstration.

## Expected Outcome

The system is expected to help households understand where their money goes, identify high-spending categories, monitor their budgets, and make informed spending decisions.

## Future Enhancements

- Monthly spending reports.
- Automated expense categorization.
- Budget alerts.
- Personalized saving recommendations.

## Technologies

The technology stack will be finalized during the planning phase based on project requirements.

## Project Status

## GET API Implementation

SpendMonitor provides a GET API to retrieve expense records from MongoDB.

### Endpoint

- **Method:** GET
- **URL:** `/api/expenses`
- **Purpose:** Retrieve all saved expenses from the database.

### Implementation

The API uses Express.js to handle the GET request and Mongoose to fetch expense records from MongoDB.

```javascript
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
```

### Testing

The endpoint was tested using a browser. A successful request returns a JSON response containing:
- `success`: Indicates whether the request succeeded.
- `count`: Number of expense records retrieved.
- `data`: List of saved expenses.

**Test URL:** `http://localhost:5000/api/expenses`

## POST API Implementation

The SpendMonitor project provides a POST API to create and save new expense records in MongoDB.

### Endpoint
- **Method:** POST
- **URL:** `/api/expenses`
- **Purpose:** Add a new expense to the database.

### Request Body
```json
{
  "title": "Internet Bill",
  "amount": 899,
  "category": "Utilities",
  "description": "Monthly internet bill"
}
```

### Implementation
The API uses Express.js to receive expense details and Mongoose to save them in MongoDB.

### Response
- **Status Code:** `201 Created`
- `success`: Indicates whether the request succeeded.
- `data`: Contains the newly created expense.

### Testing
The POST endpoint was tested using Postman. A successful request returned the created expense as a JSON response.

## PUT API Implementation

The SpendMonitor project provides a PUT API to update existing expense records in MongoDB.

### Endpoint
- **Method:** PUT
- **URL:** `/api/expenses/:id`
- **Purpose:** Update an existing expense using its ID.

### Request Body
```json
{
  "title": "Updated Internet Bill",
  "amount": 999,
  "category": "Utilities",
  "description": "Updated monthly internet bill"
}
```

### Implementation
The API uses Express.js to handle PUT requests and Mongoose to find and update the expense in MongoDB.

### Response
- **Status Code:** `200 OK` when the expense is updated successfully.
- `success`: Indicates whether the request succeeded.
- `data`: Contains the updated expense.

The API returns `400 Bad Request` for an invalid ID or validation error, and `404 Not Found` if the expense does not exist.

### Testing
The PUT endpoint was tested using Postman. The successful response confirmed that the expense details were updated.
