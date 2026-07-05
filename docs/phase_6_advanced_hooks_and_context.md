# Phase 6: Advanced Hooks, Context & Suspense

## Objective
Extend our core Fiber engine to support the full suite of modern React APIs, transforming it from a minimal clone into a fully featured framework capable of complex state management, dependency caching, and asynchronous rendering.

---

## 1. Advanced State Management (`useReducer`)

In modern React, `useState` is actually built on top of `useReducer`. 

**Implementation Strategy:**
- Create `useReducer(reducer, initialState)`.
- Similar to `useState`, it will retrieve the old hook state or initialize it.
- The returned `dispatch` function will accept an `action`, push it to the queue, and trigger a new render by setting `nextUnitOfWork = wipRoot`.
- During the next render phase, the queue is processed using the `reducer(state, action)` function instead of executing raw callbacks.
- We can then refactor our existing `useState` to just call `useReducer` under the hood!

---

## 2. Dependency Caching (`useMemo` & `useCallback`)

These hooks prevent expensive recalculations and unnecessary re-renders by caching values across renders unless their dependencies change.

**Implementation Strategy:**
- **`useMemo(factory, deps)`:** Retrieve the old hook. If `deps` have changed (or on initial render), execute `factory()` and store the result and the new `deps` in the hook. Return the cached result.
- **`useCallback(callback, deps)`:** This is essentially a wrapper around `useMemo`. We will implement it as `useMemo(() => callback, deps)`.

---

## 3. Mutable References (`useRef`)

`useRef` provides a way to persist mutable values across renders without triggering a re-render, and to gain direct access to raw DOM nodes.

**Implementation Strategy:**
- **Value Persistence:** Implement `useRef(initialValue)` by returning a plain object `{ current: initialValue }`. We can store this object using `useMemo` so the exact same object reference is returned on every render.
- **DOM Binding:** Update the `commitWork` phase. When a DOM node is created or updated, check if its props contain a `ref` object. If so, assign the raw DOM node to `fiber.props.ref.current = dom`. 

---

## 4. Context API (`createContext`, `Provider`, `useContext`)

Context allows "teleporting" data deep into the tree without prop-drilling.

**Implementation Strategy:**
- **`createContext(defaultValue)`:** Returns a Context object containing a unique identifier and its default value. It will also expose a `Provider` component.
- **`Provider` Component:** A special Function Component that accepts a `value` prop. When it renders, it attaches the `value` to its Fiber node.
- **`useContext(Context)`:** When called inside a component, this hook will traverse *up* the Fiber tree (`fiber = fiber.parent`) until it finds a Fiber matching the Context Provider's type. It then returns that Fiber's `value` prop. If no Provider is found, it returns the Context's default value.

---

## 5. Asynchronous Rendering (`Suspense`)

Suspense allows components to "pause" rendering while waiting for asynchronous data (like fetching data or lazy-loading code).

**Implementation Strategy:**
- **Throwing Promises:** If a Function Component needs data that isn't ready, it `throw`s a Promise. 
- **Catching in the Work Loop:** Wrap the execution of `fiber.type(fiber.props)` in `updateFunctionComponent` in a `try/catch` block.
- **Handling the Promise:** 
  - If a Promise is caught, we halt the current work loop.
  - We traverse up the tree to find the nearest `<Suspense>` component and switch its rendering output to its `fallback` prop.
  - We attach a `.then()` to the caught Promise. When it resolves, we re-trigger the render phase from the `<Suspense>` boundary so the component can try rendering again.

---

With Phase 6 complete, our custom engine will perfectly mimic the robust capabilities of React 18, capable of handling virtually any modern web application!
