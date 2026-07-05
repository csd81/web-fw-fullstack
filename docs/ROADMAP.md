# Roadmap: Building "Our Own React" in TypeScript

This roadmap synthesizes the core concepts from the various "Build Your Own React" architectures into a step-by-step guide for creating a modern, Concurrent Mode-enabled React clone written entirely in TypeScript.

## Phase 1: Foundations & The Virtual DOM

**Goal:** Setup the project and render a static Virtual DOM object into the real DOM.

1. **Project Setup & TypeScript Configuration**
   - Initialize a TypeScript project using **Bun** (`bun init`).
   - Configure the TypeScript compiler/bundler to transpile JSX into a custom function (e.g., configuring `jsxFactory: 'AntigravityReact.createElement'`).
   - Define strict TypeScript interfaces for our Virtual DOM nodes (`VNode`, `Props`).

2. **Implementing `createElement`**
   - Build the function that takes `type`, `props`, and `children` from compiled JSX and returns a Virtual DOM object.
   - Handle edge cases, such as explicitly defining `TEXT_ELEMENT` types for raw strings/numbers.

3. **The Initial `render` Function**
   - Write a recursive function that takes a Virtual DOM node and a real DOM container.
   - Create physical DOM elements (`document.createElement` / `document.createTextNode`).
   - Assign props (attributes and event listeners) to the created DOM nodes.
   - Recursively render and append children to the DOM.

---

## Phase 2: Concurrent Mode & The Fiber Architecture

**Goal:** Replace the recursive render with a non-blocking, interruptible work loop.

4. **The Work Loop**
   - Implement `requestIdleCallback` (or a polyfill) to break work into small chunks.
   - Define a global `nextUnitOfWork` variable to track progress.

5. **Designing the Fiber Data Structure**
   - Define the `Fiber` TypeScript interface. A Fiber represents a unit of work and corresponds to a single DOM node.
   - Implement pointers linking Fibers together: `parent`, `child`, and `sibling` (a singly linked list tree traversal).
   - Add a `dom` property to link the Fiber to its physical DOM node.

6. **Refactoring to `performUnitOfWork`**
   - Update `render` to initialize the first Fiber (the root).
   - Write `performUnitOfWork` to process a Fiber:
     1. Create the DOM node (if it doesn't exist).
     2. Construct Fibers for its children.
     3. Return the next Fiber to process (child → sibling → uncle).

---

## Phase 3: The Commit Phase & Reconciliation (Diffing)

**Goal:** Efficiently update the DOM without tearing or creating new nodes from scratch.

7. **Separating Render from Commit**
   - Prevent the UI from updating partially. Wait until all Fibers are processed.
   - Store the root of the tree in a `wipRoot` (work-in-progress) variable.
   - Create a `commitRoot` function that traverses the completed Fiber tree and applies all DOM mutations at once.

8. **Reconciliation (Diffing)**
   - Save a reference to the previous Fiber tree after committing (`currentRoot`).
   - When creating child Fibers, compare the new Virtual DOM elements with the old Fibers (`alternate`).
   - Tag Fibers with `effectTag`:
     - `UPDATE`: Node exists, props changed.
     - `PLACEMENT`: New node.
     - `DELETION`: Node removed (track these in a separate array to process during commit).
   - Implement a function to specifically update DOM node properties (adding/removing event listeners, updating attributes).

---

## Phase 4: Components & State

**Goal:** Support functional components and local state via Hooks.

9. **Function Components**
   - Modify the Fiber processing logic to handle `type` as a function instead of a string tag (like `'div'`).
   - Execute the function component to get its children (instead of accessing them directly from props).
   - Note: Function components do not have a physical DOM node backing them directly, which requires adjustments in the commit phase to find the nearest physical DOM parent.

10. **Implementing Hooks (`useState`)**
    - Define a global `wipFiber` and `hookIndex` to track the currently rendering component.
    - Add a `hooks` array to the Fiber interface to store state queues.
    - Implement `useState(initialState)`:
      - Retrieve old state from the `alternate` Fiber.
      - Apply any queued actions to compute the new state.
      - Return the state and a `setState` function.
    - The `setState` function pushes an action to the hook's queue and triggers a re-render by setting a new `wipRoot` and resetting `nextUnitOfWork`.

---

## Phase 5: Polish & Extension (Optional)

**Goal:** Expand functionality to match real-world React features.

11. **`useEffect` Hook**
    - Implement an effect queue on the Fiber.
    - Run effects after the commit phase.
    - Store and execute cleanup functions before running new effects or when a component is unmounted.

12. **Keys & List Rendering**
    - Implement `key` props for reconciliation.
    - Optimize the diffing algorithm to detect moved children rather than just destroying and recreating them when order changes.

13. **Synthetic Events**
    - Create a centralized event delegation system instead of attaching individual event listeners to every DOM node.

---

## Phase 6: Advanced Hooks, Context & Suspense

**Goal:** Implement remaining modern APIs (useReducer, useRef, Context, Suspense).

## Phase 7: Subtree Rendering & Bailing Out

**Goal:** Optimize updates by re-rendering subtrees and bailing out of unchanged components using `React.memo`.

## Phase 8: Error Boundaries & Portals

**Goal:** Catch rendering errors gracefully and render Virtual DOM nodes into separate physical containers.

## Phase 9: SVG & Namespace Support

**Goal:** Support `xmlns` attributes and SVG rendering using `createElementNS` and `setAttributeNS`.

## Phase 10: Specialized Hooks

**Goal:** Add specialized hooks for rendering priorities and synchronous paints (`useLayoutEffect`, `useTransition`, `useDeferredValue`).

## Phase 11: Server-Side Rendering (SSR) & Hydration

**Goal:** Generate HTML strings on the server and attach Fiber nodes to pre-existing DOM elements on the client without rebuilding them.
