export type AntigravityTextElement = "TEXT_ELEMENT";

export interface VNode {
  type: string | Function; // 'div', 'span', or a Component function
  props: VNodeProps;
}

export interface VNodeProps {
  children: VNode[];
  nodeValue?: string;
  [key: string]: any;
}

export interface Hook {
  state: any;
  queue: any[];
}

export interface Fiber {
  type: string | Function;
  props: VNodeProps;
  dom: HTMLElement | Text | null;
  
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  
  alternate: Fiber | null;
  effectTag: "PLACEMENT" | "UPDATE" | "DELETION";
  hooks?: Hook[];
}
