import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'
import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function SceneBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#3b9de0', '#6ab8e8', '#a0d4f5', '#cce8f8', '#e8f6ff']}
        locations={[0, 0.2, 0.45, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Clouds */}
      <View style={styles.cloud1}><Text style={styles.cloudLg}>☁️</Text></View>
      <View style={styles.cloud2}><Text style={styles.cloudLg}>☁️</Text></View>
      <View style={styles.cloud3}><Text style={styles.cloudMd}>☁️</Text></View>
      <View style={styles.cloud4}><Text style={styles.cloudSm}>☁️</Text></View>
      <View style={styles.cloud5}><Text style={styles.cloudMd}>☁️</Text></View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cloud1: { position: 'absolute', top: 88, left: 8 },
  cloud2: { position: 'absolute', top: 108, right: 18 },
  cloud3: { position: 'absolute', top: 72, left: '35%' },
  cloud4: { position: 'absolute', top: 126, left: '58%' },
  cloud5: { position: 'absolute', top: 95, left: '18%' },
  cloudLg: { fontSize: 40, opacity: 0.75 },
  cloudMd: { fontSize: 28, opacity: 0.65 },
  cloudSm: { fontSize: 22, opacity: 0.5 },
})
