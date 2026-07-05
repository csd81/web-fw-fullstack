import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement } from "./index";
import { render } from "./dom";

// Initialize a DOM environment so we can test the render function
beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 1: Foundations", () => {
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

      // Verify text element normalization
      const textChild = vnode.props.children[0];
      expect(textChild.type).toBe("TEXT_ELEMENT");
      expect(textChild.props.nodeValue).toBe("Hello");

      // Verify nested element
      const spanChild = vnode.props.children[1];
      expect(spanChild.type).toBe("span");
      expect(spanChild.props.children[0].type).toBe("TEXT_ELEMENT");
      expect(spanChild.props.children[0].props.nodeValue).toBe("World");
    });
  });

  describe("render", () => {
    test("converts a virtual DOM tree into real DOM nodes", () => {
      // Mock container
      const container = document.createElement("div");

      // Build VDOM
      const vnode = createElement(
        "div",
        { id: "test-div", className: "container" },
        "Test Content"
      );

      // Execute render
      render(vnode, container);

      // The `className` prop maps to the `class` HTML attribute.
      // Happy DOM serializes this perfectly!
      expect(container.innerHTML).toBe(
        '<div id="test-div" class="container">Test Content</div>'
      );
    });
  });
});
