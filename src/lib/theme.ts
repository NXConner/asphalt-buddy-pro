export type ThemeMode = 'light' | 'dark' | 'auto'

export interface ThemeVars {
	primary?: string
	secondary?: string
	accentColor?: string
	backgroundOpacity?: number
	fontSize?: 'small' | 'medium' | 'large'
	borderRadius?: 'none' | 'small' | 'medium' | 'large'
}

export interface UIThemeSettings {
	mode: ThemeMode
	accentColor: string
	backgroundOpacity: number
	animations: boolean
	reducedMotion: boolean
	fontSize: 'small' | 'medium' | 'large'
	borderRadius: 'none' | 'small' | 'medium' | 'large'
  backgroundImage?: string
}

const RADIUS_MAP: Record<NonNullable<UIThemeSettings['borderRadius']>, string> = {
	'none': '0rem',
	'small': '0.375rem',
	'medium': '0.75rem',
	'large': '1rem',
}

const FONT_SIZE_CLASS_MAP: Record<NonNullable<UIThemeSettings['fontSize']>, string> = {
	'small': 'text-[14px]',
	'medium': 'text-[16px]',
	'large': 'text-[18px]',
}

export function applyThemeVariables(settings: UIThemeSettings) {
	if (typeof document === 'undefined') return
	const root = document.documentElement

	// Accent -> map to --primary and related hues if provided as hex
	try {
		const accent = settings.accentColor
		if (accent) {
			// Convert hex to HSL, fallback to default if parsing fails
			const hsl = hexToHsl(accent)
			if (hsl) {
				root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`)
				root.style.setProperty('--primary-glow', `${hsl.h} ${Math.min(100, hsl.s)}% ${Math.min(100, hsl.l + 10)}%`)
				root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`)
			}
		}
	} catch {}

	// Background opacity can affect card/muted overlays
	if (typeof settings.backgroundOpacity === 'number') {
		// We can expose an alpha custom prop used in classes if desired
		root.style.setProperty('--bg-opacity', `${settings.backgroundOpacity}`)
	}

  // Apply wallpaper background image if provided
  try {
    if (settings.backgroundImage) {
      const url = settings.backgroundImage
      document.body.style.backgroundImage = `url("${url}")`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundAttachment = 'fixed'
    } else {
      document.body.style.backgroundImage = ''
    }
  } catch {}

	// Border radius
	if (settings.borderRadius) {
		root.style.setProperty('--radius', RADIUS_MAP[settings.borderRadius])
	}

	// Font size via utility class on body (simpler than resetting Tailwind base size)
	const body = document.body
	body.classList.remove(FONT_SIZE_CLASS_MAP.small, FONT_SIZE_CLASS_MAP.medium, FONT_SIZE_CLASS_MAP.large)
	body.classList.add(FONT_SIZE_CLASS_MAP[settings.fontSize])

	// Animations / reduced motion hints
	if (settings.reducedMotion) {
		root.style.setProperty('--transition-smooth', 'all 0ms linear')
	} else {
		root.style.setProperty('--transition-smooth', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)')
	}
}

export function applyThemeMode(mode: ThemeMode) {
	if (typeof document === 'undefined') return
	const root = document.documentElement
	const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
	const isDark = mode === 'dark' || (mode === 'auto' && prefersDark)
	root.classList.toggle('dark', isDark)
	root.classList.toggle('light', !isDark)
}

export function applyUITheme(settings: UIThemeSettings) {
	applyThemeMode(settings.mode)
	applyThemeVariables(settings)
}

export function listenForThemeChanges() {
	window.addEventListener('ui-theme-updated', (e: any) => {
		const s = e?.detail?.theme as UIThemeSettings | undefined
		if (s) applyUITheme(s)
	})
}

export function broadcastThemeUpdated(settings: UIThemeSettings) {
	window.dispatchEvent(new CustomEvent('ui-theme-updated', { detail: { theme: settings } }))
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
	const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
	if (!res) return null
	const r = parseInt(res[1], 16) / 255
	const g = parseInt(res[2], 16) / 255
	const b = parseInt(res[3], 16) / 255
	const max = Math.max(r, g, b), min = Math.min(r, g, b)
	let h = 0, s = 0
	const l = (max + min) / 2
	if (max !== min) {
		const d = max - min
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break
			case g: h = (b - r) / d + 2; break
			case b: h = (r - g) / d + 4; break
		}
		h /= 6
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

