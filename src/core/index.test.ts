import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, useLayoutEffect, useEffect, useTransition, useDeferredValue, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 10: Specialized Hooks", () => {
  test("runs useEffect cleanup on unmount", async () => {
    let cleanedUp = false;
    const Child = () => {
      useEffect(() => {
        return () => { cleanedUp = true; };
      }, []);
      return createElement("div", null, "child");
    };

    const App = () => {
      const [show, setShow] = useState(true);
      return createElement(
        "div",
        { id: "parent", onClick: () => setShow(false) },
        show ? createElement(Child, null) : null
      );
    };

    const container = document.createElement("div");
    render(createElement(App, null), container);
    
    // Initial render
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cleanedUp).toBe(false);
    expect(container.innerHTML).toBe('<div id="parent"><div>child</div></div>');

    // Trigger unmount
    (container.firstChild as HTMLElement).click();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(container.innerHTML).toBe('<div id="parent"></div>');
    expect(cleanedUp).toBe(true);
  });

  test("runs useLayoutEffect synchronously and useEffect asynchronously", async () => {
    const container = document.createElement("div");

    let executionOrder: string[] = [];

    const App = () => {
      useLayoutEffect(() => {
        executionOrder.push("layout");
      });

      useEffect(() => {
        executionOrder.push("effect");
      });

      return createElement("div", null, "Hello");
    };

    render(createElement(App, null), container);
    
    // Layout effects run immediately upon commit (synchronously within the loop)
    // Wait for the work loop to finish the render
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    expect(executionOrder.includes("layout")).toBe(true);
    
    // Both should be done eventually
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(executionOrder).toEqual(["layout", "effect"]);
  });

  test("useTransition defers state updates", async () => {
    const container = document.createElement("div");
    
    let triggerTransition: any = null;

    const App = () => {
      const [isPending, startTransition] = useTransition();
      const [count, setCount] = useState(0);

      triggerTransition = () => {
        startTransition(() => {
          setCount((c: number) => c + 1);
        });
      };

      return createElement("div", null, `Count: ${count}, Pending: ${isPending}`);
    };

    render(createElement(App, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    expect(container.innerHTML).toBe("<div>Count: 0, Pending: false</div>");

    triggerTransition();
    // 1. Immediately after triggering, isPending becomes true (synchronously updated by startTransition)
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(container.innerHTML).toBe("<div>Count: 0, Pending: true</div>");

    // 2. Eventually, the transition callback runs, updating count, and then pending resets to false
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(container.innerHTML).toBe("<div>Count: 1, Pending: false</div>");
  });
});
