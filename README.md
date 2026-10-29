<div align="center">

<samp><b>YO5ON · ABOUTME</b></samp>

<samp>react · typescript · three.js · interactive résumé</samp>

</div>

---

<div align="center"><samp>An interactive 3D résumé that combines a character scene, project stories and personal links in a scroll-led experience.</samp></div>

<div align="center">

<samp>**[Open Live Project](https://yo5on.github.io/Aboutme/)** · [Source Code](https://github.com/yo5on/Aboutme)</samp>

</div>

<div align="center"><sub>Part of the wider portfolio work: [Personal-website](https://github.com/yo5on/Personal-website).</sub></div>


<h2 align="center"><samp><b>Features</b></samp></h2>

- <samp>Interactive 3D scene rendered with Three.js and React Three Fiber.</samp>
- <samp>Scroll-driven presentation using Framer Motion.</samp>
- <samp>Résumé, project write-ups and social links.</samp>
- <samp>Eye tracking and face details for the 3D model.</samp>
- <samp>Reduced-motion handling and a fallback message if the model cannot load.</samp>
- <samp>GitHub Actions deployment to GitHub Pages when changes are pushed to `master`.</samp>

<h2 align="center"><samp><b>Tech Stack</b></samp></h2>

- <samp>React 18 and TypeScript</samp>
- <samp>Vite</samp>
- <samp>Three.js, React Three Fiber, Drei and postprocessing</samp>
- <samp>Framer Motion</samp>
- <samp>Zustand for shared state</samp>

<h2 align="center"><samp><b>Run Locally</b></samp></h2>

<samp>Requires Node.js 22 (the deployment workflow uses Node.js 22).</samp>

```bash
git clone https://github.com/yo5on/Aboutme.git
cd Aboutme
npm ci
npm run dev
```

<samp>Vite prints the local development URL in the terminal.</samp>

<h2 align="center"><samp><b>Checks and Production Build</b></samp></h2>

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

<samp>The production build is written to `dist/`. The deployment workflow builds the project and publishes that directory to GitHub Pages.</samp>

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

<samp>The 3D model `me.glb` and personal portfolio content are project assets. The file `LICENSE-sen-3d-resume` relates to the upstream `sen-3d-resume` source used as a starting point; it should not be treated as a blanket licence for the personal model, artwork or résumé content.</samp>

<div align="center">

---

<samp><strong>Yoson</strong> · software, AI/ML and interactive projects</samp>

<samp><a href="https://github.com/yo5on">github.com/yo5on</a> · <a href="https://www.linkedin.com/in/yo5on">LinkedIn</a></samp>

</div>

---

<div align="center"><samp><b>License</b></samp></div>

<samp>This project's original code is licensed under the MIT License. See [LICENSE](LICENSE) for details. Third-party assets and dependencies remain under their respective licenses.</samp>
