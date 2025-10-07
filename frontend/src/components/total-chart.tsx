"use client";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";

export interface TotalData {
	red_percent: string;
	amber_percent: string;
	green_percent: string;
	unknown_percent: string;
}

interface TotalChartProps {
	data: TotalData;
}

const chartConfig = {
	run: {
		label: "Run",
		color: "#22c55e",
	},
	idle: {
		label: "Idle",
		color: "#eab308",
	},
	error: {
		label: "Error",
		color: "#ef4444",
	},
	unknown: {
		label: "Unknown",
		color: "#6b7280",
	},
} satisfies ChartConfig;

export function TotalChart({ data }: TotalChartProps) {
	const chartData = [
		{
			status: "run",
			value: Number(data.green_percent),
			fill: chartConfig.run.color,
		},
		{
			status: "idle",
			value: Number(data.amber_percent),
			fill: chartConfig.idle.color,
		},
		{
			status: "error",
			value: Number(data.red_percent),
			fill: chartConfig.error.color,
		},
		// {
		// 	status: "unknown",
		// 	value: Number(data.unknown_percent),
		// 	fill: chartConfig.unknown.color,
		// },
	];

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ChartContainer config={chartConfig}>
				<PieChart>
					<ChartTooltip
						content={
							<ChartTooltipContent
								hideLabel
								className="w-[180px]"
								formatter={(value, name) => (
									<>
										<div
											className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
											style={
												{
													"--color-bg": `var(--color-${name})`,
												} as React.CSSProperties
											}
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
								)}
							/>
						}
						cursor={true}
					/>
					<Pie
						data={chartData}
						dataKey="value"
						nameKey="status"
						innerRadius={40}
						strokeWidth={1}
						label={({ percent }) =>
							`${(percent * 100).toFixed(2)}%`
						}
						labelLine={true}
					/>
					<ChartLegend
						content={<ChartLegendContent nameKey="status" />}
						className="flex flex-col items-start gap-2"
						layout="vertical"
						align="right"
						verticalAlign="middle"
					/>
				</PieChart>
			</ChartContainer>
		</ResponsiveContainer>
	);
}
