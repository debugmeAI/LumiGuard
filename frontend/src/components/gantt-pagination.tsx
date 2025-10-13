import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { Button } from "./ui/button";

interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	isDark?: boolean;
}

export function PaginationControls({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationControlsProps) {
	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center gap-1 flex-wrap">
			<Button
				variant="outline"
				size="icon"
				onClick={() => onPageChange(0)}
				disabled={currentPage === 0}
				className="h-8 w-8">
				<ChevronsLeft className="h-4 w-4" />
			</Button>

			<Button
				variant="outline"
				size="icon"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 0}
				className="h-8 w-8">
				<ChevronLeft className="h-4 w-4" />
			</Button>

			<div className="px-2 text-sm font-medium">
				Page {currentPage + 1} / {totalPages}
			</div>

			<Button
				variant="outline"
				size="icon"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages - 1}
				className="h-8 w-8">
				<ChevronRight className="h-4 w-4" />
			</Button>

			<Button
				variant="outline"
				size="icon"
				onClick={() => onPageChange(totalPages - 1)}
				disabled={currentPage === totalPages - 1}
				className="h-8 w-8">
				<ChevronsRight className="h-4 w-4" />
			</Button>
		</div>
	);
}
