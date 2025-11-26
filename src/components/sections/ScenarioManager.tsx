import { FiSave, FiTrash2, FiLayers } from "react-icons/fi";
import type { ScenarioRecord } from "../../types";
import { SectionCard } from "../ui/SectionCard";
import { cx } from "../../utils/styles";

export const ScenarioManager = ({
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
							<li
								key={scenario.id}
								className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
							>
								<div>
									<p className="font-medium text-slate-700">{scenario.title}</p>
									<p className="text-xs text-slate-500">Guardado el {scenario.createdAt}</p>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => onLoad(scenario)}
										className="text-xs font-semibold text-blue-600 hover:underline"
									>
										Cargar
									</button>
									<button
										onClick={() => onDelete(scenario.id, "draft")}
										className="text-xs text-rose-500 hover:underline"
									>
										Eliminar
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			<div>
				<h3 className="mb-3 text-sm font-semibold text-slate-800">Historial de calculos</h3>
				{history.length === 0 && (
					<p className="text-xs text-slate-500">Todavia no se registran calculos finalizados.</p>
				)}
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
												Pena final:{" "}
												<span className="font-semibold text-blue-600">
													{scenario.result.formattedFinalPenalty}
												</span>
											</p>
										)}
									</div>
									<div className="flex items-center gap-2 text-xs">
										<button
											onClick={() => onCompareToggle(scenario.id)}
											className={cx(
												"inline-flex items-center gap-1 rounded-full border px-3 py-1",
												comparisonSet.includes(scenario.id)
													? "border-blue-500 text-blue-600"
													: "border-slate-200 text-slate-500"
											)}
										>
											<FiLayers className="h-3 w-3" /> Comparar
										</button>
										<button
											onClick={() => onLoad(scenario)}
											className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-slate-500 hover:border-blue-500 hover:text-blue-600"
										>
											<FiSave className="h-3 w-3" /> Cargar
										</button>
										<button
											onClick={() => onDelete(scenario.id, "history")}
											className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-rose-500 hover:border-rose-500"
										>
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
