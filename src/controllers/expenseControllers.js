import pool from "../config/db.js";

async function addExpense(req, res) {
    try {
        const { amount, category_id, user_id } = req.body;

        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Amount is required and must be a positive number." });
        }
        if (category_id === undefined || category_id === null) {
            return res.status(400).json({ message: "Category ID is required." });
        }
        if (user_id === undefined || user_id === null) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const categoryIdNum = parseInt(category_id, 10);
        const userIdNum = parseInt(user_id, 10);
        if (isNaN(categoryIdNum) || isNaN(userIdNum)) {
            return res.status(400).json({ message: "Category ID and User ID must be valid numbers." });
        }

        const userCheck = await pool.query("SELECT id FROM users WHERE id = $1;", [userIdNum]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ message: "User not found." });
        }
        const categoryCheck = await pool.query("SELECT id FROM categories WHERE id = $1;", [categoryIdNum]);
        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ message: "Category not found." });
        }

        const result = await pool.query(
            "INSERT INTO expenses(amount, category_id, user_id) VALUES($1, $2, $3) RETURNING *;",
            [amount, categoryIdNum, userIdNum]
        );
        res.status(201).json({
            message: "Expense created.",
            expense: result.rows[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function getExpenses(req, res) {
    try {
        const userId = req.query.user_id || req.headers["x-user-id"];
        let expenses;
        if (userId) {
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return res.status(400).json({ message: "Invalid user ID format." });
            }
            expenses = await pool.query("SELECT * FROM expenses WHERE user_id = $1;", [userIdNum]);
        } else {
            expenses = await pool.query("SELECT * FROM expenses;");
        }
        res.json(expenses.rows);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function getExpenseById(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid expense ID format." });
        }
        const id = parseInt(idStr, 10);
        const expense = await pool.query("SELECT * FROM expenses WHERE id = $1;", [id]);
        if (expense.rows.length === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        res.json(expense.rows[0]);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function deleteExpense(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid expense ID format." });
        }
        const id = parseInt(idStr, 10);
        const result = await pool.query("DELETE FROM expenses WHERE id = $1;", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        res.status(200).json({
            message: "Expense deleted."
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function updateExpense(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid expense ID format." });
        }
        const id = parseInt(idStr, 10);
        const { amount, category_id } = req.body;
        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Amount is required and must be a positive number." });
        }
        if (category_id === undefined || category_id === null) {
            return res.status(400).json({ message: "Category ID is required." });
        }
        const categoryIdNum = parseInt(category_id, 10);
        if (isNaN(categoryIdNum)) {
            return res.status(400).json({ message: "Category ID must be a valid number." });
        }

        const categoryCheck = await pool.query("SELECT id FROM categories WHERE id = $1;", [categoryIdNum]);
        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ message: "Category not found." });
        }

        const result = await pool.query(
            "UPDATE expenses SET amount = $1, category_id = $2 WHERE id = $3 RETURNING *;",
            [amount, categoryIdNum, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        res.status(200).json({
            message: "Expense updated.",
            expense: result.rows[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

export { addExpense, getExpenses, getExpenseById, deleteExpense, updateExpense };
