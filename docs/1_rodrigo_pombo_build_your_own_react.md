# ⚛️ Build Your Own React — Rodrigo Pombo (Didact)

A comprehensive summary of Rodrigo Pombo's popular step-by-step tutorial, where he guides developers through building a fully functional, dependency-free React clone named **Didact** mimicking React 16.8 (with hooks and Concurrent Mode).

---

## 📖 Core Motivation & Philosophy
*   **Demystifying the Magic:** The primary goal is to explain the internal mechanisms of React (Virtual DOM, fibers, rendering, diffing, and hooks) without relying on external libraries.
*   **Incremental Learning:** The tutorial builds React in eight logical steps, moving from static rendering to complex state scheduling.

---

## 🏗️ The 8 Steps of Didact

### Step 1: The `createElement` Function
Converts JSX (transpiled by Babel) into plain JavaScript objects representing virtual elements.
*   Returns an object with `type` and `props`.
*   Includes a helper to wrap primitive values (like strings or numbers) into text element objects.

### Step 2: The `render` Function
Recursively creates actual HTML DOM elements from virtual nodes and appends them to a container.

### Step 3: Concurrent Mode
Instead of recursively rendering (which blocks the main thread for large component trees), Didact introduces incremental rendering.
*   Uses `requestIdleCallback` to run a loop that executes units of work when the browser is idle.

### Step 4: Fibers
Introduces the **Fiber** tree structure to represent components and manage rendering work units.
*   Each Fiber node is a unit of work pointing to its `child`, `sibling`, and `parent`.
*   Fibers act as a linked list, making it easy to yield rendering and find the next unit of work.

### Step 5: Render and Commit Phases
Separates reconciliation from DOM insertion:
1.  **Render Phase:** Asynchronously processes fibers and builds a work-in-progress tree, calculating diffs without updating the UI.
2.  **Commit Phase:** Once the tree is complete, Didact synchronously commits the entire tree to the real DOM.

### Step 6: Reconciliation
The core diffing algorithm compares the current fiber tree with the previous render tree:
*   `PLACEMENT`: Inserts new elements.
*   `UPDATE`: Modifies attributes/properties of existing elements.
*   `DELETION`: Removes elements.

### Step 7: Function Components
Extends Didact to support function elements. Instead of having a direct DOM element, function components run their function to extract children.

### Step 8: Hooks (`useState`)
Implements component state within functional components.
*   Maintains state arrays inside each fiber.
*   Tracks hook indices during render.
*   Returns the current state and a setter function that schedules a new work-in-progress root update.

---

## 💻 Key Code Snippet (Work Loop)

```javascript
let nextUnitOfWork = null;
let wipRoot = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
  
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
```\n