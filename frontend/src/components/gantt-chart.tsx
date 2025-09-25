"use client";

import { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { type ApexOptions } from "apexcharts";
import { type DateRange } from "react-day-picker";

interface TimelineData {
	x: string;
	y: [number, number];
}

interface SeriesData {
	name: string;
	data: TimelineData[];
}

interface ApiResponse {
	series: SeriesData[];
}

interface GanttChartProps {
	dateRange?: DateRange;
}

export function GanttChart({ dateRange }: GanttChartProps) {
	const [series, setSeries] = useState<ApexAxisChartSeries>([]);
	const [loading, setLoading] = useState(true);
	const [isDark, setIsDark] = useState(false);

	// deteksi dark mode
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

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const from = dateRange?.from
					? dateRange.from.toISOString()
					: new Date().setHours(0, 0, 0, 0);
				const to = dateRange?.to
					? dateRange.to.toISOString()
					: new Date().setHours(23, 59, 59, 999);

				const res = await fetch(
					`http://localhost:3000/api/sensor-data/interval?from=${encodeURIComponent(
						from.toString()
					)}&to=${encodeURIComponent(to.toString())}`
				);

				if (!res.ok) throw new Error("Failed to fetch data");

				const json: ApiResponse = await res.json();

				const apexSeries: ApexAxisChartSeries = json.series.map(
					(s) => ({
						name: s.name,
						data: s.data.map((d) => ({ x: d.x, y: d.y })),
					})
				);

				setSeries(apexSeries);
			} catch (error) {
				console.error("Error fetching API:", error);
				setSeries([]);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [dateRange]);

	const options: ApexOptions = {
		chart: {
			height: 600,
			type: "rangeBar",
			background: isDark ? "#171717" : "#FFFFFF",
			foreColor: isDark ? "#F3F4F6" : "#171717",
		},
		plotOptions: { bar: { horizontal: true, rangeBarGroupRows: true } },
		colors: ["#4CAF50", "#FF9800", "#F44336", "#9E9E9E"],
		fill: { type: "solid" },
		xaxis: {
			type: "datetime",
			labels: { datetimeUTC: false },
			axisBorder: { color: isDark ? "#9CA3AF" : "#D1D5DB" },
			axisTicks: { color: isDark ? "#9CA3AF" : "#D1D5DB" },
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
			position: "top",
			labels: { colors: isDark ? "#F3F4F6" : "#1F2937" },
		},
	};

	return loading ? (
		<div className="text-center py-24 text-muted-foreground">
			Loading...
		</div>
	) : (
		<ReactApexChart
			options={options}
			series={series}
			type="rangeBar"
			height={400}
			width="100%"
		/>
	);
}
