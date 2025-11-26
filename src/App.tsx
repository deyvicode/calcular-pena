import { useCallback, useMemo, useRef, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiSave, FiPlus } from "react-icons/fi";

// Types
import type { ScenarioRecord } from "./types";

// Hooks
import { useAppState } from "./hooks/useAppState";

// Utils
import { calculatePenalty } from "./utils/calculations";
import { validateState } from "./utils/validation";
import { cloneState, generateId, clamp } from "./utils/helpers";
import { sanitizeColorsForCanvas, convertOKLCHToRGBA } from "./utils/pdfHelpers";
import { art45Options, atenuantesOptions, agravantesOptions, PDF_ROOT_ID, FALLBACK_RGBA } from "./utils/constants";

// UI Components
import {
	StepIndicator,
	SectionCard,
	FieldLabel,
	Input,
	Select,
	Checkbox,
} from "./components/ui";

// Section Components
import {
	SummarySidebar,
	ReportView,
	ScenarioManager,
	ComparisonPanel,
	Glossary,
} from "./components/sections";

export default function App() {
	const [state, dispatch] = useAppState();
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
			const result = calculatePenalty(state, state.circumstances);
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

	const loadScenario = useCallback(
		(scenario: ScenarioRecord) => {
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
		},
		[dispatch]
	);

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
		const canvas = await html2canvas(reportRef.current, {
			scale: 2,
			onclone: (documentClone) => {
				const view = documentClone.defaultView ?? window;
				const target = documentClone.getElementById(PDF_ROOT_ID) as HTMLElement | null;
				const rootStyle = documentClone.documentElement
					? view.getComputedStyle(documentClone.documentElement)
					: null;
				if (documentClone.documentElement) {
					sanitizeColorsForCanvas(documentClone.documentElement as HTMLElement, view);
				}
				if (documentClone.body) {
					sanitizeColorsForCanvas(documentClone.body, view);
				}
				if (target) {
					sanitizeColorsForCanvas(target, view);
				}
				documentClone.querySelectorAll("style").forEach((styleElement) => {
					const { textContent } = styleElement;
					if (!textContent || !textContent.includes("oklch")) return;
					const sanitized = textContent.replace(/oklch\(([^)]+)\)/gi, (match) => {
						if (!rootStyle) return FALLBACK_RGBA;
						const converted = convertOKLCHToRGBA(match, rootStyle);
						return converted ?? FALLBACK_RGBA;
					});
					styleElement.textContent = sanitized;
				});
			},
		});
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

	const comparisonScenarios = useMemo(
		() => history.filter((item) => comparisonSet.includes(item.id)),
		[history, comparisonSet]
	);

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
										<Input
											value={state.baseCrime.name}
											onChange={(event) =>
												dispatch({ type: "updateBaseCrime", payload: { name: event.target.value } })
											}
											placeholder="Ej. Robo agravado"
										/>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Articulo" tooltip="Articulo especifico del Codigo Penal." />
										<Input
											value={state.baseCrime.article}
											onChange={(event) =>
												dispatch({ type: "updateBaseCrime", payload: { article: event.target.value } })
											}
											placeholder="Ej. Art. 189"
										/>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Tipo de pena" />
										<Select
											value={state.baseCrime.penaltyType}
											onChange={(event) =>
												dispatch({ type: "updateBaseCrime", payload: { penaltyType: event.target.value } })
											}
										>
											<option>Privativa de libertad</option>
											<option>Multa</option>
											<option>Trabajo de utilidad publica</option>
											<option>Otra</option>
										</Select>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena minima (anios)" />
										<Input
											type="number"
											min={0}
											value={state.baseCrime.minPenalty.years}
											onChange={(event) =>
												dispatch({
													type: "updateBaseCrime",
													payload: {
														minPenalty: { ...state.baseCrime.minPenalty, years: Number(event.target.value) },
													},
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena minima (meses)" />
										<Input
											type="number"
											min={0}
											max={11}
											value={state.baseCrime.minPenalty.months}
											onChange={(event) =>
												dispatch({
													type: "updateBaseCrime",
													payload: {
														minPenalty: { ...state.baseCrime.minPenalty, months: Number(event.target.value) },
													},
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena maxima (anios)" />
										<Input
											type="number"
											min={0}
											value={state.baseCrime.maxPenalty.years}
											onChange={(event) =>
												dispatch({
													type: "updateBaseCrime",
													payload: {
														maxPenalty: { ...state.baseCrime.maxPenalty, years: Number(event.target.value) },
													},
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Pena maxima (meses)" />
										<Input
											type="number"
											min={0}
											max={11}
											value={state.baseCrime.maxPenalty.months}
											onChange={(event) =>
												dispatch({
													type: "updateBaseCrime",
													payload: {
														maxPenalty: { ...state.baseCrime.maxPenalty, months: Number(event.target.value) },
													},
												})
											}
										/>
									</div>
								</div>
							</SectionCard>
						)}

						{state.step === 2 && (
							<SectionCard
								title="Circunstancias del Art. 45"
								subtitle="Seleccione los factores constatados en el caso concreto"
							>
								<div className="grid gap-2 md:grid-cols-2">
									{art45Options.map((item) => (
										<Checkbox
											key={item.key}
											label={item.label}
											tooltip={item.help}
											checked={state.circumstances.art45[item.key]}
											onChange={() =>
												dispatch({ type: "toggleFlag", payload: { group: "art45", key: item.key } })
											}
										/>
									))}
								</div>
							</SectionCard>
						)}

						{state.step === 3 && (
							<div className="space-y-6">
								<SectionCard title="Circunstancias atenuantes (Art. 46.1)">
									<div className="space-y-2">
										{atenuantesOptions.map((item) => (
											<Checkbox
												key={item.key}
												label={item.label}
												tooltip={item.help}
												tone="green"
												checked={state.circumstances.atenuantes[item.key]}
												onChange={() =>
													dispatch({ type: "toggleFlag", payload: { group: "atenuantes", key: item.key } })
												}
											/>
										))}
									</div>
								</SectionCard>
								<SectionCard title="Circunstancias agravantes (Art. 46.2)">
									<div className="space-y-2 max-h-80 overflow-y-auto pr-1">
										{agravantesOptions.map((item) => (
											<Checkbox
												key={item.key}
												label={item.label}
												tooltip={item.help}
												tone="red"
												checked={state.circumstances.agravantes[item.key]}
												onChange={() =>
													dispatch({ type: "toggleFlag", payload: { group: "agravantes", key: item.key } })
												}
											/>
										))}
									</div>
								</SectionCard>
							</div>
						)}

						{state.step === 4 && (
							<SectionCard
								title="Institutos juridicos"
								subtitle="Seleccione los institutos aplicables y configure sus parametros"
							>
								<div className="space-y-5">
									<div className="grid gap-3 md:grid-cols-2">
										<div className="space-y-2">
											<Checkbox
												label="Responsabilidad restringida (Art. 22)"
												checked={state.circumstances.institutos.responsabilidadRestringida}
												onChange={() =>
													dispatch({
														type: "setInstitutes",
														payload: {
															responsabilidadRestringida:
																!state.circumstances.institutos.responsabilidadRestringida,
														},
													})
												}
												tooltip="Aplicable a imputados menores de 21 o mayores de 65 anios."
											/>
											{state.circumstances.institutos.responsabilidadRestringida && (
												<Input
													type="number"
													placeholder="Edad relevante"
													value={state.circumstances.institutos.edadResponsabilidad}
													onChange={(event) =>
														dispatch({
															type: "setInstitutes",
															payload: { edadResponsabilidad: Number(event.target.value) },
														})
													}
												/>
											)}
										</div>
										<div className="space-y-2">
											<Checkbox
												label="Tentativa (Art. 16)"
												checked={state.circumstances.institutos.tentativa}
												onChange={() =>
													dispatch({
														type: "setInstitutes",
														payload: { tentativa: !state.circumstances.institutos.tentativa },
													})
												}
												tooltip="Disminucion de pena segun progreso del iter criminis."
											/>
											{state.circumstances.institutos.tentativa && (
												<Select
													value={state.circumstances.institutos.tentativaCriterio}
													onChange={(event) =>
														dispatch({
															type: "setInstitutes",
															payload: { tentativaCriterio: event.target.value as "1/3" | "1/2" },
														})
													}
												>
													<option value="1/3">Reduccion de un tercio</option>
													<option value="1/2">Reduccion de la mitad</option>
												</Select>
											)}
										</div>
										<Checkbox
											label="Reincidencia (Art. 46-B)"
											checked={state.circumstances.institutos.reincidencia}
											onChange={() =>
												dispatch({
													type: "setInstitutes",
													payload: { reincidencia: !state.circumstances.institutos.reincidencia },
												})
											}
											tooltip="Aumento hasta un tercio segun condenas previas."
										/>
										<Checkbox
											label="Habitualidad (Art. 46-C)"
											checked={state.circumstances.institutos.habitualidad}
											onChange={() =>
												dispatch({
													type: "setInstitutes",
													payload: { habitualidad: !state.circumstances.institutos.habitualidad },
												})
											}
											tooltip="Aumento hasta la mitad por conductas habituales."
										/>
										<div className="space-y-2">
											<Checkbox
												label="Concurso real (Art. 48)"
												checked={state.circumstances.institutos.concursoReal}
												onChange={() =>
													dispatch({
														type: "setInstitutes",
														payload: { concursoReal: !state.circumstances.institutos.concursoReal },
													})
												}
												tooltip="Suma de penas con limite de 35 anios."
											/>
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
										<Checkbox
											label="Concurso ideal (Art. 49)"
											checked={state.circumstances.institutos.concursoIdeal}
											onChange={() =>
												dispatch({
													type: "setInstitutes",
													payload: { concursoIdeal: !state.circumstances.institutos.concursoIdeal },
												})
											}
											tooltip="Aumento sobre la pena mas grave dentro del tercio superior."
										/>
										<Checkbox
											label="Delito continuado (Art. 50)"
											checked={state.circumstances.institutos.delitoContinuado}
											onChange={() =>
												dispatch({
													type: "setInstitutes",
													payload: { delitoContinuado: !state.circumstances.institutos.delitoContinuado },
												})
											}
											tooltip="Trato similar al concurso ideal por reiteracion de hechos."
										/>
									</div>

									<div className="grid gap-3 md:grid-cols-2">
										<div className="space-y-2">
											<FieldLabel
												label="Atenuante privilegiada"
												tooltip="Indique la institucion privilegiada aplicable."
											/>
											<Input
												value={state.circumstances.especiales.atenuantePrivilegiada}
												onChange={(event) =>
													dispatch({
														type: "setEspecial",
														payload: { atenuantePrivilegiada: event.target.value },
													})
												}
												placeholder="Ej. Colaboracion eficaz"
											/>
										</div>
										<div className="space-y-2">
											<FieldLabel
												label="Agravante cualificada"
												tooltip="Indique la agravante cualificada acreditada."
											/>
											<Input
												value={state.circumstances.especiales.agravanteCualificada}
												onChange={(event) =>
													dispatch({
														type: "setEspecial",
														payload: { agravanteCualificada: event.target.value },
													})
												}
												placeholder="Ej. Organización criminal"
											/>
										</div>
									</div>
								</div>
							</SectionCard>
						)}

						{state.step === 5 && (
							<ReportView
								state={state}
								result={state.result}
								reportRef={reportRef}
								onExport={exportPDF}
								onPrint={printReport}
							/>
						)}

						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="flex gap-3">
								<button
									onClick={handlePrev}
									disabled={state.step === 1}
									className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<FiChevronLeft /> Anterior
								</button>
								{state.step < 4 && (
									<button
										onClick={handleNext}
										className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
									>
										Siguiente <FiChevronRight />
									</button>
								)}
								{state.step === 4 && (
									<button
										onClick={handleCalculation}
										className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
									>
										Calcular pena
									</button>
								)}
							</div>
							<div className="flex flex-wrap gap-3">
								<button
									onClick={handleSaveDraft}
									className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
								>
									<FiSave /> Guardar borrador
								</button>
								<button
									onClick={handleSaveHistory}
									className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
								>
									<FiPlus /> Guardar caso
								</button>
								<button
									onClick={() => dispatch({ type: "reset" })}
									className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
								>
									Reiniciar
								</button>
							</div>
						</div>
					</div>

					<SummarySidebar state={state} result={state.result} />
				</div>

				<ScenarioManager
					history={history}
					drafts={drafts}
					onLoad={loadScenario}
					onDelete={deleteScenario}
					onCompareToggle={toggleComparison}
					comparisonSet={comparisonSet}
				/>
				<ComparisonPanel scenarios={comparisonScenarios} />
				<Glossary />
			</div>
		</div>
	);
}
