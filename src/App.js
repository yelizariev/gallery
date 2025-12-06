import * as THREE from 'three'
import { useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Image, ScrollControls, Scroll, useScroll } from '@react-three/drei'
import { proxy, useSnapshot } from 'valtio'
import { easing } from 'maath'

const material = new THREE.LineBasicMaterial({ color: 'white' })
const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -0.5, 0), new THREE.Vector3(0, 0.5, 0)])
const state = proxy({
  clicked: null,
    urls: window.APP_CONFIG.Girls,
})

function Minimap() {
  const ref = useRef()
  const scroll = useScroll()
  const { urls } = useSnapshot(state)
  const { height } = useThree((state) => state.viewport)
  useFrame((state, delta) => {
    ref.current.children.forEach((child, index) => {
      // Give me a value between 0 and 1
      //   starting at the position of my item
      //   ranging across 4 / total length
      //   make it a sine, so the value goes from 0 to 1 to 0.
      const y = scroll.curve(index / urls.length - 1.5 / urls.length, 4 / urls.length)
      easing.damp(child.scale, 'y', 0.15 + y / 6, 0.15, delta)
    })
  })
  return (
    <group ref={ref}>
      {urls.map((_, i) => (
        <line key={i} geometry={geometry} material={material} position={[i * 0.06 - urls.length * 0.03, -height / 2 + 0.6, 0]} />
      ))}
    </group>
  )
}

function Item({ index, position, scale, c = new THREE.Color(), ...props }) {
  const ref = useRef()
  const scroll = useScroll()
  const { clicked, urls } = useSnapshot(state)
  const [hovered, hover] = useState(false)
  const click = () => (state.clicked = index === clicked ? null : index)
  const over = () => hover(true)
  const out = () => hover(false)
  useFrame((state, delta) => {
    const y = scroll.curve(index / urls.length - 1.5 / urls.length, 4 / urls.length)
    easing.damp3(ref.current.scale, [clicked === index ? 4.7 : scale[0], clicked === index ? 5 : 4 + y, 1], 0.15, delta)
    ref.current.material.scale[0] = ref.current.scale.x
    ref.current.material.scale[1] = ref.current.scale.y
    if (clicked !== null && index < clicked) easing.damp(ref.current.position, 'x', position[0] - 2, 0.15, delta)
    if (clicked !== null && index > clicked) easing.damp(ref.current.position, 'x', position[0] + 2, 0.15, delta)
    if (clicked === null || clicked === index) easing.damp(ref.current.position, 'x', position[0], 0.15, delta)
    easing.damp(ref.current.material, 'grayscale', hovered || clicked === index ? 0 : Math.max(0, 1 - y), 0.15, delta)
    easing.dampC(ref.current.material.color, hovered || clicked === index ? 'white' : '#aaa', hovered ? 0.3 : 0.15, delta)
  })
  return <Image ref={ref} {...props} position={position} scale={scale} onClick={click} onPointerOver={over} onPointerOut={out} />
}

function Items({ w = 0.7, gap = 0.15 }) {
  const { urls } = useSnapshot(state)
  const { width } = useThree((state) => state.viewport)
  const xW = w + gap
  return (
    <ScrollControls horizontal damping={0.1} pages={(width - xW + urls.length * xW) / width}>
      <Minimap />
      <Scroll>
        {urls.map((url, i) => <Item key={i} index={i} position={[i * xW, 0, 0]} scale={[w, 4, 1]} url={url} />) /* prettier-ignore */}
      </Scroll>
    </ScrollControls>
  )
}

export default function App(){
  // 音频播放系统（随机起始位置 + 顺序播放）
  // ✨ Système audio (position aléatoire + lecture séquentielle)
  useEffect(() => {
    function createJukebox(audioId, sourceId, tracks, options = {}) {
      const audio = document.getElementById(audioId)
      const source = document.getElementById(sourceId)
      if (!audio || !source || !tracks || !tracks.length) return

      let index = Math.floor(Math.random() * tracks.length)

      // 切换并播放下一首
      // ✨ Charger et jouer la piste suivante
      function playTrack() {
        source.src = tracks[index]
        audio.load()

        // 加载元数据后跳到随机时间点（仅 DiskD）
        // ✨ Sauter à un moment aléatoire après le chargement des métadonnées (DiskD uniquement)
        if (options.randomStart) {
          const setRandomStart = () => {
            audio.removeEventListener('loadedmetadata', setRandomStart)
            const duration = audio.duration
            const len = isFinite(duration) ? duration : 3600
            audio.currentTime = Math.random() * len
          }
          audio.addEventListener('loadedmetadata', setRandomStart)
        }

        // 自动播放被阻止时，通过第一次点击来解锁
        // ✨ Débloquer l'autoplay via le premier clic utilisateur si nécessaire
        audio.play().catch(() => {
          const unlock = () => {
            audio.play()
            document.removeEventListener('click', unlock)
          }
          document.addEventListener('click', unlock)
        })
      }

      // 音频结束后自动播放下一首
      // ✨ Lecture automatique de la piste suivante à la fin de l’audio
      audio.addEventListener('ended', () => {
        index = (index + 1) % tracks.length
        playTrack()
      })

      // 用户第一次点击时开始播放
      // ✨ Démarre la lecture lors du premier clic utilisateur
      const init = () => {
        playTrack()
        document.removeEventListener('click', init)
      }
      document.addEventListener('click', init)
    }

    const cfg = window.APP_CONFIG
    if (!cfg) return

    // DiskC：正常播放
    // ✨ DiskC : lecture normale
    createJukebox('DiskC', 'DiskCSource', cfg.DiskC, { randomStart: false })

    // DiskD：随机起始位置
    // ✨ DiskD : démarrage à un moment aléatoire
    createJukebox('DiskD', 'DiskDSource', cfg.DiskD, { randomStart: true })
  }, [])


    return (
  <>
  <Canvas gl={{ antialias: false }} dpr={[1, 1.5]} onPointerMissed={() => (state.clicked = null)}>
    <Items />
  </Canvas>

      <audio id="DiskC" autoPlay crossOrigin="anonymous" style={{ display: 'none' }}>
        <source id="DiskCSource" type="audio/mpeg" />
      </audio>

      <audio id="DiskD" autoPlay crossOrigin="anonymous" style={{ display: 'none' }}>
        <source id="DiskDSource" type="audio/mpeg" />
      </audio>
   </>
    )
}
