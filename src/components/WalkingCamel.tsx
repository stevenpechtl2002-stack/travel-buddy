import { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import Svg, { Path, Ellipse, Circle, G, Defs, RadialGradient, Stop } from 'react-native-svg'

const AnimatedG = Animated.createAnimatedComponent(G)

interface Props { size?: number }

export default function WalkingCamel({ size = 100 }: Props) {
  const phase = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(phase, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true })
    )
    anim.start()
    return () => anim.stop()
  }, [])

  // Alternating leg pairs: FL+BR swing forward together, FR+BL swing back
  const a = phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-22deg', '22deg', '-22deg'] })
  const b = phase.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['22deg', '-22deg', '22deg'] })
  const bodyBob = phase.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -2, 0, -2, 0] })

  // Leg pivots (x, y in 150x110 viewBox)
  const BL = { x: 52, y: 68 }  // back-left  (far side, darker)
  const BR = { x: 60, y: 68 }  // back-right
  const FL = { x: 94, y: 66 }  // front-left (far side, darker)
  const FR = { x: 102, y: 66 } // front-right

  function legTransform(px: number, py: number, rot: Animated.AnimatedInterpolation<string>) {
    return [
      { translateX: px }, { translateY: py },
      { rotate: rot as any },
      { translateX: -px }, { translateY: -py },
    ]
  }

  const LEG_COLOR_BACK = '#a87828'
  const LEG_COLOR_FRONT = '#c49030'
  const HOOF = '#5a3800'

  return (
    <Svg width={size} height={size * 0.75} viewBox="0 0 150 112">
      <Defs>
        <RadialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
          <Stop offset="0%" stopColor="#e8c060" />
          <Stop offset="100%" stopColor="#b88020" />
        </RadialGradient>
        <RadialGradient id="humpGrad" cx="50%" cy="30%" r="60%">
          <Stop offset="0%" stopColor="#ddb040" />
          <Stop offset="100%" stopColor="#a07020" />
        </RadialGradient>
      </Defs>

      {/* ── FAR-SIDE LEGS (drawn first = behind body) ── */}

      {/* Far back leg */}
      <AnimatedG style={{ transform: legTransform(BL.x, BL.y, a) }}>
        <Path d={`M${BL.x},${BL.y} Q${BL.x-3},${BL.y+18} ${BL.x-2},${BL.y+36}`} stroke={LEG_COLOR_BACK} strokeWidth="5" strokeLinecap="round" fill="none"/>
        {/* hoof */}
        <Ellipse cx={BL.x-2} cy={BL.y+37} rx="4" ry="2.5" fill={HOOF}/>
      </AnimatedG>

      {/* Far front leg */}
      <AnimatedG style={{ transform: legTransform(FL.x, FL.y, b) }}>
        <Path d={`M${FL.x},${FL.y} Q${FL.x+3},${FL.y+18} ${FL.x+2},${FL.y+36}`} stroke={LEG_COLOR_BACK} strokeWidth="5" strokeLinecap="round" fill="none"/>
        <Ellipse cx={FL.x+2} cy={FL.y+37} rx="4" ry="2.5" fill={HOOF}/>
      </AnimatedG>

      {/* ── BODY GROUP (bobs up/down) ── */}
      <AnimatedG style={{ transform: [{ translateY: bodyBob }] }}>

        {/* Main body — big rounded shape */}
        <Path
          d="M32,68 Q28,56 32,48 Q38,38 52,36 Q60,32 72,30 Q84,28 90,36 Q98,38 106,46 Q112,54 110,66 Q100,74 75,76 Q52,76 32,68Z"
          fill="url(#bodyGrad)"
        />
        {/* Belly shadow */}
        <Ellipse cx="70" cy="72" rx="32" ry="6" fill="#8b6010" opacity="0.25"/>

        {/* Hump 1 (back) */}
        <Path
          d="M42,40 Q44,22 52,16 Q58,10 64,16 Q70,22 68,36 Q62,32 56,32 Q48,33 42,40Z"
          fill="url(#humpGrad)"
        />
        {/* Hump 1 highlight */}
        <Path d="M50,20 Q55,14 62,18" stroke="#f0d070" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>

        {/* Hump 2 (front) */}
        <Path
          d="M68,36 Q70,18 78,12 Q84,6 90,12 Q96,18 94,34 Q88,30 82,30 Q74,30 68,36Z"
          fill="url(#humpGrad)"
        />
        {/* Hump 2 highlight */}
        <Path d="M76,16 Q81,10 88,14" stroke="#f0d070" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5"/>

        {/* Valley between humps */}
        <Path d="M66,34 Q68,30 70,34" stroke="#a07020" strokeWidth="1.5" fill="none" opacity="0.5"/>

        {/* Neck */}
        <Path
          d="M102,52 Q108,42 114,32 Q118,24 116,20 Q112,18 108,22 Q106,30 102,42 Q100,48 98,54Z"
          fill="#d4a030"
        />
        {/* Neck shadow side */}
        <Path d="M108,26 Q112,24 116,22" stroke="#a07010" strokeWidth="1.5" fill="none" opacity="0.4"/>

        {/* Head */}
        <Ellipse cx="113" cy="18" rx="11" ry="9" fill="#d8a838"/>
        {/* Head top fur bump */}
        <Path d="M108,10 Q112,6 116,10" stroke="#c49030" strokeWidth="2" fill="none" strokeLinecap="round"/>

        {/* Snout / muzzle — distinctive camel look */}
        <Path d="M120,20 Q126,22 125,26 Q123,29 119,27 Q117,25 118,22Z" fill="#c49030"/>
        {/* Upper lip split */}
        <Path d="M122,26 Q122,29 120,30 Q119,29 119,27" fill="#a07020"/>
        {/* Nostril */}
        <Ellipse cx="123" cy="24" rx="1.5" ry="1" fill="#7a5010" transform="rotate(-15 123 24)"/>

        {/* Eye — large, expressive */}
        <Ellipse cx="116" cy="14" rx="2.5" ry="2.5" fill="#2a1500"/>
        <Circle cx="117" cy="13.2" r="0.8" fill="rgba(255,255,255,0.6)"/>
        {/* Eyelash */}
        <Path d="M114,12 Q115,10 117,11" stroke="#2a1500" strokeWidth="0.8" fill="none" strokeLinecap="round"/>

        {/* Ear */}
        <Path d="M108,10 Q109,5 113,8 Q111,12 108,10Z" fill="#c49030"/>
        <Path d="M109,9 Q110,6 112,8" fill="#f0c050" opacity="0.5"/>

        {/* Fur texture lines on body */}
        <Path d="M55,42 Q60,40 65,42" stroke="#c49030" strokeWidth="1" fill="none" opacity="0.4"/>
        <Path d="M72,34 Q78,32 84,34" stroke="#c49030" strokeWidth="1" fill="none" opacity="0.4"/>

        {/* Tail */}
        <Path d="M32,62 Q24,60 20,65 Q22,68 28,66 Q30,64 32,62" fill="#c49030"/>
        <Path d="M20,65 Q16,68 18,72 Q21,70 20,65" fill="#7a5010"/>

      </AnimatedG>

      {/* ── NEAR-SIDE LEGS (drawn last = in front of body) ── */}

      {/* Near back leg */}
      <AnimatedG style={{ transform: legTransform(BR.x, BR.y, b) }}>
        <Path d={`M${BR.x},${BR.y} Q${BR.x-3},${BR.y+18} ${BR.x-2},${BR.y+36}`} stroke={LEG_COLOR_FRONT} strokeWidth="6" strokeLinecap="round" fill="none"/>
        <Ellipse cx={BR.x-2} cy={BR.y+37} rx="4.5" ry="2.5" fill={HOOF}/>
      </AnimatedG>

      {/* Near front leg */}
      <AnimatedG style={{ transform: legTransform(FR.x, FR.y, a) }}>
        <Path d={`M${FR.x},${FR.y} Q${FR.x+3},${FR.y+18} ${FR.x+2},${FR.y+36}`} stroke={LEG_COLOR_FRONT} strokeWidth="6" strokeLinecap="round" fill="none"/>
        <Ellipse cx={FR.x+2} cy={FR.y+37} rx="4.5" ry="2.5" fill={HOOF}/>
      </AnimatedG>

    </Svg>
  )
}
