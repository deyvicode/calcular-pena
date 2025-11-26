import { FiInfo } from "react-icons/fi";

export const Tooltip = ({ text }: { text: string }) => (
	<span className="relative group inline-flex">
		<FiInfo className="h-4 w-4 text-slate-400" />
		<span className="invisible absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-pre-wrap rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:visible">
			{text}
		</span>
	</span>
);
