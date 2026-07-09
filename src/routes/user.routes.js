import express from "express";
import { getUsers, getUserById, addUser, deleteUser } from "../controllers/userControllers.js";

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);

router.post("/", addUser);

router.delete("/:id", deleteUser);

export default router;