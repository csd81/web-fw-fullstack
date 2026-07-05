import { Fiber, Hook, VNode } from "../types";

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletions: Fiber[] = [];

let wipFiber: Fiber | null = null;
let hookIndex: number = 0;

export let isHydrating = false;
export let nextHydratableNode: ChildNode | null = null;

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
// ... (omitting full file replacement, let's use surgical chunks instead)
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";

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

function createDom(fiber: Fiber): Element | Text {
  if (fiber.type === "TEXT_ELEMENT") {
    const dom = document.createTextNode("");
    updateDom(dom, {}, fiber.props, fiber);
    return dom;
  }

  const dom = fiber.namespaceURI === SVG_NAMESPACE
    ? document.createElementNS(SVG_NAMESPACE, fiber.type as string)
    : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props, fiber);
  return dom;
}

function updateDom(dom: Element | Text, prevProps: any, nextProps: any, fiber: Fiber) {
  if (dom instanceof Element || dom instanceof Text) {
    (dom as any).__fiber = fiber;
  }

  if (dom instanceof Text) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = nextProps.nodeValue || "";
    }
    return;
  }

  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      if (fiber.namespaceURI === SVG_NAMESPACE) {
        dom.removeAttribute(name === "className" ? "class" : name);
      } else {
        (dom as any)[name] = "";
      }
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      if (fiber.namespaceURI === SVG_NAMESPACE) {
        if (name === "className") {
          dom.setAttribute("class", nextProps[name]);
        } else if (name.startsWith("xlink:")) {
          dom.setAttributeNS("http://www.w3.org/1999/xlink", name.replace("xlink:", ""), nextProps[name]);
        } else {
          dom.setAttribute(name, nextProps[name]);
        }
      } else {
        if (name === "style" && typeof nextProps[name] === "object") {
          Object.assign((dom as HTMLElement).style, nextProps[name]);
        } else {
          (dom as any)[name] = nextProps[name];
        }
      }
    });
}

function runCleanup(fiber: Fiber | null, isLayout: boolean) {
  if (!fiber) return;
  if (fiber.hooks) {
    fiber.hooks
      .filter((h) => h.tag === (isLayout ? "layoutEffect" : "effect") && h.cleanup)
      .forEach((h) => h.cleanup!());
  }
  runCleanup(fiber.child, isLayout);
  runCleanup(fiber.sibling, isLayout);
}

function runEffects(fiber: Fiber | null, isLayout: boolean) {
  if (!fiber) return;
  if (fiber.hooks) {
    fiber.hooks
      .filter((h) => h.tag === (isLayout ? "layoutEffect" : "effect") && h.hasChangedDeps)
      .forEach((h) => {
        if (h.cleanup) h.cleanup();
        h.cleanup = h.effect!();
      });
  }
  runEffects(fiber.child, isLayout);
  runEffects(fiber.sibling, isLayout);
}

function commitRoot() {
  isHydrating = false;
  deletions.forEach(commitWork);
  
  if (wipRoot) {
    commitWork(wipRoot);
  }

  // Phase 10: Synchronous Layout Effects
  deletions.forEach(f => runCleanup(f, true));
  if (wipRoot) {
    runEffects(wipRoot, true);
  }

  // Phase 10: Asynchronous standard Effects
  const effectsRoot = wipRoot;
  const currentDeletions = deletions;
  setTimeout(() => {
    currentDeletions.forEach(f => runCleanup(f, false));
    if (effectsRoot) {
      runEffects(effectsRoot, false);
    }
  }, 0);

  if (wipRoot && wipRoot.type === "ROOT") {
    currentRoot = wipRoot;
  } else if (wipRoot) {
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

function commitDeletion(fiber: Fiber, domParent: Element | Text) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    let targetParent = domParent;
    if (fiber.type === "PORTAL") {
      targetParent = fiber.props.container;
    }
    
    let child = fiber.child;
    while (child) {
      commitDeletion(child, targetParent);
      child = child.sibling;
    }
  }
}

function commitWork(fiber: Fiber | null) {
  if (!fiber) {
    return;
  }

  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom && domParentFiber.type !== "PORTAL") {
    domParentFiber = domParentFiber.parent;
  }
  
  let domParent: Element | null = null;
  if (domParentFiber && domParentFiber.type === "PORTAL") {
    domParent = domParentFiber.props.container;
  } else if (domParentFiber) {
    domParent = domParentFiber.dom as Element;
  }

  if (domParent) {
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate!.props, fiber.props, fiber);
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "HYDRATE" && fiber.dom != null) {
      updateDom(fiber.dom, {}, fiber.props, fiber);
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
  
  if (fiber !== wipRoot) {
    commitWork(fiber.sibling);
  }
}

const DELEGATED_EVENTS = ["click", "input", "change", "keydown", "keyup", "submit"];

function setupEventDelegation(container: Element | Text) {
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

export function render(element: VNode, container: Element | Text) {
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
    namespaceURI: HTML_NAMESPACE
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
  const isPortal = fiber.type === "PORTAL";
  const isErrorBoundary = fiber.type === "ERROR_BOUNDARY";

  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else if (isFragment || isPortal) {
    updateFragmentOrPortalComponent(fiber);
  } else if (isErrorBoundary) {
    updateErrorBoundaryComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (nextUnitOfWork !== fiber) {
    return nextUnitOfWork;
  }

  if (fiber.child && !fiber.bailsOut) {
    return fiber.child;
  }
  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber === wipRoot) {
      isHydrating = false;
      return null;
    }
    
    if (isHydrating && nextFiber.dom) {
      nextHydratableNode = nextFiber.dom.nextSibling;
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
      namespaceURI: oldChild.namespaceURI
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

function updateErrorBoundaryComponent(fiber: Fiber) {
  if (fiber.error) {
    const fallback = typeof fiber.props.fallback === "function" 
      ? fiber.props.fallback(fiber.error) 
      : fiber.props.fallback;
    reconcileChildren(fiber, [fallback]);
  } else {
    reconcileChildren(fiber, fiber.props.children);
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
    wipFiber = null;
    const children = (Array.isArray(rawChildren) ? rawChildren : [rawChildren])
      .flat(Infinity)
      .map(child => 
        typeof child === "object" 
          ? child 
          : { type: "TEXT_ELEMENT", props: { nodeValue: String(child), children: [] } }
      );
    reconcileChildren(fiber, children as VNode[]);
  } catch (err) {
    wipFiber = null;
    if (err instanceof Promise) {
      let suspenseFiber = fiber.parent;
      while (suspenseFiber && suspenseFiber.type !== Suspense) {
        suspenseFiber = suspenseFiber.parent;
      }

      if (suspenseFiber) {
        reconcileChildren(fiber, [suspenseFiber.props.fallback]);
        err.then(() => {
          wipRoot = {
            dom: currentRoot!.dom,
            props: currentRoot!.props,
            alternate: currentRoot,
            parent: null,
            child: null,
            sibling: null,
            effectTag: "UPDATE",
            type: "ROOT",
            namespaceURI: HTML_NAMESPACE
          };
          nextUnitOfWork = wipRoot;
          deletions = [];
        });
      } else {
        throw err;
      }
    } else {
      let errorFiber = fiber.parent;
      while (errorFiber && errorFiber.type !== "ERROR_BOUNDARY") {
        errorFiber = errorFiber.parent;
      }

      if (errorFiber) {
        errorFiber.error = err;
        
        wipRoot = {
          dom: errorFiber.dom,
          props: errorFiber.props,
          alternate: errorFiber,
          parent: errorFiber.parent,
          child: null,
          sibling: errorFiber.sibling,
          effectTag: "UPDATE",
          type: errorFiber.type,
          hooks: errorFiber.hooks,
          error: err,
          namespaceURI: errorFiber.namespaceURI
        };
        nextUnitOfWork = wipRoot;
        deletions = [];
      } else {
        throw err;
      }
    }
  }
}

function updateFragmentOrPortalComponent(fiber: Fiber) {
  reconcileChildren(fiber, fiber.props.children);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    if (isHydrating) {
      while (
        nextHydratableNode && 
        nextHydratableNode.nodeType === Node.TEXT_NODE && 
        fiber.type !== "TEXT_ELEMENT" &&
        nextHydratableNode.nodeValue?.trim() === ""
      ) {
        nextHydratableNode = nextHydratableNode.nextSibling;
      }

      let matched = false;
      if (nextHydratableNode) {
        const isText = fiber.type === "TEXT_ELEMENT" && nextHydratableNode.nodeType === Node.TEXT_NODE;
        const isElement = typeof fiber.type === "string" && nextHydratableNode.nodeType === Node.ELEMENT_NODE && fiber.type.toLowerCase() === nextHydratableNode.nodeName.toLowerCase();
        
        if (isText || isElement) {
          fiber.dom = nextHydratableNode as any;
          fiber.effectTag = "HYDRATE";
          matched = true;
          nextHydratableNode = fiber.dom!.firstChild;
        }
      }

      if (!matched) {
        isHydrating = false;
        fiber.dom = createDom(fiber);
        fiber.effectTag = "PLACEMENT";
      }
    } else {
      fiber.dom = createDom(fiber);
      fiber.effectTag = "PLACEMENT";
    }
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

  let currentNamespaceURI = wipFiber.namespaceURI;
  if (wipFiber.type === "foreignObject") {
    currentNamespaceURI = HTML_NAMESPACE;
  }

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (!element) continue;

    const key = element.props.key != null ? element.props.key : i;
    const oldFiber = oldFiberMap.get(key);
    let newFiber: Fiber | null = null;

    let namespaceURI = currentNamespaceURI;
    if (element.type === "svg") {
      namespaceURI = SVG_NAMESPACE;
    }

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
        error: oldFiber!.error,
        namespaceURI
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
        namespaceURI
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

export let ssrReadContext: ((context: any) => any) | null = null;
export function setSSRReadContext(fn: any) { ssrReadContext = fn; }

export function useReducer<S, A>(reducer: (state: S, action: A) => S, initialState: S): [S, (action: A) => void] {
  if (!wipFiber) return [initialState, () => {}];

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
      error: currentFiber.error,
      namespaceURI: currentFiber.namespaceURI
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
  if (!wipFiber) return;
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

// Phase 10: Synchronous Layout Effects
export function useLayoutEffect(effect: () => (void | (() => void)), deps?: any[]) {
  if (!wipFiber) return;
  const oldHook =
    wipFiber?.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hasChangedDeps = oldHook
    ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps![i]))
    : true;

  const hook: Hook = {
    tag: "layoutEffect",
    effect,
    deps,
    cleanup: oldHook ? oldHook.cleanup : undefined,
    hasChangedDeps,
  };

  wipFiber!.hooks!.push(hook);
  hookIndex++;
}

export function useMemo<T>(factory: () => T, deps: any[]): T {
  if (!wipFiber) return factory();
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
  if (!wipFiber) {
    if (ssrReadContext) return ssrReadContext(context);
    return context.defaultValue;
  }
  let fiber = wipFiber!.parent;
  while (fiber) {
    if (fiber.type === context.Provider) {
      return fiber.props.value;
    }
    fiber = fiber.parent;
  }
  return context.defaultValue;
}

// Phase 10: Scheduling hooks
export function useTransition(): [boolean, (cb: () => void) => void] {
  if (!wipFiber) return [false, (cb: () => void) => cb()];
  const [isPending, setPending] = useState(false);

  const startTransition = (cb: () => void) => {
    setPending(true);
    // Defer the transition callback to allow the pending state to render first
    setTimeout(() => {
      cb();
      // Defer resetting the pending state so it updates after the callback renders
      setTimeout(() => setPending(false), 0);
    }, 20);
  };

  return [isPending, startTransition];
}

export function useDeferredValue<T>(value: T): T {
  if (!wipFiber) return value;
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    // Schedule low priority update
    const id = setTimeout(() => setDeferredValue(value), 0);
    return () => clearTimeout(id);
  }, [value]);

  return deferredValue;
}

export function hydrateRoot(element: VNode, container: Element | Text) {
  setupEventDelegation(container);
  
  isHydrating = true;
  nextHydratableNode = container.firstChild;

  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
    effectTag: "HYDRATE",
    type: "ROOT",
    namespaceURI: HTML_NAMESPACE
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
}

export const AntigravityReactDOM = {
  render,
  hydrateRoot
};
