export type AntigravityTextElement = "TEXT_ELEMENT";
export type AntigravityFragment = "FRAGMENT";

export interface VNode {
  type: string | Function;
  props: VNodeProps;
}

export interface VNodeProps {
  children: VNode[];
  nodeValue?: string;
  [key: string]: any;
}

export interface Hook {
  tag?: string;
  state?: any;
  queue?: any[];
  effect?: () => (void | (() => void));
  deps?: any[];
  cleanup?: void | (() => void);
  hasChangedDeps?: boolean;
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
