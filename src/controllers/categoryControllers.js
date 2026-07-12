import pool from "../config/db.js";

async function addCategory(req, res) {
    try {
        const { name, user_id } = req.body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Name is required and must be a non-empty string." });
        }
        if (user_id === undefined || user_id === null) {
            return res.status(400).json({ message: "User ID is required." });
        }
        const userIdNum = parseInt(user_id, 10);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ message: "User ID must be a valid number." });
        }

        const userCheck = await pool.query("SELECT id FROM users WHERE id = $1;", [userIdNum]);
        if (userCheck.rows.length === 0) {
            return res.status(400).json({ message: "User not found." });
        }

        const dupCheck = await pool.query(
            "SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2);",
            [userIdNum, name.trim()]
        );
        if (dupCheck.rows.length > 0) {
            return res.status(409).json({ message: "Category already exists for this user." });
        }

        const result = await pool.query(
            "INSERT INTO categories(name, user_id) VALUES($1, $2) RETURNING *;",
            [name.trim(), userIdNum]
        );
        res.status(201).json({
            message: "Category created.",
            category: result.rows[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function getCategories(req, res) {
    try {
        const userId = req.query.user_id || req.headers["x-user-id"];
        let categories;
        if (userId) {
            const userIdNum = parseInt(userId, 10);
            if (isNaN(userIdNum)) {
                return res.status(400).json({ message: "Invalid user ID format." });
            }
            categories = await pool.query("SELECT * FROM categories WHERE user_id = $1;", [userIdNum]);
        } else {
            categories = await pool.query("SELECT * FROM categories;");
        }
        res.json(categories.rows);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function getCategoryById(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid category ID format." });
        }
        const id = parseInt(idStr, 10);
        const category = await pool.query("SELECT * FROM categories WHERE id = $1;", [id]);
        if (category.rows.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.json(category.rows[0]);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function deleteCategory(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid category ID format." });
        }
        const id = parseInt(idStr, 10);
        const result = await pool.query("DELETE FROM categories WHERE id = $1;", [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.status(200).json({
            message: "Category deleted."
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function updateCategory(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid category ID format." });
        }
        const id = parseInt(idStr, 10);
        const { name } = req.body;
        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Name is required and must be a non-empty string." });
        }

        const existing = await pool.query("SELECT user_id FROM categories WHERE id = $1;", [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        const dupCheck = await pool.query(
            "SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3;",
            [existing.rows[0].user_id, name.trim(), id]
        );
        if (dupCheck.rows.length > 0) {
            return res.status(409).json({ message: "Category already exists for this user." });
        }

        const result = await pool.query(
            "UPDATE categories SET name = $1 WHERE id = $2 RETURNING *;",
            [name.trim(), id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }
        res.status(200).json({
            message: "Category updated.",
            category: result.rows[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

export { addCategory, getCategories, getCategoryById, deleteCategory, updateCategory };