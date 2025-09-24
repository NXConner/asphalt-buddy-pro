import { Bbox, DetectResponse } from './asphalt';

// Production API configuration
const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.overwatchpro.com' 
  : 'http://localhost:3001';

export interface GeocodingResult {
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: string;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

export async function geocodeLocation(query: string): Promise<GeocodingResult[]> {
  const response = await fetch(`${API_BASE}/geocode?q=${encodeURIComponent(query)}&limit=5`);
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`);
  }
  return response.json();
}

export async function detectAsphaltAdvanced(
  bbox: Bbox, 
  options?: {
    includeParking?: boolean;
    timeoutMs?: number;
    signal?: AbortSignal;
    minConfidence?: number;
    surfaceTypes?: string[];
  }
): Promise<DetectResponse> {
  const body = {
    bbox,
    includeParking: options?.includeParking ?? true,
    timeoutMs: options?.timeoutMs ?? 10000,
    minConfidence: options?.minConfidence ?? 0.7,
    surfaceTypes: options?.surfaceTypes ?? ['asphalt', 'paved', 'concrete'],
  };

  const response = await fetch(`${API_BASE}/asphalt/detect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Detection failed: ${response.statusText}`);
  }

  return response.json();
}

export interface MaterialCosts {
  asphaltPerTon: number;
  laborPerSqFt: number;
  equipmentPerSqFt: number;
  baseEquipmentFee: number;
  markupPercentage: number;
}

export async function getMaterialCosts(): Promise<MaterialCosts> {
  try {
    const response = await fetch(`${API_BASE}/materials/costs`);
    if (!response.ok) {
      throw new Error('Failed to fetch material costs');
    }
    return response.json();
  } catch (error) {
    // Fallback to default costs if API is unavailable
    return {
      asphaltPerTon: 120,
      laborPerSqFt: 2.5,
      equipmentPerSqFt: 0.75,
      baseEquipmentFee: 500,
      markupPercentage: 15,
    };
  }
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  visibility: number;
  suitableForPaving: boolean;
  recommendations: string[];
}

export async function getWeatherForLocation(lat: number, lon: number): Promise<WeatherData> {
  try {
    const response = await fetch(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    return response.json();
  } catch (error) {
    // Fallback weather data
    return {
      temperature: 22,
      humidity: 65,
      windSpeed: 8,
      conditions: 'Clear',
      visibility: 10,
      suitableForPaving: true,
      recommendations: ['Weather conditions are suitable for asphalt paving'],
    };
  }
}

export interface ProjectEstimate {
  id: string;
  projectName: string;
  location: string;
  measurements: {
    area: number;
    thickness: number;
    volume: number;
    tonnage: number;
  };
  costs: {
    materials: number;
    labor: number;
    equipment: number;
    total: number;
  };
  createdAt: string;
  updatedAt: string;
}

export async function saveProjectEstimate(estimate: Omit<ProjectEstimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectEstimate> {
  try {
    const response = await fetch(`${API_BASE}/estimates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(estimate),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save estimate');
    }
    
    return response.json();
  } catch (error) {
    // Fallback to local storage
    const id = Date.now().toString();
    const projectEstimate: ProjectEstimate = {
      ...estimate,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const saved = JSON.parse(localStorage.getItem('savedEstimates') || '[]');
    saved.push(projectEstimate);
    localStorage.setItem('savedEstimates', JSON.stringify(saved));
    
    return projectEstimate;
  }
}

export async function getProjectEstimates(): Promise<ProjectEstimate[]> {
  try {
    const response = await fetch(`${API_BASE}/estimates`);
    if (!response.ok) {
      throw new Error('Failed to fetch estimates');
    }
    return response.json();
  } catch (error) {
    // Fallback to local storage
    return JSON.parse(localStorage.getItem('savedEstimates') || '[]');
  }
}