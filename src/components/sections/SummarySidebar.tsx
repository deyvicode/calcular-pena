import type { AppState, CalculationResult } from "../../types";
import { Badge } from "../ui/Badge";
import { SectionCard } from "../ui/SectionCard";
import { yearsFromDuration, formatYears, computeTercios } from "../../utils/helpers";
import { atenuantesOptions, agravantesOptions } from "../../utils/constants";

export const SummarySidebar = ({ state, result }: { state: AppState; result: CalculationResult | null }) => {
	const minYears = yearsFromDuration(state.baseCrime.minPenalty);
	const maxYears = yearsFromDuration(state.baseCrime.maxPenalty);
	const tercios = maxYears > minYears ? computeTercios(minYears, maxYears) : null;
	const atCount = atenuantesOptions.filter((item) => state.circumstances.atenuantes[item.key]).length;
	const agCount = agravantesOptions.filter((item) => state.circumstances.agravantes[item.key]).length;

	return (
		<aside className="space-y-4">
			<SectionCard title="Resumen rapido">
				<div className="space-y-2 text-sm text-slate-600">
					<div>
						<span className="font-semibold text-slate-700">Delito:</span> {state.baseCrime.name || "Sin definir"}
					</div>
					<div>
						<span className="font-semibold text-slate-700">Tipo de pena:</span> {state.baseCrime.penaltyType}
					</div>
					<div>
						<span className="font-semibold text-slate-700">Marco legal:</span>{" "}
						{minYears && maxYears ? `${formatYears(minYears)} a ${formatYears(maxYears)}` : "Completar"}
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
							<Badge label={result.stage2.tercioSeleccionado} tone={result.stage2.tercioSeleccionado === "inferior" ? "green" : result.stage2.tercioSeleccionado === "intermedio" ? "yellow" : "red"} />
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
