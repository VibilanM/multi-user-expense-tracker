import express from "express";
import { addCategory, getCategories, getCategoryById, deleteCategory, updateCategory } from "../controllers/categoryControllers.js";

const router = express.Router();

router.post("/", addCategory);

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.put("/:id", updateCategory);

router.delete("/:id", deleteCategory);

export default router;