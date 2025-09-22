export type GeocodeResult = {
	display_name: string;
	lat: string;
	lon: string;
	boundingbox?: [string, string, string, string];
};

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
	if (!query || query.trim().length < 3) return [];
	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("q", query);
	url.searchParams.set("format", "json");
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("limit", "5");
	const res = await fetch(url.toString(), {
		headers: { "Accept": "application/json" }
	});
	if (!res.ok) return [];
	const data = (await res.json()) as GeocodeResult[];
	return data;
}

