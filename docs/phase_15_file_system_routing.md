# Phase 15: File-System Routing

## Objective
Implement a file-system-based routing engine for **fullstack.js**, mimicking the Next.js `pages/` directory behavior.

## Architecture
Developers should not have to manually define route paths. Instead, the physical directory structure of the application should dictate the URL routes.

## Implementation Details
1. **Directory Scanning**: Create a module (`src/framework/router.ts`) that recursively scans a `src/pages/` directory.
2. **Route Manifest Generation**: 
   - Map files like `src/pages/index.tsx` to the route `/`.
   - Map files like `src/pages/about.tsx` to the route `/about`.
   - Support dynamic route parameters (e.g., `src/pages/blog/[id].tsx` mapped to `/blog/:id`).
3. **Universal Router**: Build a React `<Router>` component that reads the current URL (either from the server request or the browser's `window.location`) and renders the corresponding page component from the manifest.
