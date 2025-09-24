import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { GeocodeResult, searchAddress } from '@/lib/geocode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

type MapProvider = 'google_sat' | 'google_road' | 'osm' | 'county';

export function OverwatchTab() {
  const { toast } = useToast();
  const [provider, setProvider] = useState<MapProvider>('google_sat');
  const [lastBaseProvider, setLastBaseProvider] = useState<Exclude<MapProvider, 'county'>>('google_sat');
  const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
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
  const patrickGroupRef = useRef<L.LayerGroup | null>(null);
  const henryGroupRef = useRef<L.LayerGroup | null>(null);
  const stokesGroupRef = useRef<L.LayerGroup | null>(null);
  const surryGroupRef = useRef<L.LayerGroup | null>(null);

  // Save county layers to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('overwatch.countyLayers', JSON.stringify(countyLayers));
    } catch {
      // ignore
    }
  }, [countyLayers]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>OverWatch - Operational Map & Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                    checked={layer.enabled}
                    onCheckedChange={(checked) => {
                      setCountyLayers(prev => ({
                        ...prev,
                        [key]: { ...prev[key as keyof typeof prev], enabled: Boolean(checked) }
                      }));
                    }}
                  />
                  <Label htmlFor={key} className="text-sm">{layer.label}</Label>
                </div>
              ))}
            </div>

            {/* Map Container */}
            <div 
              ref={mapContainerRef}
              className="w-full h-96 border rounded-lg bg-gray-100 dark:bg-gray-800"
            >
              <div className="h-full flex items-center justify-center text-gray-500">
                Interactive map will be displayed here
              </div>
            </div>

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