import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl, ScaleControl, ZoomControl, Marker, Popup, useMap, Circle, WMSTileLayer, Polyline, Tooltip } from "react-leaflet";
import { fetchRainviewer, fetchForecast, computeRainEta, generateWeatherTips } from "@/lib/weather";
import { supabase } from "@/integrations/supabase/client";
import { searchAddress, GeocodeResult } from "@/lib/geocode";
import area from "@turf/area";
import distance from "@turf/distance";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { polygon } from "@turf/helpers";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

type MapProvider = "osm" | "google" | "google_sat" | "esri" | "county";

// Local helper to perform search with state handling
async function performSearch(query: string, setSearching: (v: boolean) => void, setSearchError: (v: string | null) => void, setResults: (r: GeocodeResult[]) => void) {
    try {
        setSearchError(null);
        setSearching(true);
        const r = await searchAddress(query);
        setResults(r);
        if (r.length === 0) {
            setSearchError("No results found.");
        }
    } catch (e: any) {
        setSearchError("Search failed. Please try again.");
    } finally {
        setSearching(false);
    }
}

export function OverwatchTab() {
	const [provider, setProvider] = useState<MapProvider>("google_sat");
	const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);
	const [position, setPosition] = useState<GeolocationPosition | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState<string>("");
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
const [etaText, setEtaText] = useState<string>("");
const [tips, setTips] = useState<string[]>([]);
	const [trackingActive, setTrackingActive] = useState<boolean>(localStorage.getItem('bgTrackingEnabled') === 'true');
	const [lastSyncTs, setLastSyncTs] = useState<number | null>(null);
const [etaObj, setEtaObj] = useState<{ nextStart?: Date; nextStop?: Date; currentIntensityMmPerH?: number }>({});
const [alertsEnabled, setAlertsEnabled] = useState<boolean>(false);
	const [countyLayers, setCountyLayers] = useState({
		patrickVA: { label: "Patrick County, VA", enabled: false, url: "", layers: "" },
		henryVA: { label: "Henry County, VA", enabled: false, url: "", layers: "" },
		stokesNC: { label: "Stokes County, NC", enabled: false, url: "", layers: "" },
		surryNC: { label: "Surry County, NC", enabled: false, url: "", layers: "" },
	});
	// Persist and restore county WMS configuration
	useEffect(() => {
		try {
			const raw = localStorage.getItem('overwatch.countyLayers');
			if (raw) {
				const saved = JSON.parse(raw);
				setCountyLayers((prev) => ({
					patrickVA: { ...prev.patrickVA, ...saved.patrickVA },
					henryVA: { ...prev.henryVA, ...saved.henryVA },
					stokesNC: { ...prev.stokesNC, ...saved.stokesNC },
					surryNC: { ...prev.surryNC, ...saved.surryNC },
				}));
			}
		} catch {
			// ignore
		}
	}, []);

	useEffect(() => {
		try {
			localStorage.setItem('overwatch.countyLayers', JSON.stringify(countyLayers));
		} catch {
			// ignore
		}
	}, [countyLayers]);

	function isValidWms(url: string, layers: string) {
		return /^https?:\/\//i.test(url) && layers.trim().length > 0;
	}
	const [detecting, setDetecting] = useState<boolean>(false);

// Employee playback demo data and state
type EmployeePathPoint = { lat: number; lng: number; t: number };
type Employee = {
    id: string;
    name: string;
    status: "off" | "on_shift" | "driving" | "onsite";
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
        const dLng = dEastM / (111320 * Math.cos(base.lat * Math.PI / 180));
        return { lat: base.lat + dLat, lng: base.lng + dLng, t: now - minutesAgo * 60_000 };
    }
    return [
        {
            id: "e1", name: "Alex Johnson", status: "driving", workHoursToday: "6h 12m", phone: "(555) 123-4567",
            emergencyContact: "Sam (555) 234-5678", validLicense: true,
            path: [pt(0,0,60), pt(300,200,45), pt(800,350,30), pt(1200,500,15), pt(1600,800,0)]
        },
        {
            id: "e2", name: "Maria Garcia", status: "onsite", workHoursToday: "5h 03m", phone: "(555) 987-6543",
            emergencyContact: "Lee (555) 876-5432", validLicense: true,
            path: [pt(-500,-200,50), pt(-600,-250,40), pt(-650,-260,30), pt(-660,-265,20), pt(-660,-265,0)]
        }
    ];
});
const [geofenceRings, setGeofenceRings] = useState<[number, number][][]>([]);
const [realtimeEmployees, setRealtimeEmployees] = useState<Record<string, { lat: number; lng: number; speed?: number; ts: number }>>({});
const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
const [playbackIdx, setPlaybackIdx] = useState<number>(0);
const [playbackPlaying, setPlaybackPlaying] = useState<boolean>(false);
const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(800);
const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId) || null, [employees, selectedEmployeeId]);
const playbackPoint = selectedEmployee?.path?.[playbackIdx];
const mph = useMemo(() => {
    if (!selectedEmployee) return 0;
    const a = selectedEmployee.path[playbackIdx - 1];
    const b = selectedEmployee.path[playbackIdx];
    if (!a || !b) return 0;
    const dxKm = distance([a.lng, a.lat], [b.lng, b.lat], { units: "kilometers" });
    const dtH = (b.t - a.t) / 3_600_000;
    const mphVal = dtH > 0 ? (dxKm * 0.621371) / dtH : 0;
    return Math.max(0, Math.min(mphVal, 120));
}, [selectedEmployee, playbackIdx]);

	useEffect(() => {
		(async () => {
			const rv = await fetchRainviewer();
			if (rv) {
				const host = (rv as any).host || "https://tilecache.rainviewer.com";
				const frames = [...(rv.radar.past || []), ...(rv.radar.nowcast || [])].map(f => `${host}${f.path}/512/{z}/{x}/{y}/2/1_1.png`);
				setRadarFrames(frames);
			}
		})();
	}, []);

useEffect(() => {
    (async () => {
        // Wait until coords computed
        const c = position ? { lat: position.coords.latitude, lng: position.coords.longitude } : null;
        if (!c) return;
        const fc = await fetchForecast(c.lat, c.lng);
        const eta = computeRainEta(new Date(), fc);
        if (eta.nextStart) {
            const mins = Math.max(0, Math.round((eta.nextStart.getTime() - Date.now()) / 60000));
            const stopMins = eta.nextStop ? Math.max(0, Math.round((eta.nextStop.getTime() - Date.now()) / 60000)) : undefined;
            setEtaText(stopMins !== undefined ? `Rain in ~${mins} min, clearing around ~${stopMins} min` : `Rain in ~${mins} min`);
        } else {
            setEtaText("No rain expected soon");
        }
        setTips(generateWeatherTips(eta, fc));
        setEtaObj(eta);
    })();
}, [position?.coords.latitude, position?.coords.longitude]);

// Supabase real-time employee location subscription
useEffect(() => {
    const sub = supabase
        .channel('employee_locations')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'employee_locations' }, (payload: any) => {
            const row = payload.new || payload.record || payload;
            if (!row) return;
            setRealtimeEmployees(prev => ({
                ...prev,
                [row.employee_id]: { lat: row.latitude, lng: row.longitude, speed: row.speed ?? undefined, ts: Date.parse(row.timestamp || row.created_at || new Date().toISOString()) }
            }));
        })
        .subscribe();
    return () => { supabase.removeChannel(sub); };
}, []);

// Geofence detection: if any employee enters/exits a polygon, write to time_entries
useEffect(() => {
    const rings = geofenceRings;
    if (rings.length === 0) return;
    (async () => {
        const entries = Object.entries(realtimeEmployees) as Array<[string, { lat: number; lng: number; speed?: number; ts: number }]>;
        for (const [employeeId, p] of entries) {
            const point = [p.lng, p.lat] as [number, number];
            const inside = rings.some(r => booleanPointInPolygon(point, polygon([[...r, r[0]]])));
            const nowIso = new Date().toISOString();
            if (inside) {
                const { error } = await supabase.from('time_entries').insert({ employee_id: employeeId, clock_in: nowIso, location_in: { lat: p.lat, lng: p.lng } as any }).select().single();
                if (error) {
                    // ignore
                }
            } else {
                const { error } = await supabase.from('time_entries').update({ clock_out: nowIso, location_out: { lat: p.lat, lng: p.lng } as any }).eq('employee_id', employeeId).is('clock_out', null);
                if (error) {
                    // ignore
                }
            }
        }
    })();
}, [geofenceRings, realtimeEmployees]);

// Radar animation loop
useEffect(() => {
    if (!radarPlaying || radarFrames.length === 0) return;
    const id = setInterval(() => {
        setRadarIdx(i => (i + 1) % radarFrames.length);
    }, radarSpeedMs);
    return () => clearInterval(id);
}, [radarPlaying, radarFrames.length, radarSpeedMs]);

// Employee playback loop
useEffect(() => {
    if (!playbackPlaying || !selectedEmployee) return;
    const id = setInterval(() => {
        setPlaybackIdx(i => (i + 1) % selectedEmployee.path.length);
    }, playbackSpeedMs);
    return () => clearInterval(id);
}, [playbackPlaying, selectedEmployee?.id, playbackSpeedMs]);

// Notifications for rain alerts
useEffect(() => {
    if (!alertsEnabled) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;
    if (etaObj.nextStart) {
        const mins = Math.max(0, Math.round((etaObj.nextStart.getTime() - Date.now()) / 60000));
        if (mins <= 30) {
            new Notification("Rain alert", { body: `Rain expected in ~${mins} minutes.` });
        }
    }
}, [alertsEnabled, etaObj.nextStart?.getTime()]);

	// Track background tracking state and sync events
	useEffect(() => {
		function onState(e: any) {
			setTrackingActive(!!e.detail?.active);
		}
		function onSync(e: any) {
			setLastSyncTs(e.detail?.lastSyncTs || Date.now());
		}
		window.addEventListener('bg-tracking-state', onState as any);
		window.addEventListener('bg-tracking-sync', onSync as any);
		return () => {
			window.removeEventListener('bg-tracking-state', onState as any);
			window.removeEventListener('bg-tracking-sync', onSync as any);
		};
	}, []);

	useEffect(() => {
		setHasGeolocation("geolocation" in navigator);
		if ("geolocation" in navigator) {
			const watchId = navigator.geolocation.watchPosition(
				pos => setPosition(pos),
				err => setError(err.message),
				{ enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
			);
			return () => navigator.geolocation.clearWatch(watchId);
		}
	}, []);

	const coords = useMemo(() => {
		if (!position) return null;
		return { lat: position.coords.latitude, lng: position.coords.longitude, acc: position.coords.accuracy };
	}, [position]);

	function MapFlyTo({ lat, lon }: { lat: number; lon: number }) {
		const map = useMap();
		useEffect(() => {
			map.flyTo([lat, lon], 16, { duration: 0.6 });
		}, [lat, lon]);
		return null;
	}

	async function handleSearch() {
		if (query.trim().length < 3) return;
		await performSearch(query, setSearching, setSearchError, setResults);
	}

	// Fit to selected geocode result when chosen
	useEffect(() => {
		if (!map || !selectedResult) return;
		try {
			const lat = parseFloat(selectedResult.lat);
			const lon = parseFloat(selectedResult.lon);
			const bb = selectedResult.boundingbox;
			if (bb && bb.length === 4) {
				const south = parseFloat(bb[0]);
				const north = parseFloat(bb[1]);
				const west = parseFloat(bb[2]);
				const east = parseFloat(bb[3]);
				map.fitBounds([[south, west], [north, east]]);
			} else if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
				map.flyTo([lat, lon], 16, { duration: 0.6 });
			}
		} catch {
			// ignore
		}
	}, [map, selectedResult?.lat, selectedResult?.lon, selectedResult?.boundingbox?.[0], selectedResult?.boundingbox?.[1], selectedResult?.boundingbox?.[2], selectedResult?.boundingbox?.[3]]);

 function DrawingTools({ onChange }: { onChange?: (polygons: [number, number][][]) => void }) {
		const map = useMap();
		const featureGroupRef = useRef<L.FeatureGroup | null>(null);

		useEffect(() => {
			if (!map) return;
			const group = new L.FeatureGroup();
			featureGroupRef.current = group;
			map.addLayer(group);

			const drawControl = new (L as any).Control.Draw({
				draw: {
					polygon: { allowIntersection: false, showArea: true },
					polyline: true,
					rectangle: true,
					circle: false,
					marker: false,
				},
				edit: { featureGroup: group }
			});
			map.addControl(drawControl);

			function formatMeters(m: number) {
				return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m.toFixed(1)} m`;
			}

            function recalcTotals() {
				let sumArea = 0;
				let sumLen = 0;
                const polys: [number, number][][] = [];
				featureGroupRef.current?.eachLayer((layer: any) => {
					if (layer.getLatLngs) {
						const latlngs = layer.getLatLngs();
						const ring: [number, number][] = (latlngs[0] as L.LatLng[]).map((ll: L.LatLng) => [ll.lng, ll.lat]);
						if (ring.length > 2) {
                            const poly = polygon([[...ring, ring[0]]]);
                            const aSqM = area(poly);
                            let perim = 0;
                            for (let i = 0; i < ring.length; i++) {
                                const p1 = ring[i];
                                const p2 = ring[(i + 1) % ring.length];
                                perim += distance([p1[0], p1[1]], [p2[0], p2[1]], { units: "kilometers" });
                            }
                            perim *= 1000;
                            sumArea += aSqM;
                            sumLen += perim;
                            const acres = aSqM / 4046.8564224;
                            const label = `${acres.toFixed(2)} ac • ${formatMeters(perim)}`;
							if (layer.bindTooltip) {
								layer.bindTooltip(label, { permanent: true, direction: "center", className: "bg-background/80 px-2 py-1 rounded text-xs" }).openTooltip();
							}
                            polys.push(ring);
						}
					}
				});
				setTotals({ areaSqM: sumArea, lengthM: sumLen });
                onChange?.(polys);
			}

			map.on((L as any).Draw.Event.CREATED, (e: any) => {
				featureGroupRef.current?.addLayer(e.layer);
				recalcTotals();
			});
			map.on((L as any).Draw.Event.EDITED, () => {
				recalcTotals();
			});
			map.on((L as any).Draw.Event.DELETED, () => {
				recalcTotals();
			});

			return () => {
				map.removeLayer(group);
				map.removeControl(drawControl);
			};
		}, [map]);

        return null;
	}

	async function aiDetect() {
		if (!map || detecting) return;
		try {
			setDetecting(true);
			const b = map.getBounds();
			const south = b.getSouth();
			const west = b.getWest();
			const north = b.getNorth();
			const east = b.getEast();
			const query = `
				[out:json][timeout:25];
				(
					way["surface"~"^(asphalt|paved)$"]["area"="yes"](${south},${west},${north},${east});
					way["amenity"="parking"](${south},${west},${north},${east});
					relation["amenity"="parking"](${south},${west},${north},${east});
					way["landuse"~"^(retail|industrial|commercial)$"]["surface"~"^(asphalt|paved)$"](${south},${west},${north},${east});
					relation["landuse"~"^(retail|industrial|commercial)$"]["surface"~"^(asphalt|paved)$"](${south},${west},${north},${east});
				);
				out body geom;`;
			const res = await fetch("https://overpass-api.de/api/interpreter", {
				method: "POST",
				headers: { "Content-Type": "text/plain" },
				body: query
			});
			if (!res.ok) throw new Error("Overpass query failed");
			const data = await res.json();
			const elements: any[] = data?.elements || [];
			let count = 0;
			for (const el of elements) {
				if (el.type === "way" && Array.isArray(el.geometry) && el.geometry.length >= 3) {
					const latlngs = el.geometry.map((g: any) => L.latLng(g.lat, g.lon));
					const poly = L.polygon(latlngs, { color: "#f59e0b", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.25 });
					poly.addTo(map);
					(map as any).fire((L as any).Draw.Event.CREATED, { layer: poly });
					count++;
				} else if (el.type === "relation" && Array.isArray(el.members)) {
					for (const m of el.members) {
						if (m.role === "outer" && Array.isArray(m.geometry) && m.geometry.length >= 3) {
							const latlngs = m.geometry.map((g: any) => L.latLng(g.lat, g.lon));
							const poly = L.polygon(latlngs, { color: "#f59e0b", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.25 });
							poly.addTo(map);
							(map as any).fire((L as any).Draw.Event.CREATED, { layer: poly });
							count++;
						}
					}
				}
			}
			if (count === 0) {
				// Fallback: create a small rectangle near center as a hint
				const center = map.getCenter();
				function offset(lat: number, lng: number, dNorthM: number, dEastM: number) {
					const dLat = dNorthM / 111320;
					const dLng = dEastM / (111320 * Math.cos(lat * Math.PI / 180));
					return L.latLng(lat + dLat, lng + dLng);
				}
				const a = offset(center.lat, center.lng, 25, -35);
				const d = offset(center.lat, center.lng, -25, -35);
				const c = offset(center.lat, center.lng, -25, 35);
				const b = offset(center.lat, center.lng, 25, 35);
				const poly = L.polygon([a, b, c, d], { color: "#f59e0b", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.25 });
				poly.addTo(map);
				(map as any).fire((L as any).Draw.Event.CREATED, { layer: poly });
			}
		} catch (e) {
			// no-op
		} finally {
			setDetecting(false);
		}
	}

	function MapInstanceSetter({ onMap }: { onMap: (m: L.Map) => void }) {
		const m = useMap();
		useEffect(() => {
			onMap(m);
		}, [m]);
		return null;
	}

	function goToMyLocation() {
		if (!map) return;
		const targetZoom = 19;
		if (coords) {
			map.flyTo([coords.lat, coords.lng], targetZoom, { duration: 0.6 });
			return;
		}
		try {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					setPosition(pos);
					map.flyTo([pos.coords.latitude, pos.coords.longitude], targetZoom, { duration: 0.6 });
				},
				(err) => {
					setError(err.message);
				},
				{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
			);
		} catch {
			// ignore
		}
	}

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
				<div>
					<h2 className="text-2xl font-semibold">OverWatch System Command</h2>
					<p className="text-muted-foreground">Unified operational map, tracking, and geofencing.</p>
				</div>
				<div className="flex gap-2 items-center">
					<label className="text-sm">Map Provider</label>
					<select
						value={provider}
						onChange={(e) => setProvider(e.target.value as MapProvider)}
						className="border rounded px-2 py-1 bg-background"
					>
						<option value="osm">OpenStreetMap</option>
						<option value="google">Google Maps (tile)</option>
						<option value="google_sat">Google Satellite (tile)</option>
						<option value="esri">ESRI World Imagery</option>
						<option value="county">Local County GIS</option>
					</select>
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-2">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							void handleSearch();
						}
					}}
					placeholder="Search address or place"
					className="border rounded px-3 py-2 w-full sm:max-w-md"
				/>
				<div className="flex gap-2">
					<button
						onClick={() => { void handleSearch(); }}
						disabled={searching || query.trim().length < 3}
						className="border rounded px-3 py-2 active:scale-95 transition-transform disabled:opacity-60"
					>
						{searching ? "Searching…" : "Search"}
					</button>
					<button
						onClick={() => { setQuery(""); setResults([]); setSelectedResult(null); setSearchError(null); }}
						disabled={searching && results.length === 0 && !selectedResult && query.length === 0}
						className="border rounded px-3 py-2 active:scale-95 transition-transform disabled:opacity-60"
					>
						Clear
					</button>
				</div>
			</div>
			{searchError && (
				<div className="text-sm text-red-500">{searchError}</div>
			)}
			{results.length > 0 && (
				<div className="bg-card border rounded p-2 max-h-48 overflow-auto">
					{results.map((r) => (
						<button
							key={r.display_name + r.lat + r.lon}
							onClick={() => {
								setSelectedResult(r);
								setResults([]);
							}}
							className="block w-full text-left px-2 py-1 hover:bg-muted rounded"
						>
							{r.display_name}
						</button>
					))}
				</div>
			)}

			<div className="w-full h-[60vh] rounded-lg overflow-hidden border relative">
				<button
					onClick={goToMyLocation}
					disabled={!hasGeolocation}
					className="absolute top-2 left-2 z-[1000] border rounded px-3 py-2 bg-background/90 backdrop-blur active:scale-95 transition-transform disabled:opacity-60 shadow"
					title={hasGeolocation ? "Center on my location" : "Geolocation not supported"}
				>
					Locate
				</button>
				<MapContainer
					center={[36.5859718, -79.86153]}
					zoom={10}
					maxZoom={20}
					style={{ width: "100%", height: "100%" }}
					zoomControl={false}
				>
					<MapInstanceSetter onMap={setMap} />
					<ZoomControl position="topright" />
					<ScaleControl position="bottomleft" />
					<LayersControl position="topright">
						<LayersControl.BaseLayer checked={provider === "osm"} name="OpenStreetMap">
							<TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
						</LayersControl.BaseLayer>
						<LayersControl.BaseLayer checked={provider === "google"} name="Google Maps">
							<TileLayer url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" subdomains={["mt0","mt1","mt2","mt3"]} />
						</LayersControl.BaseLayer>
					<LayersControl.BaseLayer checked={provider === "google_sat"} name="Google Satellite (Hybrid)">
						<TileLayer url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}" subdomains={["mt0","mt1","mt2","mt3"]} />
					</LayersControl.BaseLayer>
						<LayersControl.BaseLayer checked={provider === "esri"} name="ESRI Imagery">
							<TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" />
						</LayersControl.BaseLayer>
						{radarFrames.length > 0 && (
							<LayersControl.Overlay checked name="Radar (RainViewer)">
								<TileLayer url={radarFrames[radarIdx % radarFrames.length]} opacity={0.6} />
							</LayersControl.Overlay>
						)}
					</LayersControl>

					{coords && (
						<Marker position={[coords.lat, coords.lng]}>
							<Popup>Current location<br/>±{Math.round(coords.acc)} m</Popup>
						</Marker>
					)}

					{selectedResult && (
						<Marker position={[parseFloat(selectedResult.lat), parseFloat(selectedResult.lon)]}>
							<Popup>{selectedResult.display_name}</Popup>
						</Marker>
					)}

					{coords && <Circle center={[coords.lat, coords.lng]} radius={radiusM} pathOptions={{ color: "#3b82f6", weight: 1 }} />}

                    {/* Employee path and moving marker */}
                    {selectedEmployee && (
                        <>
                            <Polyline positions={selectedEmployee.path.map(p => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#22c55e", weight: 3 }} />
                            {playbackPoint && (
                                <Marker position={[playbackPoint.lat, playbackPoint.lng]}>
                                    <Tooltip direction="top" offset={[0, -12]} opacity={1} permanent={false} sticky>
                                        <div className="text-xs">
                                            <div className="font-medium">{selectedEmployee.name}</div>
                                            <div>Status: {selectedEmployee.status}</div>
                                            <div>MPH: {mph.toFixed(1)}</div>
                                        </div>
                                    </Tooltip>
                                    <Popup>
                                        <div className="space-y-1 text-sm">
                                            <div className="font-medium">{selectedEmployee.name}</div>
                                            <div>Status: {selectedEmployee.status}</div>
                                            <div>Work hours today: {selectedEmployee.workHoursToday}</div>
                                            <div>Phone: {selectedEmployee.phone}</div>
                                            <div>Emergency: {selectedEmployee.emergencyContact}</div>
                                            <div>Driver license: {selectedEmployee.validLicense ? "Valid" : "Expired/Unknown"}</div>
                                            {selectedEmployee.validLicense && selectedEmployee.licenseUrl && (
                                                <a className="text-blue-500 underline" href={selectedEmployee.licenseUrl} target="_blank" rel="noreferrer">View License</a>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            )}
                        </>
                    )}

                    {/* Realtime employees (live positions) */}
                    {(Object.entries(realtimeEmployees) as Array<[string, { lat: number; lng: number; speed?: number; ts: number }]>).map(([empId, p]) => (
                        <Marker key={empId} position={[p.lat, p.lng]}>
                            <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                                <div className="text-xs">
                                    <div className="font-medium">{empId}</div>
                                    <div>MPH: {((p.speed ?? 0) * 2.23694).toFixed(1)}</div>
                                    <div>{new Date(p.ts).toLocaleTimeString()}</div>
                                </div>
                            </Tooltip>
                        </Marker>
                    ))}
                    <DrawingTools onChange={(polys) => setGeofenceRings(polys)} />

					{/* County WMS Overlays */}
					{countyLayers.patrickVA.enabled && isValidWms(countyLayers.patrickVA.url, countyLayers.patrickVA.layers) && (
						<WMSTileLayer url={countyLayers.patrickVA.url} params={{ layers: countyLayers.patrickVA.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}
					{countyLayers.henryVA.enabled && isValidWms(countyLayers.henryVA.url, countyLayers.henryVA.layers) && (
						<WMSTileLayer url={countyLayers.henryVA.url} params={{ layers: countyLayers.henryVA.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}
					{countyLayers.stokesNC.enabled && isValidWms(countyLayers.stokesNC.url, countyLayers.stokesNC.layers) && (
						<WMSTileLayer url={countyLayers.stokesNC.url} params={{ layers: countyLayers.stokesNC.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}
					{countyLayers.surryNC.enabled && isValidWms(countyLayers.surryNC.url, countyLayers.surryNC.layers) && (
						<WMSTileLayer url={countyLayers.surryNC.url} params={{ layers: countyLayers.surryNC.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}

				</MapContainer>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div className="rounded border p-3">
					<h3 className="font-medium mb-2">Location</h3>
					{!hasGeolocation && <p className="text-sm text-muted-foreground">Geolocation not supported.</p>}
					{coords ? (
						<div className="text-sm">
							<div>Lat: {coords.lat.toFixed(6)} Lng: {coords.lng.toFixed(6)}</div>
							<div>Accuracy: ±{Math.round(coords.acc)} m</div>
						</div>
					) : (
						<p className="text-sm text-muted-foreground">Awaiting location...</p>
					)}
					{error && <p className="text-sm text-red-500">{error}</p>}
					<div className="mt-3 flex items-center gap-2">
						<label className="text-sm">Alert radius</label>
						<input type="range" min={500} max={20000} step={500} value={radiusM} onChange={(e) => setRadiusM(parseInt(e.target.value))} />
						<span className="text-xs text-muted-foreground">{Math.round(radiusM/1000)} km</span>
					</div>
					<div className="mt-2 flex items-center gap-2">
						<label className="text-sm">Background tracking</label>
						<input type="checkbox" onChange={(e) => {
							const enabled = e.target.checked;
							localStorage.setItem('bgTrackingEnabled', enabled ? 'true' : 'false');
							window.dispatchEvent(new CustomEvent('bg-tracking-toggle', { detail: { enabled } }));
						}} defaultChecked={localStorage.getItem('bgTrackingEnabled') === 'true'} />
						{trackingActive ? <span className="text-xs text-green-500">Active</span> : <span className="text-xs text-muted-foreground">Inactive</span>}
						{lastSyncTs && <span className="text-xs text-muted-foreground">Last sync: {new Date(lastSyncTs).toLocaleTimeString()}</span>}
					</div>
					<div className="mt-2 flex items-center gap-2">
						<label className="text-sm">Power saving</label>
						<select className="border rounded px-2 py-1 text-sm" onChange={(e) => {
							const mode = e.target.value;
							// Balanced default: 50m / 30s. Power saving: 120m / 90s. High precision: 25m / 15s.
							const cfg = mode === 'power' ? { distanceM: 120, minIntervalMs: 90000 } : mode === 'high' ? { distanceM: 25, minIntervalMs: 15000 } : { distanceM: 50, minIntervalMs: 30000 };
							window.dispatchEvent(new CustomEvent('bg-tracking-config', { detail: cfg }));
						}} defaultValue="balanced">
							<option value="balanced">Balanced</option>
							<option value="power">Power Saving</option>
							<option value="high">High Precision</option>
						</select>
					</div>
				</div>
				<div className="rounded border p-3">
					<h3 className="font-medium mb-2">Operations</h3>
					<ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
						<li>High-resolution imagery (Google, ESRI, County WMS)</li>
						<li>Driving directions planning</li>
						<li>Geofencing for clock-in / clock-out</li>
						<li>Employee movement and fleet tracking</li>
						<li>Detect driver vs passenger (speed, motion, Bluetooth)</li>
						<li>Work-hours device usage monitoring</li>
					</ul>
					<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
						<button className="border rounded px-3 py-2 active:scale-95 transition-transform" onClick={aiDetect} disabled={detecting}>{detecting ? "Detecting…" : "AI Detect Asphalt"}</button>
						<div className="flex items-center gap-2">
							<label className="text-sm">Employee playback</label>
							<select className="border rounded px-2 py-1" value={selectedEmployeeId ?? ""} onChange={(e) => { setSelectedEmployeeId(e.target.value || null); setPlaybackIdx(0); }}>
								<option value="">Select employee</option>
								{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
							</select>
						</div>
						{selectedEmployee && (
							<div className="flex items-center gap-2">
                                <button className="border rounded px-2 py-1 active:scale-95 transition-transform" onClick={() => setPlaybackIdx(i => Math.max(i-1, 0))}>Prev</button>
								<div className="text-xs text-muted-foreground">Point {playbackIdx + 1}/{selectedEmployee.path.length}</div>
                                <button className="border rounded px-2 py-1 active:scale-95 transition-transform" onClick={() => setPlaybackIdx(i => Math.min(i+1, selectedEmployee.path.length-1))}>Next</button>
                                <button className="border rounded px-2 py-1 active:scale-95 transition-transform" onClick={() => setPlaybackPlaying(p => !p)}>{playbackPlaying ? "Pause" : "Play"}</button>
								<label className="text-xs text-muted-foreground">Speed</label>
								<input type="range" min={200} max={1500} step={100} value={playbackSpeedMs} onChange={(e) => setPlaybackSpeedMs(parseInt(e.target.value))} />
								<div className="text-xs">MPH: {mph.toFixed(1)}</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="rounded border p-3">
				<h3 className="font-medium mb-2">County GIS Overlays</h3>
				<p className="text-xs text-muted-foreground mb-2">Toggle county layers. We'll wire official endpoints once available.</p>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={countyLayers.patrickVA.enabled} onChange={(e) => setCountyLayers(s => ({...s, patrickVA: {...s.patrickVA, enabled: e.target.checked}}))} />
						<span>Patrick County, VA</span>
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={countyLayers.henryVA.enabled} onChange={(e) => setCountyLayers(s => ({...s, henryVA: {...s.henryVA, enabled: e.target.checked}}))} />
						<span>Henry County, VA</span>
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={countyLayers.stokesNC.enabled} onChange={(e) => setCountyLayers(s => ({...s, stokesNC: {...s.stokesNC, enabled: e.target.checked}}))} />
						<span>Stokes County, NC</span>
					</label>
					<label className="flex items-center gap-2 text-sm">
						<input type="checkbox" checked={countyLayers.surryNC.enabled} onChange={(e) => setCountyLayers(s => ({...s, surryNC: {...s.surryNC, enabled: e.target.checked}}))} />
						<span>Surry County, NC</span>
					</label>
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
					<input className="border rounded px-2 py-1 text-sm" placeholder="Patrick WMS URL" value={countyLayers.patrickVA.url} onChange={(e) => setCountyLayers(s => ({...s, patrickVA: {...s.patrickVA, url: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Patrick WMS Layers" value={countyLayers.patrickVA.layers} onChange={(e) => setCountyLayers(s => ({...s, patrickVA: {...s.patrickVA, layers: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Henry WMS URL" value={countyLayers.henryVA.url} onChange={(e) => setCountyLayers(s => ({...s, henryVA: {...s.henryVA, url: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Henry WMS Layers" value={countyLayers.henryVA.layers} onChange={(e) => setCountyLayers(s => ({...s, henryVA: {...s.henryVA, layers: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Stokes WMS URL" value={countyLayers.stokesNC.url} onChange={(e) => setCountyLayers(s => ({...s, stokesNC: {...s.stokesNC, url: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Stokes WMS Layers" value={countyLayers.stokesNC.layers} onChange={(e) => setCountyLayers(s => ({...s, stokesNC: {...s.stokesNC, layers: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Surry WMS URL" value={countyLayers.surryNC.url} onChange={(e) => setCountyLayers(s => ({...s, surryNC: {...s.surryNC, url: e.target.value}}))} />
					<input className="border rounded px-2 py-1 text-sm" placeholder="Surry WMS Layers" value={countyLayers.surryNC.layers} onChange={(e) => setCountyLayers(s => ({...s, surryNC: {...s.surryNC, layers: e.target.value}}))} />
				</div>
			</div>

			<div className="rounded border p-3">
				<h3 className="font-medium mb-2">Measurements</h3>
				<div className="text-sm text-muted-foreground">Total area: {(totals.areaSqM / 4046.8564224).toFixed(2)} acres • Total perimeter: {totals.lengthM.toFixed(1)} m</div>
			</div>

			<div className="rounded border p-3">
				<h3 className="font-medium mb-2">Rain Radar & Forecast</h3>
				<div className="text-sm mb-2">{etaText}</div>
				{radarFrames.length > 0 && (
					<div className="flex items-center gap-3">
                        <button className="border rounded px-2 py-1 active:scale-95 transition-transform" onClick={() => setRadarIdx((i) => (i - 1 + radarFrames.length) % radarFrames.length)}>Prev</button>
						<div className="text-xs text-muted-foreground">Frame {radarIdx + 1}/{radarFrames.length}</div>
                        <button className="border rounded px-2 py-1 active:scale-95 transition-transform" onClick={() => setRadarIdx((i) => (i + 1) % radarFrames.length)}>Next</button>
                        <button className="border rounded px-2 py-1 active:scale-95 transition-transform" onClick={() => setRadarPlaying(p => !p)}>{radarPlaying ? "Pause" : "Play"}</button>
						<label className="text-xs text-muted-foreground">Speed</label>
						<input type="range" min={200} max={1500} step={100} value={radarSpeedMs} onChange={(e) => setRadarSpeedMs(parseInt(e.target.value))} />
					</div>
				)}
				{tips.length > 0 && (
					<ul className="list-disc list-inside text-sm text-muted-foreground mt-3 space-y-1">
						{tips.map((t, idx) => <li key={idx}>{t}</li>)}
					</ul>
				)}
				<div className="mt-3 flex items-center gap-2">
					<label className="text-sm">Rain alerts</label>
					<input type="checkbox" checked={alertsEnabled} onChange={(e) => setAlertsEnabled(e.target.checked)} />
				</div>
			</div>
		</div>
	);
}

