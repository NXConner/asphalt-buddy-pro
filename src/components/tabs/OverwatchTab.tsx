import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, LayersControl, ScaleControl, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";

type MapProvider = "osm" | "google" | "google_sat" | "esri" | "county";

export function OverwatchTab() {
	const [provider, setProvider] = useState<MapProvider>("osm");
	const [hasGeolocation, setHasGeolocation] = useState<boolean>(false);
	const [position, setPosition] = useState<GeolocationPosition | null>(null);
	const [error, setError] = useState<string | null>(null);

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

			<div className="w-full h-[60vh] rounded-lg overflow-hidden border">
				<MapContainer
					center={[36.5859718, -79.86153]}
					zoom={10}
					style={{ width: "100%", height: "100%" }}
					zoomControl={false}
				>
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
				</div>
			</div>
		</div>
	);
}

