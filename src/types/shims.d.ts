declare module 'class-variance-authority' {
  export function cva(...args: any[]): any;
  export type VariantProps<T> = any;
}

declare module '@radix-ui/react-slot' {
  import * as React from 'react';
  export const Slot: React.ComponentType<any>;
}

declare module 'react/jsx-runtime' {
  const jsxRuntime: any;
  export default jsxRuntime;
}

// Light shims for modules that provide their own types but may not be resolved by the linter in this environment
// Removed lucide-react shims after migrating to central icons wrapper

declare module 'react-leaflet' {
  export const MapContainer: any;
  export const TileLayer: any;
  export const LayersControl: any;
  export const ScaleControl: any;
  export const ZoomControl: any;
  export const Marker: any;
  export const Popup: any;
  export const useMap: any;
  export const Circle: any;
  export const WMSTileLayer: any;
  export const Polyline: any;
  export const Tooltip: any;
  export const FeatureGroup: any;
}

declare module 'leaflet' {
  const L: any;
  export = L;
}
// Provide a global namespace for type positions like L.Map used in TSX
declare namespace L {
  type Map = any;
  type FeatureGroup = any;
  type LayerGroup = any;
  type LatLng = any;
}

// Minimal React shim for environments lacking type resolution (with generics)
declare module 'react' {
  export type DependencyList = ReadonlyArray<any>;
  export type EffectCallback = () => void | (() => void);
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prevState: S) => S);
  export function useEffect(effect: EffectCallback, deps?: DependencyList): void;
  export function useMemo<T>(factory: () => T, deps: DependencyList): T;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  const React: any;
  export default React;
}

declare module '@turf/area' {
  const fn: any;
  export default fn;
}
declare module '@turf/distance' {
  const fn: any;
  export default fn;
}
declare module '@turf/boolean-point-in-polygon' {
  const fn: any;
  export default fn;
}
declare module '@turf/helpers' {
  export const polygon: any;
}

// MapLibre and other libs shims for environments without full type resolution
declare module 'maplibre-gl' {
  const m: any;
  export default m;
}
declare module 'jspdf' {
  const c: any;
  export default c;
}
declare module '@turf/intersect' {
  const fn: any;
  export default fn;
}
declare module '@turf/centroid' {
  const fn: any;
  export default fn;
}
declare module '@turf/simplify' {
  const fn: any;
  export default fn;
}
declare module '@turf/buffer' {
  const fn: any;
  export default fn;
}

// Router/query shims to quiet lints in this environment
declare module 'react-router-dom' {
  export const Link: any;
  export const BrowserRouter: any;
  export const Routes: any;
  export const Route: any;
  export const useNavigate: any;
}
declare module '@tanstack/react-query' {
  export const QueryClient: any;
  export const QueryClientProvider: any;
}
declare module '@capacitor/core' {
  export const Capacitor: any;
}
