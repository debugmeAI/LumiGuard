"use client";
import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { type ApexOptions } from "apexcharts";

export interface TimelineData {
	x: string;
	y: [number, number];
}

export interface SeriesData {
	name: string;
	data: TimelineData[];
}

interface GanttChartProps {
	series: SeriesData[];
	loading: boolean;
	pageStartTime: number;
	pageEndTime: number;
}

const COLOR_MAP: Record<string, string> = {
	Run: "#22c55e",
	Idle: "#eab308",
	Error: "#ef4444",
	Unknown: "#6b7280",
};

export function GanttChart({
	series,
	loading,
	pageStartTime,
	pageEndTime,
}: GanttChartProps) {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const checkDark = () =>
			setIsDark(document.documentElement.classList.contains("dark"));
		checkDark();
		const observer = new MutationObserver(checkDark);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
		return () => observer.disconnect();
	}, []);

	if (loading)
		return <div className="p-4 text-center">Loading GanttChart...</div>;
	if (series.length === 0)
		return <div className="p-4 text-center">No data</div>;

	const options: ApexOptions = {
		chart: {
			toolbar: {
				show: true,
				tools: {
					download: false,
					selection: false,
					zoom: false,
					zoomin: false,
					zoomout: false,
					pan: false,
					reset: true,
					customIcons: [],
				},
			},
			height: 600,
			type: "rangeBar",
			background: isDark ? "#191919" : "#FFFFFF",
			foreColor: isDark ? "#Fafafa" : "#191919",
			animations: {
				enabled: false,
			},
			zoom: {
				enabled: false,
			},
			selection: {
				enabled: false,
			},
		},
		plotOptions: {
			bar: {
				horizontal: true,
				rangeBarGroupRows: true,
			},
		},
		colors: series.map((s) => COLOR_MAP[s.name] ?? "#3b82f6"),
		fill: { type: "solid" },
		xaxis: {
			type: "datetime",
			labels: { datetimeUTC: false },
			axisBorder: { color: isDark ? "#9CA3AF" : "#D1D5DB" },
			axisTicks: { color: isDark ? "#9CA3AF" : "#D1D5DB" },
			min: pageStartTime,
			max: pageEndTime,
		},
		yaxis: {
			labels: { style: { colors: isDark ? "#F3F4F6" : "#1F2937" } },
		},
		grid: { borderColor: isDark ? "#374151" : "#E5E7EB" },
		tooltip: {
			theme: isDark ? "dark" : "light",
			x: { format: "HH:mm:ss" },
		},
		legend: {
			position: "bottom",
			labels: { colors: isDark ? "#F3F4F6" : "#1F2937" },
		},
	};

	return (
		<div className="w-full">
			<ReactApexChart
				options={options}
				series={series}
				type="rangeBar"
				height={200}
				width="100%"
			/>
		</div>
	);
}
