import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type StatusSummary } from "@/types/history";

interface SummaryTableProps {
	data: StatusSummary;
}

export default function SummaryTable({ data }: SummaryTableProps) {
	const formatSeconds = (seconds: string) => {
		const secs = parseFloat(seconds);
		const hours = Math.floor(secs / 3600);
		const minutes = Math.floor((secs % 3600) / 60);
		const remainingSeconds = Math.floor(secs % 60);
		return `${hours}h ${minutes}m ${remainingSeconds}s`;
	};

	const getOEEStatus = (oee: string) => {
		const value = parseFloat(oee);
		if (value >= 80) return "text-green-600 dark:text-green-400";
		if (value >= 60) return "text-yellow-600 dark:text-yellow-400";
		return "text-red-600 dark:text-red-400";
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Total Summary</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Status</TableHead>
							<TableHead>Duration</TableHead>
							<TableHead>Percentage</TableHead>
							<TableHead className="text-center">
								Planned Production
							</TableHead>
							<TableHead className="text-center">
								Availability OEE
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						<TableRow>
							<TableCell className="font-medium">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-green-500 rounded-full"></div>
									Run (Green)
								</div>
							</TableCell>
							<TableCell>
								{formatSeconds(data.green_seconds)}
							</TableCell>
							<TableCell>{data.green_percent}%</TableCell>
							<TableCell
								rowSpan={4}
								className="text-center align-middle">
								<div className="text-lg font-semibold">
									{formatSeconds(
										data.planned_production_seconds
									)}
								</div>
								<div className="text-sm text-muted-foreground">
									Total Planned
								</div>
							</TableCell>
							<TableCell
								rowSpan={4}
								className="text-center align-middle">
								<div
									className={`text-2xl font-bold ${getOEEStatus(
										data.availability_oee
									)}`}>
									{data.availability_oee}%
								</div>
								<div className="text-sm text-muted-foreground">
									Overall OEE
								</div>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
									Idle (Amber)
								</div>
							</TableCell>
							<TableCell>
								{formatSeconds(data.amber_seconds)}
							</TableCell>
							<TableCell>{data.amber_percent}%</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-red-500 rounded-full"></div>
									Error (Red)
								</div>
							</TableCell>
							<TableCell>
								{formatSeconds(data.red_seconds)}
							</TableCell>
							<TableCell>{data.red_percent}%</TableCell>
						</TableRow>
						<TableRow>
							<TableCell className="font-medium">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-gray-500 rounded-full"></div>
									Unknown
								</div>
							</TableCell>
							<TableCell>
								{formatSeconds(data.unknown_seconds)}
							</TableCell>
							<TableCell>{data.unknown_percent}%</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
