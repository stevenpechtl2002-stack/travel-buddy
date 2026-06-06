import { colors, gradients } from '../constants/theme'
import { StoryGroup } from '../hooks/useStories'
import { LinearGradient } from 'expo-linear-gradient'
import { Alert, ActionSheetIOS, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native'

interface Props {
  groups: StoryGroup[]
  myUserId: string
  myName: string
  myPhotoUrl: string | null
  seenIds: Set<string>
  onOpenStory: (groupIndex: number) => void
  onAddStory: (imageUri: string, caption: string | null) => Promise<void>
  onDeleteStory: (storyId: string) => Promise<void>
}

export default function StoriesBar({
  groups, myUserId, myName, myPhotoUrl, seenIds, onOpenStory, onAddStory, onDeleteStory,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [storyInfoVisible, setStoryInfoVisible] = useState(false)
  const [selectedStory, setSelectedStory] = useState<{ id: string; seen_count: number; image_url: string } | null>(null)

  const myGroup = groups.find(g => g.user_id === myUserId)

  const handleAddStory = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Kein Zugriff', 'Bitte Fotogalerie-Zugriff erlauben.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.85,
    })
    if (result.canceled) return
    setUploading(true)
    try {
      await onAddStory(result.assets[0].uri, null)
    } catch (e: any) {
      Alert.alert('Fehler', e.message)
    } finally {
      setUploading(false)
    }
  }

  const handleMyStoryPress = () => {
    if (!myGroup) { handleAddStory(); return }
    // Show story info sheet for first story
    const story = myGroup.stories[0]
    setSelectedStory({ id: story.id, seen_count: story.seen_count ?? 0, image_url: story.image_url })
    setStoryInfoVisible(true)
  }

  const handleDeleteStory = () => {
    if (!selectedStory) return
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Abbrechen', 'Story löschen'], destructiveButtonIndex: 1, cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 1) {
            await onDeleteStory(selectedStory.id)
            setStoryInfoVisible(false)
          }
        }
      )
    } else {
      Alert.alert('Story löschen?', '', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          await onDeleteStory(selectedStory.id)
          setStoryInfoVisible(false)
        }},
      ])
    }
  }

  const isSeen = (group: StoryGroup) =>
    group.stories.every(s => seenIds.has(s.id))

  const otherGroups = groups.filter(g => g.user_id !== myUserId)

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {/* My Story */}
        <Pressable style={styles.item} onPress={handleMyStoryPress}>
          <View style={styles.ringWrap}>
            {myGroup ? (
              <LinearGradient colors={gradients.brand} style={styles.ring}>
                <View style={styles.avatarInner}>
                  {myPhotoUrl
                    ? <Image source={{ uri: myPhotoUrl }} style={styles.avatar} />
                    : <LinearGradient colors={['#243a52', '#1a2a3e']} style={styles.avatar}>
                        <Text style={styles.initial}>{myName.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>}
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.ringEmpty}>
                <View style={styles.avatarInner}>
                  {myPhotoUrl
                    ? <Image source={{ uri: myPhotoUrl }} style={styles.avatar} />
                    : <LinearGradient colors={['#243a52', '#1a2a3e']} style={styles.avatar}>
                        <Text style={styles.initial}>{myName.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>}
                </View>
              </View>
            )}
            <View style={styles.addBadge}>
              {uploading
                ? <ActivityIndicator color="#fff" size={10} />
                : <Text style={styles.addBadgeText}>{myGroup ? '👁' : '+'}</Text>}
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>Deine Story</Text>
        </Pressable>

        {/* Other users' stories */}
        {otherGroups.map((group) => {
          const seen = isSeen(group)
          const originalIdx = groups.indexOf(group)
          return (
            <Pressable key={group.user_id} style={styles.item} onPress={() => onOpenStory(originalIdx)}>
              <View style={styles.ringWrap}>
                {seen ? (
                  <View style={styles.ringSeen}>
                    <View style={styles.avatarInner}>
                      <Avatar uri={group.profile_image_url} name={group.name} />
                    </View>
                  </View>
                ) : (
                  <LinearGradient colors={gradients.brand} style={styles.ring}>
                    <View style={styles.avatarInner}>
                      <Avatar uri={group.profile_image_url} name={group.name} />
                    </View>
                  </LinearGradient>
                )}
              </View>
              <Text style={styles.label} numberOfLines={1}>{group.name.split(' ')[0]}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Story Info Modal */}
      <Modal visible={storyInfoVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setStoryInfoVisible(false)}>
        <View style={infoS.root}>
          <View style={infoS.handle} />
          <Text style={infoS.title}>Deine Story</Text>
          {selectedStory && (
            <Image source={{ uri: selectedStory.image_url }} style={infoS.preview} resizeMode="cover" />
          )}
          <View style={infoS.statsRow}>
            <View style={infoS.stat}>
              <Text style={infoS.statNum}>{selectedStory?.seen_count ?? 0}</Text>
              <Text style={infoS.statLabel}>👁 Aufrufe</Text>
            </View>
          </View>
          <Pressable style={infoS.deleteBtn} onPress={handleDeleteStory}>
            <Text style={infoS.deleteBtnText}>🗑 Story löschen</Text>
          </Pressable>
          <Pressable style={infoS.closeBtn} onPress={() => setStoryInfoVisible(false)}>
            <Text style={infoS.closeBtnText}>Schließen</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

function Avatar({ uri, name }: { uri: string | null; name: string }) {
  if (uri) return <Image source={{ uri }} style={styles.avatar} />
  return (
    <LinearGradient colors={['#243a52', '#1a2a3e']} style={styles.avatar}>
      <Text style={styles.initial}>{name.charAt(0).toUpperCase()}</Text>
    </LinearGradient>
  )
}

const RING = 68
const AVATAR = 60

const styles = StyleSheet.create({
  root: { borderBottomWidth: 1, borderColor: 'rgba(245,240,235,0.08)', paddingBottom: 12 },
  row: { paddingHorizontal: 12, paddingTop: 14, gap: 18 },
  item: { alignItems: 'center', width: RING },
  ringWrap: { position: 'relative', marginBottom: 6 },
  ring: { width: RING, height: RING, borderRadius: RING / 2, justifyContent: 'center', alignItems: 'center' },
  ringSeen: { width: RING, height: RING, borderRadius: RING / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(245,240,235,0.2)' },
  ringEmpty: { width: RING, height: RING, borderRadius: RING / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(245,240,235,0.25)', borderStyle: 'dashed' },
  avatarInner: { width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2, overflow: 'hidden', borderWidth: 2.5, borderColor: colors.background },
  avatar: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  initial: { color: '#fff', fontWeight: '900', fontSize: 22, textAlign: 'center', lineHeight: AVATAR },
  addBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.background },
  addBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', lineHeight: 14 },
  label: { fontSize: 11, color: 'rgba(245,240,235,0.7)', fontWeight: '600', maxWidth: RING },
})

const infoS = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0d1b2e', padding: 20, alignItems: 'center' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(245,240,235,0.2)', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: colors.text, marginBottom: 16 },
  preview: { width: '100%', height: 300, borderRadius: 18, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28 },
  stat: { alignItems: 'center', paddingHorizontal: 24 },
  statNum: { fontSize: 32, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  deleteBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(224,85,85,0.15)', borderWidth: 1, borderColor: 'rgba(224,85,85,0.3)', alignItems: 'center', marginBottom: 12 },
  deleteBtnText: { color: '#e05555', fontWeight: '800', fontSize: 16 },
  closeBtn: { width: '100%', paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(245,240,235,0.08)', alignItems: 'center' },
  closeBtnText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
})
