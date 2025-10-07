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
	oee: number | null;
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
		color: "#2ebdffff",
	},
} satisfies ChartConfig;

export function HistoricalChart({ range = "7days" }: { range?: string }) {
	const [chartData, setChartData] = useState<ChartData[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);
	const [showChart, setShowChart] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setShowChart(false);
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
						month: "numeric",
						year: "2-digit",
					});

					const red = parseFloat(item.red_percent) || 0;
					const amber = parseFloat(item.amber_percent) || 0;
					const green = parseFloat(item.green_percent) || 0;
					const oeeValue = parseFloat(item.availability_oee) || 0;

					return {
						date: dateStr,
						red,
						amber,
						green,
						// Jika OEE = 0, ubah jadi null agar garis tidak digambar
						oee: oeeValue === 0 ? null : oeeValue,
					};
				});

				// Exclude baris yang semua nilainya 0
				const filtered = formatted.filter(
					(d) =>
						d.red !== 0 ||
						d.amber !== 0 ||
						d.green !== 0 ||
						d.oee !== null
				);

				setChartData(filtered);
				setLoading(false);

				setTimeout(() => {
					setShowChart(true);
				}, 1000);
			} catch (err) {
				console.error("Error fetching chart data:", err);
				setError(true);
				setChartData([]);
				setLoading(false);
			}
		};

		fetchData();
	}, [range]);

	if (loading || !showChart) {
		return (
			<div className="flex justify-center items-center h-[670px]">
				<Badge
					variant="outline"
					className="text-base border-yellow-300 text-yellow-500 dark:border-yellow-900 dark:text-yellow-400">
					<Loader2 className="animate-spin w-4 h-4 me-1.5" />
					Loading data...
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
					margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" vertical={false} />
					<XAxis
						dataKey="date"
						tickLine={true}
						axisLine={false}
						tickMargin={10}
						textAnchor="middle"
					/>
					<YAxis
						yAxisId="left"
						orientation="left"
						domain={[0, 100]}
						tickFormatter={(v) => `${v}%`}
						tickLine={false}
						axisLine={false}
						hide
					/>
					<YAxis
						yAxisId="right"
						orientation="left"
						domain={[0, 100]}
						tickFormatter={(v) => `${v}%`}
						tickLine={true}
						axisLine={false}
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
						stroke="#ffae00ff"
						strokeDasharray="13 7"
						label={{
							value: `OEE Target`,
							position: "top",
							fill: "#ffae00ff",
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
						fillOpacity={0.4}
					/>
					<Area
						yAxisId="left"
						type="monotone"
						dataKey="amber"
						stackId="1"
						fill="var(--color-amber)"
						stroke="var(--color-amber)"
						fillOpacity={0.4}
					/>
					<Area
						yAxisId="left"
						type="monotone"
						dataKey="red"
						stackId="1"
						fill="var(--color-red)"
						stroke="var(--color-red)"
						fillOpacity={0.4}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="oee"
						stroke="var(--color-oee)"
						strokeWidth={2}
						activeDot={{ r: 4 }}
						dot={false}
						connectNulls={false}
					/>
				</ComposedChart>
			</ResponsiveContainer>
		</ChartContainer>
	);
}
