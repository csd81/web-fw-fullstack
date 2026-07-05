import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 1, 2, & 3: React Core", () => {
  describe("createElement", () => {
    test("properly constructs a virtual DOM tree", () => {
      const vnode = createElement(
        "div",
        { id: "foo" },
        "Hello",
        createElement("span", null, "World")
      );
      expect(vnode.type).toBe("div");
      expect(vnode.props.id).toBe("foo");
      expect(vnode.props.children).toHaveLength(2);
    });
  });

  describe("render & reconciliation", () => {
    test("mounts, updates, and deletes nodes", async () => {
      const container = document.createElement("div");

      // 1. Initial Mount
      const initialVNode = createElement(
        "div",
        { id: "test-div", className: "container", title: "Original" },
        "Hello",
        createElement("span", null, "Child")
      );
      render(initialVNode, container);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(container.innerHTML).toBe(
        '<div id="test-div" class="container" title="Original">Hello<span>Child</span></div>'
      );

      // 2. Update (Change text, change prop, remove node, add node)
      const updatedVNode = createElement(
        "div",
        { id: "test-div", className: "new-container" }, // Changed class, removed title
        "Goodbye", // Changed text
        createElement("p", null, "New Child") // Changed span to p
      );
      render(updatedVNode, container);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // The title property is set to "" upon deletion, class should change, span should be replaced by p, and text should change
      expect(container.innerHTML).toBe(
        '<div id="test-div" class="new-container" title="">Goodbye<p>New Child</p></div>'
      );
    });
  });
});
