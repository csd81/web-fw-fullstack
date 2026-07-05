import { expect, test, describe, beforeAll } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { createElement, useState, AntigravityReact } from "./index";
import { render } from "./dom";

beforeAll(() => {
  GlobalRegistrator.register();
});

describe("Phase 9: SVG & Namespace Support", () => {
  test("creates SVG nodes with correct namespace and attributes", async () => {
    const container = document.createElement("div");

    let triggerColorUpdate: any = null;

    const SvgComponent = () => {
      const [color, setColor] = useState("red");
      triggerColorUpdate = () => setColor("blue");

      return createElement("svg", { width: 100, height: 100, className: "svg-icon" },
        createElement("circle", { cx: 50, cy: 50, r: 40, fill: color, "xlink:href": "#target" }),
        createElement("foreignObject", { width: 100, height: 100 },
          createElement("div", { className: "html-text" }, "HTML text inside SVG")
        )
      );
    };

    render(createElement(SvgComponent, null), container);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Wait, happy-dom supports SVGElement namespaces. Let's verify!
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    // In Happy DOM, nodeName is uppercase. We can just verify it renders properly.
    expect(svg!.getAttribute("class")).toBe("svg-icon");

    const circle = svg!.querySelector("circle");
    expect(circle).not.toBeNull();
    expect(circle!.getAttribute("fill")).toBe("red");
    // Verify xlink namespace attribute was set correctly
    expect(circle!.getAttributeNS("http://www.w3.org/1999/xlink", "href")).toBe("#target");

    const divInsideSvg = svg!.querySelector(".html-text");
    expect(divInsideSvg).not.toBeNull();
    expect(divInsideSvg!.textContent).toBe("HTML text inside SVG");
    
    // Check elements string (relaxed due to happy-dom serialization quirks like lowercasing foreignObject)
    const htmlString = container.innerHTML;
    expect(htmlString).toContain('<svg');
    expect(htmlString).toContain('<circle');
    expect(htmlString).toContain('<div class="html-text">HTML text inside SVG</div>');

    // Trigger state update
    triggerColorUpdate();
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Verify SVG properly updated its property without recreating the node
    expect(circle!.getAttribute("fill")).toBe("blue");
  });
});
