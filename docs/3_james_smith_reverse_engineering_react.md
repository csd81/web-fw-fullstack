# ⚛️ Reverse Engineering React — James Smith (Reaction)

A summary of James Smith's work reverse-engineering React's core API to build his own lightweight framework, **Reaction**.

---

## 📖 Core Motivation & Philosophy
*   **Homage and Learning:** Rebuilding the API of React to strip away dependencies and understand the core abstractions (such as JSX integration and component class rendering).
*   **Lightweight Delivery:** Smith aims to create a highly optimized, modular library named **Reaction** that mirrors React's API surface but remains lightweight.

---

## 🛠️ Technical Details & Ecosystem

### 1. Reaction Library (`reaction`)
*   Provides the base class `Component` and rendering pipeline.
*   A modular, dependency-free wrapper for building web UIs using React-style declarative syntax.

### 2. Separating State and Hooks
*   **Reaction Hooks (`reaction-hooks`):** Implements state hooks like `useState` separately to keep the core library small and maintainable.
*   **Reaction Styling (`reaction-with-style`):** Includes custom support for styling components programmatically without large inline blocks.

### 3. Key Takeaway
*   By reverse-engineering React's class prototype and component APIs, developers can discover how framework authors structure internal component trees and coordinate properties.

---

## 💻 Key Concept

Instead of relying on a massive single bundle, **Reaction** is divided into small, single-purpose packages. This demonstrates that React's design can be decoupled into discrete, easily manageable modules:
*   **Blueprint Factory:** Creates virtual nodes.
*   **State Hook Managers:** Coordinate reactivity.
*   **Style Injectors:** Manage browser styles.\n