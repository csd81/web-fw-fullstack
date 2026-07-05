# Phase 1: Foundations & The Virtual DOM

## Objective
Establish the project structure and successfully render a static, declarative Virtual DOM into the actual browser DOM.

## Steps to Execute

1. **Project Initialization**
   - Initialize a new Vite project using the Vanilla TypeScript template.
   - Install minimal dev dependencies (TypeScript, Vite).
   - Configure `tsconfig.json` to define our custom JSX factory and fragment (e.g., `"jsxFactory": "createElement"`, `"jsxFragmentFactory": "Fragment"`).

2. **Defining Core Types (`types.ts`)**
   - Define `Props` interface.
   - Define `VNode` (Virtual Node) interface containing `type` (string for HTML elements) and `props` (including `children`).

3. **Implementing `createElement` (`react.ts`)**
   - Write the `createElement(type, props, ...children)` function.
   - This function will be called by the JSX transpiler.
   - Ensure primitive children (strings, numbers) are wrapped in a special `TEXT_ELEMENT` object so the renderer can handle them uniformly.

4. **Implementing the initial `render` function (`react-dom.ts`)**
   - Write a recursive `render(element, container)` function.
   - For `TEXT_ELEMENT`, use `document.createTextNode("")`. For normal elements, use `document.createElement(element.type)`.
   - Iterate over `element.props`:
     - Filter out the `children` key.
     - Add all other keys to the DOM node (handling `className`, standard attributes).
   - Recursively call `render` for each child, appending them to the currently created DOM node.
   - Finally, append the created DOM node to the root container.

## Validation
- We should be able to write JSX syntax in `index.tsx`, mount it to `<div id="root"></div>`, and see the HTML properly rendered in the browser.
