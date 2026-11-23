import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl =
  process.env.SUPABASE_URL || "https://ybmyasrcaxvekljemkpg.supabase.co";
const supabaseKey =
  process.env.SUPABASE_KEY ||
  "sb_publishable_48Yo2AqyxDBX4VI5Kim3pw_irrsCVY-";

export const supabase = createClient(supabaseUrl, supabaseKey);
