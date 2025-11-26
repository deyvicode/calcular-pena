export const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export const badgeColors = {
	default: "bg-slate-100 text-slate-700",
	green: "bg-emerald-100 text-emerald-700",
	red: "bg-rose-100 text-rose-700",
	blue: "bg-blue-100 text-blue-700",
};

export type BadgeTone = keyof typeof badgeColors;
