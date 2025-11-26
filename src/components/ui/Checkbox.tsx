import { Badge } from "./Badge";
import { Tooltip } from "./Tooltip";
import type { BadgeTone } from "../../utils/styles";

export const Checkbox = ({
	label,
	checked,
	onChange,
	tooltip,
	tone,
}: {
	label: string;
	checked: boolean;
	onChange: () => void;
	tooltip?: string;
	tone?: BadgeTone;
}) => (
	<label className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-2 py-2 hover:border-slate-200">
		<input
			type="checkbox"
			className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
			checked={checked}
			onChange={onChange}
		/>
		<span className="flex-1 text-sm text-slate-700">
			{label}
			{tooltip && (
				<span className="ml-2 inline-block align-middle">
					<Tooltip text={tooltip} />
				</span>
			)}
			{tone && (
				<span className="ml-2">
					<Badge label={tone === "green" ? "Atenuante" : tone === "red" ? "Agravante" : ""} tone={tone} />
				</span>
			)}
		</span>
	</label>
);
