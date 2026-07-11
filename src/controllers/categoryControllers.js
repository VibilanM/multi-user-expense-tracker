import pool from "../config/db.js";

async function addCategory(req, res) {
    try {
        const { name } = req.body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Name is required and must be a non-empty string." });
        }
        const result = await pool.query(
            "INSERT INTO categories(name) VALUES($1) RETURNING *;",
            [name.trim()]
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
        const categories = await pool.query("SELECT * FROM categories;");
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