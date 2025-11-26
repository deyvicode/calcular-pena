import type { ReactNode } from "react";

export const SectionCard = ({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) => (
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
