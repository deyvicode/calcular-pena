import { Tooltip } from "./Tooltip";

export const FieldLabel = ({ label, tooltip }: { label: string; tooltip?: string }) => (
	<label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
		{label}
		{tooltip && <Tooltip text={tooltip} />}
	</label>
);
