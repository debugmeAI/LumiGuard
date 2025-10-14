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
	CardContent,
	CardDescription,
	CardAction,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ClockFading } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { HistoricalChart } from "@/components/historical-chart";

export default function RecentCondition() {
	const [range, setRange] = useState("7days");

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
									Machine Monitor
								</BreadcrumbItem>
								<BreadcrumbSeparator className="hidden md:block" />
								<BreadcrumbItem>
									<BreadcrumbPage>
										Historical Data
									</BreadcrumbPage>
								</BreadcrumbItem>
							</BreadcrumbList>
						</Breadcrumb>
					</div>
					<ModeToggle />
				</header>

				<div className="flex flex-1 justify-center p-6 pt-0">
					<Card className="@container/card flex-1 min-h-[600px] overflow-hidden">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ClockFading className="w-5 h-5" />
								Machine Condition
							</CardTitle>
							<CardDescription>
								<span className="hidden @[540px]/card:block">
									Recent availability OEE data
								</span>
								<span className="@[540px]/card:hidden">
									OEE data
								</span>
							</CardDescription>

							<CardAction className="flex flex-col sm:flex-row sm:items-center gap-2">
								<ToggleGroup
									type="single"
									value={range}
									onValueChange={(val) =>
										val && setRange(val)
									}
									variant="outline"
									className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4">
									<ToggleGroupItem value="3days">
										Last 3 Days
									</ToggleGroupItem>
									<ToggleGroupItem value="7days">
										Last 7 Days
									</ToggleGroupItem>
									<ToggleGroupItem value="1month">
										Last 1 Month
									</ToggleGroupItem>
								</ToggleGroup>
								<Select
									value={range}
									onValueChange={(val) => setRange(val)}>
									<SelectTrigger
										className="flex w-40 @[767px]/card:hidden"
										size="sm">
										<SelectValue placeholder="Select range" />
									</SelectTrigger>
									<SelectContent className="rounded-xl">
										<SelectItem value="3days">
											Last 3 Days
										</SelectItem>
										<SelectItem value="7days">
											Last 7 Days
										</SelectItem>
										<SelectItem value="1month">
											Last 1 Month
										</SelectItem>
									</SelectContent>
								</Select>
							</CardAction>
						</CardHeader>

						<CardContent className="flex-1">
							<HistoricalChart range={range} />
						</CardContent>
					</Card>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
