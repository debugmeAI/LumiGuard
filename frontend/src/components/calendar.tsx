// "use client";

// import { Calendar } from "@/components/ui/calendar";
// import { type DateRange } from "react-day-picker";

// type DateRangePopoverProps = {
// 	dateRange: DateRange | undefined;
// 	onDateChange: (range: DateRange | undefined) => void;
// 	label?: string;
// };

// function Calendar05({
// 	selectedDate,
// 	onDateChange,
// }: {
// 	selectedDate: Date | undefined;
// 	onDateChange: (date: Date | undefined) => void;
// }) {
// 	return (
// 		<Calendar
// 			mode="single"
// 			selected={selectedDate}
// 			onSelect={onDateChange}
// 			captionLayout="dropdown"
// 			numberOfMonths={1}
// 		/>
// 	);
// }

// export function DateRangePopover({
// 	dateRange,
// 	onDateChange,
// }: DateRangePopoverProps) {
// 	const selectedDate = dateRange?.from;

// 	const handleSelect = (date: Date | undefined) => {
// 		if (date) onDateChange({ from: date, to: date });
// 		else onDateChange(undefined);
// 	};

// 	return (
// 		<Calendar05 selectedDate={selectedDate} onDateChange={handleSelect} />
// 	);
// }

// "use client";

// import { Calendar } from "@/components/ui/calendar";
// import { type DateRange } from "react-day-picker";

// type DateRangePopoverProps = {
// 	dateRange: DateRange | undefined;
// 	onDateChange: (range: DateRange | undefined) => void;
// 	label?: string;
// };

// export function DateRangePopover({
// 	dateRange,
// 	onDateChange,
// }: DateRangePopoverProps) {
// 	return (
// 		<Calendar
// 			mode="range"
// 			defaultMonth={dateRange?.from}
// 			selected={dateRange}
// 			onSelect={onDateChange}
// 			numberOfMonths={2}
// 			className="rounded-lg border shadow-sm"
// 		/>
// 	);
// }
