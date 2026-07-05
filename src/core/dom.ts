import { VNode } from "../types";

export function render(element: VNode, container: HTMLElement | Text) {
  // 1. Create DOM node
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type as string);

  // 2. Assign Props
  const isProperty = (key: string) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = element.props[name];
    });

  // 3. Recursively append children
  element.props.children.forEach((child) => {
    render(child, dom as HTMLElement);
  });

  // 4. Mount
  container.appendChild(dom);
}

export const AntigravityReactDOM = {
  render,
};
