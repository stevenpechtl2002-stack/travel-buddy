import { useEffect, useRef } from 'react'
import { Animated, Dimensions, View } from 'react-native'
import Svg, { Circle, Defs, Ellipse, LinearGradient as SvgGradient, Path, RadialGradient, Stop } from 'react-native-svg'

const { width } = Dimensions.get('window')
const SIZE = width * 0.82
const R = SIZE / 2
const CX = R
const CY = R

interface StoryPin {
  lat: number
  lon: number
  color: string
}

interface Props {
  rotation: Animated.Value
  pins?: StoryPin[]
}

function latLonToXY(lat: number, lon: number, rotationDeg: number) {
  const lonRad = ((lon + rotationDeg) * Math.PI) / 180
  const latRad = (lat * Math.PI) / 180
  const x = CX + R * 0.85 * Math.cos(latRad) * Math.sin(lonRad)
  const y = CY - R * 0.85 * Math.sin(latRad)
  const visible = Math.cos(latRad) * Math.cos(lonRad) > -0.2
  return { x, y, visible }
}

export default function Globe3D({ rotation, pins = [] }: Props) {
  const rot = useRef(0)
  useEffect(() => {
    rotation.addListener(({ value }) => { rot.current = value })
    return () => rotation.removeAllListeners()
  }, [])

  // latitude grid lines
  const latLines = [-60, -30, 0, 30, 60].map(lat => {
    const points: string[] = []
    for (let lon = -180; lon <= 180; lon += 6) {
      const { x, y, visible } = latLonToXY(lat, lon, 0)
      if (visible) points.push(`${x},${y}`)
    }
    return points.join(' ')
  })

  // longitude grid lines (ellipses approximation)
  const lonAngles = [0, 30, 60, 90, 120, 150]

  return (
    <View style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE}>
        <Defs>
          <RadialGradient id="ocean" cx="40%" cy="35%" r="65%">
            <Stop offset="0" stopColor="#4fc3f7" stopOpacity="1" />
            <Stop offset="0.5" stopColor="#1976d2" stopOpacity="1" />
            <Stop offset="1" stopColor="#0d47a1" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="shine" cx="35%" cy="25%" r="50%">
            <Stop offset="0" stopColor="#fff" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#fff" stopOpacity="0" />
          </RadialGradient>
          <SvgGradient id="shadow" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#000" stopOpacity="0" />
            <Stop offset="1" stopColor="#000" stopOpacity="0.35" />
          </SvgGradient>
        </Defs>

        {/* Ocean base */}
        <Circle cx={CX} cy={CY} r={R * 0.86} fill="url(#ocean)" />

        {/* Continents (simplified paths) */}
        {/* Europe/Africa */}
        <Path d={`M ${CX+R*0.05} ${CY-R*0.35} Q ${CX+R*0.18} ${CY-R*0.25} ${CX+R*0.2} ${CY-R*0.1} Q ${CX+R*0.15} ${CY+R*0.15} ${CX+R*0.1} ${CY+R*0.45} Q ${CX-R*0.05} ${CY+R*0.48} ${CX-R*0.1} ${CY+R*0.2} Q ${CX-R*0.08} ${CY-R*0.05} ${CX+R*0.05} ${CY-R*0.35} Z`}
          fill="#4caf50" opacity={0.85} />
        {/* Asia */}
        <Path d={`M ${CX+R*0.2} ${CY-R*0.42} Q ${CX+R*0.55} ${CY-R*0.38} ${CX+R*0.7} ${CY-R*0.15} Q ${CX+R*0.68} ${CY+R*0.05} ${CX+R*0.5} ${CY+R*0.12} Q ${CX+R*0.28} ${CY+R*0.08} ${CX+R*0.2} ${CY-R*0.1} Q ${CX+R*0.18} ${CY-R*0.28} ${CX+R*0.2} ${CY-R*0.42} Z`}
          fill="#66bb6a" opacity={0.85} />
        {/* Americas */}
        <Path d={`M ${CX-R*0.45} ${CY-R*0.38} Q ${CX-R*0.3} ${CY-R*0.42} ${CX-R*0.22} ${CY-R*0.2} Q ${CX-R*0.2} ${CY+R*0.05} ${CX-R*0.3} ${CY+R*0.38} Q ${CX-R*0.48} ${CY+R*0.4} ${CX-R*0.55} ${CY+R*0.15} Q ${CX-R*0.58} ${CY-R*0.12} ${CX-R*0.45} ${CY-R*0.38} Z`}
          fill="#43a047" opacity={0.85} />

        {/* Grid lines - latitude */}
        {[-60, -30, 0, 30, 60].map((lat, i) => (
          <Ellipse
            key={`lat-${i}`}
            cx={CX} cy={CY - R * 0.85 * Math.sin((lat * Math.PI) / 180)}
            rx={R * 0.85 * Math.cos((lat * Math.PI) / 180)}
            ry={R * 0.85 * Math.cos((lat * Math.PI) / 180) * 0.12}
            fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8"
          />
        ))}
        {/* Grid lines - longitude */}
        {lonAngles.map((lon, i) => (
          <Ellipse
            key={`lon-${i}`}
            cx={CX} cy={CY}
            rx={R * 0.85 * Math.abs(Math.cos((lon * Math.PI) / 180))}
            ry={R * 0.85}
            fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8"
          />
        ))}

        {/* Atmosphere glow */}
        <Circle cx={CX} cy={CY} r={R * 0.86}
          fill="none" stroke="#80d8ff" strokeWidth={R * 0.06} strokeOpacity={0.12} />

        {/* Shine overlay */}
        <Circle cx={CX} cy={CY} r={R * 0.86} fill="url(#shine)" />

        {/* Shadow edge */}
        <Circle cx={CX + R * 0.08} cy={CY + R * 0.08} r={R * 0.86} fill="url(#shadow)" />

        {/* Outer ring */}
        <Circle cx={CX} cy={CY} r={R * 0.86}
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
      </Svg>
    </View>
  )
}
