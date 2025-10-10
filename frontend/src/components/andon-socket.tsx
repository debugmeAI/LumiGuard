import { useEffect, useState } from "react";
import io from "socket.io-client";
import { SOCKET_BASE_URL } from "@/config/api";

interface SensorData {
	insert_timestamp: string;
	mac_address: string;
	red_information: number;
	amber_information: number;
	green_information: number;
	working_shift: string;
}

interface HeartbeatData {
	mac_address: string;
	timestamp: string;
}

interface DeviceStatus {
	[mac_address: string]: {
		red: number;
		amber: number;
		green: number;
		timestamp: string;
		shift: string;
		lastHeartbeat: number;
		isOnline: boolean;
	};
}

const SOCKET_URL = SOCKET_BASE_URL;
const HEARTBEAT_TIMEOUT = 10000;

export const useAndonSocket = () => {
	const [socket, setSocket] = useState<ReturnType<typeof io> | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({});

	useEffect(() => {
		const interval = setInterval(() => {
			const now = Date.now();

			setDeviceStatus((prev) => {
				const updated = { ...prev };
				let hasChanges = false;

				Object.keys(updated).forEach((mac) => {
					const device = updated[mac];

					const timeSinceHeartbeat = now - device.lastHeartbeat;
					const shouldBeOnline =
						timeSinceHeartbeat < HEARTBEAT_TIMEOUT;

					if (device.isOnline !== shouldBeOnline) {
						updated[mac] = {
							...device,
							isOnline: shouldBeOnline,
						};
						hasChanges = true;

						const offlineDuration = Math.floor(
							timeSinceHeartbeat / 1000
						);
						console.log(
							`[DEVICE] ${mac} is now ${
								shouldBeOnline
									? "ONLINE"
									: `OFFLINE (${offlineDuration}s since last heartbeat)`
							}`
						);
					}
				});

				return hasChanges ? updated : prev;
			});
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		const socketInstance = io(SOCKET_URL, {
			transports: ["websocket", "polling"],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionAttempts: 5,
		});

		socketInstance.on("connect", () => {
			console.log("[SOCKET] Connected");
			setIsConnected(true);
		});

		socketInstance.on("disconnect", () => {
			console.log("[SOCKET] Disconnected");
			setIsConnected(false);
		});

		socketInstance.on("sensor_data", (data: SensorData) => {
			const now = Date.now();
			console.log("[SENSOR DATA] ", data.mac_address, {
				red: data.red_information,
				amber: data.amber_information,
				green: data.green_information,
			});

			setDeviceStatus((prev) => {
				const existing = prev[data.mac_address];

				return {
					...prev,
					[data.mac_address]: {
						red: data.red_information,
						amber: data.amber_information,
						green: data.green_information,
						timestamp: data.insert_timestamp,
						shift: data.working_shift,
						lastHeartbeat: existing?.lastHeartbeat || now,
						isOnline: existing?.isOnline ?? true,
					},
				};
			});
		});

		socketInstance.on("heartbeat", (data: HeartbeatData) => {
			const now = Date.now();
			console.log("[HEARTBEAT] ", data.mac_address);

			setDeviceStatus((prev) => {
				const existing = prev[data.mac_address];

				if (!existing) {
					return {
						...prev,
						[data.mac_address]: {
							red: 0,
							amber: 0,
							green: 0,
							timestamp: data.timestamp,
							shift: "",
							lastHeartbeat: now,
							isOnline: true,
						},
					};
				}

				return {
					...prev,
					[data.mac_address]: {
						...existing,
						lastHeartbeat: now,
						isOnline: true,
					},
				};
			});
		});

		socketInstance.on("connect_error", (error: Error) => {
			console.error("[SOCKET] Connection error:", error);
		});

		setSocket(socketInstance);

		return () => {
			socketInstance.disconnect();
		};
	}, []);

	return { socket, isConnected, deviceStatus };
};
