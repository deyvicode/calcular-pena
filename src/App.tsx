import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode, RefObject } from "react";
import {
	FiChevronLeft,
	FiChevronRight,
	FiCheckCircle,
	FiInfo,
	FiSave,
	FiDownload,
	FiPrinter,
	FiPlus,
	FiTrash2,
	FiLayers,
} from "react-icons/fi";

type Duration = { years: number; months: number };

type BaseCrime = {
	name: string;
	article: string;
	minPenalty: Duration;
	maxPenalty: Duration;
	penaltyType: string;
};

const art45Options = [
	{
		key: "carenciasSociales",
		label: "Carencias sociales del agente",
		help: "Se valora si las condiciones socioeconomicas reducen el reproche.",
	},
	{
		key: "abusoCargo",
		label: "Abuso de cargo o posicion",
		help: "Evalua si el agente aprovecho su rol institucional o social.",
	},
	{
		key: "culturaCostumbres",
		label: "Cultura y costumbres del agente",
		help: "Considera el contexto cultural que pudo incidir en la conducta.",
	},
	{
		key: "interesesVictima",
		label: "Intereses de la victima y familia",
		help: "Analiza la reparacion y el impacto en la victima.",
	},
	{
		key: "vulnerabilidadVictima",
		label: "Vulnerabilidad de la victima",
		help: "Determina si la victima requirio proteccion reforzada.",
	},
] as const;

type Art45Key = (typeof art45Options)[number]["key"];

const atenuantesOptions = [
	{ key: "sinAntecedentes", label: "Carencia de antecedentes", help: "Registra si el agente nunca fue condenado previamente." },
	{ key: "movilesNobles", label: "Moviles nobles", help: "Considera si predominaron razones altruistas." },
	{ key: "estadoEmocion", label: "Estado de emocion excusable", help: "Verifica si hubo una perturbacion emocional intensa." },
	{ key: "circunstanciasPersonales", label: "Circunstancias personales apremiantes", help: "Analiza situaciones familiares o personales graves." },
	{ key: "disminucionConsecuencias", label: "Disminucion voluntaria del dano", help: "Revisa si el agente mitigó el perjuicio." },
	{ key: "reparacionVoluntaria", label: "Reparacion voluntaria", help: "Determina si se reparo integralmente el dano." },
	{ key: "presentacionVoluntaria", label: "Presentacion voluntaria", help: "Identifica colaboracion temprana con la autoridad." },
	{ key: "edadInfluyente", label: "Edad influyente", help: "Verifica si la edad afecto la autodeterminacion." },
] as const;

type AtenuanteKey = (typeof atenuantesOptions)[number]["key"];

const agravantesOptions = [
	{ key: "bienesUtilidadComun", label: "Bienes de utilidad comun", help: "El hecho afecto bienes destinados al interes general." },
	{ key: "bienesPublicos", label: "Bienes o recursos publicos", help: "Impacto en patrimonio estatal o recursos sociales." },
	{ key: "motivoAbyecto", label: "Motivo abyecto o mediante precio", help: "El delito se realizo por razones mezquinas o por recompensa." },
	{ key: "discriminacion", label: "Moviles de intolerancia o discriminacion", help: "Existio prejuicio por raza, genero u otra condicion." },
	{ key: "medioPeligroComun", label: "Uso de medios de peligro comun o IA", help: "Se empleo tecnologia o medios que amplifican el riesgo." },
	{ key: "ocultamiento", label: "Ocultamiento o abuso de superioridad", help: "El agente se oculto o uso ventaja desleal." },
	{ key: "consecuenciasExcesivas", label: "Consecuencias mas nocivas", help: "Hubo dano mayor al necesario para consumar el hecho." },
	{ key: "abusoCargo", label: "Abuso de cargo o poder", help: "Se instrumentalizo un cargo o profesion." },
	{ key: "pluralidadAgentes", label: "Pluralidad de agentes", help: "Intervino mas de un autor o coautor." },
	{ key: "usoInimputable", label: "Uso de inimputable", help: "Se aprovecho a un inimputable para ejecutar el hecho." },
	{ key: "direccionReclusion", label: "Direccion desde reclusion o extranjero", help: "El agente dirigio el hecho desde un centro de reclusion." },
	{ key: "danoEcologico", label: "Dano grave al equilibrio ecologico", help: "Se afecto severamente el ambiente." },
	{ key: "usoArmas", label: "Uso de armas, explosivos o venenos", help: "Se empleo armamento o medios letales." },
	{ key: "victimaVulnerable", label: "Victima en situacion de vulnerabilidad", help: "La victima era nino, adulto mayor u otra condicion especial." },
	{ key: "usoIA", label: "Uso de IA o tecnologias similares", help: "Se valio de sistemas inteligentes para potenciar el delito." },
] as const;

type AgravanteKey = (typeof agravantesOptions)[number]["key"];

type FlagRecord<T extends string> = Record<T, boolean>;

type InstitutesState = {
	responsabilidadRestringida: boolean;
	edadResponsabilidad: number | "";
	tentativa: boolean;
	tentativaCriterio: "1/3" | "1/2";
	reincidencia: boolean;
	habitualidad: boolean;
	concursoReal: boolean;
	concursoRealPenas: number[];
	concursoIdeal: boolean;
	delitoContinuado: boolean;
};

type EspecialesState = {
	atenuantePrivilegiada: string;
	agravanteCualificada: string;
};

type CircumstancesState = {
	art45: FlagRecord<Art45Key>;
	atenuantes: FlagRecord<AtenuanteKey>;
	agravantes: FlagRecord<AgravanteKey>;
	institutos: InstitutesState;
	especiales: EspecialesState;
};

type AdjustmentRecord = {
	label: string;
	article: string;
	effect: string;
	previous: number;
	resulting: number;
};

type CalculationResult = {
	stage1: {
		min: number;
		max: number;
		range: number;
		tercioInferior: [number, number];
		tercioIntermedio: [number, number];
		tercioSuperior: [number, number];
	};
	stage2: {
		tercioSeleccionado: "inferior" | "intermedio" | "superior";
		art45: string[];
		atenuantes: string[];
		agravantes: string[];
		rationale: string;
	};
	stage3: {
		baseRange: [number, number];
		basePenalty: number;
		atenuantePrivilegiada?: string;
		agravanteCualificada?: string;
	};
	stage4: {
		adjustments: AdjustmentRecord[];
		penaltyAfterInstitutes: number;
		upperLegalLimit: number;
	};
	finalPenalty: number;
	formattedFinalPenalty: string;
	warnings: string[];
};

type ScenarioRecord = {
	id: string;
	title: string;
	createdAt: string;
	status: "draft" | "final";
	snapshot: AppState;
	result?: CalculationResult | null;
};

type AppState = {
	step: number;
	baseCrime: BaseCrime;
	circumstances: CircumstancesState;
	result: CalculationResult | null;
};

type Action =
	| { type: "setStep"; payload: number }
	| { type: "updateBaseCrime"; payload: Partial<BaseCrime> }
	| { type: "toggleFlag"; payload: { group: "art45" | "atenuantes" | "agravantes"; key: string } }
	| { type: "setInstitutes"; payload: Partial<InstitutesState> | { especiales: EspecialesState } }
	| { type: "setEspecial"; payload: Partial<EspecialesState> }
	| { type: "setResult"; payload: CalculationResult | null }
	| { type: "loadSnapshot"; payload: { baseCrime: BaseCrime; circumstances: CircumstancesState; result: CalculationResult | null; step?: number } }
	| { type: "reset" };

const initialCircumstances = (): CircumstancesState => ({
	art45: art45Options.reduce((acc, item) => ({ ...acc, [item.key]: false }), {} as FlagRecord<Art45Key>),
	atenuantes: atenuantesOptions.reduce((acc, item) => ({ ...acc, [item.key]: false }), {} as FlagRecord<AtenuanteKey>),
	agravantes: agravantesOptions.reduce((acc, item) => ({ ...acc, [item.key]: false }), {} as FlagRecord<AgravanteKey>),
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
		article: "",
		minPenalty: { years: 0, months: 0 },
		maxPenalty: { years: 0, months: 0 },
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

const steps = [
	{ id: 1, title: "Datos base", description: "Defina el delito y su marco legal" },
	{ id: 2, title: "Articulo 45", description: "Circunstancias generales del agente y victima" },
	{ id: 3, title: "Articulo 46", description: "Atenuantes y agravantes" },
	{ id: 4, title: "Institutos", description: "Aplicacion de institutos y privilegios" },
	{ id: 5, title: "Informe", description: "Revision, PDF y comparaciones" },
];

const CONCURSO_REAL_MAX = 35;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roundTo = (value: number, decimals = 3) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);

const yearsFromDuration = (duration: Duration) => Number(duration.years || 0) + Number(duration.months || 0) / 12;

const formatYears = (value: number) => {
	const years = Math.trunc(value);
	const months = Math.round((value - years) * 12);
	const parts: string[] = [];
	parts.push(`${years} anio${years === 1 ? "" : "s"}`);
	if (months > 0) {
		parts.push(`${months} mes${months === 1 ? "" : "es"}`);
	}
	return parts.join(" ");
};

const computeTercios = (min: number, max: number) => {
	const range = max - min;
	const tercioInferior: [number, number] = [min, min + range / 3];
	const tercioIntermedio: [number, number] = [min + range / 3, min + (2 * range) / 3];
	const tercioSuperior: [number, number] = [min + (2 * range) / 3, max];
	return { range, tercioInferior, tercioIntermedio, tercioSuperior };
};

const determineTercio = (atenuantes: number, agravantes: number) => {
	if (agravantes === 0 && atenuantes === 0) return "inferior" as const;
	if (agravantes === 0 && atenuantes > 0) return "inferior" as const;
	if (agravantes > 0 && atenuantes > 0) return "intermedio" as const;
	return "superior" as const;
};

const validateState = (state: AppState) => {
	const errors: string[] = [];
	const warnings: string[] = [];
	const minYears = yearsFromDuration(state.baseCrime.minPenalty);
	const maxYears = yearsFromDuration(state.baseCrime.maxPenalty);
	if (!state.baseCrime.name) errors.push("Ingrese el nombre del delito base.");
	if (!state.baseCrime.article) warnings.push("Consigne el articulo del Codigo Penal para mayor claridad.");
	if (maxYears <= 0 || minYears <= 0) warnings.push("Las penas deben expresarse en anios y meses mayores a cero.");
	if (maxYears <= minYears) errors.push("La pena minima debe ser estrictamente menor que la maxima.");
	if (state.circumstances.institutos.reincidencia && state.circumstances.institutos.habitualidad) {
		warnings.push("Revise la compatibilidad de reincidencia y habitualidad; usualmente se aplican de forma excluyente.");
	}
	return { errors, warnings };
};

const cloneState = (state: AppState): AppState => JSON.parse(JSON.stringify(state));

const generateId = () => (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function calculatePenalty(state: AppState): CalculationResult {
	const { baseCrime, circumstances } = state;
	const minYears = yearsFromDuration(baseCrime.minPenalty);
	const maxYears = yearsFromDuration(baseCrime.maxPenalty);
	if (maxYears <= minYears) {
		throw new Error("La pena minima debe ser menor que la maxima.");
	}

	const art45Selected = art45Options.filter((item) => circumstances.art45[item.key]).map((item) => item.label);
	const atenuantesSelected = atenuantesOptions.filter((item) => circumstances.atenuantes[item.key]).map((item) => item.label);
	const agravantesSelected = agravantesOptions.filter((item) => circumstances.agravantes[item.key]).map((item) => item.label);

	const counts = {
		atenuantes: atenuantesSelected.length,
		agravantes: agravantesSelected.length,
	};

	const stage1Tercios = computeTercios(minYears, maxYears);
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
	const adjustments: AdjustmentRecord[] = [];

	const pushAdjustment = (entry: AdjustmentRecord) => adjustments.push(entry);

	if (circumstances.institutos.responsabilidadRestringida) {
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

	if (circumstances.institutos.tentativa) {
		const previous = currentPenalty;
		const hasSevereFactors = circumstances.agravantes.medioPeligroComun || circumstances.agravantes.usoIA || counts.agravantes > 0;
		const criterio = circumstances.institutos.tentativaCriterio;
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
			effect: "Aumento hasta la mitad por pluralidad de condenas previas." ,
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
		const suma = circumstances.institutos.concursoRealPenas.reduce((total, value) => total + Number(value || 0), currentPenalty);
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
		tercioInferior: [roundTo(stage1Tercios.tercioInferior[0], 3), roundTo(stage1Tercios.tercioInferior[1], 3)] as [number, number],
		tercioIntermedio: [roundTo(stage1Tercios.tercioIntermedio[0], 3), roundTo(stage1Tercios.tercioIntermedio[1], 3)] as [number, number],
		tercioSuperior: [roundTo(stage1Tercios.tercioSuperior[0], 3), roundTo(stage1Tercios.tercioSuperior[1], 3)] as [number, number],
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
		warnings.push("No se registraron atenuantes ni agravantes; justifique expresamente la ubicacion en el tercio.");
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

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

const badgeColors = {
	default: "bg-slate-100 text-slate-700",
	green: "bg-emerald-100 text-emerald-700",
	red: "bg-rose-100 text-rose-700",
	blue: "bg-blue-100 text-blue-700",
};

type BadgeTone = keyof typeof badgeColors;

const Badge = ({ label, tone = "default" }: { label: string; tone?: BadgeTone }) => (
	<span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badgeColors[tone])}>{label}</span>
);

const Tooltip = ({ text }: { text: string }) => (
	<span className="relative group inline-flex">
		<FiInfo className="h-4 w-4 text-slate-400" />
		<span className="invisible absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-pre-wrap rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:visible">
			{text}
		</span>
	</span>
);

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
	<div className="border-b bg-slate-50">
		<div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
			{steps.map((step) => {
				const isActive = currentStep === step.id;
				const isCompleted = currentStep > step.id;
				return (
					<div key={step.id} className="flex-1">
						<div className="flex items-center gap-3">
							<span
								className={cx(
									"flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
									isActive && "border-blue-600 text-blue-600",
									isCompleted && "border-emerald-500 bg-emerald-500 text-white",
									!isActive && !isCompleted && "border-slate-300 text-slate-400"
								)}
							>
								{isCompleted ? <FiCheckCircle className="h-4 w-4" /> : step.id}
							</span>
							<div>
								<div className={cx("text-sm font-semibold", isActive ? "text-blue-600" : "text-slate-600")}>{step.title}</div>
								<div className="text-xs text-slate-400">{step.description}</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	</div>
);

const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
	<section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
		<div className="mb-4 flex items-start justify-between gap-2">
			<div>
				<h2 className="text-lg font-semibold text-slate-800">{title}</h2>
				{subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
			</div>
		</div>
		{children}
	</section>
);

const FieldLabel = ({ label, tooltip }: { label: string; tooltip?: string }) => (
	<label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
		{label}
		{tooltip && <Tooltip text={tooltip} />}
	</label>
);

const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
	<input
		{...props}
		className={cx(
			"w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
			props.className
		)}
	/>
);

const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
	<select
		{...props}
		className={cx(
			"w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
			props.className
		)}
	/>
);

const Checkbox = ({ label, checked, onChange, tooltip, tone }: { label: string; checked: boolean; onChange: () => void; tooltip?: string; tone?: BadgeTone }) => (
	<label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:border-slate-200">
		<input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={checked} onChange={onChange} />
		<span className="flex-1 text-sm text-slate-700">
			{label}
			{tooltip && <span className="ml-2 inline-block align-middle"><Tooltip text={tooltip} /></span>}
			{tone && <span className="ml-2"><Badge label={tone === "green" ? "Atenuante" : tone === "red" ? "Agravante" : ""} tone={tone} /></span>}
		</span>
	</label>
);

const SummarySidebar = ({ state, result }: { state: AppState; result: CalculationResult | null }) => {
	const minYears = yearsFromDuration(state.baseCrime.minPenalty);
	const maxYears = yearsFromDuration(state.baseCrime.maxPenalty);
	const tercios = maxYears > minYears ? computeTercios(minYears, maxYears) : null;
	const atCount = atenuantesOptions.filter((item) => state.circumstances.atenuantes[item.key]).length;
	const agCount = agravantesOptions.filter((item) => state.circumstances.agravantes[item.key]).length;

	return (
		<aside className="space-y-4">
			<SectionCard title="Resumen rapido">
				<div className="space-y-2 text-sm text-slate-600">
					<div><span className="font-semibold text-slate-700">Delito:</span> {state.baseCrime.name || "Sin definir"}</div>
					<div><span className="font-semibold text-slate-700">Articulo:</span> {state.baseCrime.article || "Pendiente"}</div>
					<div><span className="font-semibold text-slate-700">Tipo de pena:</span> {state.baseCrime.penaltyType}</div>
					<div>
						<span className="font-semibold text-slate-700">Marco legal:</span> {minYears && maxYears ? `${formatYears(minYears)} a ${formatYears(maxYears)}` : "Completar"}
					</div>
				</div>
			</SectionCard>

			<SectionCard title="Circunstancias">
				<div className="flex items-center justify-between text-sm">
					<span className="text-emerald-600">Atenuantes</span>
					<Badge label={`${atCount}`} tone="green" />
				</div>
				<div className="mt-2 flex items-center justify-between text-sm">
					<span className="text-rose-600">Agravantes</span>
					<Badge label={`${agCount}`} tone="red" />
				</div>
			</SectionCard>

			<SectionCard title="Sistema de tercios" subtitle="Visualizacion dinamica">
				<div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
					{tercios && (
						<div className="flex h-full w-full">
							<span className="h-full flex-1 bg-emerald-300" />
							<span className="h-full flex-1 bg-amber-300" />
							<span className="h-full flex-1 bg-rose-300" />
						</div>
					)}
				</div>
				{result && (
					<div className="mt-3 text-sm text-slate-600">
						<div className="flex items-center justify-between">
							<span>Tercio seleccionado:</span>
							<Badge label={result.stage2.tercioSeleccionado} tone="blue" />
						</div>
						<div className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">
							{result.stage2.rationale}
						</div>
					</div>
				)}
			</SectionCard>
		</aside>
	);
};

const ReportView = ({
	state,
	result,
	reportRef,
	onExport,
	onPrint,
}: {
	state: AppState;
	result: CalculationResult | null;
	reportRef: RefObject<HTMLDivElement | null>;
	onExport: () => Promise<void>;
	onPrint: () => void;
}) => (
	<SectionCard title="Informe de determinacion de pena" subtitle="Generado conforme a los articulos 45, 45-A, 46 y acuerdos plenarios">
		{!result && <p className="text-sm text-slate-500">Complete el asistente y pulse "Calcular" para generar el informe.</p>}
		{result && (
			<div ref={reportRef} className="space-y-6 text-sm text-slate-700">
				<div className="text-center">
					<h3 className="text-base font-semibold text-slate-900">INFORME DE DETERMINACION DE PENA</h3>
					<p className="text-xs text-slate-500">Fecha: {new Date().toLocaleDateString()}</p>
					<p className="mt-1 font-medium text-slate-700">
						Delito analizado: {state.baseCrime.name || "Sin definir"} ({state.baseCrime.article || "Articulo pendiente"})
					</p>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">I. Datos del delito</h4>
					<ul className="mt-2 space-y-1">
						<li>Pena legal minima: {formatYears(result.stage1.min)}</li>
						<li>Pena legal maxima: {formatYears(result.stage1.max)}</li>
						<li>Rango punitivo: {result.stage1.range.toFixed(3)} anios</li>
					</ul>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">II. Determinacion judicial de la pena</h4>
					<div className="mt-2 space-y-4">
						<div>
							<p className="font-medium text-slate-800">2.1 Division del espacio punitivo (Art. 45-A.1)</p>
							<ul className="mt-2 space-y-1 text-sm">
								<li>Tercio inferior: {formatYears(result.stage1.tercioInferior[0])} a {formatYears(result.stage1.tercioInferior[1])}</li>
								<li>Tercio intermedio: {formatYears(result.stage1.tercioIntermedio[0])} a {formatYears(result.stage1.tercioIntermedio[1])}</li>
								<li>Tercio superior: {formatYears(result.stage1.tercioSuperior[0])} a {formatYears(result.stage1.tercioSuperior[1])}</li>
							</ul>
						</div>

						<div>
							<p className="font-medium text-slate-800">2.2 Evaluacion de circunstancias (Art. 45-A.2)</p>
							<div className="mt-2 grid gap-3 md:grid-cols-2">
								<div>
									<p className="text-xs font-semibold text-slate-500">Circunstancias Art. 45</p>
									<ul className="mt-1 space-y-1">
										{result.stage2.art45.length ? result.stage2.art45.map((item) => <li key={item}>{item}</li>) : <li>No se identificaron circunstancias especificas.</li>}
									</ul>
								</div>
								<div>
									<p className="text-xs font-semibold text-emerald-600">Circunstancias atenuantes (Art. 46.1)</p>
									<ul className="mt-1 space-y-1">
										{result.stage2.atenuantes.length ? result.stage2.atenuantes.map((item) => <li key={item}>{item}</li>) : <li>No se registraron atenuantes.</li>}
									</ul>
								</div>
								<div className="md:col-span-2">
									<p className="text-xs font-semibold text-rose-600">Circunstancias agravantes (Art. 46.2)</p>
									<ul className="mt-1 space-y-1">
										{result.stage2.agravantes.length ? result.stage2.agravantes.map((item) => <li key={item}>{item}</li>) : <li>No se registraron agravantes.</li>}
									</ul>
								</div>
							</div>
							<p className="mt-2 text-sm text-slate-600">
								Determinacion del tercio aplicable: <span className="font-semibold text-slate-800">{result.stage2.tercioSeleccionado}</span>
							</p>
							<p className="text-xs text-slate-500">Fundamento: {result.stage2.rationale}</p>
						</div>

						<div>
							<p className="font-medium text-slate-800">2.3 Circunstancias privilegiadas o calificadas (Art. 45-A.3)</p>
							<ul className="mt-2 space-y-1">
								<li>Atenuante privilegiada: {result.stage3.atenuantePrivilegiada || "No aplica"}</li>
								<li>Agravante cualificada: {result.stage3.agravanteCualificada || "No aplica"}</li>
							</ul>
						</div>

						<div>
							<p className="font-medium text-slate-800">2.4 Pena concreta antes de institutos</p>
							<p className="mt-1">Rango aplicable: {formatYears(result.stage3.baseRange[0])} a {formatYears(result.stage3.baseRange[1])}</p>
							<p>Pena concreta determinada: <span className="font-semibold text-slate-800">{formatYears(result.stage3.basePenalty)}</span></p>
						</div>
					</div>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">III. Aplicacion de institutos juridicos</h4>
					<div className="mt-2 space-y-2">
						{result.stage4.adjustments.length ? (
							result.stage4.adjustments.map((item) => (
								<div key={`${item.label}-${item.resulting}`} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
									<p className="text-sm font-semibold text-slate-800">{item.label} ({item.article})</p>
									<p className="text-xs text-slate-500">{item.effect}</p>
									<p className="text-xs text-slate-500">Resultado: {formatYears(item.resulting)} (antes: {formatYears(item.previous)})</p>
								</div>
							))
						) : (
							<p>No se aplicaron institutos adicionales.</p>
						)}
					</div>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">IV. Pena final determinada</h4>
					<p className="mt-2 text-lg font-semibold text-blue-700">Pena concreta: {result.formattedFinalPenalty} de pena privativa de libertad</p>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">V. Resumen del proceso</h4>
					<p className="mt-2 text-sm text-slate-600">
						El calculo se ejecuto siguiendo el sistema de tercios y ponderando las circunstancias del Art. 45 y 46. Posteriormente se aplicaron los institutos juridicos procedentes, cuidando los limites legales y los criterios de proporcionalidad establecidos por los acuerdos plenarios 1-2023 y 2-2024.
					</p>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">VI. Fundamentacion legal</h4>
					<ul className="mt-2 space-y-1 text-sm">
						<li>Art. 45 CP: Ponderacion de circunstancias personales y de la victima.</li>
						<li>Art. 45-A CP: Sistema operativo de tercios aplicado en las cuatro etapas.</li>
						<li>Art. 46 CP: Evaluacion de atenuantes y agravantes especificas.</li>
						<li>Acuerdo Plenario 1-2023/CIJ-112: Reglas de motivacion y proporcionalidad observadas.</li>
						<li>Acuerdo Plenario 2-2024/CIJ-112: Criterios especiales para tentativa en delitos graves considerados.</li>
						<li>Otros institutos: {result.stage4.adjustments.length ? result.stage4.adjustments.map((item) => item.label).join(", ") : "No se aplicaron"}.</li>
					</ul>
				</div>

				{result.warnings.length > 0 && (
					<div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
						<p className="font-semibold">Alertas a revisar:</p>
						<ul className="mt-1 list-disc space-y-1 pl-4">
							{result.warnings.map((warning) => (
								<li key={warning}>{warning}</li>
							))}
						</ul>
					</div>
				)}

				<div className="flex flex-wrap gap-3 pt-4">
					<button onClick={onExport} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
						<FiDownload /> Exportar PDF
					</button>
					<button onClick={onPrint} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
						<FiPrinter /> Imprimir
					</button>
				</div>
			</div>
		)}
	</SectionCard>
);

const ScenarioManager = ({
	history,
	drafts,
	onLoad,
	onDelete,
	onCompareToggle,
	comparisonSet,
}: {
	history: ScenarioRecord[];
	drafts: ScenarioRecord[];
	onLoad: (scenario: ScenarioRecord) => void;
	onDelete: (id: string, source: "history" | "draft") => void;
	onCompareToggle: (id: string) => void;
	comparisonSet: string[];
}) => (
	<SectionCard title="Casos guardados" subtitle="Administre borradores, historico de calculos y comparaciones">
		<div className="space-y-6 text-sm text-slate-600">
			<div>
				<h3 className="mb-3 text-sm font-semibold text-slate-800">Borradores</h3>
				{drafts.length === 0 && <p className="text-xs text-slate-500">No hay borradores guardados.</p>}
				{drafts.length > 0 && (
					<ul className="space-y-2">
						{drafts.map((scenario) => (
							<li key={scenario.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
								<div>
									<p className="font-medium text-slate-700">{scenario.title}</p>
									<p className="text-xs text-slate-500">Guardado el {scenario.createdAt}</p>
								</div>
								<div className="flex items-center gap-2">
									<button onClick={() => onLoad(scenario)} className="text-xs font-semibold text-blue-600 hover:underline">Cargar</button>
									<button onClick={() => onDelete(scenario.id, "draft")} className="text-xs text-rose-500 hover:underline">Eliminar</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div>
				<h3 className="mb-3 text-sm font-semibold text-slate-800">Historial de calculos</h3>
				{history.length === 0 && <p className="text-xs text-slate-500">Todavia no se registran calculos finalizados.</p>}
				{history.length > 0 && (
					<ul className="space-y-2">
						{history.map((scenario) => (
							<li key={scenario.id} className="rounded-lg border border-slate-200">
								<div className="flex flex-col gap-2 px-3 py-2 md:flex-row md:items-center md:justify-between">
									<div>
										<p className="font-medium text-slate-700">{scenario.title}</p>
										<p className="text-xs text-slate-500">{scenario.createdAt}</p>
										{scenario.result && (
											<p className="text-xs text-slate-500">
												Pena final: <span className="font-semibold text-blue-600">{scenario.result.formattedFinalPenalty}</span>
											</p>
										)}
									</div>
									<div className="flex items-center gap-2 text-xs">
										<button onClick={() => onCompareToggle(scenario.id)} className={cx("inline-flex items-center gap-1 rounded-full border px-3 py-1", comparisonSet.includes(scenario.id) ? "border-blue-500 text-blue-600" : "border-slate-200 text-slate-500")}
										>
											<FiLayers className="h-3 w-3" /> Comparar
										</button>
										<button onClick={() => onLoad(scenario)} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:border-blue-500 hover:text-blue-600">
											<FiSave className="h-3 w-3" /> Cargar
										</button>
										<button onClick={() => onDelete(scenario.id, "history")} className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-rose-500 hover:border-rose-500">
											<FiTrash2 className="h-3 w-3" /> Eliminar
										</button>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	</SectionCard>
);

const ComparisonPanel = ({
	scenarios,
}: {
	scenarios: ScenarioRecord[];
}) => (
	<SectionCard title="Comparacion de escenarios" subtitle="Revise diferencias clave entre los calculos seleccionados">
		{scenarios.length < 2 ? (
			<p className="text-xs text-slate-500">Seleccione al menos dos escenarios del historial para visualizar la comparacion.</p>
		) : (
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-slate-200 text-sm">
					<thead className="bg-slate-100">
						<tr>
							<th className="px-3 py-2 text-left font-semibold text-slate-700">Indicador</th>
							{scenarios.map((scenario) => (
								<th key={scenario.id} className="px-3 py-2 text-left font-semibold text-slate-700">{scenario.title}</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-slate-100">
						<tr>
							<td className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">Pena final</td>
							{scenarios.map((scenario) => (
								<td key={`${scenario.id}-pena`} className="px-3 py-2 text-sm text-slate-700">
									{scenario.result ? scenario.result.formattedFinalPenalty : "Sin calculo"}
								</td>
							))}
						</tr>
						<tr>
							<td className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">Tercio</td>
							{scenarios.map((scenario) => (
								<td key={`${scenario.id}-tercio`} className="px-3 py-2 text-sm text-slate-700">
									{scenario.result ? scenario.result.stage2.tercioSeleccionado : "-"}
								</td>
							))}
						</tr>
						<tr>
							<td className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">Atenuantes</td>
							{scenarios.map((scenario) => (
								<td key={`${scenario.id}-atenuantes`} className="px-3 py-2 text-sm text-slate-700">
									{scenario.result ? scenario.result.stage2.atenuantes.length : 0}
								</td>
							))}
						</tr>
						<tr>
							<td className="px-3 py-2 text-xs uppercase tracking-wide text-slate-500">Agravantes</td>
							{scenarios.map((scenario) => (
								<td key={`${scenario.id}-agravantes`} className="px-3 py-2 text-sm text-slate-700">
									{scenario.result ? scenario.result.stage2.agravantes.length : 0}
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
		)}
	</SectionCard>
);

const Glossary = () => (
	<SectionCard title="Glosario basico" subtitle="Referencias rapidas a terminos clave del sistema de determinacion de penas">
		<dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
			<div>
				<dt className="font-semibold text-slate-800">Sistema de tercios</dt>
				<dd>Metodologia operativa del Art. 45-A para fijar el tercio de intervencion de la pena.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Atenuante privilegiada</dt>
				<dd>Circunstancia de maxima reduccion que permite descender por debajo del tercio inferior.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Agravante cualificada</dt>
				<dd>Factor agravante que justifica exceder el tercio superior dentro del marco legal.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Iter criminis</dt>
				<dd>Recorrido del delito desde la ideacion hasta la consumacion; clave para modular la tentativa.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Concurso real</dt>
				<dd>Pluralidad de delitos independientes que suman penas, respetando el tope de 35 anios.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Delito continuado</dt>
				<dd>Reiteracion de actos homogeneos que se sanciona como unidad, con aumento moderado.</dd>
			</div>
		</dl>
	</SectionCard>
);

export default function App() {
	const [state, dispatch] = useReducer(reducer, initialState);
	const [drafts, setDrafts] = useState<ScenarioRecord[]>([]);
	const [history, setHistory] = useState<ScenarioRecord[]>([]);
	const [comparisonSet, setComparisonSet] = useState<string[]>([]);
	const reportRef = useRef<HTMLDivElement | null>(null);

	const validations = useMemo(() => validateState(state), [state]);
	const { errors, warnings } = validations;

	const goToStep = (stepId: number) => dispatch({ type: "setStep", payload: clamp(stepId, 1, 5) });

	const handleNext = () => {
		if (state.step === 1 && errors.length > 0) return;
		goToStep(state.step + 1);
	};

	const handlePrev = () => goToStep(state.step - 1);

	const handleCalculation = () => {
		if (errors.length > 0) {
			return;
		}
		try {
			const result = calculatePenalty(state);
			dispatch({ type: "setResult", payload: result });
			goToStep(5);
		} catch (error) {
			const message = error instanceof Error ? error.message : "No se pudo completar el calculo.";
			window.alert(message);
		}
	};

	const handleSaveDraft = () => {
		const title = window.prompt("Ingrese un nombre para el borrador:", state.baseCrime.name || "Caso sin titulo");
		if (!title) return;
		const scenario: ScenarioRecord = {
			id: generateId(),
			title,
			createdAt: new Date().toLocaleString(),
			status: "draft",
			snapshot: cloneState(state),
			result: state.result ? JSON.parse(JSON.stringify(state.result)) : null,
		};
		setDrafts((prev) => [...prev, scenario]);
	};

	const handleSaveHistory = () => {
		if (!state.result) {
			window.alert("Debe calcular la pena antes de guardar en el historial.");
			return;
		}
		const title = window.prompt("Nombre del caso calculado:", state.baseCrime.name || "Caso sin titulo");
		if (!title) return;
		const scenario: ScenarioRecord = {
			id: generateId(),
			title,
			createdAt: new Date().toLocaleString(),
			status: "final",
			snapshot: cloneState(state),
			result: state.result ? JSON.parse(JSON.stringify(state.result)) : null,
		};
		setHistory((prev) => [...prev, scenario]);
	};

	const loadScenario = useCallback((scenario: ScenarioRecord) => {
		const snapshot = cloneState(scenario.snapshot);
		dispatch({
			type: "loadSnapshot",
			payload: {
				baseCrime: snapshot.baseCrime,
				circumstances: snapshot.circumstances,
				result: scenario.result ?? null,
				step: snapshot.step ?? (scenario.result ? 5 : 1),
			},
		});
	}, []);

	const deleteScenario = (id: string, source: "history" | "draft") => {
		if (source === "history") {
			setHistory((prev) => prev.filter((item) => item.id !== id));
			setComparisonSet((prev) => prev.filter((item) => item !== id));
		} else {
			setDrafts((prev) => prev.filter((item) => item.id !== id));
		}
	};

	const toggleComparison = (id: string) => {
		setComparisonSet((prev) => {
			if (prev.includes(id)) return prev.filter((item) => item !== id);
			if (prev.length >= 3) return prev; // limite suave para mantener lectura
			return [...prev, id];
		});
	};

	const exportPDF = async () => {
		if (!reportRef.current) {
			window.alert("Genere un informe antes de exportar.");
			return;
		}
		const html2canvas = (await import("html2canvas")).default;
		const { jsPDF } = await import("jspdf");
		const canvas = await html2canvas(reportRef.current, { scale: 2 });
		const imageData = canvas.toDataURL("image/png");
		const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
		const pageWidth = pdf.internal.pageSize.getWidth();
		const pageHeight = pdf.internal.pageSize.getHeight();
		const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
		const imgWidth = canvas.width * ratio;
		const imgHeight = canvas.height * ratio;
		pdf.addImage(imageData, "PNG", (pageWidth - imgWidth) / 2, 20, imgWidth, imgHeight);
		pdf.save("informe_determinacion_pena.pdf");
	};

	const printReport = () => {
		window.print();
	};

	const comparisonScenarios = useMemo(() => history.filter((item) => comparisonSet.includes(item.id)), [history, comparisonSet]);

	return (
		<div className="min-h-screen bg-slate-100">
			<StepIndicator currentStep={state.step} />
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6">
				{errors.length > 0 && (
					<div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
						<p className="font-semibold">Accion requerida:</p>
						<ul className="mt-1 list-disc space-y-1 pl-4">
							{errors.map((error) => (
								<li key={error}>{error}</li>
							))}
						</ul>
					</div>
				)}
				{warnings.length > 0 && (
					<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
						<p className="font-semibold">Recomendaciones:</p>
						<ul className="mt-1 list-disc space-y-1 pl-4">
							{warnings.map((warning) => (
								<li key={warning}>{warning}</li>
							))}
						</ul>
					</div>
				)}

				<div className="grid gap-6 md:grid-cols-[2fr_1fr]">
					<div className="space-y-6">
						{state.step === 1 && (
							<SectionCard title="Datos del delito base" subtitle="Complete los campos para iniciar el calculo">
								<div className="grid gap-4 md:grid-cols-2">
									<div className="md:col-span-2 space-y-2">
										<FieldLabel label="Nombre del delito" tooltip="Nombre segun el tipo penal imputado." />
										<Input value={state.baseCrime.name} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { name: event.target.value } })} placeholder="Ej. Robo agravado" />
									</div>
									<div className="space-y-2">
										<FieldLabel label="Articulo" tooltip="Articulo especifico del Codigo Penal." />
										<Input value={state.baseCrime.article} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { article: event.target.value } })} placeholder="Ej. Art. 189" />
									</div>
									<div className="space-y-2">
										<FieldLabel label="Tipo de pena" />
										<Select value={state.baseCrime.penaltyType} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { penaltyType: event.target.value } })}>
											<option>Privativa de libertad</option>
											<option>Multa</option>
											<option>Trabajo de utilidad publica</option>
											<option>Otra</option>
										</Select>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena minima (anios)" />
										<Input type="number" min={0} value={state.baseCrime.minPenalty.years} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { minPenalty: { ...state.baseCrime.minPenalty, years: Number(event.target.value) } } })} />
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena minima (meses)" />
										<Input type="number" min={0} max={11} value={state.baseCrime.minPenalty.months} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { minPenalty: { ...state.baseCrime.minPenalty, months: Number(event.target.value) } } })} />
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena maxima (anios)" />
										<Input type="number" min={0} value={state.baseCrime.maxPenalty.years} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { maxPenalty: { ...state.baseCrime.maxPenalty, years: Number(event.target.value) } } })} />
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena maxima (meses)" />
										<Input type="number" min={0} max={11} value={state.baseCrime.maxPenalty.months} onChange={(event) => dispatch({ type: "updateBaseCrime", payload: { maxPenalty: { ...state.baseCrime.maxPenalty, months: Number(event.target.value) } } })} />
									</div>
								</div>
							</SectionCard>
						)}

						{state.step === 2 && (
							<SectionCard title="Circunstancias del Art. 45" subtitle="Seleccione los factores constatados en el caso concreto">
								<div className="grid gap-2 md:grid-cols-2">
									{art45Options.map((item) => (
										<Checkbox key={item.key} label={item.label} tooltip={item.help} checked={state.circumstances.art45[item.key]} onChange={() => dispatch({ type: "toggleFlag", payload: { group: "art45", key: item.key } })} />
									))}
								</div>
							</SectionCard>
						)}

						{state.step === 3 && (
							<div className="space-y-6">
								<SectionCard title="Circunstancias atenuantes (Art. 46.1)">
									<div className="space-y-2">
										{atenuantesOptions.map((item) => (
											<Checkbox key={item.key} label={item.label} tooltip={item.help} tone="green" checked={state.circumstances.atenuantes[item.key]} onChange={() => dispatch({ type: "toggleFlag", payload: { group: "atenuantes", key: item.key } })} />
										))}
									</div>
								</SectionCard>
								<SectionCard title="Circunstancias agravantes (Art. 46.2)">
									<div className="space-y-2 max-h-80 overflow-y-auto pr-1">
										{agravantesOptions.map((item) => (
											<Checkbox key={item.key} label={item.label} tooltip={item.help} tone="red" checked={state.circumstances.agravantes[item.key]} onChange={() => dispatch({ type: "toggleFlag", payload: { group: "agravantes", key: item.key } })} />
										))}
									</div>
								</SectionCard>
							</div>
						)}

						{state.step === 4 && (
							<SectionCard title="Institutos juridicos" subtitle="Seleccione los institutos aplicables y configure sus parametros">
								<div className="space-y-5">
									<div className="grid gap-3 md:grid-cols-2">
										<div className="space-y-2">
											<Checkbox label="Responsabilidad restringida (Art. 22)" checked={state.circumstances.institutos.responsabilidadRestringida} onChange={() =>
												dispatch({ type: "setInstitutes", payload: { responsabilidadRestringida: !state.circumstances.institutos.responsabilidadRestringida } })
											} tooltip="Aplicable a imputados menores de 21 o mayores de 65 anios." />
											{state.circumstances.institutos.responsabilidadRestringida && (
												<Input type="number" placeholder="Edad relevante" value={state.circumstances.institutos.edadResponsabilidad} onChange={(event) => dispatch({ type: "setInstitutes", payload: { edadResponsabilidad: Number(event.target.value) } })} />
											)}
										</div>
										<div className="space-y-2">
											<Checkbox label="Tentativa (Art. 16)" checked={state.circumstances.institutos.tentativa} onChange={() =>
												dispatch({ type: "setInstitutes", payload: { tentativa: !state.circumstances.institutos.tentativa } })
											} tooltip="Disminucion de pena segun progreso del iter criminis." />
											{state.circumstances.institutos.tentativa && (
												<Select value={state.circumstances.institutos.tentativaCriterio} onChange={(event) => dispatch({ type: "setInstitutes", payload: { tentativaCriterio: event.target.value as "1/3" | "1/2" } })}>
													<option value="1/3">Reduccion de un tercio</option>
													<option value="1/2">Reduccion de la mitad</option>
												</Select>
											)}
										</div>
										<Checkbox label="Reincidencia (Art. 46-B)" checked={state.circumstances.institutos.reincidencia} onChange={() =>
											dispatch({ type: "setInstitutes", payload: { reincidencia: !state.circumstances.institutos.reincidencia } })
										} tooltip="Aumento hasta un tercio segun condenas previas." />
										<Checkbox label="Habitualidad (Art. 46-C)" checked={state.circumstances.institutos.habitualidad} onChange={() =>
											dispatch({ type: "setInstitutes", payload: { habitualidad: !state.circumstances.institutos.habitualidad } })
										} tooltip="Aumento hasta la mitad por conductas habituales." />
										<div className="space-y-2">
											<Checkbox label="Concurso real (Art. 48)" checked={state.circumstances.institutos.concursoReal} onChange={() =>
												dispatch({ type: "setInstitutes", payload: { concursoReal: !state.circumstances.institutos.concursoReal } })
											} tooltip="Suma de penas con limite de 35 anios." />
											{state.circumstances.institutos.concursoReal && (
												<Input
													placeholder="Ingrese penas adicionales separadas por coma"
													onBlur={(event) => {
														const values = event.target.value
															.split(",")
															.map((item) => Number(item.trim()))
															.filter((item) => !Number.isNaN(item) && item > 0);
														dispatch({ type: "setInstitutes", payload: { concursoRealPenas: values } });
													}}
												/>
											)}
										</div>
										<Checkbox label="Concurso ideal (Art. 49)" checked={state.circumstances.institutos.concursoIdeal} onChange={() =>
											dispatch({ type: "setInstitutes", payload: { concursoIdeal: !state.circumstances.institutos.concursoIdeal } })
										} tooltip="Aumento sobre la pena mas grave dentro del tercio superior." />
										<Checkbox label="Delito continuado (Art. 50)" checked={state.circumstances.institutos.delitoContinuado} onChange={() =>
											dispatch({ type: "setInstitutes", payload: { delitoContinuado: !state.circumstances.institutos.delitoContinuado } })
										} tooltip="Trato similar al concurso ideal por reiteracion de hechos." />
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<div className="space-y-2">
											<FieldLabel label="Atenuante privilegiada" tooltip="Indique la institucion privilegiada aplicable." />
											<Input value={state.circumstances.especiales.atenuantePrivilegiada} onChange={(event) => dispatch({ type: "setEspecial", payload: { atenuantePrivilegiada: event.target.value } })} placeholder="Ej. Colaboracion eficaz" />
										</div>
										<div className="space-y-2">
											<FieldLabel label="Agravante cualificada" tooltip="Indique la agravante cualificada acreditada." />
											<Input value={state.circumstances.especiales.agravanteCualificada} onChange={(event) => dispatch({ type: "setEspecial", payload: { agravanteCualificada: event.target.value } })} placeholder="Ej. Organización criminal" />
										</div>
									</div>
								</div>
							</SectionCard>
						)}

						{state.step === 5 && (
							<ReportView state={state} result={state.result} reportRef={reportRef} onExport={exportPDF} onPrint={printReport} />
						)}

						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex gap-3">
								<button onClick={handlePrev} disabled={state.step === 1} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
									<FiChevronLeft /> Anterior
								</button>
								{state.step < 4 && (
									<button onClick={handleNext} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
										Siguiente <FiChevronRight />
									</button>
								)}
								{state.step === 4 && (
									<button onClick={handleCalculation} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
										Calcular pena
									</button>
								)}
							</div>
							<div className="flex flex-wrap gap-3">
								<button onClick={handleSaveDraft} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
									<FiSave /> Guardar borrador
								</button>
								<button onClick={handleSaveHistory} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
									<FiPlus /> Guardar caso
								</button>
								<button onClick={() => dispatch({ type: "reset" })} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
									Reiniciar
								</button>
							</div>
						</div>
					</div>

					<SummarySidebar state={state} result={state.result} />
				</div>

				<ScenarioManager history={history} drafts={drafts} onLoad={loadScenario} onDelete={deleteScenario} onCompareToggle={toggleComparison} comparisonSet={comparisonSet} />
				<ComparisonPanel scenarios={comparisonScenarios} />
				<Glossary />
			</div>
		</div>
	);
}
