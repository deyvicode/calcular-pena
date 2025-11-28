import type { AppState } from "../types";
import { yearsFromDuration } from "./helpers";

export const validateState = (state: AppState) => {
	const errors: string[] = [];
	const warnings: string[] = [];
	const minYears = yearsFromDuration(state.baseCrime.minPenalty);
	const maxYears = yearsFromDuration(state.baseCrime.maxPenalty);
	if (!state.baseCrime.name) errors.push("Ingrese el nombre del delito base.");
	if (maxYears <= 0 || minYears <= 0) warnings.push("Las penas deben expresarse en anios y meses mayores a cero.");
	if (maxYears <= minYears) errors.push("La pena minima debe ser estrictamente menor que la maxima.");
	if (state.circumstances.institutos.reincidencia && state.circumstances.institutos.habitualidad) {
		warnings.push("Revise la compatibilidad de reincidencia y habitualidad; usualmente se aplican de forma excluyente.");
	}
	return { errors, warnings };
};
