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

import { CalendarIcon, Download } from "lucide-react";
import { DateRangePopover } from "@/components/calendar";
import { type DateRange } from "react-day-picker";

import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	CardContent,
	CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";

import { format } from "date-fns";
import { GanttChart } from "@/components/gantt-chart";

export default function Alerts() {
	const [dateRange, setDateRange] = useState<DateRange | undefined>();

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center justify-between px-4">
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
					<Card className="@container/card flex-1 min-h-[600px] overflow-hidden">
						<CardHeader>
							<CardTitle>Overview</CardTitle>
							<CardDescription>
								Track Machine Performance
							</CardDescription>
							<CardAction className="flex flex-col sm:flex-row sm:items-center gap-2">
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											size="sm"
											className="h-9 justify-start text-left font-normal">
											{dateRange?.from ? (
												dateRange.to ? (
													`${format(
														dateRange.from,
														"yyyy/MM/dd"
													)}`
												) : (
													format(dateRange.from, "P")
												)
											) : (
												<span className="text-muted-foreground">
													Pick a date
												</span>
											)}
											<CalendarIcon className="h-4 w-4 opacity-50" />
										</Button>
									</PopoverTrigger>
									<PopoverContent
										className="w-auto p-2"
										align="end">
										<DateRangePopover
											dateRange={dateRange}
											onDateChange={setDateRange}
										/>
									</PopoverContent>
								</Popover>
								<Button
									variant="outline"
									size="sm"
									className="h-9">
									<Download className="h-4 w-4" /> Export
								</Button>
							</CardAction>
						</CardHeader>
						<CardContent>
							{dateRange?.from ? (
								<GanttChart dateRange={dateRange} />
							) : (
								<div className="flex justify-center items-center min-h-[700px] w-full">
									<Badge
										variant="outline"
										className="text-base border-green-300 text-green-500 dark:border-green-900 dark:text-green-400">
										<CalendarIcon className="w-4 h-4 me-1.5" />
										Select date first
									</Badge>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
