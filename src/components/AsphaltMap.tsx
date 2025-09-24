import React, { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { detectAsphalt, type Bbox, type DetectResponse } from '@/lib/asphalt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search } from '@/components/icons';
import area from '@turf/area';
import { polygon as turfPolygon } from '@turf/helpers';
import jsPDF from 'jspdf';
import intersect from '@turf/intersect';
import centroid from '@turf/centroid';
import simplify from '@turf/simplify';
import buffer from '@turf/buffer';

interface AsphaltMapProps {}

const AsphaltMap: React.FC<AsphaltMapProps> = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectResponse | null>(null);
  const [selectedBbox, setSelectedBbox] = useState<Bbox | null>(null);
  const { toast } = useToast();
  const [units, setUnits] = useState<'imperial' | 'metric'>('imperial');
  const [thickness, setThickness] = useState<number>(2); // in inches (imperial) or centimeters (metric)
  const [density, setDensity] = useState<number>(145); // lb/ft^3 (imperial) or t/m^3 (metric)
  const [showFill, setShowFill] = useState<boolean>(true);
  const [showOutline, setShowOutline] = useState<boolean>(true);
  const [showHeat, setShowHeat] = useState<boolean>(false);
  const [baseStyle, setBaseStyle] = useState<'satellite' | 'streets' | 'osm' | 'esri'>('satellite');
  const [minAreaInput, setMinAreaInput] = useState<number>(0); // displayed in current unit system
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.5);
  const [smoothingTolerance, setSmoothingTolerance] = useState<number>(0);
  const [holeFillMeters, setHoleFillMeters] = useState<number>(0);

  function resetControls() {
    try {
      setUnits('imperial');
      setThickness(2);
      setDensity(145);
      setShowFill(true);
      setShowOutline(true);
      setShowHeat(false);
      setBaseStyle('satellite');
      setMinAreaInput(0);
      setConfidenceThreshold(0.5);
      setSmoothingTolerance(0);
      setHoleFillMeters(0);
    } catch {}
  }

  // Load persisted settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aiMapSettings:v1');
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        if (s.units === 'imperial' || s.units === 'metric') setUnits(s.units);
        if (typeof s.thickness === 'number') setThickness(s.thickness);
        if (typeof s.density === 'number') setDensity(s.density);
        if (typeof s.showFill === 'boolean') setShowFill(s.showFill);
        if (typeof s.showOutline === 'boolean') setShowOutline(s.showOutline);
        if (typeof s.showHeat === 'boolean') setShowHeat(s.showHeat);
        if (s.baseStyle === 'satellite' || s.baseStyle === 'streets') setBaseStyle(s.baseStyle);
        if (typeof s.minAreaInput === 'number') setMinAreaInput(s.minAreaInput);
        if (typeof s.confidenceThreshold === 'number')
          setConfidenceThreshold(s.confidenceThreshold);
        if (typeof s.smoothingTolerance === 'number') setSmoothingTolerance(s.smoothingTolerance);
        if (typeof s.holeFillMeters === 'number') setHoleFillMeters(s.holeFillMeters);
      }
    } catch {}
  }, []);

  // Persist settings on change
  useEffect(() => {
    try {
      const payload = {
        units,
        thickness,
        density,
        showFill,
        showOutline,
        showHeat,
        baseStyle,
        minAreaInput,
        confidenceThreshold,
        smoothingTolerance,
        holeFillMeters,
      };
      localStorage.setItem('aiMapSettings:v1', JSON.stringify(payload));
    } catch {}
  }, [
    units,
    thickness,
    density,
    showFill,
    showOutline,
    showHeat,
    baseStyle,
    minAreaInput,
    confidenceThreshold,
    smoothingTolerance,
    holeFillMeters,
  ]);

  const minAreaM2 = useMemo(() => {
    const val = Number(minAreaInput) || 0;
    return units === 'metric' ? val : val / 10.7639; // ft² -> m²
  }, [minAreaInput, units]);

  // Compute geodesic areas for detected polygons
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

  // Compute volume and tonnage based on assumptions and unit system
  const computedMaterials = useMemo(() => {
    const m2 = areaTotals.totalM2;
    if (m2 <= 0) return { volume: 0, tonnage: 0 };
    if (units === 'metric') {
      // thickness in centimeters, density in t/m^3
      const thicknessM = (thickness || 0) / 100; // cm -> m
      const volumeM3 = m2 * thicknessM; // m^3
      const tons = volumeM3 * (density || 0); // metric tons (t)
      return { volume: volumeM3, tonnage: tons };
    }
    // imperial: thickness in inches, density in lb/ft^3
    const sqft = m2 * 10.7639;
    const thicknessFt = (thickness || 0) / 12; // in -> ft
    const volumeFt3 = sqft * thicknessFt; // ft^3
    const pounds = volumeFt3 * (density || 0); // lb
    const shortTons = pounds / 2000; // US tons
    return { volume: volumeFt3, tonnage: shortTons };
  }, [areaTotals.totalM2, thickness, density, units]);

  function buildGeoJSON() {
    if (!detectionResults) return null;
    return {
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
      metadata: {
        bbox: detectionResults.bbox,
        units,
        assumptions: {
          thickness: units === 'metric' ? `${thickness} cm` : `${thickness} in`,
          density: units === 'metric' ? `${density} t/m^3` : `${density} lb/ft^3`,
        },
        totals: {
          area_m2: areaTotals.totalM2,
          volume: computedMaterials.volume,
          tonnage: computedMaterials.tonnage,
        },
        generated_at: new Date().toISOString(),
      },
    };
  }

  function exportGeoJSON() {
    const gj = buildGeoJSON();
    if (!gj) return;
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

  function exportOutlines() {
    if (!detectionResults) return;
    const features = detectionResults.polygons
      .map((poly, index) => {
        const coords = poly.map((p) => [p.lon, p.lat] as [number, number]);
        const closed = [...coords];
        if (closed.length > 0) {
          const f = closed[0];
          const l = closed[closed.length - 1];
          if (f[0] !== l[0] || f[1] !== l[1]) closed.push([f[0], f[1]]);
        }
        // Filter by min area
        let aM2 = 0;
        try {
          aM2 = area(turfPolygon([closed]));
        } catch {}
        if (aM2 < minAreaM2) return null;
        return {
          type: 'Feature' as const,
          properties: { id: index, area_m2: aM2 },
          geometry: { type: 'LineString' as const, coordinates: closed },
        };
      })
      .filter(Boolean) as any[];
    const gj = {
      type: 'FeatureCollection' as const,
      features,
      metadata: {
        bbox: detectionResults.bbox,
        units,
        assumptions: {
          thickness: units === 'metric' ? `${thickness} cm` : `${thickness} in`,
          density: units === 'metric' ? `${density} t/m^3` : `${density} lb/ft^3`,
          min_area_m2: minAreaM2,
        },
        generated_at: new Date().toISOString(),
      },
    };
    const blob = new Blob([JSON.stringify(gj, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt-outlines-${new Date().toISOString().split('T')[0]}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportCSV() {
    if (!detectionResults) return;
    const header = ['id', 'area_m2', 'confidence', 'area_primary', 'area_secondary'];
    const lines = [header.join(',')];
    const src: any = (map.current?.getSource('asphalt-data') as any)?.serialize?.()?.data;
    const feats: any[] = src?.features || [];
    feats.forEach((feat: any) => {
      try {
        const id = Number(feat.properties?.id) || 0;
        const aM2 = Number(feat.properties?.area_m2) || 0;
        const conf = Number(feat.properties?.confidence) || 0;
        let prim = '';
        let sec = '';
        if (units === 'metric') {
          prim = `${aM2.toFixed(0)} m²`;
          sec = `${(aM2 / 10000).toFixed(2)} ha`;
        } else {
          const sqft = aM2 * 10.7639;
          const acres = aM2 / 4046.8564224;
          prim = `${sqft.toFixed(0)} sq ft`;
          sec = `${acres.toFixed(2)} acres`;
        }
        lines.push([id, aM2.toFixed(2), conf.toFixed(2), prim, sec].join(','));
      } catch {}
    });
    // Totals row
    lines.push(
      [
        'TOTALS',
        areaTotals.totalM2.toFixed(2),
        formattedTotals.areaPrimary,
        formattedTotals.areaSecondary,
      ].join(','),
    );
    lines.push(
      [
        'ASSUMPTIONS',
        `thickness=${units === 'metric' ? `${thickness} cm` : `${thickness} in`}`,
        `density=${units === 'metric' ? `${density} t/m^3` : `${density} lb/ft^3`}`,
      ].join(','),
    );
    lines.push(
      [
        'MATERIALS',
        `volume=${units === 'metric' ? `${computedMaterials.volume.toFixed(2)} m^3` : `${computedMaterials.volume.toFixed(0)} ft^3`}`,
        `tonnage=${units === 'metric' ? `${computedMaterials.tonnage.toFixed(1)} t` : `${computedMaterials.tonnage.toFixed(1)} tons`}`,
      ].join(','),
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt-detections-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    if (!detectionResults) return;
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 40;
    let y = margin;
    doc.setFontSize(16);
    doc.text('AI Asphalt Detection Report', margin, y);
    y += 24;
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
    y += 14;
    doc.text(`Detections: ${detectionResults.count}`, margin, y);
    y += 14;
    doc.text(
      `Total Area: ${formattedTotals.areaPrimary} (${formattedTotals.areaSecondary})`,
      margin,
      y,
    );
    y += 14;
    doc.text(`Thickness: ${units === 'metric' ? `${thickness} cm` : `${thickness} in`}`, margin, y);
    y += 14;
    doc.text(
      `Density: ${units === 'metric' ? `${density} t/m^3` : `${density} lb/ft^3`}`,
      margin,
      y,
    );
    y += 14;
    doc.text(
      `Volume: ${units === 'metric' ? `${computedMaterials.volume.toFixed(2)} m^3` : `${computedMaterials.volume.toFixed(0)} ft^3`}`,
      margin,
      y,
    );
    y += 14;
    doc.text(
      `Tonnage: ${units === 'metric' ? `${computedMaterials.tonnage.toFixed(1)} t` : `${computedMaterials.tonnage.toFixed(1)} tons`}`,
      margin,
      y,
    );
    y += 14;
    y += 8;
    doc.setFontSize(11);
    doc.text('BBox', margin, y);
    y += 14;
    doc.setFontSize(9);
    doc.text(
      `S: ${detectionResults.bbox.south.toFixed(6)}  W: ${detectionResults.bbox.west.toFixed(6)}  N: ${detectionResults.bbox.north.toFixed(6)}  E: ${detectionResults.bbox.east.toFixed(6)}`,
      margin,
      y,
    );
    doc.save(`asphalt-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Build free raster styles for MapLibre (no token required)
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    const styleObj = buildStyle(baseStyle);
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: styleObj as any,
      center: [-74.006, 40.7128], // NYC
      zoom: 15,
    });

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Add drawing capabilities for area selection (with visual rectangle)
    let isDrawing = false;
    let startPoint: any | null = null;

    function ensureSelectionLayers() {
      if (!map.current) return;
      if (!map.current.getSource('selection-rect-src')) {
        map.current.addSource('selection-rect-src', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        } as any);
      }
      if (!map.current.getLayer('selection-rect-fill')) {
        map.current.addLayer({
          id: 'selection-rect-fill',
          type: 'fill',
          source: 'selection-rect-src',
          paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.15 },
        });
      }
      if (!map.current.getLayer('selection-rect-line')) {
        map.current.addLayer({
          id: 'selection-rect-line',
          type: 'line',
          source: 'selection-rect-src',
          paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-dasharray': [2, 2] },
        });
      }
    }

    function updateSelectionRect(a: any, b: any) {
      if (!map.current) return;
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
      const src = map.current.getSource('selection-rect-src') as any;
      if (src && src.setData) src.setData(gj);
    }

    function clearSelectionRect() {
      if (!map.current) return;
      const src = map.current.getSource('selection-rect-src') as any;
      if (src && src.setData) src.setData({ type: 'FeatureCollection', features: [] } as any);
    }
>>>>>>> origin/main

    map.current.on('mousedown', (e: any) => {
      if (e.originalEvent.shiftKey) {
        isDrawing = true;
        startPoint = e.lngLat;
        map.current!.getCanvas().style.cursor = 'crosshair';
        clearSelectionRect();
      }
    });

    map.current.on('mousemove', (e: any) => {
      if (!isDrawing || !startPoint) return;
      updateSelectionRect(startPoint, e.lngLat);
    });

    map.current.on('mouseup', (e: any) => {
      if (!isDrawing || !startPoint) return;

      isDrawing = false;
      map.current!.getCanvas().style.cursor = '';

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

    return () => {
      map.current?.remove();
    };
  }, [baseStyle]);

  // Clear selection rectangle when selection is cleared
  useEffect(() => {
    if (!map.current) return;
    if (!selectedBbox) {
      const src = map.current.getSource('selection-rect-src') as any;
      if (src && src.setData) src.setData({ type: 'FeatureCollection', features: [] } as any);
    }
  }, [selectedBbox]);

  // Add detection results to map
  useEffect(() => {
    if (!map.current || !detectionResults) return;

    // Remove existing asphalt layers
    if (map.current.getLayer('asphalt-polygons')) {
      map.current.removeLayer('asphalt-polygons');
    }
    if (map.current.getLayer('asphalt-outline')) {
      map.current.removeLayer('asphalt-outline');
    }
    if (map.current.getLayer('asphalt-heat')) {
      map.current.removeLayer('asphalt-heat');
    }
    if (map.current.getSource('asphalt-data')) {
      map.current.removeSource('asphalt-data');
    }
    if (map.current.getSource('asphalt-heat-src')) {
      map.current.removeSource('asphalt-heat-src');
    }

    // Add detected asphalt polygons (apply min area filter, optional smoothing/hole fill)
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: detectionResults.polygons
        .map((polygon, index) => {
          const baseCoords = polygon.map((point) => [point.lon, point.lat] as [number, number]);
          let ring = [...baseCoords];
          if (ring.length > 0) {
            const f = ring[0];
            const l = ring[ring.length - 1];
            if (f[0] !== l[0] || f[1] !== l[1]) ring.push([f[0], f[1]]);
          }
          let geom = turfPolygon([ring]);
          try {
            if (smoothingTolerance > 0) {
              const tolDeg = smoothingTolerance * 1e-5;
              geom = simplify(geom as any, { tolerance: tolDeg, highQuality: true }) as any;
            }
            if (holeFillMeters > 0) {
              const bufKm = holeFillMeters / 1000;
              const grown = buffer(geom as any, bufKm, { units: 'kilometers' }) as any;
              const shrunk = buffer(grown as any, -bufKm, { units: 'kilometers' }) as any;
              if (shrunk) geom = shrunk as any;
            }
          } catch {}
          const aM2 = (() => {
            try {
              return area(geom as any);
            } catch {
              return 0;
            }
          })();
          const outCoords =
            ((geom as any)?.geometry?.coordinates?.[0] as [number, number][]) || baseCoords;
          const confidence = 1.0;
          return {
            type: 'Feature' as const,
            properties: { id: index, area_m2: aM2, confidence },
            geometry: { type: 'Polygon' as const, coordinates: [outCoords] },
          };
        })
        .filter(
          (f) =>
            (Number(f.properties.area_m2) || 0) >= minAreaM2 &&
            (Number(f.properties.confidence) || 0) >= confidenceThreshold,
        ),
    };

    map.current.addSource('asphalt-data', {
      type: 'geojson',
      data: geojsonData,
    });

    if (showFill) {
      map.current.addLayer({
        id: 'asphalt-polygons',
        type: 'fill',
        source: 'asphalt-data',
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'confidence'],
            0,
            '#fde68a',
            0.5,
            '#f59e0b',
            0.8,
            '#fb923c',
            1,
            '#ef4444',
          ],
          'fill-opacity': 0.6,
          'fill-outline-color': '#ff4500',
        },
      });
    }

    if (showOutline) {
      map.current.addLayer({
        id: 'asphalt-outline',
        type: 'line',
        source: 'asphalt-data',
        paint: {
          'line-color': '#ff4500',
          'line-width': 2,
        },
      });
    }

    if (showHeat) {
      try {
        const features = {
          type: 'FeatureCollection' as const,
          features: geojsonData.features.map((feat: any) => {
            const coords: [number, number][] = feat.geometry.coordinates?.[0] || [];
            const ring: [number, number][] = coords.map((c) => [c[0], c[1]]);
            if (ring.length > 0) {
              const f = ring[0];
              const l = ring[ring.length - 1];
              if (f[0] !== l[0] || f[1] !== l[1]) ring.push([f[0], f[1]]);
            }
            const c = centroid(turfPolygon([ring]));
            const weight = Number(feat.properties?.confidence) || 1;
            return { type: 'Feature' as const, properties: { weight }, geometry: c.geometry };
          }),
        };
        map.current.addSource('asphalt-heat-src', { type: 'geojson', data: features as any });
        map.current.addLayer({
          id: 'asphalt-heat',
          type: 'heatmap',
          source: 'asphalt-heat-src',
          paint: {
            'heatmap-radius': 20,
            'heatmap-opacity': 0.5,
            'heatmap-weight': ['get', 'weight'],
          },
        });
      } catch {}
    }
    // Click popup for per-polygon metrics
    const clickHandler = (e: any) => {
      try {
        const f = e.features?.[0];
        const aM2 = Number(f?.properties?.area_m2) || 0;
        const vol = (() => {
          if (units === 'metric') {
            const thicknessM = (thickness || 0) / 100; // cm -> m
            return aM2 * thicknessM;
          }
          const sqft = aM2 * 10.7639;
          const thicknessFt = (thickness || 0) / 12;
          return sqft * thicknessFt;
        })();
        const tons = (() => {
          if (units === 'metric') return vol * (density || 0);
          const pounds = vol * (density || 0);
          return pounds / 2000;
        })();
        const conf = Number(f?.properties?.confidence) || 0;
        const content =
          units === 'metric'
            ? `<div style="font-family: ui-sans-serif, system-ui; font-size:12px"><div><b>Area</b>: ${aM2.toFixed(0)} m²</div><div><b>Volume</b>: ${vol.toFixed(2)} m³</div><div><b>Tonnage</b>: ${tons.toFixed(1)} t</div><div><b>Confidence</b>: ${(conf * 100).toFixed(0)}%</div></div>`
            : `<div style="font-family: ui-sans-serif, system-ui; font-size:12px"><div><b>Area</b>: ${(aM2 * 10.7639).toFixed(0)} ft²</div><div><b>Volume</b>: ${vol.toFixed(0)} ft³</div><div><b>Tonnage</b>: ${tons.toFixed(1)} tons</div><div><b>Confidence</b>: ${(conf * 100).toFixed(0)}%</div></div>`;
        new maplibregl.Popup({ closeButton: false })
          .setLngLat(e.lngLat)
          .setHTML(content)
          .addTo(map.current!);
      } catch {}
    };
    if (showFill && map.current.getLayer('asphalt-polygons')) {
      map.current.on('click', 'asphalt-polygons', clickHandler);
    }
    if (showOutline && map.current.getLayer('asphalt-outline')) {
      map.current.on('click', 'asphalt-outline', clickHandler);
    }

    return () => {
      try {
        if (map.current?.getLayer('asphalt-polygons'))
          map.current.off('click', 'asphalt-polygons', clickHandler);
      } catch {}
      try {
        if (map.current?.getLayer('asphalt-outline'))
          map.current.off('click', 'asphalt-outline', clickHandler);
      } catch {}
    };
  }, [
    detectionResults,
    showFill,
    showOutline,
    showHeat,
    minAreaM2,
    units,
    thickness,
    density,
    confidenceThreshold,
  ]);

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

  // Free map: no token gating

  return (
    <div className="w-full space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            AI Asphalt Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Button variant="outline" onClick={resetControls}>
              Reset
            </Button>
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
                onChange={(e) => setBaseStyle(e.target.value as 'satellite' | 'streets' | 'osm' | 'esri')}
                className="border rounded px-2 py-1 bg-background text-xs"
              >
                <option value="satellite">Satellite</option>
                <option value="streets">Streets</option>
                <option value="osm">OpenStreetMap (free)</option>
                <option value="esri">ESRI Imagery (free)</option>
              </select>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> and drag to
            select an area for analysis
          </p>

          {detectionResults && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Detection Results</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Areas Found:</span>
                  <span className="ml-2 font-mono">{detectionResults.count}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Bbox:</span>
                  <span className="ml-2 font-mono text-xs">
                    {detectionResults.bbox.south.toFixed(4)},{' '}
                    {detectionResults.bbox.west.toFixed(4)}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Area:</span>
                  <span className="ml-2 font-mono">{formattedTotals.areaPrimary}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Also:</span>
                  <span className="ml-2 font-mono">{formattedTotals.areaSecondary}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showFill}
                    onChange={(e) => setShowFill(e.target.checked)}
                  />
                  <span>Detections</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showOutline}
                    onChange={(e) => setShowOutline(e.target.checked)}
                  />
                  <span>Outlines</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showHeat}
                    onChange={(e) => setShowHeat(e.target.checked)}
                  />
                  <span>Heatmap</span>
                </label>
              </div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Min Area ({units === 'metric' ? 'm²' : 'ft²'})</Label>
                  <Input
                    type="number"
                    value={minAreaInput}
                    onChange={(e) => setMinAreaInput(parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Confidence ≥ {Math.round(confidenceThreshold * 100)}%
                  </Label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <Label className="text-xs">Min Area ({units === 'metric' ? 'm²' : 'ft²'})</Label>
                  <Input
                    type="number"
                    value={minAreaInput}
                    onChange={(e) => setMinAreaInput(parseFloat(e.target.value) || 0)}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
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
                <div className="col-span-2 grid grid-cols-2 gap-4">
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
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Smoothing (tolerance, m)</Label>
                    <Input
                      type="number"
                      value={smoothingTolerance}
                      onChange={(e) => setSmoothingTolerance(parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hole fill (closing, m)</Label>
                    <Input
                      type="number"
                      value={holeFillMeters}
                      onChange={(e) => setHoleFillMeters(parseFloat(e.target.value) || 0)}
                      className="h-8"
                    />
                  </div>
                </div>
                <div className="col-span-2 mt-2 flex flex-wrap gap-2">
                  <Button variant="outline" onClick={exportGeoJSON}>
                    Export GeoJSON
                  </Button>
                  <Button variant="outline" onClick={exportCSV}>
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={exportPDF}>
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={exportOutlines}>
                    Export Outlines (GeoJSON)
                  </Button>
                  <Button
                    onClick={() => {
                      const m2 = areaTotals.totalM2;
                      const sqft = m2 * 10.7639;
                      try {
                        localStorage.setItem(
                          'estimatorImport',
                          JSON.stringify({
                            sealcoating: { area: sqft },
                            asphaltPaving: { area: sqft },
                          }),
                        );
                      } catch {}
                      try {
                        window.dispatchEvent(
                          new CustomEvent('navigate-tab', { detail: { tab: 'estimator' } }),
                        );
                      } catch {}
                      toast({
                        title: 'Exported to Estimator',
                        description: `${sqft.toFixed(0)} sq ft`,
                      });
                    }}
                  >
                    Export to Estimator
                  </Button>
                </div>
                {/* Validation panel: upload ground truth GeoJSON */}
                <div className="col-span-2 mt-4 border-t pt-4">
                  <h5 className="font-medium mb-2 text-sm">Validation</h5>
                  <input
                    type="file"
                    accept="application/geo+json,application/json,.geojson,.json"
                    onChange={async (e) => {
                      try {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        const truth = JSON.parse(text);
                        // Build detected union area (approx by summing areas; IoU here uses area sums)
                        const detectedM2 =
                          (map.current?.getSource('asphalt-data') as any)
                            ?.serialize?.()
                            ?.data?.features?.reduce?.(
                              (sum: number, f: any) => sum + (Number(f.properties?.area_m2) || 0),
                              0,
                            ) ?? areaTotals.totalM2;
                        // Ground truth area
                        let truthM2 = 0;
                        try {
                          const feats: any[] = truth?.features || [];
                          for (const f of feats) {
                            if (
                              f?.geometry?.type === 'Polygon' ||
                              f?.geometry?.type === 'MultiPolygon'
                            ) {
                              truthM2 += area(f);
                            }
                          }
                        } catch {}
                        // Intersection area approx: sum intersections per detected polygon
                        let interM2 = 0;
                        try {
                          const detected: any[] =
                            (map.current?.getSource('asphalt-data') as any)?.serialize?.()?.data
                              ?.features || [];
                          const truths: any[] = truth?.features || [];
                          for (const d of detected) {
                            for (const t of truths) {
                              const g = intersect(d as any, t as any);
                              if (g) interM2 += area(g as any);
                            }
                          }
                        } catch {}
                        const unionM2 = detectedM2 + truthM2 - interM2;
                        const iou = unionM2 > 0 ? interM2 / unionM2 : 0;
                        const precision = detectedM2 > 0 ? interM2 / detectedM2 : 0;
                        const recall = truthM2 > 0 ? interM2 / truthM2 : 0;
                        const f1 =
                          precision + recall > 0
                            ? (2 * precision * recall) / (precision + recall)
                            : 0;
                        toast({
                          title: 'Validation computed',
                          description: `IoU ${(iou * 100).toFixed(1)}% • P ${(precision * 100).toFixed(1)}% • R ${(recall * 100).toFixed(1)}% • F1 ${(f1 * 100).toFixed(1)}%`,
                        });
                      } catch (err) {
                        toast({
                          title: 'Validation failed',
                          description: err instanceof Error ? err.message : 'Invalid file',
                          variant: 'destructive',
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map */}
      <div className="relative w-full h-96 rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        {selectedBbox && (
          <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm border rounded px-2 py-1 text-xs">
            Area selected for analysis
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm border rounded px-2 py-2 text-xs space-y-1">
          <div className="font-medium">Legend</div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-16 h-2 rounded"
              style={{
                background:
                  'linear-gradient(90deg, #fde68a 0%, #f59e0b 50%, #fb923c 80%, #ef4444 100%)',
              }}
            ></span>
            <span>Fill (low → high confidence)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 border" style={{ borderColor: '#ff4500' }}></span>
            <span>Outline</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 bg-gradient-to-r from-orange-300 to-red-600"></span>
            <span>Heatmap</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsphaltMap;
