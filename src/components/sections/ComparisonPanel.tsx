import type { ScenarioRecord } from "../../types";
import { SectionCard } from "../ui/SectionCard";

export const ComparisonPanel = ({ scenarios }: { scenarios: ScenarioRecord[] }) => (
	<SectionCard
		title="Comparacion de escenarios"
		subtitle="Revise diferencias clave entre los calculos seleccionados"
	>
		{scenarios.length < 2 ? (
			<p className="text-xs text-slate-500">
				Seleccione al menos dos escenarios del historial para visualizar la comparacion.
			</p>
		) : (
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-slate-200 text-sm">
					<thead className="bg-slate-100">
						<tr>
							<th className="px-3 py-2 text-left font-semibold text-slate-700">Indicador</th>
							{scenarios.map((scenario) => (
								<th key={scenario.id} className="px-3 py-2 text-left font-semibold text-slate-700">
									{scenario.title}
								</th>
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
