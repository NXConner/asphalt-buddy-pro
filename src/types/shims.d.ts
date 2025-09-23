declare module "class-variance-authority" {
  export function cva(...args: any[]): any
  export type VariantProps<T> = any
}

declare module "@radix-ui/react-slot" {
  import * as React from "react"
  export const Slot: React.ComponentType<any>
}

declare module "react/jsx-runtime" {
  const jsxRuntime: any
  export default jsxRuntime
}

// Light shims for modules that provide their own types but may not be resolved by the linter in this environment
// Removed lucide-react shims after migrating to central icons wrapper

declare module "react-leaflet" {
  export const MapContainer: any
  export const TileLayer: any
  export const LayersControl: any
  export const ScaleControl: any
  export const ZoomControl: any
  export const Marker: any
  export const Popup: any
  export const useMap: any
  export const Circle: any
  export const WMSTileLayer: any
  export const Polyline: any
  export const Tooltip: any
}

declare module "leaflet" {
  const L: any
  export = L
}

declare module "@turf/area" { const fn: any; export default fn }
declare module "@turf/distance" { const fn: any; export default fn }
declare module "@turf/boolean-point-in-polygon" { const fn: any; export default fn }
declare module "@turf/helpers" { export const polygon: any }
