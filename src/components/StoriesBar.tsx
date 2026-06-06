import { colors, gradients } from '../constants/theme'
import { StoryGroup } from '../hooks/useStories'
import { LinearGradient } from 'expo-linear-gradient'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native'

interface Props {
  groups: StoryGroup[]
  myUserId: string
  myName: string
  myPhotoUrl: string | null
  seenIds: Set<string>
  onOpenStory: (groupIndex: number) => void
  onAddStory: (imageUri: string, caption: string | null) => Promise<void>
}

export default function StoriesBar({
  groups, myUserId, myName, myPhotoUrl, seenIds, onOpenStory, onAddStory,
}: Props) {
  const [uploading, setUploading] = useState(false)

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

  const isSeen = (group: StoryGroup) =>
    group.stories.every(s => seenIds.has(s.id))

  // All groups except mine (mine is handled separately as first item)
  const otherGroups = groups.filter(g => g.user_id !== myUserId)

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* My Story — always first */}
        <Pressable style={styles.item} onPress={myGroup ? () => onOpenStory(groups.indexOf(myGroup)) : handleAddStory}>
          <View style={styles.ringWrap}>
            {/* Ring: gradient if has story, dashed if not */}
            {myGroup ? (
              <LinearGradient colors={gradients.brand} style={styles.ring}>
                <View style={styles.avatarInner}>
                  {myPhotoUrl
                    ? <Image source={{ uri: myPhotoUrl }} style={styles.avatar} />
                    : <LinearGradient colors={['#243a52', '#1a2a3e']} style={styles.avatar}>
                        <Text style={styles.initial}>{myName.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                  }
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.ringEmpty}>
                <View style={styles.avatarInner}>
                  {myPhotoUrl
                    ? <Image source={{ uri: myPhotoUrl }} style={styles.avatar} />
                    : <LinearGradient colors={['#243a52', '#1a2a3e']} style={styles.avatar}>
                        <Text style={styles.initial}>{myName.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                  }
                </View>
              </View>
            )}

            {/* Add / loading badge */}
            <View style={styles.addBadge}>
              {uploading
                ? <ActivityIndicator color="#fff" size={10} />
                : <Text style={styles.addBadgeText}>{myGroup ? '·' : '+'}</Text>}
            </View>
          </View>
          <Text style={styles.label} numberOfLines={1}>Deine Story</Text>
        </Pressable>

        {/* Other users' stories */}
        {otherGroups.map((group, i) => {
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
  root: {
    borderBottomWidth: 1,
    borderColor: 'rgba(245,240,235,0.08)',
    paddingBottom: 12,
  },
  row: { paddingHorizontal: 12, paddingTop: 14, gap: 18 },
  item: { alignItems: 'center', width: RING },

  ringWrap: { position: 'relative', marginBottom: 6 },

  // Active ring (gradient)
  ring: {
    width: RING, height: RING, borderRadius: RING / 2,
    justifyContent: 'center', alignItems: 'center',
  },
  // Seen ring (muted)
  ringSeen: {
    width: RING, height: RING, borderRadius: RING / 2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(245,240,235,0.2)',
  },
  // No story ring (dashed border style)
  ringEmpty: {
    width: RING, height: RING, borderRadius: RING / 2,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(245,240,235,0.25)',
    borderStyle: 'dashed',
  },

  avatarInner: {
    width: AVATAR, height: AVATAR, borderRadius: AVATAR / 2,
    overflow: 'hidden',
    borderWidth: 2.5, borderColor: colors.background,
  },
  avatar: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
  },
  initial: { color: '#fff', fontWeight: '900', fontSize: 22, textAlign: 'center', lineHeight: AVATAR },

  // + badge
  addBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  addBadgeText: { color: '#fff', fontSize: 14, fontWeight: '900', lineHeight: 16 },

  label: { fontSize: 11, color: 'rgba(245,240,235,0.7)', fontWeight: '600', maxWidth: RING },
})
