import type { Duration } from "../types";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const roundTo = (value: number, decimals = 3) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

export const yearsFromDuration = (duration: Duration) => Number(duration.years || 0) + Number(duration.months || 0) / 12;

export const formatYears = (value: number) => {
	const years = Math.trunc(value);
	const months = Math.round((value - years) * 12);
	const parts: string[] = [];
	parts.push(`${years} anio${years === 1 ? "" : "s"}`);
	if (months > 0) {
		parts.push(`${months} mes${months === 1 ? "" : "es"}`);
	}
	return parts.join(" ");
};

export const computeTercios = (min: number, max: number) => {
	const range = max - min;
	const tercioInferior: [number, number] = [min, min + range / 3];
	const tercioIntermedio: [number, number] = [min + range / 3, min + (2 * range) / 3];
	const tercioSuperior: [number, number] = [min + (2 * range) / 3, max];
	return { range, tercioInferior, tercioIntermedio, tercioSuperior };
};

export const determineTercio = (atenuantes: number, agravantes: number) => {
	if (agravantes === 0 && atenuantes === 0) return "inferior" as const;
	if (agravantes === 0 && atenuantes > 0) return "inferior" as const;
	if (agravantes > 0 && atenuantes > 0) return "intermedio" as const;
	return "superior" as const;
};

export const cloneState = <T>(state: T): T => JSON.parse(JSON.stringify(state));

export const generateId = () => (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2));
