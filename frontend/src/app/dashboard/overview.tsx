"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, CalendarIcon, Ban, RefreshCw, Activity } from "lucide-react";
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
	CardAction,
} from "@/components/ui/card";
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
	useSidebar,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { TotalChart } from "@/components/total-chart";
import { ShiftChart } from "@/components/shift-chart";
import { DeviceChart } from "@/components/device-chart";
import { GanttChart } from "@/components/gantt-chart";
import { OEECard } from "@/components/oee-card";

interface ApiDevice {
	mac_address: string;
	device_name: string;
	calculated_shift: string;
	red_seconds: string;
	amber_seconds: string;
	green_seconds: string;
	unknown_seconds: string;
	red_percent: string | null;
	amber_percent: string | null;
	green_percent: string | null;
	unknown_percent: string | null;
	planned_production_seconds: string;
	availability_oee: string;
	shift_type: string;
}

interface ApiShift {
	calculated_shift: string;
	red_seconds: string;
	amber_seconds: string;
	green_seconds: string;
	unknown_seconds: string;
	red_percent: string | null;
	amber_percent: string | null;
	green_percent: string | null;
	unknown_percent: string | null;
	planned_production_seconds: string;
	availability_oee: string;
	shift_type: string;
}

interface ApiGanttData {
	x: string;
	y: [number, number];
}

interface ApiGanttSeries {
	name: string;
	data: ApiGanttData[];
}

interface ApiTotal {
	red_percent: string | null;
	amber_percent: string | null;
	green_percent: string | null;
	unknown_percent: string | null;
	red_seconds: string;
	amber_seconds: string;
	green_seconds: string;
	unknown_seconds: string;
	total_seconds: string;
	planned_production_seconds: string;
	planned_morning_seconds: string;
	planned_night_seconds: string;
	availability_oee: string;
	shift_type: string;
}

interface ApiResponse {
	total: ApiTotal | null;
	per_device: ApiDevice[];
	per_shift: ApiShift[];
	gantt: ApiGanttSeries[];
}

const REFRESH_OPTIONS = [
	{ value: "0", label: "Off" },
	{ value: "5", label: "5 sec" },
	{ value: "10", label: "10 sec" },
	{ value: "30", label: "30 sec" },
	{ value: "60", label: "1 min" },
	{ value: "300", label: "5 min" },
];

function OverviewContent() {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date());
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [totalData, setTotalData] = useState<ApiTotal | null>(null);
	const [deviceData, setDeviceData] = useState<ApiDevice[]>([]);
	const [shiftData, setShiftData] = useState<ApiShift[]>([]);
	const [ganttData, setGanttData] = useState<ApiGanttSeries[]>([]);
	const [refreshInterval, setRefreshInterval] = useState<string>("0");
	const [countdown, setCountdown] = useState<number>(0);
	const { state } = useSidebar();

	const formatLocalDate = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const fetchData = useCallback(
		async (isAutoRefresh = false) => {
			if (isAutoRefresh) {
				setRefreshing(true);
			} else {
				setLoading(true);
			}

			try {
				const dateStr = formatLocalDate(selectedDate);
				const res = await fetch(
					`${
						import.meta.env.VITE_API_BASE_URL
					}/sensor-data/summary?date=${dateStr}`
				);

				if (!res.ok) throw new Error("Failed to fetch data");

				const json: ApiResponse = await res.json();

				setTotalData(json?.total || null);
				setDeviceData(json?.per_device || []);
				setShiftData(json?.per_shift || []);
				setGanttData(json?.gantt || []);
			} catch (error) {
				console.error(error);
				if (!isAutoRefresh) {
					setTotalData(null);
					setDeviceData([]);
					setShiftData([]);
					setGanttData([]);
				}
			} finally {
				if (isAutoRefresh) {
					setRefreshing(false);
				} else {
					setLoading(false);
				}
			}
		},
		[selectedDate]
	);

	useEffect(() => {
		const handleResize = () => {
			window.dispatchEvent(new Event("resize"));
		};

		const timer = setTimeout(() => {
			handleResize();
			setTimeout(handleResize, 100);
		}, 350);

		return () => clearTimeout(timer);
	}, [state]);

	useEffect(() => {
		fetchData(false);
	}, [selectedDate, fetchData]);

	useEffect(() => {
		const intervalSeconds = parseInt(refreshInterval);

		if (intervalSeconds === 0) {
			setCountdown(0);
			return;
		}

		setCountdown(intervalSeconds);

		const countdownTimer = setInterval(() => {
			setCountdown((prev) => {
				if (prev <= 1) {
					return intervalSeconds;
				}
				return prev - 1;
			});
		}, 1000);

		const refreshTimer = setInterval(() => {
			fetchData(true);
		}, intervalSeconds * 1000);

		return () => {
			clearInterval(countdownTimer);
			clearInterval(refreshTimer);
		};
	}, [refreshInterval, fetchData]);

	const handleManualRefresh = () => {
		fetchData(false);
		if (parseInt(refreshInterval) > 0) {
			setCountdown(parseInt(refreshInterval));
		}
	};

	const normalizedTotal = totalData
		? {
				red_percent: totalData.red_percent ?? "0",
				amber_percent: totalData.amber_percent ?? "0",
				green_percent: totalData.green_percent ?? "0",
				unknown_percent: totalData.unknown_percent ?? "0",
		  }
		: null;

	const hasTotal =
		normalizedTotal &&
		Object.values(normalizedTotal).some((v) => v !== "0");
	const hasDevice = deviceData.length > 0;
	const hasShift = shiftData.length > 0;
	const hasGantt = ganttData.length > 0;

	const hasAnyData = hasDevice || hasShift || hasGantt;

	return (
		<>
			<header className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2">
					<SidebarTrigger />
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden md:block">
								Dashboard
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Overview</BreadcrumbPage>
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
							<Activity className="w-5 h-5" />
							OEE Availability
						</CardTitle>
						<CardDescription>
							Detailed performance analysis
						</CardDescription>

						<CardAction className="flex flex-col sm:flex-row sm:items-center">
							<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
								<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
									<div className="flex items-center gap-2 w-full sm:w-auto">
										{countdown > 0 && (
											<Badge variant="secondary">
												Next refresh in {countdown}s
											</Badge>
										)}
										{refreshing && (
											<Badge
												variant="outline"
												className="border-blue-300 text-blue-500 dark:border-blue-900 dark:text-blue-400">
												<RefreshCw className="animate-spin w-3 h-3 me-1.5" />
												Updating
											</Badge>
										)}
									</div>
								</div>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className="justify-start text-left w-full sm:w-auto">
											{selectedDate.toLocaleDateString()}
											<CalendarIcon className="ml-4 h-4 w-4 justify-end" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-0"
										align="end">
										<Calendar
											mode="single"
											selected={selectedDate}
											onSelect={(date) =>
												date && setSelectedDate(date)
											}
											initialFocus
										/>
									</PopoverContent>
									<Select
										value={refreshInterval}
										onValueChange={setRefreshInterval}>
										<SelectTrigger className="w-auto">
											<SelectValue placeholder="Auto refresh" />
										</SelectTrigger>
										<SelectContent align="end">
											{REFRESH_OPTIONS.map((option) => (
												<SelectItem
													key={option.value}
													value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										variant="outline"
										size="icon"
										onClick={handleManualRefresh}
										disabled={loading}>
										<RefreshCw
											className={`h-4 w-4 ${
												loading ? "animate-spin" : ""
											}`}
										/>
									</Button>
								</Popover>
							</div>
						</CardAction>
					</CardHeader>
					<div className="ml-6 mr-6 pt-0 flex flex-col gap-3">
						{loading && (
							<div className="flex justify-center py-80">
								<Badge
									variant="outline"
									className="text-base border-yellow-300 text-yellow-500 dark:border-yellow-900 dark:text-yellow-400">
									<Loader2 className="animate-spin w-4 h-4 me-1.5" />
									Loading data...
								</Badge>
							</div>
						)}
						{!loading && !hasAnyData && (
							<div className="flex justify-center py-80">
								<Badge
									variant="outline"
									className="text-base border-red-300 text-red-500 dark:border-red-900 dark:text-red-400">
									<Ban className="w-4 h-4 me-1.5" />
									No data available
								</Badge>
							</div>
						)}
						{!loading && hasAnyData && (
							<div className="flex flex-col gap-3 h-full">
								{hasTotal && normalizedTotal && totalData && (
									<OEECard
										availability_oee={
											totalData.availability_oee
										}
										shift_type={totalData.shift_type}
										planned_production_seconds={
											totalData.planned_production_seconds
										}
										green_seconds={totalData.green_seconds}
										red_seconds={totalData.red_seconds}
										amber_seconds={totalData.amber_seconds}
										unknown_seconds={
											totalData.unknown_seconds
										}
										total_seconds={totalData.total_seconds}
										planned_morning_seconds={
											totalData.planned_morning_seconds
										}
										planned_night_seconds={
											totalData.planned_night_seconds
										}
									/>
								)}
								{hasGantt && (
									<Card className="w-full flex flex-col flex-1">
										<CardHeader>
											<CardTitle>Timeline</CardTitle>
											<CardDescription>
												Production activity timeline
											</CardDescription>
										</CardHeader>
										<CardContent className="flex-1">
											<GanttChart
												series={ganttData}
												loading={loading}
											/>
										</CardContent>
									</Card>
								)}
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
									{hasTotal && normalizedTotal && (
										<Card className="w-full flex flex-col">
											<CardHeader>
												<CardTitle>Overall</CardTitle>
												<CardDescription>
													Overall status distribution
												</CardDescription>
											</CardHeader>
											<CardContent className="flex-1">
												<TotalChart
													data={normalizedTotal}
												/>
											</CardContent>
										</Card>
									)}

									{hasShift && (
										<Card className="w-full flex flex-col">
											<CardHeader>
												<CardTitle>By Shift</CardTitle>
												<CardDescription>
													Status comparison between
													shifts
												</CardDescription>
											</CardHeader>
											<CardContent className="flex-1">
												<ShiftChart data={shiftData} />
											</CardContent>
										</Card>
									)}

									{hasDevice && (
										<Card className="w-full flex flex-col">
											<CardHeader>
												<CardTitle>
													By Machine
												</CardTitle>
												<CardDescription>
													Status details per machine
												</CardDescription>
											</CardHeader>
											<CardContent className="flex-1">
												<DeviceChart
													data={deviceData}
												/>
											</CardContent>
										</Card>
									)}
								</div>
							</div>
						)}
					</div>
				</Card>
			</div>
		</>
	);
}

export default function Overview() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<OverviewContent />
			</SidebarInset>
		</SidebarProvider>
	);
}
