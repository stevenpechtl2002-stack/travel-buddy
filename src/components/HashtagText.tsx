import { useRouter } from 'expo-router'
import { Pressable, Text, TextStyle } from 'react-native'
import { colors } from '../constants/theme'

interface Props {
  text: string
  style?: TextStyle
  numberOfLines?: number
}

export default function HashtagText({ text, style, numberOfLines }: Props) {
  const router = useRouter()
  const parts = text.split(/(#\w+)/g)

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        if (part.startsWith('#')) {
          const tag = part.slice(1)
          return (
            <Text
              key={i}
              style={[style, { color: colors.primary, fontWeight: '700' }]}
              onPress={() => router.push(`/hashtag/${tag}` as any)}
            >
              {part}
            </Text>
          )
        }
        return <Text key={i} style={style}>{part}</Text>
      })}
    </Text>
  )
}
