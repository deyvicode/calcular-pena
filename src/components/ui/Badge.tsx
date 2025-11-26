import { cx, badgeColors, type BadgeTone } from "../../utils/styles";

export const Badge = ({ label, tone = "default" }: { label: string; tone?: BadgeTone }) => (
	<span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", badgeColors[tone])}>
		{label}
	</span>
);
