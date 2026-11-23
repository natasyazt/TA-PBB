import { LogModel } from "../models/logModel.js";

export const LogController = {
  async getAll(req, res) {
    try {
      const { userId, date } = req.query;
      const logs = await LogModel.getAll(userId, date);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const log = await LogModel.getById(id);
      res.json(log);
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
      const newLog = await LogModel.create(payload);
      res.status(201).json(newLog);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const updated = await LogModel.update(id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      const result = await LogModel.remove(id);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
