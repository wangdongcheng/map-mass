# Map Mass

An interactive 2.5D map of Malta built with Vite, vanilla JavaScript, MapLibre GL JS, and OpenFreeMap vector tiles.

## Local development

Requirements:

- Node.js 20.19 or newer
- npm

Install dependencies and start the development server:

    npm install
    npm run dev

Create a production build:

    npm run build

The generated static site is written to dist/.

## Cloudflare Pages

Use the following build settings:

- Build command: npm run build
- Build output directory: dist

No API key is required for the current OpenFreeMap-based prototype.
