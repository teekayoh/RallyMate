import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { supabaseMobileConfig } from "../config/supabase";

export function hasSupabaseMobileConfig() {
  return Boolean(
    supabaseMobileConfig.url &&
      supabaseMobileConfig.anonKey &&
      supabaseMobileConfig.url.startsWith("https://") &&
      supabaseMobileConfig.anonKey.length > 20
  );
}

export function createSupabaseMobileClient() {
  if (!hasSupabaseMobileConfig()) {
    return null;
  }

  return createClient(supabaseMobileConfig.url, supabaseMobileConfig.anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  });
}
