import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error) setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const signOut = () => supabase.auth.signOut()

  const sendPhoneOtp = (phone: string) =>
    supabase.auth.signInWithOtp({ phone })

  const verifyPhoneOtp = (phone: string, token: string) =>
    supabase.auth.verifyOtp({ phone, token, type: 'sms' })

  return { session, loading, signIn, signUp, signOut, sendPhoneOtp, verifyPhoneOtp }
}
