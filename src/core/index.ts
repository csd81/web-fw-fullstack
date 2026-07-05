import { VNode } from "../types";
import { useState } from "./dom";

function createTextElement(text: string): VNode {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function createElement(type: string | Function, props: any, ...children: any[]): VNode {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        typeof child === "object" ? child : createTextElement(String(child))
      ),
    },
  };
}

export const AntigravityReact = {
  createElement,
  useState,
};

// Export to be available via import { useState } from "src/core"
export { useState };
