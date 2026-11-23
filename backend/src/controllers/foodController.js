import { FoodModel } from "../models/foodModel.js";

export const FoodController = {
  async getAll(req, res) {
    try {
      const foods = await FoodModel.getAll();
      res.json(foods);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const food = await FoodModel.getById(id);
      res.json(food);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const payload = req.body;
      if (!payload.name || payload.sugarGrams === undefined) {
        return res.status(400).json({ error: "Name and sugarGrams are required" });
      }
      const newFood = await FoodModel.create(payload);
      res.status(201).json(newFood);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await FoodModel.update(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const result = await FoodModel.remove(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
