# Aboutme — Interactive 3D Résumé

An experimental interactive résumé and portfolio built with React, TypeScript, Vite and Three.js. A 3D character model sits behind the page content while the résumé and project details are revealed as the visitor scrolls.

**Current combined portfolio:** [Personal-website](https://github.com/yo5on/Personal-website) brings this 3D chapter together with the editorial portfolio, selected projects and certificates.

**Standalone GitHub Pages deployment:** [yo5on.github.io/Aboutme](https://yo5on.github.io/Aboutme/)

## Features

- Interactive 3D scene rendered with Three.js and React Three Fiber.
- Scroll-driven presentation using Framer Motion.
- Résumé, project write-ups and social links.
- Eye tracking and face details for the 3D model.
- Reduced-motion handling and a fallback message if the model cannot load.
- GitHub Actions deployment to GitHub Pages when changes are pushed to `master`.

## Tech Stack

- React 18 and TypeScript
- Vite
- Three.js, React Three Fiber, Drei and postprocessing
- Framer Motion
- Zustand for shared state

## Run Locally

Requires Node.js 22 (the deployment workflow uses Node.js 22).

```bash
git clone https://github.com/yo5on/Aboutme.git
cd Aboutme
npm ci
npm run dev
```

Vite prints the local development URL in the terminal.

## Checks and Production Build

```bash
npm run lint
npm run typecheck
npm run build
npm run preview
```

The production build is written to `dist/`. The deployment workflow builds the project and publishes that directory to GitHub Pages.

## Project Structure

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

## Model and Licensing Notes

The 3D model `me.glb` and personal portfolio content are project assets. The file `LICENSE-sen-3d-resume` relates to the upstream `sen-3d-resume` source used as a starting point; it should not be treated as a blanket licence for the personal model, artwork or résumé content.

## Author

**Yoson** · [GitHub](https://github.com/yo5on) · [LinkedIn](https://www.linkedin.com/in/yo5on)
