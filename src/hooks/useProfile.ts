import { supabase } from '../lib/supabase'
import { Profile, TravelDestination, UserInterest } from '../types'

export function useProfile() {
  const updateProfile = async (userId: string, data: Partial<Profile>) => {
    const { error } = await supabase.from('profiles').update(data).eq('id', userId)
    return { error }
  }

  const setDestinations = async (userId: string, destinations: Omit<TravelDestination, 'id' | 'user_id'>[]) => {
    const { error: deleteError } = await supabase.from('travel_destinations').delete().eq('user_id', userId)
    if (deleteError) return { error: deleteError }
    if (destinations.length === 0) return { error: null }
    const { error } = await supabase.from('travel_destinations').insert(
      destinations.map(d => ({ ...d, user_id: userId }))
    )
    return { error }
  }

  const setInterests = async (userId: string, interests: string[]) => {
    const { error: deleteError } = await supabase.from('user_interests').delete().eq('user_id', userId)
    if (deleteError) return { error: deleteError }
    if (interests.length === 0) return { error: null }
    const { error } = await supabase.from('user_interests').insert(
      interests.map(interest => ({ user_id: userId, interest }))
    )
    return { error }
  }

  const getFullProfile = async (userId: string) => {
    const [{ data: profile }, { data: destinations }, { data: interests }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('travel_destinations').select('*').eq('user_id', userId),
      supabase.from('user_interests').select('*').eq('user_id', userId),
    ])
    return { profile, destinations: destinations ?? [], interests: interests ?? [] }
  }

  return { updateProfile, setDestinations, setInterests, getFullProfile }
}
