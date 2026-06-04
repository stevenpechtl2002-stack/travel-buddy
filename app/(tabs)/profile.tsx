import ProfileEditModal, { ProfileData } from '@/src/components/ProfileEditModal'
import ProfilePreviewModal from '@/src/components/ProfilePreviewModal'
import SceneBackground from '@/src/components/SceneBackground'
import { useAuth } from '@/src/hooks/useAuth'
import { useRouter } from 'expo-router'
import { useMyProfile } from '@/src/hooks/useMyProfile'
import { colors, spacing } from '@/src/constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native'
import { supabase } from '@/src/lib/supabase'

export default function ProfileScreen() {
  const { session, signOut } = useAuth()
  const userId = session?.user.id ?? ''
  const { profile, loading, saving, save } = useMyProfile(userId)
  const [editVisible, setEditVisible] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const router = useRouter()

  const handleSignOut = () => {
    Alert.alert('Ausloggen', 'Möchtest du dich wirklich ausloggen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ausloggen', onPress: async () => { await signOut(); router.replace('/(auth)/login') } },
    ])
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      'Profil löschen',
      'Dein Profil und alle Daten werden unwiderruflich gelöscht. Bist du sicher?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            if (!userId) return
            await Promise.all([
              supabase.from('travel_destinations').delete().eq('user_id', userId),
              supabase.from('user_interests').delete().eq('user_id', userId),
              supabase.from('profiles').delete().eq('id', userId),
            ])
            await signOut()
            router.replace('/(auth)/login')
          },
        },
      ]
    )
  }

  if (loading) return (
    <SceneBackground>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    </SceneBackground>
  )

  return (
    <SceneBackground>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        {profile.images.length > 0
          ? <Image source={{ uri: profile.images[0] }} style={styles.avatarImage} />
          : <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
        }
        <Text style={styles.name}>{profile.name}</Text>
        <Text style={styles.tagline}>{profile.tagline}</Text>

        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>13</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.destinations.length}</Text>
            <Text style={styles.statLabel}>Reiseziele</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{profile.interests.length}</Text>
            <Text style={styles.statLabel}>Interessen</Text>
          </View>
        </View>
      </View>

      {/* Edit */}
      <View style={styles.btnRow}>
        <Pressable style={styles.editBtn} onPress={() => setEditVisible(true)} disabled={saving}>
          <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.editBtnGrad}>
            {saving
              ? <ActivityIndicator color="#000" size="small" />
              : <Text style={styles.editBtnText}>✏️ Bearbeiten</Text>
            }
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.previewBtn} onPress={() => setPreviewVisible(true)}>
          <Text style={styles.previewBtnText}>👁 Vorschau</Text>
        </Pressable>
      </View>

      {/* Bio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💬 Über mich</Text>
        <Text style={styles.bio}>"{profile.bio}"</Text>
      </View>

      {/* Destinations */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🌍 Nächste Reiseziele</Text>
        <View style={styles.destGrid}>
          {profile.destinations.slice(0, 3).map(d => (
            <LinearGradient key={d.name} colors={['rgba(255,140,0,0.15)', 'rgba(255,77,109,0.1)']}
              style={styles.destCard}>
              <Text style={styles.destFlag}>{d.flag}</Text>
              <Text style={styles.destName}>{d.name}</Text>
            </LinearGradient>
          ))}
        </View>
      </View>

      {/* Interests */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Interessen</Text>
        <View style={styles.chips}>
          {profile.interests.map(i => (
            <View key={i} style={styles.chip}>
              <Text style={styles.chipText}>{i}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Travel style */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎒 Reisestil</Text>
        <View style={styles.styleRow}>
          {[
            { icon: '🏕️', label: 'Backpacker' },
            { icon: '🏙️', label: 'City' },
            { icon: '🏖️', label: 'Beach' },
            { icon: '⛰️', label: 'Adventure' },
          ].map(s => {
            const active = profile.travelStyle === s.label
            return (
              <LinearGradient key={s.label}
                colors={active ? [colors.primary, colors.secondary] : ['transparent', 'transparent']}
                style={[styles.styleChip, !active && styles.styleChipInactive]}>
                <Text style={styles.styleIcon}>{s.icon}</Text>
                <Text style={[styles.styleLabel, active && { color: '#fff' }]}>{s.label}</Text>
              </LinearGradient>
            )
          })}
        </View>
      </View>


      {/* Sign out */}
      <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>↩ Ausloggen</Text>
      </Pressable>

      {/* Delete account */}
      <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>🗑 Profil löschen</Text>
      </Pressable>

    </ScrollView>

    <ProfileEditModal
      visible={editVisible}
      data={profile}
      onChange={save}
      onClose={() => setEditVisible(false)}
    />
    <ProfilePreviewModal
      visible={previewVisible}
      data={profile}
      onClose={() => setPreviewVisible(false)}
    />
    </SceneBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingBottom: 130 },
  hero: { paddingTop: 68, paddingBottom: 30, alignItems: 'center', backgroundColor: 'transparent' },
  avatarImage: { width: 96, height: 96, borderRadius: 48, marginBottom: 14,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)' },
  avatarCircle: { width: 96, height: 96, borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center',
    alignItems: 'center', marginBottom: 14,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)' },
  avatarEmoji: { fontSize: 46 },
  name: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  tagline: { fontSize: 14, color: '#fff', marginBottom: 22,
    textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  statRow: { flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 24, gap: 20 },
  stat: { alignItems: 'center', minWidth: 54 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.25)' },
  card: { marginHorizontal: spacing.lg, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#555',
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: spacing.md },
  bio: { fontSize: 15, color: '#1a1a2e', lineHeight: 23, fontStyle: 'italic' },
  destGrid: { flexDirection: 'row', gap: 10 },
  destCard: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)', backgroundColor: 'rgba(255,140,0,0.08)' },
  destFlag: { fontSize: 28, marginBottom: 6 },
  destName: { fontSize: 12, fontWeight: '700', color: '#1a1a2e' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#f0f0f6', borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd' },
  chipText: { color: '#1a1a2e', fontSize: 13, fontWeight: '600' },
  styleRow: { flexDirection: 'row', gap: 8 },
  styleChip: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 14 },
  styleChipInactive: { backgroundColor: '#f0f0f6', borderWidth: 1, borderColor: '#ddd' },
  styleIcon: { fontSize: 22, marginBottom: 5 },
  styleLabel: { fontSize: 10, color: '#666', fontWeight: '700' },
  btnRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.md, gap: 10 },
  editBtn: { flex: 1, borderRadius: 50, overflow: 'hidden' },
  editBtnGrad: { padding: 16, alignItems: 'center' },
  editBtnText: { color: '#000', fontWeight: '900', fontSize: 15 },
  previewBtn: { flex: 1, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.88)',
    padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  previewBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 15 },

  signOutBtn: { marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.88)', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)', padding: 16, alignItems: 'center' },
  signOutText: { color: '#1a1a2e', fontWeight: '800', fontSize: 15 },
  deleteBtn: { marginHorizontal: spacing.lg, marginTop: 10, borderRadius: 50,
    backgroundColor: 'rgba(255,71,87,0.15)', borderWidth: 1.5,
    borderColor: 'rgba(255,71,87,0.4)', padding: 14, alignItems: 'center' },
  deleteText: { color: '#ff4757', fontWeight: '700', fontSize: 14 },

})
