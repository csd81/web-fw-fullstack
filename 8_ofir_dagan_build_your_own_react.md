# ⚛️ Build Your Own React — Ofir Dagan

A summary of Ofir Dagan's walkthrough detailing **Application Driven Development (ADD)** to implement class components and Virtual DOM structures.

---

## 📖 Core Motivation & Philosophy
*   **Application Driven Development (ADD):** Dagan proposes writing the application code first (what you want to run) and then writing the framework APIs step-by-step to satisfy compilation and mounting errors.
*   **Incremental Optimization:** Starts with the simplest rendering solution (full-page re-renders) before introducing Virtual DOM diffing to optimize performance.

---

## 🏗️ Technical Pipeline & Iteration

### 1. Direct App Mounting
*   Write an HTML file hosting an `app.js` written in JSX.
*   Write a custom `react.js` implementing basic functions to eliminate compilation errors.

### 2. State and Renders (Iteration 1)
*   Implements class components and `setState`.
*   On every state change, the component clears the entire target container (`container.innerHTML = ''`) and mounts the application from scratch.

### 3. Virtual DOM Optimization (Iteration 2)
*   Introduces virtual representation to eliminate the slow "nuclear" update approach.
*   Calculates element differences (diffing) and applies patch operations to the DOM.

---

## 💻 Key Architecture Concept

*   **Instance Cache:** In order to manage stateful re-renders without rebuilding components on every change, the library maintains an instance cache that links DOM elements to their managing component instances.\n