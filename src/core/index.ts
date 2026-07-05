import { VNode } from "../types";
import { useState, useEffect, useReducer, useMemo, useCallback, useRef, createContext, useContext, Suspense } from "./dom";

export const Fragment = "FRAGMENT";

function createTextElement(text: string): VNode {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

export function createElement(type: string | Function, props: any, ...children: any[]): VNode {
  const flatChildren = children.flat(Infinity);
  
  return {
    type,
    props: {
      ...props,
      children: flatChildren.map((child) =>
        typeof child === "object" ? child : createTextElement(String(child))
      ),
    },
  };
}

export const AntigravityReact = {
  createElement,
  useState,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
  createContext,
  useContext,
  Suspense,
  Fragment
};

export { useState, useEffect, useReducer, useMemo, useCallback, useRef, createContext, useContext, Suspense };
