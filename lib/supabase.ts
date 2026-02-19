/**
 * Supabase 客户端（服务端）
 * 仅在 API Routes / Server Components 中使用，勿在客户端引用
 * 构建时若无 env 则用占位值，避免 build 报错；运行时会因请求失败而暴露配置缺失
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "placeholder-key";

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
