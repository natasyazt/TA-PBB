import { FoodLog, CatalogFoodItem } from '../types';

// Production / Local Backend API Base URL
// In development: http://localhost:3000
// In production: deployed Vercel backend
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const ApiService = {
  /**
   * Fetch all categories (Modul 1: GET /api/categories)
   */
  async getCategories(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback
    }
    return [
      { id: 'cat-minuman', name: 'Minuman Manis' },
      { id: 'cat-camilan', name: 'Camilan & Dessert' },
      { id: 'cat-buah', name: 'Buah Alami' },
      { id: 'cat-makanan', name: 'Makanan Pokok' },
    ];
  },

  /**
   * Fetch food catalog (Modul 1: GET /api/foods)
   */
  async getFoods(): Promise<CatalogFoodItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/foods`);
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Fallback to local catalog
    }
    return [];
  },

  /**
   * Create a food log (Modul 1: POST /api/logs)
   */
  async createLog(payload: Omit<FoodLog, 'id' | 'createdAt'>): Promise<FoodLog | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch {
      // Handled by local/supabase storage fallback
    }
    return null;
  },

  /**
   * Delete a food log (Modul 1: DELETE /api/logs/:id)
   */
  async deleteLog(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch {
      return false;
    }
  },
};
