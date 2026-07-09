import express from "express";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Hello world." })
});

app.get("/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW();");
        res.send(result.rows[0].now);
    }
    catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000.");
});