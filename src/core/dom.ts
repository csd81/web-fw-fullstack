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

  updateDom(dom, {}, fiber.props);
  return dom;
}

function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any) {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      (dom as any)[name] = "";
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      (dom as any)[name] = nextProps[name];
    });

  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
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

  // Phase 5: Run effect cleanups for deleted nodes, then run new effects
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
    updateDom(fiber.dom, fiber.alternate!.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

export function render(element: VNode, container: HTMLElement | Text) {
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

function reconcileChildren(wipFiber: Fiber, elements: VNode[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element && element.type === oldFiber.type;

    if (sameType) {
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
    }
    if (element && !sameType) {
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
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling!.sibling = newFiber;
    }

    if (newFiber) {
      prevSibling = newFiber;
    }
    index++;
  }
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
