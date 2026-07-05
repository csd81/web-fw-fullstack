# fullstack.js 🚀

**fullstack.js** is a modern, high-performance meta-framework built entirely from scratch, inspired by the architecture of Next.js and powered by Bun. 

What started as an educational journey to build a custom React clone has evolved into a full-stack framework ecosystem. The core engine is a bespoke Virtual DOM implementation with a modern Fiber reconciler, comprehensive Hook support, and Server-Side Rendering (SSR) capabilities.

## 🌟 Core Engine Features (Completed)
The underlying view engine (our "React Clone") was built phase-by-phase and currently supports:

- **Fiber Architecture**: Concurrent mode and interruptible rendering using `requestIdleCallback`.
- **Function Components**: Full support for functional components.
- **State & Lifecycle Hooks**: `useState`, `useEffect`, `useLayoutEffect`, `useReducer`, `useMemo`, `useCallback`, `useRef`.
- **Advanced Hooks**: `useTransition` and `useDeferredValue` for concurrent UI updates.
- **Context API**: `createContext` and `useContext` for prop-drilling evasion.
- **Error Boundaries**: Resilient error catching within the component tree.
- **Portals & Fragments**: Flexible DOM rendering and logical grouping.
- **Server-Side Rendering**: `renderToString` with context preservation.
- **True DOM Hydration**: Intelligent, non-destructive attachment of event listeners to server-rendered HTML.
- **Advanced Capabilities**: `forwardRef`, `useImperativeHandle`, and Synthetic Event Normalization.

## 🛣️ Meta-Framework Roadmap (In Progress)
We are currently evolving the core engine into **fullstack.js**, a complete meta-framework. The upcoming phases include:

- [ ] **Phase 14: Build System**: Dual-bundle compilation (Server & Client) using `Bun.build`.
- [ ] **Phase 15: File-System Routing**: Automatic route manifest generation via `src/pages/` directory scanning.
- [ ] **Phase 16: Dev Server & SSR Pipeline**: An integrated Bun HTTP server managing the request lifecycle, SSR, and client bundle injection.
- [ ] **Phase 17: Server-Side Data Fetching**: Support for asynchronous `getServerSideProps` mapped directly to component props.

*(For detailed implementation plans, check the `docs/` folder!)*

## 🛠️ Tech Stack & Prerequisites
- **Runtime**: [Bun](https://bun.sh/) (Default JS runtime and package manager)
- **Language**: TypeScript

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   bun install
   ```
2. **Run Tests** (to verify the core engine):
   ```bash
   bun test
   ```

---
*Note: This repository also contains educational summaries of various "Build your own React" tutorials (found in the root directory), which served as the original inspiration for this project.*
