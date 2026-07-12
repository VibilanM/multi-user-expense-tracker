import express from "express";
import { addExpense, getExpenseById, updateExpense, deleteExpense, monthlySummary, categorySummary } from "../controllers/expenseControllers.js";

const router = express.Router();

router.post("/", addExpense);

router.get("/:id", getExpenseById);
router.get("/:id/summary/monthly", monthlySummary);
router.get("/:id/summary/category", categorySummary);

router.put("/:id", updateExpense);

router.delete("/:id", deleteExpense);

export default router;