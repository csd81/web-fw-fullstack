import { VNode } from "../types";
import { setSSRReadContext } from "../core/dom";

const contextStack = new Map<any, any[]>();

setSSRReadContext((context: any) => {
  const stack = contextStack.get(context);
  if (stack && stack.length > 0) {
    return stack[stack.length - 1];
  }
  return context.defaultValue;
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderToString(element: any): string {
  if (element == null || typeof element === "boolean") {
    return "";
  }
  if (typeof element === "string" || typeof element === "number") {
    return escapeHtml(String(element));
  }

  if (Array.isArray(element)) {
    return element.map(renderToString).join("");
  }

  const { type, props } = element as VNode;

  if (type === "TEXT_ELEMENT") {
    return escapeHtml(String(props.nodeValue || ""));
  }

  if (type === "FRAGMENT" || type === "ERROR_BOUNDARY" || type === "PORTAL") {
    return renderToString(props.children);
  }

  const isMemo = typeof type === "object" && (type as any).isMemo;
  if (typeof type === "function" || isMemo) {
    const Component = isMemo ? (type as any).Component : type;
    
    if (Component.context) {
       const contextObj = Component.context;
       if (!contextStack.has(contextObj)) contextStack.set(contextObj, []);
       contextStack.get(contextObj)!.push(props.value);
       
       const childrenHtml = renderToString(props.children);
       
       contextStack.get(contextObj)!.pop();
       return childrenHtml;
    }

    const children = Component(props);
    return renderToString(children);
  }

  const tag = type as string;
  let attrs = "";
  let html = "";

  for (const key in props) {
    if (key === "children") {
      html = renderToString(props.children);
      continue;
    }
    if (key.startsWith("on")) {
      continue;
    }
    if (key === "className") {
      attrs += ` class="${escapeHtml(String(props[key]))}"`;
    } else if (key === "style" && typeof props[key] === "object") {
      const styleStr = Object.keys(props[key])
        .map(k => `${k.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${props[key][k]}`)
        .join(";");
      attrs += ` style="${escapeHtml(styleStr)}"`;
    } else {
      // Attributes that map directly
      attrs += ` ${key}="${escapeHtml(String(props[key]))}"`;
    }
  }

  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  if (voidElements.has(tag)) {
    return `<${tag}${attrs}/>`;
  }

  return `<${tag}${attrs}>${html}</${tag}>`;
}
