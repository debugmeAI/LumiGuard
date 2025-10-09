import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onDelete: (mac: string) => void;
	device?: {
		mac: string;
		name: string;
	};
};

export function DeleteDeviceDialog({
	open,
	onOpenChange,
	onDelete,
	device,
}: Props) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="sm:max-w-md">
				<AlertDialogHeader>
					<div className="flex items-center gap-2">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
							<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
						</div>
						<AlertDialogTitle>Delete Device</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="space-y-2 pt-2">
						<p>
							Are you sure you want to delete{" "}
							<strong className="font-semibold text-foreground">
								{device?.name}
							</strong>
							{device?.mac && (
								<span className="text-muted-foreground">
									{" "}
									({device.mac})
								</span>
							)}
							?
						</p>
						<p className="text-red-600 dark:text-red-500 font-medium">
							This action cannot be undone. All device data will
							be permanently removed from the system.
						</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => device?.mac && onDelete(device.mac)}
						className="bg-red-600 hover:bg-red-700 focus:ring-red-600">
						Delete Device
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
