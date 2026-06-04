import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../lib/supabase'
import { ProfileData } from '../components/ProfileEditModal'
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'travel_buddy_my_profile'

const EMPTY_PROFILE: ProfileData = {
  name: 'Dein Profil',
  tagline: '✈ Solo Traveler · Abenteurer',
  bio: 'Solo-Reisende auf der Suche nach Abenteuern und Gleichgesinnten 🌏',
  travelStyle: 'Adventure',
  destinations: [
    { flag: '🇹🇭', name: 'Bangkok' },
    { flag: '🇮🇩', name: 'Bali' },
    { flag: '🇯🇵', name: 'Tokio' },
  ],
  interests: ['🏄 Surfen', '📸 Fotografie', '🍜 Street Food', '🤿 Tauchen', '🧘 Yoga', '🎵 Musik'],
  images: [],
}

async function uploadImageToSupabase(userId: string, localUri: string): Promise<string> {
  const filename = `${userId}/${Date.now()}.jpg`
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  })
  const arrayBuffer = decode(base64)
  const { error } = await supabase.storage
    .from('app1')
    .upload(filename, arrayBuffer, { contentType: 'image/jpeg', upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('app1').getPublicUrl(filename)
  return data.publicUrl
}

export function useMyProfile(userId: string) {
  const [profile, setProfileState] = useState<ProfileData>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load on mount
  useEffect(() => {
    load()
  }, [userId])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (userId) {
        // Load from Supabase
        const [{ data: p }, { data: dests }, { data: ints }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('travel_destinations').select('*').eq('user_id', userId),
          supabase.from('user_interests').select('*').eq('user_id', userId),
        ])
        if (p) {
          setProfileState({
            name: p.name ?? EMPTY_PROFILE.name,
            tagline: (p as any).tagline ?? EMPTY_PROFILE.tagline,
            bio: p.bio ?? EMPTY_PROFILE.bio,
            travelStyle: p.travel_style ?? EMPTY_PROFILE.travelStyle,
            destinations: (dests ?? []).map((d: any) => ({
              flag: d.flag ?? '🌍',
              name: d.city ?? d.country,
            })),
            interests: (ints ?? []).map((i: any) => i.interest),
            images: (p as any).photo_urls ?? (p.profile_image_url ? [p.profile_image_url] : []),
          })
          return
        }
      }
      // Fallback: AsyncStorage
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) setProfileState(JSON.parse(raw))
    } catch {
      // ignore, use default
    } finally {
      setLoading(false)
    }
  }, [userId])

  const save = useCallback(async (data: ProfileData) => {
    setSaving(true)
    setProfileState(data)
    try {
      if (userId) {
        // Upload any local images (file:// URIs)
        const finalImages: string[] = []
        for (const uri of data.images) {
          if (uri.startsWith('file://') || uri.startsWith('content://')) {
            try {
              const url = await uploadImageToSupabase(userId, uri)
              finalImages.push(url)
            } catch (e) {
              console.warn('Image upload failed:', e)
              // Don't push local URI — skip failed uploads
            }
          } else {
            finalImages.push(uri)
          }
        }
        const updatedData = { ...data, images: finalImages }
        setProfileState(updatedData)

        // Only save https URLs to DB — never local file:// URIs
        const remoteImages = finalImages.filter(u => u.startsWith('http'))

        // Upsert profile row (creates if not exists, updates if exists)
        await supabase.from('profiles').upsert({
          id: userId,
          name: data.name,
          bio: data.bio,
          travel_style: data.travelStyle.toLowerCase() as any,
          profile_image_url: remoteImages[0] ?? null,
          photo_urls: remoteImages,
          tagline: data.tagline,
        } as any, { onConflict: 'id' })

        // Save destinations
        await supabase.from('travel_destinations').delete().eq('user_id', userId)
        if (data.destinations.length > 0) {
          await supabase.from('travel_destinations').insert(
            data.destinations.map(d => ({
              user_id: userId,
              country: d.name,
              city: null,
              flag: d.flag,
            }))
          )
        }

        // Save interests
        await supabase.from('user_interests').delete().eq('user_id', userId)
        if (data.interests.length > 0) {
          await supabase.from('user_interests').insert(
            data.interests.map(interest => ({ user_id: userId, interest }))
          )
        }

        // Also persist locally as backup
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData))
      } else {
        // Demo mode: AsyncStorage only
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    } catch (e) {
      console.warn('Profile save error:', e)
      // Always save locally as fallback
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {})
    } finally {
      setSaving(false)
    }
  }, [userId])

  return { profile, loading, saving, save, reload: load }
}
