import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, useEffect, Fragment, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 5: useEffect & Fragments", () => {
  test("runs effects and supports fragments without DOM wrappers", async () => {
    const container = document.createElement("div");

    let effectRunCount = 0;
    let cleanupRunCount = 0;
    let triggerRender: any = null;

    const App = () => {
      const [count, setCount] = useState(0);
      
      triggerRender = () => setCount((prev: number) => prev + 1);

      useEffect(() => {
        effectRunCount++;
        return () => {
          cleanupRunCount++;
        };
      }, [count]);

      return createElement(Fragment, null, 
        createElement("h1", null, "Fragment Header"),
        createElement("span", null, `Count: ${count}`)
      );
    };

    render(createElement(App, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Notice that there is no wrapping div inside the container! The fragment disappeared.
    expect(container.innerHTML).toBe(
      '<h1>Fragment Header</h1><span>Count: 0</span>'
    );
    expect(effectRunCount).toBe(1); // Effect runs on mount
    expect(cleanupRunCount).toBe(0);

    triggerRender();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(container.innerHTML).toBe(
      '<h1>Fragment Header</h1><span>Count: 1</span>'
    );
    // Cleanup runs before the new effect because `count` dependency changed
    expect(effectRunCount).toBe(2);
    expect(cleanupRunCount).toBe(1);
  });
});
