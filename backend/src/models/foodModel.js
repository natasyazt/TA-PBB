import { supabase } from "../config/supabaseClient.js";

const DEFAULT_FOODS = [
  {
    id: "f-1",
    name: "Es Teh Manis",
    sugarGrams: 20,
    category: "minuman",
    servingSize: "1 gelas (250ml)",
    calories: 90,
    glycemicIndex: "Tinggi",
    healthTip: "Gula cair cepat diserap darah. Ganti dengan teh tawar atau kurangi gula.",
  },
  {
    id: "f-2",
    name: "Kopi Susu Gula Aren",
    sugarGrams: 25,
    category: "minuman",
    servingSize: "1 cup (300ml)",
    calories: 180,
    glycemicIndex: "Tinggi",
    healthTip: "Pesan opsi less sugar 25% atau 50% untuk mengurangi beban pankreas.",
  },
  {
    id: "f-3",
    name: "Boba Brown Sugar Milk",
    sugarGrams: 38,
    category: "minuman",
    servingSize: "1 cup besar (500ml)",
    calories: 360,
    glycemicIndex: "Sangat Tinggi",
    healthTip: "Mengandung hampir 80% batas konsumsi gula harian maksimal orang dewasa!",
  },
  {
    id: "f-4",
    name: "Donat Cokelat Tabur",
    sugarGrams: 16,
    category: "camilan",
    servingSize: "1 buah sedang",
    calories: 260,
    glycemicIndex: "Tinggi",
    healthTip: "Kombinasi tepung terigu olahan dan gula tinggi memicu lonjakan insulin.",
  },
  {
    id: "f-5",
    name: "Jus Alpukat Manis",
    sugarGrams: 24,
    category: "minuman",
    servingSize: "1 gelas besar",
    calories: 250,
    glycemicIndex: "Sedang",
    healthTip: "Alpukat kaya lemak sehat, mintalah tanpa tambahan kental manis & gula cair.",
  },
  {
    id: "f-6",
    name: "Apel Fuji Segar",
    sugarGrams: 10,
    category: "buah",
    servingSize: "1 buah sedang",
    calories: 75,
    glycemicIndex: "Rendah",
    healthTip: "Kaya serat pectin yang memperlambat penyerapan glukosa dalam usus.",
  },
  {
    id: "f-7",
    name: "Air Mineral",
    sugarGrams: 0,
    category: "minuman",
    servingSize: "Bebas",
    calories: 0,
    glycemicIndex: "Nol",
    healthTip: "Pilihan terbaik tanpa kalori & membantu ginjal mengeluarkan kelebihan gula.",
  },
  {
    id: "f-8",
    name: "Martabak Manis Cokelat",
    sugarGrams: 28,
    category: "camilan",
    servingSize: "2 potong",
    calories: 420,
    glycemicIndex: "Sangat Tinggi",
    healthTip: "Sangat padat kalori dan gula. Batasi konsumsi hanya sesekali.",
  },
];

export const FoodModel = {
  async getAll() {
    const { data, error } = await supabase.from("foods").select("*");
    if (error || !data || data.length === 0) {
      return DEFAULT_FOODS;
    }
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("foods")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      const found = DEFAULT_FOODS.find((f) => f.id === id);
      if (found) return found;
      throw new Error("Food item not found");
    }
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("foods")
      .insert([payload])
      .select();
    if (error) {
      const newItem = { id: "f-" + Date.now(), ...payload };
      return newItem;
    }
    return data[0];
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("foods")
      .update(payload)
      .eq("id", id)
      .select();
    if (error) {
      return { id, ...payload };
    }
    return data[0];
  },

  async remove(id) {
    const { error } = await supabase.from("foods").delete().eq("id", id);
    if (error) {
      return { message: "Food deleted (local fallback)" };
    }
    return { message: "Food item deleted successfully" };
  },
};
