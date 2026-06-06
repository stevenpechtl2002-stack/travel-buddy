import { colors, gradients, spacing } from '../constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import { Dimensions, Image, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useState } from 'react'
import { ProfileData } from './ProfileEditModal'

const { width, height } = Dimensions.get('window')
const CARD_WIDTH = width - spacing.lg * 2
const CARD_HEIGHT = height * 0.62

interface Props {
  visible: boolean
  data: ProfileData
  onClose: () => void
}

export default function ProfilePreviewModal({ visible, data, onClose }: Props) {
  const mainImage = data.images[0] ?? null

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient colors={gradients.brand} style={styles.header}>
          <Text style={styles.headerTitle}>Vorschau</Text>
          <Text style={styles.headerSub}>So sehen dich andere</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Swipe Card Preview */}
          <View style={styles.card}>
            <ImageBackground
              source={mainImage ? { uri: mainImage } : undefined}
              style={styles.cardBg}
              resizeMode="cover"
              imageStyle={{ borderRadius: 24 }}
            >
              {!mainImage && (
                <LinearGradient colors={gradients.brand} style={StyleSheet.absoluteFill}>
                  <View style={styles.avatarCenter}>
                    <Text style={styles.avatarEmoji}>👤</Text>
                  </View>
                </LinearGradient>
              )}

              {/* Photo dots */}
              {data.images.length > 1 && (
                <View style={styles.dots}>
                  {data.images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
                  ))}
                </View>
              )}

              {/* Info overlay */}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.88)']} style={styles.overlay}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <Text style={styles.name}>{data.name || 'Dein Name'}, 25</Text>
                  {data.religion && data.religion !== 'Keine' ? (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, width: 28, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 16 }}>{{ 'Christlich': '✝️', 'Islamisch': '☪️', 'Hinduistisch': '🕉', 'Buddhistisch': '☸️', 'Jüdisch': '✡️', 'Andere': '🌍', 'Keine': '⚪' }[data.religion] ?? '🌍'}</Text>
                    </View>
                  ) : null}
                </View>
                {data.tagline ? <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', marginBottom: 6 }}>{data.tagline}</Text> : null}

                {data.destinations.length > 0 && (
                  <View style={styles.destRow}>
                    {data.destinations.slice(0, 3).map(d => (
                      <View key={d.name} style={styles.destChip}>
                        <Text style={styles.destText}>{d.flag} {d.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {data.interests.length > 0 && (
                  <View style={styles.interestRow}>
                    {data.interests.slice(0, 4).map(i => (
                      <View key={i} style={styles.interestChip}>
                        <Text style={styles.interestText}>{i}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {data.bio ? (
                  <Text style={styles.bio} numberOfLines={2}>"{data.bio}"</Text>
                ) : null}
              </LinearGradient>

              {/* Info button */}
              <View style={styles.infoBtn}>
                <Text style={styles.infoBtnText}>ⓘ</Text>
              </View>
            </ImageBackground>
          </View>

          {/* Detail preview */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Detail-Ansicht</Text>

            {data.images.length > 1 && (
              <View style={styles.photoStrip}>
                {data.images.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.stripThumb} />
                ))}
              </View>
            )}

            {data.bio ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>💬 ÜBER MICH</Text>
                <Text style={styles.sectionText}>"{data.bio}"</Text>
              </View>
            ) : null}

            {data.religion && data.religion !== 'Keine' ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>🕊 RELIGION</Text>
                <Text style={styles.sectionText}>{{ 'Christlich': '✝️', 'Islamisch': '☪️', 'Hinduistisch': '🕉', 'Buddhistisch': '☸️', 'Jüdisch': '✡️', 'Andere': '🌍' }[data.religion] ?? ''} {data.religion}</Text>
              </View>
            ) : null}

            {data.travelStyle ? (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>🎒 REISESTIL</Text>
                <View style={styles.styleChip}>
                  <Text style={styles.styleChipText}>{data.travelStyle}</Text>
                </View>
              </View>
            ) : null}

            {data.destinations.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>🌍 REISEZIELE</Text>
                <View style={styles.chips}>
                  {data.destinations.map(d => (
                    <LinearGradient key={d.name} colors={['rgba(255,140,0,0.2)', 'rgba(255,77,109,0.15)']} style={styles.destDetailChip}>
                      <Text style={styles.destDetailText}>{d.flag} {d.name}</Text>
                    </LinearGradient>
                  ))}
                </View>
              </View>
            )}

            {data.interests.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>🎯 INTERESSEN</Text>
                <View style={styles.chips}>
                  {data.interests.map(i => (
                    <View key={i} style={styles.interestDetailChip}>
                      <Text style={styles.interestDetailText}>{i}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: 20, gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  content: { padding: spacing.lg, alignItems: 'center' },
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 24, overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16 },
  cardBg: { width: '100%', height: '100%', backgroundColor: '#1a1a2e' },
  avatarCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 80 },
  dots: { position: 'absolute', top: 12, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#fff', width: 18, borderRadius: 3 },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: spacing.lg, paddingTop: 80 },
  name: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  destRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  destChip: { backgroundColor: 'rgba(255,140,0,0.85)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4 },
  destText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  interestChip: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4 },
  interestText: { color: '#fff', fontSize: 12 },
  bio: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  infoBtn: { position: 'absolute', top: 14, right: 14, width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  infoBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  detailCard: { width: CARD_WIDTH, backgroundColor: colors.surface, borderRadius: 20,
    padding: spacing.lg, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  detailTitle: { fontSize: 13, fontWeight: '900', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  photoStrip: { flexDirection: 'row', gap: 6, marginBottom: spacing.md },
  stripThumb: { width: 52, height: 66, borderRadius: 10, backgroundColor: colors.surfaceLight },
  section: { marginBottom: spacing.md },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  sectionText: { fontSize: 14, color: colors.text, lineHeight: 21, fontStyle: 'italic' },
  styleChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,140,0,0.15)',
    borderRadius: 50, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,140,0,0.3)' },
  styleChipText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  destDetailChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  destDetailText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  interestDetailChip: { backgroundColor: colors.surfaceLight, borderRadius: 50,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border },
  interestDetailText: { color: colors.text, fontSize: 12, fontWeight: '600' },
})
