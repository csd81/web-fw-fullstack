import { AntigravityReact } from "./core";
import { AntigravityReactDOM } from "./core/dom";

const element = (
  <div id="foo" className="container" style="background-color: salmon; padding: 20px;">
    <h1>Hello World</h1>
    <p>This is rendered entirely through our custom React clone!</p>
    <ul>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </ul>
  </div>
);

const container = document.getElementById("root");
if (container) {
  AntigravityReactDOM.render(element, container);
}
