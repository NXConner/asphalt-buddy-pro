export type RainviewerFrame = {
	path: string;
	time: number;
	host?: string;
};

export type RainviewerData = {
	radar: {
		past: RainviewerFrame[];
		nowcast: RainviewerFrame[];
	};
};

export async function fetchRainviewer(): Promise<RainviewerData | null> {
	try {
		const res = await fetch("https://api.rainviewer.com/public/weather-maps.json", { headers: { Accept: "application/json" } });
		if (!res.ok) return null;
		return (await res.json()) as RainviewerData;
	} catch {
		return null;
	}
}

export type ForecastHour = {
	time: string;
	precipitation: number | null;
	precipitation_probability: number | null;
	weathercode: number | null;
};

export type ForecastResult = {
	hours: ForecastHour[];
};

export async function fetchForecast(latitude: number, longitude: number): Promise<ForecastResult | null> {
	try {
		const url = new URL("https://api.open-meteo.com/v1/forecast");
		url.searchParams.set("latitude", latitude.toString());
		url.searchParams.set("longitude", longitude.toString());
		url.searchParams.set("hourly", "precipitation,precipitation_probability,weathercode");
		url.searchParams.set("forecast_days", "2");
		url.searchParams.set("timezone", "auto");
		const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
		if (!res.ok) return null;
		const data = await res.json();
		const hours: ForecastHour[] = (data.hourly?.time || []).map((t: string, idx: number) => ({
			time: t,
			precipitation: data.hourly?.precipitation?.[idx] ?? null,
			precipitation_probability: data.hourly?.precipitation_probability?.[idx] ?? null,
			weathercode: data.hourly?.weathercode?.[idx] ?? null,
		}));
		return { hours };
	} catch {
		return null;
	}
}

export type RainEta = {
	nextStart?: Date;
	nextStop?: Date;
	currentIntensityMmPerH?: number;
};

export function computeRainEta(now: Date, forecast: ForecastResult | null): RainEta {
	if (!forecast) return {};
	const hours = forecast.hours;
	if (!hours.length) return {};
	// find the first hour >= now with precipitation > 0.1 mm/h
	const startIdx = hours.findIndex(h => new Date(h.time) >= now && (h.precipitation ?? 0) > 0.1);
	if (startIdx === -1) return { currentIntensityMmPerH: 0 };
	const nextStart = new Date(hours[startIdx].time);
	let stopIdx = startIdx;
	for (let i = startIdx; i < hours.length; i++) {
		if ((hours[i].precipitation ?? 0) <= 0.1) { break; }
		stopIdx = i;
	}
	const nextStop = new Date(hours[stopIdx].time);
	// current hour intensity if within precip window
	const currentHourIdx = hours.findIndex(h => h.time.startsWith(now.toISOString().slice(0, 13)));
	const currentIntensity = currentHourIdx >= 0 ? (hours[currentHourIdx].precipitation ?? 0) : undefined;
	return { nextStart, nextStop, currentIntensityMmPerH: currentIntensity };
}

export function generateWeatherTips(eta: RainEta, forecast: ForecastResult | null): string[] {
	const tips: string[] = [];
	const now = new Date();
	if (eta.nextStart) {
		const mins = Math.max(0, Math.round((eta.nextStart.getTime() - now.getTime()) / 60000));
		if (mins <= 120) tips.push(`Rain likely in about ${mins} min. Prioritize short tasks, pause striping/seal if curing requires dry window.`);
		else tips.push(`Rain expected later today (~${eta.nextStart.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}). Schedule weather-sensitive work earlier.`);
	} else {
		tips.push("No rain expected soon. Proceed with asphalt work; maintain hydration and sun protection.");
	}
	if ((eta.currentIntensityMmPerH ?? 0) > 2) tips.push("Heavy rain intensity forecast. Secure materials and cover equipment.");
	if (forecast?.hours?.some(h => (h.precipitation_probability ?? 0) >= 70)) tips.push("High precipitation probability periods detected. Plan indoor or prep tasks accordingly.");
	return tips;
}

