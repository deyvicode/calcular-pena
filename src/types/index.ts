export type Duration = { years: number; months: number };

export type BaseCrime = {
	name: string;
	article: string;
	minPenalty: Duration;
	maxPenalty: Duration;
	penaltyType: string;
};

export type FlagRecord<T extends string> = Record<T, boolean>;

export type InstitutesState = {
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

export type EspecialesState = {
	atenuantePrivilegiada: string;
	agravanteCualificada: string;
};

export type Art45Key = "carenciasSociales" | "abusoCargo" | "culturaCostumbres" | "interesesVictima" | "vulnerabilidadVictima";

export type AtenuanteKey =
	| "sinAntecedentes"
	| "movilesNobles"
	| "estadoEmocion"
	| "circunstanciasPersonales"
	| "disminucionConsecuencias"
	| "reparacionVoluntaria"
	| "presentacionVoluntaria"
	| "edadInfluyente";

export type AgravanteKey =
	| "bienesUtilidadComun"
	| "bienesPublicos"
	| "motivoAbyecto"
	| "discriminacion"
	| "medioPeligroComun"
	| "ocultamiento"
	| "consecuenciasExcesivas"
	| "abusoCargo"
	| "pluralidadAgentes"
	| "usoInimputable"
	| "direccionReclusion"
	| "danoEcologico"
	| "usoArmas"
	| "victimaVulnerable"
	| "usoIA";

export type CircumstancesState = {
	art45: FlagRecord<Art45Key>;
	atenuantes: FlagRecord<AtenuanteKey>;
	agravantes: FlagRecord<AgravanteKey>;
	institutos: InstitutesState;
	especiales: EspecialesState;
};

export type AdjustmentRecord = {
	label: string;
	article: string;
	effect: string;
	previous: number;
	resulting: number;
};

export type CalculationResult = {
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

export type AppState = {
	step: number;
	baseCrime: BaseCrime;
	circumstances: CircumstancesState;
	result: CalculationResult | null;
};

export type ScenarioRecord = {
	id: string;
	title: string;
	createdAt: string;
	status: "draft" | "final";
	snapshot: AppState;
	result?: CalculationResult | null;
};

export type Action =
	| { type: "setStep"; payload: number }
	| { type: "updateBaseCrime"; payload: Partial<BaseCrime> }
	| { type: "toggleFlag"; payload: { group: "art45" | "atenuantes" | "agravantes"; key: string } }
	| { type: "setInstitutes"; payload: Partial<InstitutesState> }
	| { type: "setEspecial"; payload: Partial<EspecialesState> }
	| { type: "setResult"; payload: CalculationResult | null }
	| { type: "loadSnapshot"; payload: { baseCrime: BaseCrime; circumstances: CircumstancesState; result: CalculationResult | null; step?: number } }
	| { type: "reset" };
