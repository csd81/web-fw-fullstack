import { AntigravityReactDOM, AntigravityReact } from "../core/index";
import App from "../pages/index";

const rootElement = document.getElementById("root");
if (rootElement) {
  AntigravityReactDOM.hydrateRoot(AntigravityReact.createElement(App, null), rootElement);
} else {
  console.error("Root element not found");
}
