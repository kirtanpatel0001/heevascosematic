import { createBrowserClient } from '@supabase/ssr'

// 1. Create a variable to hold the single instance outside the function
let client: ReturnType<typeof createBrowserClient> | undefined

export function supabaseClient() {
  // 2. Check: Do we already have a client?
  if (client) return client

  // 3. If not, create it ONE time
  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return client
}