
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./models/User.js");
const Expense = require("./models/Expense.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get("/", (req, res) => {
  res.json({ message: "SpendMonitor API is running" });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "Correct SpendMonitor server is running" });
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token is required.",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token.",
      });
    }

    req.user = decoded;
    next();
  });
}

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, username, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username or email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured.",
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// Protect all expense routes
app.use("/api/expenses", authenticateToken);
app.use("/api/users/:userId/expenses", authenticateToken);

// GET ALL EXPENSES OF LOGGED-IN USER
app.get("/api/expenses", async (req, res) => {
  try {
    const expenses = await Expense.find({
      user: req.user.userId,
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CREATE EXPENSE
app.post("/api/expenses", async (req, res) => {
  try {
    const { title, amount, category, date, description } = req.body;

    const expense = await Expense.create({
      title,
      amount,
      category,
      date,
      description,
      user: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      data: expense,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// GET EXPENSES OF A SPECIFIC USER
app.get("/api/users/:userId/expenses", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access these expenses.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const expenses = await Expense.find({ user: userId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET SINGLE EXPENSE
app.get("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findOne({
      _id: req.params.id,
      user: req.user.userId,
    }).populate("user", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// UPDATE EXPENSE
app.put("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const { title, amount, category, date, description } = req.body;

    const expense = await Expense.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      { title, amount, category, date, description },
      {
        new: true,
        runValidators: true,
      }
    ).populate("user", "name email");

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully.",
      data: expense,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// DELETE EXPENSE
app.delete("/api/expenses/:id", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
      data: expense,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// CONNECT TO MONGODB AND START SERVER
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(process.env.PORT || 5000, () => {
      console.log(
        `Server running on port ${process.env.PORT || 5000}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

  