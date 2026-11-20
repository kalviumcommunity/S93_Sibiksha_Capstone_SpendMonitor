const express = require("express");
const router = express.Router();
const Budget = require("../models/Budget");
const authMiddleware = require("../middleware/authMiddleware");

// Get budget for a specific month
router.get("/:month", authMiddleware, async (req, res) => {
  try {
    const { month } = req.params;

    const budget = await Budget.findOne({
      user: req.user.id,
      month,
    });

    res.json({
      success: true,
      data: budget,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch budget",
    });
  }
});

module.exports = router;
