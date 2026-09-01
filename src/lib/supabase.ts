import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hvuolbwqcwixgczklsxe.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_iYfV3iUsq9T-S7Y4s4MUNw_TJ5V_U_R';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Creates a trip-scoped Supabase client that automatically attaches the
 * 'x-room-code' header matching the Trip's tripCode.
 * This satisfies the PostgreSQL RLS policy on the shared 'rooms' table.
 */
export function getTripSupabaseClient(tripCode?: string) {
  if (!isSupabaseConfigured) return null;
  const cleanCode = (tripCode || '').trim().toUpperCase();
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: cleanCode ? { 'x-room-code': cleanCode } : {},
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });
}

