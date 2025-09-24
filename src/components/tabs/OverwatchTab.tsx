import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { GeocodeResult, searchAddress } from '@/lib/geocode';
import { detectAsphalt, type Bbox, type DetectResponse } from '@/lib/asphalt';
import { Search } from '@/components/icons';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';
import area from '@turf/area';
import { polygon as turfPolygon } from '@turf/helpers';
import jsPDF from 'jspdf';
import intersect from '@turf/intersect';
import centroid from '@turf/centroid';
import simplify from '@turf/simplify';
import buffer from '@turf/buffer';

type MapProvider = 'google_sat' | 'google_road' | 'osm' | 'county' | 'satellite' | 'streets' | 'esri';
type MapMode = 'operational' | 'ai_detection';

export function OverwatchTab() {
  const { toast } = useToast();
  const [mode, setMode] = useState<MapMode>('operational');
  const [provider, setProvider] = useState<MapProvider>('google_sat');
  const [lastBaseProvider, setLastBaseProvider] = useState<Exclude<MapProvider, 'county'>>('google_sat');
  const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [aiMap, setAiMap] = useState<maplibregl.Map | null>(null);
  const [totals, setTotals] = useState<{ areaSqM: number; lengthM: number }>({ areaSqM: 0, lengthM: 0 });
  const [radiusM, setRadiusM] = useState<number>(5000);
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [radarFrames, setRadarFrames] = useState<string[]>([]);
  const [radarIdx, setRadarIdx] = useState<number>(0);
  const [radarPlaying, setRadarPlaying] = useState<boolean>(false);
  const [radarSpeedMs, setRadarSpeedMs] = useState<number>(500);
  const [etaText, setEtaText] = useState<string>('');
  const [tips, setTips] = useState<string[]>([]);
  const [trackingActive, setTrackingActive] = useState<boolean>(localStorage.getItem('bgTrackingEnabled') === 'true');
  const [lastSyncTs, setLastSyncTs] = useState<number | null>(null);
  const [etaObj, setEtaObj] = useState<{ nextStart?: Date; nextStop?: Date; currentIntensityMmPerH?: number }>({});
  const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
  const [detectAbort, setDetectAbort] = useState<AbortController | null>(null);

  // AI Detection features
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectResponse | null>(null);
  const [selectedBbox, setSelectedBbox] = useState<Bbox | null>(null);
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [thickness, setThickness] = useState<number>(2);
  const [density, setDensity] = useState<number>(145);
  const [showFill, setShowFill] = useState<boolean>(true);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [showHeat, setShowHeat] = useState<boolean>(false);
  const [baseStyle, setBaseStyle] = useState<'satellite' | 'streets' | 'osm' | 'esri'>('satellite');
  const [minAreaInput, setMinAreaInput] = useState<number>(0);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [smoothingTolerance, setSmoothingTolerance] = useState<number>(0);
  const [holeFillMeters, setHoleFillMeters] = useState<number>(0);

  const [countyLayers, setCountyLayers] = useState(() => {
    const defaults = {
      patrickVA: {
        label: "Patrick County, VA",
        url: import.meta.env?.VITE_WMS_PATRICK_URL || "",
        layers: import.meta.env?.VITE_WMS_PATRICK_LAYERS || "",
        version: import.meta.env?.VITE_WMS_PATRICK_VERSION || "1.3.0",
        styles: import.meta.env?.VITE_WMS_PATRICK_STYLES || "",
        enabled: Boolean(import.meta.env?.VITE_WMS_PATRICK_URL && import.meta.env?.VITE_WMS_PATRICK_LAYERS)
      },
      henryVA: {
        label: "Henry County, VA",
        url: import.meta.env?.VITE_WMS_HENRY_URL || "",
        layers: import.meta.env?.VITE_WMS_HENRY_LAYERS || "",
        version: import.meta.env?.VITE_WMS_HENRY_VERSION || "1.3.0",
        styles: import.meta.env?.VITE_WMS_HENRY_STYLES || "",
        enabled: Boolean(import.meta.env?.VITE_WMS_HENRY_URL && import.meta.env?.VITE_WMS_HENRY_LAYERS)
      },
      stokesNC: {
        label: "Stokes County, NC",
        url: import.meta.env?.VITE_WMS_STOKES_URL || "",
        layers: import.meta.env?.VITE_WMS_STOKES_LAYERS || "",
        version: import.meta.env?.VITE_WMS_STOKES_VERSION || "1.3.0",
        styles: import.meta.env?.VITE_WMS_STOKES_STYLES || "",
        enabled: Boolean(import.meta.env?.VITE_WMS_STOKES_URL && import.meta.env?.VITE_WMS_STOKES_LAYERS)
      },
      surryNC: {
        label: "Surry County, NC",
        url: import.meta.env?.VITE_WMS_SURRY_URL || "",
        layers: import.meta.env?.VITE_WMS_SURRY_LAYERS || "",
        version: import.meta.env?.VITE_WMS_SURRY_VERSION || "1.3.0",
        styles: import.meta.env?.VITE_WMS_SURRY_STYLES || "",
        enabled: Boolean(import.meta.env?.VITE_WMS_SURRY_URL && import.meta.env?.VITE_WMS_SURRY_LAYERS)
      }
    };
    try {
      const stored = localStorage.getItem('overwatch.countyLayers');
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const aiMapContainerRef = useRef<HTMLDivElement>(null);
  const patrickGroupRef = useRef<L.LayerGroup | null>(null);
  const henryGroupRef = useRef<L.LayerGroup | null>(null);
  const stokesGroupRef = useRef<L.LayerGroup | null>(null);
  const surryGroupRef = useRef<L.LayerGroup | null>(null);

  // Employee playback demo data and state
  type EmployeePathPoint = { lat: number; lng: number; t: number };
  type Employee = {
    id: string;
    name: string;
    status: 'off' | 'on_shift' | 'driving' | 'onsite';
    workHoursToday: string;
    phone: string;
    emergencyContact: string;
    licenseUrl?: string;
    validLicense: boolean;
    path: EmployeePathPoint[];
  };

  const [employees] = useState<Employee[]>(() => {
    const base = { lat: 36.5859718, lng: -79.86153 };
    const now = Date.now();
    function pt(dNorthM: number, dEastM: number, minutesAgo: number): EmployeePathPoint {
      const dLat = dNorthM / 111320;
      const dLng = dEastM / (111320 * Math.cos((base.lat * Math.PI) / 180));
      return { lat: base.lat + dLat, lng: base.lng + dLng, t: now - minutesAgo * 60_000 };
    }
    return [
      {
        id: 'e1',
        name: 'Alex Johnson',
        status: 'driving',
        workHoursToday: '6h 12m',
        phone: '(555) 123-4567',
        emergencyContact: 'Sam (555) 234-5678',
        validLicense: true,
        path: [
          pt(0, 0, 60),
          pt(300, 200, 45),
          pt(800, 350, 30),
          pt(1200, 500, 15),
          pt(1600, 800, 0),
        ],
      },
    ];
  });

  // Save county layers to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('overwatch.countyLayers', JSON.stringify(countyLayers));
    } catch {
      // ignore
    }
  }, [countyLayers]);

  // Map overlay event handlers for operational mode
  useEffect(() => {
    if (!map) return;
    function onAdd(e: any) {
      if (e.layer === patrickGroupRef.current)
        setCountyLayers((s) => ({ ...s, patrickVA: { ...s.patrickVA, enabled: true } }));
      if (e.layer === henryGroupRef.current)
        setCountyLayers((s) => ({ ...s, henryVA: { ...s.henryVA, enabled: true } }));
      if (e.layer === stokesGroupRef.current)
        setCountyLayers((s) => ({ ...s, stokesNC: { ...s.stokesNC, enabled: true } }));
      if (e.layer === surryGroupRef.current)
        setCountyLayers((s) => ({ ...s, surryNC: { ...s.surryNC, enabled: true } }));
    }
    function onRemove(e: any) {
      if (e.layer === patrickGroupRef.current)
        setCountyLayers((s) => ({ ...s, patrickVA: { ...s.patrickVA, enabled: false } }));
      if (e.layer === henryGroupRef.current)
        setCountyLayers((s) => ({ ...s, henryVA: { ...s.henryVA, enabled: false } }));
      if (e.layer === stokesGroupRef.current)
        setCountyLayers((s) => ({ ...s, stokesNC: { ...s.stokesNC, enabled: false } }));
      if (e.layer === surryGroupRef.current)
        setCountyLayers((s) => ({ ...s, surryNC: { ...s.surryNC, enabled: false } }));
    }
    map.on('overlayadd', onAdd);
    map.on('overlayremove', onRemove);
    return () => {
      map.off('overlayadd', onAdd);
      map.off('overlayremove', onRemove);
    };
  }, [map]);

  // Ensure map reflects external checkbox state by adding/removing LayerGroups
  useEffect(() => {
    if (!map || !patrickGroupRef.current) return;
    const layer = patrickGroupRef.current;
    const has = map.hasLayer(layer);
    if (countyLayers.patrickVA.enabled && !has) map.addLayer(layer);
    if (!countyLayers.patrickVA.enabled && has) map.removeLayer(layer);
  }, [map, countyLayers.patrickVA.enabled]);

  useEffect(() => {
    if (!map || !henryGroupRef.current) return;
    const layer = henryGroupRef.current;
    const has = map.hasLayer(layer);
    if (countyLayers.henryVA.enabled && !has) map.addLayer(layer);
    if (!countyLayers.henryVA.enabled && has) map.removeLayer(layer);
  }, [map, countyLayers.henryVA.enabled]);

  useEffect(() => {
    if (!map || !stokesGroupRef.current) return;
    const layer = stokesGroupRef.current;
    const has = map.hasLayer(layer);
    if (countyLayers.stokesNC.enabled && !has) map.addLayer(layer);
    if (!countyLayers.stokesNC.enabled && has) map.removeLayer(layer);
  }, [map, countyLayers.stokesNC.enabled]);

  useEffect(() => {
    if (!map || !surryGroupRef.current) return;
    const layer = surryGroupRef.current;
    const has = map.hasLayer(layer);
    if (countyLayers.surryNC.enabled && !has) map.addLayer(layer);
    if (!countyLayers.surryNC.enabled && has) map.removeLayer(layer);
  }, [map, countyLayers.surryNC.enabled]);

  // AI Detection calculations
  const minAreaM2 = useMemo(() => {
    const val = Number(minAreaInput) || 0;
    return units === 'metric' ? val : val / 10.7639; // ft² -> m²
  }, [minAreaInput, units]);

  const areaTotals = useMemo(() => {
    if (!detectionResults) return { perM2: [] as number[], totalM2: 0 };
    try {
      const perM2Raw = detectionResults.polygons.map((poly) => {
        const ring: [number, number][] = poly.map((p) => [p.lon, p.lat]);
        if (ring.length > 0) {
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            ring.push([first[0], first[1]]);
          }
        }
        const feature = turfPolygon([ring]);
        return area(feature);
      });
      const perM2 = perM2Raw.filter((a) => (Number.isFinite(a) ? a : 0) >= minAreaM2);
      const totalM2 = perM2.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
      return { perM2, totalM2 };
    } catch {
      return { perM2: [], totalM2: 0 };
    }
  }, [detectionResults, minAreaM2]);

  const formattedTotals = useMemo(() => {
    const m2 = areaTotals.totalM2;
    if (units === 'metric') {
      return {
        areaPrimary: `${m2.toFixed(0)} m²`,
        areaSecondary: `${(m2 / 10000).toFixed(2)} ha`,
      };
    }
    const sqft = m2 * 10.7639;
    const acres = m2 / 4046.8564224;
    return {
      areaPrimary: `${sqft.toFixed(0)} sq ft`,
      areaSecondary: `${acres.toFixed(2)} acres`,
    };
  }, [areaTotals.totalM2, units]);

  const computedMaterials = useMemo(() => {
    const m2 = areaTotals.totalM2;
    if (m2 <= 0) return { volume: 0, tonnage: 0 };
    if (units === 'metric') {
      const thicknessM = (thickness || 0) / 100;
      const volumeM3 = m2 * thicknessM;
      const tons = volumeM3 * (density || 0);
      return { volume: volumeM3, tonnage: tons };
    }
    const sqft = m2 * 10.7639;
    const thicknessFt = (thickness || 0) / 12;
    const volumeFt3 = sqft * thicknessFt;
    const pounds = volumeFt3 * (density || 0);
    const shortTons = pounds / 2000;
    return { volume: volumeFt3, tonnage: shortTons };
  }, [areaTotals.totalM2, thickness, density, units]);

  // Build free raster styles for MapLibre
  function buildStyle(base: 'satellite' | 'streets' | 'osm' | 'esri') {
    if (base === 'satellite') {
      return {
        version: 8,
        sources: {
          esri: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
            attribution: 'Tiles © Esri',
          },
        },
        layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
      } as any;
    }
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    } as any;
  }

  // Initialize AI map for detection mode
  useEffect(() => {
    if (mode !== 'ai_detection' || !aiMapContainerRef.current) return;

    const styleObj = buildStyle(baseStyle);
    const newAiMap = new maplibregl.Map({
      container: aiMapContainerRef.current,
      style: styleObj as any,
      center: [-74.006, 40.7128],
      zoom: 15,
    });

    newAiMap.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add drawing capabilities for area selection
    let isDrawing = false;
    let startPoint: any | null = null;

    function ensureSelectionLayers() {
      if (!newAiMap) return;
      if (!newAiMap.getSource('selection-rect-src')) {
        newAiMap.addSource('selection-rect-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        } as any);
      }
      if (!newAiMap.getLayer('selection-rect-fill')) {
        newAiMap.addLayer({
          id: 'selection-rect-fill',
          type: 'fill',
          source: 'selection-rect-src',
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 },
        });
      }
      if (!newAiMap.getLayer('selection-rect-line')) {
        newAiMap.addLayer({
          id: 'selection-rect-line',
          type: 'line',
          source: 'selection-rect-src',
          paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [2, 2] },
        });
      }
    }

    function updateSelectionRect(a: any, b: any) {
      if (!newAiMap) return;
      ensureSelectionLayers();
      const west = Math.min(a.lng, b.lng);
      const east = Math.max(a.lng, b.lng);
      const south = Math.min(a.lat, b.lat);
      const north = Math.max(a.lat, b.lat);
      const ring: [number, number][] = [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ];
      const gj = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [ring] },
          },
        ],
      } as any;
      const src = newAiMap.getSource('selection-rect-src') as any;
      if (src && src.setData) src.setData(gj);
    }

    function clearSelectionRect() {
      if (!newAiMap) return;
      const src = newAiMap.getSource('selection-rect-src') as any;
      if (src && src.setData) src.setData({ type: 'FeatureCollection', features: [] } as any);
    }

    newAiMap.on('mousedown', (e: any) => {
      if (e.originalEvent.shiftKey) {
        isDrawing = true;
        startPoint = e.lngLat;
        newAiMap.getCanvas().style.cursor = 'crosshair';
        clearSelectionRect();
      }
    });

    newAiMap.on('mousemove', (e: any) => {
      if (!isDrawing || !startPoint) return;
      updateSelectionRect(startPoint, e.lngLat);
    });

    newAiMap.on('mouseup', (e: any) => {
      if (!isDrawing || !startPoint) return;

      isDrawing = false;
      newAiMap.getCanvas().style.cursor = '';

      const endPoint = e.lngLat;
      const bbox: Bbox = {
        south: Math.min(startPoint.lat, endPoint.lat),
        north: Math.max(startPoint.lat, endPoint.lat),
        west: Math.min(startPoint.lng, endPoint.lng),
        east: Math.max(startPoint.lng, endPoint.lng),
      };

      setSelectedBbox(bbox);
      updateSelectionRect(startPoint, endPoint);
      toast({
        title: 'Area Selected',
        description: "Click 'Detect Asphalt' to analyze this area.",
      });
    });

    setAiMap(newAiMap);

    return () => {
      newAiMap.remove();
      setAiMap(null);
    };
  }, [mode, baseStyle]);

  // Handle asphalt detection
  const handleDetectAsphalt = async () => {
    if (!selectedBbox) {
      toast({
        title: 'No Area Selected',
        description: 'Hold Shift and drag to select an area first.',
        variant: 'destructive',
      });
      return;
    }

    setIsDetecting(true);
    try {
      const results = await detectAsphalt(selectedBbox);
      setDetectionResults(results);

      toast({
        title: 'Detection Complete',
        description: `Found ${results.count} asphalt areas.`,
      });
    } catch (error) {
      toast({
        title: 'Detection Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Export functions
  function exportGeoJSON() {
    if (!detectionResults) return;
    const gj = {
      type: 'FeatureCollection' as const,
      features: detectionResults.polygons.map((polygon, index) => ({
        type: 'Feature' as const,
        properties: {
          id: index,
          area_m2: (() => {
            try {
              const ring = polygon.map((p) => [p.lon, p.lat] as [number, number]);
              const first = ring[0];
              const last = ring[ring.length - 1];
              if (first && (first[0] !== last[0] || first[1] !== last[1]))
                ring.push([first[0], first[1]]);
              return area(turfPolygon([ring]));
            } catch {
              return 0;
            }
          })(),
        },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polygon.map((point) => [point.lon, point.lat])],
        },
      })),
    };
    const blob = new Blob([JSON.stringify(gj, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt-detections-${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OverWatch - Operational Map & AI Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <Button
                variant={mode === 'operational' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('operational')}
              >
                Operational Mode
              </Button>
              <Button
                variant={mode === 'ai_detection' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('ai_detection')}
              >
                AI Detection Mode
              </Button>
            </div>

            {mode === 'operational' && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Location</Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Enter address or coordinates..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={() => {}} 
                    disabled={!query.trim() || searching}
                    className="mt-6"
                  >
                    Search
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={provider === 'google_sat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProvider('google_sat')}
                  >
                    Satellite
                  </Button>
                  <Button
                    variant={provider === 'google_road' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProvider('google_road')}
                  >
                    Street
                  </Button>
                  <Button
                    variant={provider === 'osm' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProvider('osm')}
                  >
                    OpenStreetMap
                  </Button>
                  <Button
                    variant={provider === 'county' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProvider('county')}
                  >
                    County Data
                  </Button>
                </div>

                {/* County Layers Controls */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(countyLayers).map(([key, layer]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={(layer as any).enabled}
                      onCheckedChange={(checked) => {
                        setCountyLayers(prev => ({
                          ...prev,
                          [key]: { ...prev[key as keyof typeof prev], enabled: Boolean(checked) }
                        }));
                      }}
                    />
                    <Label htmlFor={key} className="text-sm">{(layer as any).label}</Label>
                  </div>
                ))}
                </div>

                {/* Operational Map Container */}
                <div 
                  ref={mapContainerRef}
                  className="w-full h-96 border rounded-lg bg-gray-100 dark:bg-gray-800"
                >
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Operational map will be displayed here
                  </div>
                </div>

                {/* Tracking Controls */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="tracking"
                      checked={trackingActive}
                      onCheckedChange={(checked) => {
                        setTrackingActive(Boolean(checked));
                        localStorage.setItem('bgTrackingEnabled', String(checked));
                      }}
                    />
                    <Label htmlFor="tracking">Enable Background Tracking</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="alerts"
                      checked={alertsEnabled}
                      onCheckedChange={(checked) => setAlertsEnabled(Boolean(checked))}
                    />
                    <Label htmlFor="alerts">Weather Alerts</Label>
                  </div>
                </div>
              </>
            )}

            {mode === 'ai_detection' && (
              <>
                {/* AI Detection Controls */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={handleDetectAsphalt}
                    disabled={isDetecting || !selectedBbox}
                    className="flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {isDetecting ? 'Detecting...' : 'Detect Asphalt'}
                  </Button>

                  {selectedBbox && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBbox(null)}
                      className="flex items-center gap-2"
                    >
                      ⬛ Clear Selection
                    </Button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs">Units</Label>
                    <select
                      value={units}
                      onChange={(e) => setUnits(e.target.value as 'imperial' | 'metric')}
                      className="border rounded px-2 py-1 bg-background text-xs"
                    >
                      <option value="imperial">Imperial (ft²)</option>
                      <option value="metric">Metric (m²)</option>
                    </select>
                    <Label className="text-xs ml-2">Base</Label>
                    <select
                      value={baseStyle}
                      onChange={(e) =>
                        setBaseStyle(e.target.value as 'satellite' | 'streets' | 'osm' | 'esri')
                      }
                      className="border rounded px-2 py-1 bg-background text-xs"
                    >
                      <option value="satellite">Satellite</option>
                      <option value="streets">Streets</option>
                      <option value="osm">OpenStreetMap</option>
                      <option value="esri">ESRI Imagery</option>
                    </select>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> and drag to
                  select an area for analysis
                </p>

                {/* AI Detection Results */}
                {detectionResults && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Detection Results</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Areas Found:</span>
                        <span className="ml-2 font-mono">{detectionResults.count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Area:</span>
                        <span className="ml-2 font-mono">{formattedTotals.areaPrimary}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <Label className="text-xs">Thickness ({units === 'metric' ? 'cm' : 'in'})</Label>
                        <Input
                          type="number"
                          value={thickness}
                          onChange={(e) => setThickness(parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">
                          Density ({units === 'metric' ? 't/m³' : 'lb/ft³'})
                        </Label>
                        <Input
                          type="number"
                          value={density}
                          onChange={(e) => setDensity(parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Volume:</span>
                        <span className="ml-2 font-mono">
                          {units === 'metric'
                            ? `${computedMaterials.volume.toFixed(2)} m³`
                            : `${computedMaterials.volume.toFixed(0)} ft³`}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tonnage:</span>
                        <span className="ml-2 font-mono">
                          {units === 'metric'
                            ? `${computedMaterials.tonnage.toFixed(1)} t`
                            : `${computedMaterials.tonnage.toFixed(1)} tons`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" onClick={exportGeoJSON}>
                        Export GeoJSON
                      </Button>
                    </div>
                  </div>
                )}

                {/* AI Detection Map Container */}
                <div className="relative w-full h-96 rounded-lg overflow-hidden border">
                  <div ref={aiMapContainerRef} className="absolute inset-0" />
                  {selectedBbox && (
                    <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border rounded px-2 py-1 text-xs">
                      Area selected for analysis
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Status and Controls */}
            <div className="flex gap-4 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setPosition(pos);
                        setError(null);
                        toast({
                          title: "Location found",
                          description: `Lat: ${pos.coords.latitude.toFixed(6)}, Lng: ${pos.coords.longitude.toFixed(6)}`
                        });
                      },
                      (err) => {
                        setError(err.message);
                        toast({
                          title: "Location error",
                          description: err.message,
                          variant: "destructive"
                        });
                      }
                    );
                  }
                }}
              >
                Get Location
              </Button>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {position && (
                  <span>
                    Location: {position.coords.latitude.toFixed(6)}, {position.coords.longitude.toFixed(6)}
                  </span>
                )}
                {error && (
                  <span className="text-red-500">Error: {error}</span>
                )}
              </div>
            </div>

            {/* Totals Display */}
            {(totals.areaSqM > 0 || totals.lengthM > 0) && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="text-sm">
                  <div>Area: {(totals.areaSqM / 10000).toFixed(2)} hectares</div>
                  <div>Length: {(totals.lengthM / 1000).toFixed(2)} km</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}