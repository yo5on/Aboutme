import { Component, Suspense, useRef, type ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { MotionConfig, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import * as THREE from 'three'
import Scene from './scene/Scene'
import NoiseOverlay from './ui/NoiseOverlay'
import Resume from './ui/Resume'
import Works from './ui/Works'
import { HAS_WEBGL, useStore } from './store'
import { GithubIcon, LinkedinIcon, MailIcon } from './ui/SocialIcons'

// About copy
const COPY = {
  title: 'About Yoson',
  paragraphs: [
    "I'm Yoson — a Computer Science student at Christ University, Bangalore, specializing in AI & machine learning. I build where software meets hardware: agentic AI tools, ESP32 robots that track lines and pick things up, and games you can play in a browser. Small, sharp tools over big, vague ideas.",
  ],
}

// Catches a failed me.glb load so the page still works and says what happened
class ModelErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error('Failed to load me.glb:', error)
    this.props.onError()
  }
  render() {
    return this.state.error ? null : this.props.children
  }
}

// Render resolution: full (≤1.5×) on GPUs that keep up; weaker ones step down to 1×, which measured
// about 2× faster on an Intel UHD 620. Below 1× gained little, the fixed-size DoF pass dominates there.
const MAX_DPR = Math.min(Math.max(window.devicePixelRatio, 1), 1.5)
function AdaptiveResolution() {
  const setDpr = useThree((s) => s.setDpr)
  return (
    <PerformanceMonitor
      flipflops={3}
      onDecline={() => setDpr(1)}
      onIncline={() => setDpr(MAX_DPR)}
      onFallback={() => setDpr(1)}
    />
  )
}

function Hero({ cueOpacity }: { cueOpacity: MotionValue<number> }) {
  const { title, paragraphs } = COPY
  const aboutRef = useRef(null)
  // 触发起点提前：about 顶部位于视口 60% 处即开始（offset[0] 进度 0），到达顶部为进度 1
  const { scrollYProgress } = useScroll({
    target: aboutRef,
    offset: ['start 0.6', 'start start'],
  })
  // 透明度在 about 顶部升到约 30vh 时归 0：起点 60%→进度 p 时顶部在 0.6×(1−p)，
  // 令 =0.3 解得 p=0.5，故 opacity 区间 [0, 0.5]
  const blur = useTransform(scrollYProgress, [0, 0.5], ['blur(0px)', 'blur(16px)'])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  // 视差：标题上升更快、字距随滚动拉开；正文上升慢一点
  const titleY = useTransform(scrollYProgress, [0, 1], [0, -96])
  const bodyY = useTransform(scrollYProgress, [0, 1], [0, -52])
  const titleSpacing = useTransform(scrollYProgress, [0, 1], ['0.01em', '0.42em'])
  // Reduced motion: keep the fade-out, drop the blur, parallax and letter-spacing sweep
  const reduce = useReducedMotion()
  return (
    <section className="hero">
      <motion.div
        className="about"
        lang="en"
        ref={aboutRef}
        style={reduce ? { opacity } : { filter: blur, opacity }}
      >
        {/* 入场动画放内层，避免其 fill 锁住 opacity 覆盖外层滚动 opacity */}
        <div className="about-intro">
          <motion.h1 className="about-title" style={reduce ? undefined : { y: titleY, letterSpacing: titleSpacing }}>
            {title}
          </motion.h1>
          {paragraphs.map((p, i) => (
            <motion.p key={i} className="about-body" style={reduce ? undefined : { y: bodyY }}>
              {p}
            </motion.p>
          ))}
        </div>
      </motion.div>
      <motion.div className="scroll-cue" style={{ opacity: cueOpacity }} aria-hidden="true">
        <span className="scroll-cue-label">Scroll</span>
        <span className="scroll-cue-track">
          <span className="scroll-cue-dot" />
        </span>
      </motion.div>
    </section>
  )
}

export default function App() {
  const modelError = useStore((s) => s.modelError)
  const ready = useStore((s) => s.ready)
  const setModelError = useStore((s) => s.setModelError)
  const { scrollY } = useScroll()
  // 作品区蒙层：以作品区顶部从视口底进入到视口中部的进度，驱动 3D 渐暗 + 模糊
  const worksRef = useRef(null)
  const { scrollYProgress: worksProgress } = useScroll({
    target: worksRef,
    offset: ['start end', 'start center'],
  })
  const fogBg = useTransform(
    worksProgress,
    [0, 1],
    ['rgba(8, 11, 18, 0)', 'rgba(8, 11, 18, 0.41)'] // 压暗减半（原 0.82）
  )
  // 滚动渐暗：离开首屏后压暗 3D 场景，保证履历文字可读
  const scrimOpacity = useTransform(scrollY, [0, 520], [0, 0.4])
  // 首屏滚动提示随之淡出
  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0])
  // 首屏底部渐变底色：开始滑动后淡出
  const heroGradientOpacity = useTransform(scrollY, [0, 240], [1, 0])
  // 磨砂右轨：进入履历区后淡入（首屏不磨砂）
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const railOpacity = useTransform(scrollY, [vh * 0.5, vh * 1.1], [0, 1])

  return (
    <MotionConfig reducedMotion="user">
      {/* 固定的 3D 背景（模型挂载后淡入，文字首帧即可读） */}
      {!HAS_WEBGL && <div className="scene-bg scene-fallback" aria-hidden="true" />}
      {HAS_WEBGL && (
        <div className={`scene-bg scene-fade${ready ? ' is-ready' : ''}`}>
          <Canvas
            shadows={{ type: THREE.PCFShadowMap }}
            dpr={MAX_DPR}
            camera={{ position: [0, 1.08, 7.2], fov: 22.9, near: 0.1, far: 500 }}
            gl={{
              antialias: false,
              stencil: false,
              depth: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              powerPreference: 'high-performance', // the noise canvas already asks for it; keep both on one GPU
            }}
          >
            <color attach="background" args={['#0a0e16']} />
            <AdaptiveResolution />
            <ModelErrorBoundary onError={setModelError}>
              <Suspense fallback={null}>
                <Scene />
              </Suspense>
            </ModelErrorBoundary>
          </Canvas>
        </div>
      )}

      {/* 滚动渐暗蒙层 */}
      <motion.div className="scrim" style={{ opacity: scrimOpacity }} aria-hidden="true" />

      {/* 作品区固定蒙层：随滚动压暗 3D */}
      <motion.div
        className="stage-fog"
        style={{ background: fogBg }}
        aria-hidden="true"
      />

      {/* 固定磨砂右轨（进入履历区淡入） */}
      <motion.div className="glass-rail" style={{ opacity: railOpacity }} aria-hidden="true" />

      {/* 首屏底部渐变底色（衬托首屏文字），滚动后淡出 */}
      <motion.div className="hero-gradient" style={{ opacity: heroGradientOpacity }} aria-hidden="true" />

      {modelError && (
        <p className="model-error" role="alert">
          The 3D portrait can't be shown in this browser, but everything else on the page still works.
        </p>
      )}

      {/* Profile links (top right, like the live reference's GitHub button) */}
      <nav className="top-links" aria-label="Profiles">
        <a href="https://github.com/yo5on" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
          <GithubIcon />
        </a>
        <a
          href="https://www.linkedin.com/in/yo5on"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          title="LinkedIn"
        >
          <LinkedinIcon />
        </a>
        <a href="mailto:yo5on2025@gmail.com" aria-label="Email yo5on2025@gmail.com" title="Email">
          <MailIcon />
        </a>
      </nav>

      {/* 全屏胶片噪点蒙层（multiply 混合） */}
      {HAS_WEBGL && <NoiseOverlay />}

      {/* 可滚动内容 */}
      <main className="content">
        <Hero cueOpacity={cueOpacity} />
        <Resume />
        <Works innerRef={worksRef} />
      </main>
    </MotionConfig>
  )
}
