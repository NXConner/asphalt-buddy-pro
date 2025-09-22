import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl, ScaleControl, ZoomControl, Marker, Popup, useMap, Circle, WMSTileLayer } from "react-leaflet";
import { fetchRainviewer, fetchForecast, computeRainEta, generateWeatherTips } from "@/lib/weather";
import { searchAddress, GeocodeResult } from "@/lib/geocode";
import * as turf from "@turf/turf";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

type MapProvider = "osm" | "google" | "google_sat" | "esri" | "county";

export function OverwatchTab() {
	const [provider, setProvider] = useState<MapProvider>("osm");
	const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);
	const [position, setPosition] = useState<GeolocationPosition | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState<string>("");
	const [results, setResults] = useState<GeocodeResult[]>([]);
	const [selectedResult, setSelectedResult] = useState<GeocodeResult | null>(null);
	const [map, setMap] = useState<L.Map | null>(null);
	const [totals, setTotals] = useState<{ areaSqM: number; lengthM: number }>({ areaSqM: 0, lengthM: 0 });
	const [radiusM, setRadiusM] = useState<number>(5000);
	const [radarFrames, setRadarFrames] = useState<string[]>([]);
	const [radarIdx, setRadarIdx] = useState<number>(0);
	const [etaText, setEtaText] = useState<string>("");
	const [tips, setTips] = useState<string[]>([]);
	const [countyLayers, setCountyLayers] = useState({
		patrickVA: { label: "Patrick County, VA", enabled: false, url: "", layers: "" },
		henryVA: { label: "Henry County, VA", enabled: false, url: "", layers: "" },
		stokesNC: { label: "Stokes County, NC", enabled: false, url: "", layers: "" },
		surryNC: { label: "Surry County, NC", enabled: false, url: "", layers: "" },
	});

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
    })();
}, [position?.coords.latitude, position?.coords.longitude]);

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

	function DrawingTools() {
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
				featureGroupRef.current?.eachLayer((layer: any) => {
					if (layer.getLatLngs) {
						const latlngs = layer.getLatLngs();
						const ring: [number, number][] = (latlngs[0] as L.LatLng[]).map((ll: L.LatLng) => [ll.lng, ll.lat]);
						if (ring.length > 2) {
							const poly = turf.polygon([[...ring, ring[0]]]);
							const area = turf.area(poly);
							const perim = turf.length(poly, { units: "kilometers" }) * 1000;
							sumArea += area;
							sumLen += perim;
							const acres = area / 4046.8564224;
							const label = `${acres.toFixed(2)} ac • ${formatMeters(perim)}`;
							if (layer.bindTooltip) {
								layer.bindTooltip(label, { permanent: true, direction: "center", className: "bg-background/80 px-2 py-1 rounded text-xs" }).openTooltip();
							}
						}
					}
				});
				setTotals({ areaSqM: sumArea, lengthM: sumLen });
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

	function aiDetect() {
		if (!map) return;
		const center = map.getCenter();
		function offset(lat: number, lng: number, dNorthM: number, dEastM: number) {
			const dLat = dNorthM / 111320;
			const dLng = dEastM / (111320 * Math.cos(lat * Math.PI / 180));
			return L.latLng(lat + dLat, lng + dLng);
		}
		const a = offset(center.lat, center.lng, 20, -30);
		const b = offset(center.lat, center.lng, 20, 30);
		const c = offset(center.lat, center.lng, -20, 30);
		const d = offset(center.lat, center.lng, -20, -30);
		const poly = L.polygon([a, b, c, d], { color: "#f59e0b", weight: 2, fillColor: "#f59e0b", fillOpacity: 0.25 });
		poly.addTo(map);
		(map as any).fire((L as any).Draw.Event.CREATED, { layer: poly });
	}

	function MapInstanceSetter({ onMap }: { onMap: (m: L.Map) => void }) {
		const m = useMap();
		useEffect(() => {
			onMap(m);
		}, [m]);
		return null;
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
					placeholder="Search address or place"
					className="border rounded px-3 py-2 w-full sm:max-w-md"
				/>
				<button
					onClick={async () => {
						const r = await searchAddress(query);
						setResults(r);
					}}
					className="border rounded px-3 py-2"
				>
					Search
				</button>
			</div>
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

			<div className="w-full h-[60vh] rounded-lg overflow-hidden border">
				<MapContainer
					center={[36.5859718, -79.86153]}
					zoom={10}
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
						<LayersControl.BaseLayer checked={provider === "google_sat"} name="Google Satellite">
							<TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={["mt0","mt1","mt2","mt3"]} />
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
						<MapFlyTo lat={parseFloat(selectedResult.lat)} lon={parseFloat(selectedResult.lon)} />
					)}

					{coords && <Circle center={[coords.lat, coords.lng]} radius={radiusM} pathOptions={{ color: "#3b82f6", weight: 1 }} />}
					<DrawingTools />

					{/* County WMS Overlays */}
					{countyLayers.patrickVA.enabled && countyLayers.patrickVA.url && countyLayers.patrickVA.layers && (
						<WMSTileLayer url={countyLayers.patrickVA.url} params={{ layers: countyLayers.patrickVA.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}
					{countyLayers.henryVA.enabled && countyLayers.henryVA.url && countyLayers.henryVA.layers && (
						<WMSTileLayer url={countyLayers.henryVA.url} params={{ layers: countyLayers.henryVA.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}
					{countyLayers.stokesNC.enabled && countyLayers.stokesNC.url && countyLayers.stokesNC.layers && (
						<WMSTileLayer url={countyLayers.stokesNC.url} params={{ layers: countyLayers.stokesNC.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}
					{countyLayers.surryNC.enabled && countyLayers.surryNC.url && countyLayers.surryNC.layers && (
						<WMSTileLayer url={countyLayers.surryNC.url} params={{ layers: countyLayers.surryNC.layers, format: 'image/png', transparent: true }} opacity={0.7} />
					)}

					{/* TODO: County layers (Patrick, Henry VA; Stokes, Surry NC) via WMS placeholders */}
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
					<div className="mt-3 flex gap-2">
						<button className="border rounded px-3 py-2" onClick={aiDetect}>AI Detect Asphalt (preview)</button>
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
						<button className="border rounded px-2 py-1" onClick={() => setRadarIdx((i) => (i - 1 + radarFrames.length) % radarFrames.length)}>Prev</button>
						<div className="text-xs text-muted-foreground">Frame {radarIdx + 1}/{radarFrames.length}</div>
						<button className="border rounded px-2 py-1" onClick={() => setRadarIdx((i) => (i + 1) % radarFrames.length)}>Next</button>
					</div>
				)}
				{tips.length > 0 && (
					<ul className="list-disc list-inside text-sm text-muted-foreground mt-3 space-y-1">
						{tips.map((t, idx) => <li key={idx}>{t}</li>)}
					</ul>
				)}
			</div>
		</div>
	);
}

