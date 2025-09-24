// React type fixes for compatibility
import * as React from 'react';

declare module 'react' {
  export const forwardRef: <T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null
  ) => (props: P & React.RefAttributes<T>) => React.ReactElement | null;
  
  export type ElementRef<T> = any;
  export type ComponentPropsWithoutRef<T> = any;
  export type HTMLAttributes<T> = any;
  export type ButtonHTMLAttributes<T> = any;
  export type ComponentProps<T> = any;
  export type ReactNode = any;
  export type ComponentType<P = {}> = any;
  export type KeyboardEvent<T = Element> = any;
  export type CSSProperties = any;
  
  export const createContext: <T>(defaultValue: T) => React.Context<T>;
  export const useContext: <T>(context: React.Context<T>) => T;
  export const useCallback: <T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
  ) => T;
  export const useId: () => string;
}