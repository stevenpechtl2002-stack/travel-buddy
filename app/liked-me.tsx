import SceneBackground from '@/src/components/SceneBackground'
import PremiumModal from '@/src/components/PremiumModal'
import { colors, gradients, spacing } from '@/src/constants/theme'
import { useAuth } from '@/src/hooks/useAuth'
import { supabase } from '@/src/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

interface Liker {
  id: string
  name: string
  age: number
  profile_image_url: string | null
  country: string
}

export default function LikedMeScreen() {
  const { session } = useAuth()
  const userId = session?.user.id ?? ''
  const isPremium = !!(session?.user as any)?.user_metadata?.is_premium
  const [likers, setLikers] = useState<Liker[]>([])
  const [loading, setLoading] = useState(true)
  const [premiumVisible, setPremiumVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!userId) return
    supabase
      .from('swipes')
      .select('swiper_id')
      .eq('swiped_id', userId)
      .eq('direction', 'right')
      .then(async ({ data }) => {
        if (!data || data.length === 0) { setLoading(false); return }
        const ids = data.map(s => s.swiper_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, age, profile_image_url, country')
          .in('id', ids)
        setLikers((profiles ?? []) as Liker[])
        setLoading(false)
      })
  }, [userId])

  return (
    <SceneBackground>
      <View style={styles.root}>
        {/* Header */}
        <LinearGradient colors={gradients.brand} style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Wer hat mich geliked</Text>
          <View style={{ width: 36 }} />
        </LinearGradient>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        ) : likers.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>💔</Text>
            <Text style={styles.emptyText}>Noch keine Likes</Text>
            <Text style={styles.emptySub}>Swipe weiter — dein Match wartet!</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.grid}>
            {likers.map((liker, i) => {
              const blurred = !isPremium && i > 0
              return (
                <View key={liker.id} style={styles.card}>
                  {blurred ? (
                    <View style={styles.blurCard}>
                      <LinearGradient colors={['#2a1a3e', '#1a2a3e']} style={styles.blurInner}>
                        <Text style={styles.lockIcon}>👑</Text>
                        <Text style={styles.lockText}>Premium</Text>
                      </LinearGradient>
                    </View>
                  ) : (
                    <>
                      {liker.profile_image_url ? (
                        <Image source={{ uri: liker.profile_image_url }} style={styles.photo} />
                      ) : (
                        <LinearGradient colors={gradients.brand} style={styles.photoFallback}>
                          <Text style={styles.photoInitial}>{liker.name[0]}</Text>
                        </LinearGradient>
                      )}
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.overlay}>
                        <Text style={styles.name}>{liker.name}, {liker.age}</Text>
                        <Text style={styles.country}>📍 {liker.country}</Text>
                      </LinearGradient>
                    </>
                  )}
                </View>
              )
            })}

            {!isPremium && likers.length > 1 && (
              <Pressable style={styles.unlockBanner} onPress={() => setPremiumVisible(true)}>
                <LinearGradient colors={gradients.brand} style={styles.unlockGrad}>
                  <Text style={styles.unlockText}>👑 Alle {likers.length} freischalten</Text>
                </LinearGradient>
              </Pressable>
            )}
          </ScrollView>
        )}

        <PremiumModal
          visible={premiumVisible}
          userId={userId}
          onClose={() => setPremiumVisible(false)}
        />
      </View>
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, justifyContent: 'center' },
  backText: { fontSize: 26, color: '#fff', fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyEmoji: { fontSize: 56, marginBottom: 8 },
  emptyText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  emptySub: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, paddingBottom: 100 },
  card: { width: '47%', aspectRatio: 0.75, borderRadius: 20, overflow: 'hidden',
    backgroundColor: colors.surface },
  photo: { width: '100%', height: '100%' },
  photoFallback: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  photoInitial: { fontSize: 40, fontWeight: '900', color: '#fff' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  name: { fontSize: 16, fontWeight: '900', color: '#fff' },
  country: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  blurCard: { width: '100%', height: '100%' },
  blurInner: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  lockIcon: { fontSize: 32 },
  lockText: { color: 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 13 },
  unlockBanner: { width: '100%', borderRadius: 20, overflow: 'hidden', marginTop: 4 },
  unlockGrad: { padding: 18, alignItems: 'center' },
  unlockText: { color: '#fff', fontWeight: '900', fontSize: 16 },
})
