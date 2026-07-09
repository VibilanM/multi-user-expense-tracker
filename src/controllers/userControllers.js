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
        const id = req.params.id;
        const user = await pool.query(`SELECT * FROM users WHERE id=${id}`);
        res.json(user.rows[0])
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function addUser(req, res) {
    try {
        const { id, name, email } = req.body;
        await pool.query(`INSERT INTO users(id, name, email) VALUES(${id}, '${name}', '${email}');`);
        res.status(201).json({
            message: "User created."
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

async function deleteUser(req, res) {
    try {
        const id = req.params.id;
        await pool.query(`DELETE FROM users WHERE id=${id};`);
        res.status(200).json({
            message: "User deleted."
        });
    }
    catch (error) {
        res.status(500).send(error.message);
    }
}

export { getUsers, getUserById, addUser, deleteUser };