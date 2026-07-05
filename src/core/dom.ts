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

function shallowEqual(prev: any, next: any) {
  if (prev === next) return true;
  if (!prev || !next) return false;
  const prevKeys = Object.keys(prev).filter(k => k !== "children");
  const nextKeys = Object.keys(next).filter(k => k !== "children");
  if (prevKeys.length !== nextKeys.length) return false;
  for (let key of prevKeys) {
    if (prev[key] !== next[key]) return false;
  }
  return true;
}

export function memo(Component: Function, areEqual?: (prev: any, next: any) => boolean) {
  return {
    isMemo: true,
    Component,
    areEqual
  };
}

function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props, fiber);
  return dom;
}

function updateDom(dom: HTMLElement | Text, prevProps: any, nextProps: any, fiber: Fiber) {
  if (dom instanceof HTMLElement || dom instanceof Text) {
    (dom as any).__fiber = fiber;
  }

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
  
  if (wipRoot) {
    commitWork(wipRoot);
  }

  deletions.forEach(runCleanup);
  if (wipRoot) {
    runEffects(wipRoot);
  }

  if (wipRoot && wipRoot.type === "ROOT") {
    currentRoot = wipRoot;
  } else if (wipRoot) {
    // Subtree render: connect the new subtree to the main tree
    if (wipRoot.parent) {
      if (wipRoot.parent.child === wipRoot.alternate) {
        wipRoot.parent.child = wipRoot;
      } else {
        let sibling = wipRoot.parent.child;
        while (sibling && sibling.sibling !== wipRoot.alternate) {
          sibling = sibling.sibling;
        }
        if (sibling) {
          sibling.sibling = wipRoot;
        }
      }
    }
  }
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
  while (domParentFiber && !domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber ? domParentFiber.dom as HTMLElement : null;

  if (domParent) {
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate!.props, fiber.props, fiber);
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "DELETION") {
      commitDeletion(fiber, domParent);
      return;
    }
  }

  if (fiber.dom != null && fiber.props.ref) {
    fiber.props.ref.current = fiber.dom;
  }

  if (!fiber.bailsOut) {
    commitWork(fiber.child);
  }
  
  // Only commit sibling if this is not the root of the update
  if (fiber !== wipRoot) {
    commitWork(fiber.sibling);
  }
}

const DELEGATED_EVENTS = ["click", "input", "change", "keydown", "keyup", "submit"];

function setupEventDelegation(container: HTMLElement | Text) {
  if ((container as any).__eventsBound) return;
  
  const delegate = (e: Event) => {
    let target = e.target as HTMLElement | null;
    const eventType = `on${e.type.charAt(0).toUpperCase()}${e.type.slice(1)}`;
    
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
  const isFunctionComponent = fiber.type instanceof Function || (typeof fiber.type === "object" && (fiber.type as any).isMemo);
  const isFragment = fiber.type === "FRAGMENT";

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else if (isFragment) {
    updateFragmentComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child && !fiber.bailsOut) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber === wipRoot) {
      return null;
    }
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
}

export const Suspense = function Suspense(props: any) {
  return props.children;
};

function cloneChildren(fiber: Fiber) {
  if (!fiber.alternate) return;
  let oldChild = fiber.alternate.child;
  let prevSibling: Fiber | null = null;
  while (oldChild) {
    const newChild: Fiber = {
      type: oldChild.type,
      props: oldChild.props,
      dom: oldChild.dom,
      parent: fiber,
      child: oldChild.child, 
      sibling: null,
      alternate: oldChild,
      effectTag: "NONE",
      hooks: oldChild.hooks,
    };
    if (!prevSibling) {
      fiber.child = newChild;
    } else {
      prevSibling.sibling = newChild;
    }
    prevSibling = newChild;
    oldChild = oldChild.sibling;
  }
}

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];

  const isMemo = typeof fiber.type === "object" && (fiber.type as any).isMemo;
  const Component = isMemo ? (fiber.type as any).Component : fiber.type;

  let shouldUpdate = true;
  if (isMemo && fiber.alternate) {
    const areEqual = (fiber.type as any).areEqual || shallowEqual;
    if (areEqual(fiber.alternate.props, fiber.props)) {
      shouldUpdate = false;
    }
  }

  if (!shouldUpdate) {
    cloneChildren(fiber);
    fiber.bailsOut = true;
    return;
  }

  try {
    let rawChildren = Component(fiber.props);
    const children = (Array.isArray(rawChildren) ? rawChildren : [rawChildren])
      .flat(Infinity)
      .map(child => 
        typeof child === "object" 
          ? child 
          : { type: "TEXT_ELEMENT", props: { nodeValue: String(child), children: [] } }
      );
    reconcileChildren(fiber, children as VNode[]);
  } catch (promise) {
    if (promise instanceof Promise) {
      let suspenseFiber = fiber.parent;
      while (suspenseFiber && suspenseFiber.type !== Suspense) {
        suspenseFiber = suspenseFiber.parent;
      }

      if (suspenseFiber) {
        reconcileChildren(fiber, [suspenseFiber.props.fallback]);
        promise.then(() => {
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
        });
      } else {
        throw promise;
      }
    } else {
      throw promise;
    }
  }
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
  const oldFiberMap = new Map<string | number, Fiber>();
  let currentOldFiber = wipFiber.alternate?.child;
  let oldIndex = 0;
  
  while (currentOldFiber) {
    const key = currentOldFiber.props.key != null ? currentOldFiber.props.key : oldIndex;
    oldFiberMap.set(key, currentOldFiber);
    currentOldFiber = currentOldFiber.sibling;
    oldIndex++;
  }

  let prevSibling: Fiber | null = null;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue;

    const key = element.props.key != null ? element.props.key : i;
    const oldFiber = oldFiberMap.get(key);
    let newFiber: Fiber | null = null;

    const sameType = oldFiber && element.type === oldFiber.type;

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
      oldFiberMap.delete(key);
    } else {
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

  oldFiberMap.forEach((oldFiber) => {
    oldFiber.effectTag = "DELETION";
    deletions.push(oldFiber);
  });
}

export function useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void] {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook: Hook = {
    tag: "state",
    state: oldHook ? oldHook.state : initialState,
    queue: [],
  };

  const actions = oldHook ? oldHook.queue! : [];
  actions.forEach((action) => {
    hook.state = reducer(hook.state, action);
  });

  const currentFiber = wipFiber!;

  const dispatch = (action: A) => {
    hook.queue!.push(action);
    
    // Phase 7: Subtree Rendering!
    wipRoot = {
      dom: currentFiber.dom,
      props: currentFiber.props,
      alternate: currentFiber,
      parent: currentFiber.parent,
      child: null,
      sibling: currentFiber.sibling,
      effectTag: "UPDATE",
      type: currentFiber.type,
      hooks: currentFiber.hooks,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
  return [hook.state, dispatch];
}

export function useState<T>(initial: T): [T, (action: T | ((prev: T) => T)) => void] {
  return useReducer((state: T, action: any) => {
    return typeof action === "function" ? action(state) : action;
  }, initial);
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

export function useMemo<T>(factory: () => T, deps: any[]): T {
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hasChangedDeps = oldHook
    ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps![i]))
    : true;

  const hook: Hook = {
    tag: "memo",
    state: hasChangedDeps ? factory() : oldHook!.state,
    deps,
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
  return hook.state;
}

export function useCallback<T extends Function>(callback: T, deps: any[]): T {
  return useMemo(() => callback, deps);
}

export function useRef<T>(initialValue: T): { current: T } {
  return useMemo(() => ({ current: initialValue }), []);
}

export function createContext<T>(defaultValue: T) {
  const context = {
    Provider: function Provider(props: any) {
      return props.children;
    },
    defaultValue,
  };
  context.Provider.context = context;
  return context;
}

export function useContext<T>(context: any): T {
  let fiber = wipFiber!.parent;
  while (fiber) {
    if (fiber.type === context.Provider) {
      return fiber.props.value;
    }
    fiber = fiber.parent;
  }
  return context.defaultValue;
}

export const AntigravityReactDOM = {
  render,
};
