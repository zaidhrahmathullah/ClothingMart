import "../config/env.js";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not configured");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is not configured");
}

export const supabaseStorage: SupabaseClient = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    realtime: {
      transport: WebSocket as unknown as NonNullable<
        NonNullable<Parameters<typeof createClient>[2]>["realtime"]
      >["transport"],
    },
  },
);

export const STORAGE_BUCKET =
  process.env.SUPABASE_STORAGE_BUCKET || "catalog-images";