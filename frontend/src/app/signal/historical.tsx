"use client";
import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardAction,
} from "@/components/ui/card";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Loader2,
	CalendarIcon,
	Ban,
	FileSpreadsheet,
	Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import DateTable, {
	type DatePerformance,
} from "@/components/history-device-table";
import { type SummaryData } from "@/types/history";

export default function HistoricalData() {
	const [startDate, setStartDate] = useState<Date | null>(null);
	const [endDate, setEndDate] = useState<Date | null>(null);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<SummaryData | null>(null);
	const [hasSearched, setHasSearched] = useState(false);
	const [showData, setShowData] = useState(false);

	const formatLocalDate = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

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

	const exportToCSV = () => {
		if (!data?.per_date || data.per_date.length === 0) return;

		const headers = [
			"Date",
			"Run Time %",
			"Run Time Duration",
			"Idle Time %",
			"Idle Time Duration",
			"Error Time %",
			"Error Time Duration",
			"Unknown Time %",
			"Unknown Time Duration",
			"Operating Time",
			"OEE %",
			"Planned Time",
			"Shift Type",
		];

		const csvData = data.per_date.map((row) => {
			const date = new Date(row.date);
			const day = String(date.getDate()).padStart(2, "0");
			const month = date.toLocaleDateString("en-US", { month: "long" });
			const year = date.getFullYear();
			const formattedDate = `${day}-${month}-${year}`;

			return [
				formattedDate,
				row.green_percent,
				formatSeconds(row.green_seconds),
				row.amber_percent,
				formatSeconds(row.amber_seconds),
				row.red_percent,
				formatSeconds(row.red_seconds),
				row.unknown_percent,
				formatSeconds(row.unknown_seconds),
				formatSeconds(row.total_seconds || "0"),
				row.availability_oee,
				formatSeconds(row.planned_production_seconds),
				row.shift_type,
			];
		});

		const csvContent = [
			headers.join(","),
			...csvData.map((row) => row.join(",")),
		].join("\n");

		const blob = new Blob([csvContent], {
			type: "text/csv;charset=utf-8;",
		});
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);

		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`historical_data_${
				startDate ? formatLocalDate(startDate) : "start"
			}_to_${endDate ? formatLocalDate(endDate) : "end"}.csv`
		);
		link.style.visibility = "hidden";

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const fetchData = async () => {
		if (!startDate || !endDate) {
			return;
		}

		setLoading(true);
		setShowData(false);
		setHasSearched(true);

		try {
			const params = new URLSearchParams({
				startDate: formatLocalDate(startDate),
				endDate: formatLocalDate(endDate),
			});

			console.log("Fetching with:", {
				startDate: formatLocalDate(startDate),
				endDate: formatLocalDate(endDate),
			});

			const response = await fetch(
				`${
					import.meta.env.VITE_API_BASE_URL
				}/sensor-data/summary-history?${params}`
			);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result: SummaryData = await response.json();
			setData(result);
			setLoading(false);

			// Delay untuk menampilkan data setelah loading
			setTimeout(() => {
				setShowData(true);
			}, 1000);
		} catch (error) {
			console.error("Error fetching data:", error);
			setData(null);
			setLoading(false);
		}
	};

	const hasAnyData =
		data &&
		(data.per_date?.length > 0 ||
			data.per_device?.length > 0 ||
			data.per_shift?.length > 0 ||
			data.gantt?.length > 0);

	const dateData: DatePerformance[] = data?.per_date || [];
	const [openStart, setOpenStart] = useState(false);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center justify-between px-4">
					<div className="flex items-center gap-2">
						<SidebarTrigger />
						<Separator
							orientation="vertical"
							className="mr-2 h-4"
						/>
						<Breadcrumb>
							<BreadcrumbList>
								<BreadcrumbItem className="hidden md:block">
									Signal Monitor
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>
										Historical Logs
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<ModeToggle />
				</header>

				<div className="flex flex-1 justify-center p-6 pt-0">
					<Card className="@container/card flex-1 overflow-hidden">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CalendarIcon className="w-5 h-5" />
								Historical Logs
							</CardTitle>
							<CardDescription>
								Analyze machine performance data
							</CardDescription>
							<CardAction className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
								<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
									<div className="flex flex-col sm:flex-row gap-3">
										<Popover
											open={openStart}
											onOpenChange={setOpenStart}>
											<PopoverTrigger asChild>
												<Button
													variant="outline"
													className="justify-start text-left w-full sm:w-auto">
													{startDate && endDate
														? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
														: startDate
														? startDate.toLocaleDateString()
														: "Select Date Range"}
													<CalendarIcon className="ml-2 h-4 w-4" />
												</Button>
											</PopoverTrigger>
											<PopoverContent
												className="w-auto p-0"
												align="end">
												<Calendar
													mode="range"
													selected={{
														from:
															startDate ||
															undefined,
														to:
															endDate ||
															undefined,
													}}
													onSelect={(range) => {
														if (range?.from) {
															setStartDate(
																range.from
															);
														}
														if (range?.to) {
															setEndDate(
																range.to
															);
														}
														if (
															range?.from &&
															range?.to
														) {
															setOpenStart(false);
														}
													}}
													numberOfMonths={2}
													initialFocus
												/>
												<div className="p-2 flex justify-end">
													<Button
														variant="ghost"
														size="sm"
														className="h-8 text-sm"
														onClick={() => {
															setStartDate(null);
															setEndDate(null);
														}}>
														Reset
													</Button>
												</div>
											</PopoverContent>
										</Popover>

										<Button
											variant="outline"
											size="sm"
											onClick={fetchData}
											disabled={
												!startDate ||
												!endDate ||
												loading
											}
											className="h-9">
											<Search className="h-4 w-4" />
											Search
										</Button>
									</div>
								</div>
								{!loading && showData && hasAnyData && (
									<div className="flex w-full sm:w-auto">
										<Button
											variant="outline"
											size="sm"
											onClick={exportToCSV}
											className="h-9">
											<FileSpreadsheet className="h-4 w-4" />
											<span className="hidden sm:inline">
												Export
											</span>
										</Button>
									</div>
								)}
							</CardAction>
						</CardHeader>

						<CardContent>
							{!hasSearched && !loading && (
								<div className="flex justify-center py-80">
									<Badge
										variant="outline"
										className="text-base border-blue-300 text-blue-500 dark:border-blue-900 dark:text-blue-400">
										<CalendarIcon className="w-4 h-4 me-1.5" />
										Choose time period
									</Badge>
								</div>
							)}
							{(loading || !showData) && hasSearched && (
								<div className="flex justify-center py-80">
									<Badge
										variant="outline"
										className="text-base border-yellow-300 text-yellow-500 dark:border-yellow-900 dark:text-yellow-400">
										<Loader2 className="animate-spin w-4 h-4 me-1.5" />
										Loading data...
									</Badge>
								</div>
							)}
							{!loading &&
								showData &&
								hasSearched &&
								!hasAnyData && (
									<div className="flex justify-center py-80">
										<Badge
											variant="outline"
											className="text-base border-red-300 text-red-500 dark:border-red-900 dark:text-red-400">
											<Ban className="w-4 h-4 me-1.5" />
											No data available for selected range
										</Badge>
									</div>
								)}
							{!loading &&
								showData &&
								hasSearched &&
								hasAnyData &&
								data && (
									<div className="space-y-6">
										<DateTable data={dateData} />
									</div>
								)}
						</CardContent>
					</Card>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
