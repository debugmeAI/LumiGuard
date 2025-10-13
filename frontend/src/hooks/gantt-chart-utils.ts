import { useState, useMemo, useEffect, useRef } from "react";
import type { SeriesData } from "@/components/gantt-chart";

export function useGanttPagination(
	series: SeriesData[],
	minutesPerPage?: number,
	maxDataPointsPerPage: number = 200
) {
	const [currentPage, setCurrentPage] = useState(0);
	const prevSeriesRef = useRef<SeriesData[]>([]);

	const { paginatedSeries, totalPages, pageStartTime, pageEndTime } =
		useMemo(() => {
			if (series.length === 0) {
				return {
					paginatedSeries: [],
					totalPages: 0,
					pageStartTime: 0,
					pageEndTime: 0,
				};
			}

			const allDataPoints = series.flatMap((s) => s.data);
			if (allDataPoints.length === 0) {
				return {
					paginatedSeries: series,
					totalPages: 1,
					pageStartTime: 0,
					pageEndTime: 0,
				};
			}

			const allStartTimes = allDataPoints.map((d) => d.y[0]);
			const allEndTimes = allDataPoints.map((d) => d.y[1]);
			const minTime = Math.min(...allStartTimes);
			const maxTime = Math.max(...allEndTimes);
			const totalDuration = maxTime - minTime;

			let effectiveMinutesPerPage = minutesPerPage;

			if (!effectiveMinutesPerPage) {
				const totalDataPoints = allDataPoints.length;
				const desiredPages = Math.ceil(
					totalDataPoints / maxDataPointsPerPage
				);
				const totalMinutes = totalDuration / (60 * 1000);
				effectiveMinutesPerPage = Math.ceil(
					totalMinutes / desiredPages
				);

				if (effectiveMinutesPerPage <= 5) effectiveMinutesPerPage = 5;
				else if (effectiveMinutesPerPage <= 10)
					effectiveMinutesPerPage = 10;
				else if (effectiveMinutesPerPage <= 15)
					effectiveMinutesPerPage = 15;
				else if (effectiveMinutesPerPage <= 30)
					effectiveMinutesPerPage = 30;
				else if (effectiveMinutesPerPage <= 60)
					effectiveMinutesPerPage = 60;
				else if (effectiveMinutesPerPage <= 120)
					effectiveMinutesPerPage = 120;
				else effectiveMinutesPerPage = 240;
			}

			const millisPerPage = effectiveMinutesPerPage * 60 * 1000;
			const pages = Math.ceil(totalDuration / millisPerPage);

			const safePage = Math.min(Math.max(0, currentPage), pages - 1);

			const pageStart = minTime + safePage * millisPerPage;
			const pageEnd = Math.min(pageStart + millisPerPage, maxTime);

			const paginated = series.map((s) => ({
				...s,
				data: s.data.filter((d) => {
					const dataStart = d.y[0];
					const dataEnd = d.y[1];
					return dataStart < pageEnd && dataEnd > pageStart;
				}),
			}));

			const hasDataOnPage = paginated.some((s) => s.data.length > 0);

			if (!hasDataOnPage && pages > 0) {
				const lastPageStart = minTime + (pages - 1) * millisPerPage;
				const lastPageEnd = maxTime;

				const lastPageData = series.map((s) => ({
					...s,
					data: s.data.filter((d) => {
						const dataStart = d.y[0];
						const dataEnd = d.y[1];
						return (
							dataStart < lastPageEnd && dataEnd > lastPageStart
						);
					}),
				}));

				return {
					paginatedSeries: lastPageData,
					totalPages: pages,
					pageStartTime: lastPageStart,
					pageEndTime: lastPageEnd,
				};
			}

			return {
				paginatedSeries: paginated,
				totalPages: pages,
				pageStartTime: pageStart,
				pageEndTime: pageEnd,
			};
		}, [series, currentPage, minutesPerPage, maxDataPointsPerPage]);

	useEffect(() => {
		const seriesChanged =
			JSON.stringify(series) !== JSON.stringify(prevSeriesRef.current);

		if (seriesChanged && totalPages > 0) {
			setCurrentPage(totalPages - 1);
			prevSeriesRef.current = series;
		}
	}, [series, totalPages]);

	useEffect(() => {
		if (currentPage >= totalPages && totalPages > 0) {
			setCurrentPage(totalPages - 1);
		}
	}, [currentPage, totalPages]);

	return {
		paginatedSeries,
		totalPages,
		currentPage,
		setCurrentPage,
		pageStartTime,
		pageEndTime,
	};
}
