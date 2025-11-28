import { useMemo, useRef } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Hooks
import { useAppState } from "./hooks/useAppState";

// Utils
import { calculatePenalty } from "./utils/calculations";
import { validateState } from "./utils/validation";
import { clamp } from "./utils/helpers";
import { sanitizeColorsForCanvas, convertOKLCHToRGBA } from "./utils/pdfHelpers";
import { art45Options, atenuantesOptions, agravantesOptions, PDF_ROOT_ID, FALLBACK_RGBA } from "./utils/constants";
import { CRIMES_LIST } from "./utils/crimes";

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
} from "./components/sections";

export default function App() {
	const [state, dispatch] = useAppState();
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
									<div className="space-y-2">
										<FieldLabel label="Titulo:" />
										<Select
											value={state.baseCrime.title}
											onChange={(event) =>
												dispatch({ type: "updateBaseCrime", payload: { title: event.target.value } })
											}
										>
											<option value="" selected>-- Seleccione un titulo --</option>
											{
												CRIMES_LIST.map((crime) => (
													<option key={crime.number} value={crime.name}>
														{crime.number}: {crime.name}
													</option>
												))
											}
										</Select>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Capitulo:" />
										<Select
											value={state.baseCrime.chapter}
											onChange={(event) =>
												dispatch({ type: "updateBaseCrime", payload: { chapter: event.target.value } })
											}
										>
											<option value="" selected>-- Seleccione un capitulo --</option>
											{
												state.baseCrime.title === "" ? [] :
												CRIMES_LIST.filter((crime) => crime.name === state.baseCrime.title)[0]?.chapters.map((chapter) => (
													<option key={chapter.number} value={chapter.name}>
														{chapter.number}: {chapter.name}
													</option>
												))
											}
										</Select>
									</div>
									<div className="space-y-2">
										<FieldLabel label="Delito:" />
										<Select
											value={state.baseCrime.name}
											onChange={(event) =>
												dispatch({ type: "updateBaseCrime", payload: { name: event.target.value } })
											}
										>
											<option value="" selected>-- Seleccione un delito --</option>
											{
												state.baseCrime.chapter === "" || state.baseCrime.title === "" ? [] :
												CRIMES_LIST.filter((crime) => crime.name === state.baseCrime.title)[0]?.chapters
													.filter((chapter) => chapter.name === state.baseCrime.chapter)[0]?.articles.map((article) => (
														<option key={article.number} value={"Art. " + article.number + " - " + article.name}>
															Art. {article.number}: {article.name}
														</option>
													))
											}
										</Select>
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
									<div className="md:col-span-2 grid gap-4 md:grid-cols-3">
										<div className="space-y-2">
											<FieldLabel label="Pena minima (años)" />
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
										<div className="space-y-3">
											<FieldLabel label="Pena minima (días)" />
											<Input
												type="number"
												min={0}
												max={31}
												value={state.baseCrime.minPenalty.days}
												onChange={(event) =>
													dispatch({
														type: "updateBaseCrime",
														payload: {
															minPenalty: { ...state.baseCrime.minPenalty, days: Number(event.target.value) },
														},
													})
												}
											/>
										</div>
										<div className="space-y-2">
											<FieldLabel label="Pena maxima (años)" />
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
										<div className="space-y-3">
											<FieldLabel label="Pena maxima (días)" />
											<Input
												type="number"
												min={0}
												max={31}
												value={state.baseCrime.maxPenalty.days}
												onChange={(event) =>
													dispatch({
														type: "updateBaseCrime",
														payload: {
															maxPenalty: { ...state.baseCrime.maxPenalty, days: Number(event.target.value) },
														},
													})
												}
											/>
										</div>
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
			</div>
		</div>
	);
}
