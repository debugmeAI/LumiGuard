import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	Calendar,
	Clock,
	TrendingUp,
	TrendingDown,
	MoveHorizontal,
} from "lucide-react";

export interface DatePerformance {
	date: string;
	red_seconds: string;
	amber_seconds: string;
	green_seconds: string;
	unknown_seconds: string;
	red_percent: string;
	amber_percent: string;
	green_percent: string;
	unknown_percent: string;
	planned_production_seconds: string;
	availability_oee: string;
	shift_type: string;
	total_seconds?: string;
	shift_period?: string;
	red_count: string;
}

interface DateTableProps {
	data: DatePerformance[];
}

export default function DateTable({ data }: DateTableProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(12);

	const totalItems = data.length;
	const totalPages = Math.ceil(totalItems / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	const currentData = data.slice(startIndex, endIndex);

	const goToPage = (page: number) => {
		setCurrentPage(Math.max(1, Math.min(page, totalPages)));
	};

	const goToFirstPage = () => goToPage(1);
	const goToLastPage = () => goToPage(totalPages);
	const goToPreviousPage = () => goToPage(currentPage - 1);
	const goToNextPage = () => goToPage(currentPage + 1);

	const formatSeconds = (seconds: string) => {
		const secs = parseFloat(seconds);
		const hours = Math.floor(secs / 3600);
		const minutes = Math.floor((secs % 3600) / 60);
		const remainingSeconds = Math.floor(secs % 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		} else if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`;
		} else {
			return `${remainingSeconds}s`;
		}
	};

	const formatDateWithPeriod = (dateString: string, shiftPeriod?: string) => {
		if (shiftPeriod) {
			return shiftPeriod;
		}

		const date = new Date(dateString);
		const nextDay = new Date(date);
		nextDay.setDate(nextDay.getDate() + 1);

		const formatOptions: Intl.DateTimeFormatOptions = {
			year: "numeric",
			month: "long",
			day: "numeric",
		};

		const formattedDate = date
			.toLocaleDateString("en-US", formatOptions)
			.replace(/(\w+) (\d+), (\d+)/, "$3 $1 $2");

		const nextDayStr = nextDay
			.toLocaleDateString("en-US", formatOptions)
			.replace(/(\w+) (\d+), (\d+)/, "$3 $1 $2");

		return `${formattedDate} 07:00 - ${nextDayStr} 07:00`;
	};

	const getOEEVariant = (oee: string | number) => {
		const value = typeof oee === "string" ? parseFloat(oee) : oee;

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
				icon: MoveHorizontal,
			};

		return {
			label: "Poor",
			color: "text-red-600 dark:text-red-400",
			bg: "bg-red-50 dark:bg-red-950",
			border: "border-red-300 dark:border-red-700 shadow-sm shadow-red-200/50 dark:shadow-red-900/20",
			icon: TrendingDown,
		};
	};

	const getUtilizationColor = (utilization: number) => {
		if (utilization >= 90) {
			return "text-green-600 dark:text-green-400";
		}
		if (utilization >= 75) {
			return "text-blue-600 dark:text-blue-400";
		}
		if (utilization >= 60) {
			return "text-yellow-600 dark:text-yellow-400";
		}
		return "text-red-600 dark:text-red-400";
	};

	const getShiftTypeVariant = (shiftType: string) => {
		if (shiftType.includes("Overtime")) return "secondary";
		if (shiftType.includes("Normal")) return "secondary";
		if (shiftType.includes("24-hour")) return "secondary";
	};

	const formatDateYMD = (dateString: string) => {
		const d = new Date(dateString);
		const year = d.getFullYear();
		const month = d.toLocaleString("en-US", { month: "long" });
		const day = d.getDate();
		return `${year} ${month} ${day}`;
	};

	const calculateUtilization = (
		totalSeconds: string,
		plannedSeconds: string
	): string => {
		const total = parseFloat(totalSeconds || "0");
		const planned = parseFloat(plannedSeconds || "0");

		if (planned === 0) return "0";

		return ((total / planned) * 100).toFixed(1);
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="overflow-x-auto rounded-lg border">
				<Table className="min-w-[1100px]">
					<TableHeader className="bg-muted sticky top-0 z-10">
						<TableRow>
							<TableHead className="w-[220px]">
								Date Period
							</TableHead>
							<TableHead className="text-center">
								Run Time
							</TableHead>
							<TableHead className="text-center">
								Idle Time
							</TableHead>
							<TableHead className="text-center">
								Error Time
							</TableHead>
							<TableHead className="text-center">
								Total Errors
							</TableHead>
							<TableHead className="text-center">
								Unknown Time
							</TableHead>
							<TableHead className="text-center">
								Operating Time
							</TableHead>
							<TableHead className="text-center">OEE</TableHead>
							<TableHead className="text-center">
								Planned Time
							</TableHead>
							<TableHead className="text-center">
								Shift Type
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{currentData.map((dateData, index) => {
							const info = getOEEVariant(
								dateData.availability_oee
							);
							const utilization = parseFloat(
								calculateUtilization(
									dateData.total_seconds || "0",
									dateData.planned_production_seconds
								)
							);
							const utilizationColor =
								getUtilizationColor(utilization);

							return (
								<TableRow key={`${dateData.date}-${index}`}>
									<TableCell className="font-semibold">
										<div className="flex items-center gap-2">
											<div className="flex flex-col items-center">
												<Calendar className="h-4 w-4 text-muted-foreground" />
												<Clock className="h-3 w-3 text-muted-foreground mt-1" />
											</div>
											<div className="flex flex-col">
												<span className="font-semibold text-sm">
													{formatDateYMD(
														dateData.date
													)}
												</span>
												<span className="text-xs text-muted-foreground font-normal">
													{formatDateWithPeriod(
														dateData.date,
														dateData.shift_period
													)}
												</span>
											</div>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span className="font-semibold text-green-600 dark:text-green-400">
												{dateData.green_percent}%
											</span>
											<span className="text-xs text-muted-foreground">
												{formatSeconds(
													dateData.green_seconds
												)}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span className="font-semibold text-yellow-600 dark:text-yellow-400">
												{dateData.amber_percent}%
											</span>
											<span className="text-xs text-muted-foreground">
												{formatSeconds(
													dateData.amber_seconds
												)}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span className="font-semibold text-red-600 dark:text-red-400">
												{dateData.red_percent}%
											</span>
											<span className="text-xs text-muted-foreground">
												{formatSeconds(
													dateData.red_seconds
												)}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span className="text-lg font-semibold text-red-600 dark:text-red-400">
												{dateData.red_count}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span className="font-semibold text-gray-600 dark:text-gray-400">
												{dateData.unknown_percent}%
											</span>
											<span className="text-xs text-muted-foreground">
												{formatSeconds(
													dateData.unknown_seconds
												)}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span
												className={`font-semibold ${utilizationColor}`}>
												{utilization}%
											</span>
											<span className="text-xs text-muted-foreground">
												{formatSeconds(
													dateData.total_seconds ||
														"0"
												)}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center">
										<Badge
											className={`text-base font-semibold border ${info.color} ${info.bg} ${info.border}`}>
											<info.icon className="w-4 h-4 mr-1" />
											{dateData.availability_oee}%
										</Badge>
									</TableCell>
									<TableCell className="text-center">
										<div className="flex flex-col">
											<span className="text-lg font-semibold">
												{formatSeconds(
													dateData.planned_production_seconds
												)}
											</span>
										</div>
									</TableCell>
									<TableCell className="text-center text-sm">
										<Badge
											variant={getShiftTypeVariant(
												dateData.shift_type
											)}
											className="text-sm">
											{dateData.shift_type}
										</Badge>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between">
				<div className="text-muted-foreground text-sm">
					{totalItems} period(s) found
				</div>

				<div className="flex items-center gap-1 flex-wrap">
					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={goToFirstPage}
						disabled={currentPage === 1}>
						<ChevronsLeft className="h-4 w-4" />
					</Button>

					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={goToPreviousPage}
						disabled={currentPage === 1}>
						<ChevronLeft className="h-4 w-4" />
					</Button>

					<div className="px-2 text-sm font-medium">
						Page {currentPage} of {totalPages}
					</div>

					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={goToNextPage}
						disabled={currentPage === totalPages}>
						<ChevronRight className="h-4 w-4" />
					</Button>

					<Button
						variant="outline"
						className="h-8 w-8 p-0"
						onClick={goToLastPage}
						disabled={currentPage === totalPages}>
						<ChevronsRight className="h-4 w-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
