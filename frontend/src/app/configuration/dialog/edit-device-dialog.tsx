import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type Device = {
	mac: string;
	name: string;
	location: string;
	status: string;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	device: Device;
	setDevice: (device: Device) => void;
	onSubmit: () => void;
};

export function EditDeviceDialog({
	open,
	onOpenChange,
	device,
	setDevice,
	onSubmit,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Edit Device</DialogTitle>
					<DialogDescription>
						Configure device settings.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit();
					}}>
					<Tabs defaultValue="general" className="w-full">
						<TabsContent value="general" className="space-y-4 mt-2">
							<div className="space-y-2">
								<Label htmlFor="mac">MAC Address</Label>
								<div className="relative">
									<Input
										id="mac"
										value={device.mac}
										disabled
										className="bg-muted"
									/>
									<Badge
										variant="secondary"
										className="absolute -top-2 -right-0 text-xs">
										Read Only
									</Badge>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="name">Device Name</Label>
								<Input
									id="name"
									value={device.name}
									onChange={(e) =>
										setDevice({
											...device,
											name: e.target.value,
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="location">Location</Label>
								<Input
									id="location"
									value={device.location}
									onChange={(e) =>
										setDevice({
											...device,
											location: e.target.value,
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="status">Status</Label>
								<Select
									value={device.status}
									onValueChange={(value) =>
										setDevice({ ...device, status: value })
									}>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Active">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-green-500 rounded-full"></div>
												Active
											</div>
										</SelectItem>
										<SelectItem value="Inactive">
											<div className="flex items-center gap-2">
												<div className="w-2 h-2 bg-red-500 rounded-full"></div>
												Inactive
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</TabsContent>
					</Tabs>
					<DialogFooter className="mt-6">
						<DialogClose asChild>
							<Button variant="outline">Cancel</Button>
						</DialogClose>
						<Button type="submit">Save Changes</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
