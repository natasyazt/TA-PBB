import { supabase } from "../config/supabaseClient.js";

export const LogModel = {
  async getAll(userId, date) {
    let query = supabase.from("food_logs").select("*").order("time", { ascending: false });
    if (userId) {
      query = query.eq("userId", userId);
    }
    if (date) {
      query = query.eq("date", date);
    }
    const { data, error } = await query;
    if (error) {
      return [];
    }
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("food_logs")
      .insert([payload])
      .select();
    if (error) {
      return { id: "log-" + Date.now(), ...payload };
    }
    return data[0];
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("food_logs")
      .update(payload)
      .eq("id", id)
      .select();
    if (error) {
      return { id, ...payload };
    }
    return data[0];
  },

  async remove(id) {
    const { error } = await supabase.from("food_logs").delete().eq("id", id);
    if (error) {
      return { message: "Food log deleted" };
    }
    return { message: "Food log deleted successfully" };
  },
};
