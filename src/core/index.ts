import { VNode } from "../types";
import { 
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
  memo,
  useTransition,
  useDeferredValue
} from "./dom";
import { render, hydrateRoot } from "./dom";

export const Fragment = "FRAGMENT";
export const ErrorBoundary = "ERROR_BOUNDARY";

function createTextElement(text: string): VNode {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function createElement(type: any, props: any, ...children: any[]): VNode {
  const flatChildren = children
    .flat(Infinity)
    .filter(child => child != null && typeof child !== "boolean");
  
  const mergedChildren: VNode[] = [];
  for (let i = 0; i < flatChildren.length; i++) {
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
      children: mergedChildren,
    },
  };
}

export function createPortal(child: any, container: HTMLElement): VNode {
  return {
    type: "PORTAL",
    props: {
      children: [child],
      container
    }
  };
}

export const AntigravityReact = {
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
  useDeferredValue
};

export const AntigravityReactDOM = {
  render,
  hydrateRoot
};

export { 
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
  memo,
  useTransition,
  useDeferredValue
};
