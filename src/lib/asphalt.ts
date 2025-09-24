export type Bbox = { south: number; west: number; north: number; east: number };

export type AsphaltPoint = { lat: number; lon: number };

export type DetectResponse = {
  polygons: AsphaltPoint[][];
  count: number;
  bbox: Bbox;
};

function getApiBase(): string {
  // Production API endpoint
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.overwatchpro.com';
  }
  
  // Development - check for local API server first
  const maybe = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (maybe && typeof maybe === 'string' && maybe.length > 0) {
    return maybe.replace(/\/$/, '');
  }
  
  // Default to local development server
  return 'http://localhost:3001';
}

export async function detectAsphalt(
  bbox: Bbox, 
  opts?: { 
    includeParking?: boolean; 
    timeoutMs?: number; 
    signal?: AbortSignal;
    minConfidence?: number;
    enhanceResults?: boolean;
  }
): Promise<DetectResponse> {
  const includeParking = opts?.includeParking ?? true;
  const timeoutMs = opts?.timeoutMs ?? 15000; // Increased timeout for production
  const minConfidence = opts?.minConfidence ?? 0.8; // Higher confidence threshold
  const enhanceResults = opts?.enhanceResults ?? true;
  
  const body = JSON.stringify({ 
    bbox, 
    includeParking, 
    timeoutMs,
    minConfidence,
    enhanceResults,
    // Additional parameters for better detection
    surfaceTypes: ['asphalt', 'paved', 'concrete'],
    excludeTypes: ['gravel', 'dirt', 'grass'],
    smoothingTolerance: 0.0001,
    minAreaThreshold: 10 // minimum 10 sq meters
  });
  
  const apiBase = getApiBase();
  const url = `${apiBase}/asphalt/detect`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json',
      'User-Agent': 'OverWatch-Pro/1.0 (asphalt-detection)'
    },
    body,
    signal: opts?.signal
  });
  
  if (!res.ok) {
    let msg = `Detection failed (${res.status})`;
    try {
      const data = await res.json();
      msg = (data?.message as string) || msg;
    } catch {}
    throw new Error(msg);
  }
  
  const data = (await res.json()) as DetectResponse;
  
  // Validate response data
  if (!data.polygons || !Array.isArray(data.polygons)) {
    throw new Error('Invalid response format from detection service');
  }
  
  return data;
}

export function computeBboxAreaKm2(b: Bbox): number {
  const meanLat = (b.south + b.north) / 2;
  const heightKm = Math.abs(b.north - b.south) * 111.32;
  const widthKm = Math.abs(b.east - b.west) * 111.32 * Math.cos(meanLat * Math.PI / 180);
  return heightKm * widthKm;
}

