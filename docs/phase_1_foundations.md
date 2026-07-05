# Phase 1: Foundations & The Virtual DOM

## Objective
Establish the project structure, configure TypeScript to compile JSX down to custom function calls, and implement a recursive engine to render a declarative Virtual DOM (VDOM) tree into actual browser DOM nodes.

---

## 1. Project Initialization & Architecture

We will build the library under an `src/` directory, exposing our API similarly to React.

**Directory Structure:**
```text
src/
├── core/
│   ├── index.ts        // Exports AntigravityReact (createElement)
│   └── dom.ts          // Exports AntigravityReactDOM (render)
├── types/
│   └── index.ts        // Centralized TypeScript definitions
└── index.tsx           // The application entry point (consuming our library)
```

**TypeScript Configuration (`tsconfig.json`):**
To intercept JSX syntax (`<div id="foo">Hello</div>`), we must instruct TypeScript to use our custom factory instead of `React.createElement`.
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "AntigravityReact.createElement",
    "jsxFragmentFactory": "AntigravityReact.Fragment",
    "strict": true
  }
}
```

---

## 2. Core Types Definition (`src/types/index.ts`)

We must define strict interfaces to ensure type safety when bridging the VDOM and Fibers later.

```typescript
export type AntigravityTextElement = "TEXT_ELEMENT";

// The shape of our Virtual DOM Node
export interface VNode {
  type: string | Function; // 'div', 'span', or a Component function
  props: VNodeProps;
}

export interface VNodeProps {
  children: VNode[];
  nodeValue?: string; // Only populated for TEXT_ELEMENT
  [key: string]: any; // Allows arbitrary attributes like className, onClick
}
```

---

## 3. Implementing `createElement` (`src/core/index.ts`)

When Bun/TypeScript sees JSX, it translates it.
**JSX:** `<h1 title="foo">Hello</h1>`
**Compiled:** `AntigravityReact.createElement("h1", { title: "foo" }, "Hello")`

**Implementation Details:**
- The `children` argument is gathered using the rest operator `...children`.
- Because children can be primitive strings or numbers, we must normalize them. If a child is an object, it's already a `VNode`. If it's a primitive, we wrap it in a special `TEXT_ELEMENT` object. This simplifies our rendering loop since every node will have a `.type` and `.props`.

```typescript
function createTextElement(text: string): VNode {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function createElement(type: string, props: any, ...children: any[]): VNode {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(String(child))
      ),
    },
  };
}
```

---

## 4. The Initial Recursive `render` Function (`src/core/dom.ts`)

To mount the VDOM to the actual screen, we write a recursive renderer.
*(Note: This is temporary. In Phase 2, we will replace this with the Fiber architecture to avoid blocking the main thread.)*

**Implementation Steps:**
1. **Node Creation:** Check the `VNode.type`. If it is `"TEXT_ELEMENT"`, create a text node (`document.createTextNode`). Otherwise, create a standard element (`document.createElement`).
2. **Assigning Properties:** Iterate through all keys in `VNode.props` except `children`. Assign these values directly to the DOM node.
3. **Recursion:** Iterate over `VNode.props.children` and recursively call `render`, passing the newly created DOM node as the `container`.
4. **Mounting:** Finally, append the new node to the parent container.

**Example Implementation:**
```typescript
export function render(element: VNode, container: HTMLElement | Text) {
  // 1. Create DOM node
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type as string);

  // 2. Assign Props
  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = element.props[name];
    });

  // 3. Recursively append children
  element.props.children.forEach((child) => {
    render(child, dom as HTMLElement);
  });

  // 4. Mount
  container.appendChild(dom);
}
```

---

## 5. Phase 1 Verification

We will verify this phase by writing a complex nested layout in `src/index.tsx`, running the Bun dev server (`bun --hot run index.html` or `bun build`), and ensuring the DOM tree mirrors the JSX perfectly, including text nodes and attributes.
