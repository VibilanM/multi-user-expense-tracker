import pool from "../config/db.js";

async function addExpense(req, res) {
    try {
        const { amount, category_id, user_id, description, date } = req.body;

        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0." });
        }
        if (amount > 10000000) {
            return res.status(400).json({ message: "Amount must not exceed 10,000,000." });
        }
        if (category_id === undefined || category_id === null) {
            return res.status(400).json({ message: "Category ID is required." });
        }
        if (user_id === undefined || user_id === null) {
            return res.status(400).json({ message: "User ID is required." });
        }
        if (description && description.length > 255) {
            return res.status(400).json({ message: "Description must be 255 characters or less." });
        }
        if (date && new Date(date) > new Date()) {
            return res.status(400).json({ message: "Expense date cannot be in the future." });
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
        const categoryCheck = await pool.query("SELECT id, user_id FROM categories WHERE id = $1;", [categoryIdNum]);
        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ message: "Category not found." });
        }
        if (categoryCheck.rows[0].user_id !== userIdNum) {
            return res.status(403).json({ message: "Category does not belong to this user." });
        }

        const result = await pool.query(
            "INSERT INTO expenses(amount, category_id, user_id, description, date) VALUES($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE)) RETURNING *;",
            [amount, categoryIdNum, userIdNum, description || null, date || null]
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

async function getExpenseById(req, res) {
    try {
        const userId = req.params.id;
        const {
            category,
            start,
            end,
            sort,
            order,
            page = 1,
            limit = 20,
            q
        } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (
            isNaN(pageNum) || pageNum < 1 ||
            isNaN(limitNum) || limitNum < 1
        ) {
            return res.status(400).json({
                message: "Invalid page or limit."
            });
        }

        const offset = (pageNum - 1) * limitNum;

        let query = `
            SELECT
               expenses.id,
               expenses.amount, 
               expenses.description,
               expenses.date,
               users.name as user_name,
               categories.name as category_name
            FROM expenses
            JOIN users ON expenses.user_id = users.id
            JOIN categories ON expenses.category_id = categories.id
            WHERE users.id = $1
        `;

        const conditions = [];
        const values = [userId];

        if (category) {
            values.push(category);
            conditions.push(`categories.name = $${values.length}`);
        }
        if (start) {
            values.push(start);
            conditions.push(`expenses.date >= $${values.length}`);
        }
        if (end) {
            values.push(end);
            conditions.push(`expenses.date <= $${values.length}`);
        }

        if (q) {
            values.push(`%${q}%`);
            conditions.push(`expenses.description ILIKE $${values.length}`);
        }

        if (conditions.length > 0) {
            query += ` AND ${conditions.join(" AND ")}`;
        }

        const allowedSortFields = {
            amount: "expenses.amount",
            date: "expenses.date"
        };

        const sortColumn = allowedSortFields[sort] || "expenses.date";
        const sortOrder = order === "asc" ? "ASC" : "DESC";

        query += ` ORDER BY ${sortColumn} ${sortOrder}`;

        values.push(limitNum);
        query += ` LIMIT $${values.length}`;

        values.push(offset);
        query += ` OFFSET $${values.length}`;

        let expenses;
        if (userId) {
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return res.status(400).json({ message: "Invalid user ID format." });
            }
            expenses = await pool.query(query, values);
        }
        res.json(expenses.rows);
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
        const { amount, category_id, description, date } = req.body;
        if (!amount || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0." });
        }
        if (amount > 10000000) {
            return res.status(400).json({ message: "Amount must not exceed 10,000,000." });
        }
        if (category_id === undefined || category_id === null) {
            return res.status(400).json({ message: "Category ID is required." });
        }
        if (description && description.length > 255) {
            return res.status(400).json({ message: "Description must be 255 characters or less." });
        }
        if (date && new Date(date) > new Date()) {
            return res.status(400).json({ message: "Expense date cannot be in the future." });
        }

        const categoryIdNum = parseInt(category_id, 10);
        if (isNaN(categoryIdNum)) {
            return res.status(400).json({ message: "Category ID must be a valid number." });
        }

        const expenseCheck = await pool.query("SELECT user_id FROM expenses WHERE id = $1;", [id]);
        if (expenseCheck.rows.length === 0) {
            return res.status(404).json({ message: "Expense not found." });
        }
        const expenseUserId = expenseCheck.rows[0].user_id;

        const categoryCheck = await pool.query("SELECT id, user_id FROM categories WHERE id = $1;", [categoryIdNum]);
        if (categoryCheck.rows.length === 0) {
            return res.status(400).json({ message: "Category not found." });
        }
        if (categoryCheck.rows[0].user_id !== expenseUserId) {
            return res.status(403).json({ message: "Category does not belong to this user." });
        }

        const result = await pool.query(
            "UPDATE expenses SET amount = $1, category_id = $2, description = $3, date = COALESCE($4::date, date) WHERE id = $5 RETURNING *;",
            [amount, categoryIdNum, description !== undefined ? description : null, date || null, id]
        );
        res.status(200).json({
            message: "Expense updated.",
            expense: result.rows[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function monthlySummary(req, res) {
    try {
        const userId = req.params.id;
        const month = req.query.month;
        const year = req.query.year;

        const query = `
            SELECT
                TO_CHAR(date, 'Month') AS month,
                SUM(amount) AS total_spent,
                COUNT(*) AS expense_count
            FROM expenses
            WHERE user_id = $1
            AND EXTRACT(YEAR FROM date) = $2
            AND EXTRACT(MONTH FROM date) = $3
            GROUP BY TO_CHAR(date, 'Month');
        `;

        const result = await pool.query(query, [userId, year, month]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "No expenses found."
            });
        }

        res.json(result.rows[0]);
    }
    catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

async function categorySummary(req, res) {
    try {
        const userId = parseInt(req.params.id, 10);

        if (isNaN(userId)) {
            return res.status(400).json({
                message: "Invalid user ID."
            });
        }

        const { category, month } = req.query;

        let query = `
            SELECT
                categories.name AS category,
                SUM(expenses.amount) AS total_spent,
                COUNT(expenses.id) AS expense_count
            FROM expenses
            JOIN categories
                ON expenses.category_id = categories.id
            WHERE expenses.user_id = $1
        `;

        const values = [userId];
        const conditions = [];

        if (category) {
            values.push(category);
            conditions.push(`categories.name = $${values.length}`);
        }

        if (month) {
            values.push(month);
            conditions.push(
                `DATE_TRUNC('month', expenses.date) = DATE_TRUNC('month', $${values.length}::date)`
            );
        }

        if (conditions.length > 0) {
            query += ` AND ${conditions.join(" AND ")}`;
        }

        query += `
            GROUP BY categories.name
            ORDER BY total_spent DESC;
        `;

        const result = await pool.query(query, values);

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

export { addExpense, getExpenseById, deleteExpense, updateExpense, monthlySummary, categorySummary };
