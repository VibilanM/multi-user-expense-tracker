import pool from "../config/db.js";

async function getUsers(req, res) {
    try {
        const users = await pool.query("SELECT * FROM users;");
        res.json(users.rows);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function getUserById(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }
        
        const id = parseInt(idStr, 10);
        const user = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        
        res.json(user.rows[0]);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function addUser(req, res) {
    try {
        const { name, email } = req.body;

        if (!name || typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({ message: "Name is required and must be a non-empty string." });
        }
        if (!email || typeof email !== "string" || email.trim() === "" || !email.includes("@")) {
            return res.status(400).json({ message: "A valid email is required." });
        }

        const emailCheck = await pool.query(
            "SELECT id FROM users WHERE LOWER(email) = LOWER($1);", [email.trim()]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ message: "Email already in use." });
        }
        
        const result = await pool.query(
            "INSERT INTO users(name, email) VALUES($1, $2) RETURNING *;",
            [name.trim(), email.trim()]
        );
        res.status(201).json({
            message: "User created.",
            user: result.rows[0]
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function deleteUser(req, res) {
    try {
        const idStr = req.params.id;
        if (!/^\d+$/.test(idStr)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }
        
        const id = parseInt(idStr, 10);
        const result = await pool.query("DELETE FROM users WHERE id = $1;", [id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        
        res.status(200).json({
            message: "User deleted."
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

export { getUsers, getUserById, addUser, deleteUser };