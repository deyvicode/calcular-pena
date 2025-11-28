import { useReducer } from "react";
import type { AppState, Action, CircumstancesState, FlagRecord, Art45Key, AtenuanteKey, AgravanteKey, InstitutesState } from "../types";
import { art45Options, atenuantesOptions, agravantesOptions } from "../utils/constants";

const initialCircumstances = (): CircumstancesState => ({
	art45: art45Options.reduce((acc, item) => ({ ...acc, [item.key]: false }), {} as FlagRecord<Art45Key>),
	atenuantes: atenuantesOptions.reduce(
		(acc, item) => ({ ...acc, [item.key]: false }),
		{} as FlagRecord<AtenuanteKey>
	),
	agravantes: agravantesOptions.reduce(
		(acc, item) => ({ ...acc, [item.key]: false }),
		{} as FlagRecord<AgravanteKey>
	),
	institutos: {
		responsabilidadRestringida: false,
		edadResponsabilidad: "",
		tentativa: false,
		tentativaCriterio: "1/3",
		reincidencia: false,
		habitualidad: false,
		concursoReal: false,
		concursoRealPenas: [],
		concursoIdeal: false,
		delitoContinuado: false,
	},
	especiales: {
		atenuantePrivilegiada: "",
		agravanteCualificada: "",
	},
});

const initialState: AppState = {
	step: 1,
	baseCrime: {
		name: "",
		title: "",
		chapter: "",
		minPenalty: { years: 0, months: 0, days: 0 },
		maxPenalty: { years: 0, months: 0, days: 0 },
		penaltyType: "Privativa de libertad",
	},
	circumstances: initialCircumstances(),
	result: null,
};

function reducer(state: AppState, action: Action): AppState {
	switch (action.type) {
		case "setStep":
			return { ...state, step: action.payload };
		case "updateBaseCrime":
			return { ...state, baseCrime: { ...state.baseCrime, ...action.payload } };
		case "toggleFlag": {
			const { group, key } = action.payload;
			const current = state.circumstances[group as keyof CircumstancesState] as Record<string, boolean>;
			return {
				...state,
				circumstances: {
					...state.circumstances,
					[group]: { ...current, [key]: !current[key] },
				},
			};
		}
		case "setInstitutes":
			return {
				...state,
				circumstances: {
					...state.circumstances,
					institutos: { ...state.circumstances.institutos, ...(action.payload as Partial<InstitutesState>) },
				},
			};
		case "setEspecial":
			return {
				...state,
				circumstances: {
					...state.circumstances,
					especiales: { ...state.circumstances.especiales, ...action.payload },
				},
			};
		case "setResult":
			return { ...state, result: action.payload };
		case "loadSnapshot":
			return {
				step: action.payload.step ?? 5,
				baseCrime: action.payload.baseCrime,
				circumstances: action.payload.circumstances,
				result: action.payload.result,
			};
		case "reset":
			return {
				...initialState,
				circumstances: initialCircumstances(),
			};
		default:
			return state;
	}
}

export function useAppState() {
	return useReducer(reducer, initialState);
}
