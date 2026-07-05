import { Fiber, VNode } from "../types";

let nextUnitOfWork: Fiber | null = null;

function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  const isProperty = (key: string) => key !== "children";
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      (dom as any)[name] = fiber.props[name];
    });

  return dom;
}

export function render(element: VNode, container: HTMLElement | Text) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: "PLACEMENT",
    type: "ROOT", // A special type for the root
  };
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  // If requestIdleCallback is available (browser), use it.
  // Otherwise, use setTimeout (for Node/Bun test environments).
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(workLoop);
  } else {
    setTimeout(
      () => workLoop({ timeRemaining: () => 1, didTimeout: false } as any),
      1
    );
  }
}

// Start the continuous loop
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(workLoop);
} else {
  setTimeout(
    () => workLoop({ timeRemaining: () => 1, didTimeout: false } as any),
    1
  );
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  // 1. Create the DOM node if it doesn't exist
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // Warning: In Phase 2, we incrementally append to the DOM.
  // This causes incomplete UI updates. We will fix this in Phase 3.
  if (fiber.parent && fiber.dom) {
    fiber.parent.dom?.appendChild(fiber.dom);
  }

  // 2. Create fibers for the children
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling: Fiber | null = null;

  while (index < elements.length) {
    const element = elements[index];

    const newFiber: Fiber = {
      type: element.type,
      props: element.props,
      dom: null,
      parent: fiber,
      child: null,
      sibling: null,
      alternate: null,
      effectTag: "PLACEMENT",
    };

    if (index === 0) {
      // The first child attaches as `.child`
      fiber.child = newFiber;
    } else if (prevSibling) {
      // Subsequent children attach as `.sibling` to the previous child
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }

  // 3. Select next unit of work: Child -> Sibling -> Uncle
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
}

export const AntigravityReactDOM = {
  render,
};
