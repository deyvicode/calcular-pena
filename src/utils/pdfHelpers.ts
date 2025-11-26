import { FALLBACK_RGBA } from "./constants";

export const sanitizeColorsForCanvas = (root: HTMLElement, view: Window) => {
	const apply = (element: HTMLElement) => {
		const style = view.getComputedStyle(element);

		for (let i = 0; i < style.length; i += 1) {
			const propertyName = style.item(i);
			if (!propertyName) continue;
			const value = style.getPropertyValue(propertyName);
			if (typeof value === "string" && value.includes("oklch")) {
				const sanitized = replaceOKLCHFunctions(value, style);
				if (sanitized) {
					element.style.setProperty(propertyName, sanitized);
				}
			}
		}
	};

	apply(root);
	const ownerDocument = root.ownerDocument ?? document;
	const walker = ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
	while (walker.nextNode()) {
		apply(walker.currentNode as HTMLElement);
	}
};

const replaceOKLCHFunctions = (input: string, style: CSSStyleDeclaration) => {
	const converted = input.replace(/oklch\(([^)]+)\)/gi, (match) => convertOKLCHToRGBA(match, style) ?? FALLBACK_RGBA);
	return converted;
};

export const convertOKLCHToRGBA = (oklchExpression: string, style: CSSStyleDeclaration): string | null => {
	const inner = oklchExpression.slice(6, -1).trim();
	const [colorPartRaw, alphaPartRaw] = inner.split("/");
	const tokens = colorPartRaw.trim().split(/\s+/);
	if (tokens.length < 3) {
		return null;
	}

	const parseNumber = (token: string): number | null => {
		const trimmed = token.trim();
		const varMatch = trimmed.match(/var\((--[^,\s)]+)(?:,\s*([^)]*))?\)/i);
		if (varMatch) {
			const [, varName, fallback] = varMatch;
			const raw = style.getPropertyValue(varName).trim();
			if (raw) {
				const resolved = parseNumber(raw);
				if (resolved !== null) {
					return resolved;
				}
			}
			if (fallback) {
				return parseNumber(fallback);
			}
		}

		const cleaned = trimmed.replace(/deg|rad|grad|turn|%/gi, "");
		const value = Number.parseFloat(cleaned);
		if (Number.isNaN(value)) {
			return null;
		}
		if (trimmed.endsWith("%")) {
			return value / 100;
		}
		return value;
	};

	let l = parseNumber(tokens[0]);
	let c = parseNumber(tokens[1]);
	const h = parseNumber(tokens[2]);

	if (l === null || c === null || h === null) {
		return null;
	}

	if (l > 1) {
		l = l / 100;
	}
	if (c > 1) {
		c = c / 100;
	}

	let alpha = 1;
	if (alphaPartRaw) {
		const alphaToken = alphaPartRaw.trim();
		const numericAlpha = parseNumber(alphaToken);
		if (numericAlpha !== null) {
			alpha = numericAlpha;
		} else {
			const varMatch = alphaToken.match(/var\((--[^)]+)\)/);
			if (varMatch) {
				const varValue = Number.parseFloat(style.getPropertyValue(varMatch[1]));
				if (!Number.isNaN(varValue)) {
					alpha = varValue;
				}
			}
		}
	}

	const rgba = oklchToRGBA(l, c, h, alpha);
	if (!rgba) {
		return null;
	}
	return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
};

const oklchToRGBA = (l: number, c: number, hDeg: number, alpha: number) => {
	const hRad = ((hDeg % 360) * Math.PI) / 180;
	const a = Math.cos(hRad) * c;
	const b = Math.sin(hRad) * c;

	const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = l - 0.0894841775 * a - 1.291485548 * b;

	const l3 = l_ ** 3;
	const m3 = m_ ** 3;
	const s3 = s_ ** 3;

	let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
	let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
	let bVal = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3;

	const gammaCompress = (channel: number) => {
		const clamped = Math.min(1, Math.max(0, channel));
		if (clamped <= 0.0031308) {
			return 12.92 * clamped;
		}
		return 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
	};

	r = gammaCompress(r);
	g = gammaCompress(g);
	bVal = gammaCompress(bVal);

	if (![r, g, bVal].every((channel) => Number.isFinite(channel))) {
		return null;
	}

	return {
		r: Math.round(Math.min(1, Math.max(0, r)) * 255),
		g: Math.round(Math.min(1, Math.max(0, g)) * 255),
		b: Math.round(Math.min(1, Math.max(0, bVal)) * 255),
		a: Math.min(1, Math.max(0, Number(alpha.toFixed(3)))),
	};
};
