import { Fiber, Hook, VNode } from "../types";

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletions: Fiber[] = [];

let wipFiber: Fiber | null = null;
let hookIndex: number = 0;

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any) => (key: string) => prev[key] !== next[key];
const isGone = (prev: any, next: any) => (key: string) => !(key in next);

function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props, fiber);
  return dom;
}

function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any, fiber: Fiber) {
  // Phase 5: Synthetic Events. Attach the fiber to the raw DOM node.
  if (dom instanceof HTMLElement || dom instanceof Text) {
    (dom as any).__fiber = fiber;
  }

  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      (dom as any)[name] = "";
    });

  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      (dom as any)[name] = nextProps[name];
    });

  // We no longer add/remove actual DOM event listeners here.
  // We use Synthetic Event Delegation on the Root.
}

function runCleanup(fiber: Fiber | null) {
  if (!fiber) return;
  if (fiber.hooks) {
    fiber.hooks
      .filter((h) => h.tag === "effect" && h.cleanup)
      .forEach((h) => h.cleanup!());
  }
  runCleanup(fiber.child);
  runCleanup(fiber.sibling);
}

function runEffects(fiber: Fiber | null) {
  if (!fiber) return;
  if (fiber.hooks) {
    fiber.hooks
      .filter((h) => h.tag === "effect" && h.hasChangedDeps)
      .forEach((h) => {
        if (h.cleanup) h.cleanup();
        h.cleanup = h.effect!();
      });
  }
  runEffects(fiber.child);
  runEffects(fiber.sibling);
}

function commitRoot() {
  deletions.forEach(commitWork);
  if (wipRoot && wipRoot.child) {
    commitWork(wipRoot.child);
  }

  deletions.forEach(runCleanup);
  if (wipRoot) {
    runEffects(wipRoot);
  }

  currentRoot = wipRoot;
  wipRoot = null;
}

function commitDeletion(fiber: Fiber, domParent: HTMLElement | Text) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else if (fiber.child) {
    commitDeletion(fiber.child, domParent);
  }
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (!domParentFiber!.dom) {
    domParentFiber = domParentFiber!.parent;
  }
  const domParent = domParentFiber!.dom as HTMLElement;

  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props, fiber);
    // Enforce correct order by re-appending the reused DOM node.
    // Since commitWork traverses in exact tree order, this sorts the children perfectly!
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

const DELEGATED_EVENTS = ["click", "input", "change", "keydown", "keyup", "submit"];

function setupEventDelegation(container: HTMLElement | Text) {
  if ((container as any).__eventsBound) return;
  
  const delegate = (e: Event) => {
    let target = e.target as HTMLElement | null;
    const eventType = `on${e.type.charAt(0).toUpperCase()}${e.type.slice(1)}`;
    
    // Bubble up the tree looking for Fibers with matching event handlers
    while (target && target !== container) {
      const fiber = (target as any).__fiber as Fiber;
      if (fiber && fiber.props && fiber.props[eventType]) {
        fiber.props[eventType](e);
      }
      target = target.parentNode as HTMLElement | null;
    }
  };

  DELEGATED_EVENTS.forEach(eventName => {
    container.addEventListener(eventName, delegate);
  });
  
  (container as any).__eventsBound = true;
}

export function render(element: VNode, container: HTMLElement | Text) {
  setupEventDelegation(container);

  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
    effectTag: "PLACEMENT",
    type: "ROOT",
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }

  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(workLoop);
  } else {
    setTimeout(
      () => workLoop({ timeRemaining: () => 1, didTimeout: false } as any),
      1
    );
  }
}

if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(workLoop);
} else {
  setTimeout(
    () => workLoop({ timeRemaining: () => 1, didTimeout: false } as any),
    1
  );
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isFunctionComponent = fiber.type instanceof Function;
  const isFragment = fiber.type === "FRAGMENT";

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else if (isFragment) {
    updateFragmentComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

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

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [(fiber.type as Function)(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateFragmentComponent(fiber: Fiber) {
  reconcileChildren(fiber, fiber.props.children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

// Phase 5: Keyed Reconciliation
function reconcileChildren(wipFiber: Fiber, elements: VNode[]) {
  const oldFiberMap = new Map<string | number, Fiber>();
  let currentOldFiber = wipFiber.alternate?.child;
  let oldIndex = 0;
  
  // 1. Collect all old children into a map keyed by their unique `key` prop, or fallback to index.
  while (currentOldFiber) {
    const key = currentOldFiber.props.key != null ? currentOldFiber.props.key : oldIndex;
    oldFiberMap.set(key, currentOldFiber);
    currentOldFiber = currentOldFiber.sibling;
    oldIndex++;
  }

  let prevSibling: Fiber | null = null;

  // 2. Iterate over the new elements and match them with old fibers
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue; // Skip null/undefined/booleans which shouldn't render

    const key = element.props.key != null ? element.props.key : i;
    const oldFiber = oldFiberMap.get(key);
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element.type === oldFiber.type;

    if (sameType) {
      // Keys and Types match! Reuse the DOM node.
      newFiber = {
        type: oldFiber!.type,
        props: element.props,
        dom: oldFiber!.dom,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: oldFiber,
        effectTag: "UPDATE",
      };
      oldFiberMap.delete(key);
    } else {
      // Type mismatch or no old fiber found. Create new DOM node.
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        child: null,
        sibling: null,
        alternate: null,
        effectTag: "PLACEMENT",
      };
    }

    if (i === 0) {
      wipFiber.child = newFiber;
    } else if (prevSibling) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
  }

  // 3. Any remaining old fibers in the map are no longer present, mark for DELETION
  oldFiberMap.forEach((oldFiber) => {
    oldFiber.effectTag = "DELETION";
    deletions.push(oldFiber);
  });
}

export function useState<T>(initial: T): [T, (action: T | ((prev: T) => T)) => void] {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook: Hook = {
    tag: "state",
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });

  const setState = (action: any) => {
    hook.queue.push(action);
    wipRoot = {
      dom: currentRoot!.dom,
      props: currentRoot!.props,
      alternate: currentRoot,
      parent: null,
      child: null,
      sibling: null,
      effectTag: "UPDATE",
      type: "ROOT",
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

export function useEffect(effect: () => (void | (() => void)), deps?: any[]) {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hasChangedDeps = oldHook
    ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps![i]))
    : true;

  const hook: Hook = {
    tag: "effect",
    effect,
    deps,
    cleanup: oldHook ? oldHook.cleanup : undefined,
    hasChangedDeps,
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
}

export const AntigravityReactDOM = {
  render,
};
