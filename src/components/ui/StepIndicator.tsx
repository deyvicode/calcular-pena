import { FiCheckCircle } from "react-icons/fi";
import { steps } from "../../utils/constants";
import { cx } from "../../utils/styles";

export const StepIndicator = ({ currentStep }: { currentStep: number }) => (
	<div className="border-b bg-slate-50">
		<div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-5">
			{steps.map((step) => {
				const isActive = currentStep === step.id;
				const isCompleted = currentStep > step.id;
				return (
					<div key={step.id} className="flex-1">
						<div className="flex items-center gap-3">
							<span
								className={cx(
									"flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
									isActive && "border-blue-600 text-blue-600",
									isCompleted && "border-emerald-500 bg-emerald-500 text-white",
									!isActive && !isCompleted && "border-slate-300 text-slate-400"
								)}
							>
								{isCompleted ? <FiCheckCircle className="h-4 w-4" /> : step.id}
							</span>
							<div>
								<div className={cx("text-sm font-semibold", isActive ? "text-blue-600" : "text-slate-600")}>
									{step.title}
								</div>
								<div className="text-xs text-slate-400">{step.description}</div>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	</div>
);
