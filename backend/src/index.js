import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import categoryRoutes from "./routes/categoryRoutes.js";
import foodRoutes from "./routes/foodRoutes.js";
import logRoutes from "./routes/logRoutes.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes (Modul 1 RESTful API)
app.use("/api/categories", categoryRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/logs", logRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "GulaMate RESTful API Server",
    course: "Praktikum Pemrograman Bergerak (Modul 1)",
    author: "Natasya Zahra",
    endpoints: {
      categories: "/api/categories",
      foods: "/api/foods",
      logs: "/api/logs",
    },
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`GulaMate API Server running on port ${port}`);
});

export default app;
