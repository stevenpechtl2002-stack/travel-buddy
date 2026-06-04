import { colors, gradients, spacing } from '../constants/theme'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image, Alert } from 'react-native'
import { useState } from 'react'

export interface ProfileData {
  name: string
  tagline: string
  bio: string
  travelStyle: string
  destinations: { flag: string; name: string }[]
  interests: string[]
  images: string[]
}

interface Props {
  visible: boolean
  data: ProfileData
  onChange: (d: ProfileData) => void
  onClose: () => void
}

const TRAVEL_STYLES = [
  { icon: '🏕️', label: 'Backpacker' },
  { icon: '🏙️', label: 'City' },
  { icon: '🏖️', label: 'Beach' },
  { icon: '⛰️', label: 'Adventure' },
]

const ALL_INTERESTS = [
  '🏄 Surfen', '📸 Fotografie', '🍜 Street Food', '🤿 Tauchen',
  '🧘 Yoga', '🎵 Musik', '🥾 Wandern', '🎨 Kunst', '🍷 Wein',
  '🚴 Fahrrad', '🎭 Theater', '📚 Lesen',
]

const ALL_COUNTRIES = [
  { flag: '🇦🇫', name: 'Afghanistan' },
  { flag: '🇦🇱', name: 'Albanien' },
  { flag: '🇩🇿', name: 'Algerien' },
  { flag: '🇦🇩', name: 'Andorra' },
  { flag: '🇦🇴', name: 'Angola' },
  { flag: '🇦🇬', name: 'Antigua und Barbuda' },
  { flag: '🇦🇷', name: 'Argentinien' },
  { flag: '🇦🇲', name: 'Armenien' },
  { flag: '🇦🇺', name: 'Australien' },
  { flag: '🇦🇹', name: 'Österreich' },
  { flag: '🇦🇿', name: 'Aserbaidschan' },
  { flag: '🇧🇸', name: 'Bahamas' },
  { flag: '🇧🇭', name: 'Bahrain' },
  { flag: '🇧🇩', name: 'Bangladesch' },
  { flag: '🇧🇧', name: 'Barbados' },
  { flag: '🇧🇾', name: 'Belarus' },
  { flag: '🇧🇪', name: 'Belgien' },
  { flag: '🇧🇿', name: 'Belize' },
  { flag: '🇧🇯', name: 'Benin' },
  { flag: '🇧🇹', name: 'Bhutan' },
  { flag: '🇧🇴', name: 'Bolivien' },
  { flag: '🇧🇦', name: 'Bosnien und Herzegowina' },
  { flag: '🇧🇼', name: 'Botswana' },
  { flag: '🇧🇷', name: 'Brasilien' },
  { flag: '🇧🇳', name: 'Brunei' },
  { flag: '🇧🇬', name: 'Bulgarien' },
  { flag: '🇧🇫', name: 'Burkina Faso' },
  { flag: '🇧🇮', name: 'Burundi' },
  { flag: '🇨🇻', name: 'Cabo Verde' },
  { flag: '🇰🇭', name: 'Kambodscha' },
  { flag: '🇨🇲', name: 'Kamerun' },
  { flag: '🇨🇦', name: 'Kanada' },
  { flag: '🇨🇫', name: 'Zentralafrikanische Republik' },
  { flag: '🇹🇩', name: 'Tschad' },
  { flag: '🇨🇱', name: 'Chile' },
  { flag: '🇨🇳', name: 'China' },
  { flag: '🇨🇴', name: 'Kolumbien' },
  { flag: '🇰🇲', name: 'Komoren' },
  { flag: '🇨🇬', name: 'Kongo' },
  { flag: '🇨🇷', name: 'Costa Rica' },
  { flag: '🇭🇷', name: 'Kroatien' },
  { flag: '🇨🇺', name: 'Kuba' },
  { flag: '🇨🇾', name: 'Zypern' },
  { flag: '🇨🇿', name: 'Tschechien' },
  { flag: '🇩🇰', name: 'Dänemark' },
  { flag: '🇩🇯', name: 'Dschibuti' },
  { flag: '🇩🇲', name: 'Dominica' },
  { flag: '🇩🇴', name: 'Dominikanische Republik' },
  { flag: '🇪🇨', name: 'Ecuador' },
  { flag: '🇪🇬', name: 'Ägypten' },
  { flag: '🇸🇻', name: 'El Salvador' },
  { flag: '🇬🇶', name: 'Äquatorialguinea' },
  { flag: '🇪🇷', name: 'Eritrea' },
  { flag: '🇪🇪', name: 'Estland' },
  { flag: '🇸🇿', name: 'Eswatini' },
  { flag: '🇪🇹', name: 'Äthiopien' },
  { flag: '🇫🇯', name: 'Fidschi' },
  { flag: '🇫🇮', name: 'Finnland' },
  { flag: '🇫🇷', name: 'Frankreich' },
  { flag: '🇬🇦', name: 'Gabun' },
  { flag: '🇬🇲', name: 'Gambia' },
  { flag: '🇬🇪', name: 'Georgien' },
  { flag: '🇩🇪', name: 'Deutschland' },
  { flag: '🇬🇭', name: 'Ghana' },
  { flag: '🇬🇷', name: 'Griechenland' },
  { flag: '🇬🇩', name: 'Grenada' },
  { flag: '🇬🇹', name: 'Guatemala' },
  { flag: '🇬🇳', name: 'Guinea' },
  { flag: '🇬🇼', name: 'Guinea-Bissau' },
  { flag: '🇬🇾', name: 'Guyana' },
  { flag: '🇭🇹', name: 'Haiti' },
  { flag: '🇭🇳', name: 'Honduras' },
  { flag: '🇭🇺', name: 'Ungarn' },
  { flag: '🇮🇸', name: 'Island' },
  { flag: '🇮🇳', name: 'Indien' },
  { flag: '🇮🇩', name: 'Indonesien' },
  { flag: '🇮🇷', name: 'Iran' },
  { flag: '🇮🇶', name: 'Irak' },
  { flag: '🇮🇪', name: 'Irland' },
  { flag: '🇮🇱', name: 'Israel' },
  { flag: '🇮🇹', name: 'Italien' },
  { flag: '🇯🇲', name: 'Jamaika' },
  { flag: '🇯🇵', name: 'Japan' },
  { flag: '🇯🇴', name: 'Jordanien' },
  { flag: '🇰🇿', name: 'Kasachstan' },
  { flag: '🇰🇪', name: 'Kenia' },
  { flag: '🇰🇮', name: 'Kiribati' },
  { flag: '🇰🇵', name: 'Nordkorea' },
  { flag: '🇰🇷', name: 'Südkorea' },
  { flag: '🇽🇰', name: 'Kosovo' },
  { flag: '🇰🇼', name: 'Kuwait' },
  { flag: '🇰🇬', name: 'Kirgisistan' },
  { flag: '🇱🇦', name: 'Laos' },
  { flag: '🇱🇻', name: 'Lettland' },
  { flag: '🇱🇧', name: 'Libanon' },
  { flag: '🇱🇸', name: 'Lesotho' },
  { flag: '🇱🇷', name: 'Liberia' },
  { flag: '🇱🇾', name: 'Libyen' },
  { flag: '🇱🇮', name: 'Liechtenstein' },
  { flag: '🇱🇹', name: 'Litauen' },
  { flag: '🇱🇺', name: 'Luxemburg' },
  { flag: '🇲🇬', name: 'Madagaskar' },
  { flag: '🇲🇼', name: 'Malawi' },
  { flag: '🇲🇾', name: 'Malaysia' },
  { flag: '🇲🇻', name: 'Malediven' },
  { flag: '🇲🇱', name: 'Mali' },
  { flag: '🇲🇹', name: 'Malta' },
  { flag: '🇲🇭', name: 'Marshallinseln' },
  { flag: '🇲🇷', name: 'Mauretanien' },
  { flag: '🇲🇺', name: 'Mauritius' },
  { flag: '🇲🇽', name: 'Mexiko' },
  { flag: '🇫🇲', name: 'Mikronesien' },
  { flag: '🇲🇩', name: 'Moldau' },
  { flag: '🇲🇨', name: 'Monaco' },
  { flag: '🇲🇳', name: 'Mongolei' },
  { flag: '🇲🇪', name: 'Montenegro' },
  { flag: '🇲🇦', name: 'Marokko' },
  { flag: '🇲🇿', name: 'Mosambik' },
  { flag: '🇲🇲', name: 'Myanmar' },
  { flag: '🇳🇦', name: 'Namibia' },
  { flag: '🇳🇷', name: 'Nauru' },
  { flag: '🇳🇵', name: 'Nepal' },
  { flag: '🇳🇱', name: 'Niederlande' },
  { flag: '🇳🇿', name: 'Neuseeland' },
  { flag: '🇳🇮', name: 'Nicaragua' },
  { flag: '🇳🇪', name: 'Niger' },
  { flag: '🇳🇬', name: 'Nigeria' },
  { flag: '🇲🇰', name: 'Nordmazedonien' },
  { flag: '🇳🇴', name: 'Norwegen' },
  { flag: '🇴🇲', name: 'Oman' },
  { flag: '🇵🇰', name: 'Pakistan' },
  { flag: '🇵🇼', name: 'Palau' },
  { flag: '🇵🇸', name: 'Palästina' },
  { flag: '🇵🇦', name: 'Panama' },
  { flag: '🇵🇬', name: 'Papua-Neuguinea' },
  { flag: '🇵🇾', name: 'Paraguay' },
  { flag: '🇵🇪', name: 'Peru' },
  { flag: '🇵🇭', name: 'Philippinen' },
  { flag: '🇵🇱', name: 'Polen' },
  { flag: '🇵🇹', name: 'Portugal' },
  { flag: '🇶🇦', name: 'Katar' },
  { flag: '🇷🇴', name: 'Rumänien' },
  { flag: '🇷🇺', name: 'Russland' },
  { flag: '🇷🇼', name: 'Ruanda' },
  { flag: '🇰🇳', name: 'St. Kitts und Nevis' },
  { flag: '🇱🇨', name: 'St. Lucia' },
  { flag: '🇻🇨', name: 'St. Vincent und die Grenadinen' },
  { flag: '🇼🇸', name: 'Samoa' },
  { flag: '🇸🇲', name: 'San Marino' },
  { flag: '🇸🇹', name: 'São Tomé und Príncipe' },
  { flag: '🇸🇦', name: 'Saudi-Arabien' },
  { flag: '🇸🇳', name: 'Senegal' },
  { flag: '🇷🇸', name: 'Serbien' },
  { flag: '🇸🇨', name: 'Seychellen' },
  { flag: '🇸🇱', name: 'Sierra Leone' },
  { flag: '🇸🇬', name: 'Singapur' },
  { flag: '🇸🇰', name: 'Slowakei' },
  { flag: '🇸🇮', name: 'Slowenien' },
  { flag: '🇸🇧', name: 'Salomonen' },
  { flag: '🇸🇴', name: 'Somalia' },
  { flag: '🇿🇦', name: 'Südafrika' },
  { flag: '🇸🇸', name: 'Südsudan' },
  { flag: '🇪🇸', name: 'Spanien' },
  { flag: '🇱🇰', name: 'Sri Lanka' },
  { flag: '🇸🇩', name: 'Sudan' },
  { flag: '🇸🇷', name: 'Suriname' },
  { flag: '🇸🇪', name: 'Schweden' },
  { flag: '🇨🇭', name: 'Schweiz' },
  { flag: '🇸🇾', name: 'Syrien' },
  { flag: '🇹🇼', name: 'Taiwan' },
  { flag: '🇹🇯', name: 'Tadschikistan' },
  { flag: '🇹🇿', name: 'Tansania' },
  { flag: '🇹🇭', name: 'Thailand' },
  { flag: '🇹🇱', name: 'Timor-Leste' },
  { flag: '🇹🇬', name: 'Togo' },
  { flag: '🇹🇴', name: 'Tonga' },
  { flag: '🇹🇹', name: 'Trinidad und Tobago' },
  { flag: '🇹🇳', name: 'Tunesien' },
  { flag: '🇹🇷', name: 'Türkei' },
  { flag: '🇹🇲', name: 'Turkmenistan' },
  { flag: '🇹🇻', name: 'Tuvalu' },
  { flag: '🇺🇬', name: 'Uganda' },
  { flag: '🇺🇦', name: 'Ukraine' },
  { flag: '🇦🇪', name: 'Vereinigte Arabische Emirate' },
  { flag: '🇬🇧', name: 'Vereinigtes Königreich' },
  { flag: '🇺🇸', name: 'USA' },
  { flag: '🇺🇾', name: 'Uruguay' },
  { flag: '🇺🇿', name: 'Usbekistan' },
  { flag: '🇻🇺', name: 'Vanuatu' },
  { flag: '🇻🇦', name: 'Vatikanstadt' },
  { flag: '🇻🇪', name: 'Venezuela' },
  { flag: '🇻🇳', name: 'Vietnam' },
  { flag: '🇾🇪', name: 'Jemen' },
  { flag: '🇿🇲', name: 'Sambia' },
  { flag: '🇿🇼', name: 'Simbabwe' },
]

export default function ProfileEditModal({ visible, data, onChange, onClose }: Props) {
  const set = (patch: Partial<ProfileData>) => onChange({ ...data, ...patch })
  const [destSearch, setDestSearch] = useState('')

  const MAX_IMAGES = 10

  const addFromLibrary = async () => {
    if (data.images.length >= MAX_IMAGES) {
      Alert.alert('Maximum erreicht', `Du kannst maximal ${MAX_IMAGES} Fotos hochladen.`)
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Zugriff verweigert', 'Bitte erlaube den Zugriff auf deine Fotos in den Einstellungen.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    })
    if (!result.canceled) {
      set({ images: [...data.images, result.assets[0].uri] })
    }
  }

  const addFromCamera = async () => {
    if (data.images.length >= MAX_IMAGES) {
      Alert.alert('Maximum erreicht', `Du kannst maximal ${MAX_IMAGES} Fotos hochladen.`)
      return
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Zugriff verweigert', 'Bitte erlaube den Kamerazugriff in den Einstellungen.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    })
    if (!result.canceled) {
      set({ images: [...data.images, result.assets[0].uri] })
    }
  }

  const addImage = () => {
    Alert.alert('Foto hinzufügen', '', [
      { text: 'Kamera', onPress: addFromCamera },
      { text: 'Aus Galerie', onPress: addFromLibrary },
      { text: 'Abbrechen', style: 'cancel' },
    ])
  }

  const removeImage = (index: number) => {
    Alert.alert('Foto entfernen', 'Dieses Foto löschen?', [
      { text: 'Löschen', style: 'destructive', onPress: () => {
        set({ images: data.images.filter((_, i) => i !== index) })
      }},
      { text: 'Abbrechen', style: 'cancel' },
    ])
  }

  const toggleInterest = (i: string) => {
    const has = data.interests.includes(i)
    set({ interests: has ? data.interests.filter(x => x !== i) : [...data.interests, i] })
  }

  const toggleDest = (d: { flag: string; name: string }) => {
    const has = data.destinations.some(x => x.name === d.name)
    set({ destinations: has ? data.destinations.filter(x => x.name !== d.name) : [...data.destinations, d] })
  }

  const filteredCountries = destSearch.trim()
    ? ALL_COUNTRIES.filter(c => c.name.toLowerCase().includes(destSearch.toLowerCase()))
    : ALL_COUNTRIES

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient colors={gradients.brand} style={styles.header}>
          <Text style={styles.headerTitle}>Profil bearbeiten</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.doneText}>Fertig</Text>
          </Pressable>
        </LinearGradient>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>

          {/* Photos */}
          <View style={styles.section}>
            <Text style={styles.label}>FOTOS ({data.images.length}/{MAX_IMAGES})</Text>
            <Text style={styles.photoHint}>Erstes Foto = Profilbild auf der Karte</Text>
            <View style={styles.photoGrid}>
              {data.images.map((uri, i) => (
                <View key={i} style={styles.photoThumbWrap}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  {i === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>★</Text>
                    </View>
                  )}
                  <Pressable style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </Pressable>
                </View>
              ))}
              {data.images.length < MAX_IMAGES && (
                <Pressable style={styles.addPhotoBtn} onPress={addImage}>
                  <Text style={styles.addPhotoBtnIcon}>+</Text>
                  <Text style={styles.addPhotoBtnText}>Foto</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={data.name}
              onChangeText={t => set({ name: t })}
              placeholder="Dein Name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Tagline */}
          <View style={styles.section}>
            <Text style={styles.label}>TAGLINE</Text>
            <TextInput
              style={styles.input}
              value={data.tagline}
              onChangeText={t => set({ tagline: t })}
              placeholder="z.B. ✈ Solo Traveler · Abenteurer"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.label}>ÜBER MICH</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={data.bio}
              onChangeText={t => set({ bio: t })}
              placeholder="Erzähl etwas über dich..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Travel Style */}
          <View style={styles.section}>
            <Text style={styles.label}>REISESTIL</Text>
            <View style={styles.chips}>
              {TRAVEL_STYLES.map(s => {
                const active = data.travelStyle === s.label
                return (
                  <Pressable key={s.label} onPress={() => set({ travelStyle: s.label })}>
                    {active
                      ? <LinearGradient colors={gradients.brandH} style={styles.chipActive}>
                          <Text style={styles.chipActiveText}>{s.icon} {s.label}</Text>
                        </LinearGradient>
                      : <View style={styles.chip}>
                          <Text style={styles.chipText}>{s.icon} {s.label}</Text>
                        </View>
                    }
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Destinations */}
          <View style={styles.section}>
            <Text style={styles.label}>REISEZIELE</Text>
            {data.destinations.length > 0 && (
              <View style={styles.selectedChips}>
                {data.destinations.map(d => (
                  <Pressable key={d.name} onPress={() => toggleDest(d)}>
                    <LinearGradient colors={gradients.brandH} style={styles.chipActive}>
                      <Text style={styles.chipActiveText}>{d.flag} {d.name} ✕</Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            )}
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Land suchen..."
              placeholderTextColor={colors.textMuted}
              value={destSearch}
              onChangeText={setDestSearch}
            />
            <ScrollView style={styles.countryList} nestedScrollEnabled>
              <View style={styles.chips}>
                {filteredCountries.map(d => {
                  const active = data.destinations.some(x => x.name === d.name)
                  return (
                    <Pressable key={d.name} onPress={() => toggleDest(d)}>
                      {active
                        ? <LinearGradient colors={gradients.brandH} style={styles.chipActive}>
                            <Text style={styles.chipActiveText}>{d.flag} {d.name}</Text>
                          </LinearGradient>
                        : <View style={styles.chip}>
                            <Text style={styles.chipText}>{d.flag} {d.name}</Text>
                          </View>
                      }
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>
          </View>

          {/* Interests */}
          <View style={styles.section}>
            <Text style={styles.label}>INTERESSEN</Text>
            <View style={styles.chips}>
              {ALL_INTERESTS.map(i => {
                const active = data.interests.includes(i)
                return (
                  <Pressable key={i} onPress={() => toggleInterest(i)}>
                    {active
                      ? <LinearGradient colors={gradients.brandH} style={styles.chipActive}>
                          <Text style={styles.chipActiveText}>{i}</Text>
                        </LinearGradient>
                      : <View style={styles.chip}>
                          <Text style={styles.chipText}>{i}</Text>
                        </View>
                    }
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <Pressable style={styles.saveBtn} onPress={onClose}>
          <LinearGradient colors={gradients.brand} style={styles.saveGrad}>
            <Text style={styles.saveText}>✓ Speichern</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, paddingTop: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', flex: 1 },
  doneText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollInner: { padding: spacing.lg, gap: 4 },
  photoHint: { fontSize: 11, color: colors.textMuted, marginBottom: 12 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumbWrap: { position: 'relative', width: 90, height: 112 },
  photoThumb: { width: 90, height: 112, borderRadius: 12, backgroundColor: colors.surfaceLight },
  mainBadge: { position: 'absolute', top: 5, left: 5, backgroundColor: colors.primary,
    borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  mainBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  removeBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)',
    width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addPhotoBtn: { width: 90, height: 112, borderRadius: 12,
    backgroundColor: colors.surfaceLight, borderWidth: 2, borderColor: colors.border,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 4 },
  addPhotoBtnIcon: { fontSize: 28, color: colors.textMuted },
  addPhotoBtnText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  section: { backgroundColor: colors.surface, borderRadius: 20, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '800', color: colors.textMuted,
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  input: { backgroundColor: colors.surfaceLight, borderRadius: 14, padding: 14,
    color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectedChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  countryList: { maxHeight: 220 },
  chip: { backgroundColor: colors.surfaceLight, borderRadius: 50,
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  chipActive: { borderRadius: 50, paddingHorizontal: 14, paddingVertical: 8 },
  chipActiveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  saveBtn: { margin: spacing.lg, borderRadius: 50, overflow: 'hidden' },
  saveGrad: { padding: 18, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '900', fontSize: 17 },
})
