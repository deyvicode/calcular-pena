export const art45Options = [
	{
		key: "carenciasSociales" as const,
		label: "Carencias sociales del agente",
		help: "Se valora si las condiciones socioeconomicas reducen el reproche.",
	},
	{
		key: "abusoCargo" as const,
		label: "Abuso de cargo o posicion",
		help: "Evalua si el agente aprovecho su rol institucional o social.",
	},
	{
		key: "culturaCostumbres" as const,
		label: "Cultura y costumbres del agente",
		help: "Considera el contexto cultural que pudo incidir en la conducta.",
	},
	{
		key: "interesesVictima" as const,
		label: "Intereses de la victima y familia",
		help: "Analiza la reparacion y el impacto en la victima.",
	},
	{
		key: "vulnerabilidadVictima" as const,
		label: "Vulnerabilidad de la victima",
		help: "Determina si la victima requirio proteccion reforzada.",
	},
];

export const atenuantesOptions = [
	{ key: "sinAntecedentes" as const, label: "Carencia de antecedentes", help: "Registra si el agente nunca fue condenado previamente." },
	{ key: "movilesNobles" as const, label: "Moviles nobles", help: "Considera si predominaron razones altruistas." },
	{ key: "estadoEmocion" as const, label: "Estado de emocion excusable", help: "Verifica si hubo una perturbacion emocional intensa." },
	{ key: "circunstanciasPersonales" as const, label: "Circunstancias personales apremiantes", help: "Analiza situaciones familiares o personales graves." },
	{ key: "disminucionConsecuencias" as const, label: "Disminucion voluntaria del dano", help: "Revisa si el agente mitigó el perjuicio." },
	{ key: "reparacionVoluntaria" as const, label: "Reparacion voluntaria", help: "Determina si se reparo integralmente el dano." },
	{ key: "presentacionVoluntaria" as const, label: "Presentacion voluntaria", help: "Identifica colaboracion temprana con la autoridad." },
	{ key: "edadInfluyente" as const, label: "Edad influyente", help: "Verifica si la edad afecto la autodeterminacion." },
];

export const agravantesOptions = [
	{ key: "bienesUtilidadComun" as const, label: "Bienes de utilidad comun", help: "El hecho afecto bienes destinados al interes general." },
	{ key: "bienesPublicos" as const, label: "Bienes o recursos publicos", help: "Impacto en patrimonio estatal o recursos sociales." },
	{ key: "motivoAbyecto" as const, label: "Motivo abyecto o mediante precio", help: "El delito se realizo por razones mezquinas o por recompensa." },
	{ key: "discriminacion" as const, label: "Moviles de intolerancia o discriminacion", help: "Existio prejuicio por raza, genero u otra condicion." },
	{ key: "medioPeligroComun" as const, label: "Uso de medios de peligro comun o IA", help: "Se empleo tecnologia o medios que amplifican el riesgo." },
	{ key: "ocultamiento" as const, label: "Ocultamiento o abuso de superioridad", help: "El agente se oculto o uso ventaja desleal." },
	{ key: "consecuenciasExcesivas" as const, label: "Consecuencias mas nocivas", help: "Hubo dano mayor al necesario para consumar el hecho." },
	{ key: "abusoCargo" as const, label: "Abuso de cargo o poder", help: "Se instrumentalizo un cargo o profesion." },
	{ key: "pluralidadAgentes" as const, label: "Pluralidad de agentes", help: "Intervino mas de un autor o coautor." },
	{ key: "usoInimputable" as const, label: "Uso de inimputable", help: "Se aprovecho a un inimputable para ejecutar el hecho." },
	{ key: "direccionReclusion" as const, label: "Direccion desde reclusion o extranjero", help: "El agente dirigio el hecho desde un centro de reclusion." },
	{ key: "danoEcologico" as const, label: "Dano grave al equilibrio ecologico", help: "Se afecto severamente el ambiente." },
	{ key: "usoArmas" as const, label: "Uso de armas, explosivos o venenos", help: "Se empleo armamento o medios letales." },
	{ key: "victimaVulnerable" as const, label: "Victima en situacion de vulnerabilidad", help: "La victima era nino, adulto mayor u otra condicion especial." },
	{ key: "usoIA" as const, label: "Uso de IA o tecnologias similares", help: "Se valio de sistemas inteligentes para potenciar el delito." },
];

export const steps = [
	{ id: 1, title: "Datos base", description: "Defina el delito y su marco legal" },
	{ id: 2, title: "Articulo 45", description: "Circunstancias generales del agente y victima" },
	{ id: 3, title: "Articulo 46", description: "Atenuantes y agravantes" },
	{ id: 4, title: "Institutos", description: "Aplicacion de institutos y privilegios" },
	{ id: 5, title: "Informe", description: "Revision, PDF y comparaciones" },
];

export const CONCURSO_REAL_MAX = 35;
export const FALLBACK_RGBA = "rgba(0, 0, 0, 1)";
export const PDF_ROOT_ID = "pena-report";
