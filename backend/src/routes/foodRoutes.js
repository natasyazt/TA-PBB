import express from "express";
import { FoodController } from "../controllers/foodController.js";

const router = express.Router();

router.get("/", FoodController.getAll);
router.get("/:id", FoodController.getById);
router.post("/", FoodController.create);
router.put("/:id", FoodController.update);
router.delete("/:id", FoodController.remove);

export default router;
