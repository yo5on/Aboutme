import { motion } from 'framer-motion'
import { SOCIAL_ICONS } from './SocialIcons'
import { FOCUS_POINTS } from '../data/focusPoints'

const SOCIAL_LINKS = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/yo5on' },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/yo5on' },
  { id: 'mail', label: 'Email', href: 'mailto:yo5on2025@gmail.com' },
]

interface ResumeGroup {
  heading?: string
  logoImg?: string
  sub?: string
  link?: string
  items?: string[]
  links?: { id: string; label: string; href: string }[]
}
interface ResumeEntry {
  period: string
  place: string
  role?: string
  logo?: { src: string; alt: string }
  points?: string[]
  groups?: ResumeGroup[]
}
// Timeline: one entry per camera stop (count must equal FOCUS_POINTS.length).
// Facts come from the project READMEs on github.com/yo5on.
const RESUME: { title: string; entries: ResumeEntry[] } = {
  title: 'Résumé',
  entries: [
    {
      period: 'Education',
      place: 'Christ University · Bangalore',
      role: 'Computer Science & Engineering — AI & ML specialization',
      points: ['Stack: C · C++ · Java · Python · HTML / CSS · ESP32 · Arduino'],
    },
    {
      period: 'Hackathon · Tech Utsav',
      place: 'FakeGuard',
      role: 'Social media account risk analyzer',
      points: [
        'Explainable 0–100 risk score with LOW → CRITICAL categories and reason codes',
        'FastAPI + SQLAlchemy backend, React + TypeScript dashboard, CSV batch import',
        'Decision support for human reviewers, built on synthetic data',
      ],
    },
    {
      period: 'Academic team project',
      place: 'Agentic AI Pest Monitoring',
      role: 'AI framework for sustainable agriculture',
      points: [
        'Agent workflow: field data → AI / ML analysis → recommendations',
        'Web dashboard for crop, field and pest insights',
        'Modular design for future IoT sensors and image-based detection',
      ],
    },
    {
      period: 'Robotics & embedded',
      place: 'ESP32 builds',
      points: [
        'High-speed PID line follower — 8-array IR sensor, TB6612FNG driver',
        '4-DOF robotic arm driven wirelessly from a FlySky RC transmitter',
        'Gesture-controlled RC car — MPU6050 tilt sent over ESP-NOW',
        'Sparky — an OLED companion with moods, 40 expressions and a sleep cycle',
      ],
    },
    {
      period: 'Games & the web',
      place: 'Play, build, ship',
      groups: [
        {
          heading: 'Maze Runner',
          sub: 'Unity 2D platformer',
          link: 'https://yo5on.github.io/maze-runner/',
          items: ['Three levels, six playable characters, goblin AI and a boss — runs in the browser'],
        },
        {
          heading: 'Say hi',
          sub: 'GitHub · LinkedIn · email',
          links: SOCIAL_LINKS,
        },
      ],
    },
  ],
}

// Entries map, in order, to the camera stops (see data/focusPoints.ts).
const POINT_ORDER = FOCUS_POINTS

const EASE = [0.22, 1, 0.36, 1]
const containerV = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
}
const itemV = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EASE } },
}

function Group({ group }: { group: ResumeGroup }) {
  const heading = group.link ? (
    <a className="about-link" href={group.link} target="_blank" rel="noopener noreferrer">
      {group.heading}
    </a>
  ) : (
    <span>{group.heading}</span>
  )

  return (
    <motion.div className="tl-group" variants={itemV}>
      <div className="tl-group-head">
        {group.logoImg && (
          <span className="tl-group-logo">
            <img src={group.logoImg} alt={group.heading || ''} loading="lazy" />
          </span>
        )}
        {heading}
        {group.sub && <span className="tl-group-sub">{group.sub}</span>}
      </div>
      {group.items && (
        <ul className="tl-points">
          {group.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      )}
      {group.links && (
        <div className="tl-logos">
          {group.links.map((l) => {
            const Icon = SOCIAL_ICONS[l.id as keyof typeof SOCIAL_ICONS]
            return (
              <a
                key={l.id}
                className="tl-logo"
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.label}
                title={l.label}
              >
                <Icon />
              </a>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}

function Entry({ entry, index }: { entry: ResumeEntry; index: number }) {
  return (
    <motion.div
      className="tl-entry"
      data-point={POINT_ORDER[index]}
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
    >
      <motion.span className="tl-dot" variants={itemV} aria-hidden="true" />
      {/* tl-body 包住文字内容（点保持在外做时间轴标记）：移动端可给它加卡片衬底，
          且它紧贴内容高度，不含 tl-entry 用于排布的大 padding。
          用普通 div（非 motion）：framer 变体经 React context 穿透它，叶子元素仍是
          tl-entry 的直接 stagger 子级，入场动画与包裹前完全一致。 */}
      <div className="tl-body">
        <motion.div className="tl-period" variants={itemV}>
          {entry.period}
        </motion.div>
        <motion.div className="tl-head" variants={itemV}>
          {entry.logo && (
            <span className="tl-logo-chip">
              <img src={entry.logo.src} alt={entry.logo.alt} loading="lazy" />
            </span>
          )}
          <h3 className="tl-place">{entry.place}</h3>
        </motion.div>
        {entry.role && (
          <motion.div className="tl-role" variants={itemV}>
            {entry.role}
          </motion.div>
        )}
        {entry.points && (
          <motion.ul className="tl-points" variants={itemV}>
            {entry.points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </motion.ul>
        )}
        {entry.groups && entry.groups.map((g, i) => <Group key={i} group={g} />)}
      </div>
    </motion.div>
  )
}

export default function Resume() {
  const data = RESUME
  return (
    <section className="resume" lang="en">
      <motion.h2
        className="resume-title"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {data.title}
      </motion.h2>
      <div className="timeline">
        {data.entries.map((e, i) => (
          <Entry key={i} entry={e} index={i} />
        ))}
      </div>
    </section>
  )
}
