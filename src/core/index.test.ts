import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 4: Components & State", () => {
  test("renders function components and processes useState updates", async () => {
    const container = document.createElement("div");

    // We expose a reference to trigger updates outside the React loop for testing
    let triggerIncrement: any = null;

    const Counter = ({ name }: { name: string }) => {
      const [count, setCount] = useState(0);
      
      triggerIncrement = () => {
        setCount((prev: number) => prev + 1);
      };

      return createElement("div", { id: "counter" }, 
        createElement("h1", null, `Counter for ${name}`),
        createElement("span", null, `Count: ${count}`)
      );
    };

    const App = () => {
      return createElement("div", { className: "app" }, 
        createElement(Counter, { name: "Test" })
      );
    };

    // Initial Mount
    render(createElement(App, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(container.innerHTML).toBe(
      '<div class="app"><div id="counter"><h1>Counter for Test</h1><span>Count: 0</span></div></div>'
    );

    // Trigger state update
    expect(triggerIncrement).not.toBeNull();
    triggerIncrement();
    
    // Wait for the asynchronous render pass
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify UI updated
    expect(container.innerHTML).toBe(
      '<div class="app"><div id="counter"><h1>Counter for Test</h1><span>Count: 1</span></div></div>'
    );
  });
});
