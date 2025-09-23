export type GeocodeResult = {
	display_name: string;
	lat: string;
	lon: string;
	boundingbox?: [string, string, string, string];
};

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
	if (!query || query.trim().length < 3) return [];
    // Prefer backend proxy to ensure proper headers and avoid rate-limit issues
    try {
        const apiBase = (import.meta as any)?.env?.VITE_API_URL ? String((import.meta as any).env.VITE_API_URL) : "";
        const url = apiBase ? `${apiBase.replace(/\/$/, '')}/geocode?q=${encodeURIComponent(query)}&limit=5` : `/api/geocode?q=${encodeURIComponent(query)}&limit=5`;
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (res.ok) {
            const data = (await res.json()) as GeocodeResult[];
            return Array.isArray(data) ? data : [];
        }
    } catch {
        // fall through to direct
    }
    // Fallback direct to Nominatim
    const direct = new URL("https://nominatim.openstreetmap.org/search");
    direct.searchParams.set("q", query);
    direct.searchParams.set("format", "json");
    direct.searchParams.set("addressdetails", "1");
    direct.searchParams.set("limit", "5");
    const email = (import.meta as any)?.env?.VITE_NOMINATIM_EMAIL;
    if (email) direct.searchParams.set("email", String(email));
    const res2 = await fetch(direct.toString(), { headers: { "Accept": "application/json" } });
    if (!res2.ok) {
        throw new Error(`Geocode failed: ${res2.status}`);
    }
    const data2 = (await res2.json()) as GeocodeResult[];
    return data2;
}

