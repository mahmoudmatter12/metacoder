import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Create a single instance of the Supabase client to be used across the app
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClientComponentClient()
  }
  return supabaseClient
}
