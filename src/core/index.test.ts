import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, AntigravityReact, ErrorBoundary, createPortal } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 8: Error Boundaries and Portals", () => {
  test("catches errors and renders portals outside the root", async () => {
    const mainContainer = document.createElement("div");
    const portalContainer = document.createElement("div");
    document.body.appendChild(portalContainer);

    let triggerCrash: any = null;

    const BuggyComponent = () => {
      const [shouldCrash, setCrash] = useState(false);
      triggerCrash = () => setCrash(true);

      if (shouldCrash) {
        throw new Error("I crashed!");
      }

      return createElement("div", null, "I am fine");
    };

    const Modal = () => {
      return createPortal(
        createElement("div", { id: "modal-content" }, "Modal content!"), 
        portalContainer
      );
    };

    const App = () => {
      return createElement("div", null,
        createElement(ErrorBoundary, { fallback: (err: Error) => createElement("h1", null, `Caught: ${err.message}`) },
          createElement(BuggyComponent, null)
        ),
        createElement(Modal, null)
      );
    };

    render(createElement(App, null), mainContainer);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 1. Verify Portal worked correctly
    expect(mainContainer.innerHTML).toBe("<div><div>I am fine</div></div>");
    expect(portalContainer.innerHTML).toBe('<div id="modal-content">Modal content!</div>');

    // 2. Trigger Crash
    triggerCrash();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // 3. Verify Error Boundary caught it and rendered the fallback
    expect(mainContainer.innerHTML).toBe("<div><h1>Caught: I crashed!</h1></div>");
    
    // Portal content should remain untouched
    expect(portalContainer.innerHTML).toBe('<div id="modal-content">Modal content!</div>');
  });
});
