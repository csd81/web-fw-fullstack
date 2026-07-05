// @bun
// src/core/dom.ts
var nextUnitOfWork = null;
var wipRoot = null;
var currentRoot = null;
var deletions = [];
var wipFiber = null;
var hookIndex = 0;
var isHydrating = false;
var nextHydratableNode = null;
var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
var HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
var isEvent = (key) => key.startsWith("on");
var isProperty = (key) => key !== "children" && !isEvent(key);
var isNew = (prev, next) => (key) => prev[key] !== next[key];
var isGone = (prev, next) => (key) => !(key in next);
function shallowEqual(prev, next) {
  if (prev === next)
    return true;
  if (!prev || !next)
    return false;
  const prevKeys = Object.keys(prev).filter((k) => k !== "children");
  const nextKeys = Object.keys(next).filter((k) => k !== "children");
  if (prevKeys.length !== nextKeys.length)
    return false;
  for (let key of prevKeys) {
    if (prev[key] !== next[key])
      return false;
  }
  return true;
}
function memo(Component, areEqual) {
  return {
    isMemo: true,
    Component,
    areEqual
  };
}
function createDom(fiber) {
  if (fiber.type === "TEXT_ELEMENT") {
    const dom2 = document.createTextNode("");
    updateDom(dom2, {}, fiber.props, fiber);
    return dom2;
  }
  const dom = fiber.namespaceURI === SVG_NAMESPACE ? document.createElementNS(SVG_NAMESPACE, fiber.type) : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props, fiber);
  return dom;
}
function updateDom(dom, prevProps, nextProps, fiber) {
  if (dom instanceof Element || dom instanceof Text) {
    dom.__fiber = fiber;
  }
  if (dom instanceof Text) {
    if (prevProps.nodeValue !== nextProps.nodeValue) {
      dom.nodeValue = nextProps.nodeValue || "";
    }
    return;
  }
  Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach((name) => {
    if (fiber.namespaceURI === SVG_NAMESPACE) {
      dom.removeAttribute(name === "className" ? "class" : name);
    } else {
      dom[name] = "";
    }
  });
  Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach((name) => {
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
        Object.assign(dom.style, nextProps[name]);
      } else {
        dom[name] = nextProps[name];
      }
    }
  });
}
function runCleanup(fiber, isLayout) {
  if (!fiber)
    return;
  if (fiber.hooks) {
    fiber.hooks.filter((h) => h.tag === (isLayout ? "layoutEffect" : "effect") && h.cleanup).forEach((h) => h.cleanup());
  }
  runCleanup(fiber.child, isLayout);
  runCleanup(fiber.sibling, isLayout);
}
function runEffects(fiber, isLayout) {
  if (!fiber)
    return;
  if (fiber.hooks) {
    fiber.hooks.filter((h) => h.tag === (isLayout ? "layoutEffect" : "effect") && h.hasChangedDeps).forEach((h) => {
      if (h.cleanup)
        h.cleanup();
      h.cleanup = h.effect();
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
  deletions.forEach((f) => runCleanup(f, true));
  if (wipRoot) {
    runEffects(wipRoot, true);
  }
  const effectsRoot = wipRoot;
  const currentDeletions = deletions;
  setTimeout(() => {
    currentDeletions.forEach((f) => runCleanup(f, false));
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
function commitDeletion(fiber, domParent) {
  function runUnmountCleanups(f) {
    if (f.hooks) {
      f.hooks.forEach((h) => {
        if ((h.tag === "effect" || h.tag === "layoutEffect") && h.cleanup) {
          h.cleanup();
        }
      });
    }
    let child = f.child;
    while (child) {
      runUnmountCleanups(child);
      child = child.sibling;
    }
  }
  runUnmountCleanups(fiber);
  function removeDom(f, parent) {
    if (f.dom) {
      parent.removeChild(f.dom);
    } else {
      let targetParent = parent;
      if (f.type === "PORTAL") {
        targetParent = f.props.container;
      }
      let child = f.child;
      while (child) {
        removeDom(child, targetParent);
        child = child.sibling;
      }
    }
  }
  removeDom(fiber, domParent);
}
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  let domParentFiber = fiber.parent;
  while (domParentFiber && !domParentFiber.dom && domParentFiber.type !== "PORTAL") {
    domParentFiber = domParentFiber.parent;
  }
  let domParent = null;
  if (domParentFiber && domParentFiber.type === "PORTAL") {
    domParent = domParentFiber.props.container;
  } else if (domParentFiber) {
    domParent = domParentFiber.dom;
  }
  if (domParent) {
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
      domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props, fiber);
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
function workLoop(deadline) {
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
    setTimeout(() => workLoop({ timeRemaining: () => 1, didTimeout: false }), 1);
  }
}
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(workLoop);
} else {
  setTimeout(() => workLoop({ timeRemaining: () => 1, didTimeout: false }), 1);
}
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function || typeof fiber.type === "object" && fiber.type !== null && (fiber.type.isMemo || fiber.type.isForwardRef);
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
  let nextFiber = fiber;
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
var Suspense = function Suspense2(props) {
  return props.children;
};
function cloneChildren(fiber) {
  if (!fiber.alternate)
    return;
  let oldChild = fiber.alternate.child;
  let prevSibling = null;
  while (oldChild) {
    const newChild = {
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
function updateErrorBoundaryComponent(fiber) {
  if (fiber.error) {
    const fallback = typeof fiber.props.fallback === "function" ? fiber.props.fallback(fiber.error) : fiber.props.fallback;
    reconcileChildren(fiber, [fallback]);
  } else {
    reconcileChildren(fiber, fiber.props.children);
  }
}
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const isMemo = typeof fiber.type === "object" && fiber.type.isMemo;
  const ComponentObj = isMemo ? fiber.type.Component : fiber.type;
  const isForwardRef = typeof ComponentObj === "object" && ComponentObj.isForwardRef;
  const Component = isForwardRef ? ComponentObj.render : ComponentObj;
  let shouldUpdate = true;
  if (isMemo && fiber.alternate) {
    const areEqual = fiber.type.areEqual || shallowEqual;
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
    let rawChildren = isForwardRef ? Component(fiber.props, fiber.props.ref) : Component(fiber.props);
    wipFiber = null;
    const children = (Array.isArray(rawChildren) ? rawChildren : [rawChildren]).flat(Infinity).map((child) => typeof child === "object" ? child : { type: "TEXT_ELEMENT", props: { nodeValue: String(child), children: [] } });
    reconcileChildren(fiber, children);
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
            dom: currentRoot.dom,
            props: currentRoot.props,
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
function updateFragmentOrPortalComponent(fiber) {
  reconcileChildren(fiber, fiber.props.children);
}
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    if (isHydrating) {
      while (nextHydratableNode && nextHydratableNode.nodeType === Node.TEXT_NODE && fiber.type !== "TEXT_ELEMENT" && nextHydratableNode.nodeValue?.trim() === "") {
        nextHydratableNode = nextHydratableNode.nextSibling;
      }
      let matched = false;
      if (nextHydratableNode) {
        const isText = fiber.type === "TEXT_ELEMENT" && nextHydratableNode.nodeType === Node.TEXT_NODE;
        const isElement = typeof fiber.type === "string" && nextHydratableNode.nodeType === Node.ELEMENT_NODE && fiber.type.toLowerCase() === nextHydratableNode.nodeName.toLowerCase();
        if (isText || isElement) {
          fiber.dom = nextHydratableNode;
          fiber.effectTag = "HYDRATE";
          matched = true;
          nextHydratableNode = fiber.dom.firstChild;
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
function reconcileChildren(wipFiber2, elements) {
  const oldFiberMap = new Map;
  let currentOldFiber = wipFiber2.alternate?.child;
  let oldIndex = 0;
  while (currentOldFiber) {
    const key = currentOldFiber.props.key != null ? currentOldFiber.props.key : oldIndex;
    oldFiberMap.set(key, currentOldFiber);
    currentOldFiber = currentOldFiber.sibling;
    oldIndex++;
  }
  let prevSibling = null;
  let currentNamespaceURI = wipFiber2.namespaceURI;
  if (wipFiber2.type === "foreignObject") {
    currentNamespaceURI = HTML_NAMESPACE;
  }
  for (let i = 0;i < elements.length; i++) {
    const element = elements[i];
    if (!element)
      continue;
    const key = element.props.key != null ? element.props.key : i;
    const oldFiber = oldFiberMap.get(key);
    let newFiber = null;
    let namespaceURI = currentNamespaceURI;
    if (element.type === "svg") {
      namespaceURI = SVG_NAMESPACE;
    }
    const sameType = oldFiber && element.type === oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber2,
        child: null,
        sibling: null,
        alternate: oldFiber,
        effectTag: "UPDATE",
        error: oldFiber.error,
        namespaceURI
      };
      oldFiberMap.delete(key);
    } else {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber2,
        child: null,
        sibling: null,
        alternate: null,
        effectTag: "PLACEMENT",
        namespaceURI
      };
    }
    if (i === 0) {
      wipFiber2.child = newFiber;
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
var ssrReadContext = null;
function setSSRReadContext(fn) {
  ssrReadContext = fn;
}
function useReducer(reducer, initialState) {
  if (!wipFiber)
    return [initialState, () => {}];
  const oldHook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hook = {
    tag: "state",
    state: oldHook ? oldHook.state : initialState,
    queue: []
  };
  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = reducer(hook.state, action);
  });
  const currentFiber = wipFiber;
  const dispatch = (action) => {
    hook.queue.push(action);
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
  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, dispatch];
}
function useState(initial) {
  return useReducer((state, action) => {
    return typeof action === "function" ? action(state) : action;
  }, initial);
}
function useEffect(effect, deps) {
  if (!wipFiber)
    return;
  const oldHook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hasChangedDeps = oldHook ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i])) : true;
  const hook = {
    tag: "effect",
    effect,
    deps,
    cleanup: oldHook ? oldHook.cleanup : undefined,
    hasChangedDeps
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
}
function useLayoutEffect(effect, deps) {
  if (!wipFiber)
    return;
  const oldHook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hasChangedDeps = oldHook ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i])) : true;
  const hook = {
    tag: "layoutEffect",
    effect,
    deps,
    cleanup: oldHook ? oldHook.cleanup : undefined,
    hasChangedDeps
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
}
function useMemo(factory, deps) {
  if (!wipFiber)
    return factory();
  const oldHook = wipFiber?.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
  const hasChangedDeps = oldHook ? !deps || deps.some((dep, i) => !Object.is(dep, oldHook.deps[i])) : true;
  const hook = {
    tag: "memo",
    state: hasChangedDeps ? factory() : oldHook.state,
    deps
  };
  wipFiber.hooks.push(hook);
  hookIndex++;
  return hook.state;
}
function useCallback(callback, deps) {
  return useMemo(() => callback, deps);
}
function useRef(initialValue) {
  return useMemo(() => ({ current: initialValue }), []);
}
function createContext(defaultValue) {
  const context = {
    Provider: function Provider(props) {
      return props.children;
    },
    defaultValue
  };
  context.Provider.context = context;
  return context;
}
function useContext(context) {
  if (!wipFiber) {
    if (ssrReadContext)
      return ssrReadContext(context);
    return context.defaultValue;
  }
  let fiber = wipFiber.parent;
  while (fiber) {
    if (fiber.type === context.Provider) {
      return fiber.props.value;
    }
    fiber = fiber.parent;
  }
  return context.defaultValue;
}
function useTransition() {
  if (!wipFiber)
    return [false, (cb) => cb()];
  const [isPending, setPending] = useState(false);
  const startTransition = (cb) => {
    setPending(true);
    setTimeout(() => {
      cb();
      setTimeout(() => setPending(false), 0);
    }, 20);
  };
  return [isPending, startTransition];
}
function useDeferredValue(value) {
  if (!wipFiber)
    return value;
  const [deferredValue, setDeferredValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDeferredValue(value), 0);
    return () => clearTimeout(id);
  }, [value]);
  return deferredValue;
}
function forwardRef(render) {
  return {
    isForwardRef: true,
    render
  };
}
function useImperativeHandle(ref, createHandle, deps) {
  useLayoutEffect(() => {
    if (typeof ref === "function") {
      ref(createHandle());
      return () => ref(null);
    } else if (ref) {
      ref.current = createHandle();
      return () => {
        ref.current = null;
      };
    }
  }, deps);
}

// src/core/index.ts
var Fragment = "FRAGMENT";
var ErrorBoundary = "ERROR_BOUNDARY";
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}
function createElement(type, props, ...children) {
  const flatChildren = children.flat(Infinity).filter((child) => child != null && typeof child !== "boolean");
  const mergedChildren = [];
  for (let i = 0;i < flatChildren.length; i++) {
    const child = flatChildren[i];
    if (typeof child === "object" && child !== null) {
      mergedChildren.push(child);
    } else {
      let text = String(child);
      while (i + 1 < flatChildren.length && (typeof flatChildren[i + 1] !== "object" || flatChildren[i + 1] === null)) {
        text += String(flatChildren[++i]);
      }
      mergedChildren.push(createTextElement(text));
    }
  }
  return {
    type,
    props: {
      ...props,
      children: mergedChildren
    }
  };
}
function createPortal(child, container) {
  return {
    type: "PORTAL",
    props: {
      children: [child],
      container
    }
  };
}
var AntigravityReact = {
  createElement,
  useState,
  useEffect,
  useLayoutEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
  Suspense,
  Fragment,
  memo,
  ErrorBoundary,
  createPortal,
  useTransition,
  useDeferredValue,
  forwardRef,
  useImperativeHandle
};

// src/server/index.ts
var contextStack = new Map;
setSSRReadContext((context) => {
  const stack = contextStack.get(context);
  if (stack && stack.length > 0) {
    return stack[stack.length - 1];
  }
  return context.defaultValue;
});
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function renderToString(element) {
  if (element == null || typeof element === "boolean") {
    return "";
  }
  if (typeof element === "string" || typeof element === "number") {
    return escapeHtml(String(element));
  }
  if (Array.isArray(element)) {
    return element.map(renderToString).join("");
  }
  const { type, props } = element;
  if (type === "TEXT_ELEMENT") {
    return escapeHtml(String(props.nodeValue || ""));
  }
  if (type === "FRAGMENT" || type === "ERROR_BOUNDARY" || type === "PORTAL") {
    return renderToString(props.children);
  }
  const isMemo = typeof type === "object" && type.isMemo;
  if (typeof type === "function" || isMemo) {
    const Component = isMemo ? type.Component : type;
    if (Component.context) {
      const contextObj = Component.context;
      if (!contextStack.has(contextObj))
        contextStack.set(contextObj, []);
      contextStack.get(contextObj).push(props.value);
      const childrenHtml = renderToString(props.children);
      contextStack.get(contextObj).pop();
      return childrenHtml;
    }
    const children = Component(props);
    return renderToString(children);
  }
  const tag = type;
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
      const styleStr = Object.keys(props[key]).map((k) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${props[key][k]}`).join(";");
      attrs += ` style="${escapeHtml(styleStr)}"`;
    } else {
      attrs += ` ${key}="${escapeHtml(String(props[key]))}"`;
    }
  }
  const voidElements = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
  if (voidElements.has(tag)) {
    return `<${tag}${attrs}/>`;
  }
  return `<${tag}${attrs}>${html}</${tag}>`;
}

// src/pages/index.tsx
function IndexPage() {
  const [count, setCount] = useState(0);
  return /* @__PURE__ */ AntigravityReact.createElement("div", {
    style: "padding: 20px; font-family: sans-serif;"
  }, /* @__PURE__ */ AntigravityReact.createElement("h1", null, "Welcome to fullstack.js! \uD83D\uDE80"), /* @__PURE__ */ AntigravityReact.createElement("p", null, "This page is rendered on the server and hydrated on the client."), /* @__PURE__ */ AntigravityReact.createElement("button", {
    onClick: () => setCount(count + 1),
    style: "padding: 10px; cursor: pointer;"
  }, "Click me! Count: ", count));
}

// src/framework/server.ts
function handleRequest() {
  const html = renderToString(AntigravityReact.createElement(IndexPage, null));
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>fullstack.js</title>
  </head>
  <body>
    <div id="root">${html}</div>
    <script type="module" src="/_fullstack/client.js"></script>
  </body>
</html>`;
}
export {
  handleRequest
};
