# ⚛️ Build Your Own React in 90 Lines of JavaScript — Ameer Jhan (Qnd-React)

A summary of Ameer Jhan's walkthrough showing how to build a custom React clone, **Qnd-React** ("Quick and Dirty React"), in 90 lines by offloading complex diffing to an open-source virtual DOM library.

---

## 📖 Core Motivation & Philosophy
*   **Leveraging Existing Engines:** Instead of writing a complex diffing/patching engine from scratch, the author uses **Snabbdom** (a high-performance, modular virtual DOM library).
*   **Focus on API Integration:** By using Snabbdom for the heavy lifting, the guide focuses on JSX parsing, element creation, and component mounting APIs.

---

## 🏗️ Technical Design & Structure

### 1. Element Creation (`qnd-react.js`)
*   Wraps Snabbdom's `h` (hyperscript) utility to map JSX structures.
*   Supports functional components by intercepting custom tags and executing them as functions.

### 2. DOM Mounting (`qnd-react-dom.js`)
*   Exposes a `render` function that uses Snabbdom's `patch` tool.
*   Manages the initial virtual tree and replaces it with updated nodes when renders occur.

---

## 💻 Key Code Snippet (Qnd-React Implementation)

```javascript
import { h } from 'snabbdom';

// Wrapper for Babel JSX compilation
export const createElement = (type, props = {}, ...children) => {
  // If functional component, run the function
  if (typeof type === 'function') {
    return type(props);
  }
  return h(type, { props }, children);
};

export default {
  createElement
};
```\n