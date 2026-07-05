import { expect, test, describe } from "bun:test";
import { createElement, useState, createContext, useContext, AntigravityReactDOM } from "../core/index";
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
  test("true dom hydration reuses existing nodes and attaches events", async () => {
    const App = () => {
      const [count, setCount] = useState(0);
      return createElement("div", { id: "hydrated-div", onClick: () => setCount(1) }, `Count: ${count}`);
    };

    const html = renderToString(createElement(App, null));
    
    // Create a physical container and inject the SSR HTML
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const serverRenderedDiv = container.firstChild as HTMLElement;
    expect(serverRenderedDiv.id).toBe("hydrated-div");
    
    // Tag the physical node to prove it wasn't destroyed!
    (serverRenderedDiv as any).__wasPreserved = true;

    // Hydrate
    AntigravityReactDOM.hydrateRoot(createElement(App, null), container);
    
    // Wait for initial hydration render to finish
    await new Promise(r => setTimeout(r, 10));

    // The node should still be the exact same physical node
    const hydratedDiv = container.firstChild as HTMLElement;
    expect((hydratedDiv as any).__wasPreserved).toBe(true);
    
    // Interactivity should work (event attached during hydration)
    hydratedDiv.click();
    await new Promise(r => setTimeout(r, 10));
    
    expect(hydratedDiv.innerHTML).toBe("Count: 1");
  });
});
