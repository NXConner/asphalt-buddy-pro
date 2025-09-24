import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { detectAsphalt, type Bbox, type DetectResponse } from '@/lib/asphalt';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Search } from '@/components/icons';

interface AsphaltMapProps {
  mapboxToken?: string;
}

const AsphaltMap: React.FC<AsphaltMapProps> = ({ mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResults, setDetectionResults] = useState<DetectResponse | null>(null);
  const [selectedBbox, setSelectedBbox] = useState<Bbox | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || (!mapboxToken && !tokenInput)) return;

    const token = mapboxToken || tokenInput;
    if (!token) return;

    mapboxgl.accessToken = token;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [-74.006, 40.7128], // NYC
      zoom: 15,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add drawing capabilities for area selection
    let isDrawing = false;
    let startPoint: mapboxgl.LngLat | null = null;

    map.current.on('mousedown', (e) => {
      if (e.originalEvent.shiftKey) {
        isDrawing = true;
        startPoint = e.lngLat;
        map.current!.getCanvas().style.cursor = 'crosshair';
      }
    });

    map.current.on('mousemove', (e) => {
      if (!isDrawing || !startPoint) return;
      
      // Update selection rectangle visual feedback could go here
    });

    map.current.on('mouseup', (e) => {
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
      toast({
        title: "Area Selected",
        description: "Click 'Detect Asphalt' to analyze this area.",
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, tokenInput]);

  // Add detection results to map
  useEffect(() => {
    if (!map.current || !detectionResults) return;

    // Remove existing asphalt layers
    if (map.current.getLayer('asphalt-polygons')) {
      map.current.removeLayer('asphalt-polygons');
    }
    if (map.current.getSource('asphalt-data')) {
      map.current.removeSource('asphalt-data');
    }

    // Add detected asphalt polygons
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: detectionResults.polygons.map((polygon, index) => ({
        type: 'Feature' as const,
        properties: { id: index },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [polygon.map(point => [point.lon, point.lat])],
        },
      })),
    };

    map.current.addSource('asphalt-data', {
      type: 'geojson',
      data: geojsonData,
    });

    map.current.addLayer({
      id: 'asphalt-polygons',
      type: 'fill',
      source: 'asphalt-data',
      paint: {
        'fill-color': '#ff6b35',
        'fill-opacity': 0.6,
        'fill-outline-color': '#ff4500',
      },
    });

    // Add outline
    map.current.addLayer({
      id: 'asphalt-outline',
      type: 'line',
      source: 'asphalt-data',
      paint: {
        'line-color': '#ff4500',
        'line-width': 2,
      },
    });

  }, [detectionResults]);

  const handleDetectAsphalt = async () => {
    if (!selectedBbox) {
      toast({
        title: "No Area Selected",
        description: "Hold Shift and drag to select an area first.",
        variant: "destructive",
      });
      return;
    }

    setIsDetecting(true);
    try {
      const results = await detectAsphalt(selectedBbox);
      setDetectionResults(results);
      
      toast({
        title: "Detection Complete",
        description: `Found ${results.count} asphalt areas.`,
      });
    } catch (error) {
      toast({
        title: "Detection Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  if (!mapboxToken && !tokenInput) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mapbox Token Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="token">Enter your Mapbox public token</Label>
            <Input
              id="token"
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="pk.eyJ1..."
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Get your token from{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </CardContent>
      </Card>
    );
  }

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
          </div>
          
          <p className="text-sm text-muted-foreground">
            Hold <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> and drag to select an area for analysis
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
                    {detectionResults.bbox.south.toFixed(4)}, {detectionResults.bbox.west.toFixed(4)}
                  </span>
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
      </div>
    </div>
  );
};

export default AsphaltMap;