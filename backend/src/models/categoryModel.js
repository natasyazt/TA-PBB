import { supabase } from "../config/supabaseClient.js";

export const CategoryModel = {
  async getAll() {
    const { data, error } = await supabase.from("categories").select("*");
    if (error) {
      // Fallback categories if database table has not been initialized
      return [
        { id: "cat-minuman", name: "Minuman Manis" },
        { id: "cat-camilan", name: "Camilan & Dessert" },
        { id: "cat-buah", name: "Buah Alami" },
        { id: "cat-makanan", name: "Makanan Pokok" },
      ];
    }
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(name) {
    const { data, error } = await supabase
      .from("categories")
      .insert([{ name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, name) {
    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
    return { message: "Category deleted successfully" };
  },
};
