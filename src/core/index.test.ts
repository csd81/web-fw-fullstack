import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, memo, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 7: Subtree Rendering & React.memo", () => {
  test("bails out of unchanged subtrees and only re-renders the updated component", async () => {
    const container = document.createElement("div");

    let parentRenderCount = 0;
    let memoChildRenderCount = 0;
    let standardChildRenderCount = 0;
    let triggerParentUpdate: any = null;

    const MemoChild = memo(({ val }: { val: string }) => {
      memoChildRenderCount++;
      return createElement("span", null, `Memo: ${val}`);
    });

    const StandardChild = ({ val }: { val: string }) => {
      standardChildRenderCount++;
      return createElement("span", null, `Standard: ${val}`);
    };

    const Parent = () => {
      const [count, setCount] = useState(0);
      parentRenderCount++;
      triggerParentUpdate = () => setCount((c: number) => c + 1);

      return createElement("div", null,
        createElement(MemoChild, { val: "Fixed" }),
        createElement(StandardChild, { val: "Fixed" }),
        createElement("h1", null, `Count: ${count}`)
      );
    };

    const Root = () => createElement("div", null, createElement(Parent, null));

    // Initial Render
    render(createElement(Root, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(parentRenderCount).toBe(1);
    expect(memoChildRenderCount).toBe(1);
    expect(standardChildRenderCount).toBe(1);

    // Trigger update
    triggerParentUpdate();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // The Parent should re-render because its state changed
    expect(parentRenderCount).toBe(2);
    
    // The StandardChild should re-render because it is not memoized
    expect(standardChildRenderCount).toBe(2);

    // The MemoChild should NOT re-render because its props ("Fixed") didn't change!
    expect(memoChildRenderCount).toBe(1);

    // Verify HTML is correct
    expect(container.innerHTML).toBe(
      '<div><div><span>Memo: Fixed</span><span>Standard: Fixed</span><h1>Count: 1</h1></div></div>'
    );
  });
});
