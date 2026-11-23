import express from "express";
import { LogController } from "../controllers/logController.js";

const router = express.Router();

router.get("/", LogController.getAll);
router.get("/:id", LogController.getById);
router.post("/", LogController.create);
router.put("/:id", LogController.update);
router.delete("/:id", LogController.remove);

export default router;
