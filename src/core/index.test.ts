import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, useEffect, Fragment, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 5: Keyed Lists & Synthetic Events", () => {
  test("preserves DOM nodes using keys and handles delegated events", async () => {
    const container = document.createElement("div");

    let items = ["A", "B", "C"];
    let triggerReorder: any = null;

    const App = () => {
      const [list, setList] = useState(items);
      triggerReorder = () => setList(["C", "A", "B"]); // Shuffle!

      return createElement("div", null, 
        list.map((item) => 
          createElement("div", { key: item, id: `item-${item}`, onClick: () => console.log(`Clicked ${item}`) }, item)
        )
      );
    };

    // 1. Initial render
    render(createElement(App, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(container.innerHTML).toBe(
      '<div><div id="item-A">A</div><div id="item-B">B</div><div id="item-C">C</div></div>'
    );

    // Save a reference to the raw DOM node for "A"
    const nodeA = container.querySelector("#item-A");

    // Test synthetic event manually by dispatching a real DOM event
    let eventFired = false;
    const oldLog = console.log;
    console.log = (msg) => { if (msg === "Clicked A") eventFired = true; };
    
    // Because we use event delegation on the container, clicking a child should bubble and trigger the fiber's onClick
    nodeA?.dispatchEvent(new window.Event("click", { bubbles: true }));
    expect(eventFired).toBe(true);
    
    console.log = oldLog;

    // 2. Trigger reorder
    triggerReorder();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Notice order is updated
    expect(container.innerHTML).toBe(
      '<div><div id="item-C">C</div><div id="item-A">A</div><div id="item-B">B</div></div>'
    );

    // KEY PRESERVATION CHECK: The raw DOM node reference should STILL be strictly equal
    // to the node currently in the DOM. It was NOT destroyed and recreated!
    const newNodeA = container.querySelector("#item-A");
    expect(newNodeA).toBe(nodeA); // Identity check!
  });
});
