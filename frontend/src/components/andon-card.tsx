import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, MapPin, Clock, Zap, Loader2 } from "lucide-react";
import { useAndonSocket } from "./andon-socket";

interface Device {
	device_name: string;
	mac_address: string;
	location: string;
	status: string;
}

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/devices`;

export function AndonCard() {
	const { deviceStatus } = useAndonSocket();
	const [devices, setDevices] = useState<Device[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchDevices();
	}, []);

	const fetchDevices = async () => {
		try {
			const response = await fetch(API_URL);
			const result = await response.json();

			if (result.data) {
				const activeDevices = result.data.filter(
					(device: Device) => device.status === "Active"
				);
				setDevices(activeDevices);
			}
		} catch (error) {
			console.error("[Error] Fetching devices:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatTimestamp = (timestamp: string) => {
		const date = new Date(timestamp);
		const h = date.getHours().toString().padStart(2, "0");
		const m = date.getMinutes().toString().padStart(2, "0");
		const s = date.getSeconds().toString().padStart(2, "0");
		return `${h}:${m}:${s}`;
	};

	if (loading) {
		return (
			<div className="flex justify-center py-80">
				<Badge
					variant="outline"
					className="text-base border-yellow-300 text-yellow-500 dark:border-yellow-900 dark:text-yellow-400">
					<Loader2 className="animate-spin w-4 h-4 me-1.5" />
					Loading data...
				</Badge>
			</div>
		);
	}

	return (
		<div className="w-full space-y-6">
			{devices.length === 0 ? (
				<div className="flex justify-center py-80">
					<Badge
						variant="outline"
						className="text-base border-red-300 text-red-500 dark:border-red-900 dark:text-red-400">
						<Radio className="w-4 h-4 me-1.5" />
						No active devices
					</Badge>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
					{devices.map((device) => {
						const status = deviceStatus[device.mac_address];
						const isActive = status !== undefined;
						const isRed = isActive && status.red === 1;
						const isAmber = isActive && status.amber === 1;
						const isGreen = isActive && status.green === 1;

						return (
							<Card
								key={device.mac_address}
								className={`group relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/20 border-1 transition-all duration-500 hover:scale-[1.02] ${
									isRed
										? "border-red-500/60 shadow-[0_0_50px_rgba(239,68,68,0.4)] hover:shadow-[0_0_80px_rgba(239,68,68,0.6)]"
										: isAmber
										? "border-amber-500/60 shadow-[0_0_50px_rgba(245,158,11,0.4)] hover:shadow-[0_0_80px_rgba(245,158,11,0.6)]"
										: isGreen
										? "border-green-500/60 shadow-[0_0_50px_rgba(34,197,94,0.3)] hover:shadow-[0_0_80px_rgba(34,197,94,0.5)]"
										: "border-border hover:shadow-2xl"
								}`}>
								<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
								<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-primary/5 to-transparent rounded-tr-full opacity-30" />

								{isRed && (
									<>
										<div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent animate-pulse" />
										<div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/30 rounded-full blur-3xl animate-pulse" />
										<div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
									</>
								)}
								{isAmber && (
									<>
										<div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent animate-pulse" />
										<div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/30 rounded-full blur-3xl animate-pulse" />
										<div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl animate-pulse" />
									</>
								)}
								{isGreen && (
									<>
										<div className="absolute -top-24 -right-24 w-48 h-48 bg-green-500/20 rounded-full blur-3xl" />
										<div className="absolute -bottom-24 -left-24 w-48 h-48 bg-green-500/15 rounded-full blur-3xl" />
									</>
								)}

								<CardContent className="relative px-6 space-y-5">
									<div className="flex items-start justify-between">
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<div
													className={`w-4 h-2 rounded-sm animate-pulse ${
														isRed
															? "bg-red-500"
															: isAmber
															? "bg-amber-500"
															: isGreen
															? "bg-green-500"
															: "bg-muted-foreground"
													}`}
												/>
												<h3 className="font-bold text-xl">
													{device.device_name}
												</h3>
											</div>
											<div className="flex items-center gap-2 text-sm text-muted-foreground">
												<MapPin className="w-4 h-4" />
												<span>{device.location}</span>
											</div>
										</div>

										{isActive && (
											<Badge className="relative overflow-hidden bg-transparent text-white-500">
												<Zap className="w-4 h-4 mr-1" />
												<span className="text-sm">
													LIVE
												</span>
											</Badge>
										)}
									</div>
									<div className="flex justify-between items-center space-x-3">
										<div className="flex-1 flex flex-col items-center">
											<div className="relative">
												<div
													className={`w-14 h-14 rounded-md transition-all duration-300 ${
														isRed
															? "bg-gradient-to-br from-red-400 to-red-600 shadow-[0_0_30px_rgba(239,68,68,1)] animate-pulse"
															: "bg-gradient-to-br from-red-950/50 to-red-900/30 shadow-inner"
													}`}>
													{isRed && (
														<>
															<div className="absolute inset-0 rounded-full bg-red-500 blur-2xl animate-pulse opacity-60" />
															<div className="absolute inset-2 rounded-full bg-red-300 blur-sm" />
														</>
													)}
												</div>
											</div>
											<span
												className={`mt-2 text-xs font-bold tracking-wider ${
													isRed
														? "text-red-500"
														: "text-muted"
												}`}>
												ERROR
											</span>
										</div>
										<div className="flex-1 flex flex-col items-center">
											<div className="relative">
												<div
													className={`w-14 h-14 rounded-md transition-all duration-300 ${
														isAmber
															? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_30px_rgba(245,158,11,1)] animate-pulse"
															: "bg-gradient-to-br from-amber-950/50 to-amber-900/30 shadow-inner"
													}`}>
													{isAmber && (
														<>
															<div className="absolute inset-0 rounded-full bg-amber-500 blur-2xl animate-pulse opacity-60" />
															<div className="absolute inset-2 rounded-full bg-amber-300 blur-sm" />
														</>
													)}
												</div>
											</div>
											<span
												className={`mt-2 text-xs font-bold tracking-wider ${
													isAmber
														? "text-amber-500"
														: "text-muted"
												}`}>
												IDLE
											</span>
										</div>
										<div className="flex-1 flex flex-col items-center">
											<div className="relative">
												<div
													className={`w-14 h-14 rounded-md transition-all duration-300 ${
														isGreen
															? "bg-gradient-to-br from-green-400 to-green-600 shadow-[0_0_30px_rgba(34,197,94,1)]"
															: "bg-gradient-to-br from-green-950/50 to-green-900/30 shadow-inner"
													}`}>
													{isGreen && (
														<>
															<div className="absolute inset-0 rounded-full bg-green-500 blur-2xl opacity-50" />
															<div className="absolute inset-2 rounded-full bg-green-300 blur-sm" />
														</>
													)}
												</div>
											</div>
											<span
												className={`mt-2 text-xs font-bold tracking-wider ${
													isGreen
														? "text-green-500"
														: "text-muted"
												}`}>
												RUN
											</span>
										</div>
									</div>
									<div className="space-y-2">
										<div className="flex items-center justify-between px-4 py-1.5 rounded-lg bg-muted/50 text-sm">
											{/* Kiri: Icon + MAC address */}
											<div className="flex items-center gap-2 text-muted-foreground">
												<Radio className="w-3.5 h-3.5" />
												<span className="font-mono">
													{device.mac_address}
												</span>
											</div>

											{/* Kanan: Status */}
											{isActive ? (
												<div className="flex items-center gap-2 text-muted-foreground">
													<Clock className="w-3.5 h-3.5" />
													<span className="font-mono">
														{formatTimestamp(
															status.timestamp
														)}
													</span>
												</div>
											) : (
												<div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
													<div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
													<span>
														Device Not Active
													</span>
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);
}
