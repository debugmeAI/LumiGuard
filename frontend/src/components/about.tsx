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
			<DialogContent className="max-w-lg p-6 rounded-lg">
				<DialogHeader>
					<DialogTitle className="font-semibold flex items-center gap-2">
						<IconAlignBoxRightStretch className="!size-5" />
						<span className="text-md font-bold">LumiGuard</span>
						<span className="text-xs text-muted-foreground">
							/ˈluː.mi.ɡɑːrd/
						</span>
					</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground mt-6">
						<div>
							<p>
								Real-time monitoring and management platform for
								industrial tower lights and OEE performance
								calculation.
							</p>
						</div>
						<div className="mt-6 space-y-1">
							<p>
								<strong>Built with care by</strong> Gilang Fauzi
							</p>
							<p>
								<strong>Reach out at</strong>{" "}
								<a
									href="mailto:gilang.fauzi@smt.co.id"
									className="text-primary hover:underline">
									gilang.fauzi@smt.co.id
								</a>
							</p>
						</div>
					</DialogDescription>
				</DialogHeader>
				<footer className="mt-4 text-sm text-muted-foreground">
					© {new Date().getFullYear()} PT. SMT Indonesia | All rights
					reserved
					<p>
						<strong>Version </strong> 1.0.0
					</p>
				</footer>
			</DialogContent>
		</Dialog>
	);
}
