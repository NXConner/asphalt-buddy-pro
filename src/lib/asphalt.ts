export type Bbox = { south: number; west: number; north: number; east: number };

export type AsphaltPoint = { lat: number; lon: number };

export type DetectResponse = {
  polygons: AsphaltPoint[][];
  count: number;
  bbox: Bbox;
};

function getApiBase(): string {
  const maybe = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
  if (maybe && typeof maybe === 'string' && maybe.length > 0) return maybe.replace(/\/$/, '');
  return '';
}

export async function detectAsphalt(bbox: Bbox, opts?: { includeParking?: boolean; timeoutMs?: number; signal?: AbortSignal }): Promise<DetectResponse> {
  const includeParking = opts?.includeParking ?? true;
  const timeoutMs = opts?.timeoutMs ?? 10000;
  const body = JSON.stringify({ bbox, includeParking, timeoutMs });
  const apiBase = getApiBase();
  const url = apiBase ? `${apiBase}/asphalt/detect` : `/api/asphalt/detect`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
  return data;
}

export function computeBboxAreaKm2(b: Bbox): number {
  const meanLat = (b.south + b.north) / 2;
  const heightKm = Math.abs(b.north - b.south) * 111.32;
  const widthKm = Math.abs(b.east - b.west) * 111.32 * Math.cos(meanLat * Math.PI / 180);
  return heightKm * widthKm;
}

