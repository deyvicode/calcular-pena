import { SectionCard } from "../ui/SectionCard";

export const Glossary = () => (
	<SectionCard
		title="Glosario basico"
		subtitle="Referencias rapidas a terminos clave del sistema de determinacion de penas"
	>
		<dl className="grid gap-4 text-sm text-slate-600 md:grid-cols-2">
			<div>
				<dt className="font-semibold text-slate-800">Sistema de tercios</dt>
				<dd>Metodologia operativa del Art. 45-A para fijar el tercio de intervencion de la pena.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Atenuante privilegiada</dt>
				<dd>
					Circunstancia de maxima reduccion que permite descender por debajo del tercio inferior.
				</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Agravante cualificada</dt>
				<dd>Factor agravante que justifica exceder el tercio superior dentro del marco legal.</dd>
			</div>
			<div>
				<dt className="font-semibold text-slate-800">Iter criminis</dt>
				<dd>
					Recorrido del delito desde la ideacion hasta la consumacion; clave para modular la
					tentativa.
				</dd>
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
