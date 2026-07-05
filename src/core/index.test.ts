import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, useReducer, useMemo, useRef, createContext, useContext, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 6: Advanced Hooks & Context", () => {
  test("implements useReducer, useMemo, useRef, and useContext correctly", async () => {
    const container = document.createElement("div");

    const ThemeContext = createContext("light");

    let dispatchTest: any = null;
    let refDomCheck: any = null;
    let memoCalculationCount = 0;

    const App = () => {
      // 1. useReducer
      const [state, dispatch] = useReducer((state: { count: number }, action: string) => {
        if (action === "INC") return { count: state.count + 1 };
        return state;
      }, { count: 0 });

      dispatchTest = dispatch;

      // 2. useMemo
      const memoizedValue = useMemo(() => {
        memoCalculationCount++;
        return `Memoized: ${state.count * 2}`;
      }, [state.count]);

      // 3. useRef
      const myRef = useRef<HTMLElement | null>(null);
      refDomCheck = () => myRef.current;

      // 4. useContext
      const theme = useContext(ThemeContext);

      return createElement("div", { ref: myRef, className: `theme-${theme}` },
        createElement("h1", null, `Count: ${state.count}`),
        createElement("p", null, memoizedValue)
      );
    };

    const Root = () => {
      return createElement(ThemeContext.Provider, { value: "dark" },
        createElement(App, null)
      );
    };

    // Initial Mount
    render(createElement(Root, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(container.innerHTML).toBe(
      '<div class="theme-dark"><h1>Count: 0</h1><p>Memoized: 0</p></div>'
    );
    expect(memoCalculationCount).toBe(1);

    // Ref should be attached to the inner div
    const refDom = refDomCheck();
    expect(refDom).not.toBeNull();
    expect(refDom.tagName).toBe("DIV");

    // Trigger reducer
    dispatchTest("INC");
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(container.innerHTML).toBe(
      '<div class="theme-dark"><h1>Count: 1</h1><p>Memoized: 2</p></div>'
    );
    // Memo should recalculate because state.count changed
    expect(memoCalculationCount).toBe(2);

    // Trigger update with SAME state (fake action) to test memoization cache
    dispatchTest("NOTHING");
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Memo should NOT recalculate!
    expect(memoCalculationCount).toBe(2);
  });
});
