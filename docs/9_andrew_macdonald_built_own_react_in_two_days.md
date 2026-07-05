# ⚛️ How I Built My Own “React” in Two Days — Andrew MacDonald

A summary of Andrew MacDonald's article documenting his experience building a React clone over a single weekend.

---

## 📖 Core Motivation & Philosophy
*   **Reinventing the Wheel as a Tool:** MacDonald argues that rebuilding popular frameworks is the best way to demystify complex library code and understand their design trade-offs.
*   **Deepening Framework Understanding:** Building a clone forces developers to solve scheduling, mounting, and child binding challenges themselves, providing them with a deeper understanding of JSX and the component lifecycle.

---

## 💡 Key Lessons & Engineering Takeaways

### 1. Breaking the "Magic"
*   Using JSX can feel like magic. Authoring a compiler and engine that translates JSX into standard nested function calls helps developers understand that React is simply a JavaScript abstraction over the DOM.

### 2. Encountering Framework Edge Cases
*   Building a clone forces you to handle updates, track event listeners, and reconcile children list operations, showing you the exact engineering trade-offs the React core team had to make.

### 3. Architectural Confidence
*   Recreating a library from scratch gives developers the architectural confidence to build their own tools and contribute back to open source.\n