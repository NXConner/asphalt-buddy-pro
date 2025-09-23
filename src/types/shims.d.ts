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
declare module "lucide-react" {
  export const Palette: any
  export const Upload: any
  export const Volume2: any
  export const Bell: any
  export const Monitor: any
  export const Sun: any
  export const Moon: any
  export const Zap: any
  export const Image: any
  export const Music: any
  export const Download: any
  export const Trash2: any
  export const Play: any
  export const Pause: any
  export const Settings: any
  export const Eye: any
  export const Camera: any
  export const Sparkles: any
  export const RefreshCw: any
  export const Save: any
}

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
