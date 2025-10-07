import { Badge } from "@/components/ui/badge";
import {
	TrendingUp,
	TrendingDown,
	Minus,
	Play,
	AlertCircle,
	HelpCircle,
	Clock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OEECardProps {
	availability_oee: string;
	shift_type: string;
	planned_production_seconds: string;
	green_seconds: string;
	red_seconds: string;
	amber_seconds: string;
	unknown_seconds: string;
	planned_morning_seconds?: string;
	planned_night_seconds?: string;
	total_seconds: string;
}

export function OEECard({
	availability_oee,
	planned_production_seconds,
	green_seconds,
	red_seconds,
	amber_seconds,
	unknown_seconds,
	planned_morning_seconds,
	planned_night_seconds,
	total_seconds,
}: OEECardProps) {
	const oeeValue = parseFloat(availability_oee);
	const plannedSeconds = parseFloat(planned_production_seconds);
	const runSeconds = parseFloat(green_seconds);
	const errorSeconds = parseFloat(red_seconds);
	const idleSeconds = parseFloat(amber_seconds);
	const unknownSeconds = parseFloat(unknown_seconds);
	const totalSeconds = parseFloat(total_seconds);

	const formatTime = (seconds: number) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return { hours, minutes };
	};

	const plannedTime = formatTime(plannedSeconds);
	const runTime = formatTime(runSeconds);
	const errorTime = formatTime(errorSeconds);
	const idleTime = formatTime(idleSeconds);
	const unknownTime = formatTime(unknownSeconds);
	const totalTime = totalSeconds;

	const downtimeSeconds = errorSeconds + idleSeconds;
	const downtimeTime = formatTime(downtimeSeconds);

	const totalOperatingSeconds = runSeconds + errorSeconds + idleSeconds;
	const totalOperatingTime = formatTime(totalOperatingSeconds);

	const runPercentage = totalTime > 0 ? (runSeconds / totalTime) * 100 : 0;
	const errorPercentage =
		totalTime > 0 ? (errorSeconds / totalTime) * 100 : 0;
	const idlePercentage = totalTime > 0 ? (idleSeconds / totalTime) * 100 : 0;
	const downtimePercentage =
		totalTime > 0 ? (downtimeSeconds / totalTime) * 100 : 0;
	const unknownPercentage =
		totalTime > 0 ? (unknownSeconds / totalTime) * 100 : 0;

	const utilizationPercentage =
		plannedSeconds > 0 ? (totalOperatingSeconds / plannedSeconds) * 100 : 0;

	const getOEEStatus = (value: number) => {
		if (value >= 85)
			return {
				label: "Excellent",
				color: "text-green-600 dark:text-green-400",
				bg: "bg-green-50 dark:bg-green-950",
				border: "border-green-300 dark:border-green-700 shadow-sm shadow-green-200/50 dark:shadow-green-900/20",
				icon: TrendingUp,
			};
		if (value >= 70)
			return {
				label: "Good",
				color: "text-blue-600 dark:text-blue-400",
				bg: "bg-blue-50 dark:bg-blue-950",
				border: "border-blue-300 dark:border-blue-700 shadow-sm shadow-blue-200/50 dark:shadow-blue-900/20",
				icon: TrendingUp,
			};
		if (value >= 50)
			return {
				label: "Fair",
				color: "text-yellow-600 dark:text-yellow-400",
				bg: "bg-yellow-50 dark:bg-yellow-950",
				border: "border-yellow-300 dark:border-yellow-700 shadow-sm shadow-yellow-200/50 dark:shadow-yellow-900/20",
				icon: Minus,
			};
		return {
			label: "Poor",
			color: "text-red-600 dark:text-red-400",
			bg: "bg-red-50 dark:bg-red-950",
			border: "border-red-300 dark:border-red-700 shadow-sm shadow-red-200/50 dark:shadow-red-900/20",
			icon: TrendingDown,
		};
	};

	const status = getOEEStatus(oeeValue);
	const StatusIcon = status.icon;

	const formatTimeDisplay = (hours: number, minutes: number) => {
		if (hours === 0 && minutes === 0) return "0m";
		if (hours === 0) return `${minutes}m`;
		return `${hours}h ${minutes}m`;
	};

	const formatPlannedShiftTime = (seconds?: string) => {
		if (!seconds || parseFloat(seconds) === 0) return "-";
		const time = formatTime(parseFloat(seconds));
		return formatTimeDisplay(time.hours, time.minutes);
	};

	return (
		<div className="grid grid-cols-12 gap-3">
			<div className="col-span-12 lg:col-span-3">
				<div
					className={`rounded-xl p-6 h-full flex flex-col justify-between ${status.bg} ${status.border} transition-all duration-300 hover:shadow-md`}>
					<div>
						<div className="flex items-center justify-between mb-13">
							<span className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Availability OEE
							</span>
							<Badge variant="outline" className={status.color}>
								<StatusIcon className="w-4 h-4 mr-1" />
								{status.label}
							</Badge>
						</div>
						<div
							className={`text-7xl font-bold text-center ${status.color} mb-4`}>
							{availability_oee}%
						</div>
					</div>
					<div>
						<Progress value={oeeValue} className="h-2 mb-3" />
						<div className="flex justify-between text-xs text-gray-500 px-1">
							<span>0%</span>
							<span className="font-semibold">Target: 85%</span>
							<span>100%</span>
						</div>
					</div>
				</div>
			</div>

			<div className="col-span-12 lg:col-span-3">
				<div className="flex flex-col gap-4 h-full">
					<div className="p-5 rounded-xl bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 shadow-sm shadow-green-200/50 dark:shadow-green-900/20 transition-all duration-300 hover:shadow-md">
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-3">
								<div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
									<Play className="w-5 h-5 text-green-600 dark:text-green-400" />
								</div>
								<div className="flex-1">
									<div className="font-semibold text-green-600 dark:text-green-400 mb-1">
										Run Time
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										{runPercentage.toFixed(2)}% of planned
										time
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-xl font-bold text-green-600 dark:text-green-400">
									{formatTimeDisplay(
										runTime.hours,
										runTime.minutes
									)}
								</div>
								<div className="text-xs text-gray-500 mt-1">
									{runSeconds.toFixed(0)}s
								</div>
							</div>
						</div>
					</div>

					<div className="flex-1 p-5 rounded-xl bg-red-50 dark:bg-red-950 border border-red-300 dark:border-red-700 shadow-sm shadow-red-200/50 dark:shadow-red-900/20 transition-all duration-300 hover:shadow-md">
						<div className="flex items-start justify-between mb-4">
							<div className="flex items-start gap-3">
								<div className="p-2 rounded-lg bg-red-100 dark:bg-red-900">
									<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
								</div>
								<div className="flex-1">
									<div className="font-semibold text-red-600 dark:text-red-400 mb-1">
										Total Downtime
									</div>
									<div className="text-sm text-gray-600 dark:text-gray-400">
										{downtimePercentage.toFixed(2)}% of
										planned time
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-xl font-bold text-red-600 dark:text-red-400">
									{formatTimeDisplay(
										downtimeTime.hours,
										downtimeTime.minutes
									)}
								</div>
								<div className="text-xs text-gray-500 mt-1">
									{downtimeSeconds.toFixed(0)}s
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3">
							<div className="p-3 rounded-lg bg-white/60 dark:bg-black/40 border border-red-200 dark:border-red-800 text-center transition-colors duration-200 hover:bg-white/80 dark:hover:bg-black/60">
								<div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
									Error Time
								</div>
								<div className="text-lg font-bold text-red-600 dark:text-red-400">
									{formatTimeDisplay(
										errorTime.hours,
										errorTime.minutes
									)}
								</div>
								<div className="text-xs text-gray-500">
									{errorPercentage.toFixed(2)}%
								</div>
							</div>
							<div className="p-3 rounded-lg bg-white/60 dark:bg-black/40 border border-amber-200 dark:border-amber-800 text-center transition-colors duration-200 hover:bg-white/80 dark:hover:bg-black/60">
								<div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
									Idle Time
								</div>
								<div className="text-lg font-bold text-amber-600 dark:text-amber-400">
									{formatTimeDisplay(
										idleTime.hours,
										idleTime.minutes
									)}
								</div>
								<div className="text-xs text-gray-500">
									{idlePercentage.toFixed(2)}%
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div className="col-span-12 lg:col-span-3">
				<div className="flex flex-col gap-4 h-full">
					<div className="flex-1">
						<div className="p-5 rounded-xl bg-white dark:bg-gray-900 border border-purple-300 dark:border-purple-700 shadow-sm shadow-purple-200/50 dark:shadow-purple-900/20 transition-all duration-300 hover:shadow-md h-full flex flex-col justify-center items-center text-center">
							<div className="flex items-center gap-3 mb-3">
								<div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
									<Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div className="text-sm font-medium text-gray-600 dark:text-gray-400">
									Total Operating Time
								</div>
							</div>
							<div className="text-6xl font-bold text-gray-900 dark:text-white mb-3">
								{formatTimeDisplay(
									totalOperatingTime.hours,
									totalOperatingTime.minutes
								)}
							</div>
							<div className="text-sm text-gray-500">
								{utilizationPercentage.toFixed(2)}% utilization
								({totalOperatingSeconds.toFixed(0)} seconds)
							</div>
						</div>
					</div>

					{unknownSeconds > 0 ? (
						<div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-orange-300 dark:border-orange-700 shadow-sm shadow-orange-200/50 dark:shadow-orange-900/20 transition-all duration-300 hover:shadow-md">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-3">
									<div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
										<HelpCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
									</div>
									<div className="flex-1">
										<div className="font-semibold text-gray-600 dark:text-gray-400 mb-1">
											Unknown Time
										</div>
										<div className="text-sm text-gray-500">
											{unknownPercentage.toFixed(2)}% of
											planned time
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="text-xl font-bold text-gray-600 dark:text-gray-400">
										{formatTimeDisplay(
											unknownTime.hours,
											unknownTime.minutes
										)}
									</div>
									<div className="text-xs text-gray-500 mt-1">
										{unknownSeconds.toFixed(0)}s
									</div>
								</div>
							</div>
						</div>
					) : (
						<div className="p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-200/50 dark:shadow-emerald-900/20 transition-all duration-300 hover:shadow-md">
							<div className="flex items-center gap-3 justify-center text-center">
								<div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
									<HelpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
								</div>
								<div>
									<div className="font-semibold text-gray-500">
										Unknown Time
									</div>
									<div className="text-sm text-gray-400">
										No unknown data
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

			<div className="col-span-12 lg:col-span-3">
				<div className="h-full p-6 rounded-xl border border-cyan-400 dark:border-cyan-600 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/40 dark:to-blue-950/40 shadow-sm shadow-cyan-200/50 dark:shadow-cyan-900/20 transition-all duration-300 hover:shadow-md flex flex-col">
					<div className="flex items-center gap-2 mb-8 justify-center">
						<div className="w-4 h-4 rounded-full bg-cyan-500 animate-pulse shadow-lg shadow-cyan-500/50"></div>
						<div className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
							Planned Production
						</div>
					</div>

					<div className="flex flex-col items-center text-center mb-2">
						<div className="text-7xl font-bold text-gray-900 dark:text-white mb-2">
							{formatTimeDisplay(
								plannedTime.hours,
								plannedTime.minutes
							)}
						</div>
					</div>

					<div className="flex-1"></div>

					<div className="grid grid-cols-2 gap-3">
						<div className="p-4 rounded-lg bg-white/70 dark:bg-black/50 border border-cyan-200 dark:border-cyan-800 text-center transition-colors duration-200 hover:bg-white/90 dark:hover:bg-black/70">
							<div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
								Morning Shift
							</div>
							<div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
								{formatPlannedShiftTime(
									planned_morning_seconds
								)}
							</div>
						</div>
						<div className="p-4 rounded-lg bg-white/70 dark:bg-black/50 border border-indigo-200 dark:border-indigo-800 text-center transition-colors duration-200 hover:bg-white/90 dark:hover:bg-black/70">
							<div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
								Night Shift
							</div>
							<div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
								{formatPlannedShiftTime(planned_night_seconds)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
