"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { IconInfoCircle, IconAlignBoxRightStretch } from "@tabler/icons-react";

export function AboutDialog() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					onSelect={(e) => e.preventDefault()}
					onClick={() => setOpen(true)}
					className="cursor-pointer">
					<IconInfoCircle className="mr-2 h-4 w-4" />
					About
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent className="max-w-lg p-6 rounded-lg shadow-lg">
				<DialogHeader>
					<DialogTitle className="text-2xl font-semibold flex items-center gap-2">
						<IconAlignBoxRightStretch className="!size-5 text-primary" />
						<span className="text-base font-bold">LumiGuard</span>
						<span className="text-xs text-muted-foreground">
							/ˈluː.mi.ɡɑːrd/
						</span>
					</DialogTitle>
					<DialogDescription className="text-base text-muted-foreground mt-4">
						<div className="space-y-4">
							<p>
								<strong>Version:</strong> 1.0.0
							</p>
							<p>
								LumiGuard is a state-of-the-art platform
								designed to deliver real-time monitoring and
								management for industrial tower lights and line
								status indicators. Leveraging modern web and IoT
								technologies, it provides a seamless and
								intuitive experience for tracking, analyzing,
								and responding to machine and production line
								signals in connected systems.
							</p>
							<p>
								<strong>Developed by:</strong> Gilang Fauzi
							</p>
							<p>
								<strong>Contact:</strong>{" "}
								<a
									href="mailto:gilang.fauzi@smt.co.id"
									className="text-primary hover:underline">
									gilang.fauzi@smt.co.id
								</a>
							</p>
							<p className="text-sm text-muted-foreground">
								© {new Date().getFullYear()} LumiGuard. All
								rights reserved.
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
