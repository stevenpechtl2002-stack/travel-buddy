import AsyncStorage from '@react-native-async-storage/async-storage'
import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from '../lib/supabase'
import { ProfileData } from '../components/ProfileEditModal'
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'travel_buddy_my_profile'
const BUCKET = 'profile-images'
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''

const EMPTY_PROFILE: ProfileData = {
  name: 'Dein Profil',
  tagline: '✈ Solo Traveler · Abenteurer',
  bio: 'Solo-Reisende auf der Suche nach Abenteuern und Gleichgesinnten 🌏',
  travelStyle: 'Adventure',
  religion: '',
  destinations: [
    { flag: '🇹🇭', name: 'Bangkok' },
    { flag: '🇮🇩', name: 'Bali' },
    { flag: '🇯🇵', name: 'Tokio' },
  ],
  interests: ['🏄 Surfen', '📸 Fotografie', '🍜 Street Food', '🤿 Tauchen', '🧘 Yoga', '🎵 Musik'],
  images: [],
}

async function uploadImage(userId: string, localUri: string): Promise<string> {
  const ext = localUri.split('?')[0].split('.').pop()?.toLowerCase() ?? 'jpg'
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg'
  const filename = `${userId}/${Date.now()}.${ext}`

  // Get auth token for the request header
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) throw new Error('Nicht eingeloggt')

  // Use FileSystem.uploadAsync — the only reliable binary upload in React Native
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`
  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': mime,
      'x-upsert': 'true',
    },
  })

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload fehlgeschlagen (${result.status}): ${result.body}`)
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}

export function useMyProfile(userId: string) {
  const [profile, setProfileState] = useState<ProfileData>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? '')
    })
  }, [userId])

  useEffect(() => { load() }, [userId])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (userId) {
        const [{ data: p }, { data: dests }, { data: ints }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
          supabase.from('travel_destinations').select('*').eq('user_id', userId),
          supabase.from('user_interests').select('*').eq('user_id', userId),
        ])
        if (p) {
          setProfileState({
            name: p.name ?? EMPTY_PROFILE.name,
            tagline: (p as any).tagline ?? EMPTY_PROFILE.tagline,
            bio: p.bio ?? EMPTY_PROFILE.bio,
            travelStyle: p.travel_style ?? EMPTY_PROFILE.travelStyle,
            religion: (p as any).religion ?? '',
            destinations: (dests ?? []).map((d: any) => ({ flag: d.flag ?? '🌍', name: d.city ?? d.country })),
            interests: (ints ?? []).map((i: any) => i.interest),
            images: (p as any).photo_urls ?? (p.profile_image_url ? [p.profile_image_url] : []),
          })
          return
        }
      }
      // Kein Profil in Supabase → AsyncStorage als Fallback
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) setProfileState(JSON.parse(raw))
    } catch {
      // Supabase-Fehler → trotzdem AsyncStorage versuchen
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        if (raw) setProfileState(JSON.parse(raw))
      } catch {}
    } finally {
      setLoading(false)
    }
  }, [userId])

  const save = useCallback(async (data: ProfileData) => {
    setSaving(true)
    setUploadError(null)

    // Show images immediately (local URIs are fine for display)
    setProfileState(data)

    try {
      let finalImages = [...data.images]
      const uploadErrors: string[] = []

      if (userId) {
        // Upload any local file:// URIs to Supabase Storage
        for (let i = 0; i < finalImages.length; i++) {
          const uri = finalImages[i]
          if (uri.startsWith('file://') || uri.startsWith('content://')) {
            try {
              const remoteUrl = await uploadImage(userId, uri)
              finalImages[i] = remoteUrl   // replace local with remote in-place
            } catch (e: any) {
              uploadErrors.push(e.message ?? 'Upload fehlgeschlagen')
              // Keep local URI so the image stays visible in this session
              // (will be gone after app restart, but user is informed)
            }
          }
        }

        // Update state with final mix (remote URLs + remaining local URIs)
        setProfileState({ ...data, images: finalImages })

        // Only persist HTTPS URLs to Supabase DB
        const remoteImages = finalImages.filter(u => u.startsWith('http'))

        const { error: upsertError } = await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          name: data.name,
          bio: data.bio,
          travel_style: data.travelStyle.toLowerCase() as any,
          profile_image_url: remoteImages[0] ?? null,
          photo_urls: remoteImages,
          tagline: data.tagline,
          religion: data.religion || null,
        } as any, { onConflict: 'id' })

        if (upsertError) {
          console.error('Profile upsert error:', upsertError.message)
          setUploadError(`Profil konnte nicht gespeichert werden: ${upsertError.message}`)
        }

        // Save destinations
        await supabase.from('travel_destinations').delete().eq('user_id', userId)
        if (data.destinations.length > 0) {
          await supabase.from('travel_destinations').insert(
            data.destinations.map(d => ({ user_id: userId, country: d.name, city: null, flag: d.flag }))
          )
        }

        // Save interests
        await supabase.from('user_interests').delete().eq('user_id', userId)
        if (data.interests.length > 0) {
          await supabase.from('user_interests').insert(
            data.interests.map(interest => ({ user_id: userId, interest }))
          )
        }

        // Persist locally (with local URIs as fallback for offline)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, images: finalImages }))

        if (uploadErrors.length > 0) {
          const msg = uploadErrors[0]
          setUploadError(
            msg.includes('not found') || msg.includes('bucket')
              ? 'Storage-Bucket fehlt. Bitte "profile-images" Bucket in Supabase erstellen.'
              : `Foto-Upload fehlgeschlagen: ${msg}`
          )
        }
      } else {
        // No user session — store locally only
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    } catch (e: any) {
      console.warn('Profile save error:', e)
      setUploadError(e.message ?? 'Speichern fehlgeschlagen')
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {})
    } finally {
      setSaving(false)
    }
  }, [userId])

  return { profile, loading, saving, uploadError, clearUploadError: () => setUploadError(null), save, reload: load }
}
