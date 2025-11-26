import type { InputHTMLAttributes } from "react";
import { cx } from "../../utils/styles";

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
	<input
		{...props}
		className={cx(
			"w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200",
			props.className
		)}
	/>
);
