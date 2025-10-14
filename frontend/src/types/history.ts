export interface StatusSummary {
	red_seconds: string;
	amber_seconds: string;
	green_seconds: string;
	unknown_seconds: string;
	red_percent: string;
	amber_percent: string;
	green_percent: string;
	unknown_percent: string;
	planned_production_seconds: string;
	planned_morning_seconds: string;
	planned_night_seconds: string;
	availability_oee: string;
	shift_type: string;
	total_seconds?: string;
}

export interface DevicePerformance extends StatusSummary {
	mac_address: string;
	device_name: string;
	shift_date: string;
	calculated_shift: string;
}

export interface ShiftPerformance extends StatusSummary {
	shift_date: string;
	calculated_shift: string;
}

export interface GanttData {
	name: string;
	data: Array<{
		x: string;
		y: [number, number];
	}>;
}

export interface DateRange {
	start: string;
	end: string;
	shift: string;
}

export interface SummaryData {
	total: StatusSummary;
	per_device: DevicePerformance[];
	per_shift: ShiftPerformance[];
	gantt: GanttData[];
	date_range: DateRange;
}

export interface DatePerformance {
	date: string;
	red_seconds: string;
	amber_seconds: string;
	green_seconds: string;
	unknown_seconds: string;
	red_percent: string;
	amber_percent: string;
	green_percent: string;
	unknown_percent: string;
	planned_production_seconds: string;
	availability_oee: string;
	shift_type: string;
	total_seconds?: string;
	red_count: string;
}

export interface SummaryData {
	total: StatusSummary;
	per_date: DatePerformance[];
	per_device: DevicePerformance[];
	per_shift: ShiftPerformance[];
	gantt: GanttData[];
	date_range: DateRange;
}
