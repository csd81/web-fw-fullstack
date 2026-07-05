import { AntigravityReact } from "../core/index";
import { renderToString } from "../server/index";
import App from "../pages/index";

export function handleRequest() {
  const html = renderToString(AntigravityReact.createElement(App, null));
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>fullstack.js</title>
  </head>
  <body>
    <div id="root">${html}</div>
    <script type="module" src="/_fullstack/client.js"></script>
  </body>
</html>`;
}
