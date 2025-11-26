import type { AppState, CalculationResult } from "../types";
import { art45Options, atenuantesOptions, agravantesOptions, CONCURSO_REAL_MAX } from "./constants";
import { yearsFromDuration, formatYears, computeTercios, determineTercio, roundTo, clamp, lerp } from "./helpers";

export function calculatePenalty(state: AppState, circumstances: AppState["circumstances"]): CalculationResult {
	const minYears = yearsFromDuration(state.baseCrime.minPenalty);
	const maxYears = yearsFromDuration(state.baseCrime.maxPenalty);

	if (maxYears <= minYears || minYears <= 0) {
		throw new Error("Marco legal invalido");
	}

	const stage1Tercios = computeTercios(minYears, maxYears);

	const art45Selected = art45Options.filter((item) => circumstances.art45[item.key]).map((item) => item.label);
	const atenuantesSelected = atenuantesOptions.filter((item) => circumstances.atenuantes[item.key]).map((item) => item.label);
	const agravantesSelected = agravantesOptions.filter((item) => circumstances.agravantes[item.key]).map((item) => item.label);

	const counts = { atenuantes: atenuantesSelected.length, agravantes: agravantesSelected.length };
	const tercioSeleccionado = determineTercio(counts.atenuantes, counts.agravantes);

	const tercioRanges: Record<string, [number, number]> = {
		inferior: stage1Tercios.tercioInferior,
		intermedio: stage1Tercios.tercioIntermedio,
		superior: stage1Tercios.tercioSuperior,
	};

	const baseRange = tercioRanges[tercioSeleccionado];
	const art45Score = art45Selected.length ? art45Selected.length / art45Options.length : 0.5;
	let basePenalty = lerp(baseRange[0], baseRange[1], clamp(art45Score, 0, 1));

	let privilegedNote: string | undefined;
	let qualifiedNote: string | undefined;

	if (circumstances.especiales.atenuantePrivilegiada.trim()) {
		privilegedNote = circumstances.especiales.atenuantePrivilegiada;
		basePenalty = clamp(basePenalty - (baseRange[1] - baseRange[0]) * 0.4, minYears, baseRange[1]);
	}

	if (circumstances.especiales.agravanteCualificada.trim()) {
		qualifiedNote = circumstances.especiales.agravanteCualificada;
		basePenalty = clamp(basePenalty + (baseRange[1] - baseRange[0]) * 0.4, baseRange[0], maxYears);
	}

	let currentPenalty = basePenalty;

	type Adjustment = {
		label: string;
		article: string;
		effect: string;
		previous: number;
		resulting: number;
	};

	const adjustments: Adjustment[] = [];
	const pushAdjustment = (adj: Adjustment) => adjustments.push(adj);

	const institutos = circumstances.institutos;

	if (institutos.responsabilidadRestringida) {
		const previous = currentPenalty;
		currentPenalty = roundTo(currentPenalty * 0.6, 4);
		pushAdjustment({
			label: "Responsabilidad restringida",
			article: "Art. 22",
			effect: "Reduccion prudencial por edad (menor de 21 o mayor de 65).",
			previous,
			resulting: currentPenalty,
		});
	}

	if (institutos.tentativa) {
		const previous = currentPenalty;
		const hasSevereFactors =
			circumstances.agravantes.medioPeligroComun ||
			circumstances.agravantes.usoIA ||
			counts.agravantes > 0;
		const criterio = institutos.tentativaCriterio;
		let factor = criterio === "1/2" ? 0.5 : 2 / 3;
		if (hasSevereFactors && criterio === "1/3") {
			factor = 0.6; // acuerdo 2-2024 orienta reduccion menor cuando hay agravantes relevantes
		}
		currentPenalty = roundTo(currentPenalty * factor, 4);
		pushAdjustment({
			label: "Tentativa",
			article: "Art. 16",
			effect: `Reduccion ${criterio === "1/2" ? "de la mitad" : "de un tercio"} considerando el iter criminis recorrido.`,
			previous,
			resulting: currentPenalty,
		});
	}

	if (circumstances.institutos.reincidencia) {
		const previous = currentPenalty;
		const limit = maxYears * (4 / 3);
		currentPenalty = roundTo(Math.min(previous * (4 / 3), limit), 4);
		pushAdjustment({
			label: "Reincidencia",
			article: "Art. 46-B",
			effect: "Incremento hasta un tercio sobre el maximo legal por antecedentes condenatorios.",
			previous,
			resulting: currentPenalty,
		});
	}

	if (circumstances.institutos.habitualidad) {
		const previous = currentPenalty;
		const limit = maxYears * 1.5;
		currentPenalty = roundTo(Math.min(previous * 1.5, limit), 4);
		pushAdjustment({
			label: "Habitualidad",
			article: "Art. 46-C",
			effect: "Aumento hasta la mitad por pluralidad de condenas previas.",
			previous,
			resulting: currentPenalty,
		});
	}

	if (circumstances.institutos.concursoIdeal || circumstances.institutos.delitoContinuado) {
		const previous = currentPenalty;
		const increment = counts.agravantes > 0 ? 0.35 : 0.25;
		currentPenalty = roundTo(clamp(previous * (1 + increment), baseRange[1], maxYears), 4);
		pushAdjustment({
			label: circumstances.institutos.concursoIdeal ? "Concurso ideal" : "Delito continuado",
			article: circumstances.institutos.concursoIdeal ? "Art. 49" : "Art. 50",
			effect: "Se eleva la pena dentro del tercio superior del delito mas grave.",
			previous,
			resulting: currentPenalty,
		});
	}

	if (circumstances.institutos.concursoReal && circumstances.institutos.concursoRealPenas.length) {
		const previous = currentPenalty;
		const suma = circumstances.institutos.concursoRealPenas.reduce(
			(total, value) => total + Number(value || 0),
			currentPenalty
		);
		currentPenalty = roundTo(Math.min(suma, CONCURSO_REAL_MAX), 4);
		pushAdjustment({
			label: "Concurso real",
			article: "Art. 48",
			effect: "Suma de penas respetando el tope de 35 anios.",
			previous,
			resulting: currentPenalty,
		});
	}

	const finalPenalty = roundTo(currentPenalty, 3);

	const stage1 = {
		min: roundTo(minYears, 3),
		max: roundTo(maxYears, 3),
		range: roundTo(maxYears - minYears, 3),
		tercioInferior: [
			roundTo(stage1Tercios.tercioInferior[0], 3),
			roundTo(stage1Tercios.tercioInferior[1], 3),
		] as [number, number],
		tercioIntermedio: [
			roundTo(stage1Tercios.tercioIntermedio[0], 3),
			roundTo(stage1Tercios.tercioIntermedio[1], 3),
		] as [number, number],
		tercioSuperior: [
			roundTo(stage1Tercios.tercioSuperior[0], 3),
			roundTo(stage1Tercios.tercioSuperior[1], 3),
		] as [number, number],
	};

	const stage2 = {
		tercioSeleccionado,
		art45: art45Selected,
		atenuantes: atenuantesSelected,
		agravantes: agravantesSelected,
		rationale: `Se selecciono el tercio ${tercioSeleccionado} conforme al balance de ${counts.atenuantes} atenuantes y ${counts.agravantes} agravantes bajo el Art. 45-A.`,
	};

	const stage3 = {
		baseRange: [roundTo(baseRange[0], 3), roundTo(baseRange[1], 3)] as [number, number],
		basePenalty: roundTo(basePenalty, 3),
		atenuantePrivilegiada: privilegedNote,
		agravanteCualificada: qualifiedNote,
	};

	const stage4 = {
		adjustments,
		penaltyAfterInstitutes: finalPenalty,
		upperLegalLimit: roundTo(maxYears, 3),
	};

	const warnings: string[] = [];
	if (!atenuantesSelected.length && !agravantesSelected.length) {
		warnings.push(
			"No se registraron atenuantes ni agravantes; justifique expresamente la ubicacion en el tercio."
		);
	}
	if (finalPenalty > CONCURSO_REAL_MAX) {
		warnings.push("La pena supera el limite general de 35 anios; revise el calculo del concurso real.");
	}

	return {
		stage1,
		stage2,
		stage3,
		stage4,
		finalPenalty,
		formattedFinalPenalty: formatYears(finalPenalty),
		warnings,
	};
}
