# Phase 13: Advanced Component Capabilities

## Objective
Elevate the framework to support professional, reusable component libraries by implementing `forwardRef`, `useImperativeHandle`, and a normalized Synthetic Event system.

## Features

### 1. `forwardRef`
Currently, `ref` attributes are only processed when attached to Host Components (DOM nodes). To allow developers to pass refs through custom Function Components to underlying DOM elements, we need `forwardRef`.
- **Implementation**: Create a `forwardRef` Higher-Order Component (HOC) that attaches a special flag to the Component. During `updateFunctionComponent`, detect this flag and pass the `ref` from `fiber.props.ref` as the second argument to the render function.

### 2. `useImperativeHandle`
Allow functional components to customize the instance value that is exposed to parent components when using `ref`.
- **Implementation**: Build a new hook `useImperativeHandle(ref, createHandle, deps)`. This hook intercepts the `ref` object and assigns the result of `createHandle()` to `ref.current` during the commit phase, effectively allowing components to expose a strict, public API.

### 3. Synthetic Event Normalization
Currently, we pass native browser `Event` objects directly. Real React wraps these in `SyntheticEvent` to normalize cross-browser inconsistencies.
- **Implementation**: Modify the `setupEventDelegation` core. Before executing `fiber.props[eventType](e)`, wrap `e` in a lightweight proxy or normalized object. Ensure that `onChange` behaves identically to React (e.g., mapping `input` events to `onChange` for text fields to guarantee real-time updates).
