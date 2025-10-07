"use client";

import { useState, useEffect } from "react";
import {
	ResponsiveContainer,
	ComposedChart,
	Area,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	ReferenceLine,
} from "recharts";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
} from "@/components/ui/chart";

import { Badge } from "@/components/ui/badge";
import { Loader2, Ban } from "lucide-react";

interface PerDateItem {
	date: string;
	red_percent: string;
	amber_percent: string;
	green_percent: string;
	availability_oee: string;
}

interface ApiResponse {
	per_date: PerDateItem[];
}

interface ChartData {
	date: string;
	red: number;
	amber: number;
	green: number;
	oee: number;
}

const TARGET_OEE = 85;

const chartConfig = {
	green: {
		label: "Run",
		color: "#22c55e",
	},
	amber: {
		label: "Idle",
		color: "#f59e0b",
	},
	red: {
		label: "Error",
		color: "#ef4444",
	},
	oee: {
		label: "OEE",
		color: "#0ea5e9",
	},
} satisfies ChartConfig;

export function HistoricalChart({ range = "7days" }: { range?: string }) {
	const [chartData, setChartData] = useState<ChartData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(false);

			try {
				const res = await fetch(
					`${
						import.meta.env.VITE_API_BASE_URL
					}/sensor-data/summary-range?range=${range}`
				);
				if (!res.ok) throw new Error("Failed to fetch");

				const data: ApiResponse = await res.json();

				const formatted = data.per_date.map((item) => {
					const date = new Date(item.date);
					const dateStr = date.toLocaleDateString("id-ID", {
						day: "2-digit",
						month: "short",
						year: "numeric",
					});
					return {
						date: dateStr,
						red: parseFloat(item.red_percent) || 0,
						amber: parseFloat(item.amber_percent) || 0,
						green: parseFloat(item.green_percent) || 0,
						oee: parseFloat(item.availability_oee) || 0,
					};
				});

				setChartData(formatted);
			} catch (err) {
				console.error("Error fetching chart data:", err);
				setError(true);
				setChartData([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [range]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-[670px]">
				<Badge
					variant="outline"
					className="text-base border-yellow-300 text-yellow-500 dark:border-yellow-900 dark:text-yellow-400">
					<Loader2 className="animate-spin w-4 h-4 me-1.5" />
					Loading OEE data...
				</Badge>
			</div>
		);
	}

	if (error || chartData.length === 0) {
		return (
			<div className="flex justify-center items-center h-[670px]">
				<Badge
					variant="outline"
					className="text-base border-red-300 text-red-500 dark:border-red-900 dark:text-red-400">
					<Ban className="w-4 h-4 me-1.5" />
					{error ? "Failed to load data" : "No OEE data available"}
				</Badge>
			</div>
		);
	}

	return (
		<ChartContainer config={chartConfig} className="h-[740px] w-full">
			<ResponsiveContainer width="100%" height="100%">
				<ComposedChart
					data={chartData}
					margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis
						dataKey="date"
						tickLine={false}
						axisLine={false}
						tickMargin={10}
						textAnchor="end"
					/>
					<YAxis
						yAxisId="left"
						orientation="left"
						domain={[0, 100]}
						tickFormatter={(v) => `${v}%`}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						yAxisId="right"
						orientation="right"
						domain={[0, 100]}
						tickFormatter={(v) => `${v}%`}
						hide
					/>
					<ChartTooltip
						content={
							<ChartTooltipContent
								hideLabel
								className="w-[180px]"
								formatter={(value, name) => {
									const color =
										chartConfig[
											name as keyof typeof chartConfig
										]?.color;
									return (
										<>
											<div
												className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
												style={{
													backgroundColor: color,
												}}
											/>
											{chartConfig[
												name as keyof typeof chartConfig
											]?.label || name}
											<div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
												{value}
												<span className="text-muted-foreground font-normal">
													%
												</span>
											</div>
										</>
									);
								}}
							/>
						}
						cursor={true}
					/>
					<ChartLegend content={<ChartLegendContent />} />
					<ReferenceLine
						y={TARGET_OEE}
						yAxisId="right"
						stroke="#eeff00ff"
						strokeDasharray="3 3"
						label={{
							value: `OEE Target`,
							position: "top",
							fill: "#eeff00ff",
							fontSize: 14,
							offset: 10,
						}}
					/>
					<Area
						yAxisId="left"
						type="monotone"
						dataKey="green"
						stackId="1"
						fill="var(--color-green)"
						stroke="var(--color-green)"
						fillOpacity={0.3}
					/>
					<Area
						yAxisId="left"
						type="monotone"
						dataKey="amber"
						stackId="1"
						fill="var(--color-amber)"
						stroke="var(--color-amber)"
						fillOpacity={0.3}
					/>
					<Area
						yAxisId="left"
						type="monotone"
						dataKey="red"
						stackId="1"
						fill="var(--color-red)"
						stroke="var(--color-red)"
						fillOpacity={0.3}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="oee"
						stroke="var(--color-oee)"
						strokeWidth={2}
						activeDot={{ r: 4 }}
						dot={false}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}
