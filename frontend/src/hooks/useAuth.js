import { useAuth as useAuthContext } from '../context/AuthContext'

/**
 * Thin wrapper around useAuth for semantic clarity.
 * Provides user, session, profile, loading, signIn, signUp, signOut, refreshProfile, refreshSession
 */
export function useAuth() {
  return useAuthContext()
}