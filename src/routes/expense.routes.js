import express from "express";
import { addExpense, getExpenses, getExpenseById, updateExpense, deleteExpense } from "../controllers/expenseControllers.js";

const router = express.Router();

router.post("/", addExpense);
router.get("/", getExpenses);
router.get("/:id", getExpenseById);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;