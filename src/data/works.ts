// 作品集数据（双语）。5 大板块 → 点击展开作品详情。
// 纯数据驱动：增删板块 / 作品只改本文件，Works.jsx 仅负责渲染。
//
// 板块字段：
//   id        唯一标识（用于 framer layoutId 共享元素动画）
//   no        编号 '01'…'05'
//   title     板块标题
//   tagline   索引行右侧一句话
//   items[]   扁平作品列表：{ name, meta?, tags?, link? }
//             点击 item 弹出全屏详情，可补充可选媒体/文案字段：
//             { image?, video?, year?, desc? }（缺省时媒体用占位、简介回退 meta/标签）
//   groups[]  分组作品（与 items 二选一）：{ heading, items: string[] }
//   awards[]  奖项 chip（可选）
//   footer    底部技术/备注一行（可选）

export interface WorkListItem {
  name: string
  meta?: string
  tags?: string[]
  link?: string
  slug?: string
}

export interface WorkGroup {
  heading: string
  items: string[]
}

export interface WorkSection {
  id: string
  no: string
  title: string
  tagline: string
  items?: WorkListItem[]
  groups?: WorkGroup[]
  awards?: string[]
  footer?: string
}

export interface WorksLang {
  title: string
  closeLabel: string
  openLabel: string
  hint: string
  awardsLabel: string
  visitLabel: string
  detailPlaceholder: string
  phImageLabel: string
  phButtonLabel: string
  countLabel: (n: number) => string
  sections: WorkSection[]
}

// Portfolio data. Works.tsx only renders it; each item's slug links to src/content/works/<slug>.md.
// Descriptions come from the project READMEs on github.com/yo5on.

const RAW = 'https://raw.githubusercontent.com/yo5on'

export const WORKS: WorksLang = {
  title: 'Works',
  closeLabel: 'Back',
  openLabel: 'Explore',
  hint: 'Keep scrolling',
  awardsLabel: 'Awards',
  visitLabel: 'Open project',
  detailPlaceholder: 'Details coming soon.',
  phImageLabel: 'Image / Video',
  phButtonLabel: 'Link button',
  countLabel: (n) => `${n} works`,
  sections: [
    {
      id: 'ai',
      no: '01',
      title: 'AI & ML',
      tagline: 'Python · FastAPI · Gemini · agentic workflows',
      items: [
        { name: 'FakeGuard — account risk analyzer', meta: 'Hackathon', tags: ['Tech Utsav'], slug: 'fakeguard' },
        { name: 'Agentic AI Pest Monitoring', meta: 'Team project', tags: ['Agriculture'], slug: 'pest-monitoring' },
        { name: 'AI Personal Tutor', meta: 'Next.js · Gemini', slug: 'ai-tutor' },
      ],
      footer: 'Explainable scoring · agent workflows · LLM tutoring',
    },
    {
      id: 'robotics',
      no: '02',
      title: 'Robotics',
      tagline: 'ESP32 · Arduino · C / C++',
      items: [
        { name: 'High-speed PID line follower', meta: 'PID', slug: 'line-follower' },
        { name: '4-DOF robotic arm', meta: 'RC control', slug: 'robotic-arm' },
        { name: 'Gesture-controlled RC car', meta: 'ESP-NOW', slug: 'gesture-car' },
        { name: 'Sparky — OLED companion', meta: 'Embedded animation', slug: 'sparky' },
      ],
      footer: 'PID control · servo control · wireless links · motion sensing',
    },
    {
      id: 'games',
      no: '03',
      title: 'Games',
      tagline: 'Unity · C#',
      items: [{ name: 'Maze Runner', meta: 'Play in browser', tags: ['2D platformer'], slug: 'maze-runner' }],
    },
    {
      id: 'web',
      no: '04',
      title: 'Web',
      tagline: 'React · TypeScript · three.js',
      items: [
        { name: 'Daymark — personalised study planner', meta: 'Live app', slug: 'daymark' },
        { name: 'Editorial portfolio', meta: 'React · Motion', slug: 'portfolio' },
        { name: 'This 3D résumé', meta: 'React Three Fiber', slug: 'about-3d' },
      ],
    },
  ],
}

// Section cover images (real project photos / screenshots from the repos).
// A cover that fails to load falls back to the numbered placeholder.
export const SECTION_COVERS: Record<string, string> = {
  ai: `${RAW}/ai-personal-tutor/main/images/dashboard.png`,
  robotics: `${RAW}/line-follower/main/images/pic1.jpeg`,
  games: `${RAW}/maze-runner/main/pics/09_level_scene.png`,
  web: `${RAW}/Personalised-study-planner/main/docs/screenshots/dashboard.png`,
}

// Number of works in a section (items or groups summed)
export function sectionCount(section: WorkSection): number {
  if (section.items) return section.items.length
  if (section.groups) return section.groups.reduce((n, g) => n + g.items.length, 0)
  return 0
}
