import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, LayersControl, ScaleControl, ZoomControl, Marker, Popup, useMap } from "react-leaflet";
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
					</LayersControl>

					{coords && (
						<Marker position={[coords.lat, coords.lng]}>
							<Popup>Current location<br/>±{Math.round(coords.acc)} m</Popup>
						</Marker>
					)}

					{selectedResult && (
						<MapFlyTo lat={parseFloat(selectedResult.lat)} lon={parseFloat(selectedResult.lon)} />
					)}

					<DrawingTools />

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
				<h3 className="font-medium mb-2">Measurements</h3>
				<div className="text-sm text-muted-foreground">Total area: {(totals.areaSqM / 4046.8564224).toFixed(2)} acres • Total perimeter: {totals.lengthM.toFixed(1)} m</div>
			</div>
		</div>
	);
}

