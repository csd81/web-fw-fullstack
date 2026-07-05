# ⚛️ Building React From Scratch — Paul O'Shannessy

A summary of Paul O'Shannessy's (former React core team member) influential talk detailing the inner architecture of React's classic Stack Reconciler.

---

## 📖 Core Motivation & Philosophy
*   **Magic Stripping:** Demystifies React by building a miniature version of its classic architecture (React 15 era).
*   **Separation of Concerns:** Deeply clarifies the conceptual boundaries between raw blueprints (Elements) and operational managers (Instances).

---

## 🏛️ Key Architecture & Concepts

### 1. Element vs. Instance
*   **React Element:** An immutable, stateless blueprint describing what the UI should look like. It is cheap to create and destroy.
*   **Component Instance:** The stateful engine created when React mounts a component class. It handles state, lifecycle methods, and refs.

### 2. The Lifecycle Framework
O'Shannessy walks through the primary lifecycle framework that coordinates components:
*   `constructor()`: Instantiates class components.
*   `mountComponent()`: Recursively walks down child components, rendering them into actual DOM strings or elements.
*   `receiveComponent()`: Triggered when parent elements re-render and feed new properties (props) down the tree.
*   `updateComponent()`: Manages state updates and diffs changes to minimize expensive browser DOM writes.
*   `unmountComponent()`: Tears down the component instance, freeing memory and event listeners.

### 3. The Stack Reconciler
*   Unlike the modern Fiber architecture (which is loop-based and yieldable), the stack reconciler relies on recursive function calls.
*   Once an update begins, React mounts and diffs components synchronously down the stack, which is simple but can block user interactions on large pages.

---

## 💻 Key Code Snippet (Base Component Class)

```javascript
class Component {
  constructor(props) {
    this.props = props;
    this.state = this.state || {};
  }

  setState(partialState) {
    this.state = Object.assign({}, this.state, partialState);
    // Communicates with internal component wrapper to trigger a re-render
    this._internalInstance.updateComponent();
  }
}
```\n