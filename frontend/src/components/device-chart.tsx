"use client";

import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
} from "recharts";

import {
	type ChartConfig,
	ChartContainer,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
} from "@/components/ui/chart";

export interface DeviceData {
	device_name: string;
	calculated_shift: string;
	red_percent: string | null;
	amber_percent: string | null;
	green_percent: string | null;
	unknown_percent: string | null;
}

interface DeviceChartProps {
	data: DeviceData[];
}

const chartConfig = {
	Run: { label: "Run", color: "#22c55e" },
	Idle: { label: "Idle", color: "#eab308" },
	Error: { label: "Error", color: "#ef4444" },
	// Unknown: { label: "Unknown", color: "#6b7280" },
} satisfies ChartConfig;

export function DeviceChart({ data }: DeviceChartProps) {
	const chartData = data.map((item) => ({
		name: `${item.device_name} (${item.calculated_shift})`,
		Run: Number(item.green_percent) || 0,
		Idle: Number(item.amber_percent) || 0,
		Error: Number(item.red_percent) || 0,
		// Unknown: Number(item.unknown_percent) || 0,
	}));

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ChartContainer config={chartConfig}>
				<BarChart
					layout="vertical"
					data={chartData}
					margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
					width={600}
					height={300}>
					<CartesianGrid vertical={false} />
					<XAxis type="number" tickFormatter={(v) => `${v}%`} hide />
					<YAxis
						type="category"
						dataKey="name"
						width={180}
						tickLine={false}
						tickMargin={50}
						axisLine={false}
					/>
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
					<ChartLegend content={<ChartLegendContent />} />
					{Object.entries(chartConfig).map(
						([key, cfg], index, arr) => (
							<Bar
								key={key}
								dataKey={key}
								stackId="a"
								fill={cfg.color}
								radius={
									index === arr.length - 1
										? [0, 4, 4, 0]
										: [0, 0, 0, 0]
								}
							/>
						)
					)}
				</BarChart>
			</ChartContainer>
		</ResponsiveContainer>
	);
}
