import { expect, test, describe } from "bun:test";
import { createElement, useState, createContext, useContext } from "../core/index";
import { renderToString } from "./index";

describe("Phase 11: Server-Side Rendering", () => {
  test("renders host components, function components, and context to string", () => {
    const ThemeContext = createContext("light");

    const ThemedButton = () => {
      const theme = useContext(ThemeContext);
      const [count, setCount] = useState(0); // Should fallback safely in SSR

      return createElement("button", { className: `btn-${theme}`, onClick: () => setCount(1) }, `Count: ${count}`);
    };

    const App = () => {
      return createElement(
        ThemeContext.Provider,
        { value: "dark" },
        createElement("div", { id: "app-container", style: { backgroundColor: "black" } },
          createElement(ThemedButton, null)
        )
      );
    };

    const html = renderToString(createElement(App, null));
    
    // Validates:
    // 1. Function component execution without DOM
    // 2. Safe hook fallback (count starts at 0, no crashes)
    // 3. Context propagation through server Stack
    // 4. Prop serialization (className -> class, style objects -> strings)
    expect(html).toBe('<div id="app-container" style="background-color:black"><button class="btn-dark">Count: 0</button></div>');
  });
});
