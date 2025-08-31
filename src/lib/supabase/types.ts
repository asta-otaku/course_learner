// Re-export database types for easier imports
export type { Database } from '@/lib/database.types'
import type { Database } from '@/lib/database.types'

// Helper type to extract table types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]