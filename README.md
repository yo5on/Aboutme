<div align="center">

<samp><b>YO5ON · ABOUTME</b></samp>

<samp>react · typescript · three.js · interactive résumé</samp>

</div>

---

<div align="center"><samp>An interactive 3D résumé that combines a character scene, project stories and personal links in a scroll-led experience.</samp></div>

<div align="center">

**[Open Live Project](https://yo5on.github.io/Aboutme/)** · [Source Code](https://github.com/yo5on/Aboutme)

</div>

<div align="center"><sub>Part of the wider portfolio work: [Personal-website](https://github.com/yo5on/Personal-website).</sub></div>


<h2 align="center"><samp><b>Features</b></samp></h2>

- Interactive 3D scene rendered with Three.js and React Three Fiber.
- Scroll-driven presentation using Framer Motion.
- Résumé, project write-ups and social links.
- Eye tracking and face details for the 3D model.
- Reduced-motion handling and a fallback message if the model cannot load.
- GitHub Actions deployment to GitHub Pages when changes are pushed to `master`.

<h2 align="center"><samp><b>Tech Stack</b></samp></h2>

- React 18 and TypeScript
- Vite
- Three.js, React Three Fiber, Drei and postprocessing
- Framer Motion
- Zustand for shared state

<h2 align="center"><samp><b>Run Locally</b></samp></h2>

Requires Node.js 22 (the deployment workflow uses Node.js 22).

```bash
git clone https://github.com/yo5on/Aboutme.git
cd Aboutme
npm ci
npm run dev
```

Vite prints the local development URL in the terminal.

<h2 align="center"><samp><b>Checks and Production Build</b></samp></h2>

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

The production build is written to `dist/`. The deployment workflow builds the project and publishes that directory to GitHub Pages.

<h2 align="center"><samp><b>Project Structure</b></samp></h2>

```text
Aboutme/
├── me.glb                    # 3D character model
├── public/
│   ├── draco/                # Draco decoder assets
│   ├── favicon.svg
│   └── works/covers/         # Project cover images
├── src/
│   ├── App.tsx               # Page and 3D scene composition
│   ├── scene/                # Three.js scene, eye tracking and face details
│   ├── ui/                   # Résumé, project views and social icons
│   ├── content/works/        # Project case-study copy
│   ├── data/                 # Project and focus-point data
│   ├── store.ts
│   └── styles.css
├── package.json
└── vite.config.ts
```

<h2 align="center"><samp><b>Model and Licensing Notes</b></samp></h2>

The 3D model `me.glb` and personal portfolio content are project assets. The file `LICENSE-sen-3d-resume` relates to the upstream `sen-3d-resume` source used as a starting point; it should not be treated as a blanket licence for the personal model, artwork or résumé content.

<h2 align="center"><samp><b>Author</b></samp></h2>

**Yoson** · [GitHub](https://github.com/yo5on) · [LinkedIn](https://www.linkedin.com/in/yo5on)
