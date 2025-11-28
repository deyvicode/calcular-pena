import type { RefObject } from "react";
import { FiDownload, FiPrinter } from "react-icons/fi";
import type { AppState, CalculationResult } from "../../types";
import { SectionCard } from "../ui/SectionCard";
import { formatYears } from "../../utils/helpers";
import { PDF_ROOT_ID } from "../../utils/constants";

export const ReportView = ({
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
	<SectionCard
		title="Informe de determinacion de pena"
		subtitle="Generado conforme a los articulos 45, 45-A, 46 y acuerdos plenarios"
	>
		{!result && (
			<p className="text-sm text-slate-500">
				Complete el asistente y pulse "Calcular" para generar el informe.
			</p>
		)}
		{result && (
			<div id={PDF_ROOT_ID} ref={reportRef} className="space-y-6 text-sm text-slate-700">
				<div className="text-center">
					<h3 className="text-base font-semibold text-slate-900">INFORME DE DETERMINACION DE PENA</h3>
					<p className="text-xs text-slate-500">Fecha: {new Date().toLocaleDateString()}</p>
					<p className="mt-1 font-medium text-slate-700">
						Delito analizado: {state.baseCrime.name || "Sin definir"}
					</p>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">I. Datos del delito</h4>
					<ul className="mt-2 space-y-1">
						<li>Pena legal minima: {formatYears(result.stage1.min)}</li>
						<li>Pena legal maxima: {formatYears(result.stage1.max)}</li>
						<li>Rango punitivo: {result.stage1.range.toFixed(3)} años</li>
					</ul>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">II. Determinacion judicial de la pena</h4>
					<div className="mt-2 space-y-4">
						<div>
							<p className="font-medium text-slate-800">2.1 Division del espacio punitivo (Art. 45-A.1)</p>
							<ul className="mt-2 space-y-1 text-sm">
								<li>
									Tercio inferior: {formatYears(result.stage1.tercioInferior[0])} a{" "}
									{formatYears(result.stage1.tercioInferior[1])}
								</li>
								<li>
									Tercio intermedio: {formatYears(result.stage1.tercioIntermedio[0])} a{" "}
									{formatYears(result.stage1.tercioIntermedio[1])}
								</li>
								<li>
									Tercio superior: {formatYears(result.stage1.tercioSuperior[0])} a{" "}
									{formatYears(result.stage1.tercioSuperior[1])}
								</li>
							</ul>
						</div>

						<div>
							<p className="font-medium text-slate-800">2.2 Evaluacion de circunstancias (Art. 45-A.2)</p>
							<div className="mt-2 grid gap-3 md:grid-cols-2">
								<div>
									<p className="text-xs font-semibold text-slate-500">Circunstancias Art. 45</p>
									<ul className="mt-1 space-y-1">
										{result.stage2.art45.length ? (
											result.stage2.art45.map((item) => <li key={item}>{item}</li>)
										) : (
											<li>No se identificaron circunstancias especificas.</li>
										)}
									</ul>
								</div>
								<div>
									<p className="text-xs font-semibold text-emerald-600">
										Circunstancias atenuantes (Art. 46.1)
									</p>
									<ul className="mt-1 space-y-1">
										{result.stage2.atenuantes.length ? (
											result.stage2.atenuantes.map((item) => <li key={item}>{item}</li>)
										) : (
											<li>No se registraron atenuantes.</li>
										)}
									</ul>
								</div>
								<div className="md:col-span-2">
									<p className="text-xs font-semibold text-rose-600">
										Circunstancias agravantes (Art. 46.2)
									</p>
									<ul className="mt-1 space-y-1">
										{result.stage2.agravantes.length ? (
											result.stage2.agravantes.map((item) => <li key={item}>{item}</li>)
										) : (
											<li>No se registraron agravantes.</li>
										)}
									</ul>
								</div>
							</div>
							<p className="mt-2 text-sm text-slate-600">
								Determinacion del tercio aplicable:{" "}
								<span className="font-semibold text-slate-800">{result.stage2.tercioSeleccionado}</span>
							</p>
							<p className="text-xs text-slate-500">Fundamento: {result.stage2.rationale}</p>
						</div>

						<div>
							<p className="font-medium text-slate-800">
								2.3 Circunstancias privilegiadas o calificadas (Art. 45-A.3)
							</p>
							<ul className="mt-2 space-y-1">
								<li>Atenuante privilegiada: {result.stage3.atenuantePrivilegiada || "No aplica"}</li>
								<li>Agravante cualificada: {result.stage3.agravanteCualificada || "No aplica"}</li>
							</ul>
						</div>

						<div>
							<p className="font-medium text-slate-800">2.4 Pena concreta antes de institutos</p>
							<p className="mt-1">
								Rango aplicable: {formatYears(result.stage3.baseRange[0])} a{" "}
								{formatYears(result.stage3.baseRange[1])}
							</p>
							<p>
								Pena concreta determinada:{" "}
								<span className="font-semibold text-slate-800">
									{formatYears(result.stage3.basePenalty)}
								</span>
							</p>
						</div>
					</div>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">III. Aplicacion de institutos juridicos</h4>
					<div className="mt-2 space-y-2">
						{result.stage4.adjustments.length ? (
							result.stage4.adjustments.map((item) => (
								<div
									key={`${item.label}-${item.resulting}`}
									className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
								>
									<p className="text-sm font-semibold text-slate-800">
										{item.label} ({item.article})
									</p>
									<p className="text-xs text-slate-500">{item.effect}</p>
									<p className="text-xs text-slate-500">
										Resultado: {formatYears(item.resulting)} (antes: {formatYears(item.previous)})
									</p>
								</div>
							))
						) : (
							<p>No se aplicaron institutos adicionales.</p>
						)}
					</div>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">IV. Pena final determinada</h4>
					<p className="mt-2 text-lg font-semibold text-blue-700">
						Pena concreta: {result.formattedFinalPenalty} de pena privativa de libertad
					</p>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">V. Resumen del proceso</h4>
					<p className="mt-2 text-sm text-slate-600">
						El calculo se ejecuto siguiendo el sistema de tercios y ponderando las circunstancias del Art.
						45 y 46. Posteriormente se aplicaron los institutos juridicos procedentes, cuidando los limites
						legales y los criterios de proporcionalidad establecidos por los acuerdos plenarios 1-2023 y
						2-2024.
					</p>
				</div>

				<div>
					<h4 className="text-sm font-semibold text-slate-900">VI. Fundamentacion legal</h4>
					<ul className="mt-2 space-y-1 text-sm">
						<li>Art. 45 CP: Ponderacion de circunstancias personales y de la victima.</li>
						<li>Art. 45-A CP: Sistema operativo de tercios aplicado en las cuatro etapas.</li>
						<li>Art. 46 CP: Evaluacion de atenuantes y agravantes especificas.</li>
						<li>
							Acuerdo Plenario 1-2023/CIJ-112: Reglas de motivacion y proporcionalidad observadas.
						</li>
						<li>
							Acuerdo Plenario 2-2024/CIJ-112: Criterios especiales para tentativa en delitos graves
							considerados.
						</li>
						<li>
							Otros institutos:{" "}
							{result.stage4.adjustments.length
								? result.stage4.adjustments.map((item) => item.label).join(", ")
								: "No se aplicaron"}
							.
						</li>
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
					<button
						onClick={onExport}
						className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
					>
						<FiDownload /> Exportar PDF
					</button>
					<button
						onClick={onPrint}
						className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
					>
						<FiPrinter /> Imprimir
					</button>
				</div>
			</div>
		)}
	</SectionCard>
);
