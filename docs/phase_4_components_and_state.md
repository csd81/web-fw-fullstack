# Phase 4: Components & State

## Objective
Support functional components and allow them to manage local state through a `useState` hook.

## Steps to Execute

1. **Supporting Function Components**
   - Functional components are JSX elements where the `type` is a function rather than a string.
   - In `performUnitOfWork`, branch logic: `updateFunctionComponent` vs `updateHostComponent`.
   - `updateFunctionComponent`: Execute the function (`fiber.type(fiber.props)`) to obtain the children VDOM elements.
   - Note: Function components do *not* have their own DOM node. Update `commitWork` to traverse up the fiber tree until a parent with a DOM node is found when appending.

2. **Hook Foundation**
   - Introduce globals: `wipFiber` (the currently rendering function component) and `hookIndex`.
   - Add a `hooks` array property to the Fiber interface to store the component's state and effects.

3. **Implementing `useState`**
   - Retrieve the old hook from `wipFiber.alternate.hooks[hookIndex]`.
   - If an old hook exists, use its state; otherwise, use `initialState`.
   - Initialize a `queue` on the hook to hold state setter actions.
   - Process any pending actions in the queue to compute the new state for this render pass.
   - Create the `setState(action)` function:
     - Push the action into the hook's queue.
     - Set `wipRoot` to a clone of `currentRoot`, setting `nextUnitOfWork` to trigger a new render pass.
   - Return the `[state, setState]` tuple.

## Validation
- We should be able to write a Counter component using `useState` and see the DOM successfully update when a button triggers the `setState` function.
