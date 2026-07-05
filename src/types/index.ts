export type AntigravityTextElement = "TEXT_ELEMENT";

// The shape of our Virtual DOM Node
export interface VNode {
  type: string | Function; // 'div', 'span', or a Component function
  props: VNodeProps;
}

export interface VNodeProps {
  children: VNode[];
  nodeValue?: string; // Only populated for TEXT_ELEMENT
  [key: string]: any; // Allows arbitrary attributes like className, onClick
}
