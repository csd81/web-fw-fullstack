# Phase 14: Build System (Dual-Bundle Compilation)

## Objective
Establish the build infrastructure for **fullstack.js**, creating a dual-bundle compilation pipeline that outputs code for both the Node.js/Bun server environment and the Browser client environment.

## Architecture
To build a meta-framework, we must compile our React code twice because the execution environments have different requirements:
1. **Server Bundle**: Needs to execute Node/Bun APIs, read the file system, and run `renderToString`.
2. **Client Bundle**: Needs to be lightweight, run in the browser, and execute `hydrateRoot`.

## Implementation Details
1. **Bundler Selection**: Use `Bun.build` (since we are already in a Bun environment) to programmatically bundle our source files.
2. **Client Entrypoint**: Create a universal client entry script (`src/framework/client.ts`) that automatically mounts and hydrates the React tree on the browser.
3. **Build Script**: Write a build script (`scripts/build.ts`) that:
   - Clears the `.fullstack/` build directory.
   - Bundles the framework core and user pages into browser-compatible assets.
   - Outputs the bundled assets into a public directory to be served statically.
