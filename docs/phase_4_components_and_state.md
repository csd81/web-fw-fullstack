# Phase 4: Components & State

## Objective
Currently, our engine only supports native HTML tags (strings like `'div'`). We need to support Function Components (`type` is a function) and introduce the `useState` hook so components can trigger their own updates.

---

## 1. Supporting Function Components

When JSX is written as `<App title="Hello" />`, the transpiler outputs `createElement(App, { title: "Hello" })`. The `type` is literally the JavaScript function `App`.

**Updating `performUnitOfWork`:**
We must branch our logic based on `fiber.type`:
```typescript
const isFunctionComponent = fiber.type instanceof Function;
if (isFunctionComponent) {
  updateFunctionComponent(fiber);
} else {
  updateHostComponent(fiber); // The logic we wrote in Phase 2/3
}
```

**Implementing `updateFunctionComponent`:**
- A function component returns VDOM elements. It doesn't have a `dom` property itself.
- We execute the function: `const children = [fiber.type(fiber.props)]`.
- We pass these `children` directly into the `reconcileChildren` function.

**Updating `commitWork` for Functions:**
- Because function components lack a physical `dom` node, we cannot simply use `fiber.parent.dom` when appending a child. 
- In `commitWork`, we must traverse up the tree (`let domParentFiber = fiber.parent`) until we find a Fiber that actually possesses a `dom` node.
- Similarly, when deleting a function component, we must traverse *down* the tree until we find a physical `dom` node to remove.

---

## 2. Implementing `useState` Hooks

Hooks rely on global variables to track which component is currently executing.

**State Variables:**
```typescript
let wipFiber: Fiber | null = null;
let hookIndex: number = 0;
```

**In `updateFunctionComponent`:**
Before executing the function component, we prepare the environment:
```typescript
wipFiber = fiber;
hookIndex = 0;
wipFiber.hooks = []; // Attach an array to the Fiber to store hook states
const children = [fiber.type(fiber.props)];
```

**The `useState` Implementation:**
```typescript
export function useState<T>(initial: T) {
  // 1. Retrieve the old hook if this is a re-render
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  // 2. Initialize the hook state
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [], // Queue of state updates
  };

  // 3. Process any pending actions (setStates) from the previous render
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  // 4. Define the setState function
  const setState = (action) => {
    hook.queue.push(action);
    
    // Trigger a re-render! Set wipRoot to currentRoot and restart workLoop
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  // 5. Store the hook on the current fiber and increment index
  wipFiber.hooks.push(hook);
  hookIndex++;

  return [hook.state, setState];
}
```

By completing Phase 4, we have a fully functional, reactive UI library capable of managing complex state logic using modern functional component syntax!
