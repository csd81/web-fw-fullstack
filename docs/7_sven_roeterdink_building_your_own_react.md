# ⚛️ Building Your Own React — Sven Roeterdink

A summary of Sven Roeterdink's (swennemans) 10-step educational GitBook that mirrors the real React codebase names and structure.

---

## 📖 Core Motivation & Philosophy
*   **Direct Knowledge Transfer:** Sven structures his project with naming conventions closely matched to React's own codebase, making it easy for readers to transition from this tutorial to React's source code.
*   **Dividing the Virtual Tree:** Explicitly handles HTML tags and raw text differently to teach proper Virtual DOM representation.

---

## 🏗️ The 10-Step Building Guide

1.  **Getting started:** Setting up the project skeleton and module loading.
2.  **Recursively build the DOM:** Implementing basic tree traversal to append nodes.
3.  **Inspecting our vDOM:** Printing virtual node trees to understand JSX compile outputs.
4.  **Adding properties:** Attaching HTML attributes, classes, and styles.
5.  **Displaying text:** Handling text child nodes through custom text objects (`vText`).
6.  **Mighty components:** Introducing basic functional components.
7.  **The Component class:** Defining the base class for component instances.
8.  **Adding state:** Implementing internal component state.
9.  **Updating:** Scheduling tree updates when state changes.
10. **Updating children:** Reconciling children lists (element matching, additions, and deletions).

---

## 💻 Key Concept: vElements vs. vText
Sven splits virtual representation into two distinct shapes to prevent DOM bugs:
*   **`vElement`:** Represents standard tags (e.g. `div`, `p`) containing a `tagName`, `properties`, and `children`.
*   **`vText`:** Represents raw string nodes, mapping directly to browser `TextNode` objects.\n